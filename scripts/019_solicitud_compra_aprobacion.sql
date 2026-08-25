-- 019_solicitud_compra_aprobacion.sql
-- ════════════════════════════════════════════════════════════════════════════
-- Flujo de aprobación para órdenes de compra: quien solicita (crea la orden)
-- no necesariamente es quien decide comprar. Un gerente (permiso
-- aprobar_ordenes_compra) revisa cada línea y decide comprarla (registrando
-- la cantidad REAL comprada, que puede diferir de lo solicitado) o
-- rechazarla. Mismo patrón que 'devoluciones' (resuelto_por/resuelto_en,
-- estados pendiente/aprobada/rechazada — ver 010_retail_completo.sql).
--
-- Aditivo: no toca RLS (el gateo de quién aprueba es a nivel de aplicación,
-- igual que el permiso "ordenes_compra" ya lo es hoy) ni las órdenes
-- existentes, que siguen su flujo actual (enviada → recibida_parcial/total).
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.ordenes_compra DROP CONSTRAINT IF EXISTS ordenes_compra_estado_check;
ALTER TABLE public.ordenes_compra ADD CONSTRAINT ordenes_compra_estado_check
    CHECK (estado IN ('borrador', 'pendiente_aprobacion', 'enviada', 'recibida_parcial', 'recibida_total', 'rechazada', 'cancelada'));

ALTER TABLE public.orden_compra_items
    ADD COLUMN IF NOT EXISTS rechazado      boolean     NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS motivo_rechazo text,
    ADD COLUMN IF NOT EXISTS revisado_por   uuid        REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS revisado_en    timestamptz;
