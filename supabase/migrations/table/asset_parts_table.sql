-- Migration: Create Asset-Part Junction Table
-- Description: Many-to-many relationship between assets and parts
CREATE TABLE IF NOT EXISTS public.asset_parts (
  -- Foreign keys
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  part_id UUID NOT NULL REFERENCES public.parts(id) ON DELETE CASCADE,

  -- Ordering
  sort_order INTEGER DEFAULT 0,  -- Order of parts within an asset

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Composite primary key
  PRIMARY KEY (asset_id, part_id)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_asset_parts_asset_id ON public.asset_parts(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_parts_part_id ON public.asset_parts(part_id);
CREATE INDEX IF NOT EXISTS idx_asset_parts_sort_order ON public.asset_parts(asset_id, sort_order);

-- RLS Policies
ALTER TABLE public.asset_parts ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read asset_parts"
ON public.asset_parts FOR SELECT
USING (true);

-- Allow public insert
CREATE POLICY "Allow public insert asset_parts"
ON public.asset_parts FOR INSERT
WITH CHECK (true);

-- Allow public update
CREATE POLICY "Allow public update asset_parts"
ON public.asset_parts FOR UPDATE
USING (true)
WITH CHECK (true);

-- Allow public delete
CREATE POLICY "Allow public delete asset_parts"
ON public.asset_parts FOR DELETE
USING (true);

-- Comments for documentation
COMMENT ON TABLE public.asset_parts IS 'Junction table for many-to-many relationship between assets and parts';
COMMENT ON COLUMN public.asset_parts.sort_order IS 'Display order of parts within an asset (0-based)';
