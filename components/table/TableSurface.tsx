export function TableSurface() {
  return (
    <div
      aria-hidden
      className="absolute inset-0"
      style={{
        backgroundColor: "var(--wood-base)",
        backgroundImage: [
          // venature: strisce sottili e irregolari
          "repeating-linear-gradient(88deg, color-mix(in srgb, var(--wood-grain) 55%, transparent) 0px, transparent 2px, transparent 14px, color-mix(in srgb, var(--wood-grain) 35%, transparent) 16px, transparent 30px)",
          "repeating-linear-gradient(91deg, color-mix(in srgb, var(--wood-dark) 30%, transparent) 0px, transparent 1px, transparent 55px, color-mix(in srgb, var(--wood-dark) 20%, transparent) 57px, transparent 120px)",
          // vignetta: luce naturale al centro, ombra ai bordi
          "radial-gradient(120% 90% at 50% 35%, color-mix(in srgb, var(--wood-base) 60%, white 8%) 0%, transparent 55%)",
          "radial-gradient(140% 100% at 50% 100%, color-mix(in srgb, var(--wood-dark) 55%, transparent) 0%, transparent 60%)",
        ].join(", "),
      }}
    />
  );
}
