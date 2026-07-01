-- ════════════════════════════════════════════════════════════════════════════
-- CIERRE DE MES — Esquema
-- ════════════════════════════════════════════════════════════════════════════
-- Objetivo: cruzar el dinero realmente recibido en el mes contra los gastos,
-- registrar aportes/retiros del dueño, y obtener un SALDO FINAL que se arrastra
-- como SALDO INICIAL del mes siguiente.
--
-- Reglas de negocio (acordadas):
--   • Ingreso   = ventas de contado (sales.is_credit = false) del mes
--                 + abonos cobrados de créditos (debt_payments) del mes.
--   • Gasto     = expenses del mes.
--   • Ajustes   = aportes (+) − retiros (−)  ← movimientos_caja
--   • Saldo final = saldo inicial + ingresos − gastos + ajustes
--
-- IMPORTANTE: el cierre NO ocurre por debajo. No hay triggers ni procesos
-- automáticos. El registro en `cierres_mensuales` se crea únicamente cuando el
-- usuario presiona "Cerrar mes" en la pantalla. El arrastre del saldo consiste
-- simplemente en que el mes siguiente lee el saldo_final del cierre anterior.
--
-- Multi-empresa con RLS por company_id (mismo patrón que customer_debts).
-- Ejecuta este script en el SQL Editor de Supabase.
-- ════════════════════════════════════════════════════════════════════════════

-- ── Tabla: cierres mensuales ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cierres_mensuales (
    id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      uuid          NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
    anio            integer       NOT NULL,                 -- ej. 2026
    mes             integer       NOT NULL,                 -- 1..12
    saldo_inicial   numeric(14,2) NOT NULL DEFAULT 0,       -- arrastrado del mes anterior (o manual el 1er cierre)
    total_ingresos  numeric(14,2) NOT NULL DEFAULT 0,       -- contado + recaudo créditos (snapshot)
    total_gastos    numeric(14,2) NOT NULL DEFAULT 0,       -- gastos del mes (snapshot)
    total_ajustes   numeric(14,2) NOT NULL DEFAULT 0,       -- aportes − retiros (snapshot)
    saldo_final     numeric(14,2) NOT NULL DEFAULT 0,       -- saldo final congelado
    estado          text          NOT NULL DEFAULT 'CERRADO',
    notas           text,
    cerrado_por     uuid          REFERENCES auth.users(id),
    cerrado_at      timestamptz   DEFAULT now(),
    created_at      timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT cierre_mes_check    CHECK (mes >= 1 AND mes <= 12),
    CONSTRAINT cierre_estado_check CHECK (estado IN ('ABIERTO','CERRADO')),
    CONSTRAINT cierre_periodo_uniq UNIQUE (company_id, anio, mes)
);

COMMENT ON TABLE  public.cierres_mensuales IS 'Cierre mensual de caja: saldo inicial + ingresos − gastos + ajustes = saldo final. Se crea solo al presionar "Cerrar mes".';
COMMENT ON COLUMN public.cierres_mensuales.saldo_inicial  IS 'saldo_final del cierre del mes anterior (o manual en el primer cierre).';
COMMENT ON COLUMN public.cierres_mensuales.total_ingresos IS 'Snapshot: ventas de contado + abonos de créditos recibidos en el mes.';
COMMENT ON COLUMN public.cierres_mensuales.total_ajustes  IS 'Snapshot: aportes del dueño (+) menos retiros (−) del mes.';
COMMENT ON COLUMN public.cierres_mensuales.saldo_final    IS 'Saldo final congelado. Se convierte en saldo_inicial del mes siguiente.';

-- ── Tabla: movimientos de caja (aportes / retiros del dueño) ────────────────
CREATE TABLE IF NOT EXISTS public.movimientos_caja (
    id           uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id   uuid          NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
    anio         integer       NOT NULL,
    mes          integer       NOT NULL,
    tipo         text          NOT NULL,                    -- 'APORTE' | 'RETIRO'
    monto        numeric(14,2) NOT NULL,
    descripcion  text,
    fecha        timestamptz   DEFAULT now(),
    created_by   uuid          REFERENCES auth.users(id),
    created_at   timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT movcaja_tipo_check  CHECK (tipo IN ('APORTE','RETIRO')),
    CONSTRAINT movcaja_monto_check CHECK (monto > 0),
    CONSTRAINT movcaja_mes_check   CHECK (mes >= 1 AND mes <= 12)
);

COMMENT ON TABLE public.movimientos_caja IS 'Aportes (+) y retiros (−) de caja del dueño, asociados a un mes del cierre.';

-- ── Índices ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_cierres_mensuales_company ON public.cierres_mensuales USING btree (company_id);
CREATE INDEX IF NOT EXISTS idx_cierres_mensuales_periodo ON public.cierres_mensuales USING btree (company_id, anio, mes);
CREATE INDEX IF NOT EXISTS idx_movimientos_caja_company  ON public.movimientos_caja  USING btree (company_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_caja_periodo  ON public.movimientos_caja  USING btree (company_id, anio, mes);

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE public.cierres_mensuales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_caja  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pol_cierres_mensuales ON public.cierres_mensuales;
CREATE POLICY pol_cierres_mensuales ON public.cierres_mensuales
    USING (company_id IN (
        SELECT user_companies.company_id FROM public.user_companies
        WHERE user_companies.user_id = auth.uid()
    ))
    WITH CHECK (company_id IN (
        SELECT user_companies.company_id FROM public.user_companies
        WHERE user_companies.user_id = auth.uid()
    ));

DROP POLICY IF EXISTS pol_movimientos_caja ON public.movimientos_caja;
CREATE POLICY pol_movimientos_caja ON public.movimientos_caja
    USING (company_id IN (
        SELECT user_companies.company_id FROM public.user_companies
        WHERE user_companies.user_id = auth.uid()
    ))
    WITH CHECK (company_id IN (
        SELECT user_companies.company_id FROM public.user_companies
        WHERE user_companies.user_id = auth.uid()
    ));
