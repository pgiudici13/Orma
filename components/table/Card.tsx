const VARIANT_LABEL: Record<CardVariant, string> = {
  specialita: "Specialità",
  competenza: "Competenza",
  tappa: "Tappa",
};

const VARIANT_ACCENT: Record<CardVariant, string> = {
  specialita: "var(--accent)",
  competenza: "var(--fabric-base)",
  tappa: "var(--metal-base)",
};

export type CardVariant = "specialita" | "competenza" | "tappa";

export function Card({
  variant,
  title,
  className = "",
}: {
  variant: CardVariant;
  title: string;
  className?: string;
}) {
  return (
    <div
      className={`relative w-44 rounded-[3px] p-3 pt-4 ${className}`}
      style={{
        backgroundColor: "var(--paper-base)",
        color: "var(--ink)",
        boxShadow:
          "0 1px 0 color-mix(in srgb, var(--paper-aged) 80%, transparent), 0 14px 22px -12px rgba(20, 14, 6, 0.55)",
        border:
          "1px solid color-mix(in srgb, var(--wood-dark) 25%, transparent)",
      }}
    >
      <span
        aria-hidden
        className="absolute left-3 top-0 h-2 w-8 rounded-b-[2px]"
        style={{ backgroundColor: VARIANT_ACCENT[variant] }}
      />
      <p
        className="font-sans text-[10px] tracking-[0.14em] uppercase"
        style={{ color: "color-mix(in srgb, var(--ink) 60%, transparent)" }}
      >
        {VARIANT_LABEL[variant]}
      </p>
      <p className="font-serif text-lg leading-snug">{title}</p>
    </div>
  );
}
