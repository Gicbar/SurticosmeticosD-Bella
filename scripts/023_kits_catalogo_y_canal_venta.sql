-- ════════════════════════════════════════════════════════════════════════════
-- 023 — Kits en el catálogo público + canal de origen de cada venta
--
--   1) product_kits.show_in_catalog  → el kit (activo) aparece en el catálogo web
--      product_kits.origen           → de dónde vino un pedido del catálogo
--                                      (tiktok, whatsapp, facebook…, por ?ref= en el link)
--   2) sales.canal                   → por dónde llegó la venta (tienda, whatsapp,
--                                      catalogo, tiktok, facebook, revendedora, mayorista)
--   3) Vista pública public_kits     → kits con precio, contenido, foto y stock armable
--   4) rpc_crear_pedido_catalogo     → acepta kits en el carrito (los expande a sus
--                                      productos con el precio del kit) y guarda el origen
--   5) Vistas del agente (solo D'Bella): ventas con canal y pedidos del catálogo
--
-- Ejecutar en Supabase → SQL Editor. Idempotente.
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. Columnas nuevas ──────────────────────────────────────────────────────
ALTER TABLE public.product_kits
  ADD COLUMN IF NOT EXISTS show_in_catalog boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS origen text;

ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS canal text;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_canal_check') THEN
    ALTER TABLE public.sales ADD CONSTRAINT sales_canal_check CHECK (
      canal IS NULL OR canal IN ('tienda','whatsapp','catalogo','tiktok','facebook','revendedora','mayorista','otro'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sales_company_canal ON public.sales (company_id, canal, sale_date);

COMMENT ON COLUMN public.sales.canal IS 'Por dónde llegó la venta: tienda, whatsapp, catalogo, tiktok, facebook, revendedora, mayorista, otro. NULL = ventas anteriores sin dato.';
COMMENT ON COLUMN public.product_kits.origen IS 'Solo pedidos del catálogo: de dónde llegó el cliente (parámetro ?ref= del link).';


-- ── 2. Vista pública de kits ────────────────────────────────────────────────
-- Precio = suma de (cantidad × precio en el kit). Stock = cuántos kits completos
-- se pueden armar con el inventario actual. Solo kits activos, del negocio
-- (no pedidos del catálogo), marcados para el catálogo y con stock.
CREATE OR REPLACE VIEW public.public_kits AS
SELECT * FROM (
  SELECT
    k.id,
    k.company_id,
    k.code,
    k.name,
    k.description,
    COALESCE(k.image_url, (
      SELECT p.image_url FROM public.product_kit_items i
      JOIN public.products p ON p.id = i.product_id
      WHERE i.kit_id = k.id AND p.image_url IS NOT NULL
      ORDER BY i.unit_price_in_kit * i.quantity DESC LIMIT 1)) AS image_url,
    ( SELECT SUM(i.quantity * i.unit_price_in_kit) FROM public.product_kit_items i WHERE i.kit_id = k.id ) AS price,
    ( SELECT SUM(i.quantity * p.sale_price) FROM public.product_kit_items i
      JOIN public.products p ON p.id = i.product_id WHERE i.kit_id = k.id ) AS regular_price,
    ( SELECT jsonb_agg(jsonb_build_object(
               'name', p.name, 'quantity', i.quantity,
               'gift', i.unit_price_in_kit = 0, 'image_url', p.image_url)
             ORDER BY i.sort_order)
      FROM public.product_kit_items i JOIN public.products p ON p.id = i.product_id
      WHERE i.kit_id = k.id ) AS items,
    ( SELECT array_agg(p.image_url ORDER BY i.sort_order)
      FROM public.product_kit_items i JOIN public.products p ON p.id = i.product_id
      WHERE i.kit_id = k.id AND p.image_url IS NOT NULL ) AS gallery_urls,
    ( SELECT MIN(FLOOR(COALESCE(s.stock, 0) / i.quantity))::int
      FROM public.product_kit_items i
      LEFT JOIN LATERAL (
        SELECT SUM(pb.remaining_quantity) AS stock FROM public.purchase_batches pb
        WHERE pb.product_id = i.product_id AND pb.company_id = k.company_id
          AND pb.remaining_quantity > 0) s ON true
      WHERE i.kit_id = k.id ) AS stock,
    k.created_at
  FROM public.product_kits k
  WHERE k.is_active = true
    AND k.is_catalog_order = false
    AND k.show_in_catalog = true
) x
WHERE x.stock > 0 AND x.price > 0;

ALTER VIEW public.public_kits OWNER TO postgres;
GRANT SELECT ON public.public_kits TO anon, authenticated, service_role;


-- ── 3. Pedido del catálogo con kits y origen ────────────────────────────────
-- Igual que la v2, más:
--   • un item puede traer kit_id (en vez de product_id): se valida el kit y su
--     precio, y se guarda expandido en sus productos con el precio del kit, así
--     el POS lo carga igual que cualquier pedido del catálogo.
--   • p_items->>'origen' se guarda en product_kits.origen.
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
  v_lines          jsonb := '[]'::jsonb;   -- líneas finales {product_id, quantity, unit_price}
  v_item           jsonb;
  v_line           jsonb;
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
  v_src_kit        record;
  v_kit_price      numeric(14,2);
  v_kit_names      text[] := '{}'::text[];
  v_origen         text;
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

  v_origen := lower(left(trim(coalesce(p_items->>'origen', '')), 30));
  IF v_origen NOT IN ('tiktok','whatsapp','facebook','instagram','qr','revendedora') THEN
    v_origen := NULL;
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items->'items')
  LOOP
    v_qty        := COALESCE((v_item->>'quantity')::int, 0);
    v_unit_price := COALESCE((v_item->>'unit_price')::numeric, -1);
    IF v_qty <= 0 THEN
      RAISE EXCEPTION 'Cantidad inválida';
    END IF;
    IF v_unit_price < 0 THEN
      RAISE EXCEPTION 'Precio inválido';
    END IF;

    -- ── Kit ──
    IF NULLIF(v_item->>'kit_id','') IS NOT NULL THEN
      SELECT k.id, k.name INTO v_src_kit
      FROM public.product_kits k
      WHERE k.id = (v_item->>'kit_id')::uuid AND k.company_id = p_company_id
        AND k.is_active = true AND k.is_catalog_order = false AND k.show_in_catalog = true;
      IF v_src_kit.id IS NULL THEN
        RAISE EXCEPTION 'El kit ya no está disponible. Recarga el catálogo.';
      END IF;

      SELECT SUM(i.quantity * i.unit_price_in_kit) INTO v_kit_price
      FROM public.product_kit_items i WHERE i.kit_id = v_src_kit.id;
      IF ABS(COALESCE(v_kit_price, -1) - v_unit_price) > 0.01 THEN
        RAISE EXCEPTION 'El precio del kit "%" cambió. Recarga el catálogo.', v_src_kit.name;
      END IF;

      FOR v_line IN
        SELECT jsonb_build_object('product_id', i.product_id, 'quantity', i.quantity * v_qty,
                                  'unit_price', i.unit_price_in_kit, 'name', p.name)
        FROM public.product_kit_items i JOIN public.products p ON p.id = i.product_id
        WHERE i.kit_id = v_src_kit.id ORDER BY i.sort_order
      LOOP
        v_lines := v_lines || v_line;
      END LOOP;
      v_kit_names := array_append(v_kit_names, v_src_kit.name || CASE WHEN v_qty > 1 THEN ' ×' || v_qty ELSE '' END);
      v_total := v_total + (v_unit_price * v_qty);
      v_src_kit := NULL;
      CONTINUE;
    END IF;

    -- ── Producto suelto (igual que la v2) ──
    v_pid        := (v_item->>'product_id')::uuid;
    v_has_offer  := COALESCE((v_item->>'has_offer')::boolean, false);
    v_offer_end  := NULLIF(v_item->>'offer_end','')::date;

    SELECT p.name INTO v_pname
    FROM public.products p
    WHERE p.id = v_pid AND p.company_id = p_company_id AND p.is_public = true;
    IF v_pname IS NULL THEN
      RAISE EXCEPTION 'Producto no encontrado o no es público';
    END IF;

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

    IF v_has_offer AND v_offer_end IS NOT NULL THEN
      IF v_min_offer_end IS NULL OR v_offer_end < v_min_offer_end THEN
        v_min_offer_end := v_offer_end;
      END IF;
    END IF;

    v_lines := v_lines || jsonb_build_object('product_id', v_pid, 'quantity', v_qty,
                                             'unit_price', v_unit_price, 'name', v_pname);
    v_total := v_total + (v_unit_price * v_qty);
  END LOOP;

  -- Stock: se valida sumando lo que pide cada producto en todo el carrito
  -- (un producto puede venir suelto y también dentro de un kit).
  FOR v_line IN
    SELECT jsonb_build_object('product_id', l->>'product_id', 'name', MIN(l->>'name'),
                              'quantity', SUM((l->>'quantity')::int))
    FROM jsonb_array_elements(v_lines) l GROUP BY l->>'product_id'
  LOOP
    v_pid := (v_line->>'product_id')::uuid;
    v_qty := (v_line->>'quantity')::int;
    SELECT COALESCE(SUM(pb.remaining_quantity), 0) INTO v_stock
    FROM public.purchase_batches pb
    WHERE pb.product_id = v_pid AND pb.company_id = p_company_id
      AND pb.remaining_quantity > 0;

    IF v_stock < v_qty THEN
      RAISE EXCEPTION 'Stock insuficiente para "%" (disponible: %, solicitado: %)',
        v_line->>'name', v_stock, v_qty;
    ELSIF v_stock <= v_qty + 2 THEN
      v_warnings := v_warnings || jsonb_build_object(
        'product_id', v_pid, 'name', v_line->>'name',
        'available', v_stock, 'requested', v_qty);
    END IF;
  END LOOP;

  IF v_min_offer_end IS NOT NULL THEN
    v_expires_at := (v_min_offer_end::timestamp + interval '23 hours 59 minutes 59 seconds')
                    AT TIME ZONE 'America/Bogota';
  ELSE
    v_expires_at := now() + interval '7 days';
  END IF;

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
    campania_ids, origen, show_in_catalog
  ) VALUES (
    p_company_id, v_code,
    'Pedido catálogo #' || v_code,
    CASE WHEN array_length(v_kit_names, 1) > 0
         THEN 'Pedido del catálogo · incluye: ' || array_to_string(v_kit_names, ', ')
         ELSE 'Pedido generado desde el catálogo público' END,
    true,
    true, 'PENDIENTE',
    NULLIF(trim(coalesce(p_client_name,'')),''),
    NULLIF(trim(coalesce(p_client_phone,'')),''),
    v_expires_at, v_total,
    v_campania_ids, v_origen, false
  ) RETURNING id INTO v_kit_id;

  v_idx := 0;
  FOR v_line IN SELECT * FROM jsonb_array_elements(v_lines)
  LOOP
    INSERT INTO public.product_kit_items(
      kit_id, company_id, product_id, quantity, unit_price_in_kit, sort_order
    ) VALUES (
      v_kit_id, p_company_id,
      (v_line->>'product_id')::uuid,
      (v_line->>'quantity')::int,
      (v_line->>'unit_price')::numeric,
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


-- ── 4. Vistas del agente (solo lectura, solo D'Bella) ───────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'agente') THEN
    EXECUTE $v$
      CREATE OR REPLACE VIEW agente.ventas AS
        SELECT id, client_id, total, payment_method, sale_date, is_credit, created_at, canal
        FROM public.sales WHERE company_id = agente.empresa()
    $v$;
    EXECUTE $v$
      CREATE OR REPLACE VIEW agente.pedidos_catalogo AS
        SELECT id, code, catalog_status, origen, frozen_total, description,
               created_at, reclaimed_at, sale_id
        FROM public.product_kits
        WHERE company_id = agente.empresa() AND is_catalog_order = true
    $v$;
    EXECUTE $v$
      CREATE OR REPLACE VIEW agente.kits AS
        SELECT k.id, k.code, k.name, k.description, k.is_active, k.show_in_catalog, k.image_url, k.created_at
        FROM public.product_kits k
        WHERE k.company_id = agente.empresa() AND k.is_catalog_order = false
    $v$;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'agente_dbella') THEN
      GRANT SELECT ON agente.ventas, agente.pedidos_catalogo, agente.kits TO agente_dbella;
    END IF;
  END IF;
END $$;
