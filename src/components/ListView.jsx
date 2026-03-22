import { useState, useRef, useEffect, useMemo, Fragment } from 'react';
import { ChevronDown, ChevronRight, Pencil } from 'lucide-react';
import { formatShortDate, diffDays } from '../utils/dates';
import { getTaskColor, getAllGroups } from '../utils/colors';

const PHASE_ORDER = ['Insight', 'Vision', 'Execute'];

function calculateTaskHours(task) {
  if (!task.assignees?.length) return 0;
  const totalHoursPerDay = task.assignees.reduce((sum, a) => sum + (a.hoursPerDay || 0), 0);
  const days = diffDays(task.start, task.end) + 1;
  return totalHoursPerDay * days;
}

function groupTasksByPhase(tasks) {
  const groups = {};
  for (const task of tasks) {
    const phase = task.group || 'No Phase';
    if (!groups[phase]) groups[phase] = [];
    groups[phase].push(task);
  }

  const sorted = [];
  for (const p of PHASE_ORDER) {
    if (groups[p]) sorted.push({ phase: p, tasks: groups[p] });
  }
  for (const p of Object.keys(groups)) {
    if (!PHASE_ORDER.includes(p) && p !== 'No Phase') {
      sorted.push({ phase: p, tasks: groups[p] });
    }
  }
  if (groups['No Phase']) sorted.push({ phase: 'No Phase', tasks: groups['No Phase'] });
  return sorted;
}

function EditableCell({ value, onSave, type = 'text', placeholder = '—' }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      if (type !== 'date') inputRef.current.select();
    }
  }, [editing]);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const commit = () => {
    setEditing(false);
    if (draft !== value) onSave(draft);
  };

  const cancel = () => {
    setEditing(false);
    setDraft(value);
  };

  if (!editing) {
    return (
      <div
        className="group/cell flex items-center gap-1.5 rounded-md px-2 py-1 -mx-2 cursor-text hover:bg-accent/5 hover:ring-1 hover:ring-accent/20 transition"
        onClick={() => setEditing(true)}
      >
        <span className="text-sm text-text-muted">
          {type === 'date' ? formatShortDate(value) : value || placeholder}
        </span>
        <Pencil size={10} className="shrink-0 text-text-muted/0 group-hover/cell:text-text-muted/40 transition" />
      </div>
    );
  }

  return (
    <input
      ref={inputRef}
      type={type}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit();
        if (e.key === 'Escape') cancel();
      }}
      className="w-full rounded-md border border-accent bg-bg px-2 py-1 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/40"
    />
  );
}

export default function ListView({ tasks, onTaskUpdate, onTaskClick }) {
  const [collapsed, setCollapsed] = useState(new Set());
  const groups = getAllGroups(tasks);
  const phaseGroups = useMemo(() => groupTasksByPhase(tasks), [tasks]);

  const totalHours = useMemo(
    () => tasks.reduce((sum, t) => sum + calculateTaskHours(t), 0),
    [tasks]
  );

  const togglePhase = (phase) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(phase)) next.delete(phase);
      else next.add(phase);
      return next;
    });
  };

  return (
    <div className="flex-1 overflow-auto bg-bg px-6 py-5">
      <div className="mx-auto w-full max-w-6xl">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-border text-left">
              <th className="w-12 px-3 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">#</th>
              <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Name</th>
              <th className="w-48 px-3 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Assignee</th>
              <th className="w-36 px-3 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Due Date</th>
              <th className="w-32 px-3 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Phase</th>
              <th className="w-28 px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-muted">Est. Hours</th>
            </tr>
          </thead>
          <tbody>
            {phaseGroups.map(({ phase, tasks: phaseTasks }) => {
              const isCollapsed = collapsed.has(phase);
              const phaseHours = phaseTasks.reduce((sum, t) => sum + calculateTaskHours(t), 0);

              return (
                <Fragment key={phase}>
                  {/* Phase header */}
                  <tr
                    className="cursor-pointer border-b border-border bg-bg-alt hover:bg-border/30 transition"
                    onClick={() => togglePhase(phase)}
                  >
                    <td colSpan={5} className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        {isCollapsed ? <ChevronRight size={16} className="text-text-muted" /> : <ChevronDown size={16} className="text-text-muted" />}
                        <span className="text-sm font-semibold text-text">{phase}</span>
                        <span className="rounded-full bg-border/50 px-2 py-0.5 text-[10px] font-medium text-text-muted">{phaseTasks.length}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right text-xs font-medium text-text-muted">
                      {phaseHours > 0 ? `${Math.round(phaseHours)}h` : ''}
                    </td>
                  </tr>

                  {/* Phase tasks */}
                  {!isCollapsed && phaseTasks.map((task) => {
                    const color = getTaskColor(task, groups);
                    const hours = calculateTaskHours(task);
                    const globalIdx = tasks.findIndex((t) => t.id === task.id) + 1;

                    return (
                      <tr
                        key={task.id}
                        className="group border-b border-border/30 hover:bg-bg-alt/60 transition"
                      >
                        <td className="px-3 py-2.5 text-sm text-text-muted/50">{globalIdx}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-transparent group-hover:ring-white/10 transition"
                              style={{ backgroundColor: color }}
                            />
                            <span
                              className="cursor-pointer text-sm font-medium text-text hover:text-accent transition"
                              onClick={() => onTaskClick?.(task.id)}
                            >
                              {task.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <EditableCell
                            value={task.assignees?.map((a) => a.name).filter(Boolean).join(', ') || ''}
                            placeholder="Add assignee"
                            onSave={(val) => {
                              const names = val.split(',').map((n) => n.trim()).filter(Boolean);
                              const assignees = names.map((name) => {
                                const existing = task.assignees?.find((a) => a.name === name);
                                return existing || { name, hoursPerDay: 8 };
                              });
                              onTaskUpdate(task.id, { assignees });
                            }}
                          />
                        </td>
                        <td className="px-3 py-2.5">
                          <EditableCell
                            value={task.end}
                            type="date"
                            onSave={(val) => onTaskUpdate(task.id, { end: val })}
                          />
                        </td>
                        <td className="px-3 py-2.5">
                          <EditableCell
                            value={task.group || ''}
                            placeholder="No phase"
                            onSave={(val) => onTaskUpdate(task.id, { group: val })}
                          />
                        </td>
                        <td className="px-3 py-2.5 text-right text-sm text-text-muted">
                          {hours > 0 ? Math.round(hours) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </Fragment>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border">
              <td colSpan={5} className="px-3 py-3 text-sm font-semibold text-text">
                Total
              </td>
              <td className="px-3 py-3 text-right text-sm font-semibold text-text">
                {totalHours > 0 ? `${Math.round(totalHours)}h` : '—'}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
