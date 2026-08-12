export const metadata = { title: "ORMA — In attesa di consenso" };

export default function AttesaConsensoPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16 text-center dark:bg-black">
      <div className="max-w-sm">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Account in attesa di conferma
        </h1>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          Servono due conferme prima che l&apos;account sia attivo: la tua email
          (controlla la posta e clicca sul link che ti abbiamo inviato) e il
          consenso di un genitore/tutore, come richiesto dalla legge per chi ha
          meno di 14 anni. Abbiamo inviato l&apos;email di richiesta consenso
          all&apos;indirizzo indicato in fase di registrazione.
        </p>
      </div>
    </div>
  );
}
