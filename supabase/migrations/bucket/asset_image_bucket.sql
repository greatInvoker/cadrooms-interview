-- 第一步：Create bucket for images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'asset-image',
  'asset-image',
  true,
  10485760, -- 10MB limit
  ARRAY[
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ⚠️注意：先执行第一步再执行第二步
-- 第二步：Create storage policies for asset-image bucket
CREATE POLICY "Allow public read asset-image"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'asset-image');

CREATE POLICY "Allow public insert asset-image"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'asset-image');

CREATE POLICY "Allow public update asset-image"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'asset-image')
WITH CHECK (bucket_id = 'asset-image');

CREATE POLICY "Allow public delete asset-image"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'asset-image');
