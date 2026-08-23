"use client";

import { useMemo, useState } from "react";

export type MemberData = {
  id: string;
  nome: string;
  ruolo: string;
  squadrigliaId: string | null;
  squadrigliaNome: string | null;
  specialitaCompletate: { id: string; nome: string; slug?: string }[];
  competenzeCompletate: { id: string; nome: string }[];
  tappaAttuale: string | null;
};

export function MembriSection({ members }: { members: MemberData[] }) {
  const [search, setSearch] = useState("");
  const [selectedSquadriglia, setSelectedSquadriglia] = useState<string>("tutti");

  const squadriglieList = useMemo(() => {
    const set = new Set<string>();
    for (const m of members) {
      if (m.squadrigliaNome) set.add(m.squadrigliaNome);
    }
    return Array.from(set).sort();
  }, [members]);

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchesSearch = m.nome
        .toLowerCase()
        .includes(search.trim().toLowerCase());
      const matchesSquadriglia =
        selectedSquadriglia === "tutti"
          ? true
          : selectedSquadriglia === "nessuna"
            ? !m.squadrigliaNome
            : m.squadrigliaNome === selectedSquadriglia;
      return matchesSearch && matchesSquadriglia;
    });
  }, [members, search, selectedSquadriglia]);

  const capiCount = members.filter((m) => m.ruolo === "capo").length;
  const egCount = members.filter((m) => m.ruolo === "eg").length;

  return (
    <section className="flex flex-col gap-6">
      {/* Statistiche riassuntive */}
      <div
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-[3px]"
        style={{
          backgroundColor: "var(--paper-base)",
          border:
            "1px solid color-mix(in srgb, var(--wood-dark) 22%, transparent)",
        }}
      >
        <div>
          <p
            className="text-[10px] tracking-[0.14em] uppercase font-sans"
            style={{ color: "color-mix(in srgb, var(--ink) 60%, transparent)" }}
          >
            Totale membri
          </p>
          <p className="font-serif text-2xl font-semibold mt-0.5" style={{ color: "var(--ink)" }}>
            {members.length}
          </p>
        </div>
        <div>
          <p
            className="text-[10px] tracking-[0.14em] uppercase font-sans"
            style={{ color: "color-mix(in srgb, var(--ink) 60%, transparent)" }}
          >
            Capi Reparto
          </p>
          <p className="font-serif text-2xl font-semibold mt-0.5" style={{ color: "var(--ink)" }}>
            {capiCount}
          </p>
        </div>
        <div>
          <p
            className="text-[10px] tracking-[0.14em] uppercase font-sans"
            style={{ color: "color-mix(in srgb, var(--ink) 60%, transparent)" }}
          >
            Esploratori / Guide
          </p>
          <p className="font-serif text-2xl font-semibold mt-0.5" style={{ color: "var(--ink)" }}>
            {egCount}
          </p>
        </div>
        <div>
          <p
            className="text-[10px] tracking-[0.14em] uppercase font-sans"
            style={{ color: "color-mix(in srgb, var(--ink) 60%, transparent)" }}
          >
            Squadriglie
          </p>
          <p className="font-serif text-2xl font-semibold mt-0.5" style={{ color: "var(--ink)" }}>
            {squadriglieList.length}
          </p>
        </div>
      </div>

      {/* Filtri */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <input
          type="text"
          placeholder="Cerca per nome…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-[2px] px-3 py-1.5 text-sm font-sans"
          style={{
            backgroundColor: "var(--paper-base)",
            border:
              "1px solid color-mix(in srgb, var(--wood-dark) 24%, transparent)",
            color: "var(--ink)",
          }}
        />

        <div className="flex items-center gap-2">
          <label
            htmlFor="squadriglia-filter"
            className="text-xs font-sans uppercase tracking-wider"
            style={{ color: "color-mix(in srgb, var(--ink) 65%, transparent)" }}
          >
            Squadriglia:
          </label>
          <select
            id="squadriglia-filter"
            value={selectedSquadriglia}
            onChange={(e) => setSelectedSquadriglia(e.target.value)}
            className="rounded-[2px] px-2.5 py-1.5 text-xs font-sans"
            style={{
              backgroundColor: "var(--paper-base)",
              border:
                "1px solid color-mix(in srgb, var(--wood-dark) 24%, transparent)",
              color: "var(--ink)",
            }}
          >
            <option value="tutti">Tutti</option>
            {squadriglieList.map((sq) => (
              <option key={sq} value={sq}>
                {sq}
              </option>
            ))}
            <option value="nessuna">Senza Squadriglia</option>
          </select>
        </div>
      </div>

      {/* Lista Membri */}
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMembers.length === 0 ? (
          <p
            className="col-span-full py-8 text-center font-sans text-sm italic"
            style={{ color: "color-mix(in srgb, var(--ink) 60%, transparent)" }}
          >
            Nessun membro corrisponde ai criteri di ricerca.
          </p>
        ) : null}

        {filteredMembers.map((m) => (
          <li
            key={m.id}
            className="flex flex-col gap-3 rounded-[3px] p-4"
            style={{
              backgroundColor: "var(--paper-base)",
              border:
                "1px solid color-mix(in srgb, var(--wood-dark) 22%, transparent)",
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3
                  className="font-serif text-lg font-semibold leading-snug"
                  style={{ color: "var(--ink)" }}
                >
                  {m.nome}
                </h3>
                <p
                  className="text-xs font-sans uppercase tracking-wider mt-0.5"
                  style={{
                    color: "color-mix(in srgb, var(--ink) 65%, transparent)",
                  }}
                >
                  {m.ruolo === "capo" ? "👑 Capo Reparto" : "Esploratore / Guida"}
                  {m.squadrigliaNome ? ` • Sq. ${m.squadrigliaNome}` : " • Nessuna sq."}
                </p>
              </div>

              {m.tappaAttuale ? (
                <span
                  className="rounded px-2 py-0.5 text-[10px] font-sans font-medium uppercase tracking-wider shrink-0"
                  style={{
                    backgroundColor:
                      "color-mix(in srgb, var(--accent) 15%, transparent)",
                    color: "var(--accent)",
                  }}
                >
                  Tappa {m.tappaAttuale}
                </span>
              ) : null}
            </div>

            {/* Percorso scout */}
            <div className="flex flex-col gap-2 pt-2 border-t" style={{ borderColor: "color-mix(in srgb, var(--ink) 10%, transparent)" }}>
              <div className="text-xs font-sans">
                <span
                  className="font-medium"
                  style={{ color: "color-mix(in srgb, var(--ink) 70%, transparent)" }}
                >
                  Specialità ({m.specialitaCompletate.length}):{" "}
                </span>
                {m.specialitaCompletate.length > 0 ? (
                  <span style={{ color: "var(--ink)" }}>
                    {m.specialitaCompletate.map((s) => s.nome).join(", ")}
                  </span>
                ) : (
                  <span className="italic" style={{ color: "color-mix(in srgb, var(--ink) 50%, transparent)" }}>
                    Nessuna completata
                  </span>
                )}
              </div>

              {m.competenzeCompletate.length > 0 ? (
                <div className="text-xs font-sans">
                  <span
                    className="font-medium"
                    style={{ color: "color-mix(in srgb, var(--ink) 70%, transparent)" }}
                  >
                    Competenze:{" "}
                  </span>
                  <span style={{ color: "var(--ink)" }}>
                    {m.competenzeCompletate.map((c) => c.nome).join(", ")}
                  </span>
                </div>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
