import { useState, useEffect, useRef } from 'react';
import { Plus, X, Trash2, Check, Diamond, Copy } from 'lucide-react';
import { formatDate, computeAutoProgress } from '../utils/dates';
import { PRESET_COLORS, getContrastColor } from '../utils/colors';

export default function TaskForm({ editingTask, tasks, holidays = [], onSubmit, onCancel, onDelete, onDuplicate, defaultStart: propDefaultStart }) {
  // Default start = prop override (insert-after), else day after last task's end, else today
  const lastTask = tasks.length > 0 ? tasks[tasks.length - 1] : null;
  const defaultStart = propDefaultStart || (lastTask
    ? formatDate(new Date(new Date(lastTask.end + 'T00:00:00').getTime() + 86400000))
    : formatDate(new Date()));
  const defaultEnd = formatDate(new Date(new Date(defaultStart + 'T00:00:00').getTime() + 7 * 86400000));

  const emptyForm = {
    name: '',
    start: defaultStart,
    end: defaultEnd,
    group: '',
    progress: 0,
    autoProgress: true,
    dependencies: [],
    color: '',
    assignees: [],
    milestone: false,
  };

  const [form, setForm] = useState(emptyForm);
  const [customHex, setCustomHex] = useState('');
  const lastTaskIdRef = useRef(null);

  useEffect(() => {
    initialLoadRef.current = true;
    if (editingTask) {
      const color = editingTask.color || '';
      setForm({
        name: editingTask.name,
        start: editingTask.start,
        end: editingTask.end,
        group: editingTask.group || '',
        progress: editingTask.progress || 0,
        autoProgress: editingTask.autoProgress || false,
        dependencies: editingTask.dependencies || [],
        color,
        assignees: editingTask.assignees || [],
        milestone: editingTask.milestone || false,
      });
      // Only reset hex input when opening a different task, not on every auto-save update
      if (editingTask.id !== lastTaskIdRef.current) {
        lastTaskIdRef.current = editingTask.id;
        if (color && !PRESET_COLORS.some((p) => p.hex === color)) {
          setCustomHex(color);
        } else {
          setCustomHex('');
        }
      }
    } else {
      lastTaskIdRef.current = null;
      setForm(emptyForm);
      setCustomHex('');
    }
  }, [editingTask]);

  // Auto-save when editing: debounce form changes
  const [showSaved, setShowSaved] = useState(false);
  const autoSaveRef = useRef(null);
  const savedTimerRef = useRef(null);
  const initialLoadRef = useRef(true);
  useEffect(() => {
    if (!editingTask) { initialLoadRef.current = true; return; }
    if (initialLoadRef.current) { initialLoadRef.current = false; return; }
    if (!form.name.trim() || !form.start || !form.end) return;

    clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => {
      onSubmit(form);
      setShowSaved(true);
      clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setShowSaved(false), 1500);
    }, 500);

    return () => clearTimeout(autoSaveRef.current);
  }, [form, editingTask]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.start || !form.end) return;
    onSubmit(form);
    if (!editingTask) {
      setForm(emptyForm);
      setCustomHex('');
    }
  };

  const editingIdx = tasks.findIndex((t) => t.id === editingTask?.id);
  const previousTask = editingIdx > 0 ? tasks[editingIdx - 1] : null;
  const otherTasks = tasks.filter((t) => t.id !== editingTask?.id);
  const sortedOtherTasks = [...otherTasks].sort((a, b) => {
    const aChecked = form.dependencies.includes(a.id);
    const bChecked = form.dependencies.includes(b.id);
    if (aChecked !== bChecked) return aChecked ? -1 : 1;
    const aIdx = tasks.findIndex((t) => t.id === a.id);
    const bIdx = tasks.findIndex((t) => t.id === b.id);
    return Math.abs(aIdx - editingIdx) - Math.abs(bIdx - editingIdx);
  });

  const toggleDep = (id) => {
    setForm((prev) => ({
      ...prev,
      dependencies: prev.dependencies.includes(id)
        ? prev.dependencies.filter((d) => d !== id)
        : [...prev.dependencies, id],
    }));
  };

  const selectColor = (hex) => {
    setForm((prev) => ({ ...prev, color: hex }));
    setCustomHex('');
  };

  const applyCustomHex = (val) => {
    setCustomHex(val);
    // Validate hex
    if (/^#[0-9a-fA-F]{6}$/.test(val)) {
      setForm((prev) => ({ ...prev, color: val }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-text-muted">Task Name</label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Kickoff and Immersion"
          required
          className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
      </div>

      <div className={`grid gap-2 ${form.milestone ? 'grid-cols-1' : 'grid-cols-2'}`}>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">Start</label>
          <input
            type="date"
            value={form.start}
            onChange={(e) => setForm({ ...form, start: e.target.value, ...(form.milestone ? { end: e.target.value } : {}) })}
            required
            className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
        </div>
        {!form.milestone && (
          <div>
            <label className="mb-1 block text-xs font-medium text-text-muted">End</label>
            <input
              type="date"
              value={form.end}
              onChange={(e) => setForm({ ...form, end: e.target.value })}
              required
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Color picker */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-text-muted">Color</label>
        <div className="flex flex-wrap items-center gap-1.5">
          {/* "Auto" option — no custom color, uses group color */}
          <button
            type="button"
            onClick={() => { setForm((prev) => ({ ...prev, color: '' })); setCustomHex(''); }}
            className={`flex h-6 items-center rounded-md border px-2 text-[10px] font-medium transition ${
              !form.color
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-border text-text-muted hover:border-accent/40'
            }`}
          >
            Auto
          </button>
          {PRESET_COLORS.map((c) => (
            <button
              key={c.hex}
              type="button"
              onClick={() => selectColor(c.hex)}
              title={c.name}
              className={`relative h-6 w-6 rounded-md border-2 transition flex items-center justify-center ${
                form.color === c.hex ? 'border-text scale-110' : 'border-transparent hover:scale-110'
              }`}
              style={{ backgroundColor: c.hex }}
            >
              {form.color === c.hex && (
                <Check size={12} style={{ color: '#ffffff' }} strokeWidth={3} />
              )}
            </button>
          ))}
        </div>
        {/* Custom hex input */}
        <div className="mt-1.5 flex items-center gap-1.5">
          <input
            type="text"
            value={customHex}
            onChange={(e) => applyCustomHex(e.target.value)}
            placeholder="#hex"
            maxLength={7}
            className="w-20 rounded-md border border-border bg-bg px-2 py-1 text-xs text-text placeholder:text-text-muted/40 focus:border-accent focus:outline-none"
          />
          {customHex && /^#[0-9a-fA-F]{6}$/.test(customHex) && (
            <div
              className="h-5 w-5 rounded border border-border"
              style={{ backgroundColor: customHex }}
            />
          )}
        </div>
      </div>

      {!form.milestone && (
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-xs font-medium text-text-muted">Progress</label>
            <div className="flex rounded-md border border-border overflow-hidden text-[10px] font-medium">
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, autoProgress: true }))}
                className={`px-2.5 py-0.5 transition ${form.autoProgress ? 'bg-accent text-white' : 'text-text-muted hover:bg-bg-alt'}`}
              >
                Auto
              </button>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, autoProgress: false }))}
                className={`px-2.5 py-0.5 border-l border-border transition ${!form.autoProgress ? 'bg-accent text-white' : 'text-text-muted hover:bg-bg-alt'}`}
              >
                Manual
              </button>
            </div>
          </div>
          {form.autoProgress ? (
            <p className="text-xs text-text-muted">
              <span className="font-medium text-text">{computeAutoProgress(form.start, form.end, holidays)}%</span>
              {' '}— calculated from dates
            </p>
          ) : (
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={form.progress}
              onChange={(e) => setForm({ ...form, progress: Number(e.target.value) })}
              className="w-full accent-accent"
            />
          )}
          {!form.autoProgress && (
            <p className="text-[10px] text-text-muted/60 mt-0.5">{form.progress}%</p>
          )}
        </div>
      )}

      {/* Milestone toggle */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            const next = !form.milestone;
            setForm({ ...form, milestone: next, ...(next ? { end: form.start, progress: 0 } : {}) });
          }}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
            form.milestone
              ? 'border-accent bg-accent/10 text-accent'
              : 'border-border text-text-muted hover:border-accent/40'
          }`}
        >
          <Diamond size={12} />
          Milestone
        </button>
        {form.milestone && (
          <span className="text-[10px] text-text-muted">Single-day marker (no duration)</span>
        )}
      </div>

      {/* Assignees */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-text-muted">Assignees</label>
        <div className="space-y-1.5">
          {form.assignees.map((a, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <input
                type="text"
                value={a.name}
                onChange={(e) => {
                  const next = [...form.assignees];
                  next[i] = { ...next[i], name: e.target.value };
                  setForm({ ...form, assignees: next });
                }}
                placeholder="Name"
                className="flex-1 rounded-lg border border-border bg-bg px-2.5 py-1.5 text-sm focus:border-accent focus:outline-none"
              />
              <input
                type="number"
                min={0.5}
                max={24}
                step={0.5}
                value={a.hoursPerDay}
                onChange={(e) => {
                  const next = [...form.assignees];
                  next[i] = { ...next[i], hoursPerDay: Number(e.target.value) || 0 };
                  setForm({ ...form, assignees: next });
                }}
                className="w-16 rounded-lg border border-border bg-bg px-2 py-1.5 text-sm focus:border-accent focus:outline-none"
              />
              <span className="text-[10px] text-text-muted">h/d</span>
              <button
                type="button"
                onClick={() => {
                  setForm({ ...form, assignees: form.assignees.filter((_, j) => j !== i) });
                }}
                className="rounded p-1 text-text-muted hover:bg-red-500/10 hover:text-red-500 transition"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setForm({ ...form, assignees: [...form.assignees, { name: '', hoursPerDay: 8 }] })}
          className="mt-1.5 flex items-center gap-1 text-xs font-medium text-accent hover:text-accent/80 transition"
        >
          <Plus size={12} />
          Add assignee
        </button>
      </div>

      {otherTasks.length > 0 && (
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">Dependencies</label>
          {previousTask && (
            <button
              type="button"
              onClick={() => {
                if (!form.dependencies.includes(previousTask.id)) toggleDep(previousTask.id);
              }}
              className={`mb-1.5 w-full rounded-lg border px-3 py-1.5 text-left text-xs transition ${
                form.dependencies.includes(previousTask.id)
                  ? 'border-accent/40 bg-accent/10 text-accent cursor-default'
                  : 'border-border text-text-muted hover:border-accent/40 hover:text-text'
              }`}
            >
              {form.dependencies.includes(previousTask.id) ? '✓ ' : '↑ '}
              {previousTask.name}
            </button>
          )}
          <div className="max-h-28 space-y-1 overflow-y-auto rounded-lg border border-border bg-bg p-2">
            {sortedOtherTasks.map((t) => {
              const checked = form.dependencies.includes(t.id);
              return (
                <label
                  key={t.id}
                  className={`flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition ${
                    checked ? 'bg-accent/10 text-accent' : 'text-text hover:bg-bg-alt'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleDep(t.id)}
                    className="accent-accent"
                  />
                  <span className="truncate">{t.name}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {editingTask ? (
        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => {
              if (!form.name.trim() || !form.start || !form.end) return;
              onSubmit(form);
              setShowSaved(true);
              clearTimeout(savedTimerRef.current);
              savedTimerRef.current = setTimeout(() => setShowSaved(false), 1500);
            }}
            className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              showSaved
                ? 'border-green-500/40 bg-green-500/10 text-green-500'
                : 'border-border text-text-muted hover:border-accent/40 hover:text-text'
            }`}
          >
            <Check size={11} />
            {showSaved ? 'Saved' : 'Save'}
          </button>
          {onDuplicate && (
            <button
              type="button"
              onClick={() => onDuplicate(editingTask.id)}
              className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-muted hover:border-accent/40 hover:text-text transition"
            >
              <Copy size={11} />
              Duplicate
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(editingTask.id)}
              className="ml-auto flex items-center gap-1 rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-500/10 transition"
            >
              <Trash2 size={11} />
              Delete
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-1.5 pt-1">
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            <Plus size={14} />
            Add Task
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-center text-xs text-text-muted/50 hover:text-text-muted transition py-1"
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </form>
  );
}
