import { create } from "zustand";
import type { SceneObjectId } from "./objects";

/**
 * Stato di presentazione della scena tavolo (DEC-004).
 *
 * Contiene solo stato di scena — quale oggetto è a fuoco e da quale punto dello
 * schermo è stato aperto. Nessun dato di dominio: contenuto ufficiale e dati
 * personali arrivano da Supabase tramite Server Components (SDD §9).
 */

/** Punto dello schermo da cui è partita l'apertura, per la continuità visiva. */
export type FocusOrigin = { x: number; y: number };

export type SceneState = {
  focusedId: SceneObjectId | null;
  focusOrigin: FocusOrigin | null;
  focus: (id: SceneObjectId, origin?: FocusOrigin) => void;
  clear: () => void;
};

export const useSceneStore = create<SceneState>((set) => ({
  focusedId: null,
  focusOrigin: null,
  focus: (id, origin) => set({ focusedId: id, focusOrigin: origin ?? null }),
  clear: () => set({ focusedId: null, focusOrigin: null }),
}));
