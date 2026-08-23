"use client";

import { loadRepartoSurface } from "@/app/actions/surfaces";
import { SquadriglieSection } from "@/components/reparto/SquadriglieSection";
import { useSurfaceData } from "@/lib/scene/useSurfaceData";
import { PanelSection } from "../PanelSection";
import { SurfaceLoading } from "./SurfaceLoading";

/**
 * Superficie del guidone: le Squadriglie del Reparto e chi ne fa parte.
 *
 * Condivide il caricamento con la cassetta di Reparto (stessa chiave di cache):
 * membri e Squadriglie sono la stessa fotografia del Reparto, chiederla due
 * volte al database non avrebbe senso.
 */
export function SquadriglieSurface() {
  const { data, reload } = useSurfaceData("reparto", loadRepartoSurface);

  if (!data) return <SurfaceLoading label="Prendo il guidone…" />;

  if (!data.repartoNome) {
    return (
      <PanelSection title="Squadriglie">
        <p className="font-sans text-sm leading-relaxed">
          Le Squadriglie appartengono a un Reparto: prima serve esserne parte.
        </p>
      </PanelSection>
    );
  }

  return (
    <div className="mt-5">
      <SquadriglieSection
        squadriglie={data.squadriglie}
        members={data.members}
        isCapoOrAdmin={data.isCapoOrAdmin}
        onMutated={reload}
      />
    </div>
  );
}
