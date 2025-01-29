/*
  # Ideas Management Schema

  1. New Tables
    - `folders`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `created_at` (timestamp)
      - `user_id` (uuid, foreign key)
    
    - `notes`
      - `id` (uuid, primary key)
      - `folder_id` (uuid, foreign key)
      - `content` (text)
      - `type` (text) - 'text' or 'recording'
      - `file_url` (text, nullable) - for recordings
      - `transcription` (text, nullable)
      - `created_at` (timestamp)
      - `user_id` (uuid, foreign key)
    
    - `synthesized_ideas`
      - `id` (uuid, primary key)
      - `folder_id` (uuid, foreign key)
      - `content` (text)
      - `created_at` (timestamp)
      - `user_id` (uuid, foreign key)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create folders table
CREATE TABLE folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) NOT NULL
);

-- Create notes table
CREATE TABLE notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id uuid REFERENCES folders(id) ON DELETE CASCADE,
  content text,
  type text NOT NULL CHECK (type IN ('text', 'recording')),
  file_url text,
  transcription text,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) NOT NULL
);

-- Create synthesized ideas table
CREATE TABLE synthesized_ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id uuid REFERENCES folders(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) NOT NULL
);

-- Enable RLS
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthesized_ideas ENABLE ROW LEVEL SECURITY;

-- Policies for folders
CREATE POLICY "Users can manage their folders"
  ON folders
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for notes
CREATE POLICY "Users can manage their notes"
  ON notes
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for synthesized ideas
CREATE POLICY "Users can manage their synthesized ideas"
  ON synthesized_ideas
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);