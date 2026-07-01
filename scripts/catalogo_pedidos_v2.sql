-- ════════════════════════════════════════════════════════════════════════════
-- PARCHE v2 — Pedidos del Catálogo Público
-- Vincula los pedidos del catálogo con las campañas que les dieron descuento,
-- y al cancelar una campaña se invalidan los pedidos PENDIENTES asociados.
--
-- Ejecutar DESPUÉS de `catalogo_pedidos.sql`. Idempotente.
--
-- Caso de uso resuelto:
--   1) Admin crea campaña con vigencia 1 mes y la PUBLICA.
--   2) Cliente hace pedido en el catálogo con productos en oferta.
--   3) Admin cancela la campaña.
--   4) Cliente va al POS con su código → ANTES seguía cobrando con descuento.
--      AHORA el POS bloquea el pedido y muestra:
--         "El pedido ya no es válido — la campaña de descuentos fue cancelada".
-- ════════════════════════════════════════════════════════════════════════════


-- ════════════════════════════════════════════════════════════════════════════
-- 1. EXTENSIÓN A product_kits
-- ════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.product_kits
  ADD COLUMN IF NOT EXISTS campania_ids        uuid[] NOT NULL DEFAULT '{}'::uuid[],
  ADD COLUMN IF NOT EXISTS cancellation_reason text;

CREATE INDEX IF NOT EXISTS idx_kits_campania_ids
  ON public.product_kits USING gin (campania_ids)
  WHERE is_catalog_order = true;


-- ════════════════════════════════════════════════════════════════════════════
-- 2. RPC: rpc_crear_pedido_catalogo (recreada)
-- Ahora también guarda en `campania_ids` las campañas que dieron descuento a
-- los items del pedido. Esto permite invalidar el pedido si una de esas
-- campañas se cancela posteriormente.
-- ════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.rpc_crear_pedido_catalogo(
  p_company_id    uuid,
  p_client_name   text,
  p_client_phone  text,
  p_items         jsonb
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_code           int;
  v_intentos       int := 0;
  v_kit_id         uuid;
  v_total          numeric(14,2) := 0;
  v_min_offer_end  date;
  v_expires_at     timestamptz;
  v_warnings       jsonb := '[]'::jsonb;
  v_item           jsonb;
  v_pid            uuid;
  v_qty            int;
  v_unit_price     numeric(12,2);
  v_has_offer      boolean;
  v_offer_end      date;
  v_stock          int;
  v_pname          text;
  v_idx            int := 0;
  v_campania_ids   uuid[] := '{}'::uuid[];
  v_camp_id        uuid;
BEGIN
  IF p_company_id IS NULL THEN
    RAISE EXCEPTION 'company_id es obligatorio';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.companies WHERE id = p_company_id) THEN
    RAISE EXCEPTION 'Empresa no encontrada';
  END IF;
  IF p_items IS NULL OR jsonb_typeof(p_items->'items') <> 'array'
     OR jsonb_array_length(p_items->'items') = 0 THEN
    RAISE EXCEPTION 'Carrito vacío';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items->'items')
  LOOP
    v_pid        := (v_item->>'product_id')::uuid;
    v_qty        := COALESCE((v_item->>'quantity')::int, 0);
    v_unit_price := COALESCE((v_item->>'unit_price')::numeric, -1);
    v_has_offer  := COALESCE((v_item->>'has_offer')::boolean, false);
    v_offer_end  := NULLIF(v_item->>'offer_end','')::date;

    IF v_qty <= 0 THEN
      RAISE EXCEPTION 'Cantidad inválida';
    END IF;
    IF v_unit_price < 0 THEN
      RAISE EXCEPTION 'Precio inválido';
    END IF;

    SELECT p.name INTO v_pname
    FROM public.products p
    WHERE p.id = v_pid AND p.company_id = p_company_id AND p.is_public = true;
    IF v_pname IS NULL THEN
      RAISE EXCEPTION 'Producto no encontrado o no es público';
    END IF;

    -- Validar precio congelado y vincular campaña si aplica
    IF v_has_offer THEN
      SELECT o.campania_id INTO v_camp_id
      FROM public.ofertas_virtuales o
      WHERE o.product_id = v_pid
        AND o.company_id = p_company_id
        AND o.activo = true
        AND CURRENT_DATE BETWEEN o.fecha_inicio AND o.fecha_fin
        AND ABS(o.precio_oferta - v_unit_price) <= 0.01
      LIMIT 1;

      IF v_camp_id IS NULL THEN
        RAISE EXCEPTION 'La oferta para "%" ya no está disponible. Recarga el catálogo.', v_pname;
      END IF;

      IF NOT (v_camp_id = ANY(v_campania_ids)) THEN
        v_campania_ids := array_append(v_campania_ids, v_camp_id);
      END IF;
      v_camp_id := NULL;
    ELSE
      IF NOT EXISTS (
        SELECT 1 FROM public.products p
        WHERE p.id = v_pid AND p.company_id = p_company_id
          AND ABS(p.sale_price - v_unit_price) <= 0.01
      ) THEN
        RAISE EXCEPTION 'El precio de "%" cambió. Recarga el catálogo.', v_pname;
      END IF;
    END IF;

    -- Validar stock
    SELECT COALESCE(SUM(pb.remaining_quantity), 0) INTO v_stock
    FROM public.purchase_batches pb
    WHERE pb.product_id = v_pid AND pb.company_id = p_company_id
      AND pb.remaining_quantity > 0;

    IF v_stock < v_qty THEN
      RAISE EXCEPTION 'Stock insuficiente para "%" (disponible: %, solicitado: %)',
        v_pname, v_stock, v_qty;
    ELSIF v_stock <= v_qty + 2 THEN
      v_warnings := v_warnings || jsonb_build_object(
        'product_id', v_pid,
        'name',        v_pname,
        'available',   v_stock,
        'requested',   v_qty
      );
    END IF;

    IF v_has_offer AND v_offer_end IS NOT NULL THEN
      IF v_min_offer_end IS NULL OR v_offer_end < v_min_offer_end THEN
        v_min_offer_end := v_offer_end;
      END IF;
    END IF;

    v_total := v_total + (v_unit_price * v_qty);
  END LOOP;

  IF v_min_offer_end IS NOT NULL THEN
    v_expires_at := (v_min_offer_end::timestamp + interval '23 hours 59 minutes 59 seconds')
                    AT TIME ZONE 'America/Bogota';
  ELSE
    v_expires_at := now() + interval '7 days';
  END IF;

  -- Código aleatorio único por empresa
  LOOP
    v_code := 100000 + floor(random() * 900000)::int;
    IF NOT EXISTS (
      SELECT 1 FROM public.product_kits
      WHERE company_id = p_company_id AND code = v_code
    ) THEN
      EXIT;
    END IF;
    v_intentos := v_intentos + 1;
    IF v_intentos > 30 THEN
      RAISE EXCEPTION 'No se pudo generar un código único, intenta de nuevo';
    END IF;
  END LOOP;

  INSERT INTO public.product_kits(
    company_id, code, name, description, is_active,
    is_catalog_order, catalog_status,
    client_name, client_phone, expires_at, frozen_total,
    campania_ids
  ) VALUES (
    p_company_id, v_code,
    'Pedido catálogo #' || v_code,
    'Pedido generado desde el catálogo público',
    true,
    true, 'PENDIENTE',
    NULLIF(trim(coalesce(p_client_name,'')),''),
    NULLIF(trim(coalesce(p_client_phone,'')),''),
    v_expires_at, v_total,
    v_campania_ids
  ) RETURNING id INTO v_kit_id;

  v_idx := 0;
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items->'items')
  LOOP
    INSERT INTO public.product_kit_items(
      kit_id, company_id, product_id, quantity, unit_price_in_kit, sort_order
    ) VALUES (
      v_kit_id, p_company_id,
      (v_item->>'product_id')::uuid,
      (v_item->>'quantity')::int,
      (v_item->>'unit_price')::numeric,
      v_idx
    );
    v_idx := v_idx + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'ok',                  true,
    'code',                v_code,
    'kit_id',              v_kit_id,
    'expires_at',          v_expires_at,
    'frozen_total',        v_total,
    'low_stock_warnings',  v_warnings,
    'campania_ids',        v_campania_ids
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_crear_pedido_catalogo(uuid, text, text, jsonb)
  TO anon, authenticated;


-- ════════════════════════════════════════════════════════════════════════════
-- 3. RPC: rpc_cancelar_campania (recreada)
-- Mantiene el comportamiento original (cancelar campaña + desactivar ofertas)
-- y agrega: marcar como EXPIRADO los pedidos del catálogo PENDIENTES que
-- usaron esta campaña, con un mensaje claro en cancellation_reason.
-- ════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.rpc_cancelar_campania(
  p_campania_id uuid,
  p_motivo      text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_company_id   uuid;
  v_estado       text;
  v_nombre       text;
  v_ofertas      int := 0;
  v_pedidos_inv  int := 0;
BEGIN
  SELECT c.company_id, c.estado, c.nombre
    INTO v_company_id, v_estado, v_nombre
  FROM public.campanias_descuento c
  WHERE c.id = p_campania_id
    AND c.company_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid());

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Campaña no encontrada o sin permisos';
  END IF;
  IF v_estado = 'CANCELADA' THEN
    RAISE EXCEPTION 'La campaña ya está cancelada';
  END IF;

  -- Si estaba publicada: desactivar ofertas e invalidar pedidos pendientes
  IF v_estado = 'PUBLICADA' THEN
    UPDATE public.ofertas_virtuales
       SET activo = false, desactivado_at = now()
     WHERE campania_id = p_campania_id AND activo = true;
    GET DIAGNOSTICS v_ofertas = ROW_COUNT;

    -- Marcar pedidos del catálogo PENDIENTES que usaban esta campaña
    UPDATE public.product_kits
       SET catalog_status      = 'EXPIRADO',
           cancellation_reason = 'Campaña "' || v_nombre || '" cancelada — los descuentos ya no aplican'
     WHERE company_id          = v_company_id
       AND is_catalog_order    = true
       AND catalog_status      = 'PENDIENTE'
       AND p_campania_id       = ANY(campania_ids);
    GET DIAGNOSTICS v_pedidos_inv = ROW_COUNT;
  END IF;

  UPDATE public.campanias_descuento
     SET estado             = 'CANCELADA',
         cancelado_at       = now(),
         motivo_cancelacion = p_motivo
   WHERE id = p_campania_id;

  RETURN jsonb_build_object(
    'ok',                    true,
    'ofertas_desactivadas',  v_ofertas,
    'pedidos_invalidados',   v_pedidos_inv
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_cancelar_campania(uuid, text) TO authenticated;


-- ════════════════════════════════════════════════════════════════════════════
-- 4. Backfill: pedidos PENDIENTES asociados a campañas YA canceladas
-- Marca como EXPIRADO los pedidos que vienen de campañas que estaban
-- canceladas antes de aplicar este parche.
-- ════════════════════════════════════════════════════════════════════════════
UPDATE public.product_kits k
   SET catalog_status      = 'EXPIRADO',
       cancellation_reason = 'Campaña cancelada — los descuentos ya no aplican'
 WHERE k.is_catalog_order  = true
   AND k.catalog_status    = 'PENDIENTE'
   AND EXISTS (
     SELECT 1
       FROM public.campanias_descuento c
      WHERE c.id = ANY(k.campania_ids)
        AND c.estado = 'CANCELADA'
   );


-- ════════════════════════════════════════════════════════════════════════════
-- 5. Verificación rápida (descomentar para probar)
-- ════════════════════════════════════════════════════════════════════════════
-- SELECT column_name FROM information_schema.columns
--  WHERE table_schema='public' AND table_name='product_kits'
--    AND column_name IN ('campania_ids','cancellation_reason');
--
-- SELECT k.code, k.catalog_status, k.cancellation_reason, k.campania_ids
--   FROM public.product_kits k
--  WHERE k.is_catalog_order = true
--  ORDER BY k.created_at DESC LIMIT 20;
-- ════════════════════════════════════════════════════════════════════════════
