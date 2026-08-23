"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useState } from "react";
import { textureBudgetBytes } from "./materials/textures";

/**
 * Strumento di sviluppo per il budget di performance della scena
 * (`docs/SDD.md` §10). Non viene incluso in produzione.
 *
 * `PerfProbe` vive dentro il Canvas e legge i contatori del renderer;
 * `PerfOverlay` li mostra fuori dal Canvas, come normale DOM.
 */

type Snapshot = {
  calls: number;
  triangles: number;
  textures: number;
  frameMs: number;
};

/** Ciò che finisce su `window.__ormaPerf`: lo snapshot più la memoria texture. */
type Measurement = Snapshot & { textureBytes: number };

const snapshot: Snapshot = {
  calls: 0,
  triangles: 0,
  textures: 0,
  frameMs: 0,
};

const EMPTY: Measurement = { ...snapshot, textureBytes: 0 };

export const PERF_ENABLED = process.env.NODE_ENV !== "production";

export function PerfProbe() {
  const gl = useThree((state) => state.gl);

  useFrame((_, delta) => {
    // Picco, non ultimo valore: con `frameloop="demand"` la scena smette di
    // disegnare appena è ferma, e l'ultimo frame renderizzato può essere un
    // passaggio ausiliario (la cottura dell'ambiente, una mappa d'ombra) i cui
    // contatori descrivono qualcosa che non è la scena. Il budget di
    // `docs/SDD.md` §10 riguarda comunque il frame più costoso.
    snapshot.calls = Math.max(snapshot.calls, gl.info.render.calls);
    snapshot.triangles = Math.max(snapshot.triangles, gl.info.render.triangles);
    snapshot.textures = Math.max(snapshot.textures, gl.info.memory.textures);
    // Media mobile: un singolo frame è troppo rumoroso per essere leggibile.
    snapshot.frameMs = snapshot.frameMs * 0.9 + delta * 1000 * 0.1;

    // Esposto solo in sviluppo, per il controllo automatico del budget nel
    // test end-to-end (`tests/e2e/table.spec.ts`).
    (window as unknown as Record<string, unknown>).__ormaPerf = {
      ...snapshot,
      textureBytes: textureBudgetBytes(),
    };
  });

  return null;
}

export function PerfOverlay() {
  const [stats, setStats] = useState<Measurement>(EMPTY);

  // La sonda vive dentro il Canvas, caricato in un chunk separato da questo
  // overlay: i due non condividono l'oggetto di modulo. `window.__ormaPerf` è
  // l'unica fonte che entrambi vedono — la stessa che legge l'E2E, quindi HUD
  // e test non possono raccontare due storie diverse.
  useEffect(() => {
    const id = window.setInterval(() => {
      const measured = (window as unknown as { __ormaPerf?: Measurement })
        .__ormaPerf;
      if (measured) setStats(measured);
    }, 500);
    return () => window.clearInterval(id);
  }, []);

  const textureMb = (stats.textureBytes / (1024 * 1024)).toFixed(1);

  return (
    <div className="pointer-events-none absolute bottom-3 left-3 z-30 rounded-[2px] bg-black/55 px-2.5 py-1.5 font-mono text-[11px] leading-relaxed text-white/85">
      <div>draw calls: {stats.calls}</div>
      <div>triangoli: {stats.triangles}</div>
      <div>
        texture: {stats.textures} ({textureMb} MB)
      </div>
      <div>frame: {stats.frameMs.toFixed(1)} ms</div>
    </div>
  );
}
