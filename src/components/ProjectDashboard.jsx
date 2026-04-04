import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Plus,
  Trash2,
  FolderOpen,
  LogOut,
  Loader2,
  Clock,
  Pencil,
  ClipboardPaste,
  X,
} from 'lucide-react';
import FanttLogo from './FanttLogo';
import { parseWBS } from '../utils/parseWBS';

export default function ProjectDashboard({
  projects,
  loading,
  canCreateMore,
  maxProjects,
  onCreate,
  onOpen,
  onDelete,
  onRename,
  onSignOut,
  onImportLocal,
  onImportWBS,
  hasLocalData,
  userEmail,
}) {
  const [deleting, setDeleting] = useState(null);
  const [creating, setCreating] = useState(false);
  const [namingNew, setNamingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [showWBSModal, setShowWBSModal] = useState(false);
  const [wbsText, setWbsText] = useState('');
  const [wbsName, setWbsName] = useState('Imported Project');
  const [wbsCreating, setWbsCreating] = useState(false);
  const newInputRef = useRef(null);
  const editInputRef = useRef(null);

  useEffect(() => {
    if (namingNew && newInputRef.current) newInputRef.current.focus();
  }, [namingNew]);

  useEffect(() => {
    if (editingId && editInputRef.current) editInputRef.current.focus();
  }, [editingId]);

  const handleCreate = async (name) => {
    setCreating(true);
    try {
      const project = await onCreate(name || 'Untitled Project');
      setNamingNew(false);
      setNewName('');
      onOpen(project.id);
    } catch {
      // stay on page
    } finally {
      setCreating(false);
    }
  };

  const handleRename = async (id) => {
    const trimmed = editName.trim();
    if (trimmed && onRename) {
      await onRename(id, trimmed);
    }
    setEditingId(null);
    setEditName('');
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this project and all its tasks? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await onDelete(id);
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (iso) => {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const parsedWBSTasks = useMemo(() => parseWBS(wbsText), [wbsText]);

  const handleWBSSubmit = async () => {
    if (parsedWBSTasks.length === 0 || !onImportWBS) return;
    setWbsCreating(true);
    try {
      await onImportWBS(parsedWBSTasks, wbsName.trim() || 'Imported Project');
      setShowWBSModal(false);
      setWbsText('');
      setWbsName('Imported Project');
    } catch {
      // stay on modal
    } finally {
      setWbsCreating(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      {/* Header */}
      <header className="border-b border-border bg-sidebar">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div className="flex flex-col leading-none gap-0.5">
            <span className="text-sm font-bold tracking-tight text-text">Fantt Chart</span>
            <div className="flex items-center gap-1">
              <FanttLogo size={9} color="rgba(255,255,255,0.35)" />
              <span className="text-[10px] font-light text-text-muted/60">Created by Fantasy</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-text-muted">{userEmail}</span>
            <button
              onClick={onSignOut}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-text-muted hover:bg-border/50 transition"
            >
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">
        {/* Local import banner */}
        {hasLocalData && (
          <div className="mb-6 flex items-center justify-between rounded-lg border border-accent/30 bg-accent/5 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-text">
                Found local project data
              </p>
              <p className="text-xs text-text-muted">
                Import your existing tasks as a new Fantt Chart
              </p>
            </div>
            <button
              onClick={onImportLocal}
              className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition"
            >
              Import
            </button>
          </div>
        )}

        {/* Title row */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text">Your Projects</h2>
            <p className="text-xs text-text-muted">
              {projects.length} / {maxProjects} projects
            </p>
          </div>
          {namingNew ? (
            <form
              onSubmit={(e) => { e.preventDefault(); handleCreate(newName.trim()); }}
              className="flex items-center gap-2"
            >
              <input
                ref={newInputRef}
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Project name..."
                className="rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                onKeyDown={(e) => { if (e.key === 'Escape') { setNamingNew(false); setNewName(''); } }}
              />
              <button
                type="submit"
                disabled={creating}
                className="rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition"
              >
                {creating ? <Loader2 size={16} className="animate-spin" /> : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => { setNamingNew(false); setNewName(''); }}
                className="rounded-lg px-2 py-1.5 text-sm text-text-muted hover:bg-border/50 transition"
              >
                Cancel
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowWBSModal(true)}
                disabled={!canCreateMore}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-text-muted hover:bg-border/50 disabled:opacity-50 transition"
              >
                <ClipboardPaste size={16} />
                Paste WBS
              </button>
              <button
                onClick={() => setNamingNew(true)}
                disabled={!canCreateMore}
                className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition"
              >
                <Plus size={16} />
                New Project
              </button>
            </div>
          )}
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-accent" />
          </div>
        ) : projects.length === 0 && !namingNew ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-20">
            <FolderOpen size={48} className="text-border" />
            <h3 className="mt-3 text-lg font-semibold text-text-muted">
              No projects yet
            </h3>
            <p className="mt-1 text-sm text-text-muted/70">
              Create your first Fantt Chart to get started
            </p>
          </div>
        ) : (
          /* Project grid */
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project, index) => (
              <div
                key={project.id}
                onClick={() => {
                  if (editingId !== project.id) onOpen(project.id);
                }}
                className="group cursor-pointer rounded-xl border border-border bg-sidebar p-4 hover:border-accent/40 hover:shadow-sm transition"
                style={{
                  animation: 'fantt-item-in 0.3s ease-out both',
                  animationDelay: `${Math.min(index, 5) * 60}ms`,
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    {editingId === project.id ? (
                      <form
                        onSubmit={(e) => { e.preventDefault(); handleRename(project.id); }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          ref={editInputRef}
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onBlur={() => handleRename(project.id)}
                          onKeyDown={(e) => { if (e.key === 'Escape') { setEditingId(null); setEditName(''); } }}
                          className="w-full rounded border border-accent bg-bg px-1.5 py-0.5 text-sm font-semibold text-text focus:outline-none focus:ring-1 focus:ring-accent"
                        />
                      </form>
                    ) : (
                      <h3 className="truncate text-sm font-semibold text-text">
                        {project.name}
                      </h3>
                    )}
                    <div className="mt-1.5 flex items-center gap-1 text-xs text-text-muted">
                      <Clock size={12} />
                      {formatDate(project.updated_at)}
                    </div>
                  </div>
                  <div className="ml-2 flex items-center gap-0.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(project.id);
                        setEditName(project.name);
                      }}
                      className="rounded-lg p-1.5 text-text-muted/50 opacity-0 hover:bg-accent/10 hover:text-accent group-hover:opacity-100 transition"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(project.id);
                      }}
                      disabled={deleting === project.id}
                      className="rounded-lg p-1.5 text-text-muted/50 opacity-0 hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 transition"
                    >
                      {deleting === project.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* WBS Import Modal */}
      {showWBSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowWBSModal(false)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-xl border border-border bg-sidebar p-6 shadow-xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text">Paste Workback Schedule</h3>
              <button
                onClick={() => setShowWBSModal(false)}
                className="rounded-lg p-1 text-text-muted hover:bg-border/50 transition"
              >
                <X size={18} />
              </button>
            </div>

            <label className="block text-xs font-medium text-text-muted mb-1">
              Project Name
            </label>
            <input
              type="text"
              value={wbsName}
              onChange={(e) => setWbsName(e.target.value)}
              className="mb-4 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />

            <label className="block text-xs font-medium text-text-muted mb-1">
              Paste bulleted schedule
            </label>
            <textarea
              value={wbsText}
              onChange={(e) => setWbsText(e.target.value)}
              placeholder={"• 3/15: Kickoff Meeting\n• 3/15-3/22: UX Strategy\n• 3/22-4/5: Design Phase"}
              rows={8}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text font-mono focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent resize-y"
            />

            <p className="mt-2 text-xs text-text-muted">
              {parsedWBSTasks.length === 0
                ? 'No tasks found — use format: • M/D-M/D: Task Name'
                : `${parsedWBSTasks.length} task${parsedWBSTasks.length !== 1 ? 's' : ''} found`}
            </p>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowWBSModal(false)}
                className="rounded-lg px-3 py-1.5 text-sm text-text-muted hover:bg-border/50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleWBSSubmit}
                disabled={parsedWBSTasks.length === 0 || wbsCreating}
                className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition"
              >
                {wbsCreating ? <Loader2 size={14} className="animate-spin" /> : null}
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
