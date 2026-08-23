"use client";

import { loadProfilo } from "@/app/actions/surfaces";
import { logout } from "@/app/impostazioni/actions";
import { ProfiloForm } from "@/components/settings/ProfiloForm";
import { useSurfaceData } from "@/lib/scene/useSurfaceData";
import { PanelSection } from "../PanelSection";
import { SurfaceLoading } from "./SurfaceLoading";

/**
 * Tessera personale (RD-T07): il proprio profilo, i dati che l'app conserva e
 * l'uscita.
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
            style={{ color: "color-mix(in srgb, var(--ink) 55%, transparent)" }}
          >
            Data di nascita
          </dt>
          <dd className="mt-1" style={{ color: "var(--ink)" }}>
            {data.dataNascita ?? "—"}
          </dd>

          <dt
            className="mt-4 text-[11px] tracking-wide uppercase"
            style={{ color: "color-mix(in srgb, var(--ink) 55%, transparent)" }}
          >
            Reparto
          </dt>
          <dd className="mt-1" style={{ color: "var(--ink)" }}>
            {data.repartoNome ?? "—"}
          </dd>
        </dl>
      </PanelSection>

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
