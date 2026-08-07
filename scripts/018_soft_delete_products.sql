-- ════════════════════════════════════════════════════════════════════════════
-- Módulo: "Eliminar" producto = soft delete (products.deleted_at)
-- ════════════════════════════════════════════════════════════════════════════
-- Antes "Eliminar" en /dashboard/products hacía un DELETE real, que fallaba
-- con error de FK apenas el producto tenía ventas, lotes de compra, etc.
-- (sale_items.product_id, purchase_batches.product_id, ... sin ON DELETE
-- CASCADE — a propósito, para no perder historial). Ahora "Eliminar" marca
-- products.deleted_at en vez de borrar la fila: el producto deja de venderse
-- / usarse y desaparece del catálogo público, pero se conserva para que el
-- historial de ventas/compras siga íntegro. Es reversible (restaurar =
-- deleted_at = null).
--
-- Idempotente: ADD COLUMN IF NOT EXISTS, CREATE INDEX IF NOT EXISTS,
-- CREATE OR REPLACE VIEW/FUNCTION.
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_products_active
    ON public.products (company_id)
    WHERE deleted_at IS NULL;

COMMENT ON COLUMN public.products.deleted_at IS 'Soft delete: NULL = producto activo. No nulo = "eliminado" (oculto del catálogo público y de los selectores de venta/compra/kits/campañas), pero la fila se conserva por el historial de ventas/compras que la referencian.';


-- ── public_products: excluir productos eliminados del catálogo público ──────
-- Mismo listado de columnas que scripts/016_catalog_productos_nuevos.sql
-- (no cambia — solo se agrega la condición al WHERE interno).
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
          WHERE ((p.sale_price > (0)::numeric) AND (p.is_public = true) AND (p.deleted_at IS NULL))) x
  WHERE (total_inventario > 0);

ALTER VIEW public.public_products OWNER TO postgres;
GRANT SELECT ON public.public_products TO anon, authenticated, service_role;


-- ── get_low_stock_products: no alertar restock de un producto eliminado ────
-- Definición real vigente: scripts/backup.sql:831-849 (la de
-- 003_create_functions.sql es una versión vieja sin p_company_id, ya
-- superada). Se agrega la misma condición al WHERE.
CREATE OR REPLACE FUNCTION public.get_low_stock_products(p_company_id uuid)
RETURNS TABLE(id uuid, name text, current_stock bigint, min_stock integer)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    COALESCE(SUM(pb.remaining_quantity), 0)::bigint AS current_stock,
    p.min_stock
  FROM products p
  LEFT JOIN purchase_batches pb
    ON p.id = pb.product_id
   AND pb.company_id = p_company_id
  WHERE p.company_id = p_company_id
    AND p.deleted_at IS NULL
  GROUP BY p.id, p.name, p.min_stock
  HAVING COALESCE(SUM(pb.remaining_quantity), 0) < p.min_stock;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_low_stock_products(uuid) TO anon, authenticated, service_role;
