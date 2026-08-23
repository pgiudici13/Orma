/**
 * Rappresentazione 2D di un oggetto del tavolo che non ha (ancora) un disegno
 * dedicato nella composizione piatta.
 *
 * DEC-013 chiede che le due rese condividano il modello di interazione, non il
 * disegno: qui l'oggetto è una targhetta di legno con l'etichetta incisa —
 * riconoscibile, coerente con i materiali del tavolo, e soprattutto
 * raggiungibile. Nessun contenuto è irraggiungibile su mobile solo perché la
 * scena 3D non c'è.
 */
export function Plaque({
  label,
  title,
  tone = "legno",
}: {
  label: string;
  title: string;
  tone?: "legno" | "tessuto";
}) {
  const isWood = tone === "legno";

  return (
    <div
      className="flex w-[13rem] flex-col gap-1 rounded-[3px] px-4 py-3 shadow-[0_10px_18px_-14px_rgba(15,10,4,0.9)]"
      style={{
        backgroundColor: isWood
          ? "color-mix(in srgb, var(--wood-base) 82%, var(--wood-dark))"
          : "var(--fabric-base)",
        border:
          "1px solid color-mix(in srgb, var(--wood-dark) 55%, transparent)",
      }}
    >
      <span
        className="font-sans text-[9px] tracking-[0.18em] uppercase"
        style={{
          color: "color-mix(in srgb, var(--paper-base) 70%, transparent)",
        }}
      >
        {label}
      </span>
      <span
        className="font-serif text-base leading-tight"
        style={{ color: "var(--paper-base)" }}
      >
        {title}
      </span>
    </div>
  );
}
