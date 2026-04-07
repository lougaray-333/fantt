import { useState, useEffect, useRef } from 'react';
import { Diamond, CalendarOff, Grid3x3 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import GanttChart, { ROW_HEIGHT, getHeaderHeight } from './GanttChart';
import FanttLogo from './FanttLogo';
import { formatShortDate } from '../utils/dates';
import { getTaskColor, getAllGroups } from '../utils/colors';

const VIEW_MODE = 'day';

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
    assignees: [],  // never expose assignees in shared view
    milestone: row.start_date === row.end_date,
  };
}

function ReadOnlyTaskList({ tasks, viewMode }) {
  const groups = getAllGroups(tasks);
  const HEADER_HEIGHT = getHeaderHeight(viewMode);

  return (
    <div
      className="shrink-0 border-r border-border bg-sidebar"
      style={{ width: 280, minWidth: 280, position: 'sticky', left: 0, zIndex: 20 }}
    >
      <div
        className="flex items-end border-b border-border px-3 pb-2 sticky top-0 bg-sidebar z-10"
        style={{ height: HEADER_HEIGHT }}
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Tasks ({tasks.length})
        </span>
      </div>
      <div>
        {tasks.map((task) => {
          const color = getTaskColor(task, groups);
          return (
            <div
              key={task.id}
              className="flex items-center gap-2 px-3 border-b border-border/50"
              style={{ height: ROW_HEIGHT }}
            >
              <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium text-text leading-tight flex items-center gap-1">
                  {task.milestone && <Diamond size={10} className="shrink-0 text-text-muted" />}
                  {task.name}
                </div>
                <div className="truncate text-[10px] text-text-muted leading-tight">
                  {formatShortDate(task.start)} – {formatShortDate(task.end)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function SharedView({ token }) {
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | invalid
  const [hideWeekends, setHideWeekends] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    async function load() {
      const { data: proj, error: projErr } = await supabase
        .from('projects')
        .select('id, name, share_enabled')
        .eq('share_token', token)
        .eq('share_enabled', true)
        .single();

      if (projErr || !proj) { setStatus('invalid'); return; }

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
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent" />
      </div>
    );
  }

  if (status === 'invalid') {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-bg text-center px-4">
        <div className="flex flex-col items-center leading-none gap-0.5 mb-1">
          <span className="text-base font-bold tracking-tight text-text">Fantt Chart</span>
          <div className="flex items-center gap-1">
            <FanttLogo size={9} color="rgba(255,255,255,0.35)" />
            <span className="text-[10px] font-light text-text-muted/60">Created by Fantasy</span>
          </div>
        </div>
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
      <div className="flex items-center justify-between border-b border-border px-5 py-2 shrink-0 bg-sidebar">
        <div className="flex flex-col leading-none gap-0.5">
          <span className="text-sm font-bold tracking-tight text-text">Fantt Chart</span>
          <div className="flex items-center gap-1">
            <FanttLogo size={9} color="rgba(255,255,255,0.35)" />
            <span className="text-[10px] font-light text-text-muted/60">Created by Fantasy</span>
          </div>
        </div>
        {project?.name && (
          <span className="text-sm font-medium text-text-muted truncate max-w-[40%] text-center">{project.name}</span>
        )}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setHideWeekends(h => !h)}
            className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition ${hideWeekends ? 'bg-accent/15 text-accent' : 'text-text-muted hover:bg-bg-alt'}`}
            title={hideWeekends ? 'Show weekends' : 'Hide weekends'}
          >
            <CalendarOff size={13} />
            <span className="hidden sm:inline">Weekends</span>
          </button>
          <button
            onClick={() => setShowGrid(g => !g)}
            className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition ${showGrid ? 'bg-accent/15 text-accent' : 'text-text-muted hover:bg-bg-alt'}`}
            title={showGrid ? 'Hide grid' : 'Show grid'}
          >
            <Grid3x3 size={13} />
            <span className="hidden sm:inline">Grid</span>
          </button>
          <span className="text-xs text-text-muted/50 ml-1 hidden sm:block">View only</span>
        </div>
      </div>

      {/* Main: task list + gantt in shared scroll container */}
      <div ref={scrollRef} className="flex flex-1 overflow-auto min-h-0 items-start">
        {tasks.length === 0 ? (
          <div className="flex flex-1 items-center justify-center py-20">
            <p className="text-sm text-text-muted">No tasks in this project yet.</p>
          </div>
        ) : (
          <>
            <ReadOnlyTaskList tasks={tasks} viewMode={VIEW_MODE} />
            <GanttChart
              tasks={tasks}
              viewMode={VIEW_MODE}
              hideWeekends={hideWeekends}
              showGrid={showGrid}
              ganttScrollRef={scrollRef}
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
              onHorizontalScroll={() => {}}
            />
          </>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border px-5 py-2.5 shrink-0 bg-sidebar flex items-center justify-center">
        <span className="text-[11px] text-text-muted/50">Powered by Fantasy</span>
      </div>
    </div>
  );
}
