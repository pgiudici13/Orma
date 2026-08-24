"use client";

/**
 * Error boundary globale (App Router).
 *
 * Senza questo file, un errore lanciato da una Server Action non gestita (o da
 * qualunque altro errore di rendering) sostituisce l'intero tavolo con la
 * schermata di errore generica di Next.js. Qui invece manteniamo l'estetica
 * "scrivania fisica" del progetto: il messaggio (già scritto in italiano dalle
 * action, es. "Permesso negato: operazione riservata ai Capi Reparto.") resta
 * leggibile, con un modo di riprendere in mano il tavolo (`reset()`).
 *
 * Questo è un ripiego per errori non intercettati altrove: la Parte B di
 * questo lavoro cattura già i casi prevedibili (permesso negato, entità non
 * trovata, validazione) come stato locale dei singoli form.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      className="flex min-h-screen items-center justify-center p-6"
      style={{ backgroundColor: "var(--wood-dark)" }}
    >
      <div
        className="flex max-w-md flex-col gap-4 rounded-[3px] p-8 shadow-lg"
        style={{
          backgroundColor: "var(--paper-base)",
          border:
            "1px solid color-mix(in srgb, var(--wood-dark) 30%, transparent)",
        }}
      >
        <h1
          className="font-serif text-xl leading-tight"
          style={{ color: "var(--ink)" }}
        >
          Qualcosa si è inceppato sul tavolo.
        </h1>

        <p
          className="font-sans text-sm leading-relaxed"
          style={{ color: "color-mix(in srgb, var(--ink) 82%, transparent)" }}
        >
          {error.message || "Errore imprevisto."}
        </p>

        <button
          type="button"
          onClick={() => reset()}
          className="cursor-pointer self-start font-sans text-[11px] tracking-wide underline underline-offset-2"
          style={{ color: "var(--accent)" }}
        >
          Riprova
        </button>
      </div>
    </div>
  );
}
