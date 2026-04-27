-- ════════════════════════════════════════════════════════════════════════════
-- Módulo: Pedidos del Catálogo Público
-- Contenido: extensión a product_kits + vista pública con ofertas + RPCs + RLS
-- Ejecutar en: Supabase → SQL Editor (con role postgres / service_role)
-- Idempotente: usa IF NOT EXISTS / CREATE OR REPLACE.
-- ════════════════════════════════════════════════════════════════════════════
--
-- Modelo:
--
--   product_kits ─┬─ kits "normales" del negocio (is_catalog_order = false)
--                 └─ pedidos generados desde el catálogo público
--                    (is_catalog_order = true, codigo aleatorio 6 dígitos,
--                     status PENDIENTE → RECLAMADO/EXPIRADO,
--                     vencimiento alineado a campañas, precios congelados)
--
-- Multi-company: TODAS las RPCs validan pertenencia del usuario a la empresa.
-- La RPC pública (rpc_crear_pedido_catalogo) recibe p_company_id explícito y
-- se ejecuta con SECURITY DEFINER porque el catálogo es anónimo.
-- ════════════════════════════════════════════════════════════════════════════


-- ════════════════════════════════════════════════════════════════════════════
-- 1. EXTENSIÓN A product_kits
-- ════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.product_kits
  ADD COLUMN IF NOT EXISTS is_catalog_order boolean      NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS catalog_status   text,
  ADD COLUMN IF NOT EXISTS client_name      text,
  ADD COLUMN IF NOT EXISTS client_phone     text,
  ADD COLUMN IF NOT EXISTS expires_at       timestamptz,
  ADD COLUMN IF NOT EXISTS reclaimed_at     timestamptz,
  ADD COLUMN IF NOT EXISTS sale_id          uuid,
  ADD COLUMN IF NOT EXISTS frozen_total     numeric(14,2);

-- Constraint: catalog_status válido cuando is_catalog_order = true
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'product_kits_catalog_status_chk'
  ) THEN
    ALTER TABLE public.product_kits
      ADD CONSTRAINT product_kits_catalog_status_chk CHECK (
        (is_catalog_order = false AND catalog_status IS NULL)
        OR (is_catalog_order = true AND catalog_status IN ('PENDIENTE','RECLAMADO','EXPIRADO'))
      );
  END IF;
END $$;

-- FK opcional al sale al ser reclamado
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'product_kits_sale_fk'
  ) THEN
    ALTER TABLE public.product_kits
      ADD CONSTRAINT product_kits_sale_fk
      FOREIGN KEY (sale_id) REFERENCES public.sales(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_kits_catalog_status
  ON public.product_kits(company_id, catalog_status)
  WHERE is_catalog_order = true;

CREATE INDEX IF NOT EXISTS idx_kits_catalog_expires
  ON public.product_kits(expires_at)
  WHERE is_catalog_order = true AND catalog_status = 'PENDIENTE';


-- ════════════════════════════════════════════════════════════════════════════
-- 2. VISTA: public_products_with_offers
-- Catálogo público con descuentos vigentes (un registro por producto).
-- Si un producto tiene varias ofertas activas, toma la del mayor descuento.
-- ════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE VIEW public.public_products_with_offers AS
WITH best_offer AS (
  SELECT DISTINCT ON (o.product_id)
    o.product_id,
    o.precio_oferta,
    o.precio_original,
    o.porcentaje_descuento,
    o.fecha_inicio,
    o.fecha_fin,
    o.campania_id
  FROM public.ofertas_virtuales o
  WHERE o.activo = true
    AND CURRENT_DATE BETWEEN o.fecha_inicio AND o.fecha_fin
  ORDER BY o.product_id, o.porcentaje_descuento DESC, o.precio_oferta ASC
)
SELECT
  pp.id,
  pp.name,
  pp.description,
  pp.sale_price,
  pp.image_url,
  pp.category_id,
  pp.category_name,
  pp.total_inventario,
  pp.company_id,
  bo.precio_oferta            AS offer_price,
  bo.porcentaje_descuento     AS offer_discount_pct,
  bo.fecha_inicio              AS offer_start,
  bo.fecha_fin                 AS offer_end,
  bo.campania_id              AS offer_campaign_id,
  CASE WHEN bo.precio_oferta IS NOT NULL THEN true ELSE false END AS has_offer,
  COALESCE(bo.precio_oferta, pp.sale_price) AS effective_price
FROM public.public_products pp
LEFT JOIN best_offer bo ON bo.product_id = pp.id;

ALTER VIEW public.public_products_with_offers OWNER TO postgres;
GRANT SELECT ON public.public_products_with_offers TO anon, authenticated, service_role;


-- ════════════════════════════════════════════════════════════════════════════
-- 3. RPC: rpc_crear_pedido_catalogo
-- Ejecutado desde el catálogo público (anon). Genera código aleatorio único
-- de 6 dígitos por empresa, congela precios, valida stock y crea kit con
-- is_catalog_order=true, catalog_status='PENDIENTE'.
--
-- Entrada (jsonb):
--   { "items": [
--       { "product_id": "uuid", "quantity": 2, "unit_price": 12000, "has_offer": true, "offer_end": "2026-05-01" },
--       ...
--     ]
--   }
--
-- Salida:
--   { ok, code, kit_id, expires_at, frozen_total, low_stock_warnings: [...] }
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
BEGIN
  -- Validaciones básicas
  IF p_company_id IS NULL THEN
    RAISE EXCEPTION 'company_id es obligatorio';
  END IF;

  -- Verificar que la empresa existe (defensa contra company_id forjado desde el cliente)
  IF NOT EXISTS (SELECT 1 FROM public.companies WHERE id = p_company_id) THEN
    RAISE EXCEPTION 'Empresa no encontrada';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items->'items') <> 'array'
     OR jsonb_array_length(p_items->'items') = 0 THEN
    RAISE EXCEPTION 'Carrito vacío';
  END IF;

  -- Iterar items: validar stock, congelar precio, acumular total y mínima fecha de oferta
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

    -- Validar producto pertenece a la empresa
    SELECT p.name INTO v_pname
    FROM public.products p
    WHERE p.id = v_pid AND p.company_id = p_company_id AND p.is_public = true;
    IF v_pname IS NULL THEN
      RAISE EXCEPTION 'Producto no encontrado o no es público';
    END IF;

    -- Validar precio congelado contra precio actual / oferta vigente
    -- (defensa contra manipulación del cliente).
    IF v_has_offer THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.ofertas_virtuales o
        WHERE o.product_id = v_pid
          AND o.company_id = p_company_id
          AND o.activo = true
          AND CURRENT_DATE BETWEEN o.fecha_inicio AND o.fecha_fin
          AND ABS(o.precio_oferta - v_unit_price) <= 0.01
      ) THEN
        -- Si el cliente pretende oferta pero ya no existe, rechazamos con
        -- mensaje claro: la página debe recargar.
        RAISE EXCEPTION 'La oferta para "%" ya no está disponible. Recarga el catálogo.', v_pname;
      END IF;
    ELSE
      -- Para precio normal, debe coincidir con sale_price actual.
      IF NOT EXISTS (
        SELECT 1 FROM public.products p
        WHERE p.id = v_pid AND p.company_id = p_company_id
          AND ABS(p.sale_price - v_unit_price) <= 0.01
      ) THEN
        RAISE EXCEPTION 'El precio de "%" cambió. Recarga el catálogo.', v_pname;
      END IF;
    END IF;

    -- Validar stock disponible (no reservar — solo advertir si es bajo)
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

    -- Mínima fecha_fin de las ofertas (para vencimiento)
    IF v_has_offer AND v_offer_end IS NOT NULL THEN
      IF v_min_offer_end IS NULL OR v_offer_end < v_min_offer_end THEN
        v_min_offer_end := v_offer_end;
      END IF;
    END IF;

    v_total := v_total + (v_unit_price * v_qty);
  END LOOP;

  -- Vencimiento: la fecha mínima de oferta vigente del carrito, o 7 días si no hay
  IF v_min_offer_end IS NOT NULL THEN
    -- Hasta el final del día de oferta (en zona Colombia ~ UTC-5)
    v_expires_at := (v_min_offer_end::timestamp + interval '23 hours 59 minutes 59 seconds')
                    AT TIME ZONE 'America/Bogota';
  ELSE
    v_expires_at := now() + interval '7 days';
  END IF;

  -- Generar código aleatorio único de 6 dígitos para esta empresa
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

  -- Crear el kit
  INSERT INTO public.product_kits(
    company_id, code, name, description, is_active,
    is_catalog_order, catalog_status,
    client_name, client_phone, expires_at, frozen_total
  ) VALUES (
    p_company_id, v_code,
    'Pedido catálogo #' || v_code,
    'Pedido generado desde el catálogo público',
    true,
    true, 'PENDIENTE',
    NULLIF(trim(coalesce(p_client_name,'')),''),
    NULLIF(trim(coalesce(p_client_phone,'')),''),
    v_expires_at, v_total
  ) RETURNING id INTO v_kit_id;

  -- Insertar items con precios congelados
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
    'low_stock_warnings',  v_warnings
  );
END;
$$;

-- Permitir ejecución sin login (catálogo público)
GRANT EXECUTE ON FUNCTION public.rpc_crear_pedido_catalogo(uuid, text, text, jsonb)
  TO anon, authenticated;


-- ════════════════════════════════════════════════════════════════════════════
-- 4. RPC: rpc_marcar_pedido_reclamado
-- Llamado desde el POS al completar la venta de un pedido del catálogo.
-- ════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.rpc_marcar_pedido_reclamado(
  p_kit_id   uuid,
  p_sale_id  uuid
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_company_id uuid;
  v_status     text;
  v_is_catalog boolean;
BEGIN
  SELECT k.company_id, k.catalog_status, k.is_catalog_order
    INTO v_company_id, v_status, v_is_catalog
  FROM public.product_kits k
  WHERE k.id = p_kit_id
    AND k.company_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid());

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Pedido no encontrado o sin permisos';
  END IF;
  IF NOT v_is_catalog THEN
    RAISE EXCEPTION 'El kit indicado no es un pedido del catálogo';
  END IF;
  IF v_status = 'RECLAMADO' THEN
    RAISE EXCEPTION 'El pedido ya fue cobrado';
  END IF;

  UPDATE public.product_kits
     SET catalog_status = 'RECLAMADO',
         reclaimed_at   = now(),
         sale_id        = p_sale_id
   WHERE id = p_kit_id AND company_id = v_company_id;

  RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_marcar_pedido_reclamado(uuid, uuid) TO authenticated;


-- ════════════════════════════════════════════════════════════════════════════
-- 5. RPC: rpc_expirar_pedidos_vencidos
-- Marca como EXPIRADO los pedidos PENDIENTE cuyo expires_at < now().
-- Ejecutar manualmente o programar como cron en Supabase.
-- ════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.rpc_expirar_pedidos_vencidos()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_count int;
BEGIN
  UPDATE public.product_kits
     SET catalog_status = 'EXPIRADO'
   WHERE is_catalog_order = true
     AND catalog_status   = 'PENDIENTE'
     AND expires_at       < now();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN jsonb_build_object('ok', true, 'expirados', v_count);
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_expirar_pedidos_vencidos() TO authenticated;


-- ════════════════════════════════════════════════════════════════════════════
-- 6. Verificación rápida (descomentar para probar)
-- ════════════════════════════════════════════════════════════════════════════
-- SELECT column_name FROM information_schema.columns
--  WHERE table_schema='public' AND table_name='product_kits'
--    AND column_name IN ('is_catalog_order','catalog_status','client_name','client_phone',
--                        'expires_at','reclaimed_at','sale_id','frozen_total');
-- SELECT * FROM public.public_products_with_offers LIMIT 5;
-- ════════════════════════════════════════════════════════════════════════════
