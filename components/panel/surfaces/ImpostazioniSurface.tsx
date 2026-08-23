"use client";

import { useActionState, useCallback, useEffect } from "react";
import {
  salvaMaestroProfilo,
  type SalvaMaestroProfiloState,
} from "@/app/actions/maestri";
import {
  loadCatalogo,
  loadMaestroProfilo,
  loadProfilo,
} from "@/app/actions/surfaces";
import { logout } from "@/app/impostazioni/actions";
import { ProfiloForm } from "@/components/settings/ProfiloForm";
import type { MaestroProfiloData } from "@/lib/queries/maestri";
import { useSurfaceData } from "@/lib/scene/useSurfaceData";
import { PanelSection } from "../PanelSection";
import { SurfaceLoading } from "./SurfaceLoading";

/**
 * Tessera personale (RD-T07): il proprio profilo, i dati che l'app conserva,
 * la disponibilità come Maestro di Specialità (Fase 8) e l'uscita.
 *
 * Sostituisce la pagina `/impostazioni`. La data di nascita si vede ma non si
 * modifica: da lei dipende il regime di consenso (DEC-010), che non è una
 * preferenza da cambiare a piacere.
 */
export function ImpostazioniSurface() {
  const { data } = useSurfaceData("profilo", loadProfilo);

  if (!data) return <SurfaceLoading label="Prendo la tessera…" />;

  return (
    <div className="mt-5 flex flex-col gap-6">
      <ProfiloForm nome={data.nome} />

      <PanelSection title="Dati dell'account">
        <dl className="font-sans text-sm">
          <dt
            className="text-[11px] tracking-wide uppercase"
            style={{ color: "var(--ink-muted-soft)" }}
          >
            Data di nascita
          </dt>
          <dd className="mt-1" style={{ color: "var(--ink)" }}>
            {data.dataNascita ?? "—"}
          </dd>

          <dt
            className="mt-4 text-[11px] tracking-wide uppercase"
            style={{ color: "var(--ink-muted-soft)" }}
          >
            Reparto
          </dt>
          <dd className="mt-1" style={{ color: "var(--ink)" }}>
            {data.repartoNome ?? "—"}
          </dd>
        </dl>
      </PanelSection>

      <MaestroSection />

      <form action={logout}>
        <button
          type="submit"
          className="cursor-pointer font-sans text-[11px] tracking-wide underline underline-offset-2"
          style={{ color: "#b3382c" }}
        >
          Esci
        </button>
      </form>
    </div>
  );
}

/**
 * Gestione del proprio profilo di Maestro di Specialità (Fase 8): l'opt-in che
 * rende ricercabili in `cerca_maestri` solo i dati dichiarati qui
 * (`docs/PERMISSIONS.md`).
 */
function MaestroSection() {
  const loadProfiloMaestro = useCallback(() => loadMaestroProfilo(), []);
  const { data, reload } = useSurfaceData("maestroProfilo", loadProfiloMaestro);
  const [state, formAction, pending] = useActionState<
    SalvaMaestroProfiloState | null,
    FormData
  >(salvaMaestroProfilo, null);

  // Dopo un salvataggio riuscito ricarica i dati dalla cache: i campi del form
  // sono uncontrolled e già contengono quanto appena inviato, ma alla prossima
  // apertura della tessera i default devono riflettere il salvataggio.
  useEffect(() => {
    if (state?.success) {
      reload();
    }
  }, [state, reload]);

  return (
    <PanelSection title="Maestro di Specialità">
      {!data ? (
        <SurfaceLoading label="Leggo la sezione…" />
      ) : (
        <MaestroForm
          data={data}
          formAction={formAction}
          pending={pending}
          state={state}
        />
      )}
    </PanelSection>
  );
}

const fieldStyle = {
  backgroundColor: "var(--paper-base)",
  border: "1px solid color-mix(in srgb, var(--wood-dark) 22%, transparent)",
  color: "var(--ink)",
} as const;

function MaestroForm({
  data,
  formAction,
  pending,
  state,
}: {
  data: MaestroProfiloData;
  formAction: (formData: FormData) => void;
  pending: boolean;
  state: SalvaMaestroProfiloState | null;
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
    <form action={formAction} className="flex flex-col gap-3">
      <p className="font-sans text-sm leading-relaxed">
        Se ti rendi ricercabile, chi cerca un Maestro di Specialità può trovarti
        anche fuori dal tuo Reparto. Diventano visibili solo i dati che dichiari
        qui.
      </p>

      <label className="flex items-center gap-2 font-sans text-sm">
        <input type="checkbox" name="visibile" defaultChecked={data.visibile} />
        Rendimi ricercabile come Maestro
      </label>

      <label className="flex flex-col gap-1 font-sans text-sm">
        Specialità che posso accompagnare
        <select
          name="specialitaId"
          multiple
          size={6}
          defaultValue={data.specialitaIds}
          className="rounded-[2px] p-2 text-sm"
          style={fieldStyle}
        >
          {(catalogo?.voci ?? []).map((voce) => (
            <option key={voce.id} value={voce.id}>
              {voce.nome}
            </option>
          ))}
        </select>
        <span
          className="text-[11px]"
          style={{ color: "var(--ink-muted-soft)" }}
        >
          Tieni premuto Ctrl (⌘ su Mac) per sceglierne più d&apos;una.
        </span>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 font-sans text-sm">
          Regione
          <input
            name="regione"
            type="text"
            defaultValue={data.regione}
            className="rounded-[2px] p-2 text-sm"
            style={fieldStyle}
          />
        </label>
        <label className="flex flex-col gap-1 font-sans text-sm">
          Zona
          <input
            name="zona"
            type="text"
            defaultValue={data.zona}
            className="rounded-[2px] p-2 text-sm"
            style={fieldStyle}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 font-sans text-sm">
        Località
        <input
          name="localita"
          type="text"
          defaultValue={data.localita}
          className="rounded-[2px] p-2 text-sm"
          style={fieldStyle}
        />
      </label>

      <label className="flex items-center gap-2 font-sans text-sm">
        <input
          type="checkbox"
          name="disponibile"
          defaultChecked={data.disponibile}
        />
        Disponibile ad accompagnare nuovi E/G
      </label>

      {state?.error ? (
        <p className="font-sans text-sm" style={{ color: "#b3382c" }}>
          {state.error}
        </p>
      ) : null}
      {state?.success ? (
        <p className="font-sans text-sm" style={{ color: "var(--accent)" }}>
          Salvato.
        </p>
      ) : null}

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
