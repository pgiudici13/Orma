"use client";

import { useActionState } from "react";
import { richiediReparto } from "./actions";

export function RichiediRepartoForm({
  reparti,
}: {
  reparti: { id: string; nome: string }[];
}) {
  const [state, formAction, pending] = useActionState(richiediReparto, null);

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4">
      <label
        className="flex flex-col gap-1 font-sans text-sm"
        style={{ color: "var(--ink)" }}
      >
        Reparto
        <select
          name="repartoId"
          required
          defaultValue=""
          className="cursor-pointer rounded-[3px] px-3 py-2 font-sans text-sm"
          style={{
            backgroundColor: "var(--paper-aged)",
            border:
              "1px solid color-mix(in srgb, var(--wood-dark) 30%, transparent)",
            color: "var(--ink)",
          }}
        >
          <option value="" disabled>
            Seleziona un Reparto
          </option>
          {reparti.map((reparto) => (
            <option key={reparto.id} value={reparto.id}>
              {reparto.nome}
            </option>
          ))}
        </select>
      </label>

      {state?.error && (
        <p className="font-sans text-sm" style={{ color: "#b3382c" }}>
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="cursor-pointer self-start rounded-[2px] px-4 py-2 font-sans text-xs font-medium tracking-wide disabled:opacity-50"
        style={{
          backgroundColor: "var(--accent)",
          color: "#fff",
        }}
      >
        {pending ? "Invio…" : "Richiedi associazione"}
      </button>
    </form>
  );
}
