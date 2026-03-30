import { useState, useMemo, useEffect } from 'react';
import { X, Search, Plus, ChevronDown, ChevronRight, Clock, User, Info, Loader2 } from 'lucide-react';
import activityDatabase, { fetchActivities, getPhases, getOwners } from '../data/activityDatabase';

const PHASE_COLORS = {
  Insight: '#6366f1',
  Vision: '#f59e0b',
  Execute: '#10b981',
};

export default function ActivityLibrary({ open, onClose, onAddActivities, existingTasks }) {
  const [search, setSearch] = useState('');
  const [phaseFilter, setPhaseFilter] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('');
  const [defaultOnly, setDefaultOnly] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [expandedId, setExpandedId] = useState(null);
  const [activities, setActivities] = useState(activityDatabase);
  const [loadingActivities, setLoadingActivities] = useState(false);

  // Fetch from Supabase when opened
  useEffect(() => {
    if (!open) return;
    setLoadingActivities(true);
    fetchActivities()
      .then((data) => setActivities(data))
      .finally(() => setLoadingActivities(false));
  }, [open]);

  const phases = useMemo(() => getPhases(activities), [activities]);
  const owners = useMemo(() => getOwners(activities), [activities]);

  const filtered = useMemo(() => {
    return activities.filter((a) => {
      if (phaseFilter && a.phase !== phaseFilter) return false;
      if (ownerFilter && a.owner !== ownerFilter) return false;
      if (defaultOnly && !a.inByDefault) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          a.name.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.owner.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [activities, search, phaseFilter, ownerFilter, defaultOnly]);

  // Group by phase
  const grouped = useMemo(() => {
    const map = {};
    for (const a of filtered) {
      if (!map[a.phase]) map[a.phase] = [];
      map[a.phase].push(a);
    }
    return map;
  }, [filtered]);

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllDefaults = () => {
    const defaults = activities.filter((a) => a.inByDefault).map((a) => a.id);
    setSelected(new Set(defaults));
  };

  const handleAdd = () => {
    const selectedActivities = activities.filter((a) => selected.has(a.id));
    onAddActivities(selectedActivities);
    setSelected(new Set());
    onClose();
  };

  // Check if activity is already in the project
  const isAlreadyAdded = (name) => {
    return existingTasks?.some((t) => t.name === name);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="flex max-h-[85vh] w-[720px] flex-col rounded-xl border border-border bg-bg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-text">Activity Library</h2>
            <p className="mt-0.5 text-xs text-text-muted">
              {loadingActivities ? 'Loading...' : `${activities.length} pre-built activities across ${phases.length} phases`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-muted hover:bg-bg-alt hover:text-text"
          >
            <X size={18} />
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search activities..."
              className="w-full rounded-lg border border-border bg-bg-alt py-1.5 pl-8 pr-3 text-sm text-text placeholder:text-text-muted/50 focus:border-accent focus:outline-none"
            />
          </div>
          <select
            value={phaseFilter}
            onChange={(e) => setPhaseFilter(e.target.value)}
            className="rounded-lg border border-border bg-bg-alt px-2.5 py-1.5 text-xs text-text focus:border-accent focus:outline-none"
          >
            <option value="">All Phases</option>
            {phases.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <select
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="rounded-lg border border-border bg-bg-alt px-2.5 py-1.5 text-xs text-text focus:border-accent focus:outline-none"
          >
            <option value="">All Owners</option>
            {owners.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
          <label className="flex items-center gap-1.5 text-xs text-text-muted">
            <input
              type="checkbox"
              checked={defaultOnly}
              onChange={(e) => setDefaultOnly(e.target.checked)}
              className="rounded accent-[var(--color-accent)]"
            />
            Defaults only
          </label>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2 px-5 py-2 text-xs">
          <button
            onClick={selectAllDefaults}
            className="rounded-md bg-accent/10 px-2.5 py-1 font-medium text-accent hover:bg-accent/20"
          >
            Select all defaults ({activities.filter((a) => a.inByDefault).length})
          </button>
          <button
            onClick={() => setSelected(new Set(filtered.map((a) => a.id)))}
            className="rounded-md bg-bg-alt px-2.5 py-1 font-medium text-text-muted hover:text-text"
          >
            Select all visible ({filtered.length})
          </button>
          {selected.size > 0 && (
            <button
              onClick={() => setSelected(new Set())}
              className="rounded-md px-2.5 py-1 font-medium text-text-muted hover:text-text"
            >
              Clear ({selected.size})
            </button>
          )}
          <span className="ml-auto text-text-muted">
            {filtered.length} activities shown
          </span>
        </div>

        {/* Activity list */}
        <div className="flex-1 overflow-y-auto px-5 pb-3">
          {Object.entries(grouped).map(([phase, activities]) => (
            <div key={phase} className="mb-4">
              <div className="mb-2 flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: PHASE_COLORS[phase] || '#94a3b8' }}
                />
                <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
                  {phase}
                </span>
                <span className="text-[10px] text-text-muted/60">
                  ({activities.length})
                </span>
              </div>

              <div className="space-y-1">
                {activities.map((activity) => {
                  const isSelected = selected.has(activity.id);
                  const isExpanded = expandedId === activity.id;
                  const alreadyAdded = isAlreadyAdded(activity.name);

                  return (
                    <div
                      key={activity.id}
                      className={`rounded-lg border transition ${
                        isSelected
                          ? 'border-accent/40 bg-accent/5'
                          : 'border-transparent hover:border-border hover:bg-bg-alt/50'
                      } ${alreadyAdded ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-start gap-2 px-3 py-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggle(activity.id)}
                          disabled={alreadyAdded}
                          className="mt-1 shrink-0 rounded accent-[var(--color-accent)]"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-text">
                              {activity.name}
                            </span>
                            {activity.inByDefault && (
                              <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
                                DEFAULT
                              </span>
                            )}
                            {alreadyAdded && (
                              <span className="rounded bg-green-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-green-500">
                                ADDED
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 flex items-center gap-3 text-[11px] text-text-muted">
                            <span className="flex items-center gap-1">
                              <Clock size={10} />
                              {activity.duration}
                            </span>
                            <span className="flex items-center gap-1">
                              <User size={10} />
                              {activity.owner}
                            </span>
                            {activity.contributors && (
                              <span className="opacity-60">+ {activity.contributors}</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : activity.id)}
                          className="shrink-0 rounded p-1 text-text-muted hover:bg-bg-alt hover:text-text"
                        >
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                      </div>

                      {/* Expanded detail */}
                      {isExpanded && (
                        <div className="border-t border-border/50 px-3 py-2.5 text-xs leading-relaxed text-text-muted">
                          <div className="whitespace-pre-line">{activity.description}</div>
                          {activity.scoping && (
                            <div className="mt-2 flex items-start gap-1.5 rounded-md bg-amber-500/10 px-2.5 py-2 text-amber-600">
                              <Info size={12} className="mt-0.5 shrink-0" />
                              <span>{activity.scoping}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-text-muted">
              No activities match your filters
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <span className="text-xs text-text-muted">
            {selected.size} activit{selected.size === 1 ? 'y' : 'ies'} selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-1.5 text-sm font-medium text-text-muted hover:bg-bg-alt"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={selected.size === 0}
              className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40"
            >
              <Plus size={14} />
              Add {selected.size > 0 ? `${selected.size} ` : ''}to Project
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
