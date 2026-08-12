"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { registrati } from "./actions";

export default function RegistratiPage() {
  const [state, formAction, pending] = useActionState(registrati, null);

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-black">
      <form action={formAction} className="flex w-full max-w-sm flex-col gap-4">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Crea il tuo account <Logo className="text-2xl" />
        </h1>

        <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
          Nome
          <input
            name="nome"
            type="text"
            required
            className="rounded border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
          Email
          <input
            name="email"
            type="email"
            required
            className="rounded border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
          Password
          <input
            name="password"
            type="password"
            required
            minLength={8}
            className="rounded border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
          Data di nascita
          <input
            name="dataNascita"
            type="date"
            required
            className="rounded border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
          Email di un genitore/tutore (obbligatoria sotto i 14 anni)
          <input
            name="genitoreEmail"
            type="email"
            className="rounded border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>

        <label className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <input
            name="accettaPrivacy"
            type="checkbox"
            required
            className="mt-1"
          />
          <span>
            Ho letto e accetto l&apos;
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
          <p className="text-sm text-red-600 dark:text-red-400">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {pending ? "Registrazione in corso…" : "Registrati"}
        </button>

        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Hai già un account?{" "}
          <Link href="/login" className="underline">
            Accedi
          </Link>
        </p>
      </form>
    </div>
  );
}
