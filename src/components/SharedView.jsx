import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import GanttChart from './GanttChart';
import FanttLogo from './FanttLogo';

function rowToTask(row) {
  return {
    id: row.id,
    name: row.name,
    start: row.start_date,
    end: row.end_date,
    group: row.group || '',
    progress: row.progress || 0,
    dependencies: row.dependencies || [],
    color: row.color || '',
    sortOrder: row.sort_order ?? 0,
    assignees: [],   // never expose assignees in shared view
    milestone: row.start_date === row.end_date,
  };
}

export default function SharedView({ token }) {
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | invalid

  useEffect(() => {
    async function load() {
      // Fetch project by share token
      const { data: proj, error: projErr } = await supabase
        .from('projects')
        .select('id, name, share_enabled')
        .eq('share_token', token)
        .eq('share_enabled', true)
        .single();

      if (projErr || !proj) { setStatus('invalid'); return; }

      // Fetch tasks for this project
      const { data: rows, error: tasksErr } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', proj.id)
        .order('sort_order', { ascending: true });

      if (tasksErr) { setStatus('invalid'); return; }

      setProject(proj);
      setTasks((rows || []).map(rowToTask));
      setStatus('ready');
    }
    load();
  }, [token]);

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-bg">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-600 border-t-amber-400" />
      </div>
    );
  }

  if (status === 'invalid') {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-bg text-center px-4">
        <FanttLogo size={32} />
        <p className="text-sm font-semibold text-text">This link is no longer active</p>
        <p className="text-xs text-text-muted max-w-xs">
          The project owner may have disabled or regenerated this link.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-bg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-3 shrink-0 bg-sidebar">
        <div className="flex items-center gap-2.5">
          <FanttLogo size={20} />
          <span className="text-sm font-bold text-text">Fantt</span>
        </div>
        {project?.name && (
          <span className="text-sm font-medium text-text-muted">{project.name}</span>
        )}
        <span className="text-xs text-text-muted/50 hidden sm:block">View only</span>
      </div>

      {/* Gantt */}
      <div className="flex-1 overflow-hidden">
        {tasks.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-text-muted">No tasks in this project yet.</p>
          </div>
        ) : (
          <GanttChart
            tasks={tasks}
            viewMode="week"
            hideWeekends={false}
            selectedIds={new Set()}
            onTaskClick={() => {}}
            onTaskUpdate={() => {}}
            onBeginDrag={() => {}}
            onDragMove={() => {}}
            onEndDrag={() => {}}
            onReorder={() => {}}
            onBeginReorder={() => {}}
            onResizeEnd={() => {}}
            onMoveEnd={() => {}}
          />
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border px-5 py-2.5 shrink-0 bg-sidebar flex items-center justify-center">
        <span className="text-[11px] text-text-muted/50">Powered by Fantt</span>
      </div>
    </div>
  );
}
