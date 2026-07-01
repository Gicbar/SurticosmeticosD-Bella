# Plan — Tab "Reposición" en Reportes (modelo analítico)

Documento técnico para la funcionalidad de reposición inteligente dentro de `/dashboard/reports`.

## Objetivo

Responder con análisis, no con aritmética plana:

> ¿Qué productos reponer, en qué cantidad y en qué orden de prioridad, considerando su importancia financiera, la estabilidad de su demanda, su tendencia y el riesgo de agotarse?

Y además: ¿qué productos **no** comprar o liquidar?

## Principios

1. **Confiar en las ventas y en el inventario actual.** `products.min_stock` se ignora — no refleja la realidad del movimiento.
2. **Analítico por capas**: ABC/XYZ → pronóstico → stock de seguridad → priorización por margen.
3. **Intuitivo para el usuario**: los tecnicismos (CV, Z, SS, ROP) se traducen a etiquetas legibles.
4. **Multi-tenant**: toda query con `.eq("company_id", companyId)`.

## Parámetros (defaults)

| Parámetro | Valor | Notas |
|---|---|---|
| Lead time proveedor | 5 días hábiles | Plano para todos los proveedores |
| Horizonte de cobertura A / B / C | 30 / 45 / 60 días | Clase A se revisa más seguido |
| Nivel de servicio A / B / C | 98% / 95% / 90% | Z = 2.05 / 1.65 / 1.28 |
| Umbral sobrestock | cobertura > 90 días o sin venta 60 días | Marcar como "capital dormido" |
| Mínimo histórico para análisis completo | 30 días | 14–30d = pronóstico simple; <14d = regla plana |
| Criterio "clave" (ABC) | Pareto acumulado por **margen** | A=80%, B=15%, C=5% |
| Criterio "patrón" (XYZ) | CV de demanda semanal | X<0.5, Y 0.5–1, Z>1 |
| Export | Excel (.xlsx) con 2 hojas | Accionable + Análisis |

## Capas del modelo

### Capa 1 — Clasificación ABC / XYZ

- **ABC por margen acumulado**: se ordenan los productos por margen total generado en el período, se calcula acumulado, se asigna:
  - A = hasta 80% del margen acumulado → **"⭐ Clave"**
  - B = 80–95% → **"◼ Normal"**
  - C = 95–100% → **"· Marginal"**
- **XYZ por coeficiente de variación** de ventas semanales (`σ / μ`):
  - X = CV < 0.5 → **"📈 Estable"**
  - Y = 0.5 ≤ CV < 1 → **"📊 Variable"**
  - Z = CV ≥ 1 → **"⚡ Errático"**

Matriz 3×3 resultante guía cobertura, nivel de servicio y mensajes.

### Capa 2 — Pronóstico de demanda

- `demanda_diaria_base` = media móvil ponderada de últimas 4 semanas, pesos 4/3/2/1 (semana más reciente pesa más).
- **Tendencia**: regresión lineal simple sobre ventas semanales → `slope`.
  - `slope > +10%` → **"↗ Subiendo"**
  - `−10% ≤ slope ≤ +10%` → **"→ Estable"**
  - `slope < −10%` → **"↘ Bajando"**
- `demanda_ajustada = demanda_diaria_base × (1 + slope_limitado a ±30%)`.
- Para productos con <14 días de historia: `demanda = uds_vendidas / días_con_ventas`, sin ajustes.

### Capa 3 — Stock de seguridad

- `σ_diaria` = desviación estándar de ventas diarias del período.
- `SS = Z × σ_diaria × √leadTime`, con Z según clase ABC.
- Productos C con demanda muy baja: `SS = max(SS, 0)` (no se fuerza mínimo).

### Capa 4 — Punto de reorden y sugerencia

- `ROP = demanda_ajustada × leadTime + SS`.
- `cobertura_objetivo = {A:30, B:45, C:60}` días.
- `sugerencia = max(0, ceil(demanda_ajustada × (leadTime + cobertura_objetivo) + SS − stockActual))`.
- `stockActual = Σ purchase_batches.remaining_quantity` por producto.

### Capa 5 — Priorización por impacto financiero

- `margen_unitario = avg_sale_price − ultimo_costo`.
- `margen_en_riesgo_diario = margen_unitario × demanda_ajustada`.
- El ranking de "Comprar YA" se ordena por **margen en riesgo × días proyectados de agotado**, no por unidades.

### Capa 6 — Ventas perdidas estimadas

- Para cada producto con stock=0 en algún tramo del período:
  - `días_sin_stock` = días del período en que `remaining_quantity = 0` para todos sus batches.
  - `ventas_perdidas_uds = días_sin_stock × velocidad_promedio_cuando_había`.
  - `dinero_perdido = ventas_perdidas_uds × margen_unitario`.
- KPI agregado: "Dejaste de ganar ~$X este período por agotados".

### Capa 7 — Sobrestock / capital dormido

- Producto en sobrestock si:
  - `diasRestantes > 90`, o
  - Sin venta en los últimos 60 días y `stockActual > 0`.
- `capital_dormido = Σ (stockActual × ultimo_costo)` para ese grupo.
- Se lista en bloque separado "No comprar / Considerar liquidar".

## Estados visibles (semáforo)

| Estado | Condición | Color | Mensaje |
|---|---|---|---|
| 🚨 AGOTADO | `stockActual = 0` y hubo venta | rojo | "Se acabó. Perdiendo ventas." |
| ⚠ CRÍTICO | `diasRestantes ≤ leadTime + 2` | rojo claro | "Llegará con retraso." |
| 🟠 BAJO | `diasRestantes ≤ cobertura_objetivo / 2` | naranja | "Pedir pronto." |
| 🟢 OK | resto | verde | — |
| 💤 DORMIDO | cobertura > 90d o sin venta 60d | gris | "No reponer." |

## Estructura de UI

Nueva tab `reposicion` en `TABS` de `ReportsDashboard.tsx`, organizada en **3 secciones**:

### 1. Acción inmediata (arriba, siempre visible)
- 3 KPIs grandes:
  - **Productos agotados**: # en estado AGOTADO
  - **En riesgo esta semana**: # en estado CRÍTICO
  - **Dinero en riesgo**: margen estimado que se pierde si no se repone
- Tabla compacta "🚨 Comprar YA" ordenada por margen en riesgo desc:
  - Columnas: Producto · Clase (⭐/◼/·) · Patrón (📈/📊/⚡) · Tendencia (↗/→/↘) · Stock · Vendido/período · Sugerido · Costo est. · Proveedor
  - Fila expandible con "¿Por qué esta cantidad?" que muestra la fórmula en palabras.

### 2. Orden de compra sugerida
- Agrupada por **proveedor**, subtotal por proveedor, total global.
- Botón "📥 Descargar Excel" (2 hojas: `Orden` limpia y `Análisis` con columnas técnicas).

### 3. Diagnóstico de portafolio
- **Matriz ABC×XYZ** (9 celdas) con conteo de SKUs y % del margen en cada una.
- **Top sobrestock** (capital dormido): productos a liquidar y monto total inmovilizado.
- **Top ventas perdidas**: productos que más dinero dejaron de generar por agotarse.
- Gráfica de barras: distribución de días de cobertura del portafolio (histograma: 0–7, 8–15, 16–30, 31–60, 61–90, >90).

## Traducciones a lenguaje llano

La UI **no muestra** los símbolos técnicos en la tabla principal. En su lugar:

| Técnico | Etiqueta visible |
|---|---|
| Clase A | ⭐ Clave |
| Clase B | ◼ Normal |
| Clase C | · Marginal |
| XYZ = X | 📈 Estable |
| XYZ = Y | 📊 Variable |
| XYZ = Z | ⚡ Errático |
| Slope > +10% | ↗ Subiendo |
| Slope ±10% | → Estable |
| Slope < −10% | ↘ Bajando |
| `sugerencia` | "Comprar N uds" |
| `días_cobertura` | "Te dura X días" |
| `SS` | (no visible — absorbido en Sugerido) |
| `ROP` | (no visible — absorbido en estado) |

Cada producto en "Comprar YA" tiene un renglón de explicación:
> "Vendes ~12/día, tienes 8 en stock → se acaba en ~1 día. El proveedor tarda 5 días, quieres 30 días de cobertura. Compra **~410 uds** (cubre demora + mes completo + margen de seguridad)."

## Cambios a archivos

- **`app/dashboard/reports/page.tsx`** — loader:
  - `purchase_batches`: añadir `suppliers(id, name)` y `purchase_price`, `remaining_quantity`, `created_at`.
  - `products`: añadir `supplier_id`, `category_id` (si existe).
  - `sales` / `sale_items`: incluir `created_at` y `quantity` del período (ya existe, validar).
  - Filtrar ventas anuladas si existe `sales.status` en (`cancelled`, `voided`).
- **`components/ReportsDashboard.tsx`** — añadir:
  - Cálculos ABC/XYZ, pronóstico, SS, sugerencia, sobrestock, ventas perdidas.
  - UI de las 3 secciones.
  - Función `exportReposicionExcel()` con SheetJS.
- **`package.json`** — agregar `xlsx` si no existe.
- **`scripts/REPOSICION_GUIA_USO.md`** — guía de uso para el dueño (ya creada).
- (Opcional) Alerta en tab "Decisiones": "Tienes X productos agotados que venden, perdiendo ~$Y/día".

## Supuestos

- Si falta `supplier_id`, agrupar bajo "Sin proveedor".
- Si falta costo previo, marcar "Costo por definir" y excluir de totales $.
- `days` de la cabecera aplica al período de análisis; si es <30 días se advierte: "Análisis con poca historia; resultados menos confiables".
- Lead time 5d es plano; si en futuro se añade `suppliers.lead_time_days`, se respeta por proveedor.
- Si no hay fechas confiables en batches para reconstruir "días sin stock", `ventas_perdidas` se marca como estimación.

## Multi-tenant

Todas las queries nuevas llevan `.eq("company_id", companyId)` — sin excepción.
