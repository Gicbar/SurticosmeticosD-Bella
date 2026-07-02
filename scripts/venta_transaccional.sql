-- ════════════════════════════════════════════════════════════════════════════
-- POS — Venta transaccional (todo-o-nada) + idempotencia
-- ════════════════════════════════════════════════════════════════════════════
-- Objetivo: registrar una venta de forma ATÓMICA. Hoy el POS hace varios inserts
-- sueltos (sales, sale_items, purchase_batches, inventory_movements, sales_profit,
-- customer_debts). Si falla a mitad de camino, queda una venta parcial y un
-- reintento podía duplicarla. Con esta función todo ocurre dentro de UNA sola
-- transacción: si algo falla, se revierte TODO.
--
-- Idempotencia: el cliente envía un `venta_uid` (uuid) por intento de venta. Si
-- llega dos veces el mismo uid (p. ej. reintento tras un error de red donde la
-- venta sí se guardó), la función NO duplica: devuelve la venta ya creada.
--
-- Ejecuta este script en el SQL Editor de Supabase. Es idempotente.
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. Clave de idempotencia en sales ───────────────────────────────────────
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS venta_uid uuid;

CREATE UNIQUE INDEX IF NOT EXISTS uq_sales_company_venta_uid
  ON public.sales (company_id, venta_uid) WHERE venta_uid IS NOT NULL;

COMMENT ON COLUMN public.sales.venta_uid IS 'Clave de idempotencia generada por el POS por intento de venta; evita duplicados en reintentos.';

-- ── 2. Función transaccional ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.rpc_registrar_venta(
  p_company_id       uuid,
  p_client_id        uuid,
  p_payment_method   text,
  p_is_credit        boolean,
  p_items            jsonb,      -- [{product_id, quantity, unit_price}, ...]
  p_venta_uid        uuid,
  p_catalog_order_id uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user_id    uuid := auth.uid();
  v_sale_id    uuid;
  v_existing   uuid;
  v_total      numeric(14,2) := 0;
  v_total_cost numeric(14,2) := 0;
  v_item       jsonb;
  v_product_id uuid;
  v_qty        integer;
  v_unit_price numeric(14,2);
  v_remaining  integer;
  v_take       integer;
  v_batch      record;
BEGIN
  -- Seguridad: usuario autenticado y perteneciente a la empresa
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM user_companies
                 WHERE user_id = v_user_id AND company_id = p_company_id) THEN
    RAISE EXCEPTION 'Sin permisos sobre la empresa';
  END IF;

  -- Idempotencia (chequeo previo): si ya existe, devolver sin duplicar
  IF p_venta_uid IS NOT NULL THEN
    SELECT id INTO v_existing FROM sales
      WHERE company_id = p_company_id AND venta_uid = p_venta_uid;
    IF v_existing IS NOT NULL THEN
      RETURN jsonb_build_object('sale_id', v_existing, 'duplicada', true);
    END IF;
  END IF;

  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'La venta no tiene productos';
  END IF;

  -- Total autoritativo desde los items (no se confía en el cliente)
  SELECT COALESCE(SUM((it->>'quantity')::int * (it->>'unit_price')::numeric), 0)
    INTO v_total
  FROM jsonb_array_elements(p_items) it;

  IF v_total <= 0 THEN
    RAISE EXCEPTION 'Total inválido';
  END IF;

  -- Insertar venta. Si dos reintentos concurrentes chocan en venta_uid, el
  -- perdedor captura la unique_violation y devuelve la venta ganadora.
  BEGIN
    INSERT INTO sales (client_id, total, payment_method, is_credit,
                       created_by, company_id, venta_uid)
    VALUES (p_client_id, v_total,
            CASE WHEN p_is_credit THEN 'credito' ELSE p_payment_method END,
            p_is_credit, v_user_id, p_company_id, p_venta_uid)
    RETURNING id INTO v_sale_id;
  EXCEPTION WHEN unique_violation THEN
    SELECT id INTO v_existing FROM sales
      WHERE company_id = p_company_id AND venta_uid = p_venta_uid;
    RETURN jsonb_build_object('sale_id', v_existing, 'duplicada', true);
  END;

  -- Recorrer items: descuento FIFO de lotes con bloqueo (evita sobreventa)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_qty        := (v_item->>'quantity')::int;
    v_unit_price := (v_item->>'unit_price')::numeric;
    IF v_qty <= 0 THEN
      RAISE EXCEPTION 'Cantidad inválida para el producto %', v_product_id;
    END IF;
    v_remaining := v_qty;

    FOR v_batch IN
      SELECT id, remaining_quantity, purchase_price
      FROM purchase_batches
      WHERE product_id = v_product_id AND company_id = p_company_id
        AND remaining_quantity > 0
      ORDER BY purchase_date ASC
      FOR UPDATE
    LOOP
      EXIT WHEN v_remaining <= 0;
      v_take := LEAST(v_batch.remaining_quantity, v_remaining);
      UPDATE purchase_batches
        SET remaining_quantity = remaining_quantity - v_take
        WHERE id = v_batch.id;
      INSERT INTO sale_items (sale_id, product_id, batch_id, quantity,
                              unit_price, subtotal, company_id)
      VALUES (v_sale_id, v_product_id, v_batch.id, v_take,
              v_unit_price, v_take * v_unit_price, p_company_id);
      v_total_cost := v_total_cost + v_take * v_batch.purchase_price;
      v_remaining  := v_remaining - v_take;
    END LOOP;

    IF v_remaining > 0 THEN
      RAISE EXCEPTION 'Stock insuficiente para el producto %', v_product_id;
    END IF;

    INSERT INTO inventory_movements (product_id, movement_type, quantity,
                                     reason, created_by, company_id)
    VALUES (v_product_id, 'salida', v_qty, 'Venta #' || v_sale_id,
            v_user_id, p_company_id);
  END LOOP;

  -- Rentabilidad
  INSERT INTO sales_profit (sale_id, total_cost, total_sale, profit,
                            profit_margin, company_id)
  VALUES (v_sale_id, v_total_cost, v_total, v_total - v_total_cost,
          CASE WHEN v_total > 0 THEN ((v_total - v_total_cost) / v_total) * 100 ELSE 0 END,
          p_company_id);

  -- Crédito → crear deuda
  IF p_is_credit THEN
    INSERT INTO customer_debts (company_id, sale_id, client_id,
                                original_amount, status, created_by)
    VALUES (p_company_id, v_sale_id, p_client_id, v_total, 'pending', v_user_id);
  END IF;

  -- Pedido del catálogo (best-effort: si falla NO tumba la venta)
  IF p_catalog_order_id IS NOT NULL THEN
    BEGIN
      PERFORM rpc_marcar_pedido_reclamado(p_catalog_order_id, v_sale_id);
    EXCEPTION WHEN OTHERS THEN
      NULL;  -- se ignora; la venta ya quedó registrada
    END;
  END IF;

  RETURN jsonb_build_object('sale_id', v_sale_id, 'total', v_total, 'duplicada', false);
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_registrar_venta(uuid, uuid, text, boolean, jsonb, uuid, uuid) TO authenticated;
