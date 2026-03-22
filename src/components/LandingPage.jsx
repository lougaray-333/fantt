import { useEffect, useRef } from 'react';
import { BarChart2, List, Users, Save } from 'lucide-react';
import FanttLogo from './FanttLogo';

function FadeInSection({ children, className = '' }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.animation = 'fantt-fade-in-up 0.6s ease-out forwards';
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className} style={{ opacity: 0 }}>
      {children}
    </div>
  );
}

const FEATURES = [
  {
    icon: BarChart2,
    title: 'Gantt Chart View',
    description: 'Drag, resize, and connect tasks with dependencies. See your project timeline at a glance.',
  },
  {
    icon: List,
    title: 'List View',
    description: 'Asana-style inline editing. Group tasks by phase, double-click to edit, track hours.',
  },
  {
    icon: Users,
    title: 'Collaboration',
    description: 'Assign team members with per-person hours/day. Track effort across your project.',
  },
  {
    icon: Save,
    title: 'Auto-save',
    description: 'Real-time persistence to the cloud. Never lose your work — everything saves automatically.',
  },
];

const STEPS = [
  { num: '1', title: 'Enter your email', description: 'Quick sign-in with just your email address.' },
  { num: '2', title: 'Create a project', description: 'Name your project and start building your timeline.' },
  { num: '3', title: 'Start planning', description: 'Add tasks, assign people, and visualize your schedule.' },
];

export default function LandingPage({ onGetStarted }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Hero */}
      <section className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <FadeInSection>
          <div className="mb-6 flex items-center justify-center gap-3">
            <FanttLogo size={48} />
            <h1 className="text-5xl font-bold tracking-tight">
              Fantt
            </h1>
          </div>
          <p className="mx-auto max-w-lg text-xl text-white/60">
            Plan your projects with style
          </p>
          <p className="mx-auto mt-3 max-w-md text-sm text-white/40">
            Beautiful Gantt charts, list views, and team collaboration — all in one place.
          </p>
          <button
            onClick={onGetStarted}
            className="mt-8 rounded-xl bg-[#ba9634] px-8 py-3 text-base font-semibold text-white shadow-lg shadow-[#ba9634]/20 hover:bg-[#d4aa3c] transition-all hover:shadow-xl hover:shadow-[#ba9634]/30"
          >
            Get Started
          </button>
        </FadeInSection>
      </section>

      {/* Features */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <FadeInSection className="mb-12 text-center">
            <h2 className="text-3xl font-bold">Everything you need</h2>
            <p className="mt-2 text-white/50">Powerful project planning, beautifully simple.</p>
          </FadeInSection>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {FEATURES.map((f, i) => (
              <FadeInSection key={i}>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 hover:border-[#ba9634]/30 transition">
                  <f.icon size={24} className="text-[#ba9634]" />
                  <h3 className="mt-3 text-lg font-semibold">{f.title}</h3>
                  <p className="mt-1.5 text-sm text-white/50">{f.description}</p>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <FadeInSection className="mb-12 text-center">
            <h2 className="text-3xl font-bold">How it works</h2>
            <p className="mt-2 text-white/50">Three steps to your first project.</p>
          </FadeInSection>

          <div className="flex flex-col gap-8 sm:flex-row sm:gap-6">
            {STEPS.map((s, i) => (
              <FadeInSection key={i} className="flex-1">
                <div className="text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#ba9634]/20 text-sm font-bold text-[#ba9634]">
                    {s.num}
                  </div>
                  <h3 className="mt-3 text-base font-semibold">{s.title}</h3>
                  <p className="mt-1 text-sm text-white/50">{s.description}</p>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="px-6 py-24 text-center">
        <FadeInSection>
          <h2 className="text-3xl font-bold">Ready to plan?</h2>
          <p className="mt-2 text-white/50">Start building your project timeline today.</p>
          <button
            onClick={onGetStarted}
            className="mt-6 rounded-xl bg-[#ba9634] px-8 py-3 text-base font-semibold text-white shadow-lg shadow-[#ba9634]/20 hover:bg-[#d4aa3c] transition-all hover:shadow-xl hover:shadow-[#ba9634]/30"
          >
            Get Started
          </button>
        </FadeInSection>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-6 text-center text-xs text-white/30">
        Fantt — Project planning with style
      </footer>
    </div>
  );
}
