import { useState } from 'react';
import { Bug, X, Send, Loader2, Check } from 'lucide-react';
import { supabase, isConfigured } from '../lib/supabase';

function playBugClick() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(280, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.18);
  } catch (_) {}
}

export default function BugReportButton() {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null); // 'in' | 'out' | null
  const [form, setForm] = useState({
    reporter_name: '',
    replication_steps: '',
    actual_result: '',
    expected_result: '',
  });

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const canSubmit =
    form.reporter_name.trim() &&
    form.replication_steps.trim() &&
    form.actual_result.trim() &&
    form.expected_result.trim();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);

    if (isConfigured) {
      const { error } = await supabase.from('bug_reports').insert({
        reporter_name: form.reporter_name.trim(),
        replication_steps: form.replication_steps.trim(),
        actual_result: form.actual_result.trim(),
        expected_result: form.expected_result.trim(),
        status: 'open',
        created_at: new Date().toISOString(),
      });
      if (error) {
        console.error('Bug report insert failed:', error);
      }
    }

    setSubmitting(false);
    setForm({ reporter_name: '', replication_steps: '', actual_result: '', expected_result: '' });
    setOpen(false);
    setToast('in');
    setTimeout(() => setToast('out'), 2500);
    setTimeout(() => setToast(null), 2900);
  };

  return (
    <>
      {/* Floating bug button */}
      <button
        onClick={() => { playBugClick(); setOpen(true); }}
        className="fixed bottom-5 right-5 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-sidebar shadow-lg text-text-muted hover:text-accent hover:border-accent transition"
        title="Report a bug"
      >
        <Bug size={18} />
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[440px] rounded-xl border border-border bg-bg shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <Bug size={16} className="text-red-400" />
                <h2 className="text-sm font-bold text-text">Report a Bug</h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-text-muted hover:bg-bg-alt hover:text-text"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 p-5">
              <div>
                <label className="mb-1 block text-xs font-medium text-text-muted">Your Name</label>
                <input
                  type="text"
                  value={form.reporter_name}
                  onChange={handleChange('reporter_name')}
                  placeholder="Name"
                  className="w-full rounded-lg border border-border bg-bg-alt px-3 py-2 text-sm text-text placeholder:text-text-muted/50 focus:border-accent focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-text-muted">Steps to Replicate</label>
                <textarea
                  value={form.replication_steps}
                  onChange={handleChange('replication_steps')}
                  placeholder="1. Go to...&#10;2. Click on...&#10;3. Observe..."
                  rows={3}
                  className="w-full rounded-lg border border-border bg-bg-alt px-3 py-2 text-sm text-text placeholder:text-text-muted/50 focus:border-accent focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-text-muted">Actual Result</label>
                <textarea
                  value={form.actual_result}
                  onChange={handleChange('actual_result')}
                  placeholder="What happened?"
                  rows={2}
                  className="w-full rounded-lg border border-border bg-bg-alt px-3 py-2 text-sm text-text placeholder:text-text-muted/50 focus:border-accent focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-text-muted">Expected Result</label>
                <textarea
                  value={form.expected_result}
                  onChange={handleChange('expected_result')}
                  placeholder="What should have happened?"
                  rows={2}
                  className="w-full rounded-lg border border-border bg-bg-alt px-3 py-2 text-sm text-text placeholder:text-text-muted/50 focus:border-accent focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-border px-4 py-1.5 text-sm font-medium text-text-muted hover:bg-bg-alt"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit || submitting}
                  className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40"
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Submit Bug
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success toast */}
      {toast && (
        <div
          className="fixed bottom-5 right-20 z-50 flex items-center gap-2 rounded-lg border border-border bg-sidebar px-3 py-2 shadow-lg"
          style={{
            animation: toast === 'in'
              ? 'fantt-toast-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
              : 'fantt-toast-out 0.3s ease-in forwards',
          }}
        >
          <Check size={12} className="text-green-500" />
          <span className="text-xs text-text-muted">Bug report submitted</span>
        </div>
      )}
    </>
  );
}
