export const metadata = { title: "ORMA — In attesa di consenso" };

export default function AttesaConsensoPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16 text-center dark:bg-black">
      <div className="max-w-sm">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Account in attesa di conferma
        </h1>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          Abbiamo inviato un&apos;email al genitore/tutore indicato in fase di
          registrazione. Il tuo account sarà attivo non appena confermerà il
          consenso al trattamento dei tuoi dati, come richiesto dalla legge per
          chi ha meno di 14 anni.
        </p>
      </div>
    </div>
  );
}
