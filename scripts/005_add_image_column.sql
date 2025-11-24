-- Add image_url column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for product images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own uploads"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete own uploads"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');
