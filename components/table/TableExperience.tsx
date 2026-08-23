"use client";

import { motion, useReducedMotion } from "motion/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import { ObjectPanel } from "@/components/panel/ObjectPanel";
import {
  type CardData,
  type EventoData,
  mergeSceneObjects,
} from "@/lib/scene/objects";
import { SceneDataProvider } from "@/lib/scene/SceneDataContext";
import { useSceneCapabilities } from "@/lib/scene/useSceneCapabilities";
import { useSceneStore } from "@/lib/scene/store";
import { TableFlat } from "./TableFlat";

/**
 * Punto di ingresso del tavolo: sceglie fra scena 3D e composizione 2D
 * (DEC-013) e ospita il pannello di contenuto condiviso dalle due rese.
 *
 * Il codice 3D è caricato solo quando serve davvero: chi resta sulla
 * composizione 2D (mobile, WebGL assente, movimento ridotto) non scarica
 * Three.js.
 *
 * Quando un oggetto è a fuoco il tavolo resta visibile ma sfocato e più scuro
 * (`docs/UX.md`): il blur vive sul layer DOM, non in post-processing 3D
 * (DEC-014).
 */

const TableCanvas = dynamic(
  () => import("@/components/three/TableCanvas").then((mod) => mod.TableCanvas),
  { ssr: false },
);

const PerfOverlay = dynamic(
  () => import("@/components/three/PerfHud").then((mod) => mod.PerfOverlay),
  { ssr: false },
);

const SHOW_PERF = process.env.NODE_ENV !== "production";

export function TableExperience({
  cards = [],
  events = [],
}: {
  /** Specialità/Competenze/Tappe con progresso attivo (P3-T04), da Supabase. */
  cards?: CardData[];
  /** Eventi del calendario di Reparto (P7-T03). */
  events?: EventoData[];
}) {
  const { mode } = useSceneCapabilities();
  const focusedId = useSceneStore((state) => state.focusedId);
  const clear = useSceneStore((state) => state.clear);
  const reducedMotion = useReducedMotion();
  const objects = useMemo(() => mergeSceneObjects(cards, events), [cards, events]);

  // Ogni cambio di modalità riparte dal tavolo: un oggetto aperto nella scena
  // 3D non deve restare a fuoco in una composizione che non lo mostra così.
  const previousMode = useRef(mode);
  useEffect(() => {
    if (previousMode.current !== mode) {
      previousMode.current = mode;
      clear();
    }
  }, [mode, clear]);

  const focused = Boolean(focusedId);

  return (
    <SceneDataProvider objects={objects}>
      <div
        className="relative flex w-full flex-1 flex-col"
        data-table-mode={mode}
      >
        <motion.div
          className="relative flex min-h-[640px] flex-1 flex-col"
          animate={{
            filter: focused
              ? "blur(4px) brightness(0.8)"
              : "blur(0px) brightness(1)",
          }}
          transition={
            reducedMotion
              ? { duration: 0 }
              : { duration: 0.45, ease: "easeOut" }
          }
        >
          {mode === "scene3d" ? (
            <div className="absolute inset-0">
              <TableCanvas />
            </div>
          ) : (
            <TableFlat />
          )}
        </motion.div>

        <ObjectPanel />

        {!focused ? (
          <div className="absolute top-3 right-3 z-10 flex items-center gap-4">
            <Link
              href="/reparto"
              className="font-sans text-[11px] tracking-wide underline underline-offset-2"
              style={{
                color: "color-mix(in srgb, var(--ink) 75%, transparent)",
              }}
            >
              Reparto
            </Link>
            <Link
              href="/impostazioni"
              className="font-sans text-[11px] tracking-wide underline underline-offset-2"
              style={{
                color: "color-mix(in srgb, var(--ink) 55%, transparent)",
              }}
            >
              Impostazioni
            </Link>
          </div>
        ) : null}

        {SHOW_PERF && mode === "scene3d" ? <PerfOverlay /> : null}
      </div>
    </SceneDataProvider>
  );
}
