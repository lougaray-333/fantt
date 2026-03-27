export default function ViewModeToggle({ viewMode, onChange }) {
  const modes = [
    { key: 'day', label: 'Day' },
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
  ];

  const activeIndex = modes.findIndex((m) => m.key === viewMode);

  return (
    <div className="relative inline-flex rounded-lg border border-border bg-bg p-[3px]">
      {/* Sliding background pill */}
      <div
        className="absolute top-[3px] bottom-[3px] rounded-md bg-accent transition-all duration-200 ease-out"
        style={{
          width: `calc(${100 / modes.length}% - ${activeIndex === 0 ? 3 : activeIndex === modes.length - 1 ? 3 : 2}px)`,
          left: activeIndex === 0
            ? '3px'
            : `calc(${(activeIndex / modes.length) * 100}% + ${activeIndex === modes.length - 1 ? 0 : 1}px)`,
        }}
      />
      {modes.map((m) => (
        <button
          key={m.key}
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
