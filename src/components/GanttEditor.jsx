import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Library, Loader2, Trash2, BarChart3, Plus, X, Sun, Moon, ArrowLeft, List, BarChart2, Check, DollarSign, Zap } from 'lucide-react';
import FanttLogo from './FanttLogo';
import { useTaskStore } from '../hooks/useTaskStore';
import { useTheme } from '../hooks/useTheme';
import { formatDate, addDays, isWeekend } from '../utils/dates';
import GanttChart from './GanttChart';
import TaskForm from './TaskForm';
import InlineTaskTable from './InlineTaskTable';
import ViewModeToggle from './ViewModeToggle';
import Legend from './Legend';
import ActivityLibrary from './ActivityLibrary';
import ListView from './ListView';
import ResourceGrid from './ResourceGrid';

export default function GanttEditor({ projectId, email, onBack }) {
  const store = useTaskStore(projectId);
  const { theme, toggleTheme } = useTheme();
  const [viewMode, setViewMode] = useState('day');
  const [mainView, setMainView] = useState('gantt');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [editingId, setEditingId] = useState(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
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
  const [budgetOpen, setBudgetOpen] = useState(true);
  const [budgetCollapsed, setBudgetCollapsed] = useState(false);
  const [highlightedDate, setHighlightedDate] = useState(null);

  // Auto-save budget data to localStorage
  useEffect(() => {
    localStorage.setItem(budgetKey + '-hours', JSON.stringify(resourceHours));
  }, [resourceHours, budgetKey]);

  useEffect(() => {
    localStorage.setItem(budgetKey + '-oop', JSON.stringify(oopExpenses));
  }, [oopExpenses, budgetKey]);

  useEffect(() => {
    localStorage.setItem(budgetKey + '-hidden', JSON.stringify(hiddenRoles));
  }, [hiddenRoles, budgetKey]);

  useEffect(() => {
    localStorage.setItem(budgetKey + '-names', JSON.stringify(roleNames));
  }, [roleNames, budgetKey]);

  // Scroll sync refs
  const ganttScrollRef = useRef(null);
  const resourceScrollRef = useRef(null);
  const scrollSourceRef = useRef(null); // 'gantt' | 'resource' | null
  const scrollTimerRef = useRef(null);

  const clearScrollLock = useCallback(() => {
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => { scrollSourceRef.current = null; }, 60);
  }, []);

  const handleGanttScroll = useCallback((scrollLeft) => {
    if (scrollSourceRef.current === 'resource') return;
    scrollSourceRef.current = 'gantt';
    const el = resourceScrollRef.current;
    if (el) el.scrollLeft = scrollLeft;
    clearScrollLock();
  }, [clearScrollLock]);

  const handleResourceScroll = useCallback((scrollLeft) => {
    if (scrollSourceRef.current === 'gantt') return;
    scrollSourceRef.current = 'resource';
    const el = ganttScrollRef.current;
    if (el) el.scrollLeft = scrollLeft;
    clearScrollLock();
  }, [clearScrollLock]);

  const handleHideRole = useCallback((role) => {
    setHiddenRoles((prev) => [...prev, role]);
  }, []);

  const handleShowRole = useCallback((role) => {
    setHiddenRoles((prev) => prev.filter((r) => r !== role));
  }, []);

  const handleRoleNameChange = useCallback((role, name) => {
    setRoleNames((prev) => ({ ...prev, [role]: name }));
  }, []);

  const handleResourceHoursChange = useCallback((role, dateStr, hours) => {
    setResourceHours((prev) => ({
      ...prev,
      [role]: { ...(prev[role] || {}), [dateStr]: hours },
    }));
  }, []);

  // Quick-fill: set hours for every weekday across the project's actual task date range
  const handleQuickFill = useCallback((role, hoursPerDay) => {
    if (store.tasks.length === 0) return;
    let minDate = store.tasks[0].start;
    let maxDate = store.tasks[0].end;
    for (const t of store.tasks) {
      if (t.start < minDate) minDate = t.start;
      if (t.end > maxDate) maxDate = t.end;
    }
    const newRoleData = {};
    let cursor = new Date(minDate + 'T00:00:00');
    const end = new Date(maxDate + 'T00:00:00');
    while (cursor <= end) {
      const dateStr = formatDate(cursor);
      newRoleData[dateStr] = isWeekend(cursor) ? 0 : hoursPerDay;
      cursor = addDays(cursor, 1);
    }
    setResourceHours((prev) => ({
      ...prev,
      [role]: hoursPerDay === 0 ? {} : newRoleData,
    }));
  }, [store.tasks]);

  const handleAddOop = useCallback(() => {
    setOopExpenses((prev) => [
      ...prev,
      { id: `oop-${Date.now()}`, name: '', amount: 0 },
    ]);
  }, []);

  const handleRemoveOop = useCallback((oopId) => {
    setOopExpenses((prev) => prev.filter((o) => o.id !== oopId));
  }, []);

  const handleOopChange = useCallback((oopId, field, value) => {
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
    let cursor = new Date();
    if (store.tasks.length > 0) {
      const lastEnd = store.tasks.reduce((max, t) => {
        const d = new Date(t.end);
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
      store.updateTask(editingTask.id, formData);
      setEditingId(null);
      setFormOpen(false);
    } else {
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
    setEditingId(null);
    setFormOpen(false);
  };

  if (store.loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg">
        <Loader2 size={32} className="animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-bg">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2 bg-sidebar shrink-0">
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
          <div className="flex items-center gap-2">
            <FanttLogo size={22} />
            <span className="text-sm font-bold text-text">Fantt</span>
          </div>

          {/* Gantt / List toggle with sliding pill */}
          <div className="relative flex items-center rounded-lg border border-border bg-bg p-[3px]">
            {/* Sliding background pill */}
            <div
              className="absolute top-[3px] bottom-[3px] rounded-md bg-accent transition-all duration-200 ease-out"
              style={{
                width: 'calc(50% - 3px)',
                left: mainView === 'gantt' ? '3px' : 'calc(50%)',
              }}
            />
            <button
              onClick={() => setMainView('gantt')}
              className={`relative z-10 flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors duration-200 ${
                mainView === 'gantt' ? 'text-white' : 'text-text-muted hover:text-text'
              }`}
            >
              <BarChart2 size={12} />
              Gantt
            </button>
            <button
              onClick={() => setMainView('list')}
              className={`relative z-10 flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors duration-200 ${
                mainView === 'list' ? 'text-white' : 'text-text-muted hover:text-text'
              }`}
            >
              <List size={12} />
              List
            </button>
          </div>

          {/* View mode (only in gantt view) */}
          {mainView === 'gantt' && (
            <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
          )}

          {/* Legend */}
          <Legend tasks={store.tasks} />

          {/* Budget toggle */}
          <button
            onClick={() => setBudgetOpen((o) => !o)}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
              budgetOpen
                ? 'bg-accent/15 text-accent'
                : 'text-text-muted hover:bg-bg-alt'
            }`}
          >
            <DollarSign size={13} />
            Budget
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Delete selected */}
          {selectedIds.size > 1 && (
            <button
              onClick={handleDeleteSelected}
              className="flex items-center gap-1.5 rounded-lg bg-red-500/10 px-2.5 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-500/20 transition"
            >
              <Trash2 size={14} />
              Delete {selectedIds.size}
            </button>
          )}

          {/* Add Task */}
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition"
          >
            <Plus size={14} />
            Add Task
          </button>

          {/* Library */}
          <button
            onClick={() => setLibraryOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-accent/10 px-2.5 py-1.5 text-xs font-semibold text-accent hover:bg-accent/20 transition"
          >
            <Library size={14} />
            Library
          </button>

          {/* Save status */}
          <span className="text-[11px] text-text-muted/60">
            {store.saveStatus === 'saving' ? (
              <span className="flex items-center gap-1">
                <Loader2 size={10} className="animate-spin" />
                Saving…
              </span>
            ) : store.lastSavedAt ? (
              <span className="flex items-center gap-1">
                <Check size={10} />
                Saved {store.lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            ) : null}
          </span>

          {/* Email */}
          <span className="text-[11px] text-text-muted">{email}</span>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-text-muted hover:bg-bg-alt transition"
            title={theme === 'fantasy' ? 'Switch to Light mode' : 'Switch to Fantasy mode'}
          >
            {theme === 'fantasy' ? <Sun size={14} /> : <Moon size={14} />}
            {theme === 'fantasy' ? 'Light' : 'Fantasy'}
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
      ) : mainView === 'list' ? (
        <ListView
          tasks={store.tasks}
          onTaskUpdate={store.updateTask}
          onTaskClick={(id) => handleSelect(id, false)}
        />
      ) : (
        <div className="flex flex-1 flex-col min-h-0">
          <div ref={ganttScrollRef} className="flex flex-1 overflow-auto min-h-0 items-start">
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
              onTaskUpdate={store.updateTask}
              onBeginDrag={store.beginDrag}
              onDragMove={store.dragMove}
              onEndDrag={store.endDrag}
              onResizeEnd={(taskId) => {
                setAnimatingTask({ id: taskId, type: 'bounce-h' });
                setTimeout(() => setAnimatingTask(null), 300);
              }}
              onMoveEnd={(taskId) => {
                setAnimatingTask({ id: taskId, type: 'bounce-v' });
                setTimeout(() => setAnimatingTask(null), 350);
              }}
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
          {budgetOpen && (
            <ResourceGrid
              tasks={store.tasks}
              viewMode={viewMode}
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
              resourceScrollRef={resourceScrollRef}
              onHorizontalScroll={handleResourceScroll}
              highlightedDate={highlightedDate}
              onDateClick={setHighlightedDate}
            />
          )}
        </div>
      )}

      {/* Slide-over TaskForm panel */}
      {formOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={handleCloseForm}
            style={{ animation: 'fantt-backdrop-in 0.25s ease-out forwards' }}
          />
          {/* Panel */}
          <div
            className="fixed right-0 top-0 z-50 flex h-full w-96 flex-col border-l border-border bg-sidebar shadow-xl"
            style={{ animation: 'fantt-slide-in 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
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
      <ActivityLibrary
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        onAddActivities={handleAddFromLibrary}
        existingTasks={store.tasks}
      />
    </div>
  );
}
