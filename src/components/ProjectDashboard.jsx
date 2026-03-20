import { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Trash2,
  FolderOpen,
  LogOut,
  Loader2,
  Clock,
  Pencil,
} from 'lucide-react';
import FanttLogo from './FanttLogo';

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
  hasLocalData,
  userEmail,
}) {
  const [deleting, setDeleting] = useState(null);
  const [creating, setCreating] = useState(false);
  const [namingNew, setNamingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
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

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      {/* Header */}
      <header className="border-b border-border bg-sidebar">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <FanttLogo size={26} className="text-accent" />
            <h1 className="text-xl font-bold text-text">Fantt Chart</h1>
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
                Import your existing tasks as a new Fantt chart
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
            <button
              onClick={() => setNamingNew(true)}
              disabled={!canCreateMore}
              className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition"
            >
              <Plus size={16} />
              New Project
            </button>
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
              Create your first Fantt chart to get started
            </p>
          </div>
        ) : (
          /* Project grid */
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => {
                  if (editingId !== project.id) onOpen(project.id);
                }}
                className="group cursor-pointer rounded-xl border border-border bg-sidebar p-4 hover:border-accent/40 hover:shadow-sm transition"
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
    </div>
  );
}
