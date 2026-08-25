-- 020_conteo_fisico_orden_compra.sql
-- ════════════════════════════════════════════════════════════════════════════
-- Al aprobar/comprar desde el celular, el gerente cuenta producto por
-- producto mientras recorre el local — antes de saber el costo real (eso
-- llega con la factura, después). "cantidad_contada" guarda ese conteo en
-- vivo (autoguardado, sin botón "guardar") para que la pantalla persista
-- entre recargas y se vea qué ya se contó y qué falta. Cuando finalmente se
-- registra la compra (con el costo real), esa cantidad pasa a
-- cantidad_recibida y se crea el lote — cantidad_contada no crea inventario
-- por sí sola.
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.orden_compra_items
    ADD COLUMN IF NOT EXISTS cantidad_contada integer NOT NULL DEFAULT 0 CHECK (cantidad_contada >= 0);
