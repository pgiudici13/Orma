"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { findSceneObject, type SceneObject } from "@/lib/scene/objects";
import { useSceneObjects } from "@/lib/scene/SceneDataContext";
import { useSceneStore } from "@/lib/scene/store";
import { SURFACE_MAX_WIDTH, surfaceFor } from "./surfaces";

/**
 * Pannello di contenuto dell'oggetto a fuoco (P2-T04).
 *
 * È DOM, non 3D: il contenuto testuale resta leggibile, selezionabile e
 * accessibile (SDD §9, NFR-6). Entra dalla direzione in cui si trovava
 * l'oggetto aperto, così la sequenza legge come "l'oggetto si apre" e non come
 * un cambio di pagina (`docs/UX.md`).
 *
 * Questo file si occupa solo dell'involucro — apertura, chiusura, focus,
 * intestazione. Cosa ci sia scritto dentro lo decide il registro delle
 * superfici (`components/panel/surfaces/`).
 */

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function ObjectPanel() {
  const focusedId = useSceneStore((state) => state.focusedId);
  const focusOrigin = useSceneStore((state) => state.focusOrigin);
  const clear = useSceneStore((state) => state.clear);
  const reducedMotion = useReducedMotion();
  const objects = useSceneObjects();

  const object = focusedId
    ? (findSceneObject(objects, focusedId) ?? null)
    : null;

  const hasWindow = typeof window !== "undefined";
  const offsetX =
    focusOrigin && hasWindow
      ? clamp((focusOrigin.x - window.innerWidth * 0.72) * 0.3, -90, 60)
      : 0;
  const offsetY =
    focusOrigin && hasWindow
      ? clamp((focusOrigin.y - window.innerHeight * 0.5) * 0.3, -70, 70)
      : 0;

  return (
    <AnimatePresence>
      {object ? (
        <motion.div
          key={object.id}
          className="pointer-events-none fixed inset-0 z-20 flex items-end justify-center p-3 md:items-stretch md:justify-end md:p-6"
          initial={
            reducedMotion
              ? { opacity: 0 }
              : { opacity: 0, x: offsetX, y: offsetY, scale: 0.94 }
          }
          animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
          exit={
            reducedMotion
              ? { opacity: 0 }
              : { opacity: 0, x: offsetX * 0.6, y: offsetY * 0.6, scale: 0.96 }
          }
          transition={
            reducedMotion
              ? { duration: 0 }
              : { type: "spring", stiffness: 240, damping: 30, mass: 0.9 }
          }
        >
          <PanelSheet object={object} onClose={clear} />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function PanelSheet({
  object,
  onClose,
}: {
  object: SceneObject;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const { component: Surface, width } = surfaceFor(object);

  useEffect(() => {
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      // Il focus torna all'oggetto da cui si è partiti, non all'inizio pagina.
      const hotspot = document.querySelector<HTMLElement>(
        `[data-scene-hotspot="${object.id}"]`,
      );
      hotspot?.focus();
    };
  }, [object.id, onClose]);

  return (
    <section
      role="dialog"
      aria-labelledby={`panel-title-${object.id}`}
      className={`pointer-events-auto flex max-h-full w-full ${SURFACE_MAX_WIDTH[width]} flex-col overflow-y-auto rounded-[3px] p-6 shadow-[0_24px_48px_-24px_rgba(15,10,4,0.75)]`}
      style={{
        backgroundColor: "var(--paper-base)",
        color: "var(--ink)",
        border:
          "1px solid color-mix(in srgb, var(--wood-dark) 28%, transparent)",
      }}
    >
      <header className="flex items-start justify-between gap-4">
        <div>
          <p
            className="font-sans text-[10px] tracking-[0.16em] uppercase"
            style={{ color: "color-mix(in srgb, var(--ink) 60%, transparent)" }}
          >
            {object.label}
          </p>
          <h2
            id={`panel-title-${object.id}`}
            className="font-serif text-2xl leading-tight"
          >
            {object.title}
          </h2>
        </div>

        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Chiudi e torna al tavolo"
          className="-mt-1 shrink-0 cursor-pointer rounded-[2px] px-2 py-1 font-sans text-xs tracking-wide outline-offset-2 focus-visible:outline-2"
          style={{
            color: "color-mix(in srgb, var(--ink) 70%, transparent)",
            border:
              "1px solid color-mix(in srgb, var(--wood-dark) 22%, transparent)",
            outlineColor: "var(--accent)",
          }}
        >
          Chiudi
        </button>
      </header>

      <Surface object={object} />
    </section>
  );
}
