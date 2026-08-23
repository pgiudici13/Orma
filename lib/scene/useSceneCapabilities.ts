"use client";

import { useEffect, useState } from "react";

/**
 * Decide come rendere il tavolo (DEC-013).
 *
 * La scena 3D è riservata a desktop/tablet con WebGL disponibile e senza
 * richiesta di movimento ridotto; in tutti gli altri casi (mobile, WebGL
 * assente, `prefers-reduced-motion`, SSR e prima paint) si usa la composizione
 * 2D DOM, che resta leggibile anche senza JavaScript.
 */

export type SceneMode = "scene3d" | "flat";

/**
 * Livello di resa della scena 3D (estensione di DEC-013).
 *
 * `alto` accende ciò che costa davvero — ombre morbide ad area, seconda luce
 * con ombre, risoluzione maggiore delle mappe — e resta riservato alle macchine
 * che possono reggerlo. `base` mantiene la stessa scena e gli stessi materiali,
 * con una sola luce che proietta ombre: cambia la qualità, mai il contenuto.
 */
export type SceneQuality = "alto" | "base";

const WIDE_VIEWPORT = "(min-width: 768px)";
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
const LARGE_VIEWPORT = "(min-width: 1280px)";
const FINE_POINTER = "(pointer: fine)";

/**
 * Stima grossolana ma sufficiente: un tavolo illuminato in tempo reale non ha
 * bisogno di una classificazione precisa della GPU, solo di non chiedere il
 * massimo a una macchina modesta. `?q=base` / `?q=alto` forzano il livello per
 * la verifica visiva.
 */
function detectQuality(): SceneQuality {
  const forced = new URLSearchParams(window.location.search).get("q");
  if (forced === "alto" || forced === "base") return forced;

  const cores = navigator.hardwareConcurrency ?? 4;
  const capable =
    cores >= 8 &&
    window.matchMedia(LARGE_VIEWPORT).matches &&
    window.matchMedia(FINE_POINTER).matches;

  return capable ? "alto" : "base";
}

let webglSupport: boolean | null = null;

export function supportsWebGL(): boolean {
  if (webglSupport !== null) return webglSupport;
  if (typeof document === "undefined") return false;

  try {
    const canvas = document.createElement("canvas");
    webglSupport = Boolean(
      canvas.getContext("webgl2") ?? canvas.getContext("webgl"),
    );
  } catch {
    webglSupport = false;
  }

  return webglSupport;
}

/** Solo per i test: azzera la cache del probe WebGL. */
export function resetWebGLSupportCache() {
  webglSupport = null;
}

export function useSceneCapabilities(): {
  mode: SceneMode;
  quality: SceneQuality;
  reducedMotion: boolean;
  /** `false` finché il componente non è montato sul client. */
  ready: boolean;
} {
  const [state, setState] = useState({
    mode: "flat" as SceneMode,
    quality: "base" as SceneQuality,
    reducedMotion: false,
    ready: false,
  });

  useEffect(() => {
    const wide = window.matchMedia(WIDE_VIEWPORT);
    const reduced = window.matchMedia(REDUCED_MOTION);

    const evaluate = () => {
      const reducedMotion = reduced.matches;
      const canRender3d = wide.matches && !reducedMotion && supportsWebGL();
      setState({
        mode: canRender3d ? "scene3d" : "flat",
        quality: detectQuality(),
        reducedMotion,
        ready: true,
      });
    };

    evaluate();
    wide.addEventListener("change", evaluate);
    reduced.addEventListener("change", evaluate);

    return () => {
      wide.removeEventListener("change", evaluate);
      reduced.removeEventListener("change", evaluate);
    };
  }, []);

  return state;
}
