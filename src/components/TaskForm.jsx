import { useState, useEffect } from 'react';
import { Plus, Save, X } from 'lucide-react';
import { formatDate } from '../utils/dates';
import { PRESET_COLORS } from '../utils/colors';

const PHASES = ['Insight', 'Vision', 'Execute'];

export default function TaskForm({ editingTask, tasks, onSubmit, onCancel }) {
  const emptyForm = {
    name: '',
    start: formatDate(new Date()),
    end: formatDate(new Date(Date.now() + 7 * 86400000)),
    group: '',
    progress: 0,
    dependencies: [],
    color: '',
    assignees: [],
  };

  const [form, setForm] = useState(emptyForm);
  const [customHex, setCustomHex] = useState('');

  useEffect(() => {
    if (editingTask) {
      const color = editingTask.color || '';
      setForm({
        name: editingTask.name,
        start: editingTask.start,
        end: editingTask.end,
        group: editingTask.group || '',
        progress: editingTask.progress || 0,
        dependencies: editingTask.dependencies || [],
        color,
        assignees: editingTask.assignees || [],
      });
      // If color is custom (not in presets), show it in hex input
      if (color && !PRESET_COLORS.some((p) => p.hex === color)) {
        setCustomHex(color);
      } else {
        setCustomHex('');
      }
    } else {
      setForm(emptyForm);
      setCustomHex('');
    }
  }, [editingTask]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.start || !form.end) return;
    onSubmit(form);
    if (!editingTask) {
      setForm(emptyForm);
      setCustomHex('');
    }
  };

  const otherTasks = tasks.filter((t) => t.id !== editingTask?.id);

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

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">Start</label>
          <input
            type="date"
            value={form.start}
            onChange={(e) => setForm({ ...form, start: e.target.value })}
            required
            className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
        </div>
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
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-text-muted">Phase</label>
        <select
          value={form.group}
          onChange={(e) => setForm({ ...form, group: e.target.value })}
          className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm focus:border-accent focus:outline-none"
        >
          <option value="">No Phase</option>
          {PHASES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
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
              className={`h-6 w-6 rounded-md border-2 transition ${
                form.color === c.hex ? 'border-text scale-110' : 'border-transparent hover:scale-110'
              }`}
              style={{ backgroundColor: c.hex }}
            />
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

      <div>
        <label className="mb-1 block text-xs font-medium text-text-muted">
          Progress ({form.progress}%)
        </label>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={form.progress}
          onChange={(e) => setForm({ ...form, progress: Number(e.target.value) })}
          className="w-full accent-accent"
        />
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
          <div className="max-h-32 space-y-1 overflow-y-auto rounded-lg border border-border bg-bg p-2">
            {otherTasks.map((t) => {
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

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          {editingTask ? <Save size={14} /> : <Plus size={14} />}
          {editingTask ? 'Update' : 'Add Task'}
        </button>
        {editingTask && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-border px-3 py-2 text-sm text-text-muted hover:bg-bg-alt"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
