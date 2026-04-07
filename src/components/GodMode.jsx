import { useState, useEffect, useMemo } from 'react';
import { supabase, isConfigured } from '../lib/supabase';
import { fetchActivities } from '../data/activityDatabase';
import { Lock, ArrowLeft, Users, FolderOpen, ListTodo, TrendingUp, Search, Plus, Pencil, Trash2, X, Bug, Save, Loader2 } from 'lucide-react';

const GODMODE_SECRET = import.meta.env.VITE_GODMODE_SECRET;
const AUTH_KEY = 'fantt-godmode-auth';

export default function GodMode() {
  const [authed, setAuthed] = useState(() => {
    if (!GODMODE_SECRET) return true;
    return localStorage.getItem(AUTH_KEY) === btoa(GODMODE_SECRET);
  });
  const [passphrase, setPassphrase] = useState('');
  const [error, setError] = useState('');

  if (!authed) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg">
        <div className="w-80 rounded-xl border border-border bg-sidebar p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lock size={18} className="text-accent" />
            <h1 className="text-sm font-bold text-text">God Mode</h1>
          </div>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (passphrase === GODMODE_SECRET) {
              localStorage.setItem(AUTH_KEY, btoa(GODMODE_SECRET));
              setAuthed(true);
              setError('');
            } else {
              setError('Wrong passphrase');
            }
          }}>
            <input
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="Passphrase"
              className="w-full rounded-lg border border-border bg-bg-alt px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
              autoFocus
            />
            {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
            <button
              type="submit"
              className="mt-3 w-full rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-text hover:bg-accent/80 transition"
            >
              Enter
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <Dashboard />;
}

// ─── Tabs ────────────────────────────────────────────────────────────────────
const TABS = ['Overview', 'Activities', 'Bug Reports'];

function Dashboard() {
  const [activeTab, setActiveTab] = useState('Overview');

  return (
    <div className="min-h-screen bg-bg text-text">
      {/* Header */}
      <div className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-accent">God Mode</h1>
          <span className="text-xs text-text-muted">Fantt Admin Dashboard</span>
        </div>
        <a
          href="#"
          className="flex items-center gap-1 text-xs text-text-muted hover:text-text transition"
        >
          <ArrowLeft size={12} />
          Back to app
        </a>
      </div>

      {/* Tab bar */}
      <div className="border-b border-border px-6">
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-xs font-medium transition border-b-2 -mb-px ${
                activeTab === tab
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-muted hover:text-text'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {activeTab === 'Overview' && <OverviewTab />}
        {activeTab === 'Activities' && <ActivitiesTab />}
        {activeTab === 'Bug Reports' && <BugReportsTab />}
      </div>
    </div>
  );
}

// ─── Overview Tab (original dashboard) ───────────────────────────────────────
function OverviewTab() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState('updated_at');
  const [sortDir, setSortDir] = useState('desc');

  useEffect(() => {
    if (!isConfigured) { setLoading(false); return; }
    Promise.all([
      supabase.from('projects').select('*').order('created_at', { ascending: false }),
      supabase.from('tasks').select('*'),
      supabase.from('project_budgets').select('*'),
    ]).then(([pRes, tRes, bRes]) => {
      if (pRes.data) setProjects(pRes.data);
      if (tRes.data) setTasks(tRes.data);
      if (bRes.data) setBudgets(bRes.data);
      setLoading(false);
    });
  }, []);

  const tasksByProject = useMemo(() => {
    const map = {};
    for (const t of tasks) {
      if (!map[t.project_id]) map[t.project_id] = [];
      map[t.project_id].push(t);
    }
    return map;
  }, [tasks]);

  const budgetByProject = useMemo(() => {
    const map = {};
    for (const b of budgets) map[b.project_id] = b;
    return map;
  }, [budgets]);

  const users = useMemo(() => {
    const map = {};
    for (const p of projects) {
      const email = p.user_email || p.email || 'unknown';
      if (!map[email]) map[email] = { email, projects: [], taskCount: 0, lastActive: p.updated_at || p.created_at };
      map[email].projects.push(p);
      map[email].taskCount += (tasksByProject[p.id] || []).length;
      const ts = p.updated_at || p.created_at;
      if (ts > map[email].lastActive) map[email].lastActive = ts;
    }
    return Object.values(map);
  }, [projects, tasksByProject]);

  const weeklyActivity = useMemo(() => {
    const weeks = {};
    for (const p of projects) {
      const d = new Date(p.created_at);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toISOString().slice(0, 10);
      weeks[key] = (weeks[key] || 0) + 1;
    }
    return Object.entries(weeks).sort(([a], [b]) => a.localeCompare(b)).slice(-12);
  }, [projects]);

  const maxWeekly = Math.max(1, ...weeklyActivity.map(([, c]) => c));

  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      let aVal, bVal;
      if (sortKey === 'tasks') {
        aVal = (tasksByProject[a.id] || []).length;
        bVal = (tasksByProject[b.id] || []).length;
      } else if (sortKey === 'name') {
        aVal = (a.name || '').toLowerCase();
        bVal = (b.name || '').toLowerCase();
      } else {
        aVal = a[sortKey] || '';
        bVal = b[sortKey] || '';
      }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [projects, sortKey, sortDir, tasksByProject]);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const getBudgetTotal = (projectId) => {
    const b = budgetByProject[projectId];
    if (!b) return 0;
    let total = 0;
    if (Array.isArray(b.oop_expenses)) {
      for (const o of b.oop_expenses) total += (o.amount || 0);
    }
    return total;
  };

  if (loading) return <div className="text-text-muted text-sm py-12 text-center">Loading...</div>;
  if (!isConfigured) return <div className="text-text-muted text-sm py-12 text-center">Supabase not configured</div>;

  return (
    <div className="space-y-8">
      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card icon={<FolderOpen size={16} />} label="Total Projects" value={projects.length} />
        <Card icon={<Users size={16} />} label="Unique Users" value={users.length} />
        <Card icon={<ListTodo size={16} />} label="Total Tasks" value={tasks.length} />
        <Card
          icon={<TrendingUp size={16} />}
          label="Avg Tasks/Project"
          value={projects.length ? (tasks.length / projects.length).toFixed(1) : '0'}
        />
      </div>

      {/* Activity timeline */}
      {weeklyActivity.length > 0 && (
        <div className="rounded-xl border border-border bg-sidebar p-5">
          <h2 className="text-sm font-semibold text-text mb-4">Projects Created Per Week</h2>
          <div className="flex items-end gap-2" style={{ height: 120 }}>
            {weeklyActivity.map(([week, count]) => (
              <div key={week} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-accent/80 transition-all"
                  style={{ height: `${(count / maxWeekly) * 100}px` }}
                  title={`${week}: ${count} projects`}
                />
                <span className="text-[9px] text-text-muted">{week.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects table */}
      <div className="rounded-xl border border-border bg-sidebar overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-text">Projects</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-text-muted">
                <Th label="Name" sortKey="name" currentKey={sortKey} dir={sortDir} onClick={handleSort} />
                <Th label="Owner" sortKey="user_email" currentKey={sortKey} dir={sortDir} onClick={handleSort} />
                <Th label="Tasks" sortKey="tasks" currentKey={sortKey} dir={sortDir} onClick={handleSort} />
                <th className="px-3 py-2 text-left font-medium">OOP Spend</th>
                <Th label="Created" sortKey="created_at" currentKey={sortKey} dir={sortDir} onClick={handleSort} />
                <Th label="Updated" sortKey="updated_at" currentKey={sortKey} dir={sortDir} onClick={handleSort} />
              </tr>
            </thead>
            <tbody>
              {sortedProjects.map((p) => (
                <tr key={p.id} className="border-b border-border/50 hover:bg-bg-alt/30">
                  <td className="px-3 py-2 font-medium text-text">{p.name || 'Untitled'}</td>
                  <td className="px-3 py-2 text-text-muted">{p.user_email || p.email || '—'}</td>
                  <td className="px-3 py-2 text-text-muted">{(tasksByProject[p.id] || []).length}</td>
                  <td className="px-3 py-2 text-text-muted">
                    {getBudgetTotal(p.id) > 0 ? `$${getBudgetTotal(p.id).toLocaleString()}` : '—'}
                  </td>
                  <td className="px-3 py-2 text-text-muted">{fmtDate(p.created_at)}</td>
                  <td className="px-3 py-2 text-text-muted">{fmtDate(p.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Users table */}
      <div className="rounded-xl border border-border bg-sidebar overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-text">Users</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-text-muted">
                <th className="px-3 py-2 text-left font-medium">Email</th>
                <th className="px-3 py-2 text-left font-medium">Projects</th>
                <th className="px-3 py-2 text-left font-medium">Total Tasks</th>
                <th className="px-3 py-2 text-left font-medium">Last Active</th>
              </tr>
            </thead>
            <tbody>
              {users
                .sort((a, b) => (b.lastActive || '').localeCompare(a.lastActive || ''))
                .map((u) => (
                  <tr key={u.email} className="border-b border-border/50 hover:bg-bg-alt/30">
                    <td className="px-3 py-2 font-medium text-text">{u.email}</td>
                    <td className="px-3 py-2 text-text-muted">{u.projects.length}</td>
                    <td className="px-3 py-2 text-text-muted">{u.taskCount}</td>
                    <td className="px-3 py-2 text-text-muted">{fmtDate(u.lastActive)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Activities Tab ──────────────────────────────────────────────────────────
const PHASES = ['Insight', 'Vision', 'Execute'];
const EMPTY_ACTIVITY = {
  id: '',
  in_by_default: false,
  name: '',
  phase: 'Insight',
  duration: '',
  duration_days_min: 0,
  duration_days_max: 0,
  owner: '',
  contributors: '',
  scoping: '',
  description: '',
};

function ActivitiesTab() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [phaseFilter, setPhaseFilter] = useState('');
  const [editing, setEditing] = useState(null); // activity object or null
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await fetchActivities();
    setActivities(data);
    setLoading(false);
  };

  useEffect(() => {
    if (isConfigured) load();
    else setLoading(false);
  }, []);

  const filtered = useMemo(() => {
    return activities.filter((a) => {
      if (phaseFilter && a.phase !== phaseFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return a.name.toLowerCase().includes(q) || a.phase.toLowerCase().includes(q) || (a.owner || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [activities, search, phaseFilter]);

  const handleAdd = () => {
    setEditing({ ...EMPTY_ACTIVITY, id: crypto.randomUUID() });
    setIsNew(true);
  };

  const handleEdit = (activity) => {
    // Normalize camelCase (local DB) or snake_case (Supabase) to snake_case for the form
    setEditing({
      id: activity.id,
      in_by_default: activity.in_by_default ?? activity.inByDefault ?? false,
      name: activity.name || '',
      phase: activity.phase || 'Insight',
      duration: activity.duration || '',
      duration_days_min: activity.duration_days_min ?? activity.durationDays?.[0] ?? 0,
      duration_days_max: activity.duration_days_max ?? activity.durationDays?.[1] ?? 0,
      owner: activity.owner || '',
      contributors: activity.contributors || '',
      scoping: activity.scoping || '',
      description: activity.description || '',
    });
    setIsNew(false);
  };

  const handleSave = async () => {
    if (!editing || !editing.name.trim()) return;
    setSaving(true);
    const payload = {
      id: editing.id,
      in_by_default: editing.in_by_default,
      name: editing.name.trim(),
      phase: editing.phase,
      duration: editing.duration || '',
      duration_days: editing.duration_days_min || 0,
      duration_days_min: editing.duration_days_min || 0,
      duration_days_max: editing.duration_days_max || 0,
      owner: editing.owner || '',
      contributors: editing.contributors || '',
      scoping: editing.scoping || '',
      description: editing.description || '',
      updated_at: new Date().toISOString(),
    };

    if (isNew) {
      await supabase.from('activities').insert(payload);
    } else {
      await supabase.from('activities').update(payload).eq('id', editing.id);
    }
    setSaving(false);
    setEditing(null);
    setIsNew(false);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this activity? This cannot be undone.')) return;
    await supabase.from('activities').delete().eq('id', id);
    if (editing?.id === id) setEditing(null);
    load();
  };

  const handleCancel = () => {
    setEditing(null);
    setIsNew(false);
  };

  if (loading) return <div className="text-text-muted text-sm py-12 text-center">Loading activities...</div>;

  // Edit form modal
  if (editing) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-xl border border-border bg-sidebar p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold text-text">{isNew ? 'Add Activity' : 'Edit Activity'}</h2>
            <button onClick={handleCancel} className="rounded-lg p-1.5 text-text-muted hover:text-text">
              <X size={16} />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-text-muted">Name *</label>
                <input
                  type="text"
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="w-full rounded-lg border border-border bg-bg-alt px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-muted">Phase *</label>
                <select
                  value={editing.phase}
                  onChange={(e) => setEditing({ ...editing, phase: e.target.value })}
                  className="w-full rounded-lg border border-border bg-bg-alt px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
                >
                  {PHASES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-text-muted">Duration (text)</label>
                <input
                  type="text"
                  value={editing.duration}
                  onChange={(e) => setEditing({ ...editing, duration: e.target.value })}
                  placeholder="e.g. 1-2 weeks"
                  className="w-full rounded-lg border border-border bg-bg-alt px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-muted">Min Days</label>
                <input
                  type="number"
                  value={editing.duration_days_min}
                  onChange={(e) => setEditing({ ...editing, duration_days_min: Number(e.target.value) || 0 })}
                  className="w-full rounded-lg border border-border bg-bg-alt px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-muted">Max Days</label>
                <input
                  type="number"
                  value={editing.duration_days_max}
                  onChange={(e) => setEditing({ ...editing, duration_days_max: Number(e.target.value) || 0 })}
                  className="w-full rounded-lg border border-border bg-bg-alt px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-text-muted">Owner</label>
                <input
                  type="text"
                  value={editing.owner}
                  onChange={(e) => setEditing({ ...editing, owner: e.target.value })}
                  className="w-full rounded-lg border border-border bg-bg-alt px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-muted">Contributors</label>
                <input
                  type="text"
                  value={editing.contributors}
                  onChange={(e) => setEditing({ ...editing, contributors: e.target.value })}
                  className="w-full rounded-lg border border-border bg-bg-alt px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-text-muted">Scoping Notes</label>
              <textarea
                value={editing.scoping}
                onChange={(e) => setEditing({ ...editing, scoping: e.target.value })}
                rows={2}
                className="w-full rounded-lg border border-border bg-bg-alt px-3 py-2 text-sm text-text focus:border-accent focus:outline-none resize-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-text-muted">Description</label>
              <textarea
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                rows={4}
                className="w-full rounded-lg border border-border bg-bg-alt px-3 py-2 text-sm text-text focus:border-accent focus:outline-none resize-none"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-text">
              <input
                type="checkbox"
                checked={editing.in_by_default}
                onChange={(e) => setEditing({ ...editing, in_by_default: e.target.checked })}
                className="rounded [accent-color:var(--color-accent)]"
              />
              Include by default in new projects
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={handleCancel}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-muted hover:bg-bg-alt"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!editing.name.trim() || saving}
                className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-text hover:bg-accent/80 disabled:opacity-40"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {isNew ? 'Create Activity' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search activities..."
              className="rounded-lg border border-border bg-bg-alt py-1.5 pl-8 pr-3 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none w-64"
            />
          </div>
          <select
            value={phaseFilter}
            onChange={(e) => setPhaseFilter(e.target.value)}
            className="rounded-lg border border-border bg-bg-alt px-3 py-1.5 text-xs text-text focus:border-accent focus:outline-none"
          >
            <option value="">All Phases</option>
            {PHASES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <span className="text-xs text-text-muted">{filtered.length} activities</span>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-text hover:bg-accent/80"
        >
          <Plus size={14} />
          Add Activity
        </button>
      </div>

      <div className="rounded-xl border border-border bg-sidebar overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-text-muted">
                <th className="px-3 py-2 text-left font-medium">Name</th>
                <th className="px-3 py-2 text-left font-medium">Phase</th>
                <th className="px-3 py-2 text-left font-medium">Owner</th>
                <th className="px-3 py-2 text-left font-medium">Duration</th>
                <th className="px-3 py-2 text-left font-medium">Default</th>
                <th className="px-3 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr
                  key={a.id}
                  className="border-b border-border/50 hover:bg-bg-alt/30 cursor-pointer"
                  onClick={() => handleEdit(a)}
                >
                  <td className="px-3 py-2 font-medium text-text">{a.name}</td>
                  <td className="px-3 py-2">
                    <PhaseBadge phase={a.phase} />
                  </td>
                  <td className="px-3 py-2 text-text-muted">{a.owner || '—'}</td>
                  <td className="px-3 py-2 text-text-muted">{a.duration || '—'}</td>
                  <td className="px-3 py-2">
                    {(a.in_by_default || a.inByDefault) && <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold text-accent">DEFAULT</span>}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEdit(a); }}
                        className="rounded p-1 text-text-muted hover:text-accent hover:bg-bg-alt"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(a.id); }}
                        className="rounded p-1 text-text-muted hover:text-red-400 hover:bg-bg-alt"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Bug Reports Tab ─────────────────────────────────────────────────────────
const STATUS_OPTIONS = ['open', 'in_progress', 'resolved', 'wont_fix'];
const STATUS_COLORS = {
  open: 'bg-red-500/15 text-red-400',
  in_progress: 'bg-accent/15 text-accent',
  resolved: 'bg-green-500/15 text-green-400',
  wont_fix: 'bg-gray-500/15 text-text-muted',
};
const STATUS_LABELS = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  wont_fix: "Won't Fix",
};

function BugReportsTab() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('bug_reports').select('*').order('created_at', { ascending: false });
    if (data) setReports(data);
    setLoading(false);
  };

  useEffect(() => {
    if (isConfigured) load();
    else setLoading(false);
  }, []);

  const filtered = useMemo(() => {
    if (!statusFilter) return reports;
    return reports.filter((r) => r.status === statusFilter);
  }, [reports, statusFilter]);

  const handleStatusChange = async (id, status) => {
    setSaving(true);
    await supabase.from('bug_reports').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    setReports((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
    setSaving(false);
  };

  const handleNotesChange = async (id, admin_notes) => {
    setReports((prev) => prev.map((r) => r.id === id ? { ...r, admin_notes } : r));
  };

  const handleSaveNotes = async (id) => {
    const report = reports.find((r) => r.id === id);
    if (!report) return;
    setSaving(true);
    await supabase.from('bug_reports').update({ admin_notes: report.admin_notes, updated_at: new Date().toISOString() }).eq('id', id);
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this bug report?')) return;
    await supabase.from('bug_reports').delete().eq('id', id);
    setReports((prev) => prev.filter((r) => r.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  if (loading) return <div className="text-text-muted text-sm py-12 text-center">Loading bug reports...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-border bg-bg-alt px-3 py-1.5 text-xs text-text focus:border-accent focus:outline-none"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        <span className="text-xs text-text-muted">{filtered.length} report{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-sidebar py-12 text-center text-sm text-text-muted">
          {reports.length === 0 ? 'No bug reports yet' : 'No reports match this filter'}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((report) => {
            const isExpanded = expandedId === report.id;
            return (
              <div key={report.id} className="rounded-xl border border-border bg-sidebar overflow-hidden">
                {/* Row header */}
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-bg-alt/30"
                  onClick={() => setExpandedId(isExpanded ? null : report.id)}
                >
                  <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[report.status]}`}>
                    {STATUS_LABELS[report.status]}
                  </span>
                  <span className="text-xs font-medium text-text">{report.reporter_name}</span>
                  <span className="text-xs text-text-muted truncate flex-1">
                    {report.replication_steps.split('\n')[0].slice(0, 80)}
                  </span>
                  <span className="shrink-0 text-[10px] text-text-muted/60">{fmtDate(report.created_at)}</span>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-border px-4 py-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-text-muted">Steps to Replicate</label>
                        <p className="whitespace-pre-line text-xs text-text">{report.replication_steps}</p>
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-text-muted">Actual Result</label>
                        <p className="whitespace-pre-line text-xs text-text">{report.actual_result}</p>
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-text-muted">Expected Result</label>
                      <p className="whitespace-pre-line text-xs text-text">{report.expected_result}</p>
                    </div>

                    <div className="flex items-start gap-4 pt-2 border-t border-border">
                      <div>
                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-text-muted">Status</label>
                        <select
                          value={report.status}
                          onChange={(e) => handleStatusChange(report.id, e.target.value)}
                          className="rounded-lg border border-border bg-bg-alt px-2.5 py-1.5 text-xs text-text focus:border-accent focus:outline-none"
                        >
                          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-text-muted">Admin Notes</label>
                        <textarea
                          value={report.admin_notes || ''}
                          onChange={(e) => handleNotesChange(report.id, e.target.value)}
                          onBlur={() => handleSaveNotes(report.id)}
                          rows={2}
                          placeholder="Internal notes..."
                          className="w-full rounded-lg border border-border bg-bg-alt px-3 py-2 text-xs text-text placeholder:text-text-muted/60 focus:border-accent focus:outline-none resize-none"
                        />
                      </div>
                      <div className="shrink-0 pt-4">
                        <button
                          onClick={() => handleDelete(report.id)}
                          className="flex items-center gap-1 rounded-lg border border-red-500/30 px-2.5 py-1.5 text-xs text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 size={12} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Shared components ───────────────────────────────────────────────────────
function Card({ icon, label, value }) {
  return (
    <div className="rounded-xl border border-border bg-sidebar p-4">
      <div className="flex items-center gap-2 text-text-muted mb-2">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold text-text">{value}</div>
    </div>
  );
}

function Th({ label, sortKey, currentKey, dir, onClick }) {
  const active = sortKey === currentKey;
  return (
    <th
      className="px-3 py-2 text-left font-medium cursor-pointer hover:text-text select-none"
      onClick={() => onClick(sortKey)}
    >
      {label} {active ? (dir === 'asc' ? '↑' : '↓') : ''}
    </th>
  );
}

function PhaseBadge({ phase }) {
  const colors = {
    Insight: 'bg-indigo-500/15 text-indigo-400',
    Vision: 'bg-accent/15 text-accent',
    Execute: 'bg-emerald-500/15 text-emerald-400',
  };
  return (
    <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${colors[phase] || 'bg-gray-500/15 text-text-muted'}`}>
      {phase}
    </span>
  );
}

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
