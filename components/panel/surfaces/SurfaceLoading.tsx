/**
 * Attesa di una superficie che sta caricando i propri dati.
 *
 * Niente spinner: sul tavolo un contenuto non "carica", si apre. Una riga di
 * testo in corsivo dice cosa sta succedendo e sparisce da sola — coerente con
 * la regola di `docs/DESIGN.md` per cui la UI non deve competere con la scena.
 */
export function SurfaceLoading({ label }: { label: string }) {
  return (
    <p
      className="mt-6 font-serif text-sm italic"
      style={{ color: "var(--ink-muted-soft)" }}
      role="status"
    >
      {label}
    </p>
  );
}
