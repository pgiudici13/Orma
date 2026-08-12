export function LooseSheet({
  note,
  className = "",
}: {
  note: string;
  className?: string;
}) {
  return (
    <div
      className={`relative w-32 rounded-[1px] p-2.5 ${className}`}
      style={{
        backgroundColor: "var(--paper-aged)",
        color: "var(--ink)",
        boxShadow: "0 8px 14px -10px rgba(20, 14, 6, 0.5)",
        backgroundImage:
          "repeating-linear-gradient(0deg, transparent 0px, transparent 15px, color-mix(in srgb, var(--ink) 12%, transparent) 16px)",
      }}
    >
      <p className="font-serif text-sm leading-snug italic">{note}</p>
    </div>
  );
}
