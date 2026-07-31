import { useState } from 'react';
import { X } from 'lucide-react';
import { FANTASY_2026_HOLIDAYS } from '../utils/dates';

export default function HolidayPanel({ holidays, onSave, onClose }) {
  const [localHolidays, setLocalHolidays] = useState([...holidays]);
  const [newDate, setNewDate] = useState('');
  const [newName, setNewName] = useState('');
  const [addError, setAddError] = useState('');
  const [presetMsg, setPresetMsg] = useState('');

  function handleLoadPreset() {
    const existing = new Set(localHolidays.map(h => h.date));
    const fresh = FANTASY_2026_HOLIDAYS.filter(h => !existing.has(h.date));
    setLocalHolidays(prev => [...prev, ...fresh].sort((a, b) => a.date.localeCompare(b.date)));
    setPresetMsg(fresh.length === 0
      ? 'All Fantasy 2026 holidays already added.'
      : `${fresh.length} holiday${fresh.length !== 1 ? 's' : ''} added.`
    );
  }

  function handleAdd() {
    if (!newDate) return;
    if (localHolidays.some(h => h.date === newDate)) {
      setAddError('This date is already in your list.');
      return;
    }
    setLocalHolidays(prev =>
      [...prev, { date: newDate, name: newName.trim() || 'Holiday' }]
        .sort((a, b) => a.date.localeCompare(b.date))
    );
    setNewDate('');
    setNewName('');
    setAddError('');
  }

  function handleRemove(date) {
    setLocalHolidays(prev => prev.filter(h => h.date !== date));
  }

  function formatDisplay(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 z-50 flex h-full w-96 flex-col border-l border-border bg-sidebar shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3 shrink-0">
          <h2 className="text-sm font-bold text-text">Project Holidays</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-text-muted hover:bg-bg-alt transition">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Explainer */}
          <div className="rounded-lg border border-border/60 bg-bg-alt px-3 py-2.5">
            <p className="text-xs text-text-muted leading-relaxed">
              Holidays are non-working days. Any tasks and their associated hours that land on a designated holiday will automatically be pushed forward to the next working day.
            </p>
          </div>

          {/* Preset */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Fantasy 2026 Preset</p>
            <p className="text-xs text-text-muted">Load Fantasy's standard 2026 company holiday schedule.</p>
            {presetMsg && <p className="text-xs text-text-muted">{presetMsg}</p>}
            <button
              onClick={handleLoadPreset}
              className="w-full rounded-lg border border-border px-3 py-2 text-xs font-medium text-text hover:bg-bg-alt transition"
            >
              Load Fantasy 2026 Holidays
            </button>
          </div>

          {/* Add */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Add a Holiday</p>
            <div className="flex gap-2">
              <input
                type="date"
                value={newDate}
                onChange={e => { setNewDate(e.target.value); setAddError(''); }}
                className="flex-1 rounded-lg border border-border bg-bg px-2.5 py-1.5 text-xs text-text focus:outline-none focus:border-accent"
              />
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Holiday name"
                className="flex-1 rounded-lg border border-border bg-bg px-2.5 py-1.5 text-xs text-text placeholder:text-text-muted focus:outline-none focus:border-accent"
                onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
              />
              <button
                onClick={handleAdd}
                disabled={!newDate}
                className="rounded-lg px-3 py-1.5 text-xs font-medium bg-accent text-white disabled:opacity-40 hover:opacity-90 transition"
              >
                + Add
              </button>
            </div>
            {addError && <p className="text-xs text-red-500">{addError}</p>}
          </div>

          {/* List */}
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Holidays ({localHolidays.length})
            </p>
            {localHolidays.length === 0 ? (
              <p className="text-xs text-text-muted">No holidays added. Load the preset or add one above.</p>
            ) : (
              localHolidays.map(h => (
                <div key={h.date} className="flex items-center justify-between rounded-lg px-2.5 py-2 hover:bg-bg-alt group">
                  <div>
                    <span className="text-xs font-medium text-text">{formatDisplay(h.date)}</span>
                    <span className="text-xs text-text-muted"> · {h.name}</span>
                  </div>
                  <button
                    onClick={() => handleRemove(h.date)}
                    className="text-xs text-text-muted/40 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 border-t border-border px-4 py-3 shrink-0">
          <button onClick={onClose} className="flex-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-text-muted hover:bg-bg-alt transition">
            Cancel
          </button>
          <button
            onClick={() => { onSave(localHolidays); onClose(); }}
            className="flex-1 rounded-lg bg-accent px-3 py-2 text-xs font-medium text-white hover:opacity-90 transition"
          >
            Save Changes
          </button>
        </div>
      </div>
    </>
  );
}
