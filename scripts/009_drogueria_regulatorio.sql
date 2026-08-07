-- ════════════════════════════════════════════════════════════════════════════
-- FASE 1B — Droguería: campos regulatorios adicionales (investigados)
-- ════════════════════════════════════════════════════════════════════════════
-- Complementa a scripts/008_drogueria_adaptacion.sql (YA EJECUTADO en
-- producción — no se toca) con lo que encontré al revisar cómo modelan esto
-- otros sistemas de droguería en Colombia y la normativa aplicable (INVIMA,
-- Resolución 1478/2006, Decreto 2200/2005, Resolución 1403/2007). Fuentes
-- citadas en Doc/PLAN_DROGUERIA.md.
--
-- Convención de nombres: TODO en español en las tablas/columnas NUEVAS de
-- este script (incluidas las columnas genéricas tipo "company_id" →
-- "empresa_id"), para que se entiendan sin traducir mentalmente. Las tablas
-- YA existentes (products, companies, user_companies, etc.) mantienen sus
-- nombres en inglés tal cual están en producción — no se renombran columnas
-- existentes, solo se agregan columnas nuevas ya en español.
--
-- Sigue siendo 100% aditivo/idempotente. Igual que 008: ADD COLUMN IF NOT
-- EXISTS con DEFAULT, constraints en DO $$ IF NOT EXISTS, RLS explícita en
-- toda tabla nueva (siguiendo el patrón de campanias_schema.sql). No toca
-- ninguna función ni tabla existente en su comportamiento actual.
-- ════════════════════════════════════════════════════════════════════════════


-- ════════════════════════════════════════════════════════════════════════════
-- 1. Producto — identificación oficial INVIMA/CUM y manejo de presentación
-- ════════════════════════════════════════════════════════════════════════════
-- El CUM (Código Único de Medicamento) es el identificador oficial que INVIMA
-- asigna a cada presentación comercial de un medicamento — más específico que
-- el "registro_invima" (que es el expediente/registro sanitario general del
-- producto, ya agregado en 008). Ambos coexisten: un registro sanitario puede
-- tener varias presentaciones, cada una con su propio CUM.
--
-- Nota: estas columnas se agregan a la tabla `products` (nombre existente en
-- inglés, no se renombra), pero sus columnas nuevas ya van en español.

ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS codigo_cum                text,
    ADD COLUMN IF NOT EXISTS clasificacion_atc          text,
    ADD COLUMN IF NOT EXISTS via_administracion         text,
    ADD COLUMN IF NOT EXISTS laboratorio_titular        text,
    ADD COLUMN IF NOT EXISTS vigencia_registro_sanitario date,
    ADD COLUMN IF NOT EXISTS requiere_cadena_frio        boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS permite_venta_fraccionada   boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS unidades_por_presentacion   integer NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS es_generico                 boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS producto_referencia_id      uuid;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_unidades_presentacion_check') THEN
        ALTER TABLE public.products
            ADD CONSTRAINT products_unidades_presentacion_check CHECK (unidades_por_presentacion > 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_referencia_fkey') THEN
        ALTER TABLE public.products
            ADD CONSTRAINT products_referencia_fkey
            FOREIGN KEY (producto_referencia_id) REFERENCES public.products(id) ON DELETE SET NULL;
    END IF;
END $$;

COMMENT ON COLUMN public.products.codigo_cum IS 'Código Único de Medicamento asignado por INVIMA a esta presentación comercial específica. Fuente: datos.gov.co (INVIMA), circular 420 de 2006.';
COMMENT ON COLUMN public.products.clasificacion_atc IS 'Clasificación Anatómica-Terapéutica-Química (OMS), viene asociada al CUM.';
COMMENT ON COLUMN public.products.via_administracion IS 'Vía de administración (oral, tópica, inyectable, etc.) según ICH M5, asociada al CUM.';
COMMENT ON COLUMN public.products.laboratorio_titular IS 'Laboratorio/titular del registro sanitario ante INVIMA.';
COMMENT ON COLUMN public.products.vigencia_registro_sanitario IS 'Fecha de vencimiento del registro sanitario del PRODUCTO ante INVIMA (distinta de purchase_batches.fecha_vencimiento, que es el vencimiento físico del LOTE comprado). Alertar cuando se acerque: implica renovar el registro, no el lote.';
COMMENT ON COLUMN public.products.requiere_cadena_frio IS 'TRUE si debe mantenerse refrigerado (vacunas, insulinas, etc.). Decreto 2200/2005 exige control de temperatura con termómetro min/max, alarmas y plan de contingencia — ver tabla control_cadena_frio.';
COMMENT ON COLUMN public.products.permite_venta_fraccionada IS 'TRUE si se puede vender por unidad suelta aunque se compre por caja/blister (ej. vender 3 tabletas de una caja de 30). FALSE por defecto: mantiene el comportamiento actual (venta por unidad completa de sale_price).';
COMMENT ON COLUMN public.products.unidades_por_presentacion IS 'Cuántas unidades mínimas (tabletas, ml, etc.) trae la presentación que se compra/registra en purchase_batches. Default 1 = sin cambio de comportamiento para productos no fraccionables.';
COMMENT ON COLUMN public.products.es_generico IS 'TRUE si este producto ES un genérico (no de marca).';
COMMENT ON COLUMN public.products.producto_referencia_id IS 'Si este producto es un genérico, puede referenciar al producto de marca equivalente (o viceversa) para sugerir sustitución en el POS. Nulo si no aplica.';


-- ════════════════════════════════════════════════════════════════════════════
-- 2. Empresa — datos del establecimiento farmacéutico (Decreto 2200/2005,
--    Resolución 1403/2007: toda droguería debe operar bajo la responsabilidad
--    de un director técnico y contar con licencia de funcionamiento vigente
--    otorgada por la entidad territorial de salud)
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.companies
    ADD COLUMN IF NOT EXISTS director_tecnico_nombre             text,
    ADD COLUMN IF NOT EXISTS director_tecnico_documento           text,
    ADD COLUMN IF NOT EXISTS director_tecnico_tarjeta_profesional text,
    ADD COLUMN IF NOT EXISTS numero_licencia_funcionamiento       text,
    ADD COLUMN IF NOT EXISTS entidad_territorial_salud            text,
    ADD COLUMN IF NOT EXISTS vigencia_licencia_funcionamiento     date;

COMMENT ON COLUMN public.companies.director_tecnico_nombre IS 'Nombre del Director Técnico responsable (químico farmacéutico o tecnólogo/regente de farmacia), exigido por Resolución 1403/2007 para operar una droguería.';
COMMENT ON COLUMN public.companies.numero_licencia_funcionamiento IS 'Número de la licencia/autorización de funcionamiento otorgada por la entidad territorial de salud (Decreto 2200/2005).';
COMMENT ON COLUMN public.companies.entidad_territorial_salud IS 'Entidad territorial de salud que otorgó la autorización (ej. Secretaría de Salud del municipio/departamento).';
COMMENT ON COLUMN public.companies.vigencia_licencia_funcionamiento IS 'Fecha de vencimiento/renovación de la licencia de funcionamiento.';


-- ════════════════════════════════════════════════════════════════════════════
-- 3. Libro de control de estupefacientes y psicotrópicos (Resolución 1478
--    de 2006 — Fondo Nacional de Estupefacientes): toda dispensación de un
--    producto marcado es_controlado=true debe quedar registrada con
--    identificación del paciente y del médico prescriptor.
-- ════════════════════════════════════════════════════════════════════════════
-- ⚠️ Este es un requisito legal real (confirmado por normativa), pero la
-- obligación EXACTA de reporte (a quién, con qué periodicidad, en qué
-- formato) debe validarse con un asesor legal/químico farmacéutico antes de
-- operar con sustancias de control especial — aquí solo se deja el modelo de
-- datos para poder registrar la información mínima descrita en la norma.

CREATE TABLE IF NOT EXISTS public.control_sustancias_dispensacion (
    id                           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id                   uuid        NOT NULL REFERENCES public.companies(id),
    item_venta_id                uuid        REFERENCES public.sale_items(id),
    producto_id                  uuid        NOT NULL REFERENCES public.products(id),
    paciente_nombre              text        NOT NULL,
    paciente_documento           text        NOT NULL,
    medico_nombre                text        NOT NULL,
    medico_registro_profesional  text        NOT NULL,
    numero_formula               text,
    cantidad_dispensada          integer     NOT NULL CHECK (cantidad_dispensada > 0),
    fecha_dispensacion           timestamptz NOT NULL DEFAULT now(),
    creado_por                   uuid        REFERENCES auth.users(id),
    creado_en                    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_csd_empresa_fecha
    ON public.control_sustancias_dispensacion (empresa_id, fecha_dispensacion);

COMMENT ON TABLE public.control_sustancias_dispensacion IS 'Libro de control de dispensación de sustancias de control especial (Resolución 1478/2006). Se registra manualmente al vender un producto con es_controlado=true; el POS aún no lo automatiza (fase de UI futura).';

ALTER TABLE public.control_sustancias_dispensacion ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS csd_select_own ON public.control_sustancias_dispensacion;
CREATE POLICY csd_select_own ON public.control_sustancias_dispensacion
  FOR SELECT USING (
    empresa_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid())
  );

DROP POLICY IF EXISTS csd_insert_own ON public.control_sustancias_dispensacion;
CREATE POLICY csd_insert_own ON public.control_sustancias_dispensacion
  FOR INSERT WITH CHECK (
    empresa_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid())
  );

DROP POLICY IF EXISTS csd_update_own ON public.control_sustancias_dispensacion;
CREATE POLICY csd_update_own ON public.control_sustancias_dispensacion
  FOR UPDATE USING (
    empresa_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid())
  ) WITH CHECK (
    empresa_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid())
  );

-- Sin política de DELETE a propósito: un libro de control regulatorio no
-- debería permitir borrar registros, solo insertar/consultar.


-- ════════════════════════════════════════════════════════════════════════════
-- 4. Control de cadena de frío (Decreto 2200/2005): registro periódico de
--    temperatura para productos que la requieren (requiere_cadena_frio=true).
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.control_cadena_frio (
    id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id       uuid        NOT NULL REFERENCES public.companies(id),
    fecha_hora       timestamptz NOT NULL DEFAULT now(),
    temperatura_c    numeric(4,1) NOT NULL,
    dentro_de_rango  boolean     NOT NULL DEFAULT true,
    responsable      uuid        REFERENCES auth.users(id),
    observaciones    text,
    creado_en        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ccf_empresa_fecha
    ON public.control_cadena_frio (empresa_id, fecha_hora);

COMMENT ON TABLE public.control_cadena_frio IS 'Bitácora de temperatura del refrigerador/nevera de medicamentos (Decreto 2200/2005). Registro manual por ahora; una integración con sensor IoT sería una fase futura opcional.';

ALTER TABLE public.control_cadena_frio ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ccf_select_own ON public.control_cadena_frio;
CREATE POLICY ccf_select_own ON public.control_cadena_frio
  FOR SELECT USING (
    empresa_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid())
  );

DROP POLICY IF EXISTS ccf_insert_own ON public.control_cadena_frio;
CREATE POLICY ccf_insert_own ON public.control_cadena_frio
  FOR INSERT WITH CHECK (
    empresa_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid())
  );

DROP POLICY IF EXISTS ccf_delete_own ON public.control_cadena_frio;
CREATE POLICY ccf_delete_own ON public.control_cadena_frio
  FOR DELETE USING (
    empresa_id IN (SELECT uc.company_id FROM public.user_companies uc WHERE uc.user_id = auth.uid())
  );
