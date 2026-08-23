"use client";

import { loadAdesione } from "@/app/actions/surfaces";
import { RichiediRepartoForm } from "@/app/onboarding-reparto/RichiediRepartoForm";
import { useSurfaceData } from "@/lib/scene/useSurfaceData";
import { SurfaceLoading } from "./SurfaceLoading";

/**
 * Busta della richiesta di adesione a un Reparto (RD-T07).
 *
 * Sostituisce la pagina `/onboarding-reparto`: chi non appartiene ancora a un
 * Reparto trova sul tavolo una busta da compilare, non un modulo a pagina
 * piena. Il gate del middleware continua a portare qui — la rotta esiste
 * ancora, ma apre il tavolo con la busta già in mano.
 */
export function AdesioneSurface() {
  const { data } = useSurfaceData("adesione", loadAdesione);

  if (!data) return <SurfaceLoading label="Apro la busta…" />;

  if (data.inAttesa) {
    return (
      <p className="mt-6 font-sans text-sm leading-relaxed">
        La tua richiesta è in attesa: la deciderà un Capo del Reparto o un
        amministratore. Fino ad allora il tavolo resta il tuo, ma senza gli
        oggetti di Reparto.
      </p>
    );
  }

  return (
    <div className="mt-5">
      <p
        className="font-sans text-sm leading-relaxed"
        style={{ color: "color-mix(in srgb, var(--ink) 82%, transparent)" }}
      >
        {data.rifiutata
          ? "La tua richiesta precedente è stata rifiutata. Puoi inviarne una nuova."
          : "Per avere sul tavolo gli oggetti del tuo Reparto, chiedi l'adesione."}
      </p>

      <RichiediRepartoForm reparti={data.reparti} />
    </div>
  );
}
