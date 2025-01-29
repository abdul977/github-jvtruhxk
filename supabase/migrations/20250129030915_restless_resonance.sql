-- Add tags column to folders table
ALTER TABLE folders ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Create index for tags search performance
CREATE INDEX IF NOT EXISTS idx_folders_tags ON folders USING GIN (tags);