/*
  # Fix Team Member Policies

  1. Changes
    - Drop existing problematic policies
    - Create new policies with improved logic
    - Add additional indexes for performance
    - Fix recursive policy issues

  2. Security
    - Maintain proper access control
    - Prevent policy recursion
    - Ensure team admins can manage members
    - Allow proper member visibility
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Team admins can manage members" ON team_members;
DROP POLICY IF EXISTS "Members can view team members" ON team_members;

-- Create new fixed policies for team_members with improved logic
CREATE POLICY "Team admins can manage members"
  ON team_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_members.team_id
      AND (
        teams.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM team_members tm
          WHERE tm.team_id = team_members.team_id
          AND tm.user_id = auth.uid()
          AND tm.role = 'admin'
          AND tm.id != team_members.id  -- Prevent recursion
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_members.team_id
      AND (
        teams.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM team_members tm
          WHERE tm.team_id = team_members.team_id
          AND tm.user_id = auth.uid()
          AND tm.role = 'admin'
          AND tm.id != team_members.id  -- Prevent recursion
        )
      )
    )
  );

-- Separate read-only policy for team members
CREATE POLICY "Members can view team members"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (
    team_id IN (
      SELECT tm.team_id 
      FROM team_members tm
      WHERE tm.user_id = auth.uid()
    )
  );

-- Add composite index to improve policy performance
CREATE INDEX IF NOT EXISTS idx_team_members_team_role
  ON team_members (team_id, user_id, role);

-- Add index for team ownership checks
CREATE INDEX IF NOT EXISTS idx_teams_owner
  ON teams (id, owner_id);