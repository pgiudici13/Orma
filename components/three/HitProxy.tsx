"use client";

import type { SceneObjectKind } from "@/lib/scene/objects";
import { HIT_GEOMETRY, hitScale } from "./geometry";

/**
 * Volume di presa di un oggetto interattivo.
 *
 * Gli oggetti del tavolo sono sottili (il foglio è spesso 2 mm): con la sola
 * geometria visibile il puntatore li centra a fatica e il click cade sul piano.
 * Questa mesh dà a ogni oggetto un volume di presa generoso, coerente con il
 * gesto reale di prendere in mano qualcosa che sta su un tavolo.
 *
 * È `visible={false}`: non viene disegnata (nessuna draw call, nessun materiale
 * da comporre) ma resta intersecabile dal raycaster — comportamento verificato
 * in `tests/unit/hitProxy.test.ts`, che fallisce se un aggiornamento di Three.js
 * dovesse reintrodurre l'esclusione degli oggetti invisibili dal raycasting.
 */
export function HitProxy({ kind }: { kind: SceneObjectKind }) {
  return (
    <mesh visible={false} geometry={HIT_GEOMETRY} scale={hitScale(kind)} />
  );
}
