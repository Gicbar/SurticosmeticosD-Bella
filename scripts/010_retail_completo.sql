-- ════════════════════════════════════════════════════════════════════════════
-- FASE 1C — Cierra brechas de retail identificadas en el gap-analysis
-- (devoluciones, notas crédito/débito internas, cuentas por pagar a
-- proveedor, órdenes de compra formales, comisiones, cajas/turnos/recogidas)
-- ════════════════════════════════════════════════════════════════════════════
-- Estos módulos no son exclusivos de droguería — son huecos genéricos de
-- retail que ya existían antes de pensar en droguería (ver el análisis tipo
-- "MasControl" hecho antes en esta conversación). Se incluyen ahora porque el
-- usuario pidió "un sistema completo" a nivel de modelo de datos.
--
-- Convención de nombres: TODO en español, tablas y columnas, incluidas las
-- genéricas (empresa_id, producto_id, creado_en, etc.) — a diferencia de las
-- tablas viejas (sales, products...) que siguen en inglés porque ya están en
-- producción y no se tocan. Todo lo de este script es tabla NUEVA, así que no
-- hay nada que romper al nombrarlo en español desde el inicio.
--
-- Igual que 008/009: 100% aditivo, idempotente, con RLS explícita en cada
-- tabla nueva (patrón de campanias_schema.sql: filtrando por empresa vía
-- user_companies). Ninguna tabla/función/RLS existente se modifica. Ninguna
-- lógica de negocio (RPCs) se implementa aquí todavía — eso es Fase 2, se
-- hace y se prueba aparte por tocar inventario y dinero real.
-- ════════════════════════════════════════════════════════════════════════════


-- ════════════════════════════════════════════════════════════════════════════
-- 1. Devoluciones y garantías
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.devoluciones (
    id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id            uuid        NOT NULL REFERENCES public.companies(id),
    venta_id              uuid        NOT NULL REFERENCES public.sales(id),
    cliente_id            uuid        REFERENCES public.clients(id),
    tipo                  text        NOT NULL DEFAULT 'devolucion',
    estado                text        NOT NULL DEFAULT 'pendiente',
    motivo                text        NOT NULL,
    monto_total           numeric(14,2) NOT NULL DEFAULT 0,
    reintegra_inventario  boolean     NOT NULL DEFAULT true,
    creado_por            uuid        REFERENCES auth.users(id),
    creado_en             timestamptz NOT NULL DEFAULT now(),
    resuelto_por          uuid        REFERENCES auth.users(id),
    resuelto_en           timestamptz,

    CONSTRAINT devoluciones_tipo_check   CHECK (tipo IN ('devolucion', 'garantia')),
    CONSTRAINT devoluciones_estado_check CHECK (estado IN ('pendiente', 'aprobada', 'rechazada'))
);

CREATE TABLE IF NOT EXISTS public.devolucion_items (
    id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    devolucion_id  uuid        NOT NULL REFERENCES public.devoluciones(id) ON DELETE CASCADE,
    empresa_id     uuid        NOT NULL REFERENCES public.companies(id),
    item_venta_id  uuid        NOT NULL REFERENCES public.sale_items(id),
    producto_id    uuid        NOT NULL REFERENCES public.products(id),
    lote_id        uuid        REFERENCES public.purchase_batches(id),
    cantidad       integer     NOT NULL CHECK (cantidad > 0),
    precio_unitario numeric(14,2) NOT NULL,
    subtotal       numeric(14,2) NOT NULL,
    motivo_item    text
);

CREATE INDEX IF NOT EXISTS idx_devoluciones_empresa_venta ON public.devoluciones (empresa_id, venta_id);
CREATE INDEX IF NOT EXISTS idx_devolucion_items_devolucion ON public.devolucion_items (devolucion_id);

COMMENT ON TABLE public.devoluciones IS 'Cabecera de devolución/garantía sobre una venta ya registrada. lote_id en devolucion_items indica a qué lote se reintegraría el stock — el reintegro real (UPDATE purchase_batches.remaining_quantity) es lógica de Fase 2, no ocurre solo con este INSERT.';
COMMENT ON COLUMN public.devoluciones.reintegra_inventario IS 'FALSE para productos dañados/vencidos que se devuelven pero NO regresan a stock vendible.';

ALTER TABLE public.devoluciones     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devolucion_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS dev_select_own ON public.devoluciones;
CREATE POLICY dev_select_own ON public.devoluciones FOR SELECT USING (
    empresa_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid()));
DROP POLICY IF EXISTS dev_insert_own ON public.devoluciones;
CREATE POLICY dev_insert_own ON public.devoluciones FOR INSERT WITH CHECK (
    empresa_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid()));
DROP POLICY IF EXISTS dev_update_own ON public.devoluciones;
CREATE POLICY dev_update_own ON public.devoluciones FOR UPDATE USING (
    empresa_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid())) WITH CHECK (
    empresa_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid()));

DROP POLICY IF EXISTS devi_select_own ON public.devolucion_items;
CREATE POLICY devi_select_own ON public.devolucion_items FOR SELECT USING (
    empresa_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid()));
DROP POLICY IF EXISTS devi_insert_own ON public.devolucion_items;
CREATE POLICY devi_insert_own ON public.devolucion_items FOR INSERT WITH CHECK (
    empresa_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid()));


-- ════════════════════════════════════════════════════════════════════════════
-- 2. Notas crédito / débito — INTERNAS y contables únicamente.
--    ⚠️ NO son el documento electrónico DIAN (eso sigue fuera de alcance).
--    Sirven para llevar un registro contable de ajustes mientras no haya
--    facturación electrónica activa.
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.notas_credito (
    id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id           uuid        NOT NULL REFERENCES public.companies(id),
    venta_id             uuid        NOT NULL REFERENCES public.sales(id),
    devolucion_id        uuid        REFERENCES public.devoluciones(id),
    consecutivo_interno  integer,
    concepto             text        NOT NULL,
    valor                numeric(14,2) NOT NULL CHECK (valor > 0),
    creado_por           uuid        REFERENCES auth.users(id),
    creado_en            timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notas_debito (
    id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id           uuid        NOT NULL REFERENCES public.companies(id),
    venta_id             uuid        REFERENCES public.sales(id),
    cliente_id           uuid        REFERENCES public.clients(id),
    consecutivo_interno  integer,
    concepto             text        NOT NULL,
    valor                numeric(14,2) NOT NULL CHECK (valor > 0),
    creado_por           uuid        REFERENCES auth.users(id),
    creado_en            timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.notas_credito IS 'Ajuste contable interno a favor del cliente (ej. corrección de precio, devolución sin reverso completo de venta). consecutivo_interno es SOLO numeración interna del negocio — NO tiene validez como nota crédito electrónica DIAN.';
COMMENT ON TABLE public.notas_debito IS 'Ajuste contable interno en contra del cliente (ej. cobro adicional posterior a la venta). Mismo alcance que notas_credito: interno, no fiscal-electrónico.';

ALTER TABLE public.notas_credito ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notas_debito  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS nc_select_own ON public.notas_credito;
CREATE POLICY nc_select_own ON public.notas_credito FOR SELECT USING (
    empresa_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid()));
DROP POLICY IF EXISTS nc_insert_own ON public.notas_credito;
CREATE POLICY nc_insert_own ON public.notas_credito FOR INSERT WITH CHECK (
    empresa_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid()));

DROP POLICY IF EXISTS nd_select_own ON public.notas_debito;
CREATE POLICY nd_select_own ON public.notas_debito FOR SELECT USING (
    empresa_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid()));
DROP POLICY IF EXISTS nd_insert_own ON public.notas_debito;
CREATE POLICY nd_insert_own ON public.notas_debito FOR INSERT WITH CHECK (
    empresa_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid()));


-- ════════════════════════════════════════════════════════════════════════════
-- 3. Cuentas por pagar a proveedor (compras a crédito) — espejo de
--    customer_debts/debt_payments que ya existe (en inglés) para cartera de
--    clientes. Estas tablas nuevas van en español: deudas_proveedor /
--    pagos_deuda_proveedor.
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.deudas_proveedor (
    id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id       uuid        NOT NULL REFERENCES public.companies(id),
    proveedor_id     uuid        NOT NULL REFERENCES public.suppliers(id),
    lote_id          uuid        REFERENCES public.purchase_batches(id),
    monto_original   numeric(14,2) NOT NULL CHECK (monto_original > 0),
    monto_pagado     numeric(14,2) NOT NULL DEFAULT 0 CHECK (monto_pagado >= 0),
    monto_pendiente  numeric(14,2) GENERATED ALWAYS AS (monto_original - monto_pagado) STORED,
    estado           text        NOT NULL DEFAULT 'pendiente',
    fecha_vencimiento date,
    notas            text,
    creado_por       uuid        REFERENCES auth.users(id),
    creado_en        timestamptz NOT NULL DEFAULT now(),
    actualizado_en   timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT deudas_proveedor_estado_check CHECK (estado IN ('pendiente', 'parcial', 'pagada', 'cancelada'))
);

CREATE TABLE IF NOT EXISTS public.pagos_deuda_proveedor (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    deuda_id    uuid        NOT NULL REFERENCES public.deudas_proveedor(id),
    empresa_id  uuid        NOT NULL REFERENCES public.companies(id),
    monto       numeric(14,2) NOT NULL CHECK (monto > 0),
    forma_pago  text        NOT NULL DEFAULT 'efectivo',
    notas       text,
    creado_por  uuid        REFERENCES auth.users(id),
    creado_en   timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT pagos_deuda_proveedor_forma_pago_check CHECK (forma_pago IN ('efectivo', 'banco'))
);

CREATE INDEX IF NOT EXISTS idx_deudas_proveedor_estado ON public.deudas_proveedor (empresa_id, estado);

COMMENT ON TABLE public.deudas_proveedor IS 'Cartera por pagar a proveedores (espejo en español de customer_debts). monto_pendiente es columna generada igual que remaining_amount en customer_debts.';

ALTER TABLE public.deudas_proveedor       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos_deuda_proveedor  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS dp_select_own ON public.deudas_proveedor;
CREATE POLICY dp_select_own ON public.deudas_proveedor FOR SELECT USING (
    empresa_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid()));
DROP POLICY IF EXISTS dp_insert_own ON public.deudas_proveedor;
CREATE POLICY dp_insert_own ON public.deudas_proveedor FOR INSERT WITH CHECK (
    empresa_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid()));
DROP POLICY IF EXISTS dp_update_own ON public.deudas_proveedor;
CREATE POLICY dp_update_own ON public.deudas_proveedor FOR UPDATE USING (
    empresa_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid())) WITH CHECK (
    empresa_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid()));

DROP POLICY IF EXISTS pdp_select_own ON public.pagos_deuda_proveedor;
CREATE POLICY pdp_select_own ON public.pagos_deuda_proveedor FOR SELECT USING (
    empresa_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid()));
DROP POLICY IF EXISTS pdp_insert_own ON public.pagos_deuda_proveedor;
CREATE POLICY pdp_insert_own ON public.pagos_deuda_proveedor FOR INSERT WITH CHECK (
    empresa_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid()));


-- ════════════════════════════════════════════════════════════════════════════
-- 4. Órdenes de compra formales (distintas de purchase_batches, que es el
--    lote YA recibido). Una orden de compra es lo que se pide antes de que
--    llegue la mercancía.
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.ordenes_compra (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id      uuid        NOT NULL REFERENCES public.companies(id),
    proveedor_id    uuid        NOT NULL REFERENCES public.suppliers(id),
    estado          text        NOT NULL DEFAULT 'borrador',
    fecha_esperada  date,
    notas           text,
    creado_por      uuid        REFERENCES auth.users(id),
    creado_en       timestamptz NOT NULL DEFAULT now(),
    actualizado_en  timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT ordenes_compra_estado_check
        CHECK (estado IN ('borrador', 'enviada', 'recibida_parcial', 'recibida_total', 'cancelada'))
);

CREATE TABLE IF NOT EXISTS public.orden_compra_items (
    id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    orden_compra_id          uuid        NOT NULL REFERENCES public.ordenes_compra(id) ON DELETE CASCADE,
    empresa_id               uuid        NOT NULL REFERENCES public.companies(id),
    producto_id              uuid        NOT NULL REFERENCES public.products(id),
    cantidad_solicitada      integer     NOT NULL CHECK (cantidad_solicitada > 0),
    cantidad_recibida        integer     NOT NULL DEFAULT 0 CHECK (cantidad_recibida >= 0),
    costo_unitario_estimado  numeric(14,2),
    lote_id                  uuid        REFERENCES public.purchase_batches(id)
);

CREATE INDEX IF NOT EXISTS idx_ordenes_compra_empresa_estado ON public.ordenes_compra (empresa_id, estado);

COMMENT ON TABLE public.ordenes_compra IS 'Orden de compra al proveedor, previa a la recepción física. lote_id en orden_compra_items se llena cuando se recibe la mercancía y se crea el lote real en purchase_batches (lógica de Fase 2).';

ALTER TABLE public.ordenes_compra      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orden_compra_items  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS oc_select_own ON public.ordenes_compra;
CREATE POLICY oc_select_own ON public.ordenes_compra FOR SELECT USING (
    empresa_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid()));
DROP POLICY IF EXISTS oc_insert_own ON public.ordenes_compra;
CREATE POLICY oc_insert_own ON public.ordenes_compra FOR INSERT WITH CHECK (
    empresa_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid()));
DROP POLICY IF EXISTS oc_update_own ON public.ordenes_compra;
CREATE POLICY oc_update_own ON public.ordenes_compra FOR UPDATE USING (
    empresa_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid())) WITH CHECK (
    empresa_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid()));
DROP POLICY IF EXISTS oc_delete_own ON public.ordenes_compra;
CREATE POLICY oc_delete_own ON public.ordenes_compra FOR DELETE USING (
    empresa_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid()));

DROP POLICY IF EXISTS oci_select_own ON public.orden_compra_items;
CREATE POLICY oci_select_own ON public.orden_compra_items FOR SELECT USING (
    empresa_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid()));
DROP POLICY IF EXISTS oci_insert_own ON public.orden_compra_items;
CREATE POLICY oci_insert_own ON public.orden_compra_items FOR INSERT WITH CHECK (
    empresa_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid()));
DROP POLICY IF EXISTS oci_update_own ON public.orden_compra_items;
CREATE POLICY oci_update_own ON public.orden_compra_items FOR UPDATE USING (
    empresa_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid())) WITH CHECK (
    empresa_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid()));
DROP POLICY IF EXISTS oci_delete_own ON public.orden_compra_items;
CREATE POLICY oci_delete_own ON public.orden_compra_items FOR DELETE USING (
    empresa_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid()));


-- ════════════════════════════════════════════════════════════════════════════
-- 5. Comisiones por producto vendido
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS comision_porcentaje numeric(5,2) NOT NULL DEFAULT 0;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_comision_porcentaje_check') THEN
        ALTER TABLE public.products
            ADD CONSTRAINT products_comision_porcentaje_check
            CHECK (comision_porcentaje >= 0 AND comision_porcentaje <= 100);
    END IF;
END $$;

COMMENT ON COLUMN public.products.comision_porcentaje IS 'Porcentaje de comisión para el vendedor sobre este producto. Default 0 = sin cambio de comportamiento. El cálculo real por venta lo hace una función de Fase 2 (ej. hook en rpc_registrar_venta) que llena comisiones_devengadas.';

CREATE TABLE IF NOT EXISTS public.comisiones_devengadas (
    id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id          uuid        NOT NULL REFERENCES public.companies(id),
    venta_id            uuid        NOT NULL REFERENCES public.sales(id),
    item_venta_id       uuid        NOT NULL REFERENCES public.sale_items(id),
    vendedor_id         uuid        NOT NULL REFERENCES auth.users(id),
    porcentaje_aplicado numeric(5,2) NOT NULL,
    base_calculo        numeric(14,2) NOT NULL,
    valor_comision      numeric(14,2) NOT NULL,
    estado              text        NOT NULL DEFAULT 'pendiente',
    creado_en           timestamptz NOT NULL DEFAULT now(),
    pagada_en           timestamptz,

    CONSTRAINT comisiones_estado_check CHECK (estado IN ('pendiente', 'pagada', 'anulada'))
);

CREATE INDEX IF NOT EXISTS idx_comisiones_vendedor ON public.comisiones_devengadas (empresa_id, vendedor_id, estado);

COMMENT ON TABLE public.comisiones_devengadas IS 'Ledger de comisiones ganadas por venta/vendedor, análogo a sales_profit. Se llenaría automáticamente al registrar cada venta (Fase 2); hoy la tabla existe pero nada la escribe todavía.';
COMMENT ON COLUMN public.comisiones_devengadas.vendedor_id IS 'Hoy se asume igual a sales.created_by (quien registró la venta). Si en el futuro un admin puede registrar ventas a nombre de otro vendedor, se necesitaría una columna vendedor_id separada en sales — no existe todavía, no se agregó por no ser un caso confirmado.';

ALTER TABLE public.comisiones_devengadas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS com_select_own ON public.comisiones_devengadas;
CREATE POLICY com_select_own ON public.comisiones_devengadas FOR SELECT USING (
    empresa_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid()));
DROP POLICY IF EXISTS com_insert_own ON public.comisiones_devengadas;
CREATE POLICY com_insert_own ON public.comisiones_devengadas FOR INSERT WITH CHECK (
    empresa_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid()));
DROP POLICY IF EXISTS com_update_own ON public.comisiones_devengadas;
CREATE POLICY com_update_own ON public.comisiones_devengadas FOR UPDATE USING (
    empresa_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid())) WITH CHECK (
    empresa_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid()));


-- ════════════════════════════════════════════════════════════════════════════
-- 6. Cajas / terminales, turnos y recogidas de efectivo
-- ════════════════════════════════════════════════════════════════════════════
-- Hoy el "cierre" (cierres_mensuales) es único y mensual por empresa. Esto
-- añade el nivel de detalle POR CAJA Y POR TURNO que faltaba (arqueo de
-- apertura/cierre por cajero, recogidas de dinero durante el turno), sin
-- tocar ni reemplazar el cierre mensual existente — ambos coexisten: el
-- cierre mensual sigue siendo el resumen consolidado del mes.

CREATE TABLE IF NOT EXISTS public.cajas (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id  uuid        NOT NULL REFERENCES public.companies(id),
    nombre      text        NOT NULL CHECK (char_length(trim(nombre)) >= 1),
    activa      boolean     NOT NULL DEFAULT true,
    creado_en   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.turnos_caja (
    id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id            uuid        NOT NULL REFERENCES public.companies(id),
    caja_id               uuid        NOT NULL REFERENCES public.cajas(id),
    cajero_id             uuid        NOT NULL REFERENCES auth.users(id),
    saldo_apertura        numeric(14,2) NOT NULL DEFAULT 0,
    saldo_cierre_esperado numeric(14,2),
    saldo_cierre_contado  numeric(14,2),
    diferencia            numeric(14,2),
    estado                text        NOT NULL DEFAULT 'abierto',
    abierto_en            timestamptz NOT NULL DEFAULT now(),
    cerrado_en            timestamptz,
    notas                 text,

    CONSTRAINT turnos_caja_estado_check CHECK (estado IN ('abierto', 'cerrado'))
);

CREATE TABLE IF NOT EXISTS public.recogidas_efectivo (
    id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id    uuid        NOT NULL REFERENCES public.companies(id),
    turno_id      uuid        NOT NULL REFERENCES public.turnos_caja(id),
    monto         numeric(14,2) NOT NULL CHECK (monto > 0),
    recogido_por  uuid        REFERENCES auth.users(id),
    entregado_a   text,
    notas         text,
    creado_en     timestamptz NOT NULL DEFAULT now()
);

-- Vincula cada venta a un turno de caja (opcional, nullable — no rompe ventas
-- históricas ni las que se sigan haciendo sin turno abierto explícitamente).
-- Se agrega a `sales` (tabla existente en inglés, no se renombra), pero la
-- columna nueva ya va en español, igual que su propio "venta_uid" existente.
ALTER TABLE public.sales
    ADD COLUMN IF NOT EXISTS turno_caja_id uuid REFERENCES public.turnos_caja(id);

CREATE INDEX IF NOT EXISTS idx_turnos_caja_empresa_estado ON public.turnos_caja (empresa_id, estado);
CREATE INDEX IF NOT EXISTS idx_sales_turno_caja ON public.sales (turno_caja_id);

COMMENT ON TABLE public.cajas IS 'Caja/terminal físico de venta. Sin límite en el esquema (soporta "cajas ilimitadas").';
COMMENT ON TABLE public.turnos_caja IS 'Apertura/cierre de una caja por un cajero, con arqueo (esperado según ventas vs. contado físicamente).';
COMMENT ON COLUMN public.sales.turno_caja_id IS 'Turno de caja durante el cual se hizo la venta. Nullable: el POS puede seguir operando sin turnos abiertos hasta que la UI de Fase 3 lo requiera.';

ALTER TABLE public.cajas              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turnos_caja        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recogidas_efectivo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS caj_select_own ON public.cajas;
CREATE POLICY caj_select_own ON public.cajas FOR SELECT USING (
    empresa_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid()));
DROP POLICY IF EXISTS caj_insert_own ON public.cajas;
CREATE POLICY caj_insert_own ON public.cajas FOR INSERT WITH CHECK (
    empresa_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid()));
DROP POLICY IF EXISTS caj_update_own ON public.cajas;
CREATE POLICY caj_update_own ON public.cajas FOR UPDATE USING (
    empresa_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid())) WITH CHECK (
    empresa_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid()));

DROP POLICY IF EXISTS tc_select_own ON public.turnos_caja;
CREATE POLICY tc_select_own ON public.turnos_caja FOR SELECT USING (
    empresa_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid()));
DROP POLICY IF EXISTS tc_insert_own ON public.turnos_caja;
CREATE POLICY tc_insert_own ON public.turnos_caja FOR INSERT WITH CHECK (
    empresa_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid()));
DROP POLICY IF EXISTS tc_update_own ON public.turnos_caja;
CREATE POLICY tc_update_own ON public.turnos_caja FOR UPDATE USING (
    empresa_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid())) WITH CHECK (
    empresa_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid()));

DROP POLICY IF EXISTS rec_select_own ON public.recogidas_efectivo;
CREATE POLICY rec_select_own ON public.recogidas_efectivo FOR SELECT USING (
    empresa_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid()));
DROP POLICY IF EXISTS rec_insert_own ON public.recogidas_efectivo;
CREATE POLICY rec_insert_own ON public.recogidas_efectivo FOR INSERT WITH CHECK (
    empresa_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid()));
