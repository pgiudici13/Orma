"use client";

import { motion, useReducedMotion } from "motion/react";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef } from "react";
import { ObjectPanel } from "@/components/panel/ObjectPanel";
import {
  buildTable,
  type CardData,
  type EventoData,
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
  hasReparto = true,
  initialFocus,
}: {
  /** Specialità/Competenze/Tappe con progresso attivo (P3-T04), da Supabase. */
  cards?: CardData[];
  /** Eventi del calendario di Reparto (P7-T03). */
  events?: EventoData[];
  /** Se l'utente appartiene a un Reparto: decide quali oggetti stanno sul tavolo. */
  hasReparto?: boolean;
  /**
   * Oggetto da aprire all'arrivo. Le rotte che prima erano pagine piene
   * (`/reparto`, `/impostazioni`, …) sono deep-link al tavolo con l'oggetto
   * corrispondente già a fuoco (DEC-019).
   */
  initialFocus?: string;
}) {
  const { mode, quality } = useSceneCapabilities();
  const focusedId = useSceneStore((state) => state.focusedId);
  const clear = useSceneStore((state) => state.clear);
  const reducedMotion = useReducedMotion();
  const objects = useMemo(
    () => buildTable({ cards, events, hasReparto }),
    [cards, events, hasReparto],
  );

  // Arrivo da un deep-link: l'oggetto è già aperto, ma senza punto di origine —
  // il pannello entra dal centro invece che dalla posizione dell'oggetto,
  // perché nessuno lo ha "preso in mano" da un punto preciso dello schermo.
  const focus = useSceneStore((state) => state.focus);
  const opened = useRef(false);
  useEffect(() => {
    if (!initialFocus || opened.current) return;
    opened.current = true;
    focus(initialFocus);
  }, [initialFocus, focus]);

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
              : { duration: 0.55, ease: "easeOut" }
          }
        >
          {mode === "scene3d" ? (
            <div className="absolute inset-0">
              <TableCanvas quality={quality} />
            </div>
          ) : (
            <TableFlat />
          )}
        </motion.div>

        <ObjectPanel />

        {/* Nessun link di navigazione sopra la scena: Reparto e Impostazioni
            sono oggetti sul tavolo (DEC-019). L'accesso da tastiera resta
            garantito dagli hotspot di ogni oggetto (Tab + Invio). */}

        {SHOW_PERF && mode === "scene3d" ? <PerfOverlay /> : null}
      </div>
    </SceneDataProvider>
  );
}
