# Contexto técnico y funcional del sistema (GibraSoft)

> **Qué es este documento**: la fotografía completa del sistema a hoy —
> técnica, funcional y de alcance — para que cualquiera (tú en una sesión
> futura, otro desarrollador, o yo mismo retomando el proyecto) tenga
> contexto total sin tener que reconstruirlo leyendo cada script uno por uno.
> A diferencia de [`PLAN_DROGUERIA.md`](PLAN_DROGUERIA.md) (bitácora
> cronológica de decisiones, "qué se hizo y por qué"), este documento es un
> **snapshot del estado actual** — se debe mantener actualizado, no es un
> historial.
>
> Última actualización: 2026-07-24. Verificado contra el sistema real en
> producción (no solo contra el código) en esa fecha.

---

## 1. Resumen ejecutivo

**Qué es**: un ERP/POS multi-empresa (multi-tenant) para negocios pequeños y
medianos. Nació como sistema de gestión para una tienda de cosméticos
("SurticosmeticosD-Bella") pero **nunca estuvo realmente acoplado a ese
rubro** — es genérico por diseño. Se generalizó explícitamente para servir
**cualquier negocio** que necesite gestionar inventario, ventas y
rentabilidad: tienda de barrio, droguería/farmacia, panadería, cosméticos,
etc. El nombre comercial del producto es **GibraSoft** .

**Para quién**: pequeños comercios que hoy llevan sus cuentas en cuadernos,
Excel o WhatsApp, y quieren un sistema único para vender, controlar
inventario y saber si están ganando o perdiendo dinero de verdad.

**Estado real**: en producción, con **2-3 empresas activas reales** (no es
un prototipo). Cualquier cambio al sistema debe asumir que hay datos y
usuarios reales que no se pueden romper.

**Diferenciador estructural**: el mismo despliegue sirve a todas las
empresas (multi-tenant por `company_id` + resolución por dominio/subdominio),
con tema visual (colores) y campos de dominio propios por empresa según su
`tipo_negocio` — no son instalaciones separadas ni forks.

---

## 2. Especificaciones técnicas

### 2.1 Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js `^16.0.7`, **App Router** (no Pages Router) |
| Lenguaje | TypeScript, 100% del código |
| UI | React `19.2.0`, Tailwind CSS v4, shadcn/ui + Radix UI (primitivos en `components/ui`) |
| Backend / DB | Supabase (Postgres + Auth + Storage + Realtime no usado) |
| Formularios | `react-hook-form` + `zod` están instalados pero **no se usan en la práctica** — los formularios reales usan `useState` manual campo por campo. No introducir RHF/zod en código nuevo, rompería la consistencia. |
| Estilo | CSS-in-JS por componente (template strings inyectados con `<style dangerouslySetInnerHTML>`), clases prefijadas por componente (`.pf-`, `.pb-`, `.csf-`, `.tc-`, etc.). Sin design system compartido. |
| Otros | `recharts` (gráficos), `sweetalert2` (alertas, envuelto en `lib/sweetalert.ts`), `xlsx` (solo exportar, no importar), `date-fns` |
| Hosting | Vercel (implícito por `@vercel/analytics` en dependencias) |

### 2.2 Arquitectura multi-tenant

- **`companies`** es la tabla raíz de todo el sistema. Cada fila de negocio
  (productos, ventas, clientes, etc.) tiene `company_id`.
- **Resolución de empresa**: por dominio/subdominio HTTP
  (`lib/supabase/company-resolver.ts`) para el catálogo público sin login;
  por `user_companies` (pivote usuario↔empresa con rol) para el dashboard
  autenticado.
- **Theming por empresa**: `companies.theme` (jsonb) define variables CSS
  (`--primary`, `--secondary`, `--accent`, `--radius`, `--darkPrimary`) en
  formato oklch — el mismo código, colores distintos por cliente
  (`lib/theme.ts`).
- **`companies.tipo_negocio`**: `general | cosmeticos | drogueria |
  comida_rapida`. Controla qué secciones de dominio se muestran (ej. campos
  regulatorios de droguería en el formulario de producto). Default
  `'general'` — agregar un valor nuevo no rompe nada existente.

### 2.3 Patrón de página del dashboard

Cada ruta `/dashboard/<módulo>/page.tsx` sigue el mismo patrón:

1. Es un **Server Component** async.
2. Llama a `getUserPermissions()` (`lib/auth.ts`) → si no tiene el permiso
   de esa pantalla, `redirect("/dashboard")`.
3. Resuelve `company_id` desde el mismo `getUserPermissions()`.
4. Hace el query a Supabase filtrando por `company_id` (o confía en RLS,
   según el módulo).
5. Renderiza un **Client Component** en `components/` que recibe los datos
   ya cargados o hace sus propios queries desde el navegador con
   `lib/supabase/client.ts`.

El menú del sidebar (`components/dashboard-sidebar.tsx`) **duplica** la
lista de rutas/íconos de `lib/permissions.ts` — agregar un módulo nuevo
requiere tocar los dos archivos.

### 2.4 Seguridad

- **Auth**: Supabase Auth (email/password). `middleware.ts` protege todo
  `/dashboard/*`, excluye `/catalog` (público).
- **RLS (Row Level Security)**: habilitado en todas las tablas de negocio.
  Patrón estándar en las tablas nuevas (2026-07-21 en adelante):
  ```sql
  empresa_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid())
  ```
- **RPCs `SECURITY DEFINER`** para toda operación transaccional que mueve
  dinero o inventario real — no confían en RLS solo, validan pertenencia a
  la empresa manualmente adentro de la función. Lista completa en la
  sección 4.6.
- **Permisos por pantalla**: 22 permisos booleanos (`lib/permissions.ts`,
  fuente única), 3 roles con plantilla (`admin`, `gerente`, `vendedor`),
  editables individualmente por usuario desde Configuración.

### 2.5 Integraciones externas (o su ausencia)

| Integración | Estado |
|---|---|
| Facturación electrónica DIAN | ❌ No implementada (ver sección 6) |
| Pasarela de pagos | ❌ Ninguna — el pago se registra manualmente (efectivo/tarjeta/transferencia como etiqueta) |
| WhatsApp | Solo deep-link (`wa.me`/`api.whatsapp.com`), no API oficial — abre WhatsApp con mensaje precargado |
| Impresoras / código de barras físico | Sin integración — el "escáner" es un `<input>` de texto que recibe lo que teclea un lector USB-HID |
| Supabase Storage | Sí — imágenes de producto y logos de empresa |
| Actualización en tiempo real | ❌ No usa Supabase Realtime — todo es `router.refresh()` bajo demanda |

### 2.6 Convención de nombres en la base de datos

- Tablas **anteriores a 2026-07-21** (`products`, `sales`, `clients`,
  `companies`, `user_companies`, etc.): columnas en **inglés**
  (`company_id`, `created_at`). No se renombran — están en producción.
- Tablas **nuevas desde 2026-07-21** (scripts 010+): **todo en español**,
  incluidas las columnas genéricas (`empresa_id`, `producto_id`,
  `creado_en`, `creado_por`, `lote_id`). Decisión explícita del usuario
  para entender el modelo sin traducir mentalmente.
- Toda migración nueva es **aditiva e idempotente**
  (`ADD COLUMN IF NOT EXISTS`, constraints envueltas en
  `DO $$ IF NOT EXISTS (SELECT 1 FROM pg_constraint ...)`), nunca destructiva.

---

## 3. Modelo de datos (por dominio)

> Fuente de verdad real: `scripts/backup.sql` (dump de producción) +
> scripts `008` a `014`. Los `00X_create_*.sql` originales están
> desactualizados, no confiar en ellos.

### 3.1 Empresa y usuarios
| Tabla | Propósito |
|---|---|
| `companies` | Raíz multi-tenant. Nombre, slug, dominio, tema visual, `tipo_negocio`, datos fiscales (NIT, razón social, régimen tributario), datos de establecimiento farmacéutico (director técnico, licencia) |
| `user_companies` | Pivote usuario↔empresa con rol (`admin\|gerente\|vendedor`) |
| `user_permissions` | Permisos booleanos por usuario (jsonb) — ⚠️ no tiene `company_id`, un usuario en 2 empresas comparte permisos entre ambas |

### 3.2 Catálogo
| Tabla | Propósito |
|---|---|
| `products` | Producto. Campos base + campos de droguería (CUM, ATC, principio activo, forma farmacéutica, receta, controlado, cadena de frío, venta fraccionada) + `tipo_tributo_iva` + `comision_porcentaje` |
| `categories` | Categorías de producto |
| `product_kits` / `product_kit_items` | Combos vendibles por código de 6 dígitos en el POS. Doble uso: kits normales Y pedidos del catálogo público (`is_catalog_order`) |

### 3.3 Inventario
| Tabla | Propósito |
|---|---|
| `purchase_batches` | Lotes de compra (FIFO). Incluye `fecha_vencimiento`, `numero_lote_fabricante` |
| `inventory_movements` | Kardex simple (`entrada\|salida\|ajuste`) |

### 3.4 Ventas
| Tabla | Propósito |
|---|---|
| `sales` | Venta. `is_credit`, `venta_uid` (idempotencia), `turno_caja_id` (nullable) |
| `sale_items` | Ítems de venta, ligados al lote FIFO exacto consumido |
| `sales_profit` | Rentabilidad calculada por venta |
| `devoluciones` / `devolucion_items` | Devoluciones y garantías, valida contra lo vendido/ya devuelto |
| `notas_credito` / `notas_debito` | Ajuste contable **interno** — NO es el documento electrónico DIAN |
| `comisiones_devengadas` | Ledger de comisiones — tabla existe, **nada la puebla todavía** (el reporte de comisiones se calcula al vuelo, no de esta tabla) |

### 3.5 Clientes y cartera
| Tabla | Propósito |
|---|---|
| `clients` | Maestro de clientes + `tipo_documento`/`numero_documento` |
| `customer_debts` / `debt_payments` | Cartera de crédito a clientes (inglés, tabla vieja) |

### 3.6 Proveedores y compras
| Tabla | Propósito |
|---|---|
| `suppliers` | Maestro de proveedores + `tipo_documento`/`numero_documento` |
| `deudas_proveedor` / `pagos_deuda_proveedor` | Cuentas por pagar (espejo en español de `customer_debts`) |
| `ordenes_compra` / `orden_compra_items` | Orden de compra formal, antes de recibir mercancía |

### 3.7 Cajas y turnos
| Tabla | Propósito |
|---|---|
| `cajas` | Cajas/terminales físicas. Solo admin/gerente las crean |
| `turnos_caja` | Apertura/cierre de turno con arqueo. **Índice único**: 1 turno abierto por caja Y 1 turno abierto por cajero (garantizado en BD, no solo en UI) |
| `recogidas_efectivo` | Retiros de efectivo durante un turno abierto |
| `deudas_cajero` / `pagos_deuda_cajero` | Si el arqueo da faltante, se crea automáticamente una deuda a cargo del cajero |
| `cierres_mensuales` / `movimientos_caja` | Cierre financiero consolidado del mes (efectivo/banco), independiente del cierre por turno |

### 3.8 Cumplimiento regulatorio (droguería)
| Tabla | Propósito |
|---|---|
| `control_sustancias_dispensacion` | Libro de control de estupefacientes/psicotrópicos (Resolución 1478/2006) — paciente, médico, fórmula |
| `control_cadena_frio` | Bitácora de temperatura para productos refrigerados |

### 3.9 Promociones
| Tabla | Propósito |
|---|---|
| `campanias_descuento` / `campania_descuento_detalle` / `ofertas_virtuales` | Motor de campañas con máquina de estados (`BORRADOR→CALCULADA→APROBADA→PUBLICADA/CANCELADA`), por lote |

### 3.10 Funciones RPC clave (lógica transaccional en BD)
| Función | Qué hace |
|---|---|
| `rpc_registrar_venta` | Venta atómica: descuenta FIFO, crea deuda si es crédito, idempotente por `venta_uid` |
| `rpc_registrar_devolucion` | Devolución atómica, valida cantidades, reintegra stock opcional |
| `rpc_cerrar_turno_caja` | Recalcula saldo esperado **en el servidor** (no confía en el cliente), crea deuda de cajero si hay faltante |
| `rpc_registrar_pago_proveedor` / `rpc_registrar_pago_cajero` | Pagos atómicos con lock `FOR UPDATE` |
| `register_debt_payment` | Abono a deuda de cliente (tabla vieja, mismo patrón) |
| `get_low_stock_products` / `get_products_expiring_soon` | Alertas de solo lectura |
| `rpc_crear_campania`, `rpc_generar_analisis_campania`, etc. | Máquina de estados del motor de campañas |

---

## 4. Especificaciones funcionales (módulos)

| Módulo | Ruta | Quién lo usa | Qué resuelve |
|---|---|---|---|
| Punto de Venta | `/dashboard/pos` | Vendedor+ | Venta con escaneo, carrito, crédito, 3 medios de pago |
| Cajas y Turnos | `/dashboard/turnos-caja` | Vendedor+ | Abrir/cerrar turno, arqueo, recogidas de efectivo |
| Ventas | `/dashboard/sales` | Vendedor+ | Historial, detalle, exportar |
| Devoluciones | `/dashboard/devoluciones` | Según permiso | Devoluciones/garantías + notas crédito/débito internas |
| Reportes | `/dashboard/reports` | Según permiso | Dashboard analítico con gráficos |
| Campañas Descuento | `/dashboard/campanias` | Según permiso | Liquidar inventario sin rotación/sobrestock |
| Pedidos del Catálogo | `/dashboard/pedidos-catalogo` | Según permiso | Pedidos generados desde el catálogo público |
| Productos / Categorías / Inventario / Kits | `/dashboard/products`, etc. | Según permiso | Maestros de catálogo |
| Proveedores / Órdenes de Compra / Cuentas por Pagar | `/dashboard/suppliers`, etc. | Según permiso | Ciclo completo de compras |
| Clientes / Créditos | `/dashboard/clients`, `/dashboard/debts` | Según permiso | Cartera de clientes |
| Gastos | `/dashboard/expenses` | Según permiso | Gastos operativos del negocio |
| Rentabilidad | `/dashboard/profits` | Según permiso | Costo/margen/utilidad real |
| Comisiones | `/dashboard/comisiones` | Según permiso | Reporte por vendedor |
| Cierre de Mes | `/dashboard/cierres` | Según permiso | Consolidado financiero mensual |
| Control Regulatorio | `/dashboard/control-regulatorio` | Según permiso, droguería | Libro de controlados + cadena de frío |
| Cajas (gestión) | `/dashboard/cajas` | Admin/gerente | Alta/baja de cajas físicas |
| Configuración | `/dashboard/settings` | Admin | Empresa, usuarios, permisos, datos fiscales |
| Catálogo público | `/catalog` | Sin login | E-commerce ligero, pedido con código, resuelto por dominio |

**Menú del sidebar** — 7 grupos reorganizados por criterio único (2026-07-21):
Principal (uso diario) · Operación (ciclo de venta) · Catálogo (solo
maestros) · Compras (todo proveedores) · Gestión (clientes/finanzas) ·
Cumplimiento (regulatorio) · Sistema (configuración). Cada grupo es
colapsable, con buscador de menú y colapso-por-defecto salvo el grupo activo.

---

## 5. Alcance actual

### 5.1 Verticales de negocio soportadas
- ✅ **Droguería/Farmacia** — la más desarrollada (campos CUM/INVIMA,
  control de sustancias, cadena de frío, vencimiento por lote). 1 empresa
  real ya configurada así.
- ✅ **Cosméticos** — vertical original, en producción.
- ✅ **General** — cualquier negocio sin necesidades regulatorias
  específicas (tienda de barrio, etc.) — usa el sistema sin las secciones
  de droguería.
- 🔲 **Comida rápida** — analizado (recetas/BOM, variantes, comandas de
  cocina) pero **no construido**, pausado a propósito.

### 5.2 Completo y funcionando (verificado con datos reales)
Ver tabla completa en la sección 4. En resumen: POS, inventario con
vencimiento, catálogo con clasificación regulatoria, clientes/proveedores,
créditos en ambos sentidos, órdenes de compra, devoluciones, comisiones
(reporte), cajas/turnos con arqueo y deuda automática por faltante,
campañas de descuento, cierre de mes, rentabilidad, control regulatorio,
catálogo público, permisos granulares.

### 5.3 Construido pero con lógica de negocio pendiente
- **FEFO**: existe `fecha_vencimiento` por lote, pero `rpc_registrar_venta`
  sigue consumiendo por FIFO puro (fecha de compra), no por vencimiento más
  próximo. Cambiar esto requiere tocar la función transaccional de venta
  con cuidado (dinero real).
- **Campañas "por vencer"**: el motor de descuentos no tiene el criterio
  automático de liquidar por proximidad de vencimiento (sí tiene
  `SIN_ROTACION`, `SOBRESTOCK`, `CATEGORIA`, `PROVEEDOR`, `MANUAL`).
- **Comisiones persistidas**: se calculan al vuelo para el reporte; la
  tabla `comisiones_devengadas` (para un flujo de "marcar como pagada")
  existe pero nada la puebla.
- **Receta / controlado**: son solo informativos — el POS no bloquea la
  venta si el producto requiere fórmula médica.
- **Aprobación de devoluciones**: se crean directamente en estado
  `aprobada`, sin paso de revisión previa.

### 5.4 Explícitamente fuera de alcance (decisión consciente, no pendiente por olvido)
- **Facturación electrónica DIAN** completa (CUFE, XML/UBL, certificado
  digital, RADIAN, nómina electrónica, documento soporte, notas
  crédito/débito *electrónicas*). El modelo de datos ya está listo
  (NIT, tipo de documento, régimen tributario, tipo de tributo IVA) para
  cuando se decida integrar — ver sección 6.
- **Multi-sede/sucursales**: hoy `company_id` = un solo punto de negocio.
- **Datos clínicos de clientes** (alergias, tratamientos crónicos): dato
  sensible bajo Ley 1581 (Habeas Data), no implementado sin definición
  previa de tratamiento/consentimiento.
- **Reporte real a Fondo Nacional de Estupefacientes**: existe el libro de
  control (tabla), pero el reporte formal requiere validación legal antes
  de automatizarlo.

---

## 6. Roadmap sugerido

**Fase 2 (lógica de negocio, no iniciada)**: FEFO en `rpc_registrar_venta`,
criterio `POR_VENCER` en campañas, decisión de negocio sobre bloqueo de
venta de productos con receta/controlados.

**Fase 4 (facturación electrónica DIAN, fuera de alcance hasta pedido
explícito)**: elegir proveedor tecnológico (Alegra, Siigo, Taxxa,
Facturación.co, World Office) o desarrollo propio homologado; certificado
digital; generación de CUFE/XML-UBL; numeración autorizada; notas
crédito/débito electrónicas; documento soporte; RADIAN; nómina electrónica.
Cada uno es un flujo independiente sobre la misma base fiscal ya modelada.

Gap-analysis completo tipo checklist comercial (facturación POS, remisiones,
garantías, etc.) ya se hizo en una sesión anterior — retomar esa
conversación si se necesita el detalle ítem por ítem.

---

## 7. Cómo agregar un módulo nuevo (para no reinventar el patrón)

1. **Tabla(s) nueva(s)**: script SQL aditivo/idempotente, en español, con
   RLS explícita (`empresa_id IN (SELECT company_id FROM user_companies
   WHERE user_id = auth.uid())`) para SELECT/INSERT/UPDATE. Si hay estado
   derivado (saldos, contadores), usar una RPC `SECURITY DEFINER` en vez de
   updates sueltos desde el cliente.
2. **Permiso**: agregar la key en `lib/permissions.ts` (`PermissionKey` +
   entrada en `PERMISSIONS[]` con grupo/ruta/ícono/hint).
3. **Sidebar**: agregar la misma entrada en `components/dashboard-sidebar.tsx`
   (nav array del grupo correspondiente + ícono importado).
4. **Página**: `app/dashboard/<modulo>/page.tsx`, Server Component, gate
   con `getUserPermissions()`, resuelve `company_id`.
5. **Componente**: Client Component en `components/`, sigue el patrón
   CSS-in-JS con prefijo propio, `useState` manual (no RHF/zod).
6. **Verificar**: `node_modules/.bin/tsc --noEmit -p tsconfig.json` desde
   la raíz del repo — debe dar el mismo set de errores preexistentes, cero
   nuevos.

## 8. Advertencias operativas permanentes

- **Hay clientes reales en producción.** Cualquier migración debe ser
  aditiva (nunca `DROP`/`ALTER COLUMN` destructivo), nunca tocar
  `rpc_registrar_venta` sin pruebas exhaustivas (es la función que mueve
  dinero e inventario real de negocios reales).
- Antes de escribir una migración nueva, comparar contra un export
  reciente del esquema real (pedirle al usuario un dump actualizado si el
  último disponible tiene más de unos días).

## 9. Nota de branding

El producto se llama **GibraSoft** desde 2026-07-24 (antes "GBSoft"). El
video promocional ya se rehizo completo sin ningún rastro del nombre/logo
anterior (ver `VideosClaude/lociones-tiktok/src/GibraSoft/`). **Pendiente**:
el sistema real (esta app) todavía muestra "GBSoft" en el título de la
pestaña del navegador y en el logo del sidebar — no se ha actualizado
dentro de la aplicación en sí, solo en el material de video.

## 10. Otros documentos del repo (complementarios, no duplicar contenido)

| Documento | Para qué sirve |
|---|---|
| [`Doc/PLAN_DROGUERIA.md`](PLAN_DROGUERIA.md) | Bitácora cronológica completa de la adaptación a droguería — decisiones, por qué, verificaciones paso a paso |
| [`Doc/PERMISOS.md`](PERMISOS.md) | Detalle del sistema de permisos |
| [`Doc/CAMPANIAS_GUIA.md`](CAMPANIAS_GUIA.md) | Guía del motor de campañas de descuento |
| [`Doc/PEDIDOS_CATALOGO.md`](PEDIDOS_CATALOGO.md) | Guía del catálogo público y pedidos |
| `scripts/008` a `scripts/014` | Migraciones SQL de la adaptación a droguería/sistema completo, en orden de ejecución |
