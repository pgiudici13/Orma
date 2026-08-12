export const metadata = { title: "ORMA — Controlla la tua email" };

export default function ControllaEmailPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16 text-center dark:bg-black">
      <div className="max-w-sm">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Controlla la tua email
        </h1>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          Ti abbiamo inviato un&apos;email di conferma. Clicca sul link per
          attivare l&apos;account: senza conferma non potrai accedere.
        </p>
      </div>
    </div>
  );
}
