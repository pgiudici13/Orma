/**
 * Pagina su fondo di carta, per le poche superfici che restano fuori dal tavolo.
 *
 * I token materiali (`--ink`, `--paper-base`, …) descrivono materiali fisici e
 * per scelta **non** seguono `prefers-color-scheme` (vedi
 * `docs/VISUAL_REFERENCE.md`): scrivere testo `--ink` senza dichiarare uno
 * sfondo lo lascia su `--background`, che in dark mode è quasi nero — testo
 * quasi invisibile. È la classe di bug registrata in `.claude/CORRECTIONS.md`.
 *
 * Questo contenitore dichiara sempre lo sfondo, così il problema non può
 * ripresentarsi su una pagina nuova: chi scrive una pagina fuori dal tavolo
 * parte da qui invece che da un `<main>` nudo.
 */
export function PaperPage({
  children,
  larghezza = "max-w-2xl",
}: {
  children: React.ReactNode;
  /** Classe Tailwind di larghezza massima del contenuto. */
  larghezza?: string;
}) {
  return (
    <main
      className="flex min-h-full flex-1 flex-col px-6 py-16"
      style={{
        backgroundColor: "color-mix(in srgb, var(--wood-dark) 88%, black)",
      }}
    >
      <div
        className={`mx-auto w-full ${larghezza} rounded-[3px] p-8 shadow-sm`}
        style={{
          backgroundColor: "var(--paper-base)",
          color: "var(--ink)",
          border:
            "1px solid color-mix(in srgb, var(--wood-dark) 22%, transparent)",
        }}
      >
        {children}
      </div>
    </main>
  );
}
