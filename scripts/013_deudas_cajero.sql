-- ════════════════════════════════════════════════════════════════════════════
-- FASE 1F — Diferencias de caja como deuda del cajero
-- ════════════════════════════════════════════════════════════════════════════
-- El usuario decidió explícitamente (2026-07-21): si al cerrar un turno el
-- efectivo contado es MENOR al esperado (faltante), esa diferencia queda
-- registrada como una deuda a cargo del cajero — mismo patrón que
-- deudas_proveedor/pagos_deuda_proveedor (scripts/010), ahora espejado para
-- cajeros. Si el efectivo contado es MAYOR al esperado (sobrante), NO se
-- crea ninguna deuda ni ingreso automático — solo queda visible en
-- turnos_caja.diferencia como hasta ahora (informativo).
--
-- También reemplaza el cierre de turno: antes `turnos-caja-interface.tsx`
-- hacía un UPDATE directo calculando el saldo esperado en el cliente. Ahora
-- se mueve a una RPC que recalcula el saldo esperado del lado del servidor
-- (a partir de sales/recogidas reales) para que el cierre sea autoritativo
-- y no dependa de un cálculo que el navegador podría tener desactualizado.
--
-- Requiere scripts/010_retail_completo.sql ya ejecutado (turnos_caja, cajas,
-- recogidas_efectivo).
-- ════════════════════════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════════════════════════
-- 1. Tablas: deudas_cajero / pagos_deuda_cajero
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.deudas_cajero (
    id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id       uuid        NOT NULL REFERENCES public.companies(id),
    turno_id         uuid        NOT NULL REFERENCES public.turnos_caja(id),
    cajero_id        uuid        NOT NULL REFERENCES auth.users(id),
    monto_original   numeric(14,2) NOT NULL CHECK (monto_original > 0),
    monto_pagado     numeric(14,2) NOT NULL DEFAULT 0 CHECK (monto_pagado >= 0),
    monto_pendiente  numeric(14,2) GENERATED ALWAYS AS (monto_original - monto_pagado) STORED,
    estado           text        NOT NULL DEFAULT 'pendiente',
    notas            text,
    creado_en        timestamptz NOT NULL DEFAULT now(),
    actualizado_en   timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT deudas_cajero_estado_check CHECK (estado IN ('pendiente', 'parcial', 'pagada', 'cancelada'))
);

CREATE TABLE IF NOT EXISTS public.pagos_deuda_cajero (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    deuda_id    uuid        NOT NULL REFERENCES public.deudas_cajero(id),
    empresa_id  uuid        NOT NULL REFERENCES public.companies(id),
    monto       numeric(14,2) NOT NULL CHECK (monto > 0),
    forma_pago  text        NOT NULL DEFAULT 'efectivo',
    notas       text,
    creado_por  uuid        REFERENCES auth.users(id),
    creado_en   timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT pagos_deuda_cajero_forma_pago_check CHECK (forma_pago IN ('efectivo', 'banco'))
);

CREATE INDEX IF NOT EXISTS idx_deudas_cajero_cajero ON public.deudas_cajero (empresa_id, cajero_id, estado);

COMMENT ON TABLE public.deudas_cajero IS 'Faltante de caja al cerrar un turno, a cargo del cajero. Se crea automáticamente por rpc_cerrar_turno_caja cuando diferencia < 0. Espejo de deudas_proveedor.';
COMMENT ON COLUMN public.deudas_cajero.turno_id IS 'Turno que originó el faltante — trazabilidad hacia qué cierre de caja generó la deuda.';

ALTER TABLE public.deudas_cajero      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos_deuda_cajero ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS dc_select_own ON public.deudas_cajero;
CREATE POLICY dc_select_own ON public.deudas_cajero FOR SELECT USING (
    empresa_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid()));
DROP POLICY IF EXISTS dc_update_own ON public.deudas_cajero;
CREATE POLICY dc_update_own ON public.deudas_cajero FOR UPDATE USING (
    empresa_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid())) WITH CHECK (
    empresa_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid()));
-- Sin política de INSERT directa: solo se crea vía rpc_cerrar_turno_caja
-- (SECURITY DEFINER), nunca por un insert suelto desde el cliente.

DROP POLICY IF EXISTS pdc_select_own ON public.pagos_deuda_cajero;
CREATE POLICY pdc_select_own ON public.pagos_deuda_cajero FOR SELECT USING (
    empresa_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid()));
-- Sin política de INSERT directa: solo se crea vía rpc_registrar_pago_cajero.


-- ════════════════════════════════════════════════════════════════════════════
-- 2. RPC: cerrar turno (recalcula el saldo esperado en el servidor y crea la
--    deuda automáticamente si hay faltante)
-- ════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.rpc_cerrar_turno_caja(
    p_turno_id       uuid,
    p_saldo_contado  numeric,
    p_notas          text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user_id          uuid := auth.uid();
  v_turno            record;
  v_ventas_efectivo  numeric(14,2);
  v_recogidas        numeric(14,2);
  v_saldo_esperado   numeric(14,2);
  v_diferencia       numeric(14,2);
  v_deuda_id         uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  SELECT * INTO v_turno FROM turnos_caja WHERE id = p_turno_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Turno no encontrado';
  END IF;
  IF v_turno.estado = 'cerrado' THEN
    RAISE EXCEPTION 'El turno ya está cerrado';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM user_companies WHERE user_id = v_user_id AND company_id = v_turno.empresa_id) THEN
    RAISE EXCEPTION 'Sin permisos sobre este turno';
  END IF;

  -- Recalcula el saldo esperado del lado del servidor (autoritativo): no
  -- confía en un número que el navegador haya podido tener desactualizado.
  SELECT COALESCE(SUM(total), 0) INTO v_ventas_efectivo
    FROM sales
    WHERE turno_caja_id = p_turno_id AND payment_method = 'efectivo' AND is_credit = false;

  SELECT COALESCE(SUM(monto), 0) INTO v_recogidas
    FROM recogidas_efectivo WHERE turno_id = p_turno_id;

  v_saldo_esperado := v_turno.saldo_apertura + v_ventas_efectivo - v_recogidas;
  v_diferencia     := p_saldo_contado - v_saldo_esperado;

  UPDATE turnos_caja SET
    estado                 = 'cerrado',
    saldo_cierre_esperado  = v_saldo_esperado,
    saldo_cierre_contado   = p_saldo_contado,
    diferencia             = v_diferencia,
    cerrado_en             = now(),
    notas                  = COALESCE(p_notas, notas)
  WHERE id = p_turno_id;

  -- Faltante (diferencia negativa) → deuda automática del cajero.
  -- Sobrante (diferencia positiva) → queda solo como dato informativo, sin
  -- generar ningún registro adicional (decisión explícita del usuario).
  IF v_diferencia < 0 THEN
    INSERT INTO deudas_cajero (empresa_id, turno_id, cajero_id, monto_original, notas)
    VALUES (v_turno.empresa_id, p_turno_id, v_turno.cajero_id, ABS(v_diferencia), 'Faltante de caja al cierre del turno')
    RETURNING id INTO v_deuda_id;
  END IF;

  RETURN jsonb_build_object(
    'saldo_esperado', v_saldo_esperado,
    'diferencia',     v_diferencia,
    'deuda_id',       v_deuda_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_cerrar_turno_caja(uuid, numeric, text) TO authenticated;

COMMENT ON FUNCTION public.rpc_cerrar_turno_caja IS 'Cierra un turno de caja recalculando el saldo esperado en el servidor; si el efectivo contado es menor al esperado, crea automáticamente una deuda_cajero por el faltante.';


-- ════════════════════════════════════════════════════════════════════════════
-- 3. RPC: registrar pago de una deuda de cajero (espejo de
--    rpc_registrar_pago_proveedor, scripts/011)
-- ════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.rpc_registrar_pago_cajero(
    p_deuda_id   uuid,
    p_monto      numeric,
    p_notas      text DEFAULT NULL,
    p_user_id    uuid DEFAULT NULL,
    p_forma_pago text DEFAULT 'efectivo'
) RETURNS public.deudas_cajero
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_deuda   deudas_cajero;
  -- v_user_id se deriva SIEMPRE de auth.uid(), nunca del parámetro p_user_id
  -- (que el cliente controla y podía usarse para saltarse la validación de
  -- empresa — ver fix de seguridad 2026-08, mismo problema que
  -- rpc_registrar_pago_proveedor). p_user_id se conserva en la firma solo
  -- por compatibilidad con las llamadas existentes, pero ya no se usa.
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  IF p_forma_pago NOT IN ('efectivo', 'banco') THEN
    RAISE EXCEPTION 'Forma de pago inválida: %', p_forma_pago;
  END IF;

  SELECT * INTO v_deuda FROM deudas_cajero WHERE id = p_deuda_id FOR UPDATE;

  IF NOT FOUND               THEN RAISE EXCEPTION 'Deuda no encontrada'; END IF;
  IF v_deuda.estado = 'pagada'    THEN RAISE EXCEPTION 'La deuda ya está saldada'; END IF;
  IF v_deuda.estado = 'cancelada' THEN RAISE EXCEPTION 'La deuda está cancelada'; END IF;
  IF p_monto > v_deuda.monto_pendiente THEN
    RAISE EXCEPTION 'El pago (%) supera el saldo pendiente (%)', p_monto, v_deuda.monto_pendiente;
  END IF;

  -- Ya no depende de p_user_id: no se puede saltar pasando null.
  IF NOT EXISTS (
    SELECT 1 FROM user_companies WHERE user_id = v_user_id AND company_id = v_deuda.empresa_id
  ) THEN
    RAISE EXCEPTION 'Sin permisos sobre esta deuda';
  END IF;

  INSERT INTO pagos_deuda_cajero (deuda_id, empresa_id, monto, notas, creado_por, forma_pago)
  VALUES (p_deuda_id, v_deuda.empresa_id, p_monto, p_notas, v_user_id, p_forma_pago);

  UPDATE deudas_cajero SET
    monto_pagado = monto_pagado + p_monto,
    estado = CASE
      WHEN monto_pagado + p_monto >= monto_original THEN 'pagada'
      WHEN monto_pagado + p_monto > 0                THEN 'parcial'
      ELSE 'pendiente'
    END,
    actualizado_en = now()
  WHERE id = p_deuda_id
  RETURNING * INTO v_deuda;

  RETURN v_deuda;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_registrar_pago_cajero(uuid, numeric, text, uuid, text) TO authenticated;

COMMENT ON FUNCTION public.rpc_registrar_pago_cajero IS 'Registra un pago/abono a una deuda por faltante de caja de un cajero (espejo de rpc_registrar_pago_proveedor).';
