-- Multi-user live editing: run this in Supabase Dashboard → SQL Editor

-- 1. Full row data on realtime UPDATE/DELETE events (required for payload content)
ALTER TABLE tasks REPLICA IDENTITY FULL;
ALTER TABLE project_budgets REPLICA IDENTITY FULL;

-- 2. Edit token columns on projects
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS edit_token UUID UNIQUE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS edit_enabled BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS projects_edit_token_idx
  ON projects (edit_token) WHERE edit_token IS NOT NULL;

-- 3. Anon write RLS: tasks writable when project has edit_enabled
CREATE POLICY "Anon write tasks via edit link"
  ON tasks FOR ALL TO anon
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = tasks.project_id
        AND p.edit_enabled = TRUE
        AND p.edit_token IS NOT NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = tasks.project_id
        AND p.edit_enabled = TRUE
        AND p.edit_token IS NOT NULL
    )
  );

-- 4. Anon write RLS: project_budgets writable when project has edit_enabled
CREATE POLICY "Anon write budgets via edit link"
  ON project_budgets FOR ALL TO anon
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_budgets.project_id
        AND p.edit_enabled = TRUE
        AND p.edit_token IS NOT NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_budgets.project_id
        AND p.edit_enabled = TRUE
        AND p.edit_token IS NOT NULL
    )
  );

-- 5. Change history table
CREATE TABLE IF NOT EXISTS task_history (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  task_id        UUID NOT NULL,
  task_name      TEXT,
  change_type    TEXT NOT NULL,  -- 'create' | 'update' | 'move' | 'delete'
  changed_fields JSONB,          -- { field: { from, to } } for 'update'; { dates: { from, to } } for 'move'
  changed_by     TEXT,           -- owner email or collaborator display name
  changed_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS task_history_project_idx
  ON task_history (project_id, changed_at DESC);

ALTER TABLE task_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read task history"
  ON task_history FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM projects p WHERE p.id = task_history.project_id));

CREATE POLICY "Anyone with edit link can insert history"
  ON task_history FOR INSERT TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = task_history.project_id
        AND p.edit_enabled = TRUE
    )
  );

-- Note: also allow owners (authenticated or anon) to insert history
-- The above policy covers edit-link sessions; owners write via the same anon client
-- so they are covered as long as edit_enabled is true when they are in the editor.
-- For own-project editing (edit_enabled = false), add a looser policy:
CREATE POLICY "Project owner can always insert history"
  ON task_history FOR INSERT TO anon
  WITH CHECK (
    EXISTS (SELECT 1 FROM projects p WHERE p.id = task_history.project_id)
  );

-- 6. Enable realtime replication
-- If these fail, enable manually in Dashboard > Database > Replication
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE project_budgets;
ALTER PUBLICATION supabase_realtime ADD TABLE task_history;
