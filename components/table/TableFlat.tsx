"use client";

import { Logo } from "@/components/Logo";
import { sceneObjectAriaLabel, type SceneObject } from "@/lib/scene/objects";
import { useSceneObjects } from "@/lib/scene/SceneDataContext";
import { useSceneStore } from "@/lib/scene/store";
import { Calendar } from "./Calendar";
import { Card } from "./Card";
import { Compass } from "./Compass";
import { FadeIn } from "./FadeIn";
import { LooseSheet } from "./LooseSheet";
import { Notebook } from "./Notebook";
import { Pencil } from "./Pencil";
import { Plaque } from "./Plaque";
import { TableSurface } from "./TableSurface";

/**
 * Composizione 2D del tavolo (DEC-013).
 *
 * Serve mobile, i browser senza WebGL e chi ha chiesto movimento ridotto. Non è
 * la scena 3D rimpicciolita: su schermi stretti gli oggetti sono ricomposti in
 * una colonna, come un tavolo visto da vicino invece che dall'alto
 * (`docs/UX.md` — l'esperienza mobile va riprogettata, non compressa).
 *
 * Gli oggetti aprono lo stesso `ObjectPanel` della scena 3D, tramite lo stesso
 * store: il pattern di interazione è identico su tutti i formati.
 */

type Placement = { top: string; left: string; rotate: number };

/** Posizione degli oggetti decorativi/di navigazione (id fissi). */
const WIDE_LAYOUT_DECORATIVE: Record<string, Placement> = {
  taccuino: { top: "18%", left: "12%", rotate: -6 },
  calendario: { top: "52%", left: "13%", rotate: -2 },
  foglio: { top: "78%", left: "34%", rotate: 5 },
  "album-specialita": { top: "16%", left: "34%", rotate: 4 },
  "quaderno-competenze": { top: "80%", left: "13%", rotate: -8 },
  "mappa-tappe": { top: "10%", left: "58%", rotate: -3 },
  "rubrica-maestri": { top: "80%", left: "56%", rotate: 9 },
  tessera: { top: "88%", left: "76%", rotate: -6 },
  "busta-adesione": { top: "88%", left: "76%", rotate: 4 },
  "cassetta-reparto": { top: "30%", left: "86%", rotate: -6 },
  guidone: { top: "58%", left: "84%", rotate: 10 },
  matita: { top: "70%", left: "44%", rotate: -8 },
  bussola: { top: "44%", left: "88%", rotate: 0 },
};

/**
 * Posizione delle carte di contenuto, una per famiglia (id dinamici, P3-T04:
 * non si può più indicizzare per id fisso come in Fase 2).
 */
const WIDE_LAYOUT_CONTENT: Record<string, Placement> = {
  specialita: { top: "26%", left: "38%", rotate: -3 },
  tappa: { top: "22%", left: "72%", rotate: 2 },
  competenza: { top: "56%", left: "58%", rotate: 4 },
};

function widePlacement(object: SceneObject): Placement | undefined {
  return WIDE_LAYOUT_DECORATIVE[object.id] ?? WIDE_LAYOUT_CONTENT[object.kind];
}

/** Ordine di lettura nella composizione stretta (mobile): famiglie di contenuto, poi decorativi selezionati. */
const NARROW_CONTENT_ORDER = ["specialita", "tappa", "competenza"] as const;
const NARROW_DECORATIVE_ORDER = [
  "busta-adesione",
  "cassetta-reparto",
  "guidone",
  "calendario",
  "album-specialita",
  "quaderno-competenze",
  "mappa-tappe",
  "rubrica-maestri",
  "taccuino",
  "foglio",
  "tessera",
] as const;

function ObjectVisual({ object }: { object: SceneObject }) {
  switch (object.kind) {
    case "specialita":
    case "competenza":
    case "tappa":
      return <Card variant={object.kind} title={object.title} />;
    case "taccuino":
      return <Notebook />;
    case "calendario":
      return <Calendar day="12" month="Agosto" />;
    case "foglio":
      return <LooseSheet note="Prossima uscita: sabato ore 8:30, stazione." />;
    case "matita":
      return <Pencil className="w-32" />;
    case "bussola":
      return <Compass className="w-20" />;
    case "cassetta":
      return <Plaque label={object.label} title={object.title} />;
    case "album":
    case "mappa":
      return <Plaque label={object.label} title={object.title} />;
    case "guidone":
    case "quaderno":
    case "rubrica":
      return (
        <Plaque label={object.label} title={object.title} tone="tessuto" />
      );
    case "tessera":
    case "busta":
      return <LooseSheet note={object.title} />;
  }
}

function Interactive({ object }: { object: SceneObject }) {
  const focus = useSceneStore((state) => state.focus);

  if (!object.interactive) {
    return (
      <div aria-hidden>
        <ObjectVisual object={object} />
      </div>
    );
  }

  return (
    <button
      type="button"
      data-scene-hotspot={object.id}
      aria-label={sceneObjectAriaLabel(object)}
      className="block cursor-pointer rounded-[3px] outline-offset-4 transition-transform duration-200 hover:-translate-y-1 focus-visible:outline-2"
      style={{ outlineColor: "var(--accent)" }}
      onClick={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        focus(object.id, {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        });
      }}
    >
      <ObjectVisual object={object} />
    </button>
  );
}

export function TableFlat() {
  const objects = useSceneObjects();

  const contentByKind = new Map(objects.map((o) => [o.kind, o]));
  const decorativeById = new Map(objects.map((o) => [o.id, o]));
  const narrowObjects = [
    ...NARROW_CONTENT_ORDER.map((kind) => contentByKind.get(kind)),
    ...NARROW_DECORATIVE_ORDER.map((id) => decorativeById.get(id)),
  ].filter((object): object is SceneObject => Boolean(object));

  return (
    <div className="relative min-h-[640px] w-full flex-1 overflow-hidden">
      <TableSurface />

      <Logo
        className="pointer-events-none absolute top-[4%] left-1/2 -translate-x-1/2 text-3xl"
        style={{
          color: "color-mix(in srgb, var(--wood-dark) 55%, transparent)",
          textShadow: "0 1px 0 color-mix(in srgb, white 12%, transparent)",
        }}
      />

      {/* Composizione larga: oggetti sparsi sul piano, vista dall'alto. */}
      <div className="absolute inset-0 hidden md:block">
        {objects.map((object, index) => {
          const placement = widePlacement(object);
          if (!placement) return null;

          return (
            <div
              key={object.id}
              className="absolute"
              style={{
                top: placement.top,
                left: placement.left,
                transform: `translate(-50%, -50%) rotate(${placement.rotate}deg)`,
              }}
            >
              <FadeIn delay={index * 0.05}>
                <Interactive object={object} />
              </FadeIn>
            </div>
          );
        })}
      </div>

      {/* Composizione stretta: il tavolo visto da vicino, in colonna. */}
      <div className="flex flex-col items-center gap-6 px-6 pt-24 pb-16 md:hidden">
        {narrowObjects.map((object, index) => (
          <FadeIn
            key={object.id}
            delay={index * 0.05}
            className="w-full max-w-[17rem]"
          >
            <div
              className="flex justify-center"
              style={{
                transform: `rotate(${index % 2 === 0 ? -1.5 : 1.5}deg)`,
              }}
            >
              <Interactive object={object} />
            </div>
          </FadeIn>
        ))}

        <div className="mt-2 flex items-end gap-8 opacity-90">
          <Pencil className="w-24 rotate-[-8deg]" />
          <Compass className="w-16" />
        </div>
      </div>
    </div>
  );
}
