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

const WIDE_VIEWPORT = "(min-width: 768px)";
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

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
  reducedMotion: boolean;
  /** `false` finché il componente non è montato sul client. */
  ready: boolean;
} {
  const [state, setState] = useState({
    mode: "flat" as SceneMode,
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
