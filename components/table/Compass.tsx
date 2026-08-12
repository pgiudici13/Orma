export function Compass({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 100 100"
      className={className}
      style={{ filter: "drop-shadow(0 10px 14px rgba(15, 12, 4, 0.45))" }}
    >
      <circle cx="50" cy="50" r="46" fill="var(--metal-base)" />
      <circle
        cx="50"
        cy="50"
        r="40"
        fill="color-mix(in srgb, var(--paper-base) 92%, var(--metal-base) 8%)"
      />
      <circle
        cx="50"
        cy="50"
        r="40"
        fill="none"
        stroke="var(--ink)"
        strokeWidth="0.75"
      />
      {Array.from({ length: 16 }).map((_, i) => {
        const angle = (i * Math.PI) / 8;
        const long = i % 4 === 0;
        const r1 = 40;
        const r2 = long ? 33 : 36;
        const x1 = 50 + r1 * Math.sin(angle);
        const y1 = 50 - r1 * Math.cos(angle);
        const x2 = 50 + r2 * Math.sin(angle);
        const y2 = 50 - r2 * Math.cos(angle);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="var(--ink)"
            strokeWidth={long ? 1.1 : 0.6}
          />
        );
      })}
      <polygon points="50,16 56,50 50,46" fill="var(--accent)" />
      <polygon points="50,84 44,50 50,54" fill="var(--ink)" />
      <circle cx="50" cy="50" r="3" fill="var(--ink)" />
      <text
        x="50"
        y="13"
        textAnchor="middle"
        fontSize="6"
        fill="var(--ink)"
        style={{ fontFamily: "var(--font-serif)" }}
      >
        N
      </text>
    </svg>
  );
}
