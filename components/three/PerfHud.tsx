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

const snapshot: Snapshot = {
  calls: 0,
  triangles: 0,
  textures: 0,
  frameMs: 0,
};

export const PERF_ENABLED = process.env.NODE_ENV !== "production";

export function PerfProbe() {
  const gl = useThree((state) => state.gl);

  useFrame((_, delta) => {
    snapshot.calls = gl.info.render.calls;
    snapshot.triangles = gl.info.render.triangles;
    snapshot.textures = gl.info.memory.textures;
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
  const [stats, setStats] = useState<Snapshot>(snapshot);

  useEffect(() => {
    const id = window.setInterval(() => setStats({ ...snapshot }), 500);
    return () => window.clearInterval(id);
  }, []);

  const textureMb = (textureBudgetBytes() / (1024 * 1024)).toFixed(1);

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
