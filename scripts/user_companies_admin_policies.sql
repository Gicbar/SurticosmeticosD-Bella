-- ============================================================================
-- Políticas RLS para permitir que un administrador gestione la asignación
-- de empresa de los usuarios desde la pantalla de configuración.
--
-- Contexto:
--   * `user_companies` ya tenía solo SELECT abiertas (ver mi empresa, admin ve
--     usuarios de su empresa).  No tenía INSERT/UPDATE/DELETE, lo que impedía
--     que un admin moviera a un usuario de empresa.
--   * `companies` solo permitía SELECT de la propia.  Para que un admin pueda
--     elegir destino en un dropdown, necesita listar las empresas existentes.
--
-- Modelo aplicado:
--   * Cualquier usuario que sea admin en *alguna* empresa puede listar todas
--     las empresas y reasignar la empresa de cualquier usuario.
--   * Esto encaja con un dueño/gerente que administra múltiples empresas
--     dentro del mismo SaaS.
-- ============================================================================

-- ── Helper: ¿el usuario actual es admin en al menos una empresa? ─────────────
CREATE OR REPLACE FUNCTION public.is_admin_anywhere()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_companies
    WHERE user_id = auth.uid()
      AND role = 'admin'
  );
$$;

ALTER FUNCTION public.is_admin_anywhere() OWNER TO postgres;

-- ── companies: admins pueden listar todas las empresas ──────────────────────
DROP POLICY IF EXISTS "Admin lista todas las empresas" ON public.companies;
CREATE POLICY "Admin lista todas las empresas"
  ON public.companies
  FOR SELECT
  USING (public.is_admin_anywhere());

-- ── user_companies: admins pueden ver todas las asignaciones ────────────────
-- (necesario para mostrar la empresa actual de cada usuario en el panel)
DROP POLICY IF EXISTS "Admin ve todas las asignaciones" ON public.user_companies;
CREATE POLICY "Admin ve todas las asignaciones"
  ON public.user_companies
  FOR SELECT
  USING (public.is_admin_anywhere());

-- ── user_companies: admins pueden insertar (asignar empresa por primera vez)
DROP POLICY IF EXISTS "Admin asigna empresa a usuario" ON public.user_companies;
CREATE POLICY "Admin asigna empresa a usuario"
  ON public.user_companies
  FOR INSERT
  WITH CHECK (public.is_admin_anywhere());

-- ── user_companies: admins pueden actualizar (mover usuario de empresa) ─────
DROP POLICY IF EXISTS "Admin actualiza empresa de usuario" ON public.user_companies;
CREATE POLICY "Admin actualiza empresa de usuario"
  ON public.user_companies
  FOR UPDATE
  USING (public.is_admin_anywhere())
  WITH CHECK (public.is_admin_anywhere());

-- ── user_companies: admins pueden eliminar asignación ───────────────────────
DROP POLICY IF EXISTS "Admin elimina asignación" ON public.user_companies;
CREATE POLICY "Admin elimina asignación"
  ON public.user_companies
  FOR DELETE
  USING (public.is_admin_anywhere());
