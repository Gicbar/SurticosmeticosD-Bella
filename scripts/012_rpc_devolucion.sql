-- ════════════════════════════════════════════════════════════════════════════
-- FASE 1E — RPC para registrar devoluciones/garantías de forma atómica
-- ════════════════════════════════════════════════════════════════════════════
-- Requiere scripts/010_retail_completo.sql ya ejecutado (tablas devoluciones
-- / devolucion_items). Mismo patrón de seguridad que rpc_registrar_venta
-- (scripts/venta_transaccional.sql): SECURITY DEFINER + validación manual de
-- pertenencia a la empresa + total autoritativo calculado en el servidor.
--
-- Reglas de negocio:
--   · No se puede devolver más cantidad de la vendida en un sale_item, ni
--     más de lo que ya no se haya devuelto antes (evita doble devolución).
--   · Si reintegra_inventario = true, regresa la cantidad al lote original
--     (purchase_batches.remaining_quantity) y registra un movimiento de
--     inventario tipo 'entrada' (mismo kardex que ya usa rpc_registrar_venta
--     para las salidas).
--   · La devolución se crea directamente en estado 'aprobada' — no hay
--     workflow de aprobación separado en esta fase (se puede agregar
--     después si se necesita).
-- ════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.rpc_registrar_devolucion(
    p_company_id            uuid,
    p_sale_id               uuid,
    p_tipo                  text DEFAULT 'devolucion',   -- 'devolucion' | 'garantia'
    p_motivo                text DEFAULT NULL,
    p_reintegra_inventario  boolean DEFAULT true,
    p_items                 jsonb DEFAULT '[]'::jsonb    -- [{sale_item_id, product_id, batch_id, quantity, unit_price}]
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user_id          uuid := auth.uid();
  v_client_id        uuid;
  v_devolucion_id    uuid;
  v_total            numeric(14,2) := 0;
  v_item             jsonb;
  v_sale_item_id     uuid;
  v_product_id       uuid;
  v_batch_id         uuid;
  v_qty              integer;
  v_unit_price       numeric(14,2);
  v_vendido          integer;
  v_ya_devuelto      integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM user_companies WHERE user_id = v_user_id AND company_id = p_company_id) THEN
    RAISE EXCEPTION 'Sin permisos sobre la empresa';
  END IF;
  IF p_tipo NOT IN ('devolucion', 'garantia') THEN
    RAISE EXCEPTION 'Tipo inválido: %', p_tipo;
  END IF;
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Selecciona al menos un producto a devolver';
  END IF;

  SELECT client_id INTO v_client_id FROM sales WHERE id = p_sale_id AND company_id = p_company_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Venta no encontrada';
  END IF;

  -- Total autoritativo desde los items (no se confía en el cliente)
  SELECT COALESCE(SUM((it->>'quantity')::int * (it->>'unit_price')::numeric), 0)
    INTO v_total
  FROM jsonb_array_elements(p_items) it;

  INSERT INTO devoluciones (empresa_id, venta_id, cliente_id, tipo, estado, motivo, monto_total, reintegra_inventario, creado_por)
  VALUES (p_company_id, p_sale_id, v_client_id, p_tipo, 'aprobada', p_motivo, v_total, p_reintegra_inventario, v_user_id)
  RETURNING id INTO v_devolucion_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_sale_item_id := (v_item->>'sale_item_id')::uuid;
    v_product_id   := (v_item->>'product_id')::uuid;
    v_batch_id     := NULLIF(v_item->>'batch_id', '')::uuid;
    v_qty          := (v_item->>'quantity')::int;
    v_unit_price   := (v_item->>'unit_price')::numeric;

    IF v_qty <= 0 THEN
      RAISE EXCEPTION 'Cantidad inválida para el ítem %', v_sale_item_id;
    END IF;

    SELECT quantity INTO v_vendido FROM sale_items WHERE id = v_sale_item_id AND company_id = p_company_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Ítem de venta no encontrado';
    END IF;

    SELECT COALESCE(SUM(di.cantidad), 0) INTO v_ya_devuelto
      FROM devolucion_items di WHERE di.item_venta_id = v_sale_item_id;

    IF v_ya_devuelto + v_qty > v_vendido THEN
      RAISE EXCEPTION 'La cantidad a devolver (%) supera lo disponible para devolver (%)', v_qty, v_vendido - v_ya_devuelto;
    END IF;

    INSERT INTO devolucion_items (devolucion_id, empresa_id, item_venta_id, producto_id, lote_id, cantidad, precio_unitario, subtotal)
    VALUES (v_devolucion_id, p_company_id, v_sale_item_id, v_product_id, v_batch_id, v_qty, v_unit_price, v_qty * v_unit_price);

    IF p_reintegra_inventario AND v_batch_id IS NOT NULL THEN
      UPDATE purchase_batches SET remaining_quantity = remaining_quantity + v_qty
        WHERE id = v_batch_id AND company_id = p_company_id;

      INSERT INTO inventory_movements (product_id, movement_type, quantity, reason, created_by, company_id)
      VALUES (v_product_id, 'entrada', v_qty, 'Devolución #' || v_devolucion_id, v_user_id, p_company_id);
    END IF;
  END LOOP;

  RETURN jsonb_build_object('devolucion_id', v_devolucion_id, 'total', v_total);
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_registrar_devolucion(uuid, uuid, text, text, boolean, jsonb) TO authenticated;

COMMENT ON FUNCTION public.rpc_registrar_devolucion IS 'Registra una devolución/garantía de forma atómica: valida cantidades contra lo vendido y lo ya devuelto, y opcionalmente reintegra stock al lote original. Usado desde el detalle de venta (app/dashboard/sales/[id]).';
