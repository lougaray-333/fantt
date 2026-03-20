import { useState } from 'react';
import { Mail, ArrowRight, Loader2 } from 'lucide-react';
import FanttLogo from './FanttLogo';

export default function AuthGate({ onSignIn }) {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSending(true);
    setError('');
    try {
      await onSignIn(email.trim());
      setSent(true);
    } catch (err) {
      setError(err.message || 'Failed to send magic link');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <FanttLogo size={44} className="mx-auto text-accent" />
          <h1 className="mt-3 text-2xl font-bold text-text">Fantt Chart</h1>
          <p className="mt-1 text-sm text-text-muted">
            Plan your projects with style
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-border bg-sidebar p-6 shadow-sm">
          {sent ? (
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                <Mail size={24} className="text-accent" />
              </div>
              <h2 className="text-lg font-semibold text-text">Check your email</h2>
              <p className="mt-2 text-sm text-text-muted">
                We sent a magic link to <span className="font-medium text-text">{email}</span>
              </p>
              <p className="mt-1 text-xs text-text-muted/70">
                Click the link in the email to sign in
              </p>
              <button
                onClick={() => { setSent(false); setEmail(''); }}
                className="mt-4 text-sm font-medium text-accent hover:underline"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <label className="mb-1.5 block text-sm font-medium text-text">
                Email address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-border bg-bg py-2.5 pl-9 pr-3 text-sm text-text placeholder:text-text-muted/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  disabled={sending}
                />
              </div>
              {error && (
                <p className="mt-2 text-xs text-red-500">{error}</p>
              )}
              <button
                type="submit"
                disabled={sending || !email.trim()}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition"
              >
                {sending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send Magic Link
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
