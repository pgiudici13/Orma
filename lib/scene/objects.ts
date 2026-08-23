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
  | "bussola"
  | "cassetta"
  | "guidone"
  | "album"
  | "quaderno"
  | "mappa"
  | "rubrica"
  | "tessera"
  | "busta";

/**
 * Gli oggetti decorativi/di navigazione hanno id letterali fissi. Le carte di
 * contenuto (P3-T04) hanno invece id derivati da dati reali (`kind:slug`),
 * quindi il tipo resta una stringa: l'unione letterale non può più coprirli.
 */
export type SceneObjectId = string;

export type EventoData = {
  id: string;
  titolo: string;
  descrizione?: string;
  tipo: "uscita" | "campo" | "riunione" | "altro";
  dataInizio: string;
  dataFine?: string;
  luogo?: string;
};

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
  /**
   * URL della texture reale (Supabase Storage, pipeline P3-T02b). Se assente,
   * la carta usa la texture procedurale di Fase 2 (components/three/materials/textures.ts).
   */
  imageUrl?: string;
  /**
   * Dati di dominio completi, presenti solo per le carte reali costruite da
   * `buildCardSceneObjects` (P3-T05). Assente per gli oggetti decorativi e
   * per il set dimostrativo di Fase 2: il pannello mostra i placeholder
   * originali quando `card` non c'è.
   */
  card?: CardData;
  /** Eventi del calendario di Reparto (P7-T03). */
  events?: readonly EventoData[];
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
  cassetta: "Reparto",
  guidone: "Squadriglie",
  album: "Specialità",
  quaderno: "Competenze",
  mappa: "Tappe",
  rubrica: "Maestri",
  tessera: "Impostazioni",
  busta: "Reparto",
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
    id: "cassetta-reparto",
    kind: "cassetta",
    title: "Cassetta di Reparto",
    label: KIND_LABEL.cassetta,
    interactive: true,
    spot: [1.3, -0.15],
    tilt: -12,
  },
  {
    id: "guidone",
    kind: "guidone",
    title: "Guidone di Squadriglia",
    label: KIND_LABEL.guidone,
    interactive: true,
    spot: [1.35, 0.62],
    tilt: 14,
  },
  {
    id: "album-specialita",
    kind: "album",
    title: "Album dei distintivi",
    label: KIND_LABEL.album,
    interactive: true,
    spot: [-1.5, -0.12],
    tilt: 6,
  },
  {
    id: "quaderno-competenze",
    kind: "quaderno",
    title: "Quaderno delle Competenze",
    label: KIND_LABEL.quaderno,
    interactive: true,
    spot: [-1.35, 0.68],
    tilt: -9,
  },
  {
    id: "mappa-tappe",
    kind: "mappa",
    title: "Mappa delle Tappe",
    label: KIND_LABEL.mappa,
    interactive: true,
    spot: [0.06, -0.74],
    tilt: -4,
  },
  {
    id: "rubrica-maestri",
    kind: "rubrica",
    title: "Rubrica dei Maestri",
    label: KIND_LABEL.rubrica,
    interactive: true,
    spot: [-0.62, 0.95],
    tilt: 11,
  },
  {
    id: "tessera",
    kind: "tessera",
    title: "Tessera personale",
    label: KIND_LABEL.tessera,
    interactive: true,
    spot: [0.66, 0.94],
    tilt: -7,
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
    id: "busta-adesione",
    kind: "busta",
    title: "Richiesta di adesione",
    label: KIND_LABEL.busta,
    interactive: true,
    spot: [1.05, 0.95],
    tilt: 5,
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

/** Come `getSceneObject`, ma su una lista qualunque (dati reali, P3-T04). */
export function findSceneObject(
  objects: readonly SceneObject[],
  id: SceneObjectId,
): SceneObject | undefined {
  return objects.find((candidate) => candidate.id === id);
}

/** Etichetta accessibile usata dagli hotspot da tastiera e dai bottoni 2D. */
export function sceneObjectAriaLabel(object: SceneObject): string {
  return `Apri ${object.label.toLowerCase()}: ${object.title}`;
}

export type ContentKind = "specialita" | "competenza" | "tappa";

export type NotaData = { id: string; testo: string };

/** Una Specialità/Competenza/Tappa con progresso utente attivo (P3-T04/T08). */
export type CardData = {
  id: string;
  kind: ContentKind;
  slug: string;
  title: string;
  imageUrl?: string;
  /** Assente per le Tappe: non hanno un campo stato (solo date). */
  stato?: "in_corso" | "completata";
  dataInizio?: string;
  dataCompletamento?: string;
  note: NotaData[];
  maestroNome?: string;
};

/**
 * Posizione/rotazione delle carte di contenuto sul tavolo, una per famiglia.
 * Stessi valori del set dimostrativo originale di Fase 2, così la
 * composizione visiva tuned non cambia quando arrivano dati reali.
 *
 * Semplificazione dichiarata (vedi piano P3-T04): sul tavolo compare al più
 * una carta per famiglia (la prima con progresso attivo); il resto del
 * percorso personale si consulta dal catalogo dedicato, non dal tavolo.
 */
const CONTENT_SLOT: Record<
  ContentKind,
  { spot: readonly [number, number]; tilt: number }
> = {
  specialita: { spot: [-0.34, -0.18], tilt: -5 },
  tappa: { spot: [0.62, -0.3], tilt: 4 },
  competenza: { spot: [0.3, 0.34], tilt: -8 },
};

/** Oggetti decorativi/di navigazione: sempre presenti, mai da dati reali. */
export const DECORATIVE_OBJECTS: readonly SceneObject[] = SCENE_OBJECTS.filter(
  (object) => !(object.kind in CONTENT_SLOT),
);

/** Converte le carte con progresso attivo in oggetti di scena posizionati. */
export function buildCardSceneObjects(
  cards: readonly CardData[],
): SceneObject[] {
  const firstPerKind = new Map<ContentKind, CardData>();
  for (const card of cards) {
    if (!firstPerKind.has(card.kind)) firstPerKind.set(card.kind, card);
  }

  return Array.from(firstPerKind.values()).map((card) => {
    const { spot, tilt } = CONTENT_SLOT[card.kind];
    return {
      id: `${card.kind}:${card.slug}`,
      kind: card.kind,
      title: card.title,
      label: KIND_LABEL[card.kind],
      interactive: true,
      spot,
      tilt,
      imageUrl: card.imageUrl,
      card,
    } satisfies SceneObject;
  });
}

/**
 * Contesto da cui dipende cosa c'è sul tavolo.
 *
 * Il tavolo non è una lista fissa: cambia con il percorso dell'utente (le carte
 * in corso), con il suo Reparto (calendario, membri, Squadriglie) e con il suo
 * ruolo. Tenere la decisione in un unico posto evita che scena 3D e
 * composizione 2D divergano su quali oggetti esistono (DEC-013).
 */
export type TableContext = {
  /** Specialità/Competenze/Tappe con progresso attivo. */
  cards?: readonly CardData[];
  /** Eventi del Reparto, mostrati dal calendario. */
  events?: readonly EventoData[];
  /**
   * Se l'utente appartiene già a un Reparto. Chi non ne fa parte trova sul
   * tavolo la busta della richiesta di adesione al posto degli oggetti di
   * Reparto: il tavolo racconta la situazione reale invece di offrire cassetti
   * vuoti.
   */
  hasReparto?: boolean;
};

/** Oggetti che hanno senso solo dentro un Reparto. */
const REPARTO_KINDS: ReadonlySet<SceneObjectKind> = new Set([
  "cassetta",
  "guidone",
  "calendario",
]);

/** Lista completa da mostrare sul tavolo, dato il contesto dell'utente. */
export function buildTable({
  cards = [],
  events,
  hasReparto = true,
}: TableContext = {}): readonly SceneObject[] {
  const decorative = DECORATIVE_OBJECTS.filter((object) =>
    object.kind === "busta"
      ? !hasReparto
      : hasReparto || !REPARTO_KINDS.has(object.kind),
  ).map((object) =>
    object.kind === "calendario" && events ? { ...object, events } : object,
  );

  return [...buildCardSceneObjects(cards), ...decorative];
}
