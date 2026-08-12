export function Pencil({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 240 28"
      className={className}
      style={{ filter: "drop-shadow(0 6px 8px rgba(15, 12, 4, 0.4))" }}
    >
      <rect x="20" y="8" width="190" height="12" fill="var(--wood-base)" />
      <rect
        x="20"
        y="8"
        width="190"
        height="4"
        fill="color-mix(in srgb, var(--wood-base) 60%, white 20%)"
      />
      <polygon points="210,8 235,14 210,20" fill="var(--wood-dark)" />
      <rect x="228" y="12" width="8" height="4" fill="var(--ink)" />
      <rect x="0" y="8" width="22" height="12" fill="var(--metal-base)" />
      <rect
        x="0"
        y="8"
        width="22"
        height="4"
        fill="color-mix(in srgb, var(--metal-base) 70%, white 20%)"
      />
    </svg>
  );
}
