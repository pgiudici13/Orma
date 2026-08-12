"use client";

import { useActionState } from "react";
import { aggiornaProfilo } from "@/app/impostazioni/actions";

export function ProfiloForm({ nome }: { nome: string }) {
  const [state, formAction, pending] = useActionState(aggiornaProfilo, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label
        className="flex flex-col gap-1 font-sans text-sm"
        style={{ color: "var(--ink)" }}
      >
        Nome
        <input
          name="nome"
          type="text"
          required
          defaultValue={nome}
          className="rounded-[3px] px-3 py-2 font-sans text-sm"
          style={{
            backgroundColor: "var(--paper-base)",
            border:
              "1px solid color-mix(in srgb, var(--wood-dark) 30%, transparent)",
            color: "var(--ink)",
          }}
        />
      </label>

      {state && "error" in state && (
        <p className="font-sans text-sm" style={{ color: "#b3382c" }}>
          {state.error}
        </p>
      )}
      {state && "success" in state && (
        <p className="font-sans text-sm" style={{ color: "var(--accent)" }}>
          Salvato.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="cursor-pointer self-start font-sans text-[11px] tracking-wide underline underline-offset-2 disabled:opacity-50"
        style={{ color: "var(--accent)" }}
      >
        {pending ? "Salvataggio…" : "Salva"}
      </button>
    </form>
  );
}
