"use client";

import { createContext, useContext, type ReactNode } from "react";
import { SCENE_OBJECTS, type SceneObject } from "./objects";

/**
 * Lista di oggetti di scena realmente in uso. Senza un Provider (es. nei test
 * unitari che rendono `TableFlat`/`ObjectPanel` isolati) si ricade sul set
 * dimostrativo di Fase 2 (`SCENE_OBJECTS`), così i test esistenti restano
 * validi senza dover simulare dati Supabase.
 */
const SceneDataContext = createContext<readonly SceneObject[] | null>(null);

export function SceneDataProvider({
  objects,
  children,
}: {
  objects: readonly SceneObject[];
  children: ReactNode;
}) {
  return (
    <SceneDataContext.Provider value={objects}>
      {children}
    </SceneDataContext.Provider>
  );
}

export function useSceneObjects(): readonly SceneObject[] {
  return useContext(SceneDataContext) ?? SCENE_OBJECTS;
}
