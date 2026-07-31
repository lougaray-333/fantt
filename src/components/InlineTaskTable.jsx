import { memo, useCallback } from 'react';
import { Trash2, Diamond, Star, GripVertical } from 'lucide-react';
import { formatShortDate } from '../utils/dates';
import { getTaskColor, getAllGroups } from '../utils/colors';
import { ROW_HEIGHT, getHeaderHeight } from './GanttChart';

export default memo(function InlineTaskTable({ tasks, viewMode, selectedIds, onSelect, onEdit, onDelete, onToggleSlide, onReorder, onBeginReorder }) {
  const groups = getAllGroups(tasks);
  const HEADER_HEIGHT = getHeaderHeight(viewMode);

  const handleDragStart = useCallback((e, taskIndex) => {
    e.stopPropagation();
    e.preventDefault();
    if (!onReorder) return;
    onBeginReorder?.();
    const startY = e.clientY;
    let currentIndex = taskIndex;

    function onMove(ev) {
      const delta = Math.round((ev.clientY - startY) / ROW_HEIGHT);
      const newIndex = Math.max(0, Math.min(tasks.length - 1, taskIndex + delta));
      if (newIndex !== currentIndex) {
        onReorder(currentIndex, newIndex);
        currentIndex = newIndex;
      }
    }

    function onUp() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [tasks.length, onReorder, onBeginReorder]);

  return (
    <div
      className="shrink-0 border-r border-border bg-sidebar"
      style={{
        width: 280,
        minWidth: 280,
        position: 'sticky',
        left: 0,
        zIndex: 20,
      }}
    >
      {/* Header area — matches chart header height */}
      <div
        className="flex items-end border-b border-border px-3 pb-2 sticky top-0 bg-sidebar z-10"
        style={{ height: HEADER_HEIGHT }}
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Tasks ({tasks.length})
        </span>
      </div>

      {/* Task rows */}
      <div>
        {tasks.map((task, index) => {
          const isSelected = selectedIds?.has(task.id);
          const color = getTaskColor(task, groups);
          return (
            <div
              key={task.id}
              onClick={() => onSelect(task.id)}
              onDoubleClick={() => onEdit?.(task.id)}
              className={`group/row flex items-center gap-2 px-3 cursor-pointer transition border-b border-border/50 ${
                isSelected
                  ? 'bg-accent-light'
                  : 'hover:bg-bg-alt'
              }`}
              style={{
                height: ROW_HEIGHT,
                animation: 'fantt-item-in 0.25s ease-out both',
                animationDelay: `${Math.min(index, 8) * 30}ms`,
              }}
            >
              {/* Drag handle */}
              {onReorder && (
                <div
                  onMouseDown={(e) => handleDragStart(e, index)}
                  className="shrink-0 cursor-ns-resize text-text-muted/20 opacity-0 group-hover/row:opacity-100 hover:!text-text-muted transition"
                  title="Drag to reorder"
                >
                  <GripVertical size={14} />
                </div>
              )}
              {/* Color dot */}
              <div
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: color }}
              />
              {/* Task info */}
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium text-text leading-tight flex items-center gap-1">
                  {task.milestone && <Diamond size={10} className="shrink-0 text-text-muted" />}
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
              {/* Slide toggle */}
              {onToggleSlide && (
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleSlide(task.id, !task.inSlide); }}
                  className={`shrink-0 rounded p-0.5 transition ${
                    task.inSlide
                      ? 'text-accent opacity-100'
                      : 'text-text-muted/30 opacity-0 group-hover/row:opacity-100 hover:text-accent'
                  }`}
                  title={task.inSlide ? 'Remove from slide export' : 'Include in slide export'}
                >
                  <Star size={12} fill={task.inSlide ? 'currentColor' : 'none'} />
                </button>
              )}
              {/* Delete on hover */}
              {onDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
                  className="shrink-0 opacity-0 group-hover/row:opacity-100 rounded p-0.5 text-text-muted/50 hover:text-red-500 hover:bg-red-500/10 transition"
                  title="Delete task"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});
