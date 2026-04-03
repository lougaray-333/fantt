import { useState, useEffect } from 'react';
import { X, Link2, Copy, Check, RefreshCw, BarChart2, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function SharePanel({ projectId, projectName, onClose }) {
  const [tab, setTab] = useState('link');
  const [shareToken, setShareToken] = useState(null);
  const [shareEnabled, setShareEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showRegenConfirm, setShowRegenConfirm] = useState(false);

  // Fetch current share state for this project
  useEffect(() => {
    async function fetchShareState() {
      const { data, error } = await supabase
        .from('projects')
        .select('share_token, share_enabled')
        .eq('id', projectId)
        .single();

      if (!error && data) {
        setShareToken(data.share_token);
        setShareEnabled(data.share_enabled ?? false);
      }
      setLoading(false);
    }
    fetchShareState();
  }, [projectId]);

  const shareUrl = shareToken
    ? `${window.location.origin}/#/share/${shareToken}`
    : null;

  async function handleToggleEnable() {
    setSaving(true);
    const newEnabled = !shareEnabled;

    if (newEnabled && !shareToken) {
      // First time enabling — generate a token
      const token = crypto.randomUUID();
      const { error } = await supabase
        .from('projects')
        .update({ share_token: token, share_enabled: true })
        .eq('id', projectId);

      if (!error) {
        setShareToken(token);
        setShareEnabled(true);
      }
    } else {
      // Just toggle enabled/disabled (preserve existing token)
      const { error } = await supabase
        .from('projects')
        .update({ share_enabled: newEnabled })
        .eq('id', projectId);

      if (!error) setShareEnabled(newEnabled);
    }
    setSaving(false);
  }

  async function handleRegenerate() {
    setSaving(true);
    const token = crypto.randomUUID();
    const { error } = await supabase
      .from('projects')
      .update({ share_token: token, share_enabled: true })
      .eq('id', projectId);

    if (!error) {
      setShareToken(token);
      setShareEnabled(true);
    }
    setShowRegenConfirm(false);
    setSaving(false);
  }

  function handleCopy() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3 shrink-0">
        <h2 className="text-sm font-bold text-text">Share</h2>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-text-muted hover:bg-bg-alt transition"
        >
          <X size={18} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border shrink-0">
        {['link', 'analytics'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-xs font-semibold capitalize transition ${
              tab === t
                ? 'border-b-2 border-accent text-accent'
                : 'text-text-muted hover:text-text'
            }`}
          >
            {t === 'link' ? 'Link' : 'Analytics'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">

        {/* ── Link tab ── */}
        {tab === 'link' && (
          <div className="flex flex-col gap-5">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 size={18} className="animate-spin text-text-muted" />
              </div>
            ) : (
              <>
                {/* Enable toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-text">Client share link</p>
                    <p className="text-xs text-text-muted mt-0.5">View-only · Gantt only · No budget</p>
                  </div>
                  <button
                    onClick={handleToggleEnable}
                    disabled={saving}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                      shareEnabled ? 'bg-accent' : 'bg-border'
                    } disabled:opacity-50`}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                        shareEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* URL + actions (only when enabled) */}
                {shareEnabled && shareUrl && (
                  <>
                    {/* URL box */}
                    <div className="rounded-lg border border-border bg-bg-alt p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Link2 size={12} className="text-accent shrink-0" />
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">Live link</span>
                      </div>
                      <p className="text-xs text-text break-all leading-relaxed">{shareUrl}</p>
                    </div>

                    {/* Copy button */}
                    <button
                      onClick={handleCopy}
                      className="flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-xs font-semibold text-white hover:opacity-90 transition"
                    >
                      {copied ? <Check size={13} /> : <Copy size={13} />}
                      {copied ? 'Copied!' : 'Copy link'}
                    </button>

                    {/* Regenerate */}
                    {!showRegenConfirm ? (
                      <button
                        onClick={() => setShowRegenConfirm(true)}
                        className="flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-xs font-medium text-text-muted hover:bg-bg-alt transition"
                      >
                        <RefreshCw size={12} />
                        Regenerate link
                      </button>
                    ) : (
                      <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 flex flex-col gap-3">
                        <div className="flex items-start gap-2">
                          <AlertTriangle size={13} className="text-red-500 mt-0.5 shrink-0" />
                          <p className="text-xs text-text-muted leading-relaxed">
                            The current link will stop working immediately. Anyone using it will lose access.
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleRegenerate}
                            disabled={saving}
                            className="flex-1 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 transition disabled:opacity-50"
                          >
                            {saving ? 'Regenerating…' : 'Yes, regenerate'}
                          </button>
                          <button
                            onClick={() => setShowRegenConfirm(false)}
                            className="flex-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-muted hover:bg-bg-alt transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Disabled state hint */}
                {!shareEnabled && shareToken && (
                  <p className="text-xs text-text-muted text-center">
                    Link is disabled. Toggle on to re-enable — your previous link will be restored.
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Analytics tab ── */}
        {tab === 'analytics' && (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <BarChart2 size={32} className="text-border" />
            <p className="text-sm font-semibold text-text">Analytics coming soon</p>
            <p className="text-xs text-text-muted max-w-[200px] leading-relaxed">
              View counts, unique visitors, location data, and interaction tracking will appear here.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border px-4 py-3 shrink-0">
        <p className="text-[10px] text-text-muted/60 text-center">
          Shared views are read-only and do not include budget data
        </p>
      </div>
    </div>
  );
}
