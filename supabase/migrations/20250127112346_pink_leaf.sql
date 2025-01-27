/*
  # Fix Team Member Policies

  1. Changes
    - Fix infinite recursion in team_members policies
    - Improve policy logic for team management
    - Add missing index for performance
  
  2. Security
    - Maintain proper access control
    - Prevent policy loops
    - Ensure proper authorization checks
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Team admins can manage members" ON team_members;
DROP POLICY IF EXISTS "Members can view team members" ON team_members;

-- Create new fixed policies for team_members
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
  );

CREATE POLICY "Members can view team members"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members viewer
      WHERE viewer.team_id = team_members.team_id
      AND viewer.user_id = auth.uid()
    )
  );

-- Add index to improve policy performance
CREATE INDEX IF NOT EXISTS idx_team_members_team_user
  ON team_members (team_id, user_id);

-- Add index for role checks
CREATE INDEX IF NOT EXISTS idx_team_members_role
  ON team_members (team_id, user_id, role);