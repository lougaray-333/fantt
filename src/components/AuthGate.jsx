import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import FanttLogo from './FanttLogo';

export default function AuthGate({ onEnter }) {
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    onEnter(email.trim());
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-6">
      {/* Logo */}
      <div className="mb-10 flex flex-col items-center gap-3">
        <FanttLogo size={44} color="#E52222" />
        <span className="text-xs font-light tracking-[0.3em] uppercase text-white/40">Fantt</span>
      </div>

      {/* Form */}
      <div className="w-full max-w-xs">
        <p className="mb-6 text-center text-sm font-light text-white/40">
          Enter your email to continue
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@fantasy.co"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-white/30 focus:outline-none transition"
          />
          <button
            type="submit"
            disabled={!email.trim()}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#E52222] py-3 text-sm font-semibold text-white hover:bg-[#cc1a1a] disabled:opacity-30 transition"
          >
            Continue
            <ArrowRight size={15} />
          </button>
        </form>
      </div>

      {/* Footer */}
      <p className="absolute bottom-8 text-xs text-white/15 tracking-wide">
        A Fantasy product
      </p>
    </div>
  );
}
