# Campañas de descuento — Guía de uso

## Qué resuelve
Pantalla para aplicar descuentos estratégicos sobre el inventario (especialmente lo que no rota) sin violar el margen de ganancia. Cada campaña analiza los lotes reales de compra y propone el descuento máximo posible por producto.

## Menú
`Dashboard → Campañas` (requiere permiso `campanias`).

---

## Flujo de una campaña

Una campaña pasa por 5 estados. En cada uno hay UNA acción disponible:

| Estado | Qué significa | Acción disponible |
|---|---|---|
| **BORRADOR** | Creada, sin análisis | **Generar análisis** |
| **CALCULADA** | Sistema propuso descuentos máximos | **Ajustar** (opcional) y **Aprobar** |
| **APROBADA** | Validada, pendiente de publicar | **Publicar en catálogo** |
| **PUBLICADA** | Ofertas activas y visibles al cliente | **Cancelar** (desactiva ofertas) |
| **CANCELADA** | Estado final, no reversible | — |

---

## Paso 1: crear la campaña (modal, 2 pasos)

### Paso 1 — Datos básicos
- **Nombre**: obligatorio (ej. "Liquidación abril").
- **Descripción**: opcional.
- **Vigencia**: `fecha_inicio` y `fecha_fin`. Determina cuánto tiempo las ofertas estarán activas al publicar.
- **Margen mínimo (%)**: piso de rentabilidad. Ningún descuento bajará el margen por debajo de este valor. Default 15%.

### Paso 2 — Alcance (**clave del módulo**)
Decide sobre qué productos se aplicará la campaña:

| Modo | Cuándo usarlo | Parámetros |
|---|---|---|
| **Todo el inventario** | Descuento general | — |
| **Sin rotación** | Liquidar dormidos | Días sin venta (default 60) |
| **Sobrestock** | Reducir capital congelado | Cobertura mínima (días), ventana de ventas |
| **Por categoría** | Una línea de productos | Lista de categorías |
| **Por proveedor** | Negociación con proveedor | Lista de proveedores |
| **Selección manual** | Casos puntuales | Buscador + selección producto a producto |

El alcance se guarda en `criterio_seleccion` (jsonb). **Solo se puede cambiar en estado BORRADOR**.

---

## Paso 2: generar análisis

Al pulsar **Generar análisis** la RPC hace:

1. Filtra productos según el alcance.
2. Para cada **lote con stock** (no por producto: por lote, cada uno tiene su propio costo de compra), calcula:
   - `precio_minimo_permitido = precio_compra / (1 - margen_minimo/100)`
   - `porcentaje_maximo_permitido = (precio_venta_actual - precio_minimo) / precio_venta_actual × 100`
3. Marca el detalle como:
   - **Activo** si está en el alcance y tiene margen disponible.
   - **Inactivo** + motivo `Fuera del alcance de la campaña` o `Sin margen disponible`.
4. Pasa la campaña a **CALCULADA**.

Puedes **regenerar el análisis** mientras la campaña siga en CALCULADA (borra los detalles previos y recalcula).

---

## Paso 3: revisar / ajustar

En estado CALCULADA, cada fila es editable:

- Slider con rango `0 → porcentaje_maximo_permitido`.
- Al soltar el slider o salir del input, autoguarda (RPC `rpc_actualizar_descuento_detalle`).
- La BD **rechaza** cualquier descuento que viole el margen mínimo (doble validación: cliente y servidor).
- Cambios en tiempo real: margen resultante, precio de oferta y ganancia estimada.

Los lotes inelegibles se muestran colapsados al pie con su motivo.

---

## Paso 4: aprobar

**Aprobar campaña** valida que ningún descuento aprobado viole el margen mínimo. Si hay violaciones, rechaza la aprobación con el conteo. Estado → APROBADA.

## Paso 5: publicar

**Publicar en catálogo** vuelca los detalles con descuento > 0 a la tabla `ofertas_virtuales` (catálogo público). Si un producto tiene varios lotes con descuento, se toma el **mayor descuento** (mejor precio para el cliente). Estado → PUBLICADA.

## Cancelar

Disponible en cualquier estado excepto CANCELADA. Si estaba PUBLICADA, desactiva todas las ofertas en el catálogo (`activo=false`, `desactivado_at=now()`). Estado → CANCELADA (irreversible).

---

## Qué debes tener presente

### 🔒 Seguridad multi-company
- Todas las tablas tienen `company_id` obligatorio.
- RLS habilitado: cada fila solo es visible para usuarios de la empresa dueña.
- Las RPCs validan pertenencia vía `user_companies` antes de cualquier escritura.
- `rpc_crear_campania` recibe `p_company_id` explícito del frontend (la empresa activa del contexto).

### 💰 El margen mínimo es sagrado
- Se define **al crear** la campaña y no se puede cambiar después.
- La BD rechaza cualquier intento de guardar un descuento que lo viole.
- Si quieres un margen distinto, crea otra campaña.

### 📦 Análisis por lote, no por producto
- Un producto con 3 lotes tendrá 3 filas en el análisis, cada una con su propio costo de compra y su propio descuento máximo.
- Al publicar, se agrupa por producto y se elige el mayor descuento de sus lotes.

### 🕓 Zona horaria
- BD en UTC, Colombia en UTC-5 (sin DST).
- Las ventas y fechas de compra se guardan en UTC; las comparaciones "últimos N días" funcionan correctas.
- Las fechas de vigencia son tipo `DATE` (sin hora) y se formatean localmente en el cliente.

### 🧮 Reejecutar análisis
- Ejecutar **Generar análisis** de nuevo (en BORRADOR o CALCULADA) borra y recalcula. Útil si cambió el stock/compras entre análisis y aprobación.
- No disponible una vez APROBADA. Para rehacer: cancelar y crear otra.

### 🛒 Relación con ventas
- El módulo NO aplica descuentos automáticamente en el POS; solo gestiona el catálogo de ofertas.
- La integración con POS (que tome `ofertas_virtuales.precio_oferta` en lugar de `products.sale_price`) es un paso posterior y aún no está hecho.

### 🔗 Conexión con Reporte de Reposición (pendiente)
- La tab "Reposición" del dashboard ya calcula productos dormidos, sobrestock y clase ABC.
- Pendiente conectarla para que desde ahí se cree una campaña con los productos detectados ya preseleccionados.

---

## Archivos clave

### Backend (SQL — `scripts/`)
| Archivo | Propósito |
|---|---|
| `campanias_schema.sql` | Modelo completo: tablas, índices, RLS, triggers, 7 RPCs. Idempotente. |
| `campanias_migracion_columnas.sql` | Añade columnas faltantes si las tablas ya existían con esquema antiguo. |
| `campanias_fix_creado_por.sql` | Consolida `creado_por` (legacy) en `created_by`. |

### Frontend
| Archivo | Rol |
|---|---|
| `app/dashboard/campanias/page.tsx` | Lista + KPIs + pipeline + botón "Nueva" |
| `app/dashboard/campanias/[id]/page.tsx` | Detalle: stepper, chip de alcance, KPIs, tabla |
| `components/campania-dialog.tsx` | Wizard crear (datos → alcance) |
| `components/campanias-table.tsx` | Tabla de campañas con acción rápida |
| `components/campania-detalle-tabla.tsx` | Tabla editable de lotes + toolbar de transiciones |

### RPCs disponibles
| RPC | Estado permitido | Uso |
|---|---|---|
| `rpc_crear_campania` | — | Inserta en BORRADOR |
| `rpc_set_criterio_alcance` | BORRADOR | Define alcance |
| `rpc_generar_analisis_campania` | BORRADOR / CALCULADA | Calcula descuentos |
| `rpc_actualizar_descuento_detalle` | CALCULADA | Ajusta un lote |
| `rpc_aprobar_campania` | CALCULADA | → APROBADA |
| `rpc_publicar_campania` | APROBADA | → PUBLICADA + ofertas |
| `rpc_cancelar_campania` | Cualquiera ≠ CANCELADA | → CANCELADA |

---

## Errores frecuentes y qué hacer

| Error | Causa | Solución |
|---|---|---|
| `column "created_by" does not exist` | Tabla vieja sin columnas nuevas | Ejecutar `campanias_migracion_columnas.sql` |
| `null value in column "creado_por"` | Columna legacy con NOT NULL | Ejecutar `campanias_fix_creado_por.sql` |
| `El descuento excede el máximo permitido` | Slider forzado más allá del límite | Normal, ajustar al máximo mostrado |
| `Margen resultante por debajo del mínimo` | Intento de guardar descuento inválido | Ajustar el descuento hacia abajo |
| `El alcance solo puede modificarse en BORRADOR` | Intento de cambiar criterio post-análisis | Crear nueva campaña o cancelar y empezar |

---

## Convenciones futuras (a respetar al extender)
1. Toda query nueva debe filtrar por `company_id` o usar una RPC que valide pertenencia.
2. Toda nueva columna de fecha timestamp: `timestamptz` (UTC). Las fechas lógicas sin hora: `date`.
3. Mantener la semántica de estados: las transiciones se hacen **solo** vía RPC, nunca con UPDATE directo desde el cliente.
4. Si agregas un nuevo modo de alcance: extender el `CHECK` de `criterio_seleccion`, la RPC `rpc_generar_analisis_campania` y el selector del dialog.
