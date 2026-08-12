"use client";

import { useMemo } from "react";
import type { SceneObject } from "@/lib/scene/objects";
import { CARD_GEOMETRY } from "./geometry";
import { getCardTexture } from "./materials/textures";

/**
 * Carta di Specialità / Competenza / Tappa.
 *
 * Tutte le carte condividono `CARD_GEOMETRY`: cambia solo la texture della
 * faccia (vincolo di `CLAUDE.md`, verificato in `tests/unit/geometry.test.ts`).
 */
export function Card3D({ object }: { object: SceneObject }) {
  const map = useMemo(() => getCardTexture(object), [object]);

  return (
    <mesh castShadow receiveShadow geometry={CARD_GEOMETRY}>
      <meshStandardMaterial map={map} roughness={0.86} metalness={0} />
    </mesh>
  );
}
