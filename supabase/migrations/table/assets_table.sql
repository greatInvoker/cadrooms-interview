-- Migration: Create Assets Table
-- Description: Store asset (collection of parts) information
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic information
  name TEXT NOT NULL,
  description TEXT,

  -- Metadata
  remarks TEXT,

  -- User association (forward-looking design for future user management)
  user_id UUID,  -- Will reference auth.users(id) when authentication is implemented

  -- Soft delete
  del_flag INTEGER DEFAULT 0 CHECK (del_flag IN (0, 1)),  -- 0 = active, 1 = deleted

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_assets_name ON public.assets(name);
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON public.assets(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_del_flag ON public.assets(del_flag);
CREATE INDEX IF NOT EXISTS idx_assets_created_at ON public.assets(created_at DESC);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_assets_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function before UPDATE
CREATE TRIGGER assets_update_timestamp
BEFORE UPDATE ON public.assets
FOR EACH ROW
EXECUTE FUNCTION update_assets_timestamp();

-- RLS Policies (public access for now)
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- Allow public read access (show all non-deleted assets)
CREATE POLICY "Allow public read assets"
ON public.assets FOR SELECT
USING (del_flag = 0);

-- Allow public insert
CREATE POLICY "Allow public insert assets"
ON public.assets FOR INSERT
WITH CHECK (true);

-- Allow public update
CREATE POLICY "Allow public update assets"
ON public.assets FOR UPDATE
USING (true)
WITH CHECK (true);

-- Allow public delete
CREATE POLICY "Allow public delete assets"
ON public.assets FOR DELETE
USING (true);

-- Comments for documentation
COMMENT ON TABLE public.assets IS 'Asset collections - groups of related CAD parts';
COMMENT ON COLUMN public.assets.user_id IS 'Reserved for future user authentication - will link to auth.users';
COMMENT ON COLUMN public.assets.del_flag IS 'Soft delete flag: 0 = active, 1 = deleted';
