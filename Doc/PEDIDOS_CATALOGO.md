# Pedidos del Catálogo Público — Funcionalidad

Bitácora de la integración entre **Campañas de descuento**, **Catálogo público** y **POS** mediante el modelo de **Kit Promocional**.

Fecha de implementación: 2026-04-25.

---

## 1. Idea general

El cliente entra al catálogo público (`/catalog`), ve productos con descuento llamativo (badge `-XX%` + precio tachado + ribbon "OFERTA") cuando hay una **campaña de descuento PUBLICADA y vigente**. Arma su carrito mezclando productos en oferta y a precio normal. Al pulsar **"Solicitar por WhatsApp"**:

1. El sistema crea automáticamente un **pedido del catálogo** (registro en `product_kits` con `is_catalog_order=true`) con un **código aleatorio de 6 dígitos** único por empresa.
2. Congela los precios del momento (oferta o full).
3. Calcula `expires_at` = la **menor `fecha_fin`** de las ofertas en el carrito, o **7 días** desde hoy si no hay ofertas.
4. Abre WhatsApp con un mensaje preformateado dirigido al negocio que incluye el **código**, items, total, ahorros, fecha de vencimiento y aviso de disponibilidad.
5. El cliente lleva el código al **punto físico**. El cajero lo digita en el campo de barras del POS → se cargan los productos a precios congelados → al completar la venta, el pedido se marca **RECLAMADO** automáticamente.

---

## 2. Decisiones de diseño tomadas

| # | Punto | Decisión |
|---|---|---|
| 1 | Tipo de pedido | Reusar `product_kits` con columnas extra (`is_catalog_order`, `catalog_status`, etc.). Filtrarlo en la pantalla de Kits para que no aparezca. |
| 2 | Reuso del código | Un solo uso. RECLAMADO → POS bloquea; EXPIRADO → POS permite cargar pero advierte. |
| 3 | Identificación del cliente | Catálogo pide nombre/teléfono **opcional**. El cajero igual selecciona el cliente real al cobrar. |
| 4 | Stock | NO se reserva. Se valida disponibilidad al solicitar y se advierte si quedan pocas unidades; el carrito muestra el aviso "sujeto a disponibilidad". |
| 5 | Productos sin oferta | Permitidos en el carrito a precio normal; se congelan al generar el pedido. |
| 6 | Visualización descuento | Badge `-XX%` + ribbon "OFERTA" + precio tachado + chip vigencia en modal. |
| 7 | WhatsApp | `wa.me/<phone-empresa>?text=...` (no requiere API). Cliente envía al negocio. |
| 8 | Mensaje | Incluye código #N, items, total, ahorro, fechas, aviso de stock limitado. |
| a | Generación de código | Aleatorio 6 dígitos (100000–999999), único por empresa. Reintenta hasta 30 veces. |
| b | Vencimiento | mín(`fecha_fin` de ofertas en carrito) o `now() + 7 días` si no hay ofertas. |
| c | Cambio de precio | Precios congelados al generar el pedido. |
| d | Estados POS | PENDIENTE → carga; RECLAMADO → bloquea con fecha; EXPIRADO → warning, permite seguir. |
| e | Pantalla admin | Entrada nueva en sidebar `/dashboard/pedidos-catalogo` con KPIs y tabla. |
| f | Marcado RECLAMADO | Automático al completar venta en el POS si el carrito vino de un pedido del catálogo. |

---

## 3. Archivos creados / modificados

### SQL
- **`scripts/catalogo_pedidos.sql`** (nuevo). Idempotente. Contiene:
  - `ALTER TABLE public.product_kits` — añade 8 columnas nuevas + constraint `product_kits_catalog_status_chk` + FK opcional `product_kits_sale_fk` + 2 índices.
  - Vista `public.public_products_with_offers` (un registro por producto con la oferta vigente de mayor descuento).
  - RPC `rpc_crear_pedido_catalogo(p_company_id, p_client_name, p_client_phone, p_items jsonb)` — ejecutable por `anon`.
  - RPC `rpc_marcar_pedido_reclamado(p_kit_id, p_sale_id)` — solo `authenticated`.
  - RPC `rpc_expirar_pedidos_vencidos()` — barrido idempotente.

### Frontend
- **`app/catalog/page.tsx`** — cambiada la query a `public_products_with_offers`.
- **`app/catalog/PublicCatalogPage.tsx`** — reescrito completo: tipos `CatalogProduct`/`CartItem`, badges, precio tachado, banner ofertas, formulario nombre/teléfono, llamada RPC, modal de éxito con código, mensaje WhatsApp completo.
- **`components/pos-interface.tsx`** — `lookupKit` extendido, validación PENDIENTE/RECLAMADO/EXPIRADO, tracking de `activeCatalogOrderId`, llamada a `rpc_marcar_pedido_reclamado` en checkout, badge en cabecera del carrito, preview verde en POS.
- **`app/dashboard/kits/page.tsx`** — filtra `is_catalog_order = false`.
- **`app/dashboard/pedidos-catalogo/page.tsx`** (nuevo) — KPIs + tabla, llama `rpc_expirar_pedidos_vencidos` al cargar.
- **`components/catalog-orders-table.tsx`** (nuevo) — tabla con filtros por estado y modal de detalle.
- **`components/dashboard-sidebar.tsx`** — entrada "Pedidos del Catálogo" (icono `ClipboardList`), bajo permiso `kits`.

---

## 4. Modelo de datos

```
product_kits
  ├─ id, company_id, code, name, description, image_url, is_active, ...
  └─ NUEVAS:
     is_catalog_order  boolean    DEFAULT false
     catalog_status    text       — PENDIENTE | RECLAMADO | EXPIRADO (NULL si no es del catálogo)
     client_name       text
     client_phone      text
     expires_at        timestamptz
     reclaimed_at      timestamptz
     sale_id           uuid       FK sales(id) ON DELETE SET NULL
     frozen_total      numeric(14,2)

product_kit_items     — sin cambios. unit_price_in_kit guarda el precio congelado.

ofertas_virtuales     — sin cambios. La vista pública agrupa por producto y toma
                       el descuento mayor cuando hay ofertas concurrentes.
```

Constraint clave: `product_kits_catalog_status_chk` garantiza que cuando `is_catalog_order=false` el `catalog_status` sea `NULL`.

---

## 5. Estados del pedido

```
   ┌────────────┐                 ┌────────────┐
   │ PENDIENTE  │ ─── cobro POS ─►│ RECLAMADO  │
   └────────────┘                 └────────────┘
         │
         │ vence (rpc_expirar_pedidos_vencidos)
         ▼
   ┌────────────┐
   │ EXPIRADO   │  (el POS aún permite cargarlo con warning, decide el cajero)
   └────────────┘
```

---

## 6. Multi-company (validación en 3 capas)

1. **Cliente** (catálogo) — pasa `p_company_id` desde el host resuelto. La RPC valida que la empresa exista.
2. **RPC `rpc_crear_pedido_catalogo`** — cada producto debe ser `company_id = p_company_id` y `is_public = true`.
3. **RPC `rpc_marcar_pedido_reclamado`** — valida pertenencia del kit a una empresa del usuario autenticado (`user_companies`).
4. **Pantalla `/dashboard/pedidos-catalogo`** — usa `companyId` del contexto y filtra todas las queries.
5. **Vista `public_products_with_offers`** — filtra `WHERE company_id = X` desde el catálogo (no incluye RLS pero el filtro explícito basta porque `ofertas_virtuales` ya tiene RLS de SELECT pública solo para `activo=true`).

---

## 7. Anti-fraude / defensa

La RPC pública re-valida cada item contra la BD:
- Si el cliente envía `has_offer=true` con un precio que **ya no coincide** con `ofertas_virtuales` activas → error "La oferta para X ya no está disponible. Recarga el catálogo."
- Si el cliente envía un precio "normal" que **no coincide** con `products.sale_price` actual → error "El precio de X cambió. Recarga el catálogo."
- Stock insuficiente → error.
- Stock bajo (≤ qty + 2) → no bloquea, regresa el item en `low_stock_warnings`.

---

## 8. Mensaje de WhatsApp generado

```
Hola, quiero hacer un pedido en *<Empresa>*.

📋 *Código de pedido:* #123456

• Producto A × 2 — $24.000 (PROMO -25%)
• Producto B × 1 — $15.000

*Total:* $39.000
💚 Ahorras: *$8.000*
👤 Cliente: María Pérez · 3001234567

📅 *Disponible hasta:* 30 de abril de 2026

Pasaré al punto físico con este código *#123456* para hacer efectivo el pedido y aprovechar el descuento.

⚠️ Entiendo que los productos están sujetos a disponibilidad y pueden agotarse antes de mi visita.
```

URL: `https://wa.me/<phone-empresa-sin-no-dígitos>?text=<encoded>`

---

## 9. Para activar en producción

1. Ejecutar `scripts/catalogo_pedidos.sql` completo en Supabase → SQL Editor (con `service_role` o `postgres`).
2. Verificar que la vista existe:
   ```sql
   SELECT * FROM public.public_products_with_offers LIMIT 5;
   ```
3. Verificar columnas nuevas:
   ```sql
   SELECT column_name FROM information_schema.columns
    WHERE table_schema='public' AND table_name='product_kits'
      AND column_name IN ('is_catalog_order','catalog_status','client_name',
                          'client_phone','expires_at','reclaimed_at','sale_id','frozen_total');
   ```
4. (Opcional) Programar `SELECT public.rpc_expirar_pedidos_vencidos();` como cron diario en Supabase Cron para no depender solo del auto-barrido al abrir la pantalla.
5. Probar el flujo end-to-end:
   - Crear campaña, calcular, aprobar, publicar.
   - Abrir `/catalog` → ver el badge `-XX%`.
   - Solicitar pedido → recibir código.
   - En POS digitar código → cargar pedido → cobrar.
   - Verificar `catalog_status = 'RECLAMADO'`.

---

## 10. Pendientes / mejoras futuras

- Programar `rpc_expirar_pedidos_vencidos` como cron en Supabase.
- Notificación push o email al cliente cuando su pedido esté próximo a vencer.
- Reporte/KPI agregado: % de pedidos reclamados vs. expirados (efectividad del catálogo).
- Permitir al cajero "extender" el vencimiento de un pedido específico desde la pantalla de Pedidos del Catálogo.
- Captura del cliente real en el POS al momento de cobrar (auto-crear cliente si no existe usando `client_name` + `client_phone` del pedido).
- Integración WhatsApp Business API para enviar al **cliente** (en vez de que él envíe al negocio).
- Si en el futuro se agregan más tipos de "kits desechables", considerar separar a tabla `catalog_orders` para no recargar `product_kits`.
