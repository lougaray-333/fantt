export default function FanttLogo({ size = 20, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <defs>
        <linearGradient id="fantt-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--color-logo-start)" />
          <stop offset="100%" stopColor="var(--color-logo-end)" />
        </linearGradient>
      </defs>
      {/* Three horizontal bars resembling a Gantt chart / letter F rotated */}
      <rect x="3" y="4" width="18" height="3.5" rx="1.75" fill="url(#fantt-logo-grad)" />
      <rect x="3" y="10.25" width="12" height="3.5" rx="1.75" fill="url(#fantt-logo-grad)" opacity="0.7" />
      <rect x="3" y="16.5" width="8" height="3.5" rx="1.75" fill="url(#fantt-logo-grad)" opacity="0.45" />
    </svg>
  );
}
