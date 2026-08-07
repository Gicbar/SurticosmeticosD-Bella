# Plan — Adaptación del sistema a DROGUERÍA

> Documento vivo. Se actualiza al final de cada sesión de trabajo para que el
> avance no se pierda si la sesión termina. Si retomas esto en una sesión
> nueva, empieza leyendo "Estado actual" y "Próximo paso".

## Objetivo

Adaptar `SurticosmeticosD-Bella` (hoy sistema de gestión de cosméticos) para
que sirva también a una **droguería/farmacia**, reutilizando al máximo lo que
ya existe (es un ERP/POS multi-empresa genérico, no está realmente acoplado a
cosméticos — ver análisis previo).

## Alcance confirmado con el usuario (2026-07-21)

- ✅ **Sí**: todo lo funcional/operativo de droguería (inventario con
  vencimiento, clasificación regulatoria, IVA, cartera, cierre de caja,
  promociones, etc.)
- ❌ **Por ahora NO**: integración real de **facturación electrónica DIAN**
  (CUFE, UBL/XML, proveedor tecnológico, certificado digital, RADIAN, nómina
  electrónica, documento soporte, notas crédito/débito electrónicas).
- ⚠️ **Pero**: dejar el modelo de datos y la estructura **listos** para que el
  día que se active facturación electrónica, no haya que rehacer nada — solo
  conectar un proveedor DIAN y activar lógica encima de campos que ya existen
  (NIT, tipo de documento, régimen tributario, tipo de tributo IVA por
  producto).

No se piden cambios de "comida rápida" en este momento — ese análisis ya
existe (recetas/BOM, variantes, comandas de cocina) pero se pausó a favor de
droguería primero.

## Fases

| Fase | Contenido | Estado |
|---|---|---|
| 1 | Modelo de datos (BD) | ✅ Hecho (esta sesión) |
| 2 | Lógica de negocio (FEFO, campañas "por vencer", alertas) | ⬜ Pendiente |
| 3 | Frontend/UI (formularios, tablas, dashboard) | ⬜ Pendiente |
| 4 (futura, fuera de alcance actual) | Facturación electrónica DIAN | ⬜ No iniciada a propósito |

---

## Fase 1 — Modelo de datos ✅ (completada esta sesión)

**Archivo**: [`scripts/008_drogueria_adaptacion.sql`](../scripts/008_drogueria_adaptacion.sql)
(aditivo, idempotente — se puede correr varias veces sin romper nada, sigue el
mismo estilo que `cierre_formas_pago.sql`).

### Qué se revisó antes de escribir la migración
Esquema real tomado de `scripts/backup.sql` (dump de producción, no los
`00X_*.sql` viejos que están desactualizados): tablas `companies` (L3744),
`clients` (L3727), `suppliers` (L4101), `products` (L3899), `purchase_batches`
(L3952), `sales`/`sale_items` (L4032/L4013), función `get_low_stock_products`
(L831) y la función transaccional `rpc_registrar_venta`
(`scripts/venta_transaccional.sql`).

**Verificación adicional (2026-07-21)**: el usuario aportó
`scripts/BD_21072026.sql`, export del esquema real de producción al día de
hoy (⚠️ **hay 2 clientes activos en producción**, cualquier cambio debe ser
100% no disruptivo). Se comparó columna por columna contra las tablas que
toca la migración — son idénticas a lo asumido de `backup.sql`. No hizo falta
ajustar nada del script.

### Por qué es segura para producción con clientes activos
- Solo `ADD COLUMN IF NOT EXISTS` con `DEFAULT`/nullable — ninguna fila
  existente puede romper un NOT NULL nuevo.
- No se toca `rpc_registrar_venta`, el motor de campañas, RLS ni ninguna
  función/trigger que ya esté corriendo en producción.
- Constraints agregadas de forma defensiva (`DO $$ IF NOT EXISTS (SELECT 1
  FROM pg_constraint ...)`), mismo patrón que ya usa
  `scripts/cierre_formas_pago.sql` — re-ejecutable sin error.
- `companies.tipo_negocio` default `'general'`: las 2 empresas actuales
  siguen funcionando igual; nada en el código lee esa columna todavía, así
  que ni el `UPDATE` manual sugerido cambia comportamiento hoy.
- No se tocó RLS (es row-level, no column-level) — las políticas existentes
  siguen aplicando igual sobre las columnas nuevas.

### Qué se agregó

**0. `companies.tipo_negocio`** — enum (`general | cosmeticos | drogueria |
comida_rapida`), default `general`. Permite que el mismo sistema multi-tenant
sirva varias verticales sin bifurcar código; el frontend lo consulta para
mostrar/ocultar campos de dominio.
⚠️ **Pendiente manual**: correr
`UPDATE companies SET tipo_negocio = 'cosmeticos' WHERE slug = '...'` con el
slug real de la empresa de cosméticos actual (no se adivinó en la migración).

**1. Identificación fiscal** (preparación para DIAN futuro, todo nullable):
- `companies`: `nit, nit_dv, razon_social, direccion_fiscal,
  actividad_economica_ciiu, regimen_tributario`
  (`regimen_tributario` check: `responsable_iva | no_responsable_iva`).
- `clients` y `suppliers`: `tipo_documento` (check: `CC, NIT, CE, PAS, TI, RC,
  DE` — códigos DIAN), `numero_documento`, `documento_dv`.

**2. Clasificación regulatoria de producto** (`products`):
`requiere_receta` (bool), `es_controlado` (bool), `principio_activo`,
`concentracion`, `forma_farmaceutica`, `registro_invima`, `unidad_medida`
(default `'unidad'`).

**3. IVA por producto** (`products.tipo_tributo_iva`): check
`excluido | exento | gravado_5 | gravado_19`, default `excluido`. Solo
clasifica — `sale_price` sigue siendo el precio final tal cual se cobra hoy,
no se tocó el flujo de cobro del POS.

**4. Vencimiento por lote** (`purchase_batches`): `fecha_vencimiento` (date,
nullable), `numero_lote_fabricante` (para trazabilidad/recalls INVIMA) +
índice parcial `idx_purchase_batches_vencimiento` (solo lotes con stock y
vencimiento definido, para que las alertas sean rápidas).

**5. Alerta de vencimiento** (función de solo lectura):
`get_products_expiring_soon(p_company_id, p_dias_umbral default 90)` —
mismo patrón que la función existente `get_low_stock_products(p_company_id)`.
No modifica nada, es segura de desplegar ya.

### Qué NO se tocó a propósito en Fase 1 (queda para Fase 2)
- **`rpc_registrar_venta`** sigue consumiendo lotes por `purchase_date ASC`
  (FIFO puro). Para que `fecha_vencimiento` tenga efecto real en las ventas
  hay que cambiar el `ORDER BY` a FEFO (vencimiento más próximo primero,
  `purchase_date` como desempate). Es dinero real transaccional — se hace
  aparte con cuidado, no junto con el cambio de esquema.
- **Motor de campañas** (`campanias_schema.sql`): el check
  `camp_criterio_modo_chk` limita `criterio_seleccion.modo` a `TODOS,
  SIN_ROTACION, SOBRESTOCK, CATEGORIA, PROVEEDOR, MANUAL`. Falta agregar
  `POR_VENCER` para poder liquidar automáticamente lo próximo a vencer
  (reutilizando el motor ya construido).
- **`es_controlado`**: solo quedó la marca en el producto. El reporte real al
  Fondo Nacional de Estupefacientes (si aplica al tipo de droguería) requiere
  validación legal específica antes de construir nada — no se inventó lógica
  de cumplimiento sin esa validación.
- Nada de UI: no hay formularios ni tablas nuevas todavía, ni alertas
  visibles en el dashboard.

---

## Fase 2 — Lógica de negocio (pendiente, próximo paso sugerido)

1. Cambiar `rpc_registrar_venta` (en `scripts/venta_transaccional.sql`) para
   ordenar el consumo de lotes por FEFO: `ORDER BY fecha_vencimiento ASC NULLS
   LAST, purchase_date ASC`. Requiere pruebas cuidadosas (es la función que
   mueve dinero e inventario real).
2. Agregar `POR_VENCER` al criterio de campañas (`campanias_schema.sql`):
   nuevo modo que seleccione lotes con `fecha_vencimiento` dentro de un rango
   configurable, reutilizando `rpc_generar_analisis_campania`.
3. Decidir si `requiere_receta`/`es_controlado` deben **bloquear** la venta en
   el POS (hoy son solo informativos) — pendiente de definición de negocio.

## Fase 3 — Frontend/UI (pendiente, análisis hecho 2026-07-21)

### Patrones actuales confirmados en el código (para replicar, no inventar nuevos)
- Formularios (`product-form.tsx`, `purchase-batch-dialog.tsx`,
  `CompanySettingsForm.tsx`): `useState` manual campo por campo + insert/update
  directo a Supabase desde el cliente. `react-hook-form`/`zod` están en
  `package.json` pero NO se usan en la práctica — no introducirlos ahora
  rompería la consistencia.
- CSS-in-JS por componente (clases prefijadas `.pf-`, `.pb-`, `.csf-`), sin
  design system compartido.
- **El menú del sidebar duplica la fuente de verdad**: `lib/permissions.ts`
  define los permisos, pero `components/dashboard-sidebar.tsx` tiene sus
  propios arrays (`mainNav`, `catalogNav`, `mgmtNav`, etc.) con ruta+ícono+
  label. Un módulo nuevo requiere tocar AMBOS archivos.
- Patrón de módulo completo (ej. Productos): `page.tsx` Server Component
  (valida permiso vía `getUserPermissions()` + resuelve `company_id` + query)
  → `/new` y `/[id]` reusando el mismo Form → Grid/Table cliente para listar.

### Grupo A — Extender pantallas existentes (campos de 008/009)
Bajo riesgo, esfuerzo moderado — son componentes que ya existen:
1. `components/product-form.tsx`: CUM, ATC, receta, controlado, cadena de
   frío, fraccionamiento, IVA, comisión — condicionados a
   `company.tipo_negocio === 'drogueria'` para no ensuciar el formulario de
   la empresa de cosméticos que sigue en producción.
2. `components/purchase-batch-dialog.tsx`: fecha de vencimiento + número de
   lote del fabricante.
3. `components/CompanySettingsForm.tsx`: NIT, razón social, régimen
   tributario, director técnico, licencia de funcionamiento, selector de
   `tipo_negocio`.
4. `components/client-form.tsx` / `supplier-form.tsx`: tipo/número de
   documento.
5. Nueva alerta en `/dashboard` (junto a `LowStockAlert` ya existente):
   `ExpiringSoonAlert` consumiendo `get_products_expiring_soon`.

### Grupo B — Módulos nuevos (14 tablas de 010) — pendiente de priorizar
Cada uno necesita típicamente: entrada en `lib/permissions.ts` + entrada en
`dashboard-sidebar.tsx` + `page.tsx` + tabla/grid + form/diálogo:

| Módulo | Complejidad | Nota |
|---|---|---|
| Devoluciones/garantías | Media-alta | Se dispara desde `sales/[id]`, selecciona ítems a devolver |
| Notas crédito/débito | Baja | Podría ser pestaña dentro de Devoluciones, no módulo aparte |
| Cuentas por pagar a proveedor | Media | Copiar casi literal el patrón de `debts-interface.tsx` (ya existe para clientes) |
| Órdenes de compra | Alta | Líneas de producto (parecido a `kit-builder-form.tsx`) + flujo de "recibir" |
| Comisiones | Baja | Mayormente tabla de solo lectura (la llena una RPC futura) |
| Cajas/turnos/recogidas | Alta | Requiere decisión de UX: ¿abrir turno antes de usar el POS? Toca `pos-interface.tsx`, que está en producción |
| Control de sustancias / cadena de frío | Media | Formularios de registro manual; posible gancho desde el checkout del POS cuando el producto es controlado |

Estimado: **35-45 archivos nuevos/modificados** si se hace todo el Grupo B de
una vez. Varias decisiones (sobre todo turnos de caja) son de UX/producto,
no solo técnicas — pendiente de decidir orden con el usuario antes de
escribir código.

---

## Fase 3 — EJECUTADA (2026-07-21, misma sesión): Grupo A completo + "Cuentas por pagar a proveedor"

El usuario eligió, vía preguntas de priorización: **Grupo A completo** +
**"Cuentas por pagar a proveedor"** del Grupo B (recomendado por ser el de
menor riesgo — no toca el POS en producción).

### Verificado antes de escribir código
Se leyeron los archivos reales (no se asumió nada): `product-form.tsx`,
`purchase-batch-dialog.tsx`, `CompanySettingsForm.tsx`, `client-form.tsx`,
`supplier-form.tsx`, `debts-interface.tsx` (patrón de referencia completo:
stats + tabla expandible + acciones + RPC de pago), `lib/permissions.ts`,
`lib/auth.ts`, `dashboard-sidebar.tsx` (confirma que el menú duplica su propia
lista de nav — hay que tocar ese archivo aparte de `permissions.ts`),
`register_debt_payment` en `cierre_formas_pago.sql` (patrón de RPC atómica a
espejar). Todas las páginas relevantes (`products/[id]/edit`, `clients/*`,
`suppliers/*`) ya usaban `select("*")`, así que los campos nuevos llegan sin
tocar esas queries — excepto `app/dashboard/settings/page.tsx`, que sí
seleccionaba columnas explícitas y se amplió a `select("*")`.

### Archivos nuevos
- `scripts/011_rpc_pago_proveedor.sql` — RPC `rpc_registrar_pago_proveedor`
  (espejo exacto de `register_debt_payment`, con lock `FOR UPDATE` para
  evitar condiciones de carrera). **Necesario para que la pantalla de
  cuentas por pagar funcione de forma segura** — sin esto habría que hacer
  un UPDATE manual del saldo desde el cliente, inseguro con pagos
  concurrentes. Pendiente de ejecutar en Supabase junto con 008/009/010.
- `components/ExpiringSoonAlert.tsx` — alerta de vencimiento (espejo de
  `low-stock-alert.tsx`), consume `get_products_expiring_soon`. Si el RPC no
  existe aún (008 sin ejecutar) retorna `null` en vez de romper el dashboard.
- `components/supplier-debts-interface.tsx` — módulo completo de cuentas por
  pagar (espejo de `debts-interface.tsx`, sin las funciones de WhatsApp que
  no aplican a proveedores).
- `app/dashboard/supplier-debts/page.tsx` — página de listado, gate por
  permiso `cuentas_por_pagar`.

### Archivos modificados
- `lib/permissions.ts` — nuevo permiso `cuentas_por_pagar` (grupo `gestion`).
- `components/dashboard-sidebar.tsx` — nueva entrada de menú + ícono `Wallet`
  + campo en `UserPermissions`.
- `lib/auth.ts` — `getUserPermissions()` ahora también trae
  `companies.tipo_negocio` (antes solo `id, name, slug`) — lo necesitan el
  dashboard y cualquier página que deba comportarse distinto para droguería.
- `app/dashboard/page.tsx` — muestra `ExpiringSoonAlert` solo si
  `company.tipo_negocio === 'drogueria'` y el usuario tiene permiso
  `inventario`.
- `app/dashboard/settings/page.tsx` — `select("*")` en vez de columnas
  explícitas, para traer los campos nuevos de `companies`.
- `components/CompanySettingsForm.tsx` — secciones nuevas: selector de
  `tipo_negocio`, datos fiscales (NIT, razón social, régimen tributario,
  dirección fiscal — preparación DIAN, no la activa), y "Establecimiento
  farmacéutico" (director técnico, licencia) que solo aparece si
  `tipo_negocio === 'drogueria'`.
- `components/product-form.tsx` — trae `company.tipo_negocio` en su `useEffect`
  existente; si es `'drogueria'` muestra sección regulatoria completa (CUM,
  ATC, principio activo, forma farmacéutica, cadena de frío, venta
  fraccionada, etc.). IVA y comisión de vendedor se muestran siempre (no son
  exclusivos de droguería).
- `components/purchase-batch-dialog.tsx` — campos de fecha de vencimiento y
  número de lote del fabricante (siempre visibles, no solo droguería — son
  parte del modelo genérico de lote). Nuevo toggle "Compra a crédito": si se
  activa, exige proveedor y al guardar crea además una fila en
  `deudas_proveedor` (esto es lo que alimenta la pantalla de cuentas por
  pagar — sin este cambio la tabla quedaría siempre vacía).
- `components/client-form.tsx` / `supplier-form.tsx` — selector de tipo de
  documento (CC/NIT/CE/PAS/TI/RC/DE) + número de documento.

### Verificación
`node_modules/.bin/tsc --noEmit -p tsconfig.json` corrido sobre todo el
proyecto: **cero errores nuevos**. Los ~70 errores que arroja el comando ya
existían antes de esta sesión (en `debts-interface.tsx`, `sales/page.tsx`,
`reports/page.tsx`, `queries.ts`, `drawer.tsx` — archivos no tocados). El
propio `next.config.mjs` ya tiene `typescript.ignoreBuildErrors: true`, así
que esos errores preexistentes no bloquean el build de todas formas — no se
tocaron por estar fuera de alcance de esta tarea.

### Qué falta para que esto funcione end-to-end
1. Ejecutar en Supabase, en orden: `008` (ya hecho) → `009` → `010` → `011`.
2. Actualizar manualmente `companies.tipo_negocio` de la empresa real a
   `'drogueria'` (o `'cosmeticos'` para la actual) — sin esto, ninguna
   sección condicional nueva se muestra.
3. Probar en navegador: crear un producto con los campos de droguería,
   registrar una compra a crédito desde Inventario, verificar que aparece en
   "Cuentas por pagar", registrar un pago parcial y uno total.

### Grupo B — pendiente (no priorizado esta sesión)
Devoluciones/garantías, notas crédito/débito, órdenes de compra, comisiones
(UI del ledger — el campo `comision_porcentaje` en producto ya está en el
form), cajas/turnos/recogidas (el de mayor riesgo por tocar `pos-interface.tsx`),
control de sustancias/cadena de frío (formularios de registro manual).

---

## Grupo B — COMPLETADO (2026-07-21, misma sesión, continuación)

El usuario pidió seguir con "lo que falta" del Grupo B. Se construyó todo,
incluyendo cajas/turnos (el usuario, preguntado explícitamente, eligió
**integrar con el POS** en vez de un módulo standalone — ver detalle abajo).

### Devoluciones y garantías + notas crédito/débito
- `scripts/012_rpc_devolucion.sql` — `rpc_registrar_devolucion`: mismo
  estándar de seguridad que `rpc_registrar_venta` (SECURITY DEFINER,
  valida pertenencia a empresa, total autoritativo). Valida que no se
  devuelva más de lo vendido ni más de lo ya devuelto (evita doble
  devolución). Si `reintegra_inventario=true`, regresa stock al lote y
  registra `inventory_movements` tipo `'entrada'`.
- `components/SaleActionsPanel.tsx` — se inserta en
  `app/dashboard/sales/[id]/page.tsx` (gate por permiso `devoluciones`):
  botón "Registrar devolución" (selecciona cantidad por ítem, llama al RPC) y
  botón "Nota crédito/débito" (insert directo a `notas_credito`/`notas_debito`
  — sin RPC porque no hay estado derivado que proteger).
- `components/devoluciones-interface.tsx` + `app/dashboard/devoluciones/page.tsx`
  — listado de devoluciones (expandible, muestra ítems) y de notas internas.

### Órdenes de compra
- `components/ordenes-compra-interface.tsx` + `app/dashboard/purchase-orders/page.tsx`
  — crear orden (proveedor + líneas de producto con cantidad/costo estimado,
  estado inicial `'enviada'`), recibir por ítem (crea `purchase_batches` +
  actualiza `cantidad_recibida` + recalcula `estado` de la orden), cancelar.
  Sin RPC: inserts secuenciales desde el cliente, igual que
  `purchase-batch-dialog.tsx` ya hacía (las compras en este sistema nunca
  fueron transaccionales, solo las ventas).

### Comisiones
- `components/comisiones-interface.tsx` + `app/dashboard/comisiones/page.tsx`
  — reporte de solo lectura: cruza `sale_items` + `products.comision_porcentaje`
  + `sales.created_by` por rango de fechas, agrupado por vendedor (email vía
  `user_permissions_with_email`). **Decisión de diseño**: se calculó
  ad-hoc en vez de poblar `comisiones_devengadas` — evita tocar
  `rpc_registrar_venta` en esta fase. La tabla ledger queda disponible si más
  adelante se quiere un flujo de "marcar comisión como pagada" persistido.

### Control regulatorio (sustancias controladas + cadena de frío)
- `components/control-regulatorio-interface.tsx` + `app/dashboard/control-regulatorio/page.tsx`
  — dos formularios de registro manual + listado: libro de dispensación
  (paciente, médico, fórmula) sobre productos con `es_controlado=true`, y
  bitácora de temperatura. Sin edición/borrado (libro de control regulatorio).

### Cajas / turnos / recogidas — CON integración al POS
El usuario, preguntado explícitamente sobre el trade-off, eligió integrar con
`pos-interface.tsx` en vez de un módulo aislado. Cambios mínimos y aditivos
al archivo transaccional en producción:
- **Nuevo `useEffect`** en `pos-interface.tsx`: al cargar el POS, busca si el
  cajero actual tiene un turno `'abierto'` (solo lectura, no bloquea nada).
- **`handleCheckout`**: se capturó `data` del RPC (`rpc_registrar_venta` ya
  devolvía `sale_id`, antes se descartaba) y, si hay turno activo, se hace un
  **UPDATE best-effort** de `sales.turno_caja_id` **después** de que la venta
  ya quedó confirmada. Si ese UPDATE falla, solo se loguea a consola — la
  venta ya registrada NUNCA se revierte ni se bloquea. **No se tocó la RPC
  `rpc_registrar_venta` en sí ni su firma.**
- **Badge visual** arriba del POS: verde "Turno abierto: X" o ámbar "Sin
  turno — abrir turno" (link a `/dashboard/turnos-caja`). No bloquea vender
  sin turno abierto (compatibilidad total con el comportamiento actual).
- `components/turnos-caja-interface.tsx` + `app/dashboard/turnos-caja/page.tsx`
  — gestión de cajas (alta simple), abrir turno (caja + saldo apertura),
  turno activo con cálculo en vivo de saldo esperado (apertura + ventas en
  efectivo del turno − recogidas), registrar recogidas, cerrar turno con
  arqueo (pide efectivo contado, calcula diferencia), historial de turnos
  cerrados. Permiso `cajas_turnos` agregado también a la plantilla de
  **vendedor** (necesita abrir/cerrar su propio turno en el día a día) —
  único permiso nuevo de esta fase con ese alcance; el resto quedó en
  `gestion`/`catalogo` sin tocar la plantilla de vendedor.

### Nuevos permisos agregados (lib/permissions.ts + dashboard-sidebar.tsx)
`devoluciones`, `ordenes_compra`, `comisiones`, `control_regulatorio`,
`cajas_turnos` — cada uno con su ruta, ícono y entrada de menú.

### Verificación
`tsc --noEmit` corrido después de cada bloque grande de cambios (no solo al
final) — **cero errores nuevos en ningún punto de la sesión**, confirmado por
diff exacto contra el baseline de errores preexistentes (que ya existían
antes de tocar nada, en archivos no relacionados).

### Qué falta para que esto funcione end-to-end
1. Ejecutar en Supabase, en orden, los scripts que faltan:
   `009` → `010` → `011` → `012` (008 ya estaba aplicado).
2. Marcar `companies.tipo_negocio = 'drogueria'` en la empresa real.
3. Probar en navegador: abrir un turno en `/dashboard/turnos-caja`, hacer una
   venta en efectivo por el POS, verificar que quedó asociada al turno
   (columna `sales.turno_caja_id`), registrar una recogida, cerrar el turno y
   revisar que la diferencia calculada sea la esperada.
4. Asignar el permiso `cuentas_por_pagar`, `devoluciones`, `ordenes_compra`,
   `comisiones`, `control_regulatorio`, `cajas_turnos` a los usuarios/roles
   que corresponda desde Configuración → Usuarios (los admins ya los tienen
   todos por plantilla; gerente los tiene todos menos configuración; vendedor
   solo tiene `cajas_turnos` de los nuevos).

### Reorganización del menú (2026-07-21, misma sesión)
Con 23 ítems el menú había quedado desbalanceado ("Catálogo" mezclaba
maestros con Órdenes de Compra y Control Regulatorio; "Gestión" llegó a 9
ítems). Se reestructuró `components/dashboard-sidebar.tsx` y
`lib/permissions.ts` (`PermissionGroup`, usado también por el editor de
permisos en `user-management.tsx`) con criterio único por grupo:

| Grupo | Contenido | Criterio |
|---|---|---|
| Principal | Panel General, Punto de Venta, **Cajas y Turnos** | Lo que se usa a cada momento del día |
| Operación | Ventas, **Devoluciones**, Reportes, Campañas, Pedidos del Catálogo | Ciclo de una venta |
| Catálogo | Productos, Categorías, Inventario, Kits | Solo maestros de producto |
| **Compras** (nuevo) | Proveedores, Órdenes de Compra, Cuentas por Pagar | Todo lo de proveedores junto |
| Gestión | Clientes, Créditos, Gastos, Rentabilidad, Comisiones, Cierre de Mes | Clientes y finanzas |
| **Cumplimiento** (nuevo) | Control Regulatorio | Trazabilidad regulatoria (hoy droguería) |
| Sistema | Configuración | — |

`Proveedores` se movió de Catálogo a Compras. `Devoluciones` se movió de
Gestión a Operación. `Cajas y Turnos` se movió de Gestión a Principal. El
resto no cambió de lugar. Verificado con `tsc --noEmit`: cero errores nuevos.

### Deudas por faltante de caja (2026-07-21, misma sesión — a raíz de preguntas del usuario)
El usuario preguntó explícitamente: (1) ¿cómo asocia usuarios a cajas? y (2)
¿qué pasa con el dinero si hay diferencia al cerrar un turno? Se le explicó
el estado real (sin asociación fija hoy; la diferencia solo quedaba
registrada sin ningún efecto) y se le preguntó cómo quería cada cosa:
- **Usuario ↔ Caja**: eligió dejarlo como está — selección manual libre al
  abrir turno, sin asignación fija. No se tocó nada de esto.
- **Diferencia al cierre**: eligió que un **faltante** (efectivo contado <
  esperado) quede como **deuda a cargo del cajero**. Un **sobrante** no
  genera nada automático (queda solo como dato informativo, igual que hoy).

Implementado en `scripts/013_deudas_cajero.sql`:
- Tablas `deudas_cajero` / `pagos_deuda_cajero` (espejo exacto de
  `deudas_proveedor`/`pagos_deuda_proveedor`). RLS sin política de INSERT
  directa — solo se crean/pagan vía las RPCs de abajo, nunca por insert
  suelto desde el cliente.
- **`rpc_cerrar_turno_caja`**: reemplaza el cierre que antes hacía un UPDATE
  directo desde `turnos-caja-interface.tsx`. Ahora recalcula el saldo
  esperado **del lado del servidor** (suma real de `sales` en efectivo +
  `recogidas_efectivo` de ese turno) — ya no confía en el número que el
  navegador tenía en pantalla. Si `diferencia < 0`, crea automáticamente la
  fila en `deudas_cajero`.
- **`rpc_registrar_pago_cajero`**: espejo de `rpc_registrar_pago_proveedor`,
  para que el cajero (o quien corresponda) vaya abonando el faltante.
- `components/turnos-caja-interface.tsx`: nueva tarjeta "Deudas por
  faltantes de caja" (solo aparece si hay alguna), con botón "Registrar
  pago" por cajero. `handleCerrarTurno` ahora llama a la RPC en vez de hacer
  el UPDATE directo.

⚠️ **Importante**: esto NO es retroactivo. El turno que ya está en el
historial con diferencia de -$145.315 (visible antes de aplicar este script)
NO generará una deuda automáticamente — la RPC solo crea `deudas_cajero`
para turnos cerrados **después** de que `013` esté desplegado. Si se quiere
esa deuda histórica registrada, habría que crearla manualmente (un insert
puntual) una vez esté la tabla.

Verificado: `tsc --noEmit` sin errores nuevos; probado en navegador que la
página de turnos sigue funcionando normalmente sin romperse aunque `013`
todavía no esté aplicado (la tarjeta de deudas simplemente no aparece).

### Independizar Cajas de Turnos + 1 usuario por caja (2026-07-21, misma sesión)
El usuario pidió: (1) separar la gestión de cajas (solo admin/gerente) del
uso diario de turnos, con su propia opción de menú y permiso; (2) que el
usuario logueado simplemente elija su caja al abrir turno; (3) que solo se
permita 1 usuario por caja a la vez.

- **Nuevo permiso `cajas`** (grupo Sistema, junto a Configuración) —
  distinto de `cajas_turnos`. Por defecto lo tienen admin y gerente, **no**
  vendedor (mismo criterio que el resto de permisos de "gestión", no se
  excluyó a gerente específicamente porque no se pidió tan estricto — se
  puede ajustar por usuario individual si se quiere solo `admin`).
- **`app/dashboard/cajas/page.tsx` + `components/cajas-interface.tsx`**
  (nuevo): alta de cajas, activar/desactivar, y muestra en vivo si cada caja
  está "Libre" o "En uso por &lt;email&gt;". Esta es la ÚNICA pantalla donde se
  crean cajas ahora.
- **`turnos-caja-interface.tsx`**: se eliminó la tarjeta "Cajas registradas"
  y el formulario de alta (movidos a la página de arriba). El selector de
  "Abrir turno" ahora solo lista cajas **activas y sin turno abierto por
  nadie** (`cajasLibres`), calculado contra los turnos abiertos de
  cualquier cajero de la empresa, no solo los propios.
- **`scripts/014_unicidad_turno_caja.sql`**: la garantía real de "1 usuario
  por caja" es un **índice único parcial** en
  `turnos_caja(caja_id) WHERE estado='abierto'` — a nivel de base de datos,
  no solo un filtro de UI, así que ni dos clics simultáneos de dos cajeros
  distintos podrían abrir turno en la misma caja. Se agregó además (no
  pedido explícitamente, pero señalado como extra) un índice equivalente en
  `(empresa_id, cajero_id)` para que un mismo cajero tampoco pueda tener 2
  turnos abiertos a la vez — protege el supuesto de "un solo turno activo"
  que ya asumía el frontend (POS y pantalla de turnos). Se puede quitar
  (`DROP INDEX uq_turnos_caja_cajero_abierta`) si no se quiere esa
  restricción.
- `handleAbrirTurno` ahora captura el código `23505` (unique_violation) y
  muestra un mensaje amigable en vez del error crudo de Postgres.

**Verificado en producción** (con datos reales, no solo tsc): se abrió el
menú, se confirmó que "Cajas" y "Cajas y Turnos" aparecen como entradas
separadas, que `/dashboard/cajas` muestra Caja 1 como Activa/Libre con
botón Desactivar, que el selector de "Abrir turno" en `/dashboard/turnos-caja`
ya no tiene la tarjeta de gestión y lista "Caja 1" correctamente como
disponible. De paso se confirmó que el flujo de deuda por faltante
(sección anterior) ya funciona en producción: apareció una deuda real de
$1.315 creada automáticamente al cerrar un turno con ese faltante.

### Qué sigue sin construirse (fuera de alcance, no pedido)
- `comisiones_devengadas` sigue sin poblarse automáticamente (decisión
  consciente, ver arriba).
- Sin flujo de aprobación para devoluciones (se crean directamente en estado
  `'aprobada'`) — si se necesita un paso de aprobación previa, es un cambio
  pequeño sobre `rpc_registrar_devolucion`.
- Facturación electrónica DIAN sigue completamente fuera de alcance, como se
  acordó al inicio.

## Fase 4 — Facturación electrónica DIAN (fuera de alcance actual)

No iniciar sin pedido explícito. Cuando se quiera activar, con el modelo de
Fase 1 ya en su lugar, faltaría:
- Elegir proveedor tecnológico DIAN (Alegra, Siigo, Taxxa, Facturación.co,
  World Office, etc.) o desarrollo propio homologado.
- Certificado digital (.p12/.pfx) y su almacenamiento seguro.
- Generación de CUFE, XML/UBL, envío y consulta de estado ante la DIAN.
- Numeración/resolución de facturación autorizada.
- Notas crédito/débito electrónicas, documento soporte, RADIAN, nómina
  electrónica (cada uno es un flujo independiente sobre la misma base fiscal).

Ver el gap-analysis completo (checklist tipo MasControl) ya hecho en esta
conversación para el detalle ítem por ítem.

---

---

## Fase 1B / 1C — Ampliación a "sistema completo" (2026-07-21, misma sesión)

El usuario pidió revisar qué más hace falta a nivel de modelo de datos
investigando cómo lo resuelven otros sistemas, para dejar un "sistema
completo". Se investigó (ver fuentes abajo) y se agregaron dos scripts más,
ambos con el mismo estándar de seguridad que 008 (aditivo, idempotente, RLS
explícita en toda tabla nueva, sin tocar lógica/tablas existentes).

### `scripts/009_drogueria_regulatorio.sql`
- **`products`**: `codigo_cum` (CUM de INVIMA — más específico que
  `registro_invima` de la Fase 1, que es el expediente general),
  `clasificacion_atc`, `via_administracion`, `laboratorio_titular`,
  `vigencia_registro_sanitario` (vencimiento del REGISTRO, no del lote),
  `requiere_cadena_frio`, `permite_venta_fraccionada` +
  `unidades_por_presentacion` (vender sueltas tabletas de una caja),
  `es_generico` + `producto_referencia_id` (sustitución genérico↔marca).
- **`companies`**: datos del establecimiento farmacéutico exigidos por
  Decreto 2200/2005 y Resolución 1403/2007 — director técnico (nombre,
  documento, tarjeta profesional), licencia de funcionamiento, entidad
  territorial de salud.
- **Tabla nueva `control_sustancias_dispensacion`**: libro de control de
  estupefacientes/psicotrópicos (Resolución 1478/2006) — registra paciente,
  médico prescriptor, fórmula, cantidad. ⚠️ Solo el modelo de datos; el
  reporte exacto ante el Fondo Nacional de Estupefacientes requiere validar
  con asesor legal antes de operar con controlados.
- **Tabla nueva `control_cadena_frio`**: bitácora de temperatura para
  productos refrigerados (vacunas, insulinas), exigida por Decreto 2200/2005.

### `scripts/010_retail_completo.sql`
Cierra brechas genéricas de retail detectadas en el gap-analysis tipo
MasControl (no exclusivas de droguería, pero el usuario pidió "sistema
completo"):
- **Devoluciones y garantías**: `devoluciones` + `devolucion_items`.
- **Notas crédito/débito INTERNAS** (`notas_credito`, `notas_debito`) —
  ⚠️ explícitamente NO son el documento electrónico DIAN, es solo registro
  contable interno mientras no se active facturación electrónica.
- **Cuentas por pagar a proveedor**: `deudas_proveedor` +
  `pagos_deuda_proveedor`, espejo (en español) de `customer_debts`/
  `debt_payments` que ya existían en inglés solo para clientes.
- **Órdenes de compra formales**: `ordenes_compra` + `orden_compra_items`
  (antes de recibir la mercancía; se linkean a `purchase_batches` al
  recibirla).
- **Comisiones**: `products.comision_porcentaje` +
  `comisiones_devengadas` (ledger, análogo a `sales_profit`).
- **Cajas/turnos/recogidas**: `cajas`, `turnos_caja` (apertura/cierre con
  arqueo por cajero), `recogidas_efectivo`, + `sales.turno_caja_id`
  (nullable). Coexiste con `cierres_mensuales` — el cierre mensual sigue
  siendo el resumen consolidado; esto añade el detalle por caja/turno que
  faltaba.

### Convención de nombres (2026-07-21, ajuste pedido por el usuario)
`008` ya se ejecutó en producción y **no se tocó** (columnas que agregó, como
`fecha_vencimiento`, `tipo_negocio`, `nit`, ya quedan fijas tal cual están).
`009` y `010` se reescribieron para que TODA tabla y columna nueva vaya en
español, incluidas las genéricas: `company_id` → `empresa_id`, `product_id` →
`producto_id`, `sale_id` → `venta_id`, `created_at`/`created_by` →
`creado_en`/`creado_por`, `batch_id` → `lote_id`, etc. También se renombraron
tablas enteras para que el "espejo" en español sea consistente:
`supplier_debts` → `deudas_proveedor`, `supplier_debt_payments` →
`pagos_deuda_proveedor`, `purchase_orders` → `ordenes_compra`,
`purchase_order_items` → `orden_compra_items`.
Las tablas YA existentes (`products`, `sales`, `companies`, `user_companies`,
etc.) siguen en inglés — no se renombran, siguen en producción tal cual.

### Fuentes consultadas
- [CÓDIGO ÚNICO DE MEDICAMENTOS VIGENTES — Datos Abiertos Colombia (INVIMA)](https://www.datos.gov.co/Salud-y-Protecci-n-Social/C-DIGO-NICO-DE-MEDICAMENTOS-VIGENTES/i7cb-raxc)
- [Circular 420 de 2006 (CUM) — EPS Sura](https://www.epssura.com/index.php?option=com_content&view=article&id=928)
- [Resolución 1403 de 2007 — requisitos droguerías (Club del Droguista)](https://www.clubdeldroguista.com/resolucion-1403-de-2007-lo-que-toda-drogueria-debe-cumplir/)
- [Decreto 2200 de 2005 — servicio farmacéutico (INVIMA)](https://www.invima.gov.co/biblioteca/decreto-2200-2005-servicio-farmaceutico)
- [MinSalud — listado de sustancias de control especial](https://consultorsalud.com/minsalud-listado-sustancias-control-especial/)
- Búsquedas generales sobre software de droguería en Colombia (Distrisoft,
  Funcionalsoft, SoftwarePOS.co) para contrastar qué campos son estándar de
  mercado (lotes, vencimiento, unidad de empaque, venta fraccionada).

### Qué sigue sin tocarse (por diseño, no por olvido)
- Ninguna RPC nueva escribe todavía en estas tablas — todo el cálculo
  (reintegro de stock al aprobar una devolución, generación automática de
  comisiones, actualización de `monto_pendiente`/`estado` de
  `deudas_proveedor`, arqueo automático de `turnos_caja`) es Fase 2.
- No se creó tabla de "sucursales"/multi-sede — hoy `company_id` sigue
  representando un solo punto/negocio. Si en algún momento se necesitan
  varias sedes físicas bajo una misma empresa, es una decisión arquitectónica
  aparte (no incluida aquí porque no se ha pedido).
- No se modeló información clínica del cliente (alergias, tratamientos
  crónicos) — son datos sensibles bajo la Ley 1581 (Habeas Data) que
  requieren tratamiento especial/consentimiento informado; se deja fuera
  hasta que se pida explícitamente y se defina cómo protegerlos.

---

## Próximo paso

Ejecutar en orden en el SQL Editor de Supabase:
1. `scripts/008_drogueria_adaptacion.sql`
2. `scripts/009_drogueria_regulatorio.sql`
3. `scripts/010_retail_completo.sql`

Luego actualizar el `UPDATE companies SET tipo_negocio = 'cosmeticos' WHERE
slug = '...'` con el slug real, y decidir si seguimos con Fase 2 (lógica:
FEFO, campañas por vencer, cálculo de comisiones, reintegro de devoluciones)
o Fase 3 (UI) primero.
