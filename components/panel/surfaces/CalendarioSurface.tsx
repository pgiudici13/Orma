"use client";

import { loadRepartoSurface } from "@/app/actions/surfaces";
import { CalendarioSection } from "@/components/reparto/CalendarioSection";
import type { SceneObject } from "@/lib/scene/objects";
import { useSurfaceData } from "@/lib/scene/useSurfaceData";
import { PanelSection } from "../PanelSection";

/**
 * Superficie del calendario di Reparto (P7-T03, riportata sul tavolo in
 * RD-T06).
 *
 * L'oggetto sul tavolo porta già con sé i prossimi eventi (`getTableEvents`):
 * il pannello li mostra subito, senza attesa, e li sostituisce con il
 * calendario completo — comprese le azioni riservate ai Capi — appena i dati
 * del Reparto arrivano. Non è un caricamento: è un foglio che si apre.
 */
export function CalendarioSurface({ object }: { object: SceneObject }) {
  const { data, reload } = useSurfaceData("reparto", loadRepartoSurface);

  const events = data?.events ?? object.events ?? [];

  if (data && !data.repartoNome) {
    return (
      <PanelSection title="Calendario">
        <p className="font-sans text-sm leading-relaxed">
          Il calendario è quello del tuo Reparto: comparirà qui appena ne farai
          parte.
        </p>
      </PanelSection>
    );
  }

  return (
    <div className="mt-5">
      <CalendarioSection
        events={events}
        isCapoOrAdmin={data?.isCapoOrAdmin ?? false}
        onMutated={reload}
      />
    </div>
  );
}
