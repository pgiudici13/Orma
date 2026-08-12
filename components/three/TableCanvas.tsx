"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useState } from "react";
import { useSceneStore } from "@/lib/scene/store";
import { CameraRig } from "./CameraRig";
import { Lighting } from "./Lighting";
import { PERF_ENABLED, PerfProbe } from "./PerfHud";
import { SceneObjects } from "./SceneObjects";
import { TableTop } from "./TableTop";

/**
 * Scena tavolo (P2-T01). Client Component isolata: nessun WebGL viene mai
 * creato lato server (SDD §9).
 *
 * `frameloop="demand"` tiene fermo il render loop finché la scena è a riposo —
 * un tavolo statico non deve consumare GPU. Le animazioni chiedono
 * esplicitamente i frame di cui hanno bisogno tramite `invalidate()`.
 * Con `?perf=1` il loop resta continuo per poter misurare il frame rate reale.
 */

/** Ridisegna una volta quando i font web usati dalle texture sono pronti. */
function FontsReadyInvalidate() {
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    document.fonts?.ready.then(() => invalidate());
  }, [invalidate]);

  return null;
}

export function TableCanvas() {
  const clear = useSceneStore((state) => state.clear);
  // La scena è caricata solo sul client (`ssr: false`), quindi la query string
  // è già leggibile al primo render.
  const [continuousLoop] = useState(
    () =>
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("perf") === "1",
  );

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      frameloop={continuousLoop ? "always" : "demand"}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 2.05, 1.75], fov: 38, near: 0.1, far: 20 }}
      onPointerMissed={(event) => {
        // Vale come "click a vuoto" solo ciò che avviene davvero sulla
        // superficie della scena: l'attivazione da tastiera di un hotspot
        // genera un click che risale fin qui e chiuderebbe subito il pannello
        // appena aperto.
        if (event.target instanceof HTMLCanvasElement) clear();
      }}
    >
      <color attach="background" args={["#150f08"]} />
      <fog attach="fog" args={["#150f08", 4.2, 8]} />

      <Lighting />
      <TableTop />
      <SceneObjects />
      <CameraRig />
      <FontsReadyInvalidate />
      {PERF_ENABLED ? <PerfProbe /> : null}
    </Canvas>
  );
}
