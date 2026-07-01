-- ════════════════════════════════════════════════════════════════════════════
-- CATEGORÍAS DE GASTO POR EMPRESA
-- ════════════════════════════════════════════════════════════════════════════
-- Hasta ahora `categories_expense` era GLOBAL (sin company_id): todas las
-- empresas compartían la misma lista. Esta migración la vuelve multi-empresa,
-- igual que `categories` (productos).
--
-- Estrategia de migración (preserva los gastos existentes):
--   1. Agrega la columna company_id.
--   2. Clona cada categoría global en TODAS las empresas.
--   3. Repunta cada gasto a la copia de SU empresa (match por nombre).
--   4. Elimina las categorías globales originales (ya sin referencias).
--   5. Deja company_id como NOT NULL + índice + RLS por empresa.
--
-- Ejecuta este script en el SQL Editor de Supabase. Es idempotente en lo posible.
-- ════════════════════════════════════════════════════════════════════════════

-- 1. Columna company_id (nullable durante la migración)
ALTER TABLE public.categories_expense
    ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;

-- 2. Clonar cada categoría global (company_id IS NULL) en cada empresa existente
INSERT INTO public.categories_expense (name, company_id)
SELECT ce.name, c.id
FROM public.categories_expense ce
CROSS JOIN public.companies c
WHERE ce.company_id IS NULL;

-- 3. Repuntar los gastos a la copia de su propia empresa (match por nombre)
UPDATE public.expenses e
SET category = nc.id
FROM public.categories_expense oc
JOIN public.categories_expense nc
  ON nc.company_id = e.company_id
 AND nc.name IS NOT DISTINCT FROM oc.name
WHERE e.category = oc.id
  AND oc.company_id IS NULL;

-- 4. Eliminar las categorías globales originales (ya no las referencia nadie)
DELETE FROM public.categories_expense WHERE company_id IS NULL;

-- 5. company_id obligatorio de aquí en adelante
ALTER TABLE public.categories_expense
    ALTER COLUMN company_id SET NOT NULL;

-- Índice
CREATE INDEX IF NOT EXISTS idx_categories_expense_company
    ON public.categories_expense USING btree (company_id);

-- 6. RLS por empresa (mismo patrón que el resto del sistema)
ALTER TABLE public.categories_expense ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pol_categories_expense ON public.categories_expense;
CREATE POLICY pol_categories_expense ON public.categories_expense
    USING (company_id IN (
        SELECT user_companies.company_id FROM public.user_companies
        WHERE user_companies.user_id = auth.uid()
    ))
    WITH CHECK (company_id IN (
        SELECT user_companies.company_id FROM public.user_companies
        WHERE user_companies.user_id = auth.uid()
    ));
