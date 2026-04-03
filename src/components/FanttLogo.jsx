export default function FanttLogo({ size = 20, color, className = '' }) {
  const fill = color || 'var(--color-logo-start)';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      {/* Fantasy cushion mark — rounded square rotated 45° */}
      <rect
        x="5"
        y="5"
        width="14"
        height="14"
        rx="4"
        fill={fill}
        transform="rotate(45 12 12)"
      />
    </svg>
  );
}
