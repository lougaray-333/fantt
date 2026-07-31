import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Plus, Trash2, LogOut, Loader2, Clock, Pencil,
  ClipboardPaste, X, Folder, Copy, MoreHorizontal, Diamond,
  FolderPlus, Check, Star, Search, LayoutGrid,
  ChevronDown, ChevronRight, Sun, Moon,
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import FanttLogo from './FanttLogo';
import { parseWBS } from '../utils/parseWBS';
import { SYSTEM_EMAIL } from '../utils/seedTemplates';

// Only this user can open and edit system (Fantasy Shared) templates directly
const ADMIN_EMAIL = 'lou.garay@fantasy.co';

const COLOR_OPTIONS = [
  '#6366f1','#8b5cf6','#ec4899','#ef4444',
  '#f97316','#f59e0b','#84cc16','#10b981',
  '#14b8a6','#3b82f6','#0ea5e9','#a855f7',
];
function stripeColor(name = '') {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return COLOR_OPTIONS[h % COLOR_OPTIONS.length];
}
function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Folder Card (used in All Projects view) ───────────────────────
function FolderCard({ folder, projectCount, onClick }) {
  const color = stripeColor(folder.name);
  return (
    <button
      onClick={onClick}
      className="group/fcard relative flex flex-col rounded-xl border border-border bg-sidebar text-left transition hover:border-accent/40 hover:shadow-md overflow-hidden"
    >
      <div className="h-1.5 shrink-0" style={{ backgroundColor: color }} />
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Folder size={14} className="shrink-0 text-text-muted" />
          <h3 className="truncate text-sm font-semibold text-text">{folder.name}</h3>
        </div>
        <p className="text-[11px] text-text-muted">
          {projectCount} project{projectCount !== 1 ? 's' : ''}
        </p>
      </div>
    </button>
  );
}

// ── Project Card ─────────────────────────────────────────────────
function ProjectCard({
  project, folders, isTemplate, userEmail,
  onOpen, onDuplicate, onRename, onDelete,
  onMoveToFolder, onToggleTemplate, onToggleFavorite,
  onShareTemplate, onUnshareTemplate, onUseTemplate,
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  const [deleting, setDeleting] = useState(false);
  const dropdownRef = useRef(null);
  const editInputRef = useRef(null);
  const color = project.color || stripeColor(project.name);
  const isFavorite = project.is_favorite || false;
  const isOwner = project.email === userEmail;
  const isAdmin = userEmail === ADMIN_EMAIL;
  const isShared = project.is_shared || false;
  const isSystemTemplate = project.email === SYSTEM_EMAIL;

  useEffect(() => {
    if (editingName && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingName]);

  useEffect(() => {
    if (!showDropdown) return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showDropdown]);

  const handleRename = async () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== project.name) await onRename(project.id, trimmed);
    setEditingName(false);
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!isOwner && !isAdmin) return;
    if (!confirm(`Delete "${project.name}" and all its tasks? This cannot be undone.`)) return;
    setDeleting(true);
    try { await onDelete(project.id); } finally { setDeleting(false); }
  };

  return (
    <div className="group/card relative flex flex-col rounded-xl border border-border bg-sidebar transition hover:border-accent/40 hover:shadow-md">
      <div className="h-1.5 shrink-0 rounded-t-xl" style={{ backgroundColor: color }} />

      <div className="relative flex flex-1 flex-col p-4">
        {/* Favorite star */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(project.id, !isFavorite); }}
          className={`absolute top-0 right-0 p-2 rounded-bl-lg transition ${
            isFavorite
              ? 'text-amber-400'
              : 'text-text-muted/30 opacity-0 group-hover/card:opacity-100'
          }`}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Star size={13} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>

        {isTemplate && (
          <div className="mb-2 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-accent">
            <Diamond size={9} /> Template
          </div>
        )}

        {/* Name — click to rename inline */}
        {editingName ? (
          <form onSubmit={(e) => { e.preventDefault(); handleRename(); }} onClick={(e) => e.stopPropagation()}>
            <input
              ref={editInputRef}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => { if (e.key === 'Escape') setEditingName(false); }}
              className="w-full rounded border border-accent bg-bg px-1.5 py-0.5 text-sm font-semibold text-text focus:outline-none pr-6"
            />
          </form>
        ) : (
          <h3
            className="truncate text-sm font-semibold text-text leading-snug cursor-text hover:text-accent transition pr-6"
            onClick={(e) => { e.stopPropagation(); setEditName(project.name); setEditingName(true); }}
            title="Click to rename"
          >
            {project.name}
          </h3>
        )}

        <div className="mt-1.5 flex items-center gap-1 text-[11px] text-text-muted">
          <Clock size={11} />
          {fmtDate(project.updated_at)}
        </div>

        {/* Hover actions */}
        <div className="mt-3 flex items-center gap-1.5 opacity-0 group-hover/card:opacity-100 transition">
          {isTemplate && (isOwner || isAdmin) ? (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onUseTemplate(project.id); }}
                className="flex-1 rounded-lg border border-border py-1.5 text-xs font-medium text-text-muted hover:border-accent/50 hover:text-text transition"
              >
                Open Template
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onOpen(project.id); }}
                className="flex-1 rounded-lg border border-accent/40 py-1.5 text-xs font-medium text-accent hover:border-accent hover:bg-accent/5 transition"
              >
                Edit Template
              </button>
            </>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                isTemplate ? onUseTemplate(project.id) : onOpen(project.id);
              }}
              className="flex-1 rounded-lg border border-border py-1.5 text-xs font-medium text-text-muted hover:border-accent/50 hover:text-text transition"
            >
              {isTemplate ? 'Open Template' : 'Open'}
            </button>
          )}

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={(e) => { e.stopPropagation(); setShowDropdown((v) => !v); }}
              className="rounded-lg border border-border p-1.5 text-text-muted hover:border-accent/50 hover:text-text transition"
            >
              <MoreHorizontal size={13} />
            </button>

            {showDropdown && (
              <div
                className="absolute right-0 top-full z-30 mt-1 w-52 rounded-xl border border-border bg-sidebar shadow-xl py-1"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => { setShowDropdown(false); onDuplicate(project.id); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-text hover:bg-bg-alt transition"
                >
                  <Copy size={12} /> Duplicate
                </button>

                {/* Template toggle — only for templates the user owns */}
                {isOwner && !isSystemTemplate && (
                  <button
                    onClick={() => { onToggleTemplate(project.id, !isTemplate); setShowDropdown(false); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-text hover:bg-bg-alt transition"
                  >
                    <Diamond size={12} />
                    {isTemplate ? 'Remove Template' : 'Create a Template'}
                  </button>
                )}

                {/* Share with Fantasy — owner's personal template, not yet shared */}
                {isOwner && isTemplate && !isShared && !isSystemTemplate && (
                  <button
                    onClick={() => { onShareTemplate(project.id); setShowDropdown(false); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-text hover:bg-bg-alt transition"
                  >
                    <Star size={12} /> Share with Fantasy
                  </button>
                )}

                {/* Remove from Fantasy Shared — owner's template they shared */}
                {isOwner && isTemplate && isShared && !isSystemTemplate && (
                  <button
                    onClick={() => { onUnshareTemplate(project.id); setShowDropdown(false); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-text-muted hover:bg-bg-alt transition"
                  >
                    <Star size={12} /> Remove from Fantasy Shared
                  </button>
                )}

                {/* Move to folder */}
                {folders.length > 0 && (() => {
                  const topLevel = folders.filter((f) => !f.parent_id);
                  const subsOf = (id) => folders.filter((f) => f.parent_id === id);
                  return (
                    <>
                      <div className="my-1 border-t border-border/50" />
                      <p className="px-3 pt-1 pb-0.5 text-[10px] uppercase tracking-wider text-text-muted/50 font-medium select-none">
                        Move to
                      </p>
                      {project.folder_id && (
                        <button
                          onClick={() => { onMoveToFolder(project.id, null); setShowDropdown(false); }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-xs text-text-muted hover:bg-bg-alt transition"
                        >
                          <X size={11} /> No folder
                        </button>
                      )}
                      {topLevel.map((f) => (
                        <div key={f.id}>
                          <button
                            onClick={() => { onMoveToFolder(project.id, f.id); setShowDropdown(false); }}
                            className={`flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-bg-alt transition ${
                              project.folder_id === f.id ? 'text-accent font-medium' : 'text-text'
                            }`}
                          >
                            {project.folder_id === f.id ? <Check size={11} /> : <Folder size={11} />}
                            <span className="truncate">{f.name}</span>
                          </button>
                          {subsOf(f.id).map((sub) => (
                            <button
                              key={sub.id}
                              onClick={() => { onMoveToFolder(project.id, sub.id); setShowDropdown(false); }}
                              className={`flex w-full items-center gap-2 pl-7 pr-3 py-1.5 text-xs hover:bg-bg-alt transition ${
                                project.folder_id === sub.id ? 'text-accent font-medium' : 'text-text-muted'
                              }`}
                            >
                              {project.folder_id === sub.id
                                ? <Check size={10} className="shrink-0" />
                                : <span className="w-2.5 shrink-0" />}
                              <span className="truncate">{sub.name}</span>
                            </button>
                          ))}
                        </div>
                      ))}
                    </>
                  );
                })()}

                {/* Delete — visible to owners of non-system templates, and always to admin */}
                {(isOwner && !isSystemTemplate || isAdmin) && (
                  <>
                    <div className="my-1 border-t border-border/50" />
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-500/10 transition"
                    >
                      {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                      Delete
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ───────────────────────────────────────────────
export default function ProjectDashboard({
  projects, folders = [], loading,
  canCreateMore, maxProjects,
  onCreate, onOpen, onDelete, onRename,
  onDuplicate, onMoveToFolder, onToggleFavorite, onToggleTemplate,
  onCreateFolder, onRenameFolder, onDeleteFolder,
  onShareTemplate, onUnshareTemplate,
  onSignOut, onImportLocal, onImportWBS,
  hasLocalData, userEmail,
}) {
  const [selectedView, setSelectedView] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [namingNew, setNamingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [namingFolder, setNamingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState(null);
  const [editFolderName, setEditFolderName] = useState('');
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [namingSubFolderParentId, setNamingSubFolderParentId] = useState(null);
  const [newSubFolderName, setNewSubFolderName] = useState('');
  const [duplicating, setDuplicating] = useState(null);
  const [showWBSModal, setShowWBSModal] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [wbsText, setWbsText] = useState('');
  const [wbsName, setWbsName] = useState('Imported Project');
  const [wbsCreating, setWbsCreating] = useState(false);

  const newInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const editFolderInputRef = useRef(null);

  useEffect(() => { if (namingNew && newInputRef.current) newInputRef.current.focus(); }, [namingNew]);
  useEffect(() => { if (namingFolder && folderInputRef.current) folderInputRef.current.focus(); }, [namingFolder]);
  useEffect(() => {
    if (editingFolderId && editFolderInputRef.current) {
      editFolderInputRef.current.focus();
      editFolderInputRef.current.select();
    }
  }, [editingFolderId]);


  const handleCreate = async (name) => {
    setCreating(true);
    try {
      const folderId = (selectedView !== 'all' && selectedView !== 'favorites' && selectedView !== 'templates')
        ? selectedView : null;
      const project = await onCreate(name || 'Untitled Project', folderId);
      setNamingNew(false);
      setNewName('');
      onOpen(project.id);
    } finally { setCreating(false); }
  };

  const handleDuplicate = async (id) => {
    setDuplicating(id);
    try {
      const newProject = await onDuplicate(id);
      if (newProject) onOpen(newProject.id);
    } finally { setDuplicating(null); }
  };

  // "Use Template" on shared templates — duplicate then open, never edit the original
  const handleUseTemplate = async (id) => {
    setDuplicating(id);
    try {
      const newProject = await onDuplicate(id);
      if (newProject) onOpen(newProject.id);
    } finally { setDuplicating(null); }
  };

  const handleCreateFolder = async () => {
    const name = newFolderName.trim();
    if (!name) { setNamingFolder(false); return; }
    await onCreateFolder(name);
    setNamingFolder(false);
    setNewFolderName('');
  };

  const handleCreateSubFolder = async (parentId) => {
    const name = newSubFolderName.trim();
    if (!name) { setNamingSubFolderParentId(null); return; }
    await onCreateFolder(name, parentId);
    setNamingSubFolderParentId(null);
    setNewSubFolderName('');
  };

  const handleFolderRename = async () => {
    const name = editFolderName.trim();
    if (name && editingFolderId) await onRenameFolder(editingFolderId, name);
    setEditingFolderId(null);
    setEditFolderName('');
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
    } finally { setWbsCreating(false); }
  };

  // Derived data
  const regular = projects.filter((p) => !p.is_template);
  const favorites = regular.filter((p) => p.is_favorite);
  const sharedTemplates = projects.filter((p) => p.is_template && p.is_shared);
  const myTemplates = projects.filter((p) => p.is_template && !p.is_shared);
  const templates = [...sharedTemplates, ...myTemplates]; // for sidebar count
  const topLevelFolders = folders.filter((f) => !f.parent_id);
  const subsOf = (parentId) => folders.filter((f) => f.parent_id === parentId);

  const byFolder = useMemo(() => {
    const map = {};
    for (const p of regular) {
      const key = p.folder_id || '__none__';
      if (!map[key]) map[key] = [];
      map[key].push(p);
    }
    return map;
  }, [regular]);

  const visibleProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q) return projects.filter((p) => p.name.toLowerCase().includes(q));
    if (selectedView === 'all') return regular;
    if (selectedView === 'favorites') return favorites;
    if (selectedView === 'templates') return templates;
    return byFolder[selectedView] || [];
  }, [projects, regular, favorites, templates, byFolder, selectedView, searchQuery]);

  const sectionLabel = useMemo(() => {
    if (searchQuery.trim()) return 'Search results';
    if (selectedView === 'all') return 'All Projects';
    if (selectedView === 'favorites') return 'Favorites';
    if (selectedView === 'templates') return 'Templates';
    return folders.find((f) => f.id === selectedView)?.name || 'Projects';
  }, [selectedView, searchQuery, folders]);

  const emptyMessage = () => {
    if (searchQuery.trim()) return { title: 'No matching projects', sub: 'Try a different search term' };
    if (selectedView === 'favorites') return { title: 'No favorites yet', sub: 'Click the star on any project card to add it here' };
    if (selectedView === 'templates') return { title: 'No templates yet', sub: 'Create a template from any project\'s menu' };
    if (selectedView !== 'all') return { title: 'This folder is empty', sub: 'Move a project here from its menu, or create a new one' };
    return { title: 'No projects yet', sub: 'Create your first Fantt Chart to get started' };
  };

  const cardProps = {
    folders, userEmail, onOpen, onRename, onDelete, onMoveToFolder,
    onToggleTemplate, onToggleFavorite, onShareTemplate, onUnshareTemplate,
    onUseTemplate: handleUseTemplate,
  };

  // Sidebar nav row helper
  const navItem = (id, icon, label, count) => {
    const active = selectedView === id && !searchQuery;
    return (
      <button
        key={id}
        onClick={() => { setSelectedView(id); setSearchQuery(''); }}
        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
          active ? 'bg-accent/10 text-accent font-medium' : 'text-text-muted hover:bg-bg-alt hover:text-text'
        }`}
      >
        <div className="flex items-center gap-2.5">{icon}{label}</div>
        {count > 0 && (
          <span className={`text-[10px] tabular-nums ${active ? 'text-accent/60' : 'text-text-muted/40'}`}>
            {count}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      {/* ── Sidebar ── */}
      <aside className="w-60 shrink-0 border-r border-border bg-sidebar flex flex-col">

        {/* Brand */}
        <div className="px-4 pt-5 pb-4 shrink-0 border-b border-border/40">
          <div className="flex items-center gap-3">
            <FanttLogo size={30} />
            <div className="leading-none">
              <div className="text-[15px] font-bold tracking-tight text-text">Fantt Chart</div>
              <div className="text-[10px] text-text-muted/40 mt-0.5 font-light">by Fantasy</div>
            </div>
          </div>
        </div>

        {/* Scrollable nav */}
        <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
          {/* Search */}
          <div className="px-3 pt-4 pb-2">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted/40 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search…"
                className="w-full rounded-lg border border-border bg-bg py-2 pl-7 pr-7 text-xs text-text placeholder:text-text-muted/40 focus:border-accent focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted/40 hover:text-text-muted transition"
                >
                  <X size={11} />
                </button>
              )}
            </div>
          </div>

          {/* Nav items */}
          <div className="px-2 pb-2 space-y-0.5">
            {navItem('all', <LayoutGrid size={13} />, 'All Projects', regular.length)}
            {navItem('favorites', <Star size={13} />, 'Favorites', favorites.length)}
            {navItem('templates', <Diamond size={13} />, 'Templates', templates.length)}
          </div>

          {/* Divider */}
          {topLevelFolders.length > 0 && <div className="mx-3 border-t border-border/40 mb-2" />}

          {/* Folder list — hierarchical */}
          <div className="px-2 flex-1 space-y-0.5">
            {topLevelFolders.map((folder) => {
              const subFolders = subsOf(folder.id);
              const isExpanded = expandedFolders.has(folder.id);
              const directCount = (byFolder[folder.id] || []).length;
              const active = selectedView === folder.id && !searchQuery;
              const editing = editingFolderId === folder.id;

              return (
                <div key={folder.id}>
                  {/* Top-level folder row */}
                  <div className={`group/folder relative flex items-center rounded-lg transition ${active ? 'bg-accent/10' : 'hover:bg-bg-alt'}`}>
                    {/* Expand chevron — always present for alignment; invisible when no sub-folders */}
                    <button
                      onClick={() => setExpandedFolders((prev) => {
                        const next = new Set(prev);
                        next.has(folder.id) ? next.delete(folder.id) : next.add(folder.id);
                        return next;
                      })}
                      className={`shrink-0 pl-2 pr-0.5 py-2 transition ${
                        subFolders.length > 0
                          ? 'text-text-muted/40 hover:text-text-muted'
                          : 'text-transparent pointer-events-none'
                      }`}
                    >
                      {isExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                    </button>

                    {editing ? (
                      <form
                        onSubmit={(e) => { e.preventDefault(); handleFolderRename(); }}
                        className="flex-1 pr-2 py-1"
                      >
                        <input
                          ref={editFolderInputRef}
                          value={editFolderName}
                          onChange={(e) => setEditFolderName(e.target.value)}
                          onBlur={handleFolderRename}
                          onKeyDown={(e) => { if (e.key === 'Escape') setEditingFolderId(null); }}
                          className="w-full rounded border border-accent bg-bg px-1.5 py-0.5 text-sm text-text focus:outline-none"
                        />
                      </form>
                    ) : (
                      <>
                        <button
                          onClick={() => { setSelectedView(folder.id); setSearchQuery(''); }}
                          className={`flex flex-1 items-center gap-2 py-2 pr-2 text-sm min-w-0 ${
                            active ? 'text-accent font-medium' : 'text-text-muted'
                          }`}
                        >
                          <Folder size={12} className="shrink-0" />
                          <span className="truncate">{folder.name}</span>
                        </button>
                        {directCount > 0 && (
                          <span className="pr-2 text-[10px] text-text-muted/40 tabular-nums group-hover/folder:hidden shrink-0">
                            {directCount}
                          </span>
                        )}
                        <div className="hidden group-hover/folder:flex items-center gap-0 pr-1.5 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setNamingSubFolderParentId(folder.id);
                              setNewSubFolderName('');
                              setExpandedFolders((prev) => new Set([...prev, folder.id]));
                            }}
                            className="rounded p-1 text-text-muted/40 hover:text-text-muted transition"
                            title="Add sub-folder"
                          >
                            <Plus size={10} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditingFolderId(folder.id); setEditFolderName(folder.name); }}
                            className="rounded p-1 text-text-muted/40 hover:text-text-muted transition"
                            title="Rename"
                          >
                            <Pencil size={10} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Delete folder "${folder.name}"? All projects and sub-folders inside will become uncategorized.`)) {
                                onDeleteFolder(folder.id);
                                if (selectedView === folder.id) setSelectedView('all');
                              }
                            }}
                            className="rounded p-1 text-text-muted/40 hover:text-red-500 transition"
                            title="Delete"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Sub-folders (shown when expanded) */}
                  {isExpanded && (
                    <div className="ml-3 pl-2 border-l border-border/30 mt-0.5 mb-0.5 space-y-0.5">
                      {subFolders.map((sub) => {
                        const subActive = selectedView === sub.id && !searchQuery;
                        const subEditing = editingFolderId === sub.id;
                        const subCount = (byFolder[sub.id] || []).length;
                        return (
                          <div
                            key={sub.id}
                            className={`group/subfolder relative flex items-center rounded-lg transition ${
                              subActive ? 'bg-accent/10' : 'hover:bg-bg-alt'
                            }`}
                          >
                            {subEditing ? (
                              <form
                                onSubmit={(e) => { e.preventDefault(); handleFolderRename(); }}
                                className="flex-1 px-2 py-1"
                              >
                                <input
                                  ref={editFolderInputRef}
                                  value={editFolderName}
                                  onChange={(e) => setEditFolderName(e.target.value)}
                                  onBlur={handleFolderRename}
                                  onKeyDown={(e) => { if (e.key === 'Escape') setEditingFolderId(null); }}
                                  className="w-full rounded border border-accent bg-bg px-1.5 py-0.5 text-xs text-text focus:outline-none"
                                />
                              </form>
                            ) : (
                              <>
                                <button
                                  onClick={() => { setSelectedView(sub.id); setSearchQuery(''); }}
                                  className={`flex flex-1 items-center px-3 py-1.5 text-xs min-w-0 ${
                                    subActive ? 'text-accent font-medium' : 'text-text-muted'
                                  }`}
                                >
                                  <span className="truncate">{sub.name}</span>
                                </button>
                                {subCount > 0 && (
                                  <span className="pr-2 text-[10px] text-text-muted/40 tabular-nums group-hover/subfolder:hidden shrink-0">
                                    {subCount}
                                  </span>
                                )}
                                <div className="hidden group-hover/subfolder:flex items-center gap-0 pr-1.5 shrink-0">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setEditingFolderId(sub.id); setEditFolderName(sub.name); }}
                                    className="rounded p-1 text-text-muted/40 hover:text-text-muted transition"
                                    title="Rename"
                                  >
                                    <Pencil size={10} />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (confirm(`Delete "${sub.name}"? Projects inside will become uncategorized.`)) {
                                        onDeleteFolder(sub.id);
                                        if (selectedView === sub.id) setSelectedView('all');
                                      }
                                    }}
                                    className="rounded p-1 text-text-muted/40 hover:text-red-500 transition"
                                    title="Delete"
                                  >
                                    <X size={10} />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}

                      {/* New sub-folder input */}
                      {namingSubFolderParentId === folder.id && (
                        <div className="py-1 px-1">
                          <div className="rounded-lg border border-border bg-sidebar shadow-lg p-1.5 space-y-1">
                            <input
                              autoFocus
                              value={newSubFolderName}
                              onChange={(e) => setNewSubFolderName(e.target.value)}
                              placeholder="Sub-folder name…"
                              className="w-full rounded border border-accent bg-bg px-2 py-1 text-xs text-text focus:outline-none"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCreateSubFolder(folder.id);
                                if (e.key === 'Escape') { setNamingSubFolderParentId(null); setNewSubFolderName(''); }
                              }}
                            />
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleCreateSubFolder(folder.id)}
                                className="flex-1 rounded bg-accent py-1 text-[10px] font-medium text-white hover:opacity-90 transition"
                              >
                                Create
                              </button>
                              <button
                                onClick={() => { setNamingSubFolderParentId(null); setNewSubFolderName(''); }}
                                className="flex-1 rounded border border-border py-1 text-[10px] text-text-muted hover:bg-bg-alt transition"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* New Folder */}
          <div className="px-3 py-3 border-t border-border/40 mt-1 relative">
            {namingFolder && (
              <div className="absolute bottom-full left-2 right-2 mb-1">
                <div className="rounded-lg border border-border bg-sidebar shadow-xl p-2 space-y-1.5">
                  <input
                    ref={folderInputRef}
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Folder name…"
                    className="w-full rounded-md border border-accent bg-bg px-2.5 py-1.5 text-xs text-text focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateFolder();
                      if (e.key === 'Escape') { setNamingFolder(false); setNewFolderName(''); }
                    }}
                  />
                  <div className="flex gap-1.5">
                    <button
                      onClick={handleCreateFolder}
                      className="flex-1 rounded-md bg-accent py-1.5 text-[11px] font-medium text-white hover:opacity-90 transition"
                    >
                      Create
                    </button>
                    <button
                      onClick={() => { setNamingFolder(false); setNewFolderName(''); }}
                      className="flex-1 rounded-md border border-border py-1.5 text-[11px] text-text-muted hover:bg-bg-alt transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
            <button
              onClick={() => setNamingFolder(true)}
              className="flex items-center gap-1.5 text-xs text-text-muted/50 hover:text-text-muted transition w-full px-1"
            >
              <FolderPlus size={13} /> New Folder
            </button>
          </div>
        </div>{/* end scrollable nav */}

        {/* Bottom: theme + user + sign out */}
        <div className="shrink-0 border-t border-border/40 px-3 py-3">
          <div className="flex items-center gap-1.5">
            <span className="flex-1 truncate text-[11px] text-text-muted/50 min-w-0">{userEmail}</span>
            <button
              onClick={toggleTheme}
              className="rounded-lg p-1.5 text-text-muted/40 hover:text-text-muted hover:bg-bg-alt transition"
              title={theme === 'fantasy' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'fantasy' ? <Sun size={13} /> : <Moon size={13} />}
            </button>
            <button
              onClick={onSignOut}
              className="rounded-lg p-1.5 text-text-muted/40 hover:text-text-muted hover:bg-bg-alt transition"
              title="Sign out"
            >
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
        <main className="flex-1 overflow-y-auto">
<div className="px-6 py-6">
            {/* Section header */}
            <div className="mb-6 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-text truncate">{sectionLabel}</h2>
                <p className="text-xs text-text-muted">
                  {loading ? '…' : `${visibleProjects.length} project${visibleProjects.length !== 1 ? 's' : ''}`}
                  {!searchQuery && !loading && (
                    <span className="text-text-muted/50"> · {projects.length} / {maxProjects} total</span>
                  )}
                </p>
              </div>

              {namingNew ? (
                <form onSubmit={(e) => { e.preventDefault(); handleCreate(newName.trim()); }} className="flex items-center gap-2 shrink-0">
                  <input
                    ref={newInputRef}
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Project name…"
                    className="rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text focus:border-accent focus:outline-none w-48"
                    onKeyDown={(e) => { if (e.key === 'Escape') { setNamingNew(false); setNewName(''); } }}
                  />
                  <button type="submit" disabled={creating} className="rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition">
                    {creating ? <Loader2 size={14} className="animate-spin" /> : 'Create'}
                  </button>
                  <button type="button" onClick={() => { setNamingNew(false); setNewName(''); }} className="rounded-lg px-2 py-1.5 text-sm text-text-muted hover:bg-border/50 transition">
                    Cancel
                  </button>
                </form>
              ) : namingFolder ? (
                <form onSubmit={(e) => { e.preventDefault(); handleCreateFolder(); }} className="flex items-center gap-2 shrink-0">
                  <input
                    ref={folderInputRef}
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Folder name…"
                    className="rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text focus:border-accent focus:outline-none w-48"
                    onKeyDown={(e) => { if (e.key === 'Escape') { setNamingFolder(false); setNewFolderName(''); } }}
                  />
                  <button type="submit" className="rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90 transition">
                    Create
                  </button>
                  <button type="button" onClick={() => { setNamingFolder(false); setNewFolderName(''); }} className="rounded-lg px-2 py-1.5 text-sm text-text-muted hover:bg-border/50 transition">
                    Cancel
                  </button>
                </form>
              ) : (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => setNamingNew(true)}
                    disabled={!canCreateMore}
                    className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-muted hover:bg-bg-alt hover:border-accent/30 hover:text-text disabled:opacity-50 transition"
                  >
                    <Plus size={13} /> New Project
                  </button>
                  <button
                    onClick={() => setNamingFolder(true)}
                    className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-muted hover:bg-bg-alt hover:border-accent/30 hover:text-text transition"
                  >
                    <FolderPlus size={13} /> New Folder
                  </button>
                  <button
                    onClick={() => setShowWBSModal(true)}
                    disabled={!canCreateMore}
                    className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-muted hover:bg-bg-alt hover:border-accent/30 hover:text-text disabled:opacity-50 transition"
                  >
                    <ClipboardPaste size={13} /> Paste WBS
                  </button>
                </div>
              )}
            </div>

            {/* Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 size={24} className="animate-spin text-accent" />
              </div>
            ) : selectedView === 'templates' && !searchQuery ? (
              // ── Templates view: two sections ──
              <div className="space-y-10">
                {/* Fantasy Shared */}
                <div>
                  <div className="mb-4 flex items-center gap-3">
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-text-muted/50">Fantasy Shared</span>
                    <div className="h-px flex-1 bg-border/40" />
                  </div>
                  {sharedTemplates.length === 0 ? (
                    <p className="text-sm text-text-muted/40 py-4">No shared templates yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {sharedTemplates.map((p) => (
                        <ProjectCard key={p.id} project={p} isTemplate onDuplicate={handleDuplicate} {...cardProps} />
                      ))}
                    </div>
                  )}
                </div>

                {/* My Templates */}
                <div>
                  <div className="mb-4 flex items-center gap-3">
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-text-muted/50">My Templates</span>
                    <div className="h-px flex-1 bg-border/40" />
                  </div>
                  {myTemplates.length === 0 ? (
                    <p className="text-sm text-text-muted/40 py-4">
                      No personal templates yet. In any project's <MoreHorizontal size={12} className="inline" /> menu, choose "Create a Template."
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {myTemplates.map((p) => (
                        <ProjectCard key={p.id} project={p} isTemplate onDuplicate={handleDuplicate} {...cardProps} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : selectedView === 'all' && !searchQuery ? (
              // ── All Projects + Folders view ──
              (() => {
                const ungrouped = byFolder['__none__'] || [];
                const folderProjectCount = (folderId) => {
                  const direct = (byFolder[folderId] || []).length;
                  const subTotal = subsOf(folderId).reduce((sum, sub) => sum + (byFolder[sub.id] || []).length, 0);
                  return direct + subTotal;
                };
                return (
                  <div className="space-y-8">
                    {topLevelFolders.length > 0 && (
                      <div>
                        <div className="mb-4 flex items-center gap-3">
                          <span className="text-[11px] font-semibold uppercase tracking-widest text-text-muted/50">Folders</span>
                          <div className="h-px flex-1 bg-border/40" />
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                          {topLevelFolders.map((f) => (
                            <FolderCard
                              key={f.id}
                              folder={f}
                              projectCount={folderProjectCount(f.id)}
                              onClick={() => { setSelectedView(f.id); setSearchQuery(''); }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    {ungrouped.length > 0 && (
                      <div>
                        {topLevelFolders.length > 0 && (
                          <div className="mb-4 flex items-center gap-3">
                            <span className="text-[11px] font-semibold uppercase tracking-widest text-text-muted/50">No Folder</span>
                            <div className="h-px flex-1 bg-border/40" />
                          </div>
                        )}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                          {ungrouped.map((p) => (
                            <ProjectCard key={p.id} project={p} isTemplate={false} onDuplicate={handleDuplicate} {...cardProps} />
                          ))}
                        </div>
                      </div>
                    )}
                    {topLevelFolders.length === 0 && ungrouped.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="mb-3 text-4xl opacity-30 select-none">○</div>
                        <h3 className="text-sm font-semibold text-text-muted">No projects yet</h3>
                        <p className="mt-1 text-xs text-text-muted/60 max-w-xs">Create your first Fantt Chart to get started</p>
                      </div>
                    )}
                  </div>
                );
              })()
            ) : visibleProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="mb-3 text-4xl opacity-30 select-none">
                  {selectedView === 'favorites' ? '★' : '○'}
                </div>
                <h3 className="text-sm font-semibold text-text-muted">{emptyMessage().title}</h3>
                <p className="mt-1 text-xs text-text-muted/60 max-w-xs">{emptyMessage().sub}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {visibleProjects.map((p) => (
                  <ProjectCard
                    key={p.id}
                    project={p}
                    isTemplate={p.is_template || false}
                    onDuplicate={handleDuplicate}
                    {...cardProps}
                  />
                ))}
              </div>
            )}
          </div>
        </main>

      {/* WBS Modal */}
      {showWBSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowWBSModal(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-xl border border-border bg-sidebar p-6 shadow-xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text">Paste Workback Schedule</h3>
              <button onClick={() => setShowWBSModal(false)} className="rounded-lg p-1 text-text-muted hover:bg-border/50 transition">
                <X size={18} />
              </button>
            </div>
            <label className="block text-xs font-medium text-text-muted mb-1">Project Name</label>
            <input
              type="text"
              value={wbsName}
              onChange={(e) => setWbsName(e.target.value)}
              className="mb-4 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
            />
            <label className="block text-xs font-medium text-text-muted mb-1">Paste bulleted schedule</label>
            <textarea
              value={wbsText}
              onChange={(e) => setWbsText(e.target.value)}
              placeholder={"• 3/15: Kickoff Meeting\n• 3/15-3/22: UX Strategy\n• 3/22-4/5: Design Phase"}
              rows={8}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text font-mono focus:border-accent focus:outline-none resize-y"
            />
            <p className="mt-2 text-xs text-text-muted">
              {parsedWBSTasks.length === 0
                ? 'No tasks found — use format: • M/D-M/D: Task Name'
                : `${parsedWBSTasks.length} task${parsedWBSTasks.length !== 1 ? 's' : ''} found`}
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button onClick={() => setShowWBSModal(false)} className="rounded-lg px-3 py-1.5 text-sm text-text-muted hover:bg-border/50 transition">
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

      {/* Duplicating overlay */}
      {duplicating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-sidebar px-6 py-4 shadow-xl">
            <Loader2 size={18} className="animate-spin text-accent" />
            <span className="text-sm font-medium text-text">Duplicating project…</span>
          </div>
        </div>
      )}
    </div>
  );
}
