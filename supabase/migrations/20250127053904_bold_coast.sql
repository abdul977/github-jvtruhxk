/*
  # Initial Schema for Task Management System

  1. New Tables
    - users (managed by Supabase Auth)
    - teams
      - id (uuid, primary key)
      - name (text)
      - created_at (timestamp)
      - owner_id (uuid, references auth.users)
    - team_members
      - id (uuid, primary key)
      - team_id (uuid, references teams)
      - user_id (uuid, references auth.users)
      - role (text)
      - joined_at (timestamp)
    - tasks
      - id (uuid, primary key)
      - title (text)
      - description (text)
      - status (text)
      - priority (text)
      - due_date (timestamp)
      - team_id (uuid, references teams)
      - assignee_id (uuid, references auth.users)
      - creator_id (uuid, references auth.users)
      - parent_task_id (uuid, self-reference)
      - created_at (timestamp)
      - updated_at (timestamp)
    - task_comments
      - id (uuid, primary key)
      - task_id (uuid, references tasks)
      - user_id (uuid, references auth.users)
      - content (text)
      - created_at (timestamp)
    - task_attachments
      - id (uuid, primary key)
      - task_id (uuid, references tasks)
      - user_id (uuid, references auth.users)
      - file_url (text)
      - file_name (text)
      - created_at (timestamp)
    - notifications
      - id (uuid, primary key)
      - user_id (uuid, references auth.users)
      - type (text)
      - content (text)
      - read (boolean)
      - created_at (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for team-based access control
    - Add policies for task access based on team membership
*/

-- Teams table
CREATE TABLE teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  owner_id uuid REFERENCES auth.users(id) NOT NULL
);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Team members table
CREATE TABLE team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  role text NOT NULL CHECK (role IN ('admin', 'member')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(team_id, user_id)
);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Tasks table
CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'completed')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date timestamptz,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  assignee_id uuid REFERENCES auth.users(id),
  creator_id uuid REFERENCES auth.users(id),
  parent_task_id uuid REFERENCES tasks(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Task comments
CREATE TABLE task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

-- Task attachments
CREATE TABLE task_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  file_url text NOT NULL,
  file_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;

-- Notifications
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  type text NOT NULL CHECK (type IN ('deadline', 'mention', 'assignment', 'status_change', 'approval')),
  content text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Teams policies
CREATE POLICY "Team owners can manage their teams"
  ON teams
  FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Team members can view their teams"
  ON teams
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = teams.id
      AND team_members.user_id = auth.uid()
    )
  );

-- Team members policies
CREATE POLICY "Team admins can manage team members"
  ON team_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_members.team_id
      AND tm.user_id = auth.uid()
      AND tm.role = 'admin'
    )
  );

CREATE POLICY "Users can view team members of their teams"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_members.team_id
      AND tm.user_id = auth.uid()
    )
  );

-- Tasks policies
CREATE POLICY "Team members can view their team's tasks"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = tasks.team_id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can create tasks"
  ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = tasks.team_id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Task assignees and admins can update tasks"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (
    assignee_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = tasks.team_id
      AND team_members.user_id = auth.uid()
      AND team_members.role = 'admin'
    )
  );

-- Comments policies
CREATE POLICY "Team members can manage comments"
  ON task_comments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN team_members ON team_members.team_id = tasks.team_id
      WHERE tasks.id = task_comments.task_id
      AND team_members.user_id = auth.uid()
    )
  );

-- Attachments policies
CREATE POLICY "Team members can manage attachments"
  ON task_attachments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN team_members ON team_members.team_id = tasks.team_id
      WHERE tasks.id = task_attachments.task_id
      AND team_members.user_id = auth.uid()
    )
  );

-- Notifications policies
CREATE POLICY "Users can manage their notifications"
  ON notifications
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());