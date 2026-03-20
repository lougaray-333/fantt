import { useState, useMemo, useCallback } from 'react';
import { Library, ArrowLeft, Loader2, Trash2, BarChart3 } from 'lucide-react';
import FanttLogo from './FanttLogo';
import { useTaskStore } from '../hooks/useTaskStore';
import { formatDate, addDays } from '../utils/dates';
import GanttChart from './GanttChart';
import TaskForm from './TaskForm';
import TaskList from './TaskList';
import ViewModeToggle from './ViewModeToggle';
import Legend from './Legend';
import ActivityLibrary from './ActivityLibrary';

export default function GanttEditor({ projectId, onBack }) {
  const store = useTaskStore(projectId);
  const [viewMode, setViewMode] = useState('day');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [editingId, setEditingId] = useState(null);
  const [libraryOpen, setLibraryOpen] = useState(false);

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
    }
  }, []);

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
    } else {
      const task = store.addTask(formData);
      setSelectedIds(new Set([task.id]));
    }
  };

  const handleEdit = (task) => {
    setEditingId(task.id);
    setSelectedIds(new Set([task.id]));
  };

  const handleDelete = (id) => {
    store.deleteTask(id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    if (editingId === id) setEditingId(null);
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} selected task${selectedIds.size > 1 ? 's' : ''}?`)) return;
    for (const id of selectedIds) {
      store.deleteTask(id);
    }
    setSelectedIds(new Set());
    setEditingId(null);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === store.tasks.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(store.tasks.map((t) => t.id)));
    }
  };

  if (store.loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 size={32} className="animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="flex w-80 shrink-0 flex-col border-r border-border bg-sidebar">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            {onBack && (
              <button
                onClick={onBack}
                className="rounded-lg p-1 text-text-muted hover:bg-border/50 transition"
                title="Back to projects"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <FanttLogo size={22} className="text-accent" />
            <h1 className="text-base font-bold text-text">Fantt Chart</h1>
          </div>
          <button
            onClick={() => setLibraryOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-accent/10 px-2.5 py-1.5 text-xs font-semibold text-accent hover:bg-accent/20 transition"
            title="Activity Library"
          >
            <Library size={14} />
            Library
          </button>
        </div>

        {/* Task Form */}
        <div className="border-b border-border p-4">
          <TaskForm
            editingTask={editingTask}
            tasks={store.tasks}
            onSubmit={handleAddOrUpdate}
            onCancel={() => setEditingId(null)}
          />
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Tasks ({store.tasks.length})
            </span>
            <div className="flex items-center gap-1">
              {selectedIds.size > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-red-500 hover:bg-red-50 transition"
                  title="Delete selected"
                >
                  <Trash2 size={12} />
                  {selectedIds.size}
                </button>
              )}
              {store.tasks.length > 0 && (
                <button
                  onClick={handleSelectAll}
                  className="rounded px-1.5 py-0.5 text-[10px] font-medium text-text-muted hover:bg-bg-alt transition"
                >
                  {selectedIds.size === store.tasks.length ? 'Deselect all' : 'Select all'}
                </button>
              )}
            </div>
          </div>
          <TaskList
            tasks={store.tasks}
            selectedIds={selectedIds}
            onSelect={handleSelect}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </div>

      {/* Chart area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between border-b border-border px-4 py-2">
          <div className="flex items-center gap-4">
            <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
            <Legend tasks={store.tasks} />
          </div>
          {selectedIds.size > 1 && (
            <button
              onClick={handleDeleteSelected}
              className="flex items-center gap-1.5 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-100 transition"
            >
              <Trash2 size={14} />
              Delete {selectedIds.size} selected
            </button>
          )}
        </div>

        {/* Chart */}
        {store.tasks.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <BarChart3 size={48} className="mx-auto text-border" />
              <h2 className="mt-3 text-lg font-semibold text-text-muted">No tasks yet</h2>
              <p className="mt-1 text-sm text-text-muted/70">
                Add tasks in the sidebar or use the
              </p>
              <button
                onClick={() => setLibraryOpen(true)}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                <Library size={15} />
                Activity Library
              </button>
            </div>
          </div>
        ) : (
          <GanttChart
            tasks={store.tasks}
            viewMode={viewMode}
            selectedId={primarySelectedId}
            selectedIds={selectedIds}
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
            onReorder={store.reorderTasks}
          />
        )}
      </div>

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
