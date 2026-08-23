"use client";

import { useState } from "react";
import {
  assegnaMembroSquadriglia,
  creaSquadriglia,
  eliminaSquadriglia,
  rinominaSquadriglia,
} from "@/app/reparto/actions";
import type { MemberData, SquadrigliaData } from "@/lib/queries/reparto";

export function SquadriglieSection({
  squadriglie,
  members,
  isCapoOrAdmin,
  onMutated,
}: {
  squadriglie: SquadrigliaData[];
  members: MemberData[];
  isCapoOrAdmin: boolean;
  /** Chiamata dopo ogni scrittura, per ricaricare la superficie (DEC-021). */
  onMutated?: () => void;
}) {
  const [editingSqId, setEditingSqId] = useState<string | null>(null);
  const [editingSqName, setEditingSqName] = useState("");
  const [showNewSqForm, setShowNewSqForm] = useState(false);

  const unassignedMembers = members.filter((m) => !m.squadrigliaId);

  return (
    <section className="flex flex-col gap-8">
      {/* Intestazione e Azioni Capo */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2
            className="font-serif text-2xl leading-tight font-semibold"
            style={{ color: "var(--ink)" }}
          >
            Le Squadriglie del Reparto
          </h2>
          <p
            className="font-sans text-xs mt-1"
            style={{ color: "color-mix(in srgb, var(--ink) 70%, transparent)" }}
          >
            {squadriglie.length} squadriglie attive • {members.length} membri totali
          </p>
        </div>

        {isCapoOrAdmin && !showNewSqForm ? (
          <button
            type="button"
            onClick={() => setShowNewSqForm(true)}
            className="cursor-pointer rounded-[2px] px-3 py-1.5 font-sans text-xs tracking-wide font-medium shadow-sm transition-colors"
            style={{
              backgroundColor: "var(--accent)",
              color: "#fff",
            }}
          >
            + Nuova Squadriglia
          </button>
        ) : null}
      </div>

      {/* Form creazione Squadriglia */}
      {isCapoOrAdmin && showNewSqForm ? (
        <form
          action={async (formData) => {
            await creaSquadriglia(formData);
            setShowNewSqForm(false);
            onMutated?.();
          }}
          className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-[3px]"
          style={{
            backgroundColor: "var(--paper-base)",
            border: "1px solid var(--accent)",
          }}
        >
          <div className="flex-1 w-full">
            <label
              htmlFor="nome-nuova-sq"
              className="block text-[10px] uppercase tracking-wider font-sans mb-1"
              style={{ color: "color-mix(in srgb, var(--ink) 70%, transparent)" }}
            >
              Nome Squadriglia (es. Aquile, Volpi, Gabbiani)
            </label>
            <input
              id="nome-nuova-sq"
              type="text"
              name="nome"
              placeholder="Nome Squadriglia"
              required
              className="w-full rounded-[2px] px-3 py-1.5 text-sm font-sans"
              style={{
                backgroundColor: "var(--paper-base)",
                border:
                  "1px solid color-mix(in srgb, var(--wood-dark) 30%, transparent)",
                color: "var(--ink)",
              }}
            />
          </div>
          <div className="flex items-center gap-2 mt-2 sm:mt-5">
            <button
              type="submit"
              className="cursor-pointer rounded-[2px] px-3 py-1.5 font-sans text-xs tracking-wide font-medium"
              style={{
                backgroundColor: "var(--accent)",
                color: "#fff",
              }}
            >
              Crea
            </button>
            <button
              type="button"
              onClick={() => setShowNewSqForm(false)}
              className="cursor-pointer rounded-[2px] px-3 py-1.5 font-sans text-xs tracking-wide"
              style={{
                border:
                  "1px solid color-mix(in srgb, var(--wood-dark) 30%, transparent)",
                color: "var(--ink)",
              }}
            >
              Annulla
            </button>
          </div>
        </form>
      ) : null}

      {/* Griglia Squadriglie */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {squadriglie.map((sq) => {
          const sqMembers = members.filter((m) => m.squadrigliaId === sq.id);
          const isEditing = editingSqId === sq.id;

          return (
            <div
              key={sq.id}
              className="flex flex-col gap-4 rounded-[3px] p-5 shadow-sm"
              style={{
                backgroundColor: "var(--paper-base)",
                border:
                  "1px solid color-mix(in srgb, var(--wood-dark) 24%, transparent)",
              }}
            >
              {/* Header Squadriglia */}
              <div className="flex items-start justify-between gap-3 border-b pb-3" style={{ borderColor: "color-mix(in srgb, var(--ink) 12%, transparent)" }}>
                {isEditing ? (
                  <form
                    action={async (formData) => {
                      await rinominaSquadriglia(sq.id, formData);
                      setEditingSqId(null);
                      onMutated?.();
                    }}
                    className="flex items-center gap-2 flex-1"
                  >
                    <input
                      type="text"
                      name="nome"
                      defaultValue={editingSqName}
                      required
                      className="rounded-[2px] px-2 py-1 text-sm font-sans flex-1"
                      style={{
                        backgroundColor: "var(--paper-base)",
                        border: "1px solid var(--accent)",
                        color: "var(--ink)",
                      }}
                    />
                    <button
                      type="submit"
                      className="text-xs font-sans text-emerald-700 underline font-medium cursor-pointer"
                    >
                      Salva
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingSqId(null)}
                      className="text-xs font-sans text-neutral-500 underline cursor-pointer"
                    >
                      Annulla
                    </button>
                  </form>
                ) : (
                  <div>
                    <h3
                      className="font-serif text-xl font-bold leading-snug"
                      style={{ color: "var(--ink)" }}
                    >
                      Sq. {sq.nome}
                    </h3>
                    <p
                      className="text-xs font-sans mt-0.5"
                      style={{
                        color: "color-mix(in srgb, var(--ink) 60%, transparent)",
                      }}
                    >
                      {sqMembers.length} {sqMembers.length === 1 ? "membro" : "membri"}
                    </p>
                  </div>
                )}

                {isCapoOrAdmin && !isEditing ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSqId(sq.id);
                        setEditingSqName(sq.nome);
                      }}
                      className="text-[11px] font-sans underline cursor-pointer"
                      style={{ color: "var(--accent)" }}
                    >
                      Rinomina
                    </button>
                    <form
                      action={async () => {
                        if (confirm(`Sei sicuro di voler eliminare la Squadriglia ${sq.nome}? I membri verranno disassegnati.`)) {
                          await eliminaSquadriglia(sq.id);
                          onMutated?.();
                        }
                      }}
                    >
                      <button
                        type="submit"
                        className="text-[11px] font-sans underline cursor-pointer text-red-700"
                      >
                        Elimina
                      </button>
                    </form>
                  </div>
                ) : null}
              </div>

              {/* Lista membri della Squadriglia */}
              <ul className="flex flex-col gap-2">
                {sqMembers.length === 0 ? (
                  <p
                    className="text-xs font-sans italic py-2"
                    style={{
                      color: "color-mix(in srgb, var(--ink) 55%, transparent)",
                    }}
                  >
                    Nessun membro assegnato a questa Squadriglia.
                  </p>
                ) : (
                  sqMembers.map((m) => (
                    <li
                      key={m.id}
                      className="flex items-center justify-between gap-3 p-2 rounded-[2px]"
                      style={{
                        backgroundColor:
                          "color-mix(in srgb, var(--paper-aged) 45%, transparent)",
                      }}
                    >
                      <div>
                        <p
                          className="font-serif text-sm font-semibold leading-tight"
                          style={{ color: "var(--ink)" }}
                        >
                          {m.nome} {m.ruolo === "capo" ? "👑" : ""}
                        </p>
                        <p
                          className="text-[11px] font-sans mt-0.5"
                          style={{
                            color: "color-mix(in srgb, var(--ink) 65%, transparent)",
                          }}
                        >
                          {m.specialitaCompletate.length} Specialità
                          {m.tappaAttuale ? ` • Tappa ${m.tappaAttuale}` : ""}
                        </p>
                      </div>

                      {isCapoOrAdmin ? (
                        <form
                          action={async (formData) => {
                            await assegnaMembroSquadriglia(m.id, formData);
                            onMutated?.();
                          }}
                          className="shrink-0"
                        >
                          <select
                            name="squadriglia_id"
                            defaultValue={sq.id}
                            onChange={(e) => e.target.form?.requestSubmit()}
                            className="rounded-[2px] px-2 py-1 text-xs font-sans cursor-pointer"
                            style={{
                              backgroundColor: "var(--paper-base)",
                              border:
                                "1px solid color-mix(in srgb, var(--wood-dark) 25%, transparent)",
                              color: "var(--ink)",
                            }}
                          >
                            <option value={sq.id}>Sq. {sq.nome}</option>
                            {squadriglie
                              .filter((other) => other.id !== sq.id)
                              .map((other) => (
                                <option key={other.id} value={other.id}>
                                  → Sposta in {other.nome}
                                </option>
                              ))}
                            <option value="nessuna">Rimuovi da sq.</option>
                          </select>
                        </form>
                      ) : null}
                    </li>
                  ))
                )}
              </ul>
            </div>
          );
        })}

        {/* Membri senza Squadriglia */}
        {unassignedMembers.length > 0 ? (
          <div
            className="flex flex-col gap-4 rounded-[3px] p-5 border-dashed"
            style={{
              backgroundColor:
                "color-mix(in srgb, var(--paper-base) 80%, transparent)",
              border:
                "1px dashed color-mix(in srgb, var(--wood-dark) 35%, transparent)",
            }}
          >
            <div className="border-b pb-3" style={{ borderColor: "color-mix(in srgb, var(--ink) 12%, transparent)" }}>
              <h3
                className="font-serif text-xl font-bold leading-snug"
                style={{ color: "var(--ink)" }}
              >
                Membri senza Squadriglia
              </h3>
              <p
                className="text-xs font-sans mt-0.5"
                style={{
                  color: "color-mix(in srgb, var(--ink) 60%, transparent)",
                }}
              >
                {unassignedMembers.length} {unassignedMembers.length === 1 ? "membro" : "membri"} da assegnare
              </p>
            </div>

            <ul className="flex flex-col gap-2">
              {unassignedMembers.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between gap-3 p-2 rounded-[2px]"
                  style={{
                    backgroundColor:
                      "color-mix(in srgb, var(--paper-aged) 35%, transparent)",
                  }}
                >
                  <div>
                    <p
                      className="font-serif text-sm font-semibold leading-tight"
                      style={{ color: "var(--ink)" }}
                    >
                      {m.nome} {m.ruolo === "capo" ? "👑" : ""}
                    </p>
                    <p
                      className="text-[11px] font-sans mt-0.5"
                      style={{
                        color: "color-mix(in srgb, var(--ink) 65%, transparent)",
                      }}
                    >
                      {m.specialitaCompletate.length} Specialità
                      {m.tappaAttuale ? ` • Tappa ${m.tappaAttuale}` : ""}
                    </p>
                  </div>

                  {isCapoOrAdmin ? (
                    <form
                      action={async (formData) => {
                        await assegnaMembroSquadriglia(m.id, formData);
                        onMutated?.();
                      }}
                      className="shrink-0"
                    >
                      <select
                        name="squadriglia_id"
                        defaultValue="nessuna"
                        onChange={(e) => e.target.form?.requestSubmit()}
                        className="rounded-[2px] px-2 py-1 text-xs font-sans cursor-pointer"
                        style={{
                          backgroundColor: "var(--paper-base)",
                          border:
                            "1px solid color-mix(in srgb, var(--wood-dark) 25%, transparent)",
                          color: "var(--ink)",
                        }}
                      >
                        <option value="nessuna">Assegna a…</option>
                        {squadriglie.map((sq) => (
                          <option key={sq.id} value={sq.id}>
                            Sq. {sq.nome}
                          </option>
                        ))}
                      </select>
                    </form>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
