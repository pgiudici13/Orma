import { BoxGeometry, CylinderGeometry } from "three";

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

/** Larghezza X, spessore Y, profondità Z. */
export const CARD_GEOMETRY = new BoxGeometry(0.42, 0.006, 0.6);

export const NOTEBOOK_GEOMETRY = new BoxGeometry(0.3, 0.05, 0.42);

export const CALENDAR_GEOMETRY = new BoxGeometry(0.26, 0.012, 0.31);

export const SHEET_GEOMETRY = new BoxGeometry(0.3, 0.002, 0.39);

export const TABLE_GEOMETRY = new BoxGeometry(3.6, 0.09, 2.4);

export const PENCIL_GEOMETRY = new CylinderGeometry(0.008, 0.008, 0.34, 8);

export const PENCIL_TIP_GEOMETRY = new CylinderGeometry(0.0, 0.008, 0.035, 8);

export const COMPASS_BODY_GEOMETRY = new CylinderGeometry(
  0.075,
  0.075,
  0.018,
  32,
);

export const COMPASS_FACE_GEOMETRY = new CylinderGeometry(
  0.062,
  0.062,
  0.002,
  32,
);
