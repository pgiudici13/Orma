import { ConsensoForm } from "./ConsensoForm";

export const metadata = { title: "ORMA — Consenso genitoriale" };

export default async function ConsensoPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-black">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Consenso al trattamento dei dati
        </h1>
        <p className="mt-3 mb-6 text-sm text-zinc-600 dark:text-zinc-400">
          Un minore a Suo carico ha richiesto un account su ORMA. Prima di
          confermare, legga l&apos;
          <a
            href="/privacy"
            className="underline"
            target="_blank"
            rel="noreferrer"
          >
            Informativa Privacy
          </a>
          .
        </p>
        <ConsensoForm token={token} />
      </div>
    </div>
  );
}
