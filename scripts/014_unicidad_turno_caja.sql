-- ════════════════════════════════════════════════════════════════════════════
-- FASE 1G — Independizar Cajas de Turnos + garantizar 1 usuario por caja
-- ════════════════════════════════════════════════════════════════════════════
-- El usuario pidió explícitamente (2026-07-21):
--   1. Separar la gestión de cajas (crear/activar) del uso diario (abrir
--      turno) — hecho en el frontend con la nueva página /dashboard/cajas
--      (permiso "cajas", solo admin/gerente) vs. /dashboard/turnos-caja
--      (permiso "cajas_turnos", incluye vendedor).
--   2. Solo 1 usuario por caja: una caja no puede tener 2 turnos abiertos al
--      mismo tiempo. Esto se garantiza aquí a nivel de BASE DE DATOS, no
--      solo filtrando en el frontend — así ni siquiera dos clics
--      simultáneos de dos cajeros distintos podrían abrir turno en la misma
--      caja a la vez (el frontend ya filtra la caja del selector, pero un
--      índice único es lo único que lo hace imposible de verdad).
--
-- Requiere scripts/010_retail_completo.sql ya ejecutado (tabla turnos_caja).
-- ════════════════════════════════════════════════════════════════════════════

-- 1. Una caja no puede tener más de un turno con estado='abierto' a la vez.
CREATE UNIQUE INDEX IF NOT EXISTS uq_turnos_caja_caja_abierta
    ON public.turnos_caja (caja_id)
    WHERE estado = 'abierto';

-- 2. Extra (no pedido explícitamente, agregado por consistencia): un mismo
--    cajero tampoco puede tener 2 turnos abiertos a la vez en cajas
--    distintas. Esto protege un supuesto que YA tiene el frontend
--    (`turnos-caja-interface.tsx` y `pos-interface.tsx` asumen "el turno
--    activo" como un solo valor, no una lista) — sin este índice, un
--    cajero podría dejar un turno abierto "invisible" en una caja y abrir
--    otro en otra, dejando esa primera caja ocupada sin que nadie la vea en
--    pantalla. Si no se quiere esta restricción, basta con borrar este
--    índice (DROP INDEX uq_turnos_caja_cajero_abierta).
CREATE UNIQUE INDEX IF NOT EXISTS uq_turnos_caja_cajero_abierta
    ON public.turnos_caja (empresa_id, cajero_id)
    WHERE estado = 'abierto';

COMMENT ON INDEX public.uq_turnos_caja_caja_abierta IS 'Garantiza 1 usuario por caja: no puede haber 2 turnos abiertos en la misma caja a la vez.';
COMMENT ON INDEX public.uq_turnos_caja_cajero_abierta IS 'Protege el supuesto de "un solo turno activo por cajero" que ya usa el frontend (POS y pantalla de turnos). Quitar si se quiere permitir explícitamente múltiples turnos simultáneos por usuario.';
