-- ════════════════════════════════════════════════════════════════════════════
-- FASE 1 — Adaptación a DROGUERÍA: modelo de datos
-- ════════════════════════════════════════════════════════════════════════════
-- Objetivo: añadir al esquema multi-empresa existente los campos que hoy NO
-- existen y que una droguería necesita para operar correctamente:
--   1. Identificación de la empresa/cliente/proveedor (NIT, tipo de documento)
--      — esto NO activa facturación electrónica todavía, solo deja los campos
--        listos para cuando se integre un proveedor DIAN (evita otra migración
--        de datos históricos el día que se active).
--   2. Clasificación regulatoria del producto farmacéutico (receta, INVIMA,
--      principio activo, controlado).
--   3. Tipo de tributo IVA por producto (medicamentos suelen ser excluidos o
--      gravados al 5%, no al 19% general).
--   4. Fecha de vencimiento por LOTE de compra (hoy `purchase_batches` no la
--      tiene) + número de lote del fabricante, indispensable para alertas de
--      vencimiento y para poder vender por FEFO en el futuro.
--   5. Marca de "vertical de negocio" por empresa, para que el frontend pueda
--      mostrar/ocultar campos según si la empresa es cosmética, droguería, etc.
--      sin tener que duplicar el sistema.
--
-- Todo es ADITIVO e IDEMPOTENTE (ADD COLUMN IF NOT EXISTS + constraints
-- envueltos en DO $$ ... IF NOT EXISTS). No se toca ninguna tabla existente
-- de forma destructiva, no se borra nada, y las columnas nuevas tienen
-- DEFAULT para no romper filas ya existentes (la empresa de cosméticos actual
-- sigue funcionando exactamente igual sin llenar estos campos).
--
-- Fuera de alcance de este script (ver Doc/PLAN_DROGUERIA.md, "Fase 2 y 3"):
--   - Cambiar `rpc_registrar_venta` para consumir lotes por FEFO
--     (fecha_vencimiento) en vez de FIFO puro (purchase_date). Es un cambio
--     de LÓGICA sobre la función de venta transaccional; se hace aparte y se
--     prueba con cuidado por ser dinero real.
--   - Nuevo criterio "POR_VENCER" en el motor de campañas de descuento.
--   - Cualquier cosa de facturación electrónica DIAN (explícitamente NO pedida
--     todavía).
--   - UI (formularios, tablas, alertas de vencimiento en el dashboard).
-- ════════════════════════════════════════════════════════════════════════════


-- ════════════════════════════════════════════════════════════════════════════
-- 0. Vertical de negocio por empresa
-- ════════════════════════════════════════════════════════════════════════════
-- Permite que el mismo sistema multi-tenant sirva cosméticos, droguería, u
-- otra vertical futura, sin bifurcar el código. El frontend puede consultar
-- este campo para decidir qué campos mostrar en el formulario de producto.

ALTER TABLE public.companies
    ADD COLUMN IF NOT EXISTS tipo_negocio text NOT NULL DEFAULT 'general';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'companies_tipo_negocio_check') THEN
        ALTER TABLE public.companies
            ADD CONSTRAINT companies_tipo_negocio_check
            CHECK (tipo_negocio IN ('general', 'cosmeticos', 'drogueria', 'comida_rapida'));
    END IF;
END $$;

COMMENT ON COLUMN public.companies.tipo_negocio IS
    'Vertical de negocio de la empresa. Controla qué campos/módulos específicos de dominio muestra el frontend (ej. droguería habilita vencimiento y clasificación regulatoria). Default "general" no rompe empresas existentes.';

-- Ajusta el slug al de tu empresa de cosméticos real y ejecuta manualmente
-- (no se adivina aquí para no marcar la fila equivocada):
-- UPDATE public.companies SET tipo_negocio = 'cosmeticos' WHERE slug = 'TU-SLUG-AQUI';


-- ════════════════════════════════════════════════════════════════════════════
-- 1. Identificación fiscal — preparación para futura facturación electrónica
-- ════════════════════════════════════════════════════════════════════════════
-- Todo nullable/opcional: no se exige llenarlo hoy. El día que se integre un
-- proveedor DIAN, estos campos ya existen y no hace falta migrar datos viejos.

-- 1.1 companies (la droguería como emisor de factura)
ALTER TABLE public.companies
    ADD COLUMN IF NOT EXISTS nit                    text,
    ADD COLUMN IF NOT EXISTS nit_dv                 text,
    ADD COLUMN IF NOT EXISTS razon_social            text,
    ADD COLUMN IF NOT EXISTS direccion_fiscal        text,
    ADD COLUMN IF NOT EXISTS actividad_economica_ciiu text,
    ADD COLUMN IF NOT EXISTS regimen_tributario      text;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'companies_regimen_tributario_check') THEN
        ALTER TABLE public.companies
            ADD CONSTRAINT companies_regimen_tributario_check
            CHECK (regimen_tributario IS NULL OR regimen_tributario IN ('responsable_iva', 'no_responsable_iva'));
    END IF;
END $$;

COMMENT ON COLUMN public.companies.nit IS 'NIT de la empresa (sin dígito de verificación). Requerido cuando se active facturación electrónica DIAN. Nulo por ahora.';
COMMENT ON COLUMN public.companies.nit_dv IS 'Dígito de verificación del NIT.';
COMMENT ON COLUMN public.companies.razon_social IS 'Razón social legal, puede diferir de companies.name (nombre comercial).';
COMMENT ON COLUMN public.companies.regimen_tributario IS 'responsable_iva | no_responsable_iva. Requerido por la DIAN para determinar cómo se factura.';

-- 1.2 clients y suppliers (tipo/número de documento, requerido por la DIAN
-- para identificar al adquiriente/proveedor en cualquier documento fiscal)
ALTER TABLE public.clients
    ADD COLUMN IF NOT EXISTS tipo_documento   text,
    ADD COLUMN IF NOT EXISTS numero_documento text,
    ADD COLUMN IF NOT EXISTS documento_dv     text;

ALTER TABLE public.suppliers
    ADD COLUMN IF NOT EXISTS tipo_documento   text,
    ADD COLUMN IF NOT EXISTS numero_documento text,
    ADD COLUMN IF NOT EXISTS documento_dv     text;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clients_tipo_documento_check') THEN
        ALTER TABLE public.clients
            ADD CONSTRAINT clients_tipo_documento_check
            CHECK (tipo_documento IS NULL OR tipo_documento IN ('CC','NIT','CE','PAS','TI','RC','DE'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'suppliers_tipo_documento_check') THEN
        ALTER TABLE public.suppliers
            ADD CONSTRAINT suppliers_tipo_documento_check
            CHECK (tipo_documento IS NULL OR tipo_documento IN ('CC','NIT','CE','PAS','TI','RC','DE'));
    END IF;
END $$;

COMMENT ON COLUMN public.clients.tipo_documento IS 'Tipo de documento DIAN: CC, NIT, CE, PAS, TI, RC, DE. Nulo para clientes de mostrador sin datos fiscales.';
COMMENT ON COLUMN public.suppliers.tipo_documento IS 'Tipo de documento DIAN del proveedor. Relevante para "documento soporte" en compras a no obligados a facturar (fase futura).';


-- ════════════════════════════════════════════════════════════════════════════
-- 2. Clasificación regulatoria del producto (droguería)
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS requiere_receta    boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS es_controlado      boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS principio_activo   text,
    ADD COLUMN IF NOT EXISTS concentracion      text,
    ADD COLUMN IF NOT EXISTS forma_farmaceutica text,
    ADD COLUMN IF NOT EXISTS registro_invima    text,
    ADD COLUMN IF NOT EXISTS unidad_medida      text NOT NULL DEFAULT 'unidad';

COMMENT ON COLUMN public.products.requiere_receta IS 'TRUE si el producto solo puede venderse con fórmula médica. Por ahora es informativo (el POS no bloquea la venta); el bloqueo/registro del prescriptor es fase futura si se requiere.';
COMMENT ON COLUMN public.products.es_controlado IS 'TRUE para medicamentos de control especial (psicotrópicos, opioides, etc.) sujetos a reporte al Fondo Nacional de Estupefacientes. Requiere validación legal específica antes de operar con estos productos — no implementado el reporte, solo la marca.';
COMMENT ON COLUMN public.products.principio_activo IS 'Principio activo del medicamento (ej. Acetaminofén, Ibuprofeno). Nulo para productos no farmacéuticos.';
COMMENT ON COLUMN public.products.concentracion IS 'Concentración/dosis (ej. "500mg", "10mg/ml").';
COMMENT ON COLUMN public.products.forma_farmaceutica IS 'Forma farmacéutica: tableta, jarabe, ampolla, crema, cápsula, solución, óvulo, etc. Texto libre para no limitar prematuramente el catálogo.';
COMMENT ON COLUMN public.products.registro_invima IS 'Número de registro sanitario INVIMA del producto, cuando aplica.';
COMMENT ON COLUMN public.products.unidad_medida IS 'Unidad de venta: unidad, caja, blister, frasco, tableta, ml, mg, etc. Default "unidad" preserva el comportamiento actual de productos no farmacéuticos.';


-- ════════════════════════════════════════════════════════════════════════════
-- 3. IVA por producto
-- ════════════════════════════════════════════════════════════════════════════
-- Nota: esto SOLO clasifica el producto para reportes/futura factura
-- electrónica. `sale_price` sigue siendo el precio final que se cobra
-- (impuesto incluido, si aplica) — no se cambia el flujo de cobro del POS en
-- esta fase, eso implicaría tocar rpc_registrar_venta y la UI (fase futura).

ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS tipo_tributo_iva text NOT NULL DEFAULT 'excluido';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_tipo_tributo_iva_check') THEN
        ALTER TABLE public.products
            ADD CONSTRAINT products_tipo_tributo_iva_check
            CHECK (tipo_tributo_iva IN ('excluido', 'exento', 'gravado_5', 'gravado_19'));
    END IF;
END $$;

COMMENT ON COLUMN public.products.tipo_tributo_iva IS 'Clasificación de IVA: excluido (no causa IVA, ej. muchos medicamentos), exento (0% pero deducible), gravado_5, gravado_19. Default "excluido" para no asumir tarifa general en productos no clasificados. Verificar cada caso contra el Estatuto Tributario antes de reportar oficialmente.';


-- ════════════════════════════════════════════════════════════════════════════
-- 4. Vencimiento por lote de compra
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.purchase_batches
    ADD COLUMN IF NOT EXISTS fecha_vencimiento      date,
    ADD COLUMN IF NOT EXISTS numero_lote_fabricante text;

COMMENT ON COLUMN public.purchase_batches.fecha_vencimiento IS 'Fecha de vencimiento del lote (según empaque del fabricante). Nula para productos sin vencimiento aplicable. Usada por alertas de próximo a vencer y, en fase futura, por la lógica de venta FEFO.';
COMMENT ON COLUMN public.purchase_batches.numero_lote_fabricante IS 'Número de lote impreso por el fabricante (distinto del id interno del lote). Necesario para trazabilidad ante alertas sanitarias/recalls INVIMA.';

-- Índice para que las alertas de vencimiento (sección 5) sean rápidas incluso
-- con miles de lotes: solo indexa lotes con stock restante y con vencimiento
-- definido (los que realmente importan para la alerta).
CREATE INDEX IF NOT EXISTS idx_purchase_batches_vencimiento
    ON public.purchase_batches (company_id, fecha_vencimiento)
    WHERE remaining_quantity > 0 AND fecha_vencimiento IS NOT NULL;


-- ════════════════════════════════════════════════════════════════════════════
-- 5. Alerta de vencimiento (lectura, sin efectos secundarios)
-- ════════════════════════════════════════════════════════════════════════════
-- Análoga a get_low_stock_products(p_company_id): mismo estilo, mismo patrón
-- de seguridad. Solo LEE, no descuenta ni modifica nada — segura de agregar
-- ya mismo aunque la lógica de venta (FEFO) todavía no exista.

CREATE OR REPLACE FUNCTION public.get_products_expiring_soon(
    p_company_id  uuid,
    p_dias_umbral integer DEFAULT 90
)
RETURNS TABLE (
    batch_id               uuid,
    product_id             uuid,
    product_name           text,
    numero_lote_fabricante text,
    remaining_quantity     integer,
    fecha_vencimiento      date,
    dias_para_vencer       integer
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN QUERY
    SELECT
        pb.id,
        p.id,
        p.name,
        pb.numero_lote_fabricante,
        pb.remaining_quantity,
        pb.fecha_vencimiento,
        (pb.fecha_vencimiento - CURRENT_DATE)::integer AS dias_para_vencer
    FROM public.purchase_batches pb
    JOIN public.products p ON p.id = pb.product_id
    WHERE pb.company_id = p_company_id
      AND pb.remaining_quantity > 0
      AND pb.fecha_vencimiento IS NOT NULL
      AND pb.fecha_vencimiento <= (CURRENT_DATE + (p_dias_umbral || ' days')::interval)
    ORDER BY pb.fecha_vencimiento ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_products_expiring_soon(uuid, integer) TO authenticated;

COMMENT ON FUNCTION public.get_products_expiring_soon(uuid, integer) IS 'Lotes con stock restante que vencen dentro de p_dias_umbral días (default 90), ordenados por fecha más próxima primero. Solo lectura.';
