-- ════════════════════════════════════════════════════════════════════════════
-- Fix: la tabla tenía `creado_por NOT NULL` (nombre español) de antes.
-- El código nuevo usa `created_by` (nombre inglés). Consolidamos en una sola.
-- ════════════════════════════════════════════════════════════════════════════

-- 1. Backfill: copiar valor desde creado_por a created_by cuando este sea NULL
UPDATE public.campanias_descuento
   SET created_by = creado_por
 WHERE created_by IS NULL AND creado_por IS NOT NULL;

-- 2. Quitar NOT NULL de la vieja para no romper inserts nuevos
ALTER TABLE public.campanias_descuento
  ALTER COLUMN creado_por DROP NOT NULL;

-- 3. Eliminar la columna vieja (sus datos ya están en created_by)
ALTER TABLE public.campanias_descuento
  DROP COLUMN IF EXISTS creado_por;

-- Verificación
-- SELECT column_name, is_nullable FROM information_schema.columns
--  WHERE table_schema='public' AND table_name='campanias_descuento'
--    AND column_name IN ('creado_por','created_by');
