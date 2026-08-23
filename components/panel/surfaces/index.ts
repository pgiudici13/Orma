import type { ComponentType } from "react";
import type { SceneObject, SceneObjectKind } from "@/lib/scene/objects";
import { AdesioneSurface } from "./AdesioneSurface";
import { ArchivioSurface } from "./ArchivioSurface";
import { CalendarioSurface } from "./CalendarioSurface";
import { CardSurface } from "./CardSurface";
import { CatalogoSurface } from "./CatalogoSurface";
import { ImpostazioniSurface } from "./ImpostazioniSurface";
import { MaestriSurface } from "./MaestriSurface";
import { RepartoSurface } from "./RepartoSurface";
import { SquadriglieSurface } from "./SquadriglieSurface";

/**
 * Registro delle superfici di contenuto.
 *
 * Ogni oggetto del tavolo apre la propria superficie dentro lo stesso pannello
 * (`components/panel/ObjectPanel.tsx`): qui si dichiara quale, e quanto spazio
 * le serve. Aggiungere un oggetto al tavolo significa aggiungere una riga qui,
 * non un ramo in uno `switch` dentro il pannello.
 */

export type SurfaceProps = { object: SceneObject };

/**
 * Formato del foglio su cui è scritta la superficie.
 *
 * `foglio` è la carta A6 di una scheda personale; `steso` è il foglio grande
 * aperto sul tavolo, per gli elenchi di Reparto. In nessuno dei due casi il
 * pannello copre tutto lo schermo: il tavolo deve restare visibile dietro
 * (`docs/UX.md`).
 */
export type SurfaceWidth = "foglio" | "steso";

export type Surface = {
  component: ComponentType<SurfaceProps>;
  width: SurfaceWidth;
};

export const SURFACE_MAX_WIDTH: Record<SurfaceWidth, string> = {
  foglio: "max-w-[26rem]",
  steso: "max-w-[46rem]",
};

const SURFACES: Partial<Record<SceneObjectKind, Surface>> = {
  calendario: { component: CalendarioSurface, width: "steso" },
  cassetta: { component: RepartoSurface, width: "steso" },
  guidone: { component: SquadriglieSurface, width: "steso" },
  album: { component: CatalogoSurface, width: "steso" },
  quaderno: { component: CatalogoSurface, width: "steso" },
  mappa: { component: CatalogoSurface, width: "steso" },
  rubrica: { component: MaestriSurface, width: "foglio" },
  baule: { component: ArchivioSurface, width: "steso" },
  tessera: { component: ImpostazioniSurface, width: "foglio" },
  busta: { component: AdesioneSurface, width: "foglio" },
};

/**
 * Superficie di ripiego: la scheda di una carta. Vale per Specialità,
 * Competenze e Tappe e per gli oggetti che non hanno ancora una superficie
 * propria (taccuino, foglio), che mostrano i segnaposto senza inventare dati.
 */
const DEFAULT_SURFACE: Surface = { component: CardSurface, width: "foglio" };

export function surfaceFor(object: SceneObject): Surface {
  return SURFACES[object.kind] ?? DEFAULT_SURFACE;
}
