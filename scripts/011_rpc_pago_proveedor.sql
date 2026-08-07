-- ════════════════════════════════════════════════════════════════════════════
-- FASE 1D — RPC mínima para poder abonar cuentas por pagar a proveedor
-- ════════════════════════════════════════════════════════════════════════════
-- Necesaria para que la pantalla de Fase 3 ("Cuentas por pagar a proveedor")
-- pueda registrar pagos sin condiciones de carrera — mismo patrón que ya usa
-- `register_debt_payment` para las deudas de clientes
-- (scripts/cierre_formas_pago.sql:84). Sin este RPC la UI tendría que hacer
-- un UPDATE manual de monto_pagado desde el cliente, lo cual no es seguro si
-- dos personas registran un pago al mismo tiempo (condición de carrera).
--
-- Requiere scripts/010_retail_completo.sql ya ejecutado (tablas
-- deudas_proveedor / pagos_deuda_proveedor).
-- ════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.rpc_registrar_pago_proveedor(
    p_deuda_id   uuid,
    p_monto      numeric,
    p_notas      text DEFAULT NULL,
    p_user_id    uuid DEFAULT NULL,
    p_forma_pago text DEFAULT 'efectivo'
) RETURNS public.deudas_proveedor
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_deuda   deudas_proveedor;
  -- v_user_id se deriva SIEMPRE de auth.uid(), nunca del parámetro p_user_id
  -- (que el cliente controla y podía usarse para saltarse la validación de
  -- empresa — ver fix de seguridad 2026-08). p_user_id se conserva en la
  -- firma solo por compatibilidad con las llamadas existentes, pero ya no
  -- se usa para nada.
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  IF p_forma_pago NOT IN ('efectivo', 'banco') THEN
    RAISE EXCEPTION 'Forma de pago inválida: %', p_forma_pago;
  END IF;

  -- Lock para evitar condiciones de carrera (dos pagos simultáneos)
  SELECT * INTO v_deuda FROM deudas_proveedor WHERE id = p_deuda_id FOR UPDATE;

  IF NOT FOUND               THEN RAISE EXCEPTION 'Deuda no encontrada'; END IF;
  IF v_deuda.estado = 'pagada'    THEN RAISE EXCEPTION 'La deuda ya está saldada'; END IF;
  IF v_deuda.estado = 'cancelada' THEN RAISE EXCEPTION 'La deuda está cancelada'; END IF;
  IF p_monto > v_deuda.monto_pendiente THEN
    RAISE EXCEPTION 'El pago (%) supera el saldo pendiente (%)', p_monto, v_deuda.monto_pendiente;
  END IF;

  -- Defensa independiente de RLS (mismo patrón que rpc_registrar_devolucion):
  -- el usuario autenticado real (v_user_id) debe pertenecer a la empresa
  -- dueña de la deuda. Esta validación ya NO se puede saltar pasando
  -- p_user_id = null, porque no depende de ese parámetro.
  IF NOT EXISTS (
    SELECT 1 FROM user_companies WHERE user_id = v_user_id AND company_id = v_deuda.empresa_id
  ) THEN
    RAISE EXCEPTION 'Sin permisos sobre esta deuda';
  END IF;

  INSERT INTO pagos_deuda_proveedor (deuda_id, empresa_id, monto, notas, creado_por, forma_pago)
  VALUES (p_deuda_id, v_deuda.empresa_id, p_monto, p_notas, v_user_id, p_forma_pago);

  -- monto_pendiente es columna generada (monto_original - monto_pagado), se
  -- recalcula sola al actualizar monto_pagado — no se toca directamente.
  UPDATE deudas_proveedor SET
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

GRANT EXECUTE ON FUNCTION public.rpc_registrar_pago_proveedor(uuid, numeric, text, uuid, text) TO authenticated;

COMMENT ON FUNCTION public.rpc_registrar_pago_proveedor IS 'Registra un pago/abono a una deuda con proveedor de forma atómica (espejo de register_debt_payment). Usado por components/supplier-debts-interface.tsx.';
