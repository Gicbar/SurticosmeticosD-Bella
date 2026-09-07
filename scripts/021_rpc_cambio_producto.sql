-- ════════════════════════════════════════════════════════════════════════════
-- Cambio de producto sobre una venta ya registrada
-- ════════════════════════════════════════════════════════════════════════════
-- Caso de uso: el cliente se equivocó de producto al comprar y vuelve a
-- cambiarlo por otro (la venta ya está hecha, no es una devolución de dinero).
-- A diferencia de rpc_registrar_devolucion (scripts/012_rpc_devolucion.sql),
-- aquí SIEMPRE hay dos movimientos de inventario: el producto original
-- regresa al lote del que salió y el producto nuevo se descuenta por FIFO
-- (mismo patrón que rpc_registrar_venta, scripts/venta_transaccional.sql).
--
-- Reglas de negocio:
--   · No se puede cambiar más cantidad de la vendida en un sale_item, ni más
--     de lo que ya no se haya devuelto/cambiado antes (misma protección que
--     ya existe para devoluciones, extendida para sumar ambos orígenes).
--   · El producto nuevo se registra como sale_item(s) adicional(es) de la
--     misma venta (uno por lote consumido si el FIFO abarca varios lotes),
--     marcados con cambio_origen_id para distinguirlos de los ítems
--     originales y para poder encadenar un cambio sobre un cambio.
--   · Si el precio del producto nuevo difiere del original, se ajusta
--     sales.total y sales_profit, y se genera automáticamente una nota
--     débito (el cliente queda debiendo la diferencia) o nota crédito (queda
--     a favor del cliente) — mismas tablas que las notas manuales que ya
--     existen en el detalle de venta.
--   · El cambio queda en estado definitivo (no hay workflow de aprobación),
--     igual que las devoluciones de esta fase.
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. Tabla de cambios de producto ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cambios_producto (
    id                        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id                uuid        NOT NULL REFERENCES public.companies(id),
    venta_id                  uuid        NOT NULL REFERENCES public.sales(id),
    cliente_id                uuid        REFERENCES public.clients(id),
    item_venta_id             uuid        NOT NULL REFERENCES public.sale_items(id),
    producto_anterior_id      uuid        NOT NULL REFERENCES public.products(id),
    producto_nuevo_id         uuid        NOT NULL REFERENCES public.products(id),
    cantidad                  integer     NOT NULL CHECK (cantidad > 0),
    precio_unitario_anterior  numeric(14,2) NOT NULL,
    precio_unitario_nuevo     numeric(14,2) NOT NULL,
    diferencia                numeric(14,2) NOT NULL DEFAULT 0,
    motivo                    text        NOT NULL,
    creado_por                uuid        REFERENCES auth.users(id),
    creado_en                 timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cambios_producto_empresa_venta ON public.cambios_producto (empresa_id, venta_id);
CREATE INDEX IF NOT EXISTS idx_cambios_producto_item_venta ON public.cambios_producto (item_venta_id);

COMMENT ON TABLE public.cambios_producto IS 'Cambio de un producto por otro sobre una venta ya registrada (el cliente se equivocó de producto). Reintegra al inventario el producto original y descuenta por FIFO el producto nuevo; diferencia es (precio_nuevo - precio_anterior) * cantidad y se refleja en sales.total.';

ALTER TABLE public.cambios_producto ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cp_select_own ON public.cambios_producto;
CREATE POLICY cp_select_own ON public.cambios_producto FOR SELECT USING (
    empresa_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid()));
DROP POLICY IF EXISTS cp_insert_own ON public.cambios_producto;
CREATE POLICY cp_insert_own ON public.cambios_producto FOR INSERT WITH CHECK (
    empresa_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid()));

-- ── 2. sale_items: marca de origen para los ítems creados por un cambio ────
ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS cambio_origen_id uuid REFERENCES public.cambios_producto(id);

COMMENT ON COLUMN public.sale_items.cambio_origen_id IS 'NULL = ítem original de la venta. No nulo = este ítem fue agregado por un cambio de producto (ver cambios_producto).';

-- ── 3. Función transaccional ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.rpc_cambiar_producto_venta(
    p_company_id        uuid,
    p_sale_id           uuid,
    p_sale_item_id      uuid,
    p_producto_nuevo_id uuid,
    p_cantidad          integer,
    p_motivo            text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user_id              uuid := auth.uid();
  v_client_id            uuid;
  v_producto_anterior_id uuid;
  v_batch_anterior_id    uuid;
  v_precio_anterior      numeric(14,2);
  v_vendido              integer;
  v_ya_consumido         integer;
  v_precio_nuevo         numeric(14,2);
  v_costo_anterior       numeric(14,2);
  v_remaining            integer;
  v_take                 integer;
  v_batch                record;
  v_cambio_id            uuid := gen_random_uuid();
  v_total_cost_nuevo     numeric(14,2) := 0;
  v_diferencia           numeric(14,2);
  v_delta_costo          numeric(14,2);
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM user_companies WHERE user_id = v_user_id AND company_id = p_company_id) THEN
    RAISE EXCEPTION 'Sin permisos sobre la empresa';
  END IF;
  IF p_cantidad IS NULL OR p_cantidad <= 0 THEN
    RAISE EXCEPTION 'Cantidad inválida';
  END IF;
  IF p_motivo IS NULL OR btrim(p_motivo) = '' THEN
    RAISE EXCEPTION 'Indica el motivo del cambio';
  END IF;

  SELECT client_id INTO v_client_id FROM sales WHERE id = p_sale_id AND company_id = p_company_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Venta no encontrada';
  END IF;

  SELECT product_id, batch_id, quantity, unit_price
    INTO v_producto_anterior_id, v_batch_anterior_id, v_vendido, v_precio_anterior
    FROM sale_items WHERE id = p_sale_item_id AND sale_id = p_sale_id AND company_id = p_company_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ítem de venta no encontrado';
  END IF;

  IF p_producto_nuevo_id = v_producto_anterior_id THEN
    RAISE EXCEPTION 'El producto nuevo debe ser diferente al original';
  END IF;

  -- Cantidad ya consumida de este ítem por devoluciones previas O cambios previos
  SELECT COALESCE(SUM(cantidad), 0) INTO v_ya_consumido FROM (
    SELECT cantidad FROM devolucion_items WHERE item_venta_id = p_sale_item_id
    UNION ALL
    SELECT cantidad FROM cambios_producto WHERE item_venta_id = p_sale_item_id
  ) consumido;

  IF v_ya_consumido + p_cantidad > v_vendido THEN
    RAISE EXCEPTION 'La cantidad a cambiar (%) supera lo disponible (%)', p_cantidad, v_vendido - v_ya_consumido;
  END IF;

  SELECT sale_price INTO v_precio_nuevo
    FROM products WHERE id = p_producto_nuevo_id AND company_id = p_company_id AND deleted_at IS NULL;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Producto nuevo no encontrado o inactivo';
  END IF;

  SELECT purchase_price INTO v_costo_anterior FROM purchase_batches WHERE id = v_batch_anterior_id;

  -- La diferencia de precio no depende del costo (que solo se conoce tras el FIFO),
  -- así que se calcula ya para poder insertar cambios_producto ANTES que los
  -- sale_items nuevos: estos referencian cambios_producto.id por FK y esa fila
  -- debe existir primero (si no, "sale_items_cambio_origen_id_fkey" falla).
  v_diferencia := (p_cantidad * v_precio_nuevo) - (p_cantidad * v_precio_anterior);

  INSERT INTO cambios_producto (
      id, empresa_id, venta_id, cliente_id, item_venta_id,
      producto_anterior_id, producto_nuevo_id, cantidad,
      precio_unitario_anterior, precio_unitario_nuevo, diferencia, motivo, creado_por
  ) VALUES (
      v_cambio_id, p_company_id, p_sale_id, v_client_id, p_sale_item_id,
      v_producto_anterior_id, p_producto_nuevo_id, p_cantidad,
      v_precio_anterior, v_precio_nuevo, v_diferencia, btrim(p_motivo), v_user_id
  );

  -- 1) Reintegrar al inventario el producto anterior, al mismo lote de origen
  UPDATE purchase_batches SET remaining_quantity = remaining_quantity + p_cantidad
    WHERE id = v_batch_anterior_id AND company_id = p_company_id;

  INSERT INTO inventory_movements (product_id, movement_type, quantity, reason, created_by, company_id)
  VALUES (v_producto_anterior_id, 'entrada', p_cantidad, 'Cambio de producto #' || v_cambio_id || ' · producto devuelto', v_user_id, p_company_id);

  -- 2) Descontar el producto nuevo por FIFO (mismo patrón que rpc_registrar_venta)
  v_remaining := p_cantidad;
  FOR v_batch IN
    SELECT id, remaining_quantity, purchase_price
    FROM purchase_batches
    WHERE product_id = p_producto_nuevo_id AND company_id = p_company_id
      AND remaining_quantity > 0
    ORDER BY purchase_date ASC
    FOR UPDATE
  LOOP
    EXIT WHEN v_remaining <= 0;
    v_take := LEAST(v_batch.remaining_quantity, v_remaining);
    UPDATE purchase_batches SET remaining_quantity = remaining_quantity - v_take WHERE id = v_batch.id;
    INSERT INTO sale_items (sale_id, product_id, batch_id, quantity, unit_price, subtotal, company_id, cambio_origen_id)
    VALUES (p_sale_id, p_producto_nuevo_id, v_batch.id, v_take, v_precio_nuevo, v_take * v_precio_nuevo, p_company_id, v_cambio_id);
    v_total_cost_nuevo := v_total_cost_nuevo + v_take * v_batch.purchase_price;
    v_remaining := v_remaining - v_take;
  END LOOP;

  IF v_remaining > 0 THEN
    RAISE EXCEPTION 'Stock insuficiente del producto nuevo para completar el cambio';
  END IF;

  INSERT INTO inventory_movements (product_id, movement_type, quantity, reason, created_by, company_id)
  VALUES (p_producto_nuevo_id, 'salida', p_cantidad, 'Cambio de producto #' || v_cambio_id || ' · producto entregado', v_user_id, p_company_id);

  v_delta_costo := v_total_cost_nuevo - (p_cantidad * COALESCE(v_costo_anterior, 0));

  -- 3) Ajustar el total y la rentabilidad de la venta
  UPDATE sales SET total = total + v_diferencia WHERE id = p_sale_id AND company_id = p_company_id;

  UPDATE sales_profit SET
      total_cost    = total_cost + v_delta_costo,
      total_sale    = total_sale + v_diferencia,
      profit        = (total_sale + v_diferencia) - (total_cost + v_delta_costo),
      profit_margin = CASE WHEN (total_sale + v_diferencia) > 0
                            THEN (((total_sale + v_diferencia) - (total_cost + v_delta_costo)) / (total_sale + v_diferencia)) * 100
                            ELSE 0 END
    WHERE sale_id = p_sale_id AND company_id = p_company_id;

  -- 4) Nota crédito/débito automática por la diferencia de precio (interna, no DIAN)
  IF v_diferencia > 0 THEN
    INSERT INTO notas_debito (empresa_id, venta_id, cliente_id, concepto, valor, creado_por)
    VALUES (p_company_id, p_sale_id, v_client_id,
            'Cambio de producto · diferencia a cargo del cliente (' || p_cantidad || ' un.)', v_diferencia, v_user_id);
  ELSIF v_diferencia < 0 THEN
    INSERT INTO notas_credito (empresa_id, venta_id, concepto, valor, creado_por)
    VALUES (p_company_id, p_sale_id,
            'Cambio de producto · diferencia a favor del cliente (' || p_cantidad || ' un.)', ABS(v_diferencia), v_user_id);
  END IF;

  RETURN jsonb_build_object('cambio_id', v_cambio_id, 'diferencia', v_diferencia);
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_cambiar_producto_venta(uuid, uuid, uuid, uuid, integer, text) TO authenticated;

COMMENT ON FUNCTION public.rpc_cambiar_producto_venta IS 'Cambia un producto de una venta ya registrada por otro: reintegra al inventario el producto original (mismo lote de origen) y descuenta por FIFO el producto nuevo, agregando sale_item(s) nuevos a la misma venta. Ajusta sales.total/sales_profit por la diferencia de precio y genera nota crédito/débito interna automática si aplica. Usado desde el detalle de venta (app/dashboard/sales/[id]).';
