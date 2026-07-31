-- Fantt: Folders + Templates migration
-- Run this in the Supabase SQL editor

-- 1. Create folders table
CREATE TABLE folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add folder_id and is_template to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES folders(id) ON DELETE SET NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT FALSE;
