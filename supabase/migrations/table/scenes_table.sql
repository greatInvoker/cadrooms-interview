-- Migration: Create Scenes Table
-- Description: Store 3D scene information with part references
CREATE TABLE IF NOT EXISTS public.scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic information
  name TEXT NOT NULL,
  description TEXT,

  -- Part references
  assets TEXT[] DEFAULT '{}',  -- Array of part file names used in this scene

  -- Scene serialization data
  scene_json JSONB,  -- Serialized scene data (parts with transforms, positions, etc.)

  -- User association (forward-looking design for future user management)
  user_id UUID,  -- Will reference auth.users(id) when authentication is implemented

  -- Soft delete
  del_flag INTEGER DEFAULT 0 CHECK (del_flag IN (0, 1)),  -- 0 = active, 1 = deleted

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_scenes_updated_at ON public.scenes(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_scenes_user_id ON public.scenes(user_id);
CREATE INDEX IF NOT EXISTS idx_scenes_del_flag ON public.scenes(del_flag);
CREATE INDEX IF NOT EXISTS idx_scenes_name ON public.scenes(name);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_scenes_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function before UPDATE
CREATE TRIGGER scenes_update_timestamp
BEFORE UPDATE ON public.scenes
FOR EACH ROW
EXECUTE FUNCTION update_scenes_timestamp();

-- RLS Policies (public access for now)
ALTER TABLE public.scenes ENABLE ROW LEVEL SECURITY;

-- Allow public read access (show all non-deleted scenes)
CREATE POLICY "Allow public read scenes"
ON public.scenes FOR SELECT
USING (del_flag = 0);

-- Allow public insert
CREATE POLICY "Allow public insert scenes"
ON public.scenes FOR INSERT
WITH CHECK (true);

-- Allow public update
CREATE POLICY "Allow public update scenes"
ON public.scenes FOR UPDATE
USING (true)
WITH CHECK (true);

-- Allow public delete
CREATE POLICY "Allow public delete scenes"
ON public.scenes FOR DELETE
USING (true);

-- Comments for documentation
COMMENT ON TABLE public.scenes IS '3D scenes - stores scene metadata and references to parts used';
COMMENT ON COLUMN public.scenes.assets IS 'Array of part file names used in this scene';
COMMENT ON COLUMN public.scenes.scene_json IS 'Serialized scene data in JSON format (parts, transforms, positions, camera, etc.)';
COMMENT ON COLUMN public.scenes.user_id IS 'Reserved for future user authentication - will link to auth.users';
COMMENT ON COLUMN public.scenes.del_flag IS 'Soft delete flag: 0 = active, 1 = deleted';
