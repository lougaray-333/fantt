import { Pencil, Trash2 } from 'lucide-react';
import { formatShortDate } from '../utils/dates';
import { getTaskColor, getAllGroups } from '../utils/colors';

export default function TaskList({ tasks, selectedIds, onSelect, onEdit, onDelete }) {
  const groups = getAllGroups(tasks);

  if (tasks.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-text-muted">
        <p>No tasks yet</p>
        <p className="mt-1 text-xs">Add your first task above</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {tasks.map((task) => {
        const isSelected = selectedIds?.has(task.id);
        return (
          <div
            key={task.id}
            onClick={() => onSelect(task.id, false)}
            className={`group flex items-center gap-2 rounded-lg px-2 py-2 text-sm cursor-pointer transition ${
              isSelected
                ? 'bg-accent/10 border border-accent/30'
                : 'hover:bg-bg-alt border border-transparent'
            }`}
          >
            {/* Checkbox for multi-select */}
            <input
              type="checkbox"
              checked={isSelected || false}
              onChange={(e) => {
                e.stopPropagation();
                onSelect(task.id, true);
              }}
              onClick={(e) => e.stopPropagation()}
              className="h-3.5 w-3.5 shrink-0 accent-accent rounded"
            />
            <div
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: getTaskColor(task, groups) }}
            />
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium text-text">{task.name}</div>
              <div className="truncate text-[10px] text-text-muted">
                {formatShortDate(task.start)} – {formatShortDate(task.end)}
                {task.group && <span className="ml-1 opacity-60">· {task.group}</span>}
              </div>
            </div>
            <div className="flex shrink-0 gap-0.5 opacity-0 group-hover:opacity-100 transition">
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(task); }}
                className="rounded p-1 text-text-muted hover:bg-accent/10 hover:text-accent"
                title="Edit"
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
                className="rounded p-1 text-text-muted hover:bg-red-50 hover:text-red-500"
                title="Delete"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
