-- ════════════════════════════════════════════════════════════════════════════
-- GASTOS — Fix de edición (RLS) + bloqueo de meses ya cerrados
-- ════════════════════════════════════════════════════════════════════════════
-- Problema 1: al editar un gasto "no actualiza nada". Causa: la política RLS de
--   UPDATE era `created_by = auth.uid()`, así que solo el usuario que CREÓ el
--   gasto podía editarlo; para cualquier otro el UPDATE afectaba 0 filas SIN
--   lanzar error (la UI mostraba "actualizado" pero no cambiaba nada).
--   Fix: permitir editar cualquier gasto de las empresas del usuario (igual que
--   el resto de módulos multi-empresa: company_id IN user_companies).
--
-- Problema 2: no se debe registrar, editar, mover ni eliminar un gasto en un mes
--   que YA fue cerrado (cierres_mensuales), porque su saldo ya quedó congelado y
--   arrastrado al mes siguiente. Se enforce con un trigger (garantía dura) y
--   además con validación amable en la UI (expense-dialog / expenses-table).
--
-- Ejecuta este script en el SQL Editor de Supabase. Es idempotente.
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. Arreglar la política RLS de UPDATE de expenses ───────────────────────
DROP POLICY IF EXISTS "Users can update their own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can update expenses of their companies" ON public.expenses;

CREATE POLICY "Users can update expenses of their companies" ON public.expenses
  FOR UPDATE
  USING (company_id IN (
    SELECT user_companies.company_id FROM public.user_companies
    WHERE user_companies.user_id = auth.uid()
  ))
  WITH CHECK (company_id IN (
    SELECT user_companies.company_id FROM public.user_companies
    WHERE user_companies.user_id = auth.uid()
  ));

-- ── 2. Trigger: bloquear gastos en meses ya cerrados ────────────────────────
-- El mes se calcula en hora Colombia (America/Bogota) para que coincida con la
-- forma en que el cierre agrupa los gastos.
CREATE OR REPLACE FUNCTION public.expenses_block_closed_month()
  RETURNS trigger
  LANGUAGE plpgsql
  AS $$
DECLARE
  v_anio integer;
  v_mes  integer;
BEGIN
  -- DELETE: no permitir borrar gastos de un mes cerrado
  IF (TG_OP = 'DELETE') THEN
    IF OLD.date IS NOT NULL THEN
      v_anio := EXTRACT(YEAR  FROM (OLD.date AT TIME ZONE 'America/Bogota'))::int;
      v_mes  := EXTRACT(MONTH FROM (OLD.date AT TIME ZONE 'America/Bogota'))::int;
      IF EXISTS (SELECT 1 FROM public.cierres_mensuales
                 WHERE company_id = OLD.company_id AND anio = v_anio AND mes = v_mes) THEN
        RAISE EXCEPTION 'No se puede eliminar un gasto de %/%: ese mes ya está cerrado.', v_mes, v_anio
          USING ERRCODE = 'P0001';
      END IF;
    END IF;
    RETURN OLD;
  END IF;

  -- INSERT / UPDATE: el mes DESTINO (NEW) no puede estar cerrado
  IF NEW.date IS NOT NULL THEN
    v_anio := EXTRACT(YEAR  FROM (NEW.date AT TIME ZONE 'America/Bogota'))::int;
    v_mes  := EXTRACT(MONTH FROM (NEW.date AT TIME ZONE 'America/Bogota'))::int;
    IF EXISTS (SELECT 1 FROM public.cierres_mensuales
               WHERE company_id = NEW.company_id AND anio = v_anio AND mes = v_mes) THEN
      RAISE EXCEPTION 'No se puede registrar o mover un gasto a %/%: ese mes ya está cerrado.', v_mes, v_anio
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  -- UPDATE: tampoco tocar un gasto cuyo mes ORIGINAL (OLD) ya está cerrado
  IF (TG_OP = 'UPDATE' AND OLD.date IS NOT NULL) THEN
    v_anio := EXTRACT(YEAR  FROM (OLD.date AT TIME ZONE 'America/Bogota'))::int;
    v_mes  := EXTRACT(MONTH FROM (OLD.date AT TIME ZONE 'America/Bogota'))::int;
    IF EXISTS (SELECT 1 FROM public.cierres_mensuales
               WHERE company_id = OLD.company_id AND anio = v_anio AND mes = v_mes) THEN
      RAISE EXCEPTION 'No se puede editar un gasto de %/%: ese mes ya está cerrado.', v_mes, v_anio
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_expenses_block_closed_month ON public.expenses;
CREATE TRIGGER trg_expenses_block_closed_month
  BEFORE INSERT OR UPDATE OR DELETE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.expenses_block_closed_month();
