"use client";

import { useActionState } from "react";
import { confermaConsenso } from "./actions";

export function ConsensoForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(confermaConsenso, null);

  if (state?.success) {
    return (
      <p className="text-sm text-zinc-700 dark:text-zinc-300">
        Grazie, il consenso è stato registrato. L&apos;account è ora attivo.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />

      <label className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
        <input name="accetta" type="checkbox" required className="mt-1" />
        <span>
          Dichiaro di essere il genitore, o di esercitare la responsabilità
          genitoriale/tutela, nei confronti del minore che ha richiesto
          l&apos;account, e acconsento al trattamento dei suoi dati personali
          per l&apos;utilizzo di ORMA secondo l&apos;
          <a
            href="/privacy"
            className="underline"
            target="_blank"
            rel="noreferrer"
          >
            Informativa Privacy
          </a>
          .
        </span>
      </label>

      {state?.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending ? "Conferma in corso…" : "Confermo il consenso"}
      </button>
    </form>
  );
}
