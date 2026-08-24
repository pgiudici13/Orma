"use client";

import { useActionState, useCallback, useState } from "react";
import {
  associaMaestroDaRicerca,
  cercaMaestriAction,
  type CercaMaestriState,
} from "@/app/actions/maestri";
import { loadCatalogo, loadMaestri } from "@/app/actions/surfaces";
import type { MaestroRicerca } from "@/lib/queries/maestri";
import type { MaestroVoce } from "@/lib/queries/percorso";
import { useSurfaceData } from "@/lib/scene/useSurfaceData";
import { SurfaceLoading } from "./SurfaceLoading";

/**
 * Rubrica dei Maestri (RD-T07, Fase 8).
 *
 * Due facce dell'oggetto: chi accompagna già l'utente nel proprio percorso
 * ("I miei Maestri") e la ricerca globale di Maestri di Specialità, anche
 * fuori dal proprio Reparto ("Cerca Maestri"). La ricerca mostra solo chi ha
 * scelto di essere ricercabile (`docs/PERMISSIONS.md`): è un elenco di
 * disponibilità dichiarate, non di profili.
 */

const INITIAL_SEARCH: CercaMaestriState = {
  risultati: [],
  mieSpecialitaAttive: [],
  cercato: false,
};

const fieldStyle = {
  backgroundColor: "var(--paper-base)",
  border: "1px solid color-mix(in srgb, var(--wood-dark) 22%, transparent)",
  color: "var(--ink)",
} as const;

const linkButtonStyle = { color: "var(--accent)" } as const;

type TabId = "miei" | "cerca";

export function MaestriSurface() {
  const { data, reload } = useSurfaceData("maestri", loadMaestri);
  const [tab, setTab] = useState<TabId>("miei");
  const [searchState, searchAction, searchPending] = useActionState(
    cercaMaestriAction,
    INITIAL_SEARCH,
  );

  if (!data) return <SurfaceLoading label="Apro la rubrica…" />;

  return (
    <div className="mt-5 flex flex-col gap-4">
      <TabBar tab={tab} onChange={setTab} />

      {tab === "miei" ? (
        <div
          role="tabpanel"
          id="tabpanel-miei"
          aria-labelledby="tab-miei"
          className="flex flex-col gap-3"
        >
          <MieiMaestri data={data} />
        </div>
      ) : (
        <div
          role="tabpanel"
          id="tabpanel-cerca"
          aria-labelledby="tab-cerca"
          className="flex flex-col gap-4"
        >
          <CercaMaestri
            state={searchState}
            searchAction={searchAction}
            pending={searchPending}
            onAssociato={reload}
          />
        </div>
      )}
    </div>
  );
}

function TabBar({
  tab,
  onChange,
}: {
  tab: TabId;
  onChange: (tab: TabId) => void;
}) {
  const tabs: { id: TabId; label: string }[] = [
    { id: "miei", label: "I miei Maestri" },
    { id: "cerca", label: "Cerca Maestri" },
  ];

  return (
    <div
      role="tablist"
      aria-label="Rubrica dei Maestri"
      className="flex gap-4 border-b pb-1"
      style={{
        borderColor: "color-mix(in srgb, var(--ink) 15%, transparent)",
      }}
    >
      {tabs.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          role="tab"
          id={`tab-${id}`}
          aria-selected={tab === id}
          aria-controls={`tabpanel-${id}`}
          onClick={() => onChange(id)}
          className="cursor-pointer pb-1 font-sans text-[11px] tracking-wide uppercase"
          style={{
            color:
              tab === id
                ? "var(--accent)"
                : "color-mix(in srgb, var(--ink) 60%, transparent)",
            borderBottom:
              tab === id ? "2px solid var(--accent)" : "2px solid transparent",
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function MieiMaestri({ data }: { data: MaestroVoce[] }) {
  if (data.length === 0) {
    return (
      <p className="font-sans text-sm leading-relaxed">
        Nessun Maestro associato al tuo percorso. Si aggiunge dalla carta della
        Specialità o della Competenza che stai portando avanti.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {data.map((maestro) => (
        <li
          key={maestro.id}
          className="flex items-baseline justify-between gap-3 border-b pb-2 font-sans text-sm"
          style={{
            borderColor: "color-mix(in srgb, var(--ink) 12%, transparent)",
          }}
        >
          <span style={{ color: "var(--ink)" }}>
            {maestro.nome}
            {maestro.esterno ? (
              <span
                className="ml-2 text-[10px] tracking-wide uppercase"
                style={{
                  color: "var(--ink-muted-soft)",
                }}
              >
                esterno
              </span>
            ) : null}
          </span>
          <span
            className="shrink-0 font-serif text-[13px]"
            style={{ color: "var(--ink-muted-strong)" }}
          >
            {maestro.per}
          </span>
        </li>
      ))}
    </ul>
  );
}

function CercaMaestri({
  state,
  searchAction,
  pending,
  onAssociato,
}: {
  state: CercaMaestriState;
  searchAction: (formData: FormData) => void;
  pending: boolean;
  onAssociato: () => void;
}) {
  const loadCatalogoSpecialita = useCallback(
    () => loadCatalogo("specialita"),
    [],
  );
  const { data: catalogo } = useSurfaceData(
    "catalogo:specialita",
    loadCatalogoSpecialita,
  );

  return (
    <>
      <p className="font-sans text-sm leading-relaxed">
        Trova Maestri di Specialità anche fuori dal tuo Reparto. Compaiono solo
        chi ha scelto di essere ricercabile, con le sole informazioni dichiarate
        — la ricerca non è un elenco di profili.
      </p>

      <form action={searchAction} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 font-sans text-sm">
          Specialità
          <select
            name="specialitaId"
            className="rounded-[2px] p-2 text-sm"
            style={fieldStyle}
          >
            <option value="">Qualunque</option>
            {(catalogo?.voci ?? []).map((voce) => (
              <option key={voce.id} value={voce.id}>
                {voce.nome}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 font-sans text-sm">
            Regione
            <input
              name="regione"
              type="text"
              className="rounded-[2px] p-2 text-sm"
              style={fieldStyle}
            />
          </label>
          <label className="flex flex-col gap-1 font-sans text-sm">
            Zona
            <input
              name="zona"
              type="text"
              className="rounded-[2px] p-2 text-sm"
              style={fieldStyle}
            />
          </label>
        </div>

        <label className="flex items-center gap-2 font-sans text-sm">
          <input type="checkbox" name="soloDisponibili" />
          Solo Maestri disponibili
        </label>

        <button
          type="submit"
          disabled={pending}
          className="cursor-pointer self-start font-sans text-[11px] tracking-wide underline underline-offset-2 disabled:opacity-50"
          style={linkButtonStyle}
        >
          {pending ? "Cerco…" : "Cerca"}
        </button>
      </form>

      {state.cercato && state.risultati.length === 0 ? (
        <p className="font-sans text-sm leading-relaxed">
          Nessun Maestro trovato con questi filtri.
        </p>
      ) : null}

      {state.risultati.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {state.risultati.map((maestro) => (
            <RisultatoMaestro
              key={maestro.profileId}
              maestro={maestro}
              mieSpecialitaAttive={state.mieSpecialitaAttive}
              onAssociato={onAssociato}
            />
          ))}
        </ul>
      ) : null}
    </>
  );
}

function RisultatoMaestro({
  maestro,
  mieSpecialitaAttive,
  onAssociato,
}: {
  maestro: MaestroRicerca;
  mieSpecialitaAttive: string[];
  onAssociato: () => void;
}) {
  const [error, setError] = useState<string | null>(null);

  // Il Maestro si associa a una propria Specialità in corso: i pulsanti
  // compaiono solo per quelle che combaciano con le dichiarate dal Maestro.
  const associazioni = maestro.specialitaIds
    .map((id, index) => ({
      id,
      nome: maestro.specialitaNomi[index] ?? id,
    }))
    .filter(({ id }) => mieSpecialitaAttive.includes(id));

  const luogo = [maestro.regione, maestro.zona, maestro.localita]
    .filter(Boolean)
    .join(" · ");

  return (
    <li
      className="flex flex-col gap-1 border-b pb-3"
      style={{
        borderColor: "color-mix(in srgb, var(--ink) 12%, transparent)",
      }}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-serif text-sm" style={{ color: "var(--ink)" }}>
          {maestro.nome}
        </span>
        {maestro.disponibile ? (
          <span
            className="shrink-0 text-[10px] tracking-wide uppercase"
            style={{ color: "var(--accent)" }}
          >
            disponibile
          </span>
        ) : null}
      </div>

      <span
        className="font-sans text-[11px] leading-relaxed"
        style={{ color: "var(--ink-muted-strong)" }}
      >
        {maestro.specialitaNomi.join(", ") || "—"}
      </span>

      <span
        className="font-sans text-[11px] leading-relaxed"
        style={{ color: "var(--ink-muted-soft)" }}
      >
        {luogo || "Località non indicata"}
      </span>

      {associazioni.length > 0 ? (
        <div className="mt-1 flex flex-col gap-1">
          {associazioni.map((associazione) => (
            <form
              key={associazione.id}
              action={async () => {
                try {
                  await associaMaestroDaRicerca(
                    associazione.id,
                    maestro.profileId,
                  );
                  onAssociato();
                } catch (e) {
                  setError(
                    e instanceof Error ? e.message : "Errore imprevisto.",
                  );
                }
              }}
            >
              <button
                type="submit"
                className="cursor-pointer self-start font-sans text-[11px] tracking-wide underline underline-offset-2"
                style={linkButtonStyle}
              >
                Associa a «{associazione.nome}»
              </button>
            </form>
          ))}
        </div>
      ) : null}
      {error ? (
        <p className="font-sans text-[11px]" style={{ color: "#b3382c" }}>
          {error}
        </p>
      ) : null}
    </li>
  );
}
