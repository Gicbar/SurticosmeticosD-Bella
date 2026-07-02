-- ════════════════════════════════════════════════════════════════════════════
-- CIERRE DE MES — Discriminar EFECTIVO (negocio) vs BANCO (transferencia+tarjeta)
-- ════════════════════════════════════════════════════════════════════════════
-- Objetivo: llevar DOS saldos separados en el cierre mensual —
--   • 💵 NEGOCIO (efectivo): dinero físico en caja.
--   • 🏦 BANCO: dinero en cuentas (transferencias + tarjeta/datáfono).
-- Cada uno se arrastra de forma independiente al mes siguiente, para saber en
-- todo momento cuánto hay en el banco y cuánto en el negocio.
--
-- Regla de agrupación (dónde cae el dinero):
--   • Ventas    → sales.payment_method:  'efectivo' = negocio;
--                 'transferencia' y 'tarjeta' = banco.
--   • Abonos    → debt_payments.forma_pago  ('efectivo' | 'banco')
--   • Gastos    → expenses.forma_pago       ('efectivo' | 'banco')
--   • Ajustes   → movimientos_caja.forma_pago ('efectivo' | 'banco')
--
-- Ejecuta este script en el SQL Editor de Supabase. Es idempotente y aditivo:
-- las columnas nuevas tienen DEFAULT 'efectivo'/0 para no romper datos previos.
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. forma_pago en los movimientos de dinero ──────────────────────────────
ALTER TABLE public.debt_payments
    ADD COLUMN IF NOT EXISTS forma_pago text NOT NULL DEFAULT 'efectivo';
ALTER TABLE public.expenses
    ADD COLUMN IF NOT EXISTS forma_pago text NOT NULL DEFAULT 'efectivo';
ALTER TABLE public.movimientos_caja
    ADD COLUMN IF NOT EXISTS forma_pago text NOT NULL DEFAULT 'efectivo';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'debt_payments_forma_pago_check') THEN
        ALTER TABLE public.debt_payments
            ADD CONSTRAINT debt_payments_forma_pago_check CHECK (forma_pago IN ('efectivo','banco'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'expenses_forma_pago_check') THEN
        ALTER TABLE public.expenses
            ADD CONSTRAINT expenses_forma_pago_check CHECK (forma_pago IN ('efectivo','banco'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'movimientos_caja_forma_pago_check') THEN
        ALTER TABLE public.movimientos_caja
            ADD CONSTRAINT movimientos_caja_forma_pago_check CHECK (forma_pago IN ('efectivo','banco'));
    END IF;
END $$;

COMMENT ON COLUMN public.debt_payments.forma_pago   IS 'Bolsa donde entró el abono: efectivo (negocio) | banco.';
COMMENT ON COLUMN public.expenses.forma_pago        IS 'Bolsa de donde salió el gasto: efectivo (negocio) | banco.';
COMMENT ON COLUMN public.movimientos_caja.forma_pago IS 'Bolsa del aporte/retiro: efectivo (negocio) | banco.';

-- ── 2. Columnas de desglose en el cierre mensual ────────────────────────────
-- Se conservan las columnas totales antiguas (saldo_inicial, total_ingresos,
-- total_gastos, total_ajustes, saldo_final) como el TOTAL de ambas bolsas.
ALTER TABLE public.cierres_mensuales
    ADD COLUMN IF NOT EXISTS saldo_inicial_efectivo numeric(14,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS saldo_inicial_banco    numeric(14,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS ingresos_efectivo      numeric(14,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS ingresos_banco         numeric(14,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS gastos_efectivo        numeric(14,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS gastos_banco           numeric(14,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS ajustes_efectivo       numeric(14,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS ajustes_banco          numeric(14,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS saldo_final_efectivo   numeric(14,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS saldo_final_banco      numeric(14,2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.cierres_mensuales.saldo_inicial_efectivo IS 'Saldo inicial de la bolsa NEGOCIO (efectivo).';
COMMENT ON COLUMN public.cierres_mensuales.saldo_inicial_banco    IS 'Saldo inicial de la bolsa BANCO (transferencia+tarjeta).';
COMMENT ON COLUMN public.cierres_mensuales.saldo_final_efectivo   IS 'Saldo final NEGOCIO. Se arrastra como saldo_inicial_efectivo del mes siguiente.';
COMMENT ON COLUMN public.cierres_mensuales.saldo_final_banco      IS 'Saldo final BANCO. Se arrastra como saldo_inicial_banco del mes siguiente.';

-- Backfill de cierres ya existentes: antes de esta función no se distinguía
-- banco, así que todo el saldo histórico se asigna a la bolsa NEGOCIO.
UPDATE public.cierres_mensuales
SET saldo_inicial_efectivo = saldo_inicial,
    ingresos_efectivo      = total_ingresos,
    gastos_efectivo        = total_gastos,
    ajustes_efectivo       = total_ajustes,
    saldo_final_efectivo   = saldo_final
WHERE saldo_final_efectivo = 0
  AND saldo_final_banco    = 0
  AND saldo_final         <> 0;

-- ── 3. RPC register_debt_payment con forma de pago ──────────────────────────
DROP FUNCTION IF EXISTS public.register_debt_payment(uuid, numeric, text, uuid);

CREATE FUNCTION public.register_debt_payment(
    p_debt_id    uuid,
    p_amount     numeric,
    p_notes      text DEFAULT NULL::text,
    p_user_id    uuid DEFAULT NULL::uuid,
    p_forma_pago text DEFAULT 'efectivo'
) RETURNS public.customer_debts
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE v_debt customer_debts;
BEGIN
  IF p_forma_pago NOT IN ('efectivo','banco') THEN
    RAISE EXCEPTION 'Forma de pago inválida: %', p_forma_pago;
  END IF;

  -- Lock para evitar race conditions
  SELECT * INTO v_debt FROM customer_debts WHERE id = p_debt_id FOR UPDATE;

  IF NOT FOUND          THEN RAISE EXCEPTION 'Deuda no encontrada'; END IF;
  IF v_debt.status = 'paid'       THEN RAISE EXCEPTION 'La deuda ya está saldada'; END IF;
  IF v_debt.status = 'cancelled'  THEN RAISE EXCEPTION 'La deuda está cancelada'; END IF;
  IF p_amount > v_debt.remaining_amount
    THEN RAISE EXCEPTION 'El abono (%) supera el saldo pendiente (%)', p_amount, v_debt.remaining_amount;
  END IF;

  -- Registrar el abono
  INSERT INTO debt_payments (debt_id, company_id, amount, notes, created_by, forma_pago)
  VALUES (p_debt_id, v_debt.company_id, p_amount, p_notes, p_user_id, p_forma_pago);

  -- Actualizar deuda
  UPDATE customer_debts SET
    paid_amount = paid_amount + p_amount,
    status = CASE
      WHEN paid_amount + p_amount >= original_amount THEN 'paid'
      WHEN paid_amount + p_amount > 0               THEN 'partial'
      ELSE 'pending'
    END,
    paid_at = CASE
      WHEN paid_amount + p_amount >= original_amount THEN NOW()
      ELSE NULL
    END
  WHERE id = p_debt_id
  RETURNING * INTO v_debt;

  RETURN v_debt;
END;
$$;

ALTER FUNCTION public.register_debt_payment(uuid, numeric, text, uuid, text) OWNER TO postgres;
GRANT ALL ON FUNCTION public.register_debt_payment(uuid, numeric, text, uuid, text) TO anon;
GRANT ALL ON FUNCTION public.register_debt_payment(uuid, numeric, text, uuid, text) TO authenticated;
GRANT ALL ON FUNCTION public.register_debt_payment(uuid, numeric, text, uuid, text) TO service_role;

-- ── 4. Índices auxiliares (opcional, aceleran el desglose del cierre) ────────
CREATE INDEX IF NOT EXISTS idx_debt_payments_forma_pago ON public.debt_payments USING btree (company_id, forma_pago);
CREATE INDEX IF NOT EXISTS idx_expenses_forma_pago      ON public.expenses      USING btree (company_id, forma_pago);
