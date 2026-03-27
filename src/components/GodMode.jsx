import { useState, useEffect, useMemo } from 'react';
import { supabase, isConfigured } from '../lib/supabase';
import { Lock, ArrowLeft, Users, FolderOpen, ListTodo, TrendingUp } from 'lucide-react';

const GODMODE_SECRET = import.meta.env.VITE_GODMODE_SECRET;

export default function GodMode() {
  const [authed, setAuthed] = useState(!GODMODE_SECRET);
  const [passphrase, setPassphrase] = useState('');
  const [error, setError] = useState('');

  if (!authed) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <div className="w-80 rounded-xl border border-gray-800 bg-gray-900 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lock size={18} className="text-amber-400" />
            <h1 className="text-sm font-bold text-white">God Mode</h1>
          </div>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (passphrase === GODMODE_SECRET) {
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
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none"
              autoFocus
            />
            {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
            <button
              type="submit"
              className="mt-3 w-full rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-black hover:bg-amber-400 transition"
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

function Dashboard() {
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

  // Unique users
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

  // Activity timeline: projects per week
  const weeklyActivity = useMemo(() => {
    const weeks = {};
    for (const p of projects) {
      const d = new Date(p.created_at);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toISOString().slice(0, 10);
      weeks[key] = (weeks[key] || 0) + 1;
    }
    return Object.entries(weeks)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12);
  }, [projects]);

  const maxWeekly = Math.max(1, ...weeklyActivity.map(([, c]) => c));

  // Sorted projects
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
    // Sum OOP expenses
    if (Array.isArray(b.oop_expenses)) {
      for (const o of b.oop_expenses) total += (o.amount || 0);
    }
    return total;
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }

  if (!isConfigured) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <div className="text-gray-400 text-sm">Supabase not configured</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200">
      {/* Header */}
      <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-amber-400">God Mode</h1>
          <span className="text-xs text-gray-500">Fantt Admin Dashboard</span>
        </div>
        <a
          href="#"
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition"
        >
          <ArrowLeft size={12} />
          Back to app
        </a>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-8">
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
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
            <h2 className="text-sm font-semibold text-gray-300 mb-4">Projects Created Per Week</h2>
            <div className="flex items-end gap-2" style={{ height: 120 }}>
              {weeklyActivity.map(([week, count]) => (
                <div key={week} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t bg-amber-500/80 transition-all"
                    style={{ height: `${(count / maxWeekly) * 100}px` }}
                    title={`${week}: ${count} projects`}
                  />
                  <span className="text-[9px] text-gray-500">{week.slice(5)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects table */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-800">
            <h2 className="text-sm font-semibold text-gray-300">Projects</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-800 text-gray-500">
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
                  <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="px-3 py-2 font-medium text-white">{p.name || 'Untitled'}</td>
                    <td className="px-3 py-2 text-gray-400">{p.user_email || p.email || '—'}</td>
                    <td className="px-3 py-2 text-gray-400">{(tasksByProject[p.id] || []).length}</td>
                    <td className="px-3 py-2 text-gray-400">
                      {getBudgetTotal(p.id) > 0 ? `$${getBudgetTotal(p.id).toLocaleString()}` : '—'}
                    </td>
                    <td className="px-3 py-2 text-gray-500">{fmtDate(p.created_at)}</td>
                    <td className="px-3 py-2 text-gray-500">{fmtDate(p.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Users table */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-800">
            <h2 className="text-sm font-semibold text-gray-300">Users</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-800 text-gray-500">
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
                    <tr key={u.email} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="px-3 py-2 font-medium text-white">{u.email}</td>
                      <td className="px-3 py-2 text-gray-400">{u.projects.length}</td>
                      <td className="px-3 py-2 text-gray-400">{u.taskCount}</td>
                      <td className="px-3 py-2 text-gray-500">{fmtDate(u.lastActive)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ icon, label, value }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <div className="flex items-center gap-2 text-gray-500 mb-2">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  );
}

function Th({ label, sortKey, currentKey, dir, onClick }) {
  const active = sortKey === currentKey;
  return (
    <th
      className="px-3 py-2 text-left font-medium cursor-pointer hover:text-gray-300 select-none"
      onClick={() => onClick(sortKey)}
    >
      {label} {active ? (dir === 'asc' ? '↑' : '↓') : ''}
    </th>
  );
}

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
