-- Migration: Create Parts Table
-- Description: Store CAD parts information with file references
CREATE TABLE IF NOT EXISTS public.parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic information
  name TEXT NOT NULL,
  description TEXT,

  -- File references (UUIDs stored in Storage buckets)
  file_id UUID NOT NULL,      -- References file in assets-cad bucket
  image_id UUID,              -- References file in assets-images bucket (optional)

  -- Metadata
  remarks TEXT,
  is_system BOOLEAN DEFAULT false,  -- true = system preset part, false = user uploaded

  -- Soft delete
  del_flag INTEGER DEFAULT 0 CHECK (del_flag IN (0, 1)),  -- 0 = active, 1 = deleted

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_parts_name ON public.parts(name);
CREATE INDEX IF NOT EXISTS idx_parts_del_flag ON public.parts(del_flag);
CREATE INDEX IF NOT EXISTS idx_parts_is_system ON public.parts(is_system);
CREATE INDEX IF NOT EXISTS idx_parts_created_at ON public.parts(created_at DESC);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_parts_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function before UPDATE
CREATE TRIGGER parts_update_timestamp
BEFORE UPDATE ON public.parts
FOR EACH ROW
EXECUTE FUNCTION update_parts_timestamp();

-- RLS Policies (public access for now, will be restricted with auth later)
ALTER TABLE public.parts ENABLE ROW LEVEL SECURITY;

-- Allow public read access (show all non-deleted parts)
CREATE POLICY "Allow public read parts"
ON public.parts FOR SELECT
USING (del_flag = 0);

-- Allow public insert (will be restricted to authenticated users later)
CREATE POLICY "Allow public insert parts"
ON public.parts FOR INSERT
WITH CHECK (true);

-- Allow public update (will be restricted to owner later)
CREATE POLICY "Allow public update parts"
ON public.parts FOR UPDATE
USING (true)
WITH CHECK (true);

-- Allow public delete (soft delete by setting del_flag)
CREATE POLICY "Allow public delete parts"
ON public.parts FOR DELETE
USING (true);

-- Comments for documentation
COMMENT ON TABLE public.parts IS 'CAD parts library - stores metadata and file references for 3D parts';
COMMENT ON COLUMN public.parts.file_id IS 'UUID of CAD file in assets-cad Storage bucket';
COMMENT ON COLUMN public.parts.image_id IS 'UUID of thumbnail image in assets-images Storage bucket';
COMMENT ON COLUMN public.parts.is_system IS 'System preset parts (15 initial parts) vs user uploaded parts';
COMMENT ON COLUMN public.parts.del_flag IS 'Soft delete flag: 0 = active, 1 = deleted';
