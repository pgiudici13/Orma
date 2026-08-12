"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { addNota, markCompleted } from "@/app/actions/personalProgress";
import {
  findSceneObject,
  type CardData,
  type ContentKind,
  type SceneObject,
} from "@/lib/scene/objects";
import { useSceneObjects } from "@/lib/scene/SceneDataContext";
import { useSceneStore } from "@/lib/scene/store";

/**
 * Pannello di contenuto dell'oggetto a fuoco (P2-T04).
 *
 * È DOM, non 3D: il contenuto testuale resta leggibile, selezionabile e
 * accessibile (SDD §9, NFR-6). Entra dalla direzione in cui si trovava
 * l'oggetto aperto, così la sequenza legge come "l'oggetto si apre" e non come
 * un cambio di pagina (`docs/UX.md`).
 *
 * L'ordine delle sezioni è quello prescritto da `docs/UX.md`:
 * contenuto ufficiale → progressi → note → Maestro.
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
      className="pointer-events-auto flex max-h-full w-full max-w-[26rem] flex-col overflow-y-auto rounded-[3px] p-6 shadow-[0_24px_48px_-24px_rgba(15,10,4,0.75)]"
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

      <PanelSection title="Contenuto ufficiale">
        {object.card ? (
          <p className="font-serif text-sm leading-relaxed">
            {object.card.title}
            {/* Nessun testo descrittivo ufficiale nel modello dati attuale
                (solo nome e immagine, P3-T01): nessun testo va inventato. */}
          </p>
        ) : (
          <p className="font-serif text-sm leading-relaxed italic">
            Il testo ufficiale di questa carta non è ancora stato caricato.
          </p>
        )}
      </PanelSection>

      <PanelSection title="Progresso">
        {object.card ? (
          <ProgressoSection kind={object.card.kind} card={object.card} />
        ) : (
          <p className="font-sans text-sm leading-relaxed">
            Nessun obiettivo registrato.
          </p>
        )}
      </PanelSection>

      <PanelSection title="Note personali">
        {object.card ? (
          <NoteSection kind={object.card.kind} card={object.card} />
        ) : (
          <p className="font-sans text-sm leading-relaxed">
            Non hai ancora scritto note su questa carta.
          </p>
        )}
      </PanelSection>

      <PanelSection title="Maestro">
        <p className="font-sans text-sm leading-relaxed">
          {object.card?.maestroNome ?? "Nessun Maestro associato."}
        </p>
      </PanelSection>
    </section>
  );
}

function PanelSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="mt-5 border-t pt-4"
      style={{
        borderColor: "color-mix(in srgb, var(--ink) 14%, transparent)",
      }}
    >
      <h3
        className="font-sans text-[10px] tracking-[0.16em] uppercase"
        style={{ color: "color-mix(in srgb, var(--ink) 55%, transparent)" }}
      >
        {title}
      </h3>
      <div
        className="mt-2"
        style={{ color: "color-mix(in srgb, var(--ink) 82%, transparent)" }}
      >
        {children}
      </div>
    </div>
  );
}

const STATO_LABEL: Record<NonNullable<CardData["stato"]>, string> = {
  in_corso: "In corso",
  completata: "Completata",
};

function ProgressoSection({
  kind,
  card,
}: {
  kind: ContentKind;
  card: CardData;
}) {
  const canComplete =
    (kind === "specialita" || kind === "competenza") &&
    card.stato === "in_corso";

  return (
    <div className="flex flex-col gap-2 font-sans text-sm leading-relaxed">
      <p>
        {card.stato ? STATO_LABEL[card.stato] : "In corso"}
        {card.dataInizio ? ` — avviata il ${card.dataInizio}` : ""}
        {card.dataCompletamento
          ? `, completata il ${card.dataCompletamento}`
          : ""}
      </p>

      {canComplete ? (
        <form action={markCompleted.bind(null, kind, card.id)}>
          <button
            type="submit"
            className="cursor-pointer text-[11px] tracking-wide underline underline-offset-2"
            style={{ color: "var(--accent)" }}
          >
            Segna come completata
          </button>
        </form>
      ) : null}
    </div>
  );
}

function NoteSection({ kind, card }: { kind: ContentKind; card: CardData }) {
  return (
    <div className="flex flex-col gap-3 font-sans text-sm leading-relaxed">
      {card.note.length === 0 ? (
        <p>Non hai ancora scritto note su questa carta.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {card.note.map((nota) => (
            <li
              key={nota.id}
              className="rounded-[2px] p-2"
              style={{
                backgroundColor:
                  "color-mix(in srgb, var(--paper-aged) 55%, transparent)",
              }}
            >
              {nota.testo}
            </li>
          ))}
        </ul>
      )}

      <form action={addNota} className="flex flex-col gap-2">
        <input type="hidden" name="tipo" value={kind} />
        <input type="hidden" name="riferimentoId" value={card.id} />
        <textarea
          name="testo"
          rows={2}
          placeholder="Aggiungi una nota…"
          required
          className="rounded-[2px] p-2 text-sm"
          style={{
            backgroundColor: "var(--paper-base)",
            border:
              "1px solid color-mix(in srgb, var(--wood-dark) 22%, transparent)",
            color: "var(--ink)",
          }}
        />
        <button
          type="submit"
          className="cursor-pointer self-start text-[11px] tracking-wide underline underline-offset-2"
          style={{ color: "var(--accent)" }}
        >
          Salva nota
        </button>
      </form>
    </div>
  );
}
