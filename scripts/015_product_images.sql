-- ════════════════════════════════════════════════════════════════════════════
-- Módulo: Galería de fotos por producto
-- Contenido: tabla product_images + extensión de las vistas del catálogo
--            público (public_products / public_products_with_offers)
-- Ejecutar en: Supabase → SQL Editor (con role postgres / service_role)
-- Idempotente: usa IF NOT EXISTS / CREATE OR REPLACE.
--
-- Modelo: products.image_url sigue siendo la foto de portada (sin cambios,
-- todo lo que ya la usa sigue funcionando igual). product_images guarda las
-- fotos ADICIONALES de la galería, ordenadas por sort_order. Reutiliza el
-- bucket de storage "product-images" creado en 005_add_image_column.sql.
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.product_images (
    id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid        NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    company_id uuid        NOT NULL REFERENCES public.companies(id),
    image_url  text        NOT NULL,
    sort_order int         NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product
    ON public.product_images (product_id, sort_order);

COMMENT ON TABLE public.product_images IS 'Fotos adicionales de la galería de un producto. La foto de portada sigue viviendo en products.image_url.';

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pi_select_own ON public.product_images;
CREATE POLICY pi_select_own ON public.product_images
  FOR SELECT USING (
    company_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid())
  );

DROP POLICY IF EXISTS pi_insert_own ON public.product_images;
CREATE POLICY pi_insert_own ON public.product_images
  FOR INSERT WITH CHECK (
    company_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid())
  );

DROP POLICY IF EXISTS pi_update_own ON public.product_images;
CREATE POLICY pi_update_own ON public.product_images
  FOR UPDATE USING (
    company_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid())
  ) WITH CHECK (
    company_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid())
  );

DROP POLICY IF EXISTS pi_delete_own ON public.product_images;
CREATE POLICY pi_delete_own ON public.product_images
  FOR DELETE USING (
    company_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid())
  );


-- ════════════════════════════════════════════════════════════════════════════
-- Extensión de las vistas del catálogo público: agregan gallery_urls
-- (array de URLs de la galería, ordenadas). image_url (portada) no cambia.
-- ════════════════════════════════════════════════════════════════════════════

-- NOTA: CREATE OR REPLACE VIEW solo permite agregar columnas nuevas al FINAL
-- de la lista existente (no se puede insertar en medio sin DROP VIEW) —
-- por eso gallery_urls va al final en ambas vistas, no junto a image_url.
CREATE OR REPLACE VIEW public.public_products AS
 SELECT id,
    name,
    description,
    sale_price,
    image_url,
    category_id,
    category_name,
    total_inventario,
    company_id,
    catalog_stock,
    gallery_urls
   FROM ( SELECT p.id,
            p.name,
            p.description,
            p.sale_price,
            p.image_url,
            ( SELECT array_agg(pi.image_url ORDER BY pi.sort_order)
                FROM public.product_images pi
               WHERE pi.product_id = p.id) AS gallery_urls,
            p.category_id,
            c.name AS category_name,
                CASE
                    WHEN (( SELECT a.catalog_stock
                       FROM public.companies a
                      WHERE (a.id = p.company_id)) = 'S'::text) THEN ( SELECT sum(pb.remaining_quantity) AS sum
                       FROM public.purchase_batches pb
                      WHERE ((pb.product_id = p.id) AND (pb.company_id = p.company_id)))
                    ELSE (2)::bigint
                END AS total_inventario,
            p.company_id,
            ( SELECT a.catalog_stock
                   FROM public.companies a
                  WHERE (a.id = p.company_id)) AS catalog_stock
           FROM (public.products p
             LEFT JOIN public.categories c ON ((c.id = p.category_id)))
          WHERE ((p.sale_price > (0)::numeric) AND (p.is_public = true))) x
  WHERE (total_inventario > 0);

ALTER VIEW public.public_products OWNER TO postgres;
GRANT SELECT ON public.public_products TO anon, authenticated, service_role;


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
  COALESCE(bo.precio_oferta, pp.sale_price) AS effective_price,
  pp.gallery_urls
FROM public.public_products pp
LEFT JOIN best_offer bo ON bo.product_id = pp.id;

ALTER VIEW public.public_products_with_offers OWNER TO postgres;
GRANT SELECT ON public.public_products_with_offers TO anon, authenticated, service_role;
