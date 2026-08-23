import {
  BoxGeometry,
  BufferGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  Shape,
  SphereGeometry,
  TorusGeometry,
  Vector2,
} from "three";
import type { SceneObjectKind } from "@/lib/scene/objects";

/**
 * Geometrie singleton condivise dalla scena.
 *
 * Vincolo esplicito di `CLAUDE.md`: un solo modello per famiglia di oggetti,
 * texture diverse — mai geometria duplicata per carta. Tutte le carte di
 * Specialità, Competenza e Tappa condividono la stessa istanza di
 * `CARD_GEOMETRY`.
 *
 * Misure in metri, coerenti con un tavolo reale: la carta è poco più grande di
 * un A6, il taccuino sta in tasca.
 */

/** Ingombro di un oggetto appoggiato sul piano: larghezza X, spessore Y, profondità Z. */
export type ObjectSize = {
  readonly width: number;
  readonly height: number;
  readonly depth: number;
};

const CARD_SIZE = { width: 0.42, height: 0.006, depth: 0.6 } as const;
const NOTEBOOK_SIZE = { width: 0.3, height: 0.05, depth: 0.42 } as const;
const CALENDAR_SIZE = { width: 0.26, height: 0.012, depth: 0.31 } as const;
const SHEET_SIZE = { width: 0.3, height: 0.002, depth: 0.39 } as const;

const PENCIL_RADIUS = 0.008;
const PENCIL_LENGTH = 0.34;
const COMPASS_RADIUS = 0.075;
const COMPASS_THICKNESS = 0.018;

/**
 * Lastra appoggiata sul piano, con angoli arrotondati e spigoli smussati.
 *
 * Uno spigolo vivo non esiste in natura: è la sottile smussatura sul bordo a
 * raccogliere la luce e a dire all'occhio "questo oggetto ha uno spessore".
 * Una carta modellata come parallelepipedo perfetto legge come un rettangolo
 * stampato sul tavolo, per quanto sia buona la texture (`docs/DESIGN.md`).
 *
 * La forma vive nel piano XY e viene estrusa lungo Z, poi coricata: la faccia
 * stampata guarda in alto e la texture arriva dritta, con la sommità
 * dell'immagine sul lato lontano dalla camera, esattamente come con la
 * geometria a scatola che questa sostituisce.
 */
function roundedPlate(
  { width, height, depth }: ObjectSize,
  cornerRadius: number,
): BufferGeometry {
  // La smussatura cresce verso l'esterno della sagoma: la forma va rientrata
  // di altrettanto, altrimenti l'oggetto finito misura più di quanto dichiara
  // in `OBJECT_SIZE` — da cui dipendono appoggio e volume di presa.
  const bevel = Math.min(height * 0.35, 0.0016);
  const halfWidth = width / 2 - bevel;
  const halfDepth = depth / 2 - bevel;
  const radius = Math.min(cornerRadius, halfWidth, halfDepth);

  const shape = new Shape();
  shape.moveTo(-halfWidth + radius, -halfDepth);
  shape.lineTo(halfWidth - radius, -halfDepth);
  shape.quadraticCurveTo(halfWidth, -halfDepth, halfWidth, -halfDepth + radius);
  shape.lineTo(halfWidth, halfDepth - radius);
  shape.quadraticCurveTo(halfWidth, halfDepth, halfWidth - radius, halfDepth);
  shape.lineTo(-halfWidth + radius, halfDepth);
  shape.quadraticCurveTo(-halfWidth, halfDepth, -halfWidth, halfDepth - radius);
  shape.lineTo(-halfWidth, -halfDepth + radius);
  shape.quadraticCurveTo(
    -halfWidth,
    -halfDepth,
    -halfWidth + radius,
    -halfDepth,
  );

  const geometry = new ExtrudeGeometry(shape, {
    depth: height - bevel * 2,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
    curveSegments: 4,
    // Il generatore predefinito userebbe le coordinate del mondo come UV: la
    // texture della carta finirebbe ripetuta e fuori scala.
    UVGenerator: {
      generateTopUV: (_geometry, vertices, a, b, c) =>
        [a, b, c].map(
          (index) =>
            new Vector2(
              vertices[index * 3] / width + 0.5,
              vertices[index * 3 + 1] / depth + 0.5,
            ),
        ),
      // Il bordo prende il colore della carta vicino al margine: è spesso
      // pochi millimetri, non deve mostrare un frammento leggibile di texture.
      generateSideWallUV: () => [
        new Vector2(0.04, 0.02),
        new Vector2(0.05, 0.02),
        new Vector2(0.05, 0.03),
        new Vector2(0.04, 0.03),
      ],
    },
  });

  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, -(height - bevel * 2) / 2, 0);

  return geometry;
}

export const CARD_GEOMETRY = roundedPlate(CARD_SIZE, 0.008);

export const NOTEBOOK_GEOMETRY = roundedPlate(NOTEBOOK_SIZE, 0.006);

export const CALENDAR_GEOMETRY = roundedPlate(CALENDAR_SIZE, 0.004);

export const SHEET_GEOMETRY = roundedPlate(SHEET_SIZE, 0.003);

const TABLE_SIZE = { width: 3.6, height: 0.09, depth: 2.4 } as const;

export const TABLE_GEOMETRY = roundedPlate(TABLE_SIZE, 0.02);

export const PENCIL_GEOMETRY = new CylinderGeometry(
  PENCIL_RADIUS,
  PENCIL_RADIUS,
  PENCIL_LENGTH,
  8,
);

export const PENCIL_TIP_GEOMETRY = new CylinderGeometry(
  0.0,
  PENCIL_RADIUS,
  0.035,
  8,
);

export const COMPASS_BODY_GEOMETRY = new CylinderGeometry(
  COMPASS_RADIUS,
  COMPASS_RADIUS,
  COMPASS_THICKNESS,
  32,
);

export const COMPASS_FACE_GEOMETRY = new CylinderGeometry(
  COMPASS_RADIUS - 0.013,
  COMPASS_RADIUS - 0.013,
  0.002,
  32,
);

// -------------------------------------- percorso, rubrica, tessera, busta

const ALBUM_SIZE = { width: 0.3, height: 0.045, depth: 0.36 } as const;
const QUADERNO_SIZE = { width: 0.24, height: 0.028, depth: 0.32 } as const;
const RUBRICA_SIZE = { width: 0.16, height: 0.032, depth: 0.22 } as const;
const TESSERA_SIZE = { width: 0.15, height: 0.005, depth: 0.095 } as const;
const BUSTA_SIZE = { width: 0.23, height: 0.005, depth: 0.155 } as const;

/** Mappa arrotolata: un tubo di carta coricato, legato con un cordino. */
const MAPPA_RADIUS = 0.035;
const MAPPA_LENGTH = 0.42;
const MAPPA_SIZE = {
  width: MAPPA_LENGTH,
  height: MAPPA_RADIUS * 2,
  depth: MAPPA_RADIUS * 2,
} as const;

export const ALBUM_GEOMETRY = roundedPlate(ALBUM_SIZE, 0.005);
export const QUADERNO_GEOMETRY = roundedPlate(QUADERNO_SIZE, 0.004);
export const RUBRICA_GEOMETRY = roundedPlate(RUBRICA_SIZE, 0.004);
export const TESSERA_GEOMETRY = roundedPlate(TESSERA_SIZE, 0.006);
export const BUSTA_GEOMETRY = roundedPlate(BUSTA_SIZE, 0.003);

export const MAPPA_ROLL_GEOMETRY = new CylinderGeometry(
  MAPPA_RADIUS,
  MAPPA_RADIUS,
  MAPPA_LENGTH,
  20,
);

/** Cordino che tiene chiusa la mappa. */
export const MAPPA_CORD_GEOMETRY = new TorusGeometry(
  MAPPA_RADIUS + 0.002,
  0.0025,
  6,
  18,
);

// -------------------------------------------------- cassetta e guidone

const CASSETTA_SIZE = { width: 0.34, height: 0.13, depth: 0.24 } as const;

/** Corpo della cassetta: cassa di legno del Reparto. */
export const CASSETTA_BODY_GEOMETRY = new BoxGeometry(
  CASSETTA_SIZE.width,
  CASSETTA_SIZE.height * 0.78,
  CASSETTA_SIZE.depth,
);

/** Coperchio, appoggiato leggermente inclinato come se fosse stato riaperto. */
export const CASSETTA_LID_GEOMETRY = roundedPlate(
  {
    width: CASSETTA_SIZE.width + 0.012,
    height: CASSETTA_SIZE.height * 0.16,
    depth: CASSETTA_SIZE.depth + 0.012,
  },
  0.006,
);

/** Cinghia di cuoio che chiude la cassetta sul davanti. */
export const CASSETTA_STRAP_GEOMETRY = new BoxGeometry(
  0.045,
  CASSETTA_SIZE.height * 0.84,
  0.004,
);

const GUIDONE_SIZE = { width: 0.44, height: 0.012, depth: 0.2 } as const;

/**
 * Guidone di Squadriglia: asta corta e drappo a coda di rondine, posato sul
 * tavolo. La forma è quella di un guidone qualunque — nessun emblema, nessuna
 * grafica ufficiale riprodotta (`CLAUDE.md`, "Assets").
 */
export const GUIDONE_STAFF_GEOMETRY = new CylinderGeometry(
  0.006,
  0.006,
  GUIDONE_SIZE.width,
  10,
);

export const GUIDONE_CLOTH_GEOMETRY = (() => {
  const width = 0.27;
  const half = GUIDONE_SIZE.depth / 2;
  const shape = new Shape();
  shape.moveTo(0, half);
  shape.lineTo(width, half * 0.62);
  // Coda di rondine: la punta rientra al centro del lato lungo.
  shape.lineTo(width * 0.78, 0);
  shape.lineTo(width, -half * 0.62);
  shape.lineTo(0, -half);
  shape.closePath();

  const geometry = new ExtrudeGeometry(shape, {
    depth: 0.003,
    bevelEnabled: false,
    curveSegments: 1,
    UVGenerator: {
      generateTopUV: (_geometry, vertices, a, b, c) =>
        [a, b, c].map(
          (index) =>
            new Vector2(
              vertices[index * 3] / width,
              vertices[index * 3 + 1] / GUIDONE_SIZE.depth + 0.5,
            ),
        ),
      generateSideWallUV: () => [
        new Vector2(0.02, 0.5),
        new Vector2(0.03, 0.5),
        new Vector2(0.03, 0.52),
        new Vector2(0.02, 0.52),
      ],
    },
  });

  geometry.rotateX(-Math.PI / 2);
  return geometry;
})();

// ------------------------------------------------------------ lampada a gas

/**
 * Lampada a gas da campo: base svasata, serbatoio, vetro, cappello e maniglia.
 *
 * Ogni pezzo è un solido di rivoluzione a 24 lati — abbastanza per un profilo
 * pulito a questa distanza, abbastanza poco da restare nel budget. Le quote
 * sono quelle di una lanterna vera: circa 22 cm di altezza totale.
 */
const LAMP_SEGMENTS = 24;

export const LAMP_BASE_GEOMETRY = new CylinderGeometry(
  0.07,
  0.092,
  0.024,
  LAMP_SEGMENTS,
);

export const LAMP_TANK_GEOMETRY = new CylinderGeometry(
  0.06,
  0.07,
  0.07,
  LAMP_SEGMENTS,
);

export const LAMP_COLLAR_GEOMETRY = new CylinderGeometry(
  0.046,
  0.06,
  0.019,
  LAMP_SEGMENTS,
);

/** Vetro: cilindro aperto ai due capi, si guarda attraverso. */
export const LAMP_GLASS_GEOMETRY = new CylinderGeometry(
  0.04,
  0.049,
  0.135,
  LAMP_SEGMENTS,
  1,
  true,
);

export const LAMP_CAP_GEOMETRY = new CylinderGeometry(
  0.024,
  0.057,
  0.038,
  LAMP_SEGMENTS,
);

/** Fiamma: una goccia allungata, non una sfera. */
export const LAMP_FLAME_GEOMETRY = new SphereGeometry(0.015, 10, 12);

/** Alone attorno alla fiamma: il vetro che diffonde la luce. */
export const LAMP_HALO_GEOMETRY = new SphereGeometry(0.056, 12, 12);

export const LAMP_HANDLE_GEOMETRY = new TorusGeometry(
  0.062,
  0.004,
  6,
  20,
  Math.PI,
);

/**
 * Ingombro reale di ogni famiglia di oggetti, nell'orientamento in cui poggia
 * sul tavolo. Deriva dalle stesse costanti delle geometrie, così quota di
 * appoggio e volume di presa non sono numeri magici da tenere allineati a mano.
 *
 * La matita è ruotata di 90° dentro `Props3D`: il suo ingombro è quindi quello
 * del cilindro coricato, non quello della geometria in piedi.
 */
export const OBJECT_SIZE: Record<SceneObjectKind, ObjectSize> = {
  specialita: CARD_SIZE,
  competenza: CARD_SIZE,
  tappa: CARD_SIZE,
  taccuino: NOTEBOOK_SIZE,
  calendario: CALENDAR_SIZE,
  foglio: SHEET_SIZE,
  matita: {
    width: PENCIL_LENGTH,
    height: PENCIL_RADIUS * 2,
    depth: PENCIL_RADIUS * 2,
  },
  bussola: {
    width: COMPASS_RADIUS * 2,
    height: COMPASS_THICKNESS,
    depth: COMPASS_RADIUS * 2,
  },
  cassetta: CASSETTA_SIZE,
  guidone: GUIDONE_SIZE,
  album: ALBUM_SIZE,
  quaderno: QUADERNO_SIZE,
  mappa: MAPPA_SIZE,
  rubrica: RUBRICA_SIZE,
  tessera: TESSERA_SIZE,
  busta: BUSTA_SIZE,
};

/** Quota di appoggio sul piano: metà dello spessore dell'oggetto. */
export function restingHeight(kind: SceneObjectKind): number {
  return OBJECT_SIZE[kind].height / 2;
}

/**
 * Box unitario condiviso dai volumi di presa (`HitProxy`), scalato per oggetto:
 * una sola geometria per tutte le mesh di presa della scena.
 */
export const HIT_GEOMETRY = new BoxGeometry(1, 1, 1);

/**
 * Volume di presa minimo, in metri. Sotto questa soglia l'oggetto è troppo
 * piccolo perché il puntatore lo centri con sicurezza: il foglio è spesso 2 mm
 * e senza un volume dedicato si può cliccare solo di taglio.
 */
const MIN_HIT: ObjectSize = { width: 0.19, height: 0.07, depth: 0.19 };
const HIT_MARGIN = 1.15;

/** Scala da applicare a `HIT_GEOMETRY` per l'oggetto indicato. */
export function hitScale(kind: SceneObjectKind): [number, number, number] {
  const size = OBJECT_SIZE[kind];
  return [
    Math.max(size.width * HIT_MARGIN, MIN_HIT.width),
    Math.max(size.height * HIT_MARGIN, MIN_HIT.height),
    Math.max(size.depth * HIT_MARGIN, MIN_HIT.depth),
  ];
}
