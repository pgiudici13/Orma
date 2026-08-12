"use client";

import { Suspense, useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Logo } from "@/components/Logo";
import { login } from "./actions";

const ERRORE_LABEL: Record<string, string> = {
  "link-non-valido":
    "Il link di conferma non è valido o è scaduto. Prova ad accedere o registrati di nuovo.",
};

function LoginForm() {
  const [state, formAction, pending] = useActionState(login, null);
  const searchParams = useSearchParams();
  const erroreLink = searchParams.get("errore");

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-4">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
        Accedi a <Logo className="text-2xl" />
      </h1>

      {erroreLink && ERRORE_LABEL[erroreLink] && (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          {ERRORE_LABEL[erroreLink]}
        </p>
      )}

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
          className="rounded border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      {state?.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending ? "Accesso in corso…" : "Accedi"}
      </button>

      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Non hai un account?{" "}
        <Link href="/registrati" className="underline">
          Registrati
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-black">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
