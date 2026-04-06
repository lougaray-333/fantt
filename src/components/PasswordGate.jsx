import { useState } from 'react';
import FanttLogo from './FanttLogo';
import { Eye, EyeOff } from 'lucide-react';

const SITE_PASSWORD = import.meta.env.VITE_SITE_PASSWORD;
const AUTH_KEY = 'fantt-site-auth';

export function isSiteAuthed() {
  if (!SITE_PASSWORD) return true; // no password set — open access
  return localStorage.getItem(AUTH_KEY) === btoa(SITE_PASSWORD);
}

export function clearSiteAuth() {
  localStorage.removeItem(AUTH_KEY);
}

export default function PasswordGate({ onAuthed }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);
  const [show, setShow] = useState(false);
  const [shaking, setShaking] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (value === SITE_PASSWORD) {
      localStorage.setItem(AUTH_KEY, btoa(SITE_PASSWORD));
      onAuthed();
    } else {
      setError(true);
      setShaking(true);
      setValue('');
      setTimeout(() => setShaking(false), 500);
    }
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-bg px-4">
      <div
        className={`w-full max-w-sm ${shaking ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}
        style={shaking ? { animation: 'fantt-shake 0.4s ease-in-out' } : {}}
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-1 mb-8">
          <FanttLogo size={36} />
          <div className="mt-2 text-center">
            <p className="text-base font-bold tracking-tight text-text">Fantt Chart</p>
            <p className="text-[11px] text-text-muted/60 mt-0.5">Created by Fantasy</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-border bg-sidebar p-6 shadow-xl">
          <h2 className="text-sm font-semibold text-text mb-1">Beta access</h2>
          <p className="text-xs text-text-muted mb-5">Enter the password to continue.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                value={value}
                onChange={(e) => { setValue(e.target.value); setError(false); }}
                placeholder="Password"
                autoFocus
                className={`w-full rounded-lg border px-3 py-2.5 pr-10 text-sm bg-bg text-text placeholder:text-text-muted/40 outline-none transition
                  ${error ? 'border-red-500/60 focus:border-red-500' : 'border-border focus:border-accent'}`}
              />
              <button
                type="button"
                onClick={() => setShow(s => !s)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted/50 hover:text-text-muted transition"
                tabIndex={-1}
              >
                {show ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {error && (
              <p className="text-xs text-red-500 -mt-1">Incorrect password. Try again.</p>
            )}

            <button
              type="submit"
              disabled={!value}
              className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
