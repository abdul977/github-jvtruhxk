/*
  # Fix Team Policies and Add Assignee Features

  1. Changes
    - Fix infinite recursion in team_members policies
    - Add assignee-related policies
    - Add assignee preferences table
    - Add workload tracking

  2. Security
    - Update RLS policies for team_members
    - Add policies for assignee preferences
*/

-- Create assignee preferences table
CREATE TABLE IF NOT EXISTS assignee_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  max_tasks int DEFAULT 5,
  preferred_task_types text[],
  availability_status text DEFAULT 'available' CHECK (availability_status IN ('available', 'busy', 'away')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE assignee_preferences ENABLE ROW LEVEL SECURITY;

-- Create workload tracking table
CREATE TABLE IF NOT EXISTS workload_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  task_count int DEFAULT 0,
  last_assignment timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE workload_tracking ENABLE ROW LEVEL SECURITY;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Team admins can manage team members" ON team_members;
DROP POLICY IF EXISTS "Users can view team members of their teams" ON team_members;

-- Create new fixed policies for team_members
CREATE POLICY "Team admins can manage members"
  ON team_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_members.team_id
      AND (teams.owner_id = auth.uid() OR
           EXISTS (
             SELECT 1 FROM team_members admin_check
             WHERE admin_check.team_id = team_members.team_id
             AND admin_check.user_id = auth.uid()
             AND admin_check.role = 'admin'
           ))
    )
  );

CREATE POLICY "Members can view team members"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_members.team_id
      AND (teams.owner_id = auth.uid() OR
           team_members.user_id = auth.uid())
    )
  );

-- Policies for assignee preferences
CREATE POLICY "Users can manage their preferences"
  ON assignee_preferences
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Team members can view preferences"
  ON assignee_preferences
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.user_id = assignee_preferences.user_id
      AND team_members.team_id IN (
        SELECT team_id FROM team_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Policies for workload tracking
CREATE POLICY "Users can view workload"
  ON workload_tracking
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.user_id = workload_tracking.user_id
      AND team_members.team_id IN (
        SELECT team_id FROM team_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "System can manage workload"
  ON workload_tracking
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to update workload tracking
CREATE OR REPLACE FUNCTION update_workload_tracking()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.assignee_id != NEW.assignee_id) THEN
    -- Update task count for new assignee
    INSERT INTO workload_tracking (user_id, task_count, last_assignment)
    VALUES (NEW.assignee_id, 1, now())
    ON CONFLICT (user_id) DO UPDATE
    SET task_count = workload_tracking.task_count + 1,
        last_assignment = now(),
        updated_at = now();
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.assignee_id != NEW.assignee_id THEN
    -- Decrease task count for previous assignee
    UPDATE workload_tracking
    SET task_count = GREATEST(0, task_count - 1),
        updated_at = now()
    WHERE user_id = OLD.assignee_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for workload tracking
DROP TRIGGER IF EXISTS track_workload ON tasks;
CREATE TRIGGER track_workload
  AFTER INSERT OR UPDATE OF assignee_id
  ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_workload_tracking();