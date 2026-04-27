-- ════════════════════════════════════════════════════════════════════════════
-- Migración: añade columnas faltantes a tablas preexistentes del módulo
-- Campañas. Necesario cuando las tablas ya existían antes de ejecutar
-- campanias_schema.sql (CREATE TABLE IF NOT EXISTS no altera columnas).
-- Idempotente: seguro re-ejecutar.
-- ════════════════════════════════════════════════════════════════════════════

-- ── campanias_descuento ─────────────────────────────────────────────────────
ALTER TABLE public.campanias_descuento
  ADD COLUMN IF NOT EXISTS criterio_seleccion jsonb NOT NULL DEFAULT '{"modo":"TODOS"}'::jsonb;

ALTER TABLE public.campanias_descuento
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

ALTER TABLE public.campanias_descuento
  ADD COLUMN IF NOT EXISTS aprobado_at  timestamptz;
ALTER TABLE public.campanias_descuento
  ADD COLUMN IF NOT EXISTS publicado_at timestamptz;
ALTER TABLE public.campanias_descuento
  ADD COLUMN IF NOT EXISTS cancelado_at timestamptz;
ALTER TABLE public.campanias_descuento
  ADD COLUMN IF NOT EXISTS motivo_cancelacion text;

-- Constraint del modo (idempotente)
ALTER TABLE public.campanias_descuento
  DROP CONSTRAINT IF EXISTS camp_criterio_modo_chk;
ALTER TABLE public.campanias_descuento
  ADD CONSTRAINT camp_criterio_modo_chk CHECK (
    criterio_seleccion->>'modo' IN ('TODOS','SIN_ROTACION','SOBRESTOCK','CATEGORIA','PROVEEDOR','MANUAL')
  );

-- ── campania_descuento_detalle ──────────────────────────────────────────────
ALTER TABLE public.campania_descuento_detalle
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- ── ofertas_virtuales ───────────────────────────────────────────────────────
ALTER TABLE public.ofertas_virtuales
  ADD COLUMN IF NOT EXISTS desactivado_at timestamptz;

-- ════════════════════════════════════════════════════════════════════════════
-- Verificación: las columnas que usan las RPCs deben existir
-- ════════════════════════════════════════════════════════════════════════════
-- SELECT column_name FROM information_schema.columns
--  WHERE table_schema='public' AND table_name='campanias_descuento'
--  ORDER BY ordinal_position;
