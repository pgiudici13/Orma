export function Calendar({
  day,
  month,
  className = "",
}: {
  day: string;
  month: string;
  className?: string;
}) {
  return (
    <div
      className={`relative w-32 rounded-[2px] p-3 ${className}`}
      style={{
        backgroundColor: "var(--paper-base)",
        color: "var(--ink)",
        boxShadow: "0 12px 20px -12px rgba(20, 14, 6, 0.5)",
        border:
          "1px solid color-mix(in srgb, var(--wood-dark) 22%, transparent)",
      }}
    >
      <span
        aria-hidden
        className="absolute -top-2 left-1/2 h-4 w-10 -translate-x-1/2 rounded-[1px]"
        style={{ backgroundColor: "var(--metal-base)", opacity: 0.85 }}
      />
      <p
        className="font-sans text-[10px] tracking-[0.14em] uppercase"
        style={{ color: "var(--ink-muted)" }}
      >
        {month}
      </p>
      <p className="font-serif text-4xl leading-none">{day}</p>
      <div
        aria-hidden
        className="mt-3 space-y-1.5"
        style={{ color: "color-mix(in srgb, var(--ink) 25%, transparent)" }}
      >
        <div className="h-px w-full bg-current" />
        <div className="h-px w-full bg-current" />
        <div className="h-px w-3/4 bg-current" />
      </div>
    </div>
  );
}
