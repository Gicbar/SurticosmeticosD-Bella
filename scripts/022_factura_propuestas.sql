-- 022_factura_propuestas.sql
-- ════════════════════════════════════════════════════════════════════════════
-- Facturas de compra -> orden de compra, con aprobación.
-- Un agente lee la factura electrónica del proveedor (Gmail) y deja una
-- PROPUESTA: costo por línea para los ítems de la orden, productos que faltan
-- en la orden y productos nuevos por crear. No toca inventario ni productos:
-- el gerente revisa la propuesta en Órdenes de compra y la aprueba; la app
-- (con la sesión del gerente) aplica los cambios.
--
-- Aditivo: dos tablas nuevas con RLS por empresa (mismo patrón que
-- cierres_mensuales) y vistas/función para el usuario del agente de D'Bella.
-- No modifica tablas ni políticas existentes.
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.factura_propuestas (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id       uuid NOT NULL REFERENCES public.companies(id),
  orden_compra_id  uuid REFERENCES public.ordenes_compra(id),
  proveedor_nombre text,
  proveedor_nit    text,
  numero_factura   text NOT NULL,
  fecha_factura    date,
  total            numeric,
  estado           text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aplicada', 'descartada')),
  creado_en        timestamptz NOT NULL DEFAULT now(),
  resuelto_por     uuid REFERENCES auth.users(id),
  resuelto_en      timestamptz,
  UNIQUE (empresa_id, proveedor_nit, numero_factura)
);

CREATE TABLE IF NOT EXISTS public.factura_propuesta_items (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  propuesta_id        uuid NOT NULL REFERENCES public.factura_propuestas(id) ON DELETE CASCADE,
  empresa_id          uuid NOT NULL REFERENCES public.companies(id),
  orden               integer NOT NULL DEFAULT 0,
  descripcion         text NOT NULL,          -- tal como viene en la factura
  cantidad            integer NOT NULL CHECK (cantidad > 0),
  costo_unitario      numeric NOT NULL CHECK (costo_unitario >= 0),  -- con IVA
  -- costo_item: el producto ya está en la orden -> se le pone el costo
  -- agregar_existente: existe en el sistema pero no en la orden -> se agrega
  -- crear_producto: no existe -> se crea (o el gerente elige a cuál corresponde)
  -- ignorar: fletes, descuentos, etc.
  accion              text NOT NULL CHECK (accion IN ('costo_item', 'agregar_existente', 'crear_producto', 'ignorar')),
  orden_item_id       uuid REFERENCES public.orden_compra_items(id),
  producto_id         uuid REFERENCES public.products(id),
  nuevo_nombre        text,
  nuevo_precio_venta  numeric,
  nuevo_categoria_id  uuid REFERENCES public.categories(id),
  nota                text,                   -- por qué el agente propone esto
  estado              text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aplicado', 'descartado'))
);
CREATE INDEX IF NOT EXISTS factura_propuesta_items_propuesta_idx ON public.factura_propuesta_items(propuesta_id);
CREATE INDEX IF NOT EXISTS factura_propuestas_orden_idx ON public.factura_propuestas(orden_compra_id);

ALTER TABLE public.factura_propuestas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.factura_propuesta_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pol_factura_propuestas ON public.factura_propuestas;
CREATE POLICY pol_factura_propuestas ON public.factura_propuestas
    USING (empresa_id IN (SELECT user_companies.company_id FROM public.user_companies WHERE user_companies.user_id = auth.uid()))
    WITH CHECK (empresa_id IN (SELECT user_companies.company_id FROM public.user_companies WHERE user_companies.user_id = auth.uid()));

DROP POLICY IF EXISTS pol_factura_propuesta_items ON public.factura_propuesta_items;
CREATE POLICY pol_factura_propuesta_items ON public.factura_propuesta_items
    USING (empresa_id IN (SELECT user_companies.company_id FROM public.user_companies WHERE user_companies.user_id = auth.uid()))
    WITH CHECK (empresa_id IN (SELECT user_companies.company_id FROM public.user_companies WHERE user_companies.user_id = auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.factura_propuestas, public.factura_propuesta_items TO authenticated;

-- ── Agente de D'Bella (usuario agente_dbella, solo lectura) ─────────────────
-- Puede VER órdenes de compra y proveedores de D'Bella y CREAR propuestas solo
-- a través de esta función (nada más se puede escribir).
CREATE OR REPLACE VIEW agente.proveedores AS
  SELECT id, name FROM public.suppliers WHERE company_id = agente.empresa();
CREATE OR REPLACE VIEW agente.ordenes_compra AS
  SELECT id, proveedor_id, estado, fecha_esperada, notas, creado_en
  FROM public.ordenes_compra WHERE empresa_id = agente.empresa();
CREATE OR REPLACE VIEW agente.orden_compra_items AS
  SELECT id, orden_compra_id, producto_id, cantidad_solicitada, cantidad_recibida, cantidad_contada,
         costo_unitario_estimado, rechazado
  FROM public.orden_compra_items WHERE empresa_id = agente.empresa();
CREATE OR REPLACE VIEW agente.factura_propuestas AS
  SELECT id, orden_compra_id, numero_factura, proveedor_nit, estado, creado_en
  FROM public.factura_propuestas WHERE empresa_id = agente.empresa();
GRANT SELECT ON agente.proveedores, agente.ordenes_compra, agente.orden_compra_items, agente.factura_propuestas TO agente_dbella;

-- p = {"orden_compra_id", "proveedor_nombre", "proveedor_nit", "numero_factura", "fecha_factura", "total",
--      "items": [{"descripcion", "cantidad", "costo_unitario", "accion", "orden_item_id", "producto_id",
--                 "nuevo_nombre", "nuevo_precio_venta", "nuevo_categoria_id", "nota"}]}
CREATE OR REPLACE FUNCTION agente.proponer_factura(p jsonb) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  emp uuid := agente.empresa();
  pid uuid;
  it  jsonb;
  n   integer := 0;
BEGIN
  -- la orden, los ítems y los productos deben ser de D'Bella
  IF (p->>'orden_compra_id') IS NOT NULL AND NOT EXISTS (
       SELECT 1 FROM public.ordenes_compra WHERE id = (p->>'orden_compra_id')::uuid AND empresa_id = emp) THEN
    RAISE EXCEPTION 'orden de compra no pertenece a la empresa';
  END IF;
  INSERT INTO public.factura_propuestas (empresa_id, orden_compra_id, proveedor_nombre, proveedor_nit, numero_factura, fecha_factura, total)
  VALUES (emp, (p->>'orden_compra_id')::uuid, p->>'proveedor_nombre', p->>'proveedor_nit', p->>'numero_factura',
          (p->>'fecha_factura')::date, (p->>'total')::numeric)
  RETURNING id INTO pid;
  FOR it IN SELECT * FROM jsonb_array_elements(p->'items') LOOP
    IF (it->>'orden_item_id') IS NOT NULL AND NOT EXISTS (
         SELECT 1 FROM public.orden_compra_items WHERE id = (it->>'orden_item_id')::uuid AND empresa_id = emp) THEN
      RAISE EXCEPTION 'ítem de orden no pertenece a la empresa';
    END IF;
    IF (it->>'producto_id') IS NOT NULL AND NOT EXISTS (
         SELECT 1 FROM public.products WHERE id = (it->>'producto_id')::uuid AND company_id = emp) THEN
      RAISE EXCEPTION 'producto no pertenece a la empresa';
    END IF;
    IF (it->>'nuevo_categoria_id') IS NOT NULL AND NOT EXISTS (
         SELECT 1 FROM public.categories WHERE id = (it->>'nuevo_categoria_id')::uuid AND company_id = emp) THEN
      RAISE EXCEPTION 'categoría no pertenece a la empresa';
    END IF;
    INSERT INTO public.factura_propuesta_items (propuesta_id, empresa_id, orden, descripcion, cantidad, costo_unitario, accion,
        orden_item_id, producto_id, nuevo_nombre, nuevo_precio_venta, nuevo_categoria_id, nota)
    VALUES (pid, emp, n, it->>'descripcion', (it->>'cantidad')::integer, (it->>'costo_unitario')::numeric, it->>'accion',
        (it->>'orden_item_id')::uuid, (it->>'producto_id')::uuid, it->>'nuevo_nombre', (it->>'nuevo_precio_venta')::numeric,
        (it->>'nuevo_categoria_id')::uuid, it->>'nota');
    n := n + 1;
  END LOOP;
  RETURN pid;
END $$;
REVOKE ALL ON FUNCTION agente.proponer_factura(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION agente.proponer_factura(jsonb) TO agente_dbella;
