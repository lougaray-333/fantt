import { formatShortDate } from '../utils/dates';
import { getTaskColor, getAllGroups } from '../utils/colors';
import { ROW_HEIGHT, getHeaderHeight } from './GanttChart';

export default function InlineTaskTable({ tasks, viewMode, selectedIds, onSelect }) {
  const groups = getAllGroups(tasks);
  const HEADER_HEIGHT = getHeaderHeight(viewMode);

  return (
    <div
      className="shrink-0 border-r border-border bg-sidebar"
      style={{
        width: 280,
        position: 'sticky',
        left: 0,
        zIndex: 10,
      }}
    >
      {/* Header area — matches chart header height */}
      <div
        className="flex items-end border-b border-border px-3 pb-2"
        style={{ height: HEADER_HEIGHT }}
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Tasks ({tasks.length})
        </span>
      </div>

      {/* Task rows */}
      <div>
        {tasks.map((task) => {
          const isSelected = selectedIds?.has(task.id);
          const color = getTaskColor(task, groups);
          return (
            <div
              key={task.id}
              onClick={() => onSelect(task.id, false)}
              className={`flex items-center gap-2 px-3 cursor-pointer transition border-b border-border/50 ${
                isSelected
                  ? 'bg-accent-light'
                  : 'hover:bg-bg-alt'
              }`}
              style={{ height: ROW_HEIGHT }}
            >
              {/* Color dot */}
              <div
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: color }}
              />
              {/* Task info */}
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium text-text leading-tight">
                  {task.name}
                </div>
                <div className="truncate text-[10px] text-text-muted leading-tight">
                  {formatShortDate(task.start)} – {formatShortDate(task.end)}
                </div>
                {task.assignees?.length > 0 && (
                  <div className="truncate text-[10px] text-text-muted/70 leading-tight">
                    {task.assignees.map((a) => a.name).filter(Boolean).join(', ')}
                    {' · '}
                    {task.assignees.reduce((sum, a) => sum + (a.hoursPerDay || 0), 0)}h/d
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
