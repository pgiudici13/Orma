/**
 * Definizione dichiarativa degli oggetti sul tavolo.
 *
 * Fonte unica per la scena 3D (desktop/tablet) e per la composizione 2D
 * (mobile / no-WebGL): identità, semantica e affordance vivono qui, mentre la
 * disposizione spaziale è specifica di ogni resa.
 *
 * Gli oggetti con `interactive: false` sono decorativi: non intercettano
 * eventi e non generano falsi affordance (`docs/UX.md`).
 */

export type SceneObjectKind =
  | "specialita"
  | "competenza"
  | "tappa"
  | "taccuino"
  | "calendario"
  | "foglio"
  | "matita"
  | "bussola";

export type SceneObjectId =
  | "specialita-nodi"
  | "competenza-fede"
  | "tappa-scoperta"
  | "taccuino"
  | "calendario"
  | "foglio"
  | "matita"
  | "bussola";

export type SceneObject = {
  id: SceneObjectId;
  kind: SceneObjectKind;
  /** Titolo mostrato sull'oggetto e nel pannello. */
  title: string;
  /** Etichetta della famiglia di contenuto ("Specialità", "Tappa", …). */
  label: string;
  interactive: boolean;
  /** Posizione sul piano del tavolo, in metri: [x, z]. Origine al centro. */
  spot: readonly [x: number, z: number];
  /** Rotazione attorno all'asse verticale, in gradi. */
  tilt: number;
};

export const KIND_LABEL: Record<SceneObjectKind, string> = {
  specialita: "Specialità",
  competenza: "Competenza",
  tappa: "Tappa",
  taccuino: "Taccuino",
  calendario: "Calendario",
  foglio: "Foglio",
  matita: "Matita",
  bussola: "Bussola",
};

export const SCENE_OBJECTS: readonly SceneObject[] = [
  {
    id: "specialita-nodi",
    kind: "specialita",
    title: "Nodi e Legature",
    label: KIND_LABEL.specialita,
    interactive: true,
    spot: [-0.34, -0.18],
    tilt: -5,
  },
  {
    id: "tappa-scoperta",
    kind: "tappa",
    title: "Tappa della Scoperta",
    label: KIND_LABEL.tappa,
    interactive: true,
    spot: [0.62, -0.3],
    tilt: 4,
  },
  {
    id: "competenza-fede",
    kind: "competenza",
    title: "Educazione alla Fede",
    label: KIND_LABEL.competenza,
    interactive: true,
    spot: [0.3, 0.34],
    tilt: -8,
  },
  {
    id: "taccuino",
    kind: "taccuino",
    title: "Taccuino",
    label: KIND_LABEL.taccuino,
    interactive: true,
    spot: [-1.02, 0.06],
    tilt: 8,
  },
  {
    id: "calendario",
    kind: "calendario",
    title: "Calendario",
    label: KIND_LABEL.calendario,
    interactive: true,
    spot: [-0.72, 0.5],
    tilt: -3,
  },
  {
    id: "foglio",
    kind: "foglio",
    title: "Foglio di appunti",
    label: KIND_LABEL.foglio,
    interactive: true,
    spot: [-0.06, 0.62],
    tilt: 12,
  },
  {
    id: "matita",
    kind: "matita",
    title: "Matita",
    label: KIND_LABEL.matita,
    interactive: false,
    spot: [0.26, 0.68],
    tilt: -18,
  },
  {
    id: "bussola",
    kind: "bussola",
    title: "Bussola",
    label: KIND_LABEL.bussola,
    interactive: false,
    spot: [1.0, 0.42],
    tilt: 0,
  },
] as const;

export const INTERACTIVE_OBJECTS = SCENE_OBJECTS.filter(
  (object) => object.interactive,
);

export function getSceneObject(id: SceneObjectId): SceneObject {
  const object = SCENE_OBJECTS.find((candidate) => candidate.id === id);
  if (!object) {
    throw new Error(`Oggetto di scena sconosciuto: ${id}`);
  }
  return object;
}

/** Etichetta accessibile usata dagli hotspot da tastiera e dai bottoni 2D. */
export function sceneObjectAriaLabel(object: SceneObject): string {
  return `Apri ${object.label.toLowerCase()}: ${object.title}`;
}
