import { useEffect, useRef } from 'react';
import FanttLogo from './FanttLogo';

function FadeIn({ children, className = '', delay = 0 }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.animation = `fantt-fade-in-up 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms forwards`;
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);
  return (
    <div ref={ref} className={className} style={{ opacity: 0 }}>
      {children}
    </div>
  );
}

const FEATURES = [
  {
    num: '01',
    title: 'Timeline',
    description: 'Visual Gantt charts with drag-and-drop scheduling, task dependencies, and milestone tracking.',
  },
  {
    num: '02',
    title: 'Resources',
    description: 'Budget grids, rate cards, and out-of-pocket expense tracking synced to your timeline.',
  },
  {
    num: '03',
    title: 'Share',
    description: 'Live client-facing links with view-only Gantt access. No login required for stakeholders.',
  },
];

export default function LandingPage({ onGetStarted }) {
  return (
    <div className="min-h-screen bg-black text-white" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-2.5">
          <FanttLogo size={22} color="#E52222" />
          <span className="text-sm font-light tracking-[0.2em] uppercase text-white/70">Fantt</span>
        </div>
        <button
          onClick={onGetStarted}
          className="rounded-full border border-white/20 px-5 py-2 text-xs font-medium text-white/60 tracking-wide hover:border-white/50 hover:text-white transition-all"
        >
          Get Started
        </button>
      </nav>

      {/* Hero */}
      <section className="flex min-h-screen flex-col justify-end px-8 pb-20 pt-32 md:px-16 lg:px-24">
        <FadeIn delay={0}>
          <p className="mb-6 text-xs font-medium tracking-[0.3em] uppercase text-white/30">
            Project Planning
          </p>
        </FadeIn>
        <FadeIn delay={80}>
          <h1 className="max-w-4xl text-[clamp(3rem,8vw,7rem)] font-black leading-[0.92] tracking-tight text-white">
            Plan with<br />
            <span style={{ color: '#E52222' }}>Clarity.</span>
          </h1>
        </FadeIn>
        <FadeIn delay={160} className="mt-10 flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <p className="max-w-sm text-base font-light leading-relaxed text-white/40">
            Gantt charts, resource grids, and workback schedules — purpose-built for project teams at Fantasy.
          </p>
          <button
            onClick={onGetStarted}
            className="shrink-0 self-start rounded-full border border-white/25 px-8 py-3.5 text-sm font-medium text-white hover:bg-white hover:text-black transition-all duration-300"
          >
            Get Started →
          </button>
        </FadeIn>
      </section>

      {/* Divider */}
      <div className="mx-8 border-t border-white/[0.08] md:mx-16 lg:mx-24" />

      {/* Features */}
      <section className="px-8 py-24 md:px-16 lg:px-24">
        <div className="grid grid-cols-1 gap-0 sm:grid-cols-3">
          {FEATURES.map((f, i) => (
            <FadeIn key={i} delay={i * 80}>
              <div className={`py-10 pr-12 ${i > 0 ? 'sm:border-l border-white/[0.08] sm:pl-12' : ''}`}>
                <p className="mb-4 text-xs font-medium tracking-[0.3em] uppercase text-white/25">{f.num}</p>
                <h3 className="mb-3 text-xl font-bold text-white">{f.title}</h3>
                <p className="text-sm font-light leading-relaxed text-white/40">{f.description}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="mx-8 border-t border-white/[0.08] md:mx-16 lg:mx-24" />

      {/* CTA */}
      <section className="px-8 py-24 md:px-16 lg:px-24">
        <FadeIn>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-3xl font-black tracking-tight text-white">
              Ready to start?
            </h2>
            <button
              onClick={onGetStarted}
              className="shrink-0 self-start rounded-full bg-[#E52222] px-8 py-3.5 text-sm font-semibold text-white hover:bg-[#cc1a1a] transition-all"
            >
              Get Started →
            </button>
          </div>
        </FadeIn>
      </section>

      {/* Footer */}
      <footer className="mx-8 border-t border-white/[0.08] px-0 py-8 md:mx-16 lg:mx-24">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FanttLogo size={16} color="#E52222" />
            <span className="text-xs font-light tracking-[0.15em] uppercase text-white/25">Fantt</span>
          </div>
          <p className="text-xs text-white/20">A Fantasy product</p>
        </div>
      </footer>

    </div>
  );
}
