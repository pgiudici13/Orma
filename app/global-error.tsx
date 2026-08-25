"use client";

/**
 * Error boundary del root layout (App Router). `app/error.tsx` non intercetta
 * un errore lanciato dal layout radice stesso (es. un provider che esplode
 * durante l'idratazione): solo questo file, che deve ridichiarare <html>/<body>
 * perché sostituisce l'intero layout, può farlo. Caso raro in pratica, ma senza
 * questo file un simile errore mostra la schermata bianca generica di Next.js.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div
          className="flex min-h-screen items-center justify-center p-6"
          style={{ backgroundColor: "#42311f" }}
        >
          <div
            className="flex max-w-md flex-col gap-4 rounded-[3px] p-8 shadow-lg"
            style={{ backgroundColor: "#e7dec7", color: "#2c2216" }}
          >
            <h1 className="text-xl font-semibold leading-tight">
              Qualcosa si è inceppato sul tavolo.
            </h1>
            <p className="text-sm leading-relaxed">
              {error.message || "Errore imprevisto."}
            </p>
            <button
              type="button"
              onClick={() => reset()}
              className="cursor-pointer self-start text-[11px] tracking-wide underline underline-offset-2"
            >
              Riprova
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
