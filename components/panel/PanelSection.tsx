/**
 * Sezione di contenuto dentro il pannello di un oggetto.
 *
 * Primitiva condivisa da tutte le superfici (`components/panel/surfaces/`): un
 * titolo breve in maiuscoletto e un filetto sopra, come le voci di un modulo
 * cartaceo. Il colore del testo è già smorzato qui, così le superfici non
 * ripetono la stessa `color-mix` ad ogni blocco.
 */
export function PanelSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="mt-5 border-t pt-4"
      style={{
        borderColor: "color-mix(in srgb, var(--ink) 14%, transparent)",
      }}
    >
      <h3
        className="font-sans text-[10px] tracking-[0.16em] uppercase"
        style={{ color: "var(--ink-muted-soft)" }}
      >
        {title}
      </h3>
      <div
        className="mt-2"
        style={{ color: "color-mix(in srgb, var(--ink) 82%, transparent)" }}
      >
        {children}
      </div>
    </div>
  );
}
