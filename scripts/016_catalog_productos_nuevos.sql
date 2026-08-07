-- ════════════════════════════════════════════════════════════════════════════
-- Módulo: "Productos nuevos" en el catálogo público
-- Expone products.created_at a través de la cadena de vistas del catálogo
-- para poder resaltar (en el frontend) los productos creados en los últimos
-- 30 días. Requiere haber ejecutado antes scripts/015_product_images.sql
-- (usa la misma agregación de gallery_urls).
-- Idempotente: CREATE OR REPLACE VIEW.
--
-- NOTA: igual que en 015, las columnas nuevas van al FINAL de la lista
-- existente — Postgres no permite insertarlas en medio con CREATE OR REPLACE.
-- ════════════════════════════════════════════════════════════════════════════

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
    gallery_urls,
    created_at
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
                  WHERE (a.id = p.company_id)) AS catalog_stock,
            p.created_at
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
  pp.gallery_urls,
  pp.created_at
FROM public.public_products pp
LEFT JOIN best_offer bo ON bo.product_id = pp.id;

ALTER VIEW public.public_products_with_offers OWNER TO postgres;
GRANT SELECT ON public.public_products_with_offers TO anon, authenticated, service_role;
