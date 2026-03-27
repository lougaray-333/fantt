import { useRef, useState, useEffect } from 'react';

export default function ViewModeToggle({ viewMode, onChange }) {
  const modes = [
    { key: 'day', label: 'Day' },
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
  ];

  const containerRef = useRef(null);
  const buttonRefs = useRef([]);
  const [pill, setPill] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const idx = modes.findIndex((m) => m.key === viewMode);
    const btn = buttonRefs.current[idx];
    const container = containerRef.current;
    if (btn && container) {
      const cRect = container.getBoundingClientRect();
      const bRect = btn.getBoundingClientRect();
      setPill({ left: bRect.left - cRect.left, width: bRect.width });
    }
  }, [viewMode]);

  return (
    <div ref={containerRef} className="relative inline-flex rounded-lg border border-border bg-bg p-[3px]">
      {/* Sliding background pill */}
      <div
        className="absolute top-[3px] bottom-[3px] rounded-md bg-accent transition-all duration-200 ease-out"
        style={{ left: pill.left, width: pill.width }}
      />
      {modes.map((m, i) => (
        <button
          key={m.key}
          ref={(el) => { buttonRefs.current[i] = el; }}
          onClick={() => onChange(m.key)}
          className={`relative z-10 rounded-md px-3 py-1 text-xs font-medium transition-colors duration-200 ${
            viewMode === m.key
              ? 'text-white'
              : 'text-text-muted hover:text-text'
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
