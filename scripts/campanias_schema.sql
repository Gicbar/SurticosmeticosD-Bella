-- ════════════════════════════════════════════════════════════════════════════
-- Módulo: Campañas de descuento
-- Contenido: tablas + índices + RLS + policies + triggers + RPCs
-- Ejecutar en: Supabase → SQL Editor (con role postgres / service_role)
-- Idempotente: usa IF NOT EXISTS / CREATE OR REPLACE. Puede re-ejecutarse.
-- ════════════════════════════════════════════════════════════════════════════
--
-- Notas transversales:
--
-- · MULTI-COMPANY: todas las tablas llevan `company_id` obligatorio. Las
--   políticas RLS restringen cada fila a las empresas del usuario autenticado
--   (public.user_companies). Las RPCs validan la pertenencia del usuario a la
--   empresa antes de escribir. `rpc_crear_campania` recibe `p_company_id`
--   explícito — el frontend pasa la empresa activa del contexto.
--
-- · ZONA HORARIA: la BD guarda timestamptz en UTC; Colombia es UTC-5 (sin DST).
--   Los cálculos temporales de las RPCs usan `now()` contra `sale_date` — al
--   ser ambos UTC, un intervalo "últimos N días" es correcto sin conversión.
--   Las columnas DATE (`fecha_inicio`, `fecha_fin`) no tienen zona: el cliente
--   las envía/recibe como "YYYY-MM-DD" y debe formatearlas localmente.
--
-- ════════════════════════════════════════════════════════════════════════════
--
-- Modelo:
--
--   campanias_descuento ──┬──> campania_descuento_detalle (un registro por lote)
--                         └──> ofertas_virtuales  (catálogo público al publicar)
--
-- Flujo de estados:
--   BORRADOR ──(rpc_generar_analisis)──> CALCULADA
--                                           ├──(rpc_aprobar_campania)──> APROBADA ──(rpc_publicar_campania)──> PUBLICADA
--                                           └──(rpc_cancelar_campania)──> CANCELADA
--   PUBLICADA ──(rpc_cancelar_campania, desactiva ofertas)──> CANCELADA
--
-- Alcance (criterio_seleccion) — evaluado dentro de rpc_generar_analisis_campania:
--   { "modo": "TODOS" }
--   { "modo": "SIN_ROTACION", "dias_sin_venta": 60 }
--   { "modo": "SOBRESTOCK",   "dias_cobertura_min": 90, "ventana_venta_dias": 30 }
--   { "modo": "CATEGORIA",    "category_ids": ["uuid", ...] }
--   { "modo": "PROVEEDOR",    "supplier_ids": ["uuid", ...] }
--   { "modo": "MANUAL",       "product_ids": ["uuid", ...] }
--
-- Requisitos previos en la BD (ya deben existir):
--   public.companies(id), public.user_companies(user_id, company_id)
--   public.products(id, company_id, category_id, supplier_id, sale_price)
--   public.purchase_batches(id, product_id, company_id, purchase_price, remaining_quantity, purchase_date)
--   public.sales(id, sale_date), public.sale_items(sale_id, product_id, quantity, company_id)
--   public.categories(id, company_id), public.suppliers(id, company_id)
-- ════════════════════════════════════════════════════════════════════════════


-- ════════════════════════════════════════════════════════════════════════════
-- 1. TABLA: campanias_descuento
-- ════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.campanias_descuento (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id           uuid        NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  nombre               text        NOT NULL,
  descripcion          text,
  fecha_inicio         date        NOT NULL,
  fecha_fin            date        NOT NULL,
  margen_minimo        numeric(5,2) NOT NULL,
  estado               text        NOT NULL DEFAULT 'BORRADOR',
  criterio_seleccion   jsonb       NOT NULL DEFAULT '{"modo":"TODOS"}'::jsonb,
  aprobado_at          timestamptz,
  publicado_at         timestamptz,
  cancelado_at         timestamptz,
  motivo_cancelacion   text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  created_by           uuid        REFERENCES auth.users(id),

  CONSTRAINT camp_nombre_check       CHECK (char_length(trim(nombre)) >= 2),
  CONSTRAINT camp_fechas_check       CHECK (fecha_fin > fecha_inicio),
  CONSTRAINT camp_margen_check       CHECK (margen_minimo >= 0 AND margen_minimo < 100),
  CONSTRAINT camp_estado_check       CHECK (estado IN ('BORRADOR','CALCULADA','APROBADA','PUBLICADA','CANCELADA')),
  CONSTRAINT camp_criterio_modo_chk  CHECK (
    criterio_seleccion->>'modo' IN ('TODOS','SIN_ROTACION','SOBRESTOCK','CATEGORIA','PROVEEDOR','MANUAL')
  )
);

CREATE INDEX IF NOT EXISTS idx_camp_company_estado
  ON public.campanias_descuento(company_id, estado);
CREATE INDEX IF NOT EXISTS idx_camp_vigencia
  ON public.campanias_descuento(company_id, fecha_inicio, fecha_fin);


-- ════════════════════════════════════════════════════════════════════════════
-- 2. TABLA: campania_descuento_detalle
-- ════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.campania_descuento_detalle (
  id                            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  campania_id                   uuid        NOT NULL REFERENCES public.campanias_descuento(id) ON DELETE CASCADE,
  company_id                    uuid        NOT NULL REFERENCES public.companies(id),
  product_id                    uuid        NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  lote_id                       uuid        NOT NULL REFERENCES public.purchase_batches(id) ON DELETE RESTRICT,
  cantidad_disponible           integer     NOT NULL,
  precio_compra                 numeric(12,2) NOT NULL,
  precio_venta_actual           numeric(12,2) NOT NULL,
  porcentaje_maximo_permitido   numeric(5,2)  NOT NULL DEFAULT 0,
  precio_minimo_permitido       numeric(12,2) NOT NULL DEFAULT 0,
  porcentaje_descuento_aprobado numeric(5,2)  NOT NULL DEFAULT 0,
  precio_oferta                 numeric(12,2),
  margen_resultante             numeric(5,2),
  ganancia_por_unidad           numeric(12,2),
  ganancia_total_estimada       numeric(14,2),
  activo                        boolean     NOT NULL DEFAULT true,
  motivo_inactivo               text,
  created_at                    timestamptz NOT NULL DEFAULT now(),
  updated_at                    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT cdd_pct_max_chk   CHECK (porcentaje_maximo_permitido >= 0 AND porcentaje_maximo_permitido <= 100),
  CONSTRAINT cdd_pct_apr_chk   CHECK (porcentaje_descuento_aprobado >= 0 AND porcentaje_descuento_aprobado <= 100),
  CONSTRAINT cdd_unique_lote   UNIQUE (campania_id, lote_id)
);

CREATE INDEX IF NOT EXISTS idx_cdd_campania  ON public.campania_descuento_detalle(campania_id, activo);
CREATE INDEX IF NOT EXISTS idx_cdd_company   ON public.campania_descuento_detalle(company_id);
CREATE INDEX IF NOT EXISTS idx_cdd_product   ON public.campania_descuento_detalle(product_id);


-- ════════════════════════════════════════════════════════════════════════════
-- 3. TABLA: ofertas_virtuales
-- ════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.ofertas_virtuales (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id            uuid        NOT NULL REFERENCES public.companies(id),
  campania_id           uuid        NOT NULL REFERENCES public.campanias_descuento(id) ON DELETE CASCADE,
  product_id            uuid        NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  lote_id               uuid        REFERENCES public.purchase_batches(id) ON DELETE SET NULL,
  precio_original       numeric(12,2) NOT NULL,
  precio_oferta         numeric(12,2) NOT NULL,
  porcentaje_descuento  numeric(5,2)  NOT NULL,
  fecha_inicio          date        NOT NULL,
  fecha_fin             date        NOT NULL,
  activo                boolean     NOT NULL DEFAULT true,
  created_at            timestamptz NOT NULL DEFAULT now(),
  desactivado_at        timestamptz
);

CREATE INDEX IF NOT EXISTS idx_ofv_company_activo ON public.ofertas_virtuales(company_id, activo);
CREATE INDEX IF NOT EXISTS idx_ofv_campania       ON public.ofertas_virtuales(campania_id);
CREATE INDEX IF NOT EXISTS idx_ofv_product        ON public.ofertas_virtuales(product_id, activo);


-- ════════════════════════════════════════════════════════════════════════════
-- 4. Trigger para updated_at
-- ════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.tg_cdd_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_cdd_updated ON public.campania_descuento_detalle;
CREATE TRIGGER tg_cdd_updated
  BEFORE UPDATE ON public.campania_descuento_detalle
  FOR EACH ROW EXECUTE FUNCTION public.tg_cdd_set_updated_at();


-- ════════════════════════════════════════════════════════════════════════════
-- 5. ROW LEVEL SECURITY + POLÍTICAS
-- ════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.campanias_descuento        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campania_descuento_detalle ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ofertas_virtuales          ENABLE ROW LEVEL SECURITY;

-- Helper semántico: company_id debe estar en las empresas del usuario autenticado.

-- ── campanias_descuento ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS camp_select_own ON public.campanias_descuento;
CREATE POLICY camp_select_own ON public.campanias_descuento
  FOR SELECT USING (
    company_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid())
  );

DROP POLICY IF EXISTS camp_insert_own ON public.campanias_descuento;
CREATE POLICY camp_insert_own ON public.campanias_descuento
  FOR INSERT WITH CHECK (
    company_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid())
  );

DROP POLICY IF EXISTS camp_update_own ON public.campanias_descuento;
CREATE POLICY camp_update_own ON public.campanias_descuento
  FOR UPDATE USING (
    company_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid())
  ) WITH CHECK (
    company_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid())
  );

DROP POLICY IF EXISTS camp_delete_own ON public.campanias_descuento;
CREATE POLICY camp_delete_own ON public.campanias_descuento
  FOR DELETE USING (
    company_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid())
  );

-- ── campania_descuento_detalle ──────────────────────────────────────────────
DROP POLICY IF EXISTS cdd_select_own ON public.campania_descuento_detalle;
CREATE POLICY cdd_select_own ON public.campania_descuento_detalle
  FOR SELECT USING (
    company_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid())
  );

DROP POLICY IF EXISTS cdd_insert_own ON public.campania_descuento_detalle;
CREATE POLICY cdd_insert_own ON public.campania_descuento_detalle
  FOR INSERT WITH CHECK (
    company_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid())
  );

DROP POLICY IF EXISTS cdd_update_own ON public.campania_descuento_detalle;
CREATE POLICY cdd_update_own ON public.campania_descuento_detalle
  FOR UPDATE USING (
    company_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid())
  ) WITH CHECK (
    company_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid())
  );

DROP POLICY IF EXISTS cdd_delete_own ON public.campania_descuento_detalle;
CREATE POLICY cdd_delete_own ON public.campania_descuento_detalle
  FOR DELETE USING (
    company_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid())
  );

-- ── ofertas_virtuales ──────────────────────────────────────────────────────
-- Lectura pública del catálogo de ofertas (sin login requerido para ver ofertas
-- activas del e-commerce). La escritura se limita a la empresa dueña.
DROP POLICY IF EXISTS ofv_select_public ON public.ofertas_virtuales;
CREATE POLICY ofv_select_public ON public.ofertas_virtuales
  FOR SELECT USING (activo = true OR company_id IN (
    SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS ofv_insert_own ON public.ofertas_virtuales;
CREATE POLICY ofv_insert_own ON public.ofertas_virtuales
  FOR INSERT WITH CHECK (
    company_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid())
  );

DROP POLICY IF EXISTS ofv_update_own ON public.ofertas_virtuales;
CREATE POLICY ofv_update_own ON public.ofertas_virtuales
  FOR UPDATE USING (
    company_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid())
  ) WITH CHECK (
    company_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid())
  );

DROP POLICY IF EXISTS ofv_delete_own ON public.ofertas_virtuales;
CREATE POLICY ofv_delete_own ON public.ofertas_virtuales
  FOR DELETE USING (
    company_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid())
  );


-- ════════════════════════════════════════════════════════════════════════════
-- 6. RPCs
-- ════════════════════════════════════════════════════════════════════════════

-- ── 6.1 rpc_crear_campania ──────────────────────────────────────────────────
-- Multi-company: el frontend pasa explícitamente la empresa activa. La RPC
-- valida que el usuario autenticado pertenece a esa empresa antes de insertar.
CREATE OR REPLACE FUNCTION public.rpc_crear_campania(
  p_company_id    uuid,
  p_nombre        text,
  p_descripcion   text,
  p_fecha_inicio  date,
  p_fecha_fin     date,
  p_margen_minimo numeric
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_autorizado boolean;
  v_id         uuid;
BEGIN
  IF p_company_id IS NULL THEN
    RAISE EXCEPTION 'company_id es obligatorio';
  END IF;

  -- Multi-company: el usuario debe pertenecer a la empresa indicada
  SELECT EXISTS (
    SELECT 1 FROM public.user_companies uc
    WHERE uc.user_id = auth.uid() AND uc.company_id = p_company_id
  ) INTO v_autorizado;

  IF NOT v_autorizado THEN
    RAISE EXCEPTION 'El usuario no pertenece a la empresa indicada';
  END IF;

  IF p_nombre IS NULL OR char_length(trim(p_nombre)) < 2 THEN
    RAISE EXCEPTION 'Nombre inválido';
  END IF;
  IF p_fecha_fin <= p_fecha_inicio THEN
    RAISE EXCEPTION 'La fecha fin debe ser posterior a la de inicio';
  END IF;
  IF p_margen_minimo < 0 OR p_margen_minimo >= 100 THEN
    RAISE EXCEPTION 'Margen mínimo fuera de rango [0,100)';
  END IF;

  INSERT INTO public.campanias_descuento(
    company_id, nombre, descripcion, fecha_inicio, fecha_fin, margen_minimo, estado, created_by
  ) VALUES (
    p_company_id, trim(p_nombre), NULLIF(trim(coalesce(p_descripcion,'')),''),
    p_fecha_inicio, p_fecha_fin, p_margen_minimo, 'BORRADOR', auth.uid()
  )
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('ok', true, 'campania_id', v_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_crear_campania(uuid, text, text, date, date, numeric) TO authenticated;


-- ── 6.2 rpc_set_criterio_alcance ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.rpc_set_criterio_alcance(
  p_campania_id uuid,
  p_criterio    jsonb
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_company_id uuid;
  v_estado     text;
  v_modo       text := p_criterio->>'modo';
BEGIN
  IF v_modo IS NULL OR v_modo NOT IN ('TODOS','SIN_ROTACION','SOBRESTOCK','CATEGORIA','PROVEEDOR','MANUAL') THEN
    RAISE EXCEPTION 'Modo de alcance inválido: %', v_modo;
  END IF;

  SELECT c.company_id, c.estado INTO v_company_id, v_estado
  FROM public.campanias_descuento c
  WHERE c.id = p_campania_id
    AND c.company_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid());

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Campaña no encontrada o sin permisos';
  END IF;
  IF v_estado <> 'BORRADOR' THEN
    RAISE EXCEPTION 'El alcance solo puede modificarse en estado BORRADOR (actual: %)', v_estado;
  END IF;

  UPDATE public.campanias_descuento SET criterio_seleccion = p_criterio WHERE id = p_campania_id;
  RETURN jsonb_build_object('ok', true, 'campania_id', p_campania_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_set_criterio_alcance(uuid, jsonb) TO authenticated;


-- ── 6.3 rpc_generar_analisis_campania ───────────────────────────────────────
-- Barre todos los lotes con stock de la empresa, filtra por alcance, calcula
-- descuento máximo que respeta margen mínimo, y persiste detalles. Reejecutable:
-- borra detalles previos y recalcula. Estado: BORRADOR → CALCULADA.
CREATE OR REPLACE FUNCTION public.rpc_generar_analisis_campania(
  p_campania_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_company_id   uuid;
  v_estado       text;
  v_margen_min   numeric;
  v_criterio     jsonb;
  v_modo         text;
  v_product_ids  uuid[];
  v_dias_sin_v   int;
  v_dias_cob     int;
  v_ventana      int;
  v_elegibles    int := 0;
  v_excluidos    int := 0;
  v_total_lotes  int := 0;
BEGIN
  -- Seguridad + datos de la campaña
  SELECT c.company_id, c.estado, c.margen_minimo, c.criterio_seleccion
    INTO v_company_id, v_estado, v_margen_min, v_criterio
  FROM public.campanias_descuento c
  WHERE c.id = p_campania_id
    AND c.company_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid());

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Campaña no encontrada o sin permisos';
  END IF;
  IF v_estado NOT IN ('BORRADOR','CALCULADA') THEN
    RAISE EXCEPTION 'El análisis solo puede generarse en BORRADOR o CALCULADA (actual: %)', v_estado;
  END IF;

  v_modo := COALESCE(v_criterio->>'modo', 'TODOS');

  -- Universo de product_ids permitidos según alcance
  IF v_modo = 'TODOS' THEN
    SELECT COALESCE(array_agg(p.id), ARRAY[]::uuid[]) INTO v_product_ids
    FROM public.products p WHERE p.company_id = v_company_id;

  ELSIF v_modo = 'SIN_ROTACION' THEN
    v_dias_sin_v := COALESCE((v_criterio->>'dias_sin_venta')::int, 60);
    SELECT COALESCE(array_agg(p.id), ARRAY[]::uuid[]) INTO v_product_ids
    FROM public.products p
    LEFT JOIN LATERAL (
      SELECT max(s.sale_date) AS ultima
      FROM public.sale_items si
      JOIN public.sales s ON s.id = si.sale_id
      WHERE si.product_id = p.id AND si.company_id = v_company_id
    ) u ON true
    WHERE p.company_id = v_company_id
      AND (u.ultima IS NULL OR u.ultima < now() - make_interval(days => v_dias_sin_v));

  ELSIF v_modo = 'SOBRESTOCK' THEN
    v_dias_cob := COALESCE((v_criterio->>'dias_cobertura_min')::int, 90);
    v_ventana  := COALESCE((v_criterio->>'ventana_venta_dias')::int, 30);
    SELECT COALESCE(array_agg(sub.product_id), ARRAY[]::uuid[]) INTO v_product_ids
    FROM (
      SELECT p.id AS product_id,
             COALESCE(SUM(pb.remaining_quantity), 0) AS stock,
             COALESCE((
               SELECT SUM(si.quantity)::numeric / NULLIF(v_ventana, 0)
               FROM public.sale_items si
               JOIN public.sales s ON s.id = si.sale_id
               WHERE si.product_id = p.id
                 AND si.company_id = v_company_id
                 AND s.sale_date >= now() - make_interval(days => v_ventana)
             ), 0) AS vel_dia
      FROM public.products p
      LEFT JOIN public.purchase_batches pb
        ON pb.product_id = p.id AND pb.company_id = v_company_id AND pb.remaining_quantity > 0
      WHERE p.company_id = v_company_id
      GROUP BY p.id
    ) sub
    WHERE sub.stock > 0
      AND (sub.vel_dia = 0 OR (sub.stock / sub.vel_dia) >= v_dias_cob);

  ELSIF v_modo = 'CATEGORIA' THEN
    SELECT COALESCE(array_agg(p.id), ARRAY[]::uuid[]) INTO v_product_ids
    FROM public.products p
    WHERE p.company_id = v_company_id
      AND p.category_id = ANY(ARRAY(SELECT jsonb_array_elements_text(v_criterio->'category_ids'))::uuid[]);

  ELSIF v_modo = 'PROVEEDOR' THEN
    SELECT COALESCE(array_agg(p.id), ARRAY[]::uuid[]) INTO v_product_ids
    FROM public.products p
    WHERE p.company_id = v_company_id
      AND p.supplier_id = ANY(ARRAY(SELECT jsonb_array_elements_text(v_criterio->'supplier_ids'))::uuid[]);

  ELSIF v_modo = 'MANUAL' THEN
    v_product_ids := ARRAY(SELECT jsonb_array_elements_text(v_criterio->'product_ids'))::uuid[];
  END IF;

  -- Borrar análisis previo para recalcular limpio
  DELETE FROM public.campania_descuento_detalle WHERE campania_id = p_campania_id;

  -- Insertar un registro por LOTE con stock disponible. Si el producto no está
  -- en el universo permitido, queda inactivo con motivo = fuera de alcance.
  WITH lotes AS (
    SELECT
      pb.id              AS lote_id,
      pb.product_id,
      pb.purchase_price  AS precio_compra,
      pb.remaining_quantity AS stock,
      p.sale_price       AS precio_venta_actual,
      (p.id = ANY(v_product_ids)) AS en_alcance
    FROM public.purchase_batches pb
    JOIN public.products p ON p.id = pb.product_id
    WHERE pb.company_id = v_company_id
      AND pb.remaining_quantity > 0
      AND p.sale_price > 0
  ),
  calc AS (
    SELECT
      l.*,
      -- % descuento máximo que mantiene margen = margen_minimo
      -- margen = (precio_venta - precio_compra) / precio_venta
      -- precio_min = precio_compra / (1 - margen_min/100)
      -- %max = (precio_venta_actual - precio_min) / precio_venta_actual * 100
      GREATEST(0, LEAST(100,
        ROUND(
          ((l.precio_venta_actual - (l.precio_compra / NULLIF(1 - v_margen_min/100.0, 0)))
           / NULLIF(l.precio_venta_actual, 0)) * 100
        , 2)
      )) AS pct_max,
      ROUND(l.precio_compra / NULLIF(1 - v_margen_min/100.0, 0), 2) AS precio_min_permitido
    FROM lotes l
  )
  INSERT INTO public.campania_descuento_detalle (
    campania_id, company_id, product_id, lote_id,
    cantidad_disponible, precio_compra, precio_venta_actual,
    porcentaje_maximo_permitido, precio_minimo_permitido,
    activo, motivo_inactivo
  )
  SELECT
    p_campania_id, v_company_id, c.product_id, c.lote_id,
    c.stock, c.precio_compra, c.precio_venta_actual,
    COALESCE(c.pct_max, 0),
    COALESCE(c.precio_min_permitido, c.precio_compra),
    -- activo solo si está en alcance Y hay margen disponible
    (c.en_alcance AND COALESCE(c.pct_max, 0) > 0) AS activo,
    CASE
      WHEN NOT c.en_alcance                 THEN 'Fuera del alcance de la campaña'
      WHEN COALESCE(c.pct_max, 0) <= 0      THEN 'Sin margen disponible (precio de venta ≤ mínimo permitido)'
      ELSE NULL
    END AS motivo
  FROM calc c;

  -- Métricas
  SELECT count(*) INTO v_total_lotes FROM public.campania_descuento_detalle WHERE campania_id = p_campania_id;
  SELECT count(*) INTO v_elegibles   FROM public.campania_descuento_detalle WHERE campania_id = p_campania_id AND activo = true;
  SELECT count(*) INTO v_excluidos   FROM public.campania_descuento_detalle
    WHERE campania_id = p_campania_id AND activo = false AND motivo_inactivo = 'Fuera del alcance de la campaña';

  UPDATE public.campanias_descuento SET estado = 'CALCULADA' WHERE id = p_campania_id;

  RETURN jsonb_build_object(
    'ok',                true,
    'modo',              v_modo,
    'total_lotes',       v_total_lotes,
    'lotes_elegibles',   v_elegibles,
    'excluidos_alcance', v_excluidos
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_generar_analisis_campania(uuid) TO authenticated;


-- ── 6.4 rpc_actualizar_descuento_detalle ────────────────────────────────────
-- Edita el % de descuento de un lote. Valida que no viole margen_minimo.
-- Solo permitido si la campaña está en CALCULADA.
CREATE OR REPLACE FUNCTION public.rpc_actualizar_descuento_detalle(
  p_detalle_id            uuid,
  p_porcentaje_descuento  numeric
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_company_id    uuid;
  v_estado        text;
  v_margen_min    numeric;
  v_precio_compra numeric;
  v_precio_venta  numeric;
  v_stock         int;
  v_activo        boolean;
  v_pct_max       numeric;
  v_precio_oferta numeric;
  v_margen_res    numeric;
  v_gpu           numeric;
  v_gte           numeric;
BEGIN
  SELECT d.company_id, c.estado, c.margen_minimo,
         d.precio_compra, d.precio_venta_actual, d.cantidad_disponible,
         d.activo, d.porcentaje_maximo_permitido
    INTO v_company_id, v_estado, v_margen_min,
         v_precio_compra, v_precio_venta, v_stock,
         v_activo, v_pct_max
  FROM public.campania_descuento_detalle d
  JOIN public.campanias_descuento c ON c.id = d.campania_id
  WHERE d.id = p_detalle_id
    AND d.company_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid());

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Detalle no encontrado o sin permisos';
  END IF;
  IF v_estado <> 'CALCULADA' THEN
    RAISE EXCEPTION 'Los descuentos solo pueden editarse en estado CALCULADA (actual: %)', v_estado;
  END IF;
  IF NOT v_activo THEN
    RAISE EXCEPTION 'Este lote está inactivo y no admite descuento';
  END IF;
  IF p_porcentaje_descuento < 0 OR p_porcentaje_descuento > 100 THEN
    RAISE EXCEPTION 'Porcentaje fuera de rango [0,100]';
  END IF;
  IF p_porcentaje_descuento > v_pct_max + 0.001 THEN
    RAISE EXCEPTION 'El descuento (%) excede el máximo permitido (%) para este lote', p_porcentaje_descuento, v_pct_max;
  END IF;

  v_precio_oferta := ROUND(v_precio_venta * (1 - p_porcentaje_descuento/100.0), 2);
  v_margen_res    := ROUND(((v_precio_oferta - v_precio_compra) / NULLIF(v_precio_oferta, 0)) * 100, 2);

  IF v_margen_res < v_margen_min - 0.001 THEN
    RAISE EXCEPTION 'Margen resultante (%.2f%%) por debajo del mínimo (%.2f%%)', v_margen_res, v_margen_min;
  END IF;

  v_gpu := v_precio_oferta - v_precio_compra;
  v_gte := v_gpu * v_stock;

  UPDATE public.campania_descuento_detalle
     SET porcentaje_descuento_aprobado = p_porcentaje_descuento,
         precio_oferta                 = v_precio_oferta,
         margen_resultante             = v_margen_res,
         ganancia_por_unidad           = v_gpu,
         ganancia_total_estimada       = v_gte
   WHERE id = p_detalle_id;

  RETURN jsonb_build_object(
    'ok', true,
    'precio_oferta',    v_precio_oferta,
    'margen_resultante', v_margen_res,
    'ganancia_total',    v_gte
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_actualizar_descuento_detalle(uuid, numeric) TO authenticated;


-- ── 6.5 rpc_aprobar_campania ────────────────────────────────────────────────
-- CALCULADA → APROBADA. Valida todos los márgenes de los detalles con descuento.
CREATE OR REPLACE FUNCTION public.rpc_aprobar_campania(
  p_campania_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_company_id uuid;
  v_estado     text;
  v_margen_min numeric;
  v_violaciones int;
  v_aprobados   int;
BEGIN
  SELECT c.company_id, c.estado, c.margen_minimo
    INTO v_company_id, v_estado, v_margen_min
  FROM public.campanias_descuento c
  WHERE c.id = p_campania_id
    AND c.company_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid());

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Campaña no encontrada o sin permisos';
  END IF;
  IF v_estado <> 'CALCULADA' THEN
    RAISE EXCEPTION 'Solo puede aprobarse desde CALCULADA (actual: %)', v_estado;
  END IF;

  SELECT count(*) INTO v_violaciones
  FROM public.campania_descuento_detalle
  WHERE campania_id = p_campania_id
    AND activo = true
    AND porcentaje_descuento_aprobado > 0
    AND margen_resultante < v_margen_min;

  IF v_violaciones > 0 THEN
    RAISE EXCEPTION 'Hay % lotes con margen por debajo del mínimo. Ajusta antes de aprobar.', v_violaciones;
  END IF;

  SELECT count(*) INTO v_aprobados
  FROM public.campania_descuento_detalle
  WHERE campania_id = p_campania_id
    AND activo = true
    AND porcentaje_descuento_aprobado > 0;

  UPDATE public.campanias_descuento
     SET estado = 'APROBADA', aprobado_at = now()
   WHERE id = p_campania_id;

  RETURN jsonb_build_object('ok', true, 'productos_aprobados', v_aprobados);
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_aprobar_campania(uuid) TO authenticated;


-- ── 6.6 rpc_publicar_campania ───────────────────────────────────────────────
-- APROBADA → PUBLICADA. Vuelca detalles con descuento > 0 a ofertas_virtuales.
CREATE OR REPLACE FUNCTION public.rpc_publicar_campania(
  p_campania_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_company_id   uuid;
  v_estado       text;
  v_fi           date;
  v_ff           date;
  v_insertadas   int;
BEGIN
  SELECT c.company_id, c.estado, c.fecha_inicio, c.fecha_fin
    INTO v_company_id, v_estado, v_fi, v_ff
  FROM public.campanias_descuento c
  WHERE c.id = p_campania_id
    AND c.company_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid());

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Campaña no encontrada o sin permisos';
  END IF;
  IF v_estado <> 'APROBADA' THEN
    RAISE EXCEPTION 'Solo puede publicarse desde APROBADA (actual: %)', v_estado;
  END IF;

  -- Si el mismo producto tiene varios lotes con descuento, usamos el MAYOR
  -- descuento (mejor precio para el cliente). Puedes cambiar a MIN(precio_oferta).
  WITH agrupado AS (
    SELECT
      d.product_id,
      MAX(d.porcentaje_descuento_aprobado) AS pct,
      MIN(d.precio_oferta)                 AS precio_oferta,
      MAX(d.precio_venta_actual)           AS precio_original,
      (array_agg(d.lote_id ORDER BY d.porcentaje_descuento_aprobado DESC))[1] AS lote_id
    FROM public.campania_descuento_detalle d
    WHERE d.campania_id = p_campania_id
      AND d.activo = true
      AND d.porcentaje_descuento_aprobado > 0
    GROUP BY d.product_id
  )
  INSERT INTO public.ofertas_virtuales(
    company_id, campania_id, product_id, lote_id,
    precio_original, precio_oferta, porcentaje_descuento,
    fecha_inicio, fecha_fin, activo
  )
  SELECT
    v_company_id, p_campania_id, a.product_id, a.lote_id,
    a.precio_original, a.precio_oferta, a.pct,
    v_fi, v_ff, true
  FROM agrupado a;

  GET DIAGNOSTICS v_insertadas = ROW_COUNT;

  UPDATE public.campanias_descuento
     SET estado = 'PUBLICADA', publicado_at = now()
   WHERE id = p_campania_id;

  RETURN jsonb_build_object('ok', true, 'ofertas_publicadas', v_insertadas);
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_publicar_campania(uuid) TO authenticated;


-- ── 6.7 rpc_cancelar_campania ───────────────────────────────────────────────
-- Cualquier estado excepto CANCELADA → CANCELADA.
-- Si estaba PUBLICADA, desactiva todas sus ofertas en el catálogo.
CREATE OR REPLACE FUNCTION public.rpc_cancelar_campania(
  p_campania_id uuid,
  p_motivo      text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_company_id uuid;
  v_estado     text;
  v_ofertas    int := 0;
BEGIN
  SELECT c.company_id, c.estado INTO v_company_id, v_estado
  FROM public.campanias_descuento c
  WHERE c.id = p_campania_id
    AND c.company_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid());

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Campaña no encontrada o sin permisos';
  END IF;
  IF v_estado = 'CANCELADA' THEN
    RAISE EXCEPTION 'La campaña ya está cancelada';
  END IF;

  IF v_estado = 'PUBLICADA' THEN
    UPDATE public.ofertas_virtuales
       SET activo = false, desactivado_at = now()
     WHERE campania_id = p_campania_id AND activo = true;
    GET DIAGNOSTICS v_ofertas = ROW_COUNT;
  END IF;

  UPDATE public.campanias_descuento
     SET estado = 'CANCELADA',
         cancelado_at = now(),
         motivo_cancelacion = p_motivo
   WHERE id = p_campania_id;

  RETURN jsonb_build_object('ok', true, 'ofertas_desactivadas', v_ofertas);
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_cancelar_campania(uuid, text) TO authenticated;


-- ════════════════════════════════════════════════════════════════════════════
-- 7. Verificación rápida (opcional — descomentar para probar)
-- ════════════════════════════════════════════════════════════════════════════
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'camp%' OR tablename = 'ofertas_virtuales';
-- SELECT proname FROM pg_proc WHERE proname LIKE 'rpc_%campania%' OR proname = 'rpc_set_criterio_alcance';
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('campanias_descuento','campania_descuento_detalle','ofertas_virtuales');
-- ════════════════════════════════════════════════════════════════════════════
