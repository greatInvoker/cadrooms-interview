-- Create bucket for CAD files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'asset-file',
  'asset-file',
  true,
  104857600, -- 100MB limit
  ARRAY[
    'application/octet-stream',  -- .scs files
    'model/step',                -- .step files
    'model/stl',                 -- .stl files
    'application/sla'            -- STL alternative
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for asset-file bucket
CREATE POLICY "Allow public read asset-file"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'asset-file');

CREATE POLICY "Allow public insert asset-file"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'asset-file');

CREATE POLICY "Allow public update asset-file"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'asset-file')
WITH CHECK (bucket_id = 'asset-file');

CREATE POLICY "Allow public delete asset-file"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'asset-file');
