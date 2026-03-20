export default function ViewModeToggle({ viewMode, onChange }) {
  const modes = [
    { key: 'day', label: 'Day' },
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
  ];

  return (
    <div className="inline-flex rounded-lg border border-border bg-bg-alt p-0.5">
      {modes.map((m) => (
        <button
          key={m.key}
          onClick={() => onChange(m.key)}
          className={`rounded-md px-3 py-1 text-xs font-medium transition ${
            viewMode === m.key
              ? 'bg-accent text-white shadow-sm'
              : 'text-text-muted hover:text-text'
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
