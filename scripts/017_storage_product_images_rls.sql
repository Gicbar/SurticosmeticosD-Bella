-- ════════════════════════════════════════════════════════════════════════════
-- Fix de seguridad: aislar por empresa el bucket de storage "product-images"
-- ════════════════════════════════════════════════════════════════════════════
-- Las políticas originales (scripts/005_add_image_column.sql) solo exigían
-- auth.role() = 'authenticated' para INSERT/UPDATE/DELETE, sin ningún
-- predicado de empresa/dueño — a pesar de llamarse "own uploads". Cualquier
-- usuario autenticado (incluida una cuenta recién auto-registrada sin
-- empresa asignada) podía sobrescribir o borrar las fotos de productos de
-- CUALQUIER empresa, porque las rutas no tenían el company_id y la política
-- aplicaba a todas las filas del bucket por igual.
--
-- Fix: las rutas ahora llevan el company_id como segundo segmento
-- (products/<company_id>/... y products/<company_id>/gallery/...) y las
-- políticas de escritura exigen que ese segmento coincida con una empresa a
-- la que pertenece el usuario autenticado (public.user_companies).
--
-- SELECT se mantiene público y sin restricción a propósito: las fotos de
-- producto son públicas por diseño (se muestran en el catálogo público
-- anónimo /catalog). El problema nunca fue la lectura, sino la escritura.
--
-- IMPORTANTE — requiere también el cambio en components/product-form.tsx
-- que agrega companyId a la ruta de subida (products/<company_id>/...).
-- Las fotos ya subidas ANTES de este fix (con la ruta vieja, sin
-- company_id) seguirán siendo legibles (SELECT sigue público), pero no se
-- podrán actualizar/borrar por esta política nueva — la app nunca hace
-- update/delete de storage hoy (cada subida usa un path nuevo), así que
-- esto no rompe ningún flujo existente.
--
-- Idempotente: DROP POLICY IF EXISTS antes de cada CREATE POLICY.
-- ════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Company-scoped upload" ON storage.objects;
CREATE POLICY "Company-scoped upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = 'products'
  AND (storage.foldername(name))[2] IN (
    SELECT uc.company_id::text FROM public.user_companies uc WHERE uc.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update own uploads" ON storage.objects;
DROP POLICY IF EXISTS "Company-scoped update" ON storage.objects;
CREATE POLICY "Company-scoped update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = 'products'
  AND (storage.foldername(name))[2] IN (
    SELECT uc.company_id::text FROM public.user_companies uc WHERE uc.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can delete own uploads" ON storage.objects;
DROP POLICY IF EXISTS "Company-scoped delete" ON storage.objects;
CREATE POLICY "Company-scoped delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = 'products'
  AND (storage.foldername(name))[2] IN (
    SELECT uc.company_id::text FROM public.user_companies uc WHERE uc.user_id = auth.uid()
  )
);
