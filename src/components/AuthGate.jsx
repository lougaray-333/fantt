import { useState } from 'react';
import { Mail, ArrowRight } from 'lucide-react';
import FanttLogo from './FanttLogo';

export default function AuthGate({ onEnter }) {
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    onEnter(email.trim());
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <FanttLogo size={44} className="mx-auto" />
          <h1 className="mt-3 text-2xl font-bold text-text">Fantt Chart</h1>
          <p className="mt-1 text-sm text-text-muted">
            Plan your projects with style
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-border bg-sidebar p-6 shadow-sm">
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
              />
            </div>
            <button
              type="submit"
              disabled={!email.trim()}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition"
            >
              Get Started
              <ArrowRight size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
