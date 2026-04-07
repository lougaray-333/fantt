import { useState, useMemo, useCallback, useRef, useEffect, lazy, Suspense } from 'react';
import { Library, Trash2, BarChart3, Plus, X, Sun, Moon, ArrowLeft, Check, Zap, Undo2, Redo2, CalendarOff, Grid3x3, Share2, History } from 'lucide-react';
import FanttLogo from './FanttLogo';
import { useTaskStore } from '../hooks/useTaskStore';
import { useTheme } from '../hooks/useTheme';
import { formatDate, addDays, isWeekend, businessDaysBetween, businessToCalendarDays } from '../utils/dates';
import GanttChart from './GanttChart';
import TaskForm from './TaskForm';
import InlineTaskTable from './InlineTaskTable';
import ViewModeToggle from './ViewModeToggle';

const ActivityLibrary = lazy(() => import('./ActivityLibrary'));
const BugReportButton = lazy(() => import('./BugReportButton'));
import ResourceGrid from './ResourceGrid';
import SharePanel from './SharePanel';
import { useHistory } from '../hooks/useHistory';
import { usePresence } from '../hooks/usePresence';
import { supabase, isConfigured } from '../lib/supabase';

const ChangeHistory = lazy(() => import('./ChangeHistory'));

// Shift resource hours by business days derived from the calendar delta.
// Tasks shift by calendarDelta calendar days. We figure out how many business
// days that represents, then shift each hour entry by that many business days.
// This guarantees weekdays map 1:1 to weekdays — no collisions, no weekends.
function shiftAllHours(resourceHours, calendarDelta, refDate) {
  if (calendarDelta === 0) return resourceHours;

  // How many business days does this calendar shift represent?
  // Use refDate (the dragged task's original start) as reference.
  const dest = addDays(refDate, calendarDelta);
  const bizDelta = calendarDelta >= 0
    ? businessDaysBetween(refDate, dest)
    : -businessDaysBetween(dest, refDate);

  if (bizDelta === 0) return resourceHours;

  const shifted = {};
  for (const [role, dates] of Object.entries(resourceHours)) {
    const newDates = {};
    for (const [dateStr, hours] of Object.entries(dates)) {
      if (hours <= 0) continue;
      // Shift this entry by bizDelta business days
      const newCalDays = businessToCalendarDays(dateStr, bizDelta);
      const newDateStr = formatDate(addDays(dateStr, newCalDays));
      newDates[newDateStr] = hours;
    }
    shifted[role] = newDates;
  }
  return shifted;
}

export default function GanttEditor({ projectId, projectName, email, onBack, isCollaborator = false }) {
  const history = useHistory();
  const store = useTaskStore(projectId, {
    identity: email || 'Collaborator',
    onRemoteChange: () => history.clear(),
  });
  const { theme, toggleTheme } = useTheme();
  const { others } = usePresence(projectId, email || 'Collaborator');
  const [viewMode, setViewMode] = useState('day');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [editingId, setEditingId] = useState(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [sharePanelOpen, setSharePanelOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formClosing, setFormClosing] = useState(false);
  const [animatingTask, setAnimatingTask] = useState(null);
  // Budget data — auto-saved to localStorage keyed by projectId
  const budgetKey = `gantt-v2-budget-${projectId || 'local'}`;
  const [resourceHours, setResourceHours] = useState(() => {
    try { return JSON.parse(localStorage.getItem(budgetKey + '-hours')) || {}; } catch { return {}; }
  });
  const [oopExpenses, setOopExpenses] = useState(() => {
    try { return JSON.parse(localStorage.getItem(budgetKey + '-oop')) || []; } catch { return []; }
  });
  const [hiddenRoles, setHiddenRoles] = useState(() => {
    try { return JSON.parse(localStorage.getItem(budgetKey + '-hidden')) || []; } catch { return []; }
  });
  const [roleNames, setRoleNames] = useState(() => {
    try { return JSON.parse(localStorage.getItem(budgetKey + '-names')) || {}; } catch { return {}; }
  });
  const [budgetCollapsed, setBudgetCollapsed] = useState(true);
  const [splitPct, setSplitPct] = useState(50);
  const splitContainerRef = useRef(null);
  // Sync resource grid scroll to gantt when budget expands
  const prevCollapsedRef = useRef(budgetCollapsed);
  useEffect(() => {
    const wasCollapsed = prevCollapsedRef.current;
    prevCollapsedRef.current = budgetCollapsed;
    if (wasCollapsed && !budgetCollapsed) {
      // Just expanded — sync scroll on next frame after DOM mounts
      requestAnimationFrame(() => {
        const gantt = ganttScrollRef.current;
        const resource = resourceScrollRef.current;
        if (gantt && resource) resource.scrollLeft = gantt.scrollLeft;
      });
    }
  }, [budgetCollapsed]);
  const [highlightedDate, setHighlightedDate] = useState(null);
  const [hideWeekends, setHideWeekends] = useState(() => {
    try { return JSON.parse(localStorage.getItem('gantt-v2-hide-weekends')) || false; } catch { return false; }
  });
  const [showGrid, setShowGrid] = useState(() => {
    try { const v = localStorage.getItem('gantt-v2-show-grid'); return v === null ? true : JSON.parse(v); } catch { return true; }
  });
  // Persist preferences to localStorage
  useEffect(() => {
    localStorage.setItem('gantt-v2-hide-weekends', JSON.stringify(hideWeekends));
  }, [hideWeekends]);
  useEffect(() => {
    localStorage.setItem('gantt-v2-show-grid', JSON.stringify(showGrid));
  }, [showGrid]);

  // Undo/Redo
  const stateRef = useRef({ tasks: [], resourceHours: {}, oopExpenses: [], hiddenRoles: [], roleNames: {} });
  useEffect(() => {
    stateRef.current = { tasks: store.tasks, resourceHours, oopExpenses, hiddenRoles, roleNames };
  }, [store.tasks, resourceHours, oopExpenses, hiddenRoles, roleNames]);

  const getCurrentSnapshot = () => ({ ...stateRef.current });

  const restoreSnapshot = useCallback((snapshot) => {
    store.setTasksDirect(snapshot.tasks);
    setResourceHours(snapshot.resourceHours);
    setOopExpenses(snapshot.oopExpenses);
    setHiddenRoles(snapshot.hiddenRoles);
    setRoleNames(snapshot.roleNames);
  }, [store]);

  const snap = () => history.pushSnapshot(getCurrentSnapshot());

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          const snapshot = history.redo(getCurrentSnapshot());
          if (snapshot) restoreSnapshot(snapshot);
        } else {
          const snapshot = history.undo(getCurrentSnapshot());
          if (snapshot) restoreSnapshot(snapshot);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [history, restoreSnapshot]);

  // Load budget data from Supabase on mount (falls back to localStorage init above)
  const budgetLoadedRef = useRef(false);
  useEffect(() => {
    if (!isConfigured || !projectId || budgetLoadedRef.current) return;
    budgetLoadedRef.current = true;
    supabase
      .from('project_budgets')
      .select('resource_hours, oop_expenses, hidden_roles, role_names')
      .eq('project_id', projectId)
      .single()
      .then(({ data }) => {
        if (data) {
          if (data.resource_hours) setResourceHours(data.resource_hours);
          if (data.oop_expenses) setOopExpenses(data.oop_expenses);
          if (data.hidden_roles) setHiddenRoles(data.hidden_roles);
          if (data.role_names) setRoleNames(data.role_names);
        }
      });
  }, [projectId]);

  // Auto-save budget data to localStorage + Supabase (debounced)
  const saveBudgetRef = useRef(null);
  const lastLocalBudgetSaveRef = useRef(0);
  useEffect(() => {
    clearTimeout(saveBudgetRef.current);
    saveBudgetRef.current = setTimeout(() => {
      localStorage.setItem(budgetKey + '-hours', JSON.stringify(resourceHours));
      localStorage.setItem(budgetKey + '-oop', JSON.stringify(oopExpenses));
      localStorage.setItem(budgetKey + '-hidden', JSON.stringify(hiddenRoles));
      localStorage.setItem(budgetKey + '-names', JSON.stringify(roleNames));
      // Sync to Supabase
      if (isConfigured && projectId) {
        lastLocalBudgetSaveRef.current = Date.now();
        supabase.from('project_budgets').upsert({
          project_id: projectId,
          resource_hours: resourceHours,
          oop_expenses: oopExpenses,
          hidden_roles: hiddenRoles,
          role_names: roleNames,
          updated_at: new Date().toISOString(),
        }).then(() => {});
      }
    }, 500);
  }, [resourceHours, oopExpenses, hiddenRoles, roleNames, budgetKey, projectId]);

  // Realtime subscription for budget changes from other collaborators
  useEffect(() => {
    if (!isConfigured || !projectId) return;
    const ch = supabase
      .channel(`budget:${projectId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'project_budgets',
        filter: `project_id=eq.${projectId}`,
      }, ({ new: row }) => {
        // Guard: if we just saved locally in the past 3 seconds, ignore (our own echo)
        if (Date.now() - lastLocalBudgetSaveRef.current < 3000) return;
        if (row.resource_hours) setResourceHours(row.resource_hours);
        if (row.oop_expenses) setOopExpenses(row.oop_expenses);
        if (row.hidden_roles) setHiddenRoles(row.hidden_roles);
        if (row.role_names) setRoleNames(row.role_names);
      })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [projectId]);

  // Auto-save every 30 seconds with toast notification
  const [autoSaveToast, setAutoSaveToast] = useState(null); // 'in' | 'out' | null
  useEffect(() => {
    if (!isConfigured || !projectId) return;
    const interval = setInterval(() => {
      // Budget is already synced via the debounced effect above, but force a fresh upsert
      supabase.from('project_budgets').upsert({
        project_id: projectId,
        resource_hours: stateRef.current.resourceHours,
        oop_expenses: stateRef.current.oopExpenses,
        hidden_roles: stateRef.current.hiddenRoles,
        role_names: stateRef.current.roleNames,
        updated_at: new Date().toISOString(),
      }).then(() => {
        setAutoSaveToast('in');
        setTimeout(() => setAutoSaveToast('out'), 2000);
        setTimeout(() => setAutoSaveToast(null), 2400);
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [projectId]);

  // Track drag delta and reference date for shifting resource hours
  const dragDeltaRef = useRef(0);
  const dragRefDateRef = useRef(null);

  // Scroll sync refs — gantt drives, resource follows
  const ganttScrollRef = useRef(null);
  const resourceScrollRef = useRef(null);

  const handleGanttScroll = useCallback((scrollLeft) => {
    const el = resourceScrollRef.current;
    if (el) el.scrollLeft = scrollLeft;
  }, []);

  const handleResizerDown = useCallback((e) => {
    e.preventDefault();
    const container = splitContainerRef.current;
    if (!container) return;
    const onMove = (ev) => {
      const rect = container.getBoundingClientRect();
      const pct = Math.min(80, Math.max(20, ((ev.clientY - rect.top) / rect.height) * 100));
      setSplitPct(pct);
    };
    const onUp = () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
    };
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  }, []);

  const handleHideRole = useCallback((role) => {
    snap();
    setHiddenRoles((prev) => [...prev, role]);
  }, []);

  const handleShowRole = useCallback((role) => {
    snap();
    setHiddenRoles((prev) => prev.filter((r) => r !== role));
  }, []);

  const handleRoleNameChange = useCallback((role, name) => {
    snap();
    setRoleNames((prev) => ({ ...prev, [role]: name }));
  }, []);

  const handleResourceHoursChange = useCallback((role, dateStr, hours) => {
    snap();
    setResourceHours((prev) => ({
      ...prev,
      [role]: { ...(prev[role] || {}), [dateStr]: hours },
    }));
  }, []);

  // Quick-fill: set hours for every weekday across the project's actual task date range
  const handleQuickFill = useCallback((role, hoursPerDay) => {
    if (store.tasks.length === 0) return;
    snap();
    if (hoursPerDay === 0) {
      setResourceHours((prev) => ({ ...prev, [role]: {} }));
      return;
    }
    let min = new Date(store.tasks[0].start + 'T00:00:00');
    let max = new Date(store.tasks[0].end + 'T00:00:00');
    for (const t of store.tasks) {
      const s = new Date(t.start + 'T00:00:00');
      const e = new Date(t.end + 'T00:00:00');
      if (s < min) min = s;
      if (e > max) max = e;
    }
    const newRoleData = {};
    let cursor = new Date(min);
    while (cursor <= max) {
      const dateStr = formatDate(cursor);
      newRoleData[dateStr] = isWeekend(cursor) ? 0 : hoursPerDay;
      cursor = addDays(cursor, 1);
    }
    setResourceHours((prev) => ({ ...prev, [role]: newRoleData }));
  }, [store.tasks]);

  const handleAddOop = useCallback(() => {
    snap();
    setOopExpenses((prev) => [
      ...prev,
      { id: `oop-${Date.now()}`, name: '', amount: 0 },
    ]);
  }, []);

  const handleRemoveOop = useCallback((oopId) => {
    snap();
    setOopExpenses((prev) => prev.filter((o) => o.id !== oopId));
  }, []);

  const handleOopChange = useCallback((oopId, field, value) => {
    snap();
    setOopExpenses((prev) =>
      prev.map((o) => {
        if (o.id !== oopId) return o;
        if (field === 'name') return { ...o, name: value };
        if (field === 'amount') return { ...o, amount: Number(value) || 0 };
        return o;
      })
    );
  }, []);

  // Derive editingTask from live store data so form updates during drag/resize
  const editingTask = useMemo(
    () => (editingId ? store.tasks.find((t) => t.id === editingId) || null : null),
    [editingId, store.tasks]
  );

  // For GanttChart which expects a single selectedId
  const primarySelectedId = editingId || (selectedIds.size === 1 ? [...selectedIds][0] : null);

  const handleSelect = useCallback((id, multiSelect) => {
    if (!multiSelect) snap(); // snapshot before opening edit form
    if (multiSelect) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    } else {
      setSelectedIds(new Set([id]));
      setEditingId(id);
      setFormOpen(true);
    }
  }, []);

  const handleLoadPreset = () => {
    snap();
    const PRESET = [
      { name: 'Project Kickoff & Alignment', phase: 'Insight', days: 2 },
      { name: 'Stakeholder Interviews', phase: 'Insight', days: 5 },
      { name: 'Competitive & Market Audit', phase: 'Insight', days: 5 },
      { name: 'Insights Synthesis', phase: 'Insight', days: 3 },
      { name: 'Insight Readout & Approval', phase: 'Insight', days: 1 },
      { name: 'UX Strategy & Concepting', phase: 'Vision', days: 5 },
      { name: 'Wireframes & User Flows', phase: 'Vision', days: 7 },
      { name: 'Visual Design Direction', phase: 'Vision', days: 5 },
      { name: 'Design Review & Refinement', phase: 'Vision', days: 3 },
      { name: 'Vision Readout & Approval', phase: 'Vision', days: 1 },
      { name: 'Design System & Components', phase: 'Execute', days: 7 },
      { name: 'Frontend Development', phase: 'Execute', days: 10 },
      { name: 'Content Integration', phase: 'Execute', days: 5 },
      { name: 'QA & UAT', phase: 'Execute', days: 5 },
      { name: 'Launch & Handoff', phase: 'Execute', days: 2 },
    ];

    let cursor = new Date();
    // Skip to next Monday
    while (cursor.getDay() !== 1) cursor = addDays(cursor, 1);

    let prevId = null;
    for (const item of PRESET) {
      // Skip weekends for start
      let start = new Date(cursor);
      while (isWeekend(start)) start = addDays(start, 1);

      // Calculate end skipping weekends
      let end = new Date(start);
      let remaining = item.days - 1;
      while (remaining > 0) {
        end = addDays(end, 1);
        if (!isWeekend(end)) remaining--;
      }

      const task = store.addTask({
        name: item.name,
        start: formatDate(start),
        end: formatDate(end),
        group: item.phase,
        progress: 0,
        dependencies: prevId ? [prevId] : [],
      });

      prevId = task.id;
      cursor = addDays(end, 1);
    }
  };

  const handleAddFromLibrary = (activities) => {
    snap();
    let cursor = new Date();
    if (store.tasks.length > 0) {
      const lastEnd = store.tasks.reduce((max, t) => {
        const d = new Date(t.end + 'T00:00:00');
        return d > max ? d : max;
      }, new Date(0));
      cursor = addDays(lastEnd, 1);
    }

    for (const activity of activities) {
      const days = activity.durationDays[0];
      const start = formatDate(cursor);
      const end = formatDate(addDays(cursor, days - 1));
      store.addTask({
        name: activity.name,
        start,
        end,
        group: activity.phase,
        progress: 0,
        dependencies: [],
      });
      cursor = addDays(cursor, days);
    }
  };

  const handleAddOrUpdate = (formData) => {
    if (editingTask) {
      // Auto-save: just update, don't close form or snap (would flood history)
      store.updateTask(editingTask.id, formData);
    } else {
      snap();
      const task = store.addTask(formData);
      setSelectedIds(new Set([task.id]));
      setAnimatingTask({ id: task.id, type: 'pop-in' });
      setTimeout(() => setAnimatingTask(null), 400);
      setFormOpen(false);
    }
  };

  const handleDeleteTask = useCallback((id) => {
    const task = store.tasks.find((t) => t.id === id);
    if (!task || !confirm(`Delete "${task.name}"?`)) return;
    snap();
    store.deleteTask(id);
    selectedIds.delete(id);
    setSelectedIds(new Set(selectedIds));
    if (editingId === id) {
      setEditingId(null);
      setFormOpen(false);
    }
  }, [store, selectedIds, editingId]);

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} selected task${selectedIds.size > 1 ? 's' : ''}?`)) return;
    snap();
    for (const id of selectedIds) {
      store.deleteTask(id);
    }
    setSelectedIds(new Set());
    setEditingId(null);
    setFormOpen(false);
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormClosing(true);
    setTimeout(() => {
      setEditingId(null);
      setFormOpen(false);
      setFormClosing(false);
    }, 250);
  };

  if (store.loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-accent" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-bg">
      {/* Top bar */}
      <div className="flex items-center border-b border-border px-4 py-2 bg-sidebar shrink-0">
        <div className="flex items-center gap-4">
          {/* Back button */}
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-text-muted hover:bg-bg-alt transition"
            >
              <ArrowLeft size={14} />
              Projects
            </button>
          )}

          {/* Logo */}
          <div className="flex flex-col leading-none gap-0.5">
            <span className="text-sm font-bold tracking-tight text-text">Fantt Chart</span>
            <div className="flex items-center gap-1">
              <FanttLogo size={9} color="rgba(255,255,255,0.35)" />
              <span className="text-[10px] font-light text-text-muted/60">Created by Fantasy</span>
            </div>
          </div>

          {/* View mode */}
          <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />

          {/* Hide weekends toggle */}
          <button
            onClick={() => setHideWeekends((h) => !h)}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
              hideWeekends
                ? 'bg-accent/15 text-accent'
                : 'text-text-muted hover:bg-bg-alt'
            }`}
            title={hideWeekends ? 'Show weekends' : 'Hide weekends'}
          >
            <CalendarOff size={13} />
            Weekends
          </button>

          {/* Grid toggle */}
          <button
            onClick={() => setShowGrid((g) => !g)}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
              showGrid
                ? 'bg-accent/15 text-accent'
                : 'text-text-muted hover:bg-bg-alt'
            }`}
            title={showGrid ? 'Hide grid' : 'Show grid'}
          >
            <Grid3x3 size={13} />
            Grid
          </button>
        </div>

        {/* Project name — centered */}
        {projectName && (
          <div className="flex-1 flex justify-center min-w-0 px-4">
            <span className="text-sm font-medium text-text-muted truncate">{projectName}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Group 1: Edit */}
          <button
            onClick={() => { const s = history.undo(getCurrentSnapshot()); if (s) restoreSnapshot(s); }}
            disabled={!history.canUndo}
            className="rounded-lg p-1.5 text-text-muted hover:bg-bg-alt transition disabled:opacity-30 disabled:cursor-not-allowed"
            title="Undo (Cmd+Z)"
          >
            <Undo2 size={15} />
          </button>
          <button
            onClick={() => { const s = history.redo(getCurrentSnapshot()); if (s) restoreSnapshot(s); }}
            disabled={!history.canRedo}
            className="rounded-lg p-1.5 text-text-muted hover:bg-bg-alt transition disabled:opacity-30 disabled:cursor-not-allowed"
            title="Redo (Cmd+Shift+Z)"
          >
            <Redo2 size={15} />
          </button>
          {selectedIds.size > 1 && (
            <button
              onClick={handleDeleteSelected}
              className="flex items-center gap-1.5 rounded-lg bg-red-500/10 px-2.5 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-500/20 transition"
            >
              <Trash2 size={14} />
              Delete {selectedIds.size}
            </button>
          )}

          <div className="h-4 w-px bg-border/60" />

          {/* Group 2: Create */}
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition"
          >
            <Plus size={14} />
            Add Task
          </button>
          <button
            onClick={() => setLibraryOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-accent/10 px-2.5 py-1.5 text-xs font-semibold text-accent hover:bg-accent/20 transition"
          >
            <Library size={14} />
            Library
          </button>

          <div className="h-4 w-px bg-border/60" />

          {/* Group 3: Share & collaborate */}
          <button
            onClick={() => setSharePanelOpen(true)}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-text-muted hover:bg-bg-alt transition"
            title="Share project"
          >
            <Share2 size={13} />
            Share
          </button>
          <button
            onClick={() => setHistoryOpen(o => !o)}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${historyOpen ? 'bg-bg-alt text-text' : 'text-text-muted hover:bg-bg-alt'}`}
            title="Change history"
          >
            <History size={13} />
          </button>

          {/* Collaborator avatars */}
          {others.length > 0 && (() => {
            const MAX_VISIBLE = 3;
            const avatarColors = [
              { bg: '#4f8ef7', text: '#fff' },
              { bg: '#f7874f', text: '#fff' },
              { bg: '#7c4ff7', text: '#fff' },
              { bg: '#2db87e', text: '#fff' },
              { bg: '#f7c94f', text: '#000' },
            ];
            const getInitials = (label) => {
              try {
                const local = label.includes('@') ? label.split('@')[0] : label;
                const parts = local.split(/[.\-_\s]+/).filter(Boolean);
                const result = parts.length >= 2
                  ? (parts[0][0] + parts[1][0]).toUpperCase()
                  : parts[0]?.[0]?.toUpperCase() || '?';
                return result || label[0].toUpperCase();
              } catch { return label[0]?.toUpperCase() || '?'; }
            };
            const overflow = others.length - MAX_VISIBLE;
            return (
              <div className="group relative flex items-center" style={{ gap: 0 }}>
                {/* Stacked circles — max 3 visible */}
                {others.slice(0, MAX_VISIBLE).map((user, i) => {
                  const label = user.identity || 'Collaborator';
                  const c = avatarColors[i % avatarColors.length];
                  return (
                    <div
                      key={user.key}
                      style={{
                        width: 26, height: 26,
                        borderRadius: '50%',
                        background: c.bg,
                        color: c.text,
                        fontSize: 10, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '2px solid var(--color-bg)',
                        marginLeft: i === 0 ? 0 : -8,
                        zIndex: MAX_VISIBLE - i,
                        position: 'relative',
                        cursor: 'default', flexShrink: 0,
                      }}
                    >
                      {getInitials(label)}
                    </div>
                  );
                })}
                {overflow > 0 && (
                  <div
                    style={{
                      width: 26, height: 26,
                      borderRadius: '50%',
                      background: 'var(--color-bg-alt)',
                      color: 'var(--color-text-muted)',
                      fontSize: 9, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '2px solid var(--color-bg)',
                      marginLeft: -8, position: 'relative', zIndex: 0, flexShrink: 0,
                      cursor: 'default',
                    }}
                  >
                    +{overflow}
                  </div>
                )}

                {/* Hover popover — shows everyone in the file */}
                <div className="pointer-events-none absolute bottom-full right-0 mb-2.5 hidden group-hover:block z-50">
                  <div className="rounded-lg border border-border bg-sidebar shadow-xl px-3 py-2.5 min-w-[160px]">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted/60 mb-2">
                      In this file
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {others.map((user, i) => {
                        const label = user.identity || 'Collaborator';
                        const c = avatarColors[i % avatarColors.length];
                        return (
                          <div key={user.key} className="flex items-center gap-2">
                            <div
                              style={{
                                width: 20, height: 20,
                                borderRadius: '50%',
                                background: c.bg,
                                color: c.text,
                                fontSize: 9, fontWeight: 700,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              {getInitials(label)}
                            </div>
                            <span className="text-xs text-text truncate max-w-[140px]">{label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {/* Arrow */}
                  <div className="absolute -bottom-1.5 right-4 w-3 h-3 rotate-45 border-b border-r border-border bg-sidebar" />
                </div>
              </div>
            );
          })()}

          {/* You avatar — shows your initials; tooltip has email + save status */}
          {email && (() => {
            try {
              const local = email.includes('@') ? email.split('@')[0] : email;
              const parts = local.split(/[.\-_\s]+/).filter(Boolean);
              const initials = parts.length >= 2
                ? (parts[0][0] + parts[1][0]).toUpperCase()
                : parts[0]?.[0]?.toUpperCase() || '?';
              const savedLabel = store.saveStatus === 'saving'
                ? 'Saving…'
                : store.lastSavedAt
                  ? `Saved ${store.lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : null;
              const tooltip = [email, savedLabel].filter(Boolean).join(' · ');
              return (
                <div
                  title={tooltip}
                  className={store.saveStatus === 'saving' ? 'animate-pulse' : ''}
                  style={{
                    width: 26, height: 26,
                    borderRadius: '50%',
                    background: 'var(--color-accent)',
                    color: '#fff',
                    fontSize: 10, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '2px solid var(--color-bg)',
                    outline: store.saveStatus === 'saving' ? '2px solid var(--color-accent)' : 'none',
                    outlineOffset: '2px',
                    cursor: 'default', flexShrink: 0,
                  }}
                >
                  {initials}
                </div>
              );
            } catch { return null; }
          })()}

          <div className="h-4 w-px bg-border/60" />

          {/* Group 4: Settings */}
          <button
            onClick={toggleTheme}
            className="rounded-lg border border-border p-1.5 text-text-muted hover:bg-bg-alt transition"
            title={theme === 'fantasy' ? 'Switch to Light mode' : 'Switch to Dark mode'}
          >
            {theme === 'fantasy' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>
      </div>

      {/* Main content */}
      {store.tasks.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <BarChart3 size={48} className="mx-auto text-border" />
            <h2 className="mt-3 text-lg font-semibold text-text-muted">No tasks yet</h2>
            <p className="mt-1 text-sm text-text-muted/70">
              Add tasks or use the Activity Library to get started
            </p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <button
                onClick={handleLoadPreset}
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                <Zap size={15} />
                Sample Project
              </button>
              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-text-muted hover:bg-bg-alt"
              >
                <Plus size={15} />
                Add Task
              </button>
              <button
                onClick={() => setLibraryOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-text-muted hover:bg-bg-alt"
              >
                <Library size={15} />
                Library
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div ref={splitContainerRef} className="flex flex-1 flex-col min-h-0">
          <div
            ref={ganttScrollRef}
            className={`flex overflow-auto items-start ${budgetCollapsed ? 'flex-1' : 'shrink-0'}`}
            style={budgetCollapsed ? {} : { height: `${splitPct}%` }}
          >
            <InlineTaskTable
              tasks={store.tasks}
              viewMode={viewMode}
              selectedIds={selectedIds}
              onSelect={handleSelect}
              onDelete={handleDeleteTask}
            />
            <GanttChart
              tasks={store.tasks}
              viewMode={viewMode}
              hideWeekends={hideWeekends}
              showGrid={showGrid}
              selectedId={primarySelectedId}
              selectedIds={selectedIds}
              animatingTask={animatingTask}
              onAnimationEnd={() => setAnimatingTask(null)}
              ganttScrollRef={ganttScrollRef}
              onHorizontalScroll={handleGanttScroll}
              highlightedDate={highlightedDate}
              onDateClick={setHighlightedDate}
              onTaskClick={(id, e) => {
                if (e?.metaKey || e?.ctrlKey || e?.shiftKey) {
                  handleSelect(id, true);
                } else {
                  handleSelect(id, false);
                }
              }}
              onTaskUpdate={(id, updates) => { store.updateTask(id, updates); }}
              onBeginDrag={(taskId) => { snap(); dragDeltaRef.current = 0; dragRefDateRef.current = null; store.beginDrag(taskId); }}
              onBeginResize={() => snap()}
              onDragMove={(taskId, daysDelta) => {
                if (!dragRefDateRef.current) {
                  const task = store.tasks.find(t => t.id === taskId);
                  if (task) dragRefDateRef.current = task.start;
                }
                dragDeltaRef.current = daysDelta;
                store.dragMove(taskId, daysDelta);
              }}
              onEndDrag={() => {
                const delta = dragDeltaRef.current;
                const refDate = dragRefDateRef.current;
                if (delta !== 0 && refDate) {
                  setResourceHours(prev => shiftAllHours(prev, delta, refDate));
                }
                store.endDrag();
                dragDeltaRef.current = 0;
                dragRefDateRef.current = null;
              }}
              onResizeEnd={(taskId) => {
                setAnimatingTask({ id: taskId, type: 'bounce-h' });
                setTimeout(() => setAnimatingTask(null), 300);
              }}
              onMoveEnd={(taskId) => {
                setAnimatingTask({ id: taskId, type: 'bounce-v' });
                setTimeout(() => setAnimatingTask(null), 350);
              }}
              onBeginReorder={() => snap()}
              onReorder={(fromIndex, toIndex) => {
                store.reorderTasks(fromIndex, toIndex);
                const task = store.tasks[fromIndex];
                if (task) {
                  setAnimatingTask({ id: task.id, type: 'slot' });
                  setTimeout(() => setAnimatingTask(null), 220);
                }
              }}
            />
          </div>
          {/* Drag resizer — only visible when resource panel is expanded */}
          {!budgetCollapsed && (
            <div
              className="h-1.5 shrink-0 cursor-ns-resize bg-border/40 hover:bg-accent/40 active:bg-accent/60 transition-colors select-none"
              onPointerDown={handleResizerDown}
            />
          )}

          <div
            className={`flex flex-col min-h-0 ${budgetCollapsed ? 'shrink-0' : 'shrink-0'}`}
            style={budgetCollapsed ? {} : { height: `calc(${100 - splitPct}% - 6px)` }}
          >
          <ResourceGrid
              tasks={store.tasks}
              viewMode={viewMode}
              hideWeekends={hideWeekends}
              showGrid={showGrid}
              ganttScrollRef={ganttScrollRef}
              resourceHours={resourceHours}
              onHoursChange={handleResourceHoursChange}
              onQuickFill={handleQuickFill}
              hiddenRoles={hiddenRoles}
              onHideRole={handleHideRole}
              onShowRole={handleShowRole}
              roleNames={roleNames}
              onRoleNameChange={handleRoleNameChange}
              oopExpenses={oopExpenses}
              onOopChange={handleOopChange}
              onAddOop={handleAddOop}
              onRemoveOop={handleRemoveOop}
              collapsed={budgetCollapsed}
              onToggle={() => setBudgetCollapsed((c) => !c)}
              onClearAll={() => setResourceHours({})}
              resourceScrollRef={resourceScrollRef}
              highlightedDate={highlightedDate}
              onDateClick={setHighlightedDate}
            />
          </div>
        </div>
      )}

      {/* Change history panel */}
      {historyOpen && (
        <Suspense fallback={null}>
          <ChangeHistory
            projectId={projectId}
            onClose={() => setHistoryOpen(false)}
            onRevert={(snapshot) => { snap(); store.setTasksDirect(snapshot); }}
          />
        </Suspense>
      )}

      {/* Share panel */}
      {sharePanelOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setSharePanelOpen(false)}
            style={{ animation: 'fantt-backdrop-in 0.25s ease-out forwards' }}
          />
          <div
            className="fixed right-0 top-0 z-50 flex h-full w-96 flex-col border-l border-border bg-sidebar shadow-xl"
            style={{ animation: 'fantt-slide-in 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
          >
            <SharePanel
              projectId={projectId}
              projectName={projectName}
              tasks={store.tasks}
              onClose={() => setSharePanelOpen(false)}
            />
          </div>
        </>
      )}

      {/* Slide-over TaskForm panel */}
      {formOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={handleCloseForm}
            style={{ animation: `${formClosing ? 'fantt-backdrop-out' : 'fantt-backdrop-in'} 0.25s ease-out forwards` }}
          />
          {/* Panel */}
          <div
            className="fixed right-0 top-0 z-50 flex h-full w-96 flex-col border-l border-border bg-sidebar shadow-xl"
            style={{ animation: `${formClosing ? 'fantt-slide-out' : 'fantt-slide-in'} 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards` }}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-sm font-bold text-text">
                {editingTask ? 'Edit Task' : 'New Task'}
              </h2>
              <button
                onClick={handleCloseForm}
                className="rounded-lg p-1 text-text-muted hover:bg-bg-alt transition"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <TaskForm
                editingTask={editingTask}
                tasks={store.tasks}
                onSubmit={handleAddOrUpdate}
                onCancel={handleCloseForm}
                onDelete={handleDeleteTask}
              />
            </div>
          </div>
        </>
      )}

      {/* Activity Library Modal */}
      <Suspense fallback={null}>
        <ActivityLibrary
          open={libraryOpen}
          onClose={() => setLibraryOpen(false)}
          onAddActivities={handleAddFromLibrary}
          existingTasks={store.tasks}
        />
      </Suspense>

      {/* Bug Report Button */}
      <Suspense fallback={null}>
        <BugReportButton />
      </Suspense>

      {/* Auto-save toast */}
      {autoSaveToast && (
        <div
          className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg border border-border bg-sidebar px-3 py-2 shadow-lg"
          style={{
            animation: autoSaveToast === 'in'
              ? 'fantt-toast-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
              : 'fantt-toast-out 0.3s ease-in forwards',
          }}
        >
          <Check size={12} className="text-green-500" />
          <span className="text-xs text-text-muted">Auto-saved</span>
        </div>
      )}
    </div>
  );
}
