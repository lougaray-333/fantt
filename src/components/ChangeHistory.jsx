import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { supabase, isConfigured } from '../lib/supabase';

function relativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function initials(name) {
  if (!name) return '?';
  const parts = name.split(/[\s@.]+/).filter(Boolean);
  return (parts[0]?.[0] || '?').toUpperCase();
}

function describeChange(entry) {
  const { change_type, changed_fields } = entry;
  if (change_type === 'create') return 'created';
  if (change_type === 'delete') return 'deleted';
  if (change_type === 'move') {
    const d = changed_fields?.dates;
    if (d) return `moved · ${d.from.start} → ${d.to.start}`;
    return 'moved';
  }
  if (change_type === 'update' && changed_fields) {
    const fields = Object.keys(changed_fields).join(', ');
    return `updated ${fields}`;
  }
  return change_type;
}

export default function ChangeHistory({ projectId, onClose }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConfigured || !projectId) { setLoading(false); return; }

    supabase
      .from('task_history')
      .select('*')
      .eq('project_id', projectId)
      .order('changed_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setEntries(data || []);
        setLoading(false);
      });

    // Subscribe to new history entries in real time
    const ch = supabase
      .channel(`history:${projectId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'task_history',
        filter: `project_id=eq.${projectId}`,
      }, ({ new: row }) => {
        setEntries(prev => [row, ...prev].slice(0, 50));
      })
      .subscribe();

    return () => supabase.removeChannel(ch);
  }, [projectId]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        style={{ animation: 'fantt-backdrop-in 0.25s ease-out forwards' }}
      />

      {/* Panel */}
      <div
        className="fixed right-0 top-0 z-50 flex h-full w-80 flex-col border-l border-border bg-sidebar shadow-xl"
        style={{ animation: 'fantt-slide-in 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3 shrink-0">
          <h2 className="text-sm font-bold text-text">Change History</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-text-muted hover:bg-bg-alt transition">
            <X size={18} />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-accent" />
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center px-6">
              <p className="text-sm text-text-muted">No changes recorded yet.</p>
              <p className="text-xs text-text-muted/60">Changes appear here as you and collaborators edit the project.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {entries.map((entry) => (
                <li key={entry.id} className="flex items-start gap-3 px-4 py-3">
                  {/* Avatar */}
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-[10px] font-bold text-accent">
                    {initials(entry.changed_by)}
                  </div>
                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-text leading-snug">
                      <span className="font-semibold">{entry.changed_by || 'Unknown'}</span>
                      {' · '}
                      {describeChange(entry)}
                    </p>
                    {entry.task_name && (
                      <p className="text-[11px] text-text-muted truncate mt-0.5">"{entry.task_name}"</p>
                    )}
                    <p className="text-[10px] text-text-muted/60 mt-0.5">{relativeTime(entry.changed_at)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-4 py-3 shrink-0">
          <p className="text-[10px] text-text-muted/60 text-center">Last 50 changes · Live updated</p>
        </div>
      </div>
    </>
  );
}
