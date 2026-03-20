export default function FanttLogo({ size = 20, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      {/* Three horizontal bars resembling a Gantt chart / letter F rotated */}
      <rect x="3" y="4" width="18" height="3.5" rx="1.75" fill="currentColor" />
      <rect x="3" y="10.25" width="12" height="3.5" rx="1.75" fill="currentColor" opacity="0.7" />
      <rect x="3" y="16.5" width="8" height="3.5" rx="1.75" fill="currentColor" opacity="0.45" />
    </svg>
  );
}
