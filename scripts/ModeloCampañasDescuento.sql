-- ============================================================
-- MÓDULO: CAMPAÑAS DE DESCUENTO POR LOTE
-- Versión: 1.0.0 | Supabase / PostgreSQL 15+
-- ============================================================
-- ORDEN DE EJECUCIÓN:
--   1. 01_tables.sql       ← este archivo
--   2. 02_indexes.sql
--   3. 03_rls.sql
--   4. 04_functions.sql
--   5. 05_public_catalog.sql
-- ============================================================

-- ─── Extensiones necesarias ──────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- búsqueda fuzzy en nombres

-- ─── Tipos ENUM ──────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE estado_campania AS ENUM (
    'BORRADOR',    -- Recién creada, sin análisis
    'CALCULADA',   -- Análisis corrido, esperando revisión manual
    'APROBADA',    -- Aprobada por gerente/admin, lista para publicar
    'PUBLICADA',   -- Activa en catálogo público
    'CANCELADA'    -- Cancelada en cualquier estado anterior
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ─── 1. TABLA PRINCIPAL: campanias_descuento ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.campanias_descuento (
  id                    uuid            NOT NULL DEFAULT gen_random_uuid(),
  company_id            uuid            NOT NULL,

  -- Datos de la campaña
  nombre                text            NOT NULL CHECK (char_length(trim(nombre)) >= 3),
  descripcion           text,
  fecha_inicio          date            NOT NULL,
  fecha_fin             date            NOT NULL,

  -- Regla financiera central — nunca se omite en BD
  margen_minimo         numeric(5,2)    NOT NULL DEFAULT 15.00
                          CHECK (margen_minimo >= 0 AND margen_minimo < 100),

  -- Máquina de estados
  estado                estado_campania NOT NULL DEFAULT 'BORRADOR',

  -- Auditoría de actores
  creado_por            uuid            NOT NULL,
  aprobado_por          uuid,
  publicado_por         uuid,
  cancelado_por         uuid,

  -- Timestamps
  aprobado_at           timestamptz,
  publicado_at          timestamptz,
  cancelado_at          timestamptz,
  created_at            timestamptz     NOT NULL DEFAULT now(),
  updated_at            timestamptz     NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT campanias_descuento_pkey PRIMARY KEY (id),
  CONSTRAINT campanias_fechas_validas
    CHECK (fecha_fin > fecha_inicio),
  CONSTRAINT campanias_descuento_company_fkey
    FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE RESTRICT,
  CONSTRAINT campanias_descuento_creado_fkey
    FOREIGN KEY (creado_por) REFERENCES auth.users(id),
  CONSTRAINT campanias_descuento_aprobado_fkey
    FOREIGN KEY (aprobado_por) REFERENCES auth.users(id),
  CONSTRAINT campanias_descuento_publicado_fkey
    FOREIGN KEY (publicado_por) REFERENCES auth.users(id),
  CONSTRAINT campanias_descuento_cancelado_fkey
    FOREIGN KEY (cancelado_por) REFERENCES auth.users(id)
);

-- Trigger: actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION trg_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_campanias_updated_at
  BEFORE UPDATE ON public.campanias_descuento
  FOR EACH ROW EXECUTE FUNCTION trg_updated_at();


-- ─── 2. TABLA DETALLE: campania_descuento_detalle ────────────────────────────
CREATE TABLE IF NOT EXISTS public.campania_descuento_detalle (
  id                           uuid         NOT NULL DEFAULT gen_random_uuid(),
  campania_id                  uuid         NOT NULL,
  company_id                   uuid         NOT NULL,   -- desnormalizado para RLS eficiente

  -- Referencias
  product_id                   uuid         NOT NULL,
  lote_id                      uuid         NOT NULL,

  -- Snapshot financiero al momento del análisis (inmutable post-inserción)
  cantidad_disponible          integer      NOT NULL CHECK (cantidad_disponible > 0),
  precio_compra                numeric(12,4) NOT NULL CHECK (precio_compra > 0),
  precio_venta_actual          numeric(12,4) NOT NULL CHECK (precio_venta_actual > 0),

  -- Límites calculados por BD (NUNCA por frontend)
  porcentaje_maximo_permitido  numeric(6,4) NOT NULL,  -- 0.00–99.99 (%)
  precio_minimo_permitido      numeric(12,4) NOT NULL CHECK (precio_minimo_permitido > 0),

  -- Valores editables por el usuario dentro del límite
  porcentaje_descuento_aprobado numeric(6,4) DEFAULT 0
                                  CHECK (porcentaje_descuento_aprobado >= 0),
  precio_oferta                numeric(12,4),

  -- Resultado financiero
  margen_resultante            numeric(6,4),           -- % margen final
  ganancia_por_unidad          numeric(12,4),
  ganancia_total_estimada      numeric(12,4),

  -- Control
  activo                       boolean      NOT NULL DEFAULT true,
  motivo_inactivo              text,

  -- Timestamps
  created_at                   timestamptz  NOT NULL DEFAULT now(),
  updated_at                   timestamptz  NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT campania_detalle_pkey PRIMARY KEY (id),
  CONSTRAINT campania_detalle_campania_fkey
    FOREIGN KEY (campania_id) REFERENCES public.campanias_descuento(id) ON DELETE CASCADE,
  CONSTRAINT campania_detalle_product_fkey
    FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT campania_detalle_lote_fkey
    FOREIGN KEY (lote_id) REFERENCES public.purchase_batches(id),
  CONSTRAINT campania_detalle_company_fkey
    FOREIGN KEY (company_id) REFERENCES public.companies(id),
  -- Un lote no puede aparecer dos veces en la misma campaña
  CONSTRAINT campania_detalle_unique_lote
    UNIQUE (campania_id, lote_id),
  -- El descuento aprobado nunca puede superar el máximo permitido
  CONSTRAINT campania_detalle_descuento_valido
    CHECK (porcentaje_descuento_aprobado <= porcentaje_maximo_permitido)
);

CREATE TRIGGER trg_detalle_updated_at
  BEFORE UPDATE ON public.campania_descuento_detalle
  FOR EACH ROW EXECUTE FUNCTION trg_updated_at();


-- ─── 3. TABLA: ofertas_virtuales (catálogo público) ──────────────────────────
-- Existente en el sistema — extendemos con columna campania_detalle_id
-- Si no existe, la creamos completa:
CREATE TABLE IF NOT EXISTS public.ofertas_virtuales (
  id                    uuid         NOT NULL DEFAULT gen_random_uuid(),
  company_id            uuid         NOT NULL,
  product_id            uuid         NOT NULL,
  lote_id               uuid         NOT NULL,

  -- Origen de la oferta (obligatorio para trazabilidad)
  campania_detalle_id   uuid         NOT NULL,

  -- Precios
  precio_original       numeric(12,4) NOT NULL,
  precio_oferta         numeric(12,4) NOT NULL,
  porcentaje_descuento  numeric(6,4)  NOT NULL,

  -- Vigencia
  fecha_inicio          date         NOT NULL,
  fecha_fin             date         NOT NULL,
  activo                boolean      NOT NULL DEFAULT true,

  -- Timestamps
  created_at            timestamptz  NOT NULL DEFAULT now(),
  updated_at            timestamptz  NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT ofertas_virtuales_pkey PRIMARY KEY (id),
  CONSTRAINT ofertas_virtuales_company_fkey
    FOREIGN KEY (company_id) REFERENCES public.companies(id),
  CONSTRAINT ofertas_virtuales_product_fkey
    FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT ofertas_virtuales_lote_fkey
    FOREIGN KEY (lote_id) REFERENCES public.purchase_batches(id),
  CONSTRAINT ofertas_virtuales_detalle_fkey
    FOREIGN KEY (campania_detalle_id) REFERENCES public.campania_descuento_detalle(id),
  -- Un lote activo no puede tener dos ofertas activas simultáneas
  CONSTRAINT ofertas_virtuales_unique_lote_activo
    UNIQUE NULLS NOT DISTINCT (lote_id, activo)
    -- NOTA: en PG<15 usar índice parcial (ver 02_indexes.sql)
);

CREATE TRIGGER trg_ofertas_updated_at
  BEFORE UPDATE ON public.ofertas_virtuales
  FOR EACH ROW EXECUTE FUNCTION trg_updated_at();


-- ─── 4. TABLA AUDITORÍA: campania_audit_log ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.campania_audit_log (
  id           bigint      GENERATED ALWAYS AS IDENTITY,
  campania_id  uuid        NOT NULL,
  company_id   uuid        NOT NULL,
  user_id      uuid,
  accion       text        NOT NULL,   -- 'CREAR','CALCULAR','EDITAR_DETALLE','APROBAR','PUBLICAR','CANCELAR'
  estado_antes estado_campania,
  estado_despues estado_campania,
  detalle      jsonb       DEFAULT '{}',
  ip_address   inet,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT campania_audit_log_pkey PRIMARY KEY (id),
  CONSTRAINT audit_campania_fkey
    FOREIGN KEY (campania_id) REFERENCES public.campanias_descuento(id) ON DELETE CASCADE
);
-- ============================================================
-- 02_INDEXES.SQL — Índices para performance enterprise
-- ============================================================

-- ─── campanias_descuento ─────────────────────────────────────
-- Filtro primario: empresa + estado (query más frecuente)
CREATE INDEX IF NOT EXISTS idx_campanias_company_estado
  ON public.campanias_descuento (company_id, estado);

-- Para vistas de "mis campañas" y auditoría
CREATE INDEX IF NOT EXISTS idx_campanias_company_created
  ON public.campanias_descuento (company_id, created_at DESC);

-- Campañas publicadas vigentes (catálogo público)
CREATE INDEX IF NOT EXISTS idx_campanias_publicadas_vigentes
  ON public.campanias_descuento (company_id, fecha_inicio, fecha_fin)
  WHERE estado = 'PUBLICADA';

-- ─── campania_descuento_detalle ──────────────────────────────
-- Join más frecuente: detalle → campaña
CREATE INDEX IF NOT EXISTS idx_detalle_campania
  ON public.campania_descuento_detalle (campania_id)
  WHERE activo = true;

-- Filtro por lote (para verificar si ya está en campaña)
CREATE INDEX IF NOT EXISTS idx_detalle_lote
  ON public.campania_descuento_detalle (lote_id);

-- Filtro por empresa (RLS + queries directas)
CREATE INDEX IF NOT EXISTS idx_detalle_company
  ON public.campania_descuento_detalle (company_id);

-- Búsqueda de detalles de un producto específico en campañas activas
CREATE INDEX IF NOT EXISTS idx_detalle_product_company
  ON public.campania_descuento_detalle (product_id, company_id)
  WHERE activo = true;

-- ─── ofertas_virtuales ───────────────────────────────────────
-- Consulta principal del catálogo público
CREATE INDEX IF NOT EXISTS idx_ofertas_company_activo
  ON public.ofertas_virtuales (company_id, activo, fecha_inicio, fecha_fin)
  WHERE activo = true;

CREATE INDEX IF NOT EXISTS idx_ofertas_product_company
  ON public.ofertas_virtuales (product_id, company_id)
  WHERE activo = true;

CREATE INDEX IF NOT EXISTS idx_ofertas_lote
  ON public.ofertas_virtuales (lote_id)
  WHERE activo = true;

-- Índice parcial para el UNIQUE de lote activo (PG < 15 fallback)
-- DROP CONSTRAINT antes si se usó la sintaxis UNIQUE NULLS NOT DISTINCT
CREATE UNIQUE INDEX IF NOT EXISTS idx_ofertas_lote_activo_unique
  ON public.ofertas_virtuales (lote_id)
  WHERE activo = true;

-- ─── purchase_batches (tabla existente) ──────────────────────
-- Si no existen, los creamos para soportar el análisis
CREATE INDEX IF NOT EXISTS idx_batches_company_product
  ON public.purchase_batches (company_id, product_id)
  WHERE remaining_quantity > 0;

CREATE INDEX IF NOT EXISTS idx_batches_company_remaining
  ON public.purchase_batches (company_id, remaining_quantity DESC)
  WHERE remaining_quantity > 0;

-- ─── Auditoría ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_audit_campania_created
  ON public.campania_audit_log (campania_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_company_created
  ON public.campania_audit_log (company_id, created_at DESC);
-- ============================================================
-- 03_RLS.SQL — Row Level Security completo
-- ============================================================
-- PRINCIPIO DE DISEÑO:
--   • Toda política usa company_id para aislar empresas.
--   • El helper fn_user_company_id() evita repetir el JOIN.
--   • Las funciones SECURITY DEFINER validan company_id internamente.
--   • RLS se aplica también a lecturas del catálogo público.
-- ============================================================

-- ─── Helper: obtener company_id del usuario autenticado ──────
-- SECURITY DEFINER + search_path fijo: impide inyección de schema
CREATE OR REPLACE FUNCTION public.fn_user_company_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id
  FROM public.user_companies
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- Helper: verificar rol mínimo del usuario
CREATE OR REPLACE FUNCTION public.fn_user_role()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_companies
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- Helper: ¿el usuario es admin o gerente?
CREATE OR REPLACE FUNCTION public.fn_is_manager()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_companies
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'gerente')
  );
$$;


-- ═══════════════════════════════════════════════════════════════
-- TABLA: campanias_descuento
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE public.campanias_descuento ENABLE ROW LEVEL SECURITY;

-- Lectura: cualquier usuario autenticado de la misma empresa
CREATE POLICY "campanias_select_own_company"
  ON public.campanias_descuento
  FOR SELECT
  USING (
    company_id = public.fn_user_company_id()
  );

-- Inserción: solo admin o gerente
CREATE POLICY "campanias_insert_managers"
  ON public.campanias_descuento
  FOR INSERT
  WITH CHECK (
    company_id = public.fn_user_company_id()
    AND public.fn_is_manager()
    AND creado_por = auth.uid()
  );

-- Actualización: solo admin/gerente de la misma empresa
-- El campo estado solo puede cambiar via RPC (no UPDATE directo)
CREATE POLICY "campanias_update_managers"
  ON public.campanias_descuento
  FOR UPDATE
  USING (
    company_id = public.fn_user_company_id()
    AND public.fn_is_manager()
  )
  WITH CHECK (
    company_id = public.fn_user_company_id()
  );

-- No se permite DELETE físico — solo CANCELADA
-- Si se quiere permitir para admin:
CREATE POLICY "campanias_delete_admin_only"
  ON public.campanias_descuento
  FOR DELETE
  USING (
    company_id = public.fn_user_company_id()
    AND public.fn_user_role() = 'admin'
    AND estado = 'BORRADOR'  -- Solo se puede eliminar si nunca fue calculada
  );


-- ═══════════════════════════════════════════════════════════════
-- TABLA: campania_descuento_detalle
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE public.campania_descuento_detalle ENABLE ROW LEVEL SECURITY;

-- Lectura: usuario de la misma empresa
CREATE POLICY "detalle_select_own_company"
  ON public.campania_descuento_detalle
  FOR SELECT
  USING (company_id = public.fn_user_company_id());

-- Inserción: solo via RPC (SECURITY DEFINER), pero esta política
-- cubre el caso excepcional de insert directo (solo managers)
CREATE POLICY "detalle_insert_managers"
  ON public.campania_descuento_detalle
  FOR INSERT
  WITH CHECK (
    company_id = public.fn_user_company_id()
    AND public.fn_is_manager()
  );

-- Actualización: managers pueden editar porcentaje_descuento_aprobado
-- La BD valida que no supere porcentaje_maximo_permitido (via CHECK constraint)
CREATE POLICY "detalle_update_managers"
  ON public.campania_descuento_detalle
  FOR UPDATE
  USING (
    company_id = public.fn_user_company_id()
    AND public.fn_is_manager()
  )
  WITH CHECK (
    company_id = public.fn_user_company_id()
  );

-- No DELETE directo en detalles — solo via RPC o cuando campaña es BORRADOR
CREATE POLICY "detalle_delete_borrador"
  ON public.campania_descuento_detalle
  FOR DELETE
  USING (
    company_id = public.fn_user_company_id()
    AND public.fn_user_role() = 'admin'
    AND EXISTS (
      SELECT 1 FROM public.campanias_descuento cd
      WHERE cd.id = campania_id
        AND cd.estado = 'BORRADOR'
    )
  );


-- ═══════════════════════════════════════════════════════════════
-- TABLA: ofertas_virtuales
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE public.ofertas_virtuales ENABLE ROW LEVEL SECURITY;

-- Lectura pública: SOLO ofertas activas y vigentes (catálogo público)
-- No requiere auth.uid() — es acceso anónimo
CREATE POLICY "ofertas_select_public_active"
  ON public.ofertas_virtuales
  FOR SELECT
  USING (
    activo = true
    AND CURRENT_DATE BETWEEN fecha_inicio AND fecha_fin
  );

-- Lectura autenticada: admins/gerentes ven todas las de su empresa
CREATE POLICY "ofertas_select_authenticated"
  ON public.ofertas_virtuales
  FOR SELECT
  USING (
    company_id = public.fn_user_company_id()
  );

-- INSERT/UPDATE/DELETE: solo via RPC con SECURITY DEFINER
-- Esta política bloquea acceso directo desde frontend
CREATE POLICY "ofertas_no_direct_write"
  ON public.ofertas_virtuales
  FOR INSERT
  WITH CHECK (false);  -- Bloqueado — usar rpc_publicar_campania

CREATE POLICY "ofertas_update_admin"
  ON public.ofertas_virtuales
  FOR UPDATE
  USING (
    company_id = public.fn_user_company_id()
    AND public.fn_user_role() = 'admin'
  );

-- ═══════════════════════════════════════════════════════════════
-- TABLA: campania_audit_log
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE public.campania_audit_log ENABLE ROW LEVEL SECURITY;

-- Solo lectura, solo para la propia empresa, solo managers
CREATE POLICY "audit_select_managers"
  ON public.campania_audit_log
  FOR SELECT
  USING (
    company_id = public.fn_user_company_id()
    AND public.fn_is_manager()
  );

-- INSERT solo via funciones internas (SECURITY DEFINER)
-- Política bloqueante directa:
CREATE POLICY "audit_no_direct_insert"
  ON public.campania_audit_log
  FOR INSERT
  WITH CHECK (false);
-- ============================================================
-- 04_FUNCTIONS.SQL — Funciones RPC enterprise
-- ============================================================
-- ARQUITECTURA DE SEGURIDAD:
--   • SECURITY DEFINER + search_path fijo en todas las funciones
--   • Validación de company_id en cada función (no se confía en parámetros)
--   • SELECT FOR UPDATE para control de concurrencia
--   • Advisory locks para prevenir doble ejecución simultánea
--   • NUMERIC en todos los cálculos financieros (no FLOAT)
--   • Auditoría automática en cada transición de estado
-- ============================================================

-- ─── Helper interno: registrar en audit log ──────────────────
CREATE OR REPLACE FUNCTION internal_audit_campania(
  p_campania_id   uuid,
  p_company_id    uuid,
  p_accion        text,
  p_estado_antes  estado_campania,
  p_estado_despues estado_campania,
  p_detalle       jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.campania_audit_log
    (campania_id, company_id, user_id, accion, estado_antes, estado_despues, detalle)
  VALUES
    (p_campania_id, p_company_id, auth.uid(),
     p_accion, p_estado_antes, p_estado_despues, p_detalle);
END;
$$;


-- ═══════════════════════════════════════════════════════════════
-- RPC 1: rpc_crear_campania
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.rpc_crear_campania(
  p_nombre        text,
  p_descripcion   text      DEFAULT NULL,
  p_fecha_inicio  date      DEFAULT CURRENT_DATE,
  p_fecha_fin     date      DEFAULT CURRENT_DATE + 30,
  p_margen_minimo numeric   DEFAULT 15.0
)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id  uuid;
  v_user_id     uuid;
  v_role        text;
  v_campania_id uuid;
BEGIN
  -- 1. Autenticación
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED: usuario no autenticado'
      USING ERRCODE = 'P0001';
  END IF;

  -- 2. Obtener empresa y validar rol
  SELECT uc.company_id, uc.role
    INTO v_company_id, v_role
    FROM public.user_companies uc
    WHERE uc.user_id = v_user_id
    LIMIT 1;

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'FORBIDDEN: usuario sin empresa asignada'
      USING ERRCODE = 'P0002';
  END IF;

  IF v_role NOT IN ('admin', 'gerente') THEN
    RAISE EXCEPTION 'FORBIDDEN: se requiere rol admin o gerente'
      USING ERRCODE = 'P0003';
  END IF;

  -- 3. Validaciones de negocio
  IF p_fecha_fin <= p_fecha_inicio THEN
    RAISE EXCEPTION 'VALIDATION: fecha_fin debe ser posterior a fecha_inicio'
      USING ERRCODE = 'P0010';
  END IF;

  IF p_margen_minimo < 0 OR p_margen_minimo >= 100 THEN
    RAISE EXCEPTION 'VALIDATION: margen_minimo debe estar entre 0 y 99.99'
      USING ERRCODE = 'P0011';
  END IF;

  IF char_length(trim(p_nombre)) < 3 THEN
    RAISE EXCEPTION 'VALIDATION: nombre debe tener al menos 3 caracteres'
      USING ERRCODE = 'P0012';
  END IF;

  -- 4. Insertar
  INSERT INTO public.campanias_descuento
    (company_id, nombre, descripcion, fecha_inicio, fecha_fin,
     margen_minimo, estado, creado_por)
  VALUES
    (v_company_id, trim(p_nombre), p_descripcion, p_fecha_inicio, p_fecha_fin,
     p_margen_minimo, 'BORRADOR', v_user_id)
  RETURNING id INTO v_campania_id;

  -- 5. Auditoría
  PERFORM internal_audit_campania(
    v_campania_id, v_company_id, 'CREAR',
    NULL, 'BORRADOR',
    json_build_object('nombre', p_nombre)::jsonb
  );

  RETURN json_build_object(
    'success', true,
    'campania_id', v_campania_id,
    'message', 'Campaña creada en estado BORRADOR'
  );
END;
$$;


-- ═══════════════════════════════════════════════════════════════
-- RPC 2: rpc_generar_analisis_campania
-- ═══════════════════════════════════════════════════════════════
-- Corre el análisis de lotes disponibles y calcula descuentos máximos.
-- Es la operación más costosa — usa FOR UPDATE para bloquear lotes.
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.rpc_generar_analisis_campania(
  p_campania_id uuid
)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id      uuid;
  v_user_id         uuid;
  v_campania        public.campanias_descuento%ROWTYPE;
  v_detalle_count   integer := 0;
  v_lock_key        bigint;

  -- Cursor para procesar lotes con margen positivo
  rec RECORD;

  -- Variables de cálculo financiero (NUMERIC, nunca FLOAT)
  v_margen_actual          numeric(6,4);
  v_precio_minimo          numeric(12,4);
  v_porcentaje_maximo      numeric(6,4);
  v_ganancia_por_unidad    numeric(12,4);
  v_ganancia_total         numeric(12,4);
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED' USING ERRCODE = 'P0001';
  END IF;

  -- 1. Advisory lock — previene dos ejecuciones simultáneas para la misma campaña
  -- Convertimos el UUID a bigint para pg_try_advisory_xact_lock
  v_lock_key := ('x' || substr(p_campania_id::text, 1, 16))::bit(64)::bigint;
  IF NOT pg_try_advisory_xact_lock(v_lock_key) THEN
    RAISE EXCEPTION 'CONFLICT: análisis en progreso para esta campaña. Intente en un momento'
      USING ERRCODE = 'P0020';
  END IF;

  -- 2. Obtener y validar campaña con FOR UPDATE (bloqueo de fila)
  SELECT * INTO v_campania
    FROM public.campanias_descuento
    WHERE id = p_campania_id
    FOR UPDATE;  -- bloqueo exclusivo

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND: campaña no encontrada'
      USING ERRCODE = 'P0030';
  END IF;

  -- 3. Validar ownership — company_id debe coincidir con la del usuario
  SELECT uc.company_id INTO v_company_id
    FROM public.user_companies uc
    WHERE uc.user_id = v_user_id
    LIMIT 1;

  IF v_company_id IS NULL OR v_campania.company_id != v_company_id THEN
    RAISE EXCEPTION 'FORBIDDEN: no tiene acceso a esta campaña'
      USING ERRCODE = 'P0003';
  END IF;

  -- 4. Solo se puede recalcular si está en BORRADOR o CALCULADA
  IF v_campania.estado NOT IN ('BORRADOR', 'CALCULADA') THEN
    RAISE EXCEPTION 'STATE_ERROR: el análisis solo puede ejecutarse en estado BORRADOR o CALCULADA. Estado actual: %',
      v_campania.estado
      USING ERRCODE = 'P0040';
  END IF;

  -- 5. Limpiar detalles previos (si es recálculo)
  DELETE FROM public.campania_descuento_detalle
    WHERE campania_id = p_campania_id;

  -- 6. Analizar lotes disponibles con JOIN a productos
  -- FOR UPDATE en purchase_batches: snapshot consistente, evita race condition
  FOR rec IN
    SELECT
      pb.id                 AS lote_id,
      pb.product_id,
      pb.remaining_quantity AS cantidad_disponible,
      pb.purchase_price     AS precio_compra,
      p.sale_price          AS precio_venta_actual,
      p.name                AS product_name
    FROM public.purchase_batches pb
    INNER JOIN public.products p
      ON p.id = pb.product_id
     AND p.company_id = v_company_id
    WHERE pb.company_id = v_company_id
      AND pb.remaining_quantity > 0
      AND p.is_public = true    -- Solo productos visibles en catálogo
    ORDER BY pb.purchase_price DESC  -- Lotes más caros primero (criterio conservador)
    FOR UPDATE OF pb SKIP LOCKED     -- SKIP LOCKED: no bloquear si otro proceso tiene el lote
  LOOP
    -- ── REGLA FINANCIERA CRÍTICA ──────────────────────────────
    -- Validar que el precio de venta > precio de compra
    IF rec.precio_venta_actual <= rec.precio_compra THEN
      -- Producto bajo agua — no incluir, pero registrar como inactivo
      INSERT INTO public.campania_descuento_detalle (
        campania_id, company_id, product_id, lote_id,
        cantidad_disponible, precio_compra, precio_venta_actual,
        porcentaje_maximo_permitido, precio_minimo_permitido,
        porcentaje_descuento_aprobado, precio_oferta,
        margen_resultante, ganancia_por_unidad, ganancia_total_estimada,
        activo, motivo_inactivo
      ) VALUES (
        p_campania_id, v_company_id, rec.product_id, rec.lote_id,
        rec.cantidad_disponible, rec.precio_compra, rec.precio_venta_actual,
        0, rec.precio_compra,  -- máximo 0%, mínimo = costo
        0, rec.precio_venta_actual,
        0, 0, 0,
        false, 'Precio de venta menor o igual al precio de compra'
      );
      CONTINUE;
    END IF;

    -- precio_minimo_permitido = precio_compra / (1 - margen_minimo/100)
    v_precio_minimo := rec.precio_compra / (1 - v_campania.margen_minimo / 100.0);

    -- Si el precio mínimo supera el precio de venta actual, no hay descuento posible
    IF v_precio_minimo >= rec.precio_venta_actual THEN
      INSERT INTO public.campania_descuento_detalle (
        campania_id, company_id, product_id, lote_id,
        cantidad_disponible, precio_compra, precio_venta_actual,
        porcentaje_maximo_permitido, precio_minimo_permitido,
        porcentaje_descuento_aprobado, precio_oferta,
        margen_resultante, ganancia_por_unidad, ganancia_total_estimada,
        activo, motivo_inactivo
      ) VALUES (
        p_campania_id, v_company_id, rec.product_id, rec.lote_id,
        rec.cantidad_disponible, rec.precio_compra, rec.precio_venta_actual,
        0, v_precio_minimo,
        0, rec.precio_venta_actual,
        -- Margen actual sin descuento
        ROUND(((rec.precio_venta_actual - rec.precio_compra) / rec.precio_venta_actual) * 100, 4),
        ROUND(rec.precio_venta_actual - rec.precio_compra, 4),
        ROUND((rec.precio_venta_actual - rec.precio_compra) * rec.cantidad_disponible, 4),
        false, 'Margen actual insuficiente para aplicar descuento con el margen mínimo configurado'
      );
      CONTINUE;
    END IF;

    -- porcentaje_maximo_permitido = (1 - precio_minimo / precio_venta_actual) * 100
    v_porcentaje_maximo := ROUND(
      (1 - v_precio_minimo / rec.precio_venta_actual) * 100,
      4
    );

    -- Margen actual del producto
    v_margen_actual := ROUND(
      ((rec.precio_venta_actual - rec.precio_compra) / rec.precio_venta_actual) * 100,
      4
    );

    -- Ganancia estimada SIN descuento (baseline)
    v_ganancia_por_unidad := ROUND(rec.precio_venta_actual - rec.precio_compra, 4);
    v_ganancia_total       := ROUND(v_ganancia_por_unidad * rec.cantidad_disponible, 4);

    -- Insertar detalle activo — descuento aprobado inicial = 0 (el usuario lo ajusta)
    INSERT INTO public.campania_descuento_detalle (
      campania_id, company_id, product_id, lote_id,
      cantidad_disponible, precio_compra, precio_venta_actual,
      porcentaje_maximo_permitido, precio_minimo_permitido,
      porcentaje_descuento_aprobado, precio_oferta,
      margen_resultante, ganancia_por_unidad, ganancia_total_estimada,
      activo
    ) VALUES (
      p_campania_id, v_company_id, rec.product_id, rec.lote_id,
      rec.cantidad_disponible,
      rec.precio_compra,
      rec.precio_venta_actual,
      v_porcentaje_maximo,
      ROUND(v_precio_minimo, 4),
      0,                          -- descuento inicial 0 — usuario decide
      rec.precio_venta_actual,    -- precio oferta inicial = precio actual
      v_margen_actual,
      v_ganancia_por_unidad,
      v_ganancia_total,
      true
    );

    v_detalle_count := v_detalle_count + 1;
  END LOOP;

  -- 7. Actualizar estado a CALCULADA
  UPDATE public.campanias_descuento
    SET estado = 'CALCULADA',
        updated_at = now()
    WHERE id = p_campania_id;

  -- 8. Auditoría
  PERFORM internal_audit_campania(
    p_campania_id, v_company_id, 'CALCULAR',
    v_campania.estado, 'CALCULADA',
    json_build_object(
      'lotes_analizados', v_detalle_count,
      'margen_minimo', v_campania.margen_minimo
    )::jsonb
  );

  RETURN json_build_object(
    'success', true,
    'campania_id', p_campania_id,
    'lotes_elegibles', v_detalle_count,
    'message', format('Análisis completado: %s lotes elegibles para descuento', v_detalle_count)
  );
END;
$$;


-- ═══════════════════════════════════════════════════════════════
-- RPC 3: rpc_actualizar_descuento_detalle
-- Permite al usuario ajustar manualmente el % de descuento
-- La BD rechaza cualquier valor que rompa el margen mínimo
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.rpc_actualizar_descuento_detalle(
  p_detalle_id              uuid,
  p_porcentaje_descuento    numeric   -- valor entre 0 y porcentaje_maximo_permitido
)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id    uuid;
  v_user_id       uuid;
  v_detalle       public.campania_descuento_detalle%ROWTYPE;
  v_campania      public.campanias_descuento%ROWTYPE;
  v_precio_oferta numeric(12,4);
  v_margen_final  numeric(6,4);
  v_ganancia_u    numeric(12,4);
  v_ganancia_t    numeric(12,4);
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED' USING ERRCODE = 'P0001';
  END IF;

  -- Obtener empresa del usuario
  SELECT uc.company_id INTO v_company_id
    FROM public.user_companies uc
    WHERE uc.user_id = v_user_id
      AND uc.role IN ('admin', 'gerente')
    LIMIT 1;

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'FORBIDDEN: se requiere rol admin o gerente'
      USING ERRCODE = 'P0003';
  END IF;

  -- Obtener detalle con bloqueo
  SELECT * INTO v_detalle
    FROM public.campania_descuento_detalle
    WHERE id = p_detalle_id
      AND company_id = v_company_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND: detalle no encontrado o sin acceso'
      USING ERRCODE = 'P0030';
  END IF;

  IF NOT v_detalle.activo THEN
    RAISE EXCEPTION 'VALIDATION: no se puede modificar un detalle inactivo'
      USING ERRCODE = 'P0050';
  END IF;

  -- Obtener campaña y verificar estado
  SELECT * INTO v_campania
    FROM public.campanias_descuento
    WHERE id = v_detalle.campania_id;

  IF v_campania.estado NOT IN ('CALCULADA') THEN
    RAISE EXCEPTION 'STATE_ERROR: solo se pueden editar detalles cuando la campaña está en estado CALCULADA. Estado actual: %',
      v_campania.estado
      USING ERRCODE = 'P0040';
  END IF;

  -- ── VALIDACIÓN FINANCIERA (SERVER-SIDE, NUNCA FRONTEND) ───
  IF p_porcentaje_descuento < 0 THEN
    RAISE EXCEPTION 'VALIDATION: el descuento no puede ser negativo'
      USING ERRCODE = 'P0011';
  END IF;

  IF p_porcentaje_descuento > v_detalle.porcentaje_maximo_permitido THEN
    RAISE EXCEPTION 'FINANCIAL_VIOLATION: el descuento % supera el máximo permitido de %% (margen mínimo configurado: %%)',
      p_porcentaje_descuento,
      v_detalle.porcentaje_maximo_permitido,
      v_campania.margen_minimo
      USING ERRCODE = 'P0060';
  END IF;

  -- Calcular precio de oferta
  v_precio_oferta := ROUND(
    v_detalle.precio_venta_actual * (1 - p_porcentaje_descuento / 100),
    4
  );

  -- Validación doble: el precio oferta nunca puede caer bajo el mínimo
  IF v_precio_oferta < v_detalle.precio_minimo_permitido THEN
    RAISE EXCEPTION 'FINANCIAL_VIOLATION: precio oferta calculado ($%) es menor al precio mínimo permitido ($%)',
      v_precio_oferta,
      v_detalle.precio_minimo_permitido
      USING ERRCODE = 'P0061';
  END IF;

  -- Calcular margen resultante
  v_margen_final := ROUND(
    ((v_precio_oferta - v_detalle.precio_compra) / v_precio_oferta) * 100,
    4
  );

  v_ganancia_u := ROUND(v_precio_oferta - v_detalle.precio_compra, 4);
  v_ganancia_t := ROUND(v_ganancia_u * v_detalle.cantidad_disponible, 4);

  -- Actualizar
  UPDATE public.campania_descuento_detalle
    SET porcentaje_descuento_aprobado = p_porcentaje_descuento,
        precio_oferta                  = v_precio_oferta,
        margen_resultante              = v_margen_final,
        ganancia_por_unidad            = v_ganancia_u,
        ganancia_total_estimada        = v_ganancia_t,
        updated_at                     = now()
    WHERE id = p_detalle_id;

  RETURN json_build_object(
    'success', true,
    'detalle_id', p_detalle_id,
    'precio_oferta', v_precio_oferta,
    'margen_resultante', v_margen_final,
    'ganancia_total_estimada', v_ganancia_t
  );
END;
$$;


-- ═══════════════════════════════════════════════════════════════
-- RPC 4: rpc_aprobar_campania
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.rpc_aprobar_campania(
  p_campania_id uuid
)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id     uuid;
  v_user_id        uuid;
  v_role           text;
  v_campania       public.campanias_descuento%ROWTYPE;
  v_lock_key       bigint;
  v_detalle_activo integer;
  v_margen_min_ok  boolean;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED' USING ERRCODE = 'P0001';
  END IF;

  -- Solo admin puede aprobar (separación de roles)
  SELECT uc.company_id, uc.role INTO v_company_id, v_role
    FROM public.user_companies uc
    WHERE uc.user_id = v_user_id LIMIT 1;

  IF v_role NOT IN ('admin', 'gerente') THEN
    RAISE EXCEPTION 'FORBIDDEN: la aprobación requiere rol admin o gerente'
      USING ERRCODE = 'P0003';
  END IF;

  -- Advisory lock para prevenir doble aprobación simultánea
  v_lock_key := ('x' || substr(p_campania_id::text, 1, 16))::bit(64)::bigint;
  IF NOT pg_try_advisory_xact_lock(v_lock_key) THEN
    RAISE EXCEPTION 'CONFLICT: aprobación en progreso. Intente en un momento'
      USING ERRCODE = 'P0020';
  END IF;

  -- Obtener campaña con bloqueo exclusivo
  SELECT * INTO v_campania
    FROM public.campanias_descuento
    WHERE id = p_campania_id
      AND company_id = v_company_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND: campaña no encontrada o sin acceso'
      USING ERRCODE = 'P0030';
  END IF;

  -- El creador no puede auto-aprobar (four-eyes principle)
  -- Descomenta si tu negocio requiere segregación de funciones:
  -- IF v_campania.creado_por = v_user_id THEN
  --   RAISE EXCEPTION 'FORBIDDEN: el creador no puede aprobar su propia campaña';
  -- END IF;

  IF v_campania.estado != 'CALCULADA' THEN
    RAISE EXCEPTION 'STATE_ERROR: la campaña debe estar en estado CALCULADA para aprobar. Estado actual: %',
      v_campania.estado
      USING ERRCODE = 'P0040';
  END IF;

  -- Verificar que existan detalles activos con descuento configurado
  SELECT COUNT(*) INTO v_detalle_activo
    FROM public.campania_descuento_detalle
    WHERE campania_id = p_campania_id
      AND activo = true
      AND porcentaje_descuento_aprobado > 0;

  IF v_detalle_activo = 0 THEN
    RAISE EXCEPTION 'VALIDATION: la campaña no tiene productos con descuento configurado. Configure al menos un descuento mayor a 0%%'
      USING ERRCODE = 'P0050';
  END IF;

  -- Validación final de márgenes: ningún detalle activo puede violar el margen mínimo
  SELECT EXISTS (
    SELECT 1
    FROM public.campania_descuento_detalle
    WHERE campania_id = p_campania_id
      AND activo = true
      AND porcentaje_descuento_aprobado > 0
      AND margen_resultante < v_campania.margen_minimo
  ) INTO v_margen_min_ok;

  IF v_margen_min_ok THEN
    RAISE EXCEPTION 'FINANCIAL_VIOLATION: uno o más detalles tienen margen resultante por debajo del mínimo configurado (%%). Revise y corrija antes de aprobar',
      v_campania.margen_minimo
      USING ERRCODE = 'P0060';
  END IF;

  -- Aprobar
  UPDATE public.campanias_descuento
    SET estado       = 'APROBADA',
        aprobado_por = v_user_id,
        aprobado_at  = now(),
        updated_at   = now()
    WHERE id = p_campania_id;

  PERFORM internal_audit_campania(
    p_campania_id, v_company_id, 'APROBAR',
    'CALCULADA', 'APROBADA',
    json_build_object('productos_con_descuento', v_detalle_activo)::jsonb
  );

  RETURN json_build_object(
    'success', true,
    'campania_id', p_campania_id,
    'productos_aprobados', v_detalle_activo,
    'message', 'Campaña aprobada correctamente'
  );
END;
$$;


-- ═══════════════════════════════════════════════════════════════
-- RPC 5: rpc_publicar_campania
-- Inserta en ofertas_virtuales de forma atómica.
-- Previene doble publicación con advisory lock + CHECK de estado.
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.rpc_publicar_campania(
  p_campania_id uuid
)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id      uuid;
  v_user_id         uuid;
  v_role            text;
  v_campania        public.campanias_descuento%ROWTYPE;
  v_lock_key        bigint;
  v_ofertas_creadas integer := 0;
  rec               RECORD;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED' USING ERRCODE = 'P0001';
  END IF;

  SELECT uc.company_id, uc.role INTO v_company_id, v_role
    FROM public.user_companies uc
    WHERE uc.user_id = v_user_id LIMIT 1;

  IF v_role NOT IN ('admin', 'gerente') THEN
    RAISE EXCEPTION 'FORBIDDEN: se requiere rol admin o gerente para publicar'
      USING ERRCODE = 'P0003';
  END IF;

  -- Advisory lock (mismo key que aprobar, sección diferente)
  v_lock_key := ('x' || substr(p_campania_id::text, 1, 16))::bit(64)::bigint + 1;
  IF NOT pg_try_advisory_xact_lock(v_lock_key) THEN
    RAISE EXCEPTION 'CONFLICT: publicación en progreso. Intente en un momento'
      USING ERRCODE = 'P0020';
  END IF;

  -- Bloqueo exclusivo de la fila de campaña
  SELECT * INTO v_campania
    FROM public.campanias_descuento
    WHERE id = p_campania_id
      AND company_id = v_company_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND: campaña no encontrada' USING ERRCODE = 'P0030';
  END IF;

  IF v_campania.estado != 'APROBADA' THEN
    RAISE EXCEPTION 'STATE_ERROR: la campaña debe estar en estado APROBADA para publicar. Estado actual: %',
      v_campania.estado
      USING ERRCODE = 'P0040';
  END IF;

  -- Verificar que no existan ya ofertas activas de esta campaña (doble publicación)
  IF EXISTS (
    SELECT 1 FROM public.ofertas_virtuales ov
    INNER JOIN public.campania_descuento_detalle cdd ON cdd.id = ov.campania_detalle_id
    WHERE cdd.campania_id = p_campania_id
      AND ov.activo = true
  ) THEN
    RAISE EXCEPTION 'DUPLICATE: esta campaña ya tiene ofertas activas publicadas'
      USING ERRCODE = 'P0070';
  END IF;

  -- Iterar detalles activos e insertar en ofertas_virtuales
  FOR rec IN
    SELECT
      cdd.id              AS detalle_id,
      cdd.product_id,
      cdd.lote_id,
      cdd.precio_venta_actual AS precio_original,
      cdd.precio_oferta,
      cdd.porcentaje_descuento_aprobado
    FROM public.campania_descuento_detalle cdd
    WHERE cdd.campania_id = p_campania_id
      AND cdd.activo = true
      AND cdd.porcentaje_descuento_aprobado > 0
    -- Bloquear lotes para evitar race con ventas concurrentes
    FOR UPDATE OF cdd SKIP LOCKED
  LOOP
    -- Verificar que el lote sigue teniendo stock
    IF NOT EXISTS (
      SELECT 1 FROM public.purchase_batches
      WHERE id = rec.lote_id
        AND remaining_quantity > 0
    ) THEN
      -- Marcar como inactivo y continuar
      UPDATE public.campania_descuento_detalle
        SET activo = false,
            motivo_inactivo = 'Lote sin stock en el momento de publicar'
        WHERE id = rec.detalle_id;
      CONTINUE;
    END IF;

    -- Insertar oferta virtual
    INSERT INTO public.ofertas_virtuales (
      company_id, product_id, lote_id, campania_detalle_id,
      precio_original, precio_oferta, porcentaje_descuento,
      fecha_inicio, fecha_fin, activo
    ) VALUES (
      v_company_id,
      rec.product_id,
      rec.lote_id,
      rec.detalle_id,
      rec.precio_original,
      rec.precio_oferta,
      rec.porcentaje_descuento_aprobado,
      v_campania.fecha_inicio,
      v_campania.fecha_fin,
      true
    )
    ON CONFLICT (lote_id) WHERE activo = true
    DO NOTHING;  -- Si el lote ya tiene oferta activa, saltar silenciosamente

    v_ofertas_creadas := v_ofertas_creadas + 1;
  END LOOP;

  IF v_ofertas_creadas = 0 THEN
    RAISE EXCEPTION 'VALIDATION: no se pudo publicar ninguna oferta (posible stock agotado en todos los lotes)'
      USING ERRCODE = 'P0050';
  END IF;

  -- Actualizar estado campaña
  UPDATE public.campanias_descuento
    SET estado         = 'PUBLICADA',
        publicado_por  = v_user_id,
        publicado_at   = now(),
        updated_at     = now()
    WHERE id = p_campania_id;

  PERFORM internal_audit_campania(
    p_campania_id, v_company_id, 'PUBLICAR',
    'APROBADA', 'PUBLICADA',
    json_build_object('ofertas_creadas', v_ofertas_creadas)::jsonb
  );

  RETURN json_build_object(
    'success', true,
    'campania_id', p_campania_id,
    'ofertas_publicadas', v_ofertas_creadas,
    'vigencia_inicio', v_campania.fecha_inicio,
    'vigencia_fin', v_campania.fecha_fin,
    'message', format('%s ofertas publicadas en el catálogo', v_ofertas_creadas)
  );
END;
$$;


-- ═══════════════════════════════════════════════════════════════
-- RPC 6: rpc_cancelar_campania
-- Cancela desde cualquier estado y desactiva ofertas si existían
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.rpc_cancelar_campania(
  p_campania_id uuid,
  p_motivo      text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id  uuid;
  v_user_id     uuid;
  v_role        text;
  v_campania    public.campanias_descuento%ROWTYPE;
  v_estado_prev estado_campania;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED' USING ERRCODE = 'P0001';
  END IF;

  SELECT uc.company_id, uc.role INTO v_company_id, v_role
    FROM public.user_companies uc
    WHERE uc.user_id = v_user_id LIMIT 1;

  IF v_role NOT IN ('admin', 'gerente') THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = 'P0003';
  END IF;

  SELECT * INTO v_campania
    FROM public.campanias_descuento
    WHERE id = p_campania_id
      AND company_id = v_company_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND' USING ERRCODE = 'P0030';
  END IF;

  IF v_campania.estado = 'CANCELADA' THEN
    RAISE EXCEPTION 'STATE_ERROR: la campaña ya está cancelada'
      USING ERRCODE = 'P0040';
  END IF;

  v_estado_prev := v_campania.estado;

  -- Si estaba PUBLICADA: desactivar todas sus ofertas
  IF v_campania.estado = 'PUBLICADA' THEN
    UPDATE public.ofertas_virtuales ov
      SET activo = false, updated_at = now()
      FROM public.campania_descuento_detalle cdd
      WHERE cdd.id = ov.campania_detalle_id
        AND cdd.campania_id = p_campania_id;
  END IF;

  UPDATE public.campanias_descuento
    SET estado        = 'CANCELADA',
        cancelado_por = v_user_id,
        cancelado_at  = now(),
        updated_at    = now()
    WHERE id = p_campania_id;

  PERFORM internal_audit_campania(
    p_campania_id, v_company_id, 'CANCELAR',
    v_estado_prev, 'CANCELADA',
    json_build_object('motivo', COALESCE(p_motivo, 'No especificado'))::jsonb
  );

  RETURN json_build_object(
    'success', true,
    'campania_id', p_campania_id,
    'estado_anterior', v_estado_prev,
    'message', 'Campaña cancelada. Las ofertas activas han sido desactivadas.'
  );
END;
$$;
-- ============================================================
-- 05_PUBLIC_CATALOG.SQL — Vista pública del catálogo con ofertas
-- ============================================================

-- ─── Vista: productos con oferta activa para catálogo público ──
-- Reemplaza o complementa la consulta existente en page.tsx
-- Se puede llamar como tabla desde el catálogo público (anon key)
CREATE OR REPLACE VIEW public.public_products_with_offers AS
SELECT
  p.id,
  p.name,
  p.description,
  p.barcode,
  p.sale_price                          AS precio_regular,
  p.image_url,
  p.is_public,
  p.company_id,
  c.name                                AS category_name,

  -- Oferta activa (NULL si no hay)
  ov.id                                 AS oferta_id,
  ov.precio_oferta,
  ov.porcentaje_descuento               AS descuento_porcentaje,
  ov.fecha_inicio                       AS oferta_inicio,
  ov.fecha_fin                          AS oferta_fin,

  -- Precio efectivo: oferta si existe, regular si no
  COALESCE(ov.precio_oferta, p.sale_price) AS precio_efectivo,

  -- Flag booleano para el frontend
  (ov.id IS NOT NULL)                   AS tiene_oferta,

  -- Stock total desde lotes (para el catálogo)
  COALESCE(
    (SELECT SUM(pb.remaining_quantity)
     FROM public.purchase_batches pb
     WHERE pb.product_id = p.id
       AND pb.company_id = p.company_id
       AND pb.remaining_quantity > 0),
    0
  )                                     AS total_inventario

FROM public.products p
LEFT JOIN public.categories c
  ON c.id = p.category_id
LEFT JOIN public.ofertas_virtuales ov
  ON ov.product_id = p.id
  AND ov.company_id = p.company_id
  AND ov.activo = true
  AND CURRENT_DATE BETWEEN ov.fecha_inicio AND ov.fecha_fin
-- Solo JOIN la oferta asociada a campaña PUBLICADA (doble validación)
LEFT JOIN public.campania_descuento_detalle cdd
  ON cdd.id = ov.campania_detalle_id
LEFT JOIN public.campanias_descuento cd
  ON cd.id = cdd.campania_id
  AND cd.estado = 'PUBLICADA'
WHERE p.is_public = true;

-- RLS en la vista: heredada de las tablas subyacentes
-- Para acceso público anónimo, asegúrese de que products tiene política SELECT pública

-- ─── Función RPC para catálogo público (sin auth requerida) ───
CREATE OR REPLACE FUNCTION public.rpc_get_catalogo_publico(
  p_company_slug text
)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id  uuid;
  v_productos   json;
  v_categorias  json;
BEGIN
  -- Resolver empresa por slug (sin exponer IDs internos al cliente)
  SELECT id INTO v_company_id
    FROM public.companies
    WHERE slug = p_company_slug
    LIMIT 1;

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'NOT_FOUND: empresa no encontrada'
      USING ERRCODE = 'P0030';
  END IF;

  -- Productos con oferta
  SELECT json_agg(row_to_json(t)) INTO v_productos
  FROM (
    SELECT *
    FROM public.public_products_with_offers
    WHERE company_id = v_company_id
      AND is_public = true
    ORDER BY tiene_oferta DESC, precio_efectivo ASC
  ) t;

  -- Categorías
  SELECT json_agg(row_to_json(c)) INTO v_categorias
  FROM (
    SELECT DISTINCT cat.name
    FROM public.categories cat
    INNER JOIN public.products p ON p.category_id = cat.id
    WHERE p.company_id = v_company_id
      AND p.is_public = true
    ORDER BY cat.name
  ) c;

  RETURN json_build_object(
    'products',    COALESCE(v_productos, '[]'::json),
    'categories',  COALESCE(v_categorias, '[]'::json)
  );
END;
$$;
-- ============================================================
-- 07_MIGRATIONS.SQL — Estrategia de migraciones seguras
-- ============================================================
-- Ejecutar SIEMPRE en transacción. En Supabase: SQL Editor o CLI.
-- Usar Supabase CLI: supabase migration new nombre_migracion
-- ============================================================

-- MIGRACIÓN 001 — Verificaciones previas
-- Ejecutar antes del deploy para validar que el entorno es correcto:

DO $$
DECLARE
  v_missing_tables text[] := ARRAY[]::text[];
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'products','purchase_batches','sales','sale_items',
    'companies','user_companies','categories'
  ] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      v_missing_tables := v_missing_tables || t;
    END IF;
  END LOOP;

  IF array_length(v_missing_tables, 1) > 0 THEN
    RAISE EXCEPTION 'PRE-MIGRATION CHECK FAILED: faltan tablas base: %',
      array_to_string(v_missing_tables, ', ');
  END IF;

  RAISE NOTICE 'PRE-MIGRATION CHECK: OK — todas las tablas base existen';
END;
$$;

-- MIGRACIÓN 002 — Rollback plan
-- Si algo falla, ejecutar este bloque para revertir:
/*
BEGIN;
  DROP TABLE IF EXISTS public.campania_audit_log CASCADE;
  DROP TABLE IF EXISTS public.ofertas_virtuales CASCADE;
  DROP TABLE IF EXISTS public.campania_descuento_detalle CASCADE;
  DROP TABLE IF EXISTS public.campanias_descuento CASCADE;
  DROP TYPE IF EXISTS estado_campania;
  DROP FUNCTION IF EXISTS public.rpc_crear_campania;
  DROP FUNCTION IF EXISTS public.rpc_generar_analisis_campania;
  DROP FUNCTION IF EXISTS public.rpc_actualizar_descuento_detalle;
  DROP FUNCTION IF EXISTS public.rpc_aprobar_campania;
  DROP FUNCTION IF EXISTS public.rpc_publicar_campania;
  DROP FUNCTION IF EXISTS public.rpc_cancelar_campania;
  DROP FUNCTION IF EXISTS public.fn_user_company_id;
  DROP FUNCTION IF EXISTS public.fn_user_role;
  DROP FUNCTION IF EXISTS public.fn_is_manager;
  DROP FUNCTION IF EXISTS public.internal_audit_campania;
  DROP VIEW IF EXISTS public.public_products_with_offers;
  DROP FUNCTION IF EXISTS public.rpc_get_catalogo_publico;
COMMIT;
*/

-- MIGRACIÓN 003 — Si ofertas_virtuales YA EXISTE en el sistema
-- Agregar columna campania_detalle_id si no existe:
ALTER TABLE public.ofertas_virtuales
  ADD COLUMN IF NOT EXISTS campania_detalle_id uuid
    REFERENCES public.campania_descuento_detalle(id);
