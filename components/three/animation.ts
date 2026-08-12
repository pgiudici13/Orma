/**
 * Smorzamento esponenziale indipendente dal frame rate.
 *
 * Usato al posto di una libreria di easing: il movimento della scena è sempre
 * "raggiungi questo valore in modo morbido", mai una sequenza coreografata
 * (`docs/DESIGN.md` — interazioni morbide, brevi, prevedibili).
 */
export function damp(
  current: number,
  target: number,
  lambda: number,
  delta: number,
): number {
  return current + (target - current) * (1 - Math.exp(-lambda * delta));
}

/** Soglia sotto la quale un valore è considerato arrivato a destinazione. */
export const SETTLED = 0.0005;
