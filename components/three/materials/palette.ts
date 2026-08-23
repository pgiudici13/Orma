/**
 * Ponte fra i token materiali definiti in `app/globals.css`
 * (vedi `docs/VISUAL_REFERENCE.md`) e i materiali/texture della scena 3D.
 *
 * I valori vivono nel CSS: qui vengono letti a runtime, così esiste una sola
 * fonte di verità per la palette. I fallback servono solo quando non c'è un
 * documento da interrogare (SSR, test) e replicano i valori documentati.
 */

export const MATERIAL_FALLBACK = {
  "--wood-base": "#8a6a49",
  "--wood-dark": "#42311f",
  "--wood-grain": "#5c4530",
  "--paper-base": "#e7dec7",
  "--paper-aged": "#d6c7a1",
  "--fabric-base": "#3c4a38",
  "--metal-base": "#8d8c7e",
  "--ink": "#2c2216",
  "--accent": "#9c3b2b",
  "--brass-base": "#b08a4f",
  "--brass-dark": "#7c5f34",
  "--glass-warm": "#f7e8ca",
  "--lamp-flame": "#ffb46b",
} as const;

export type MaterialToken = keyof typeof MATERIAL_FALLBACK;

export function materialColor(token: MaterialToken): string {
  if (typeof window === "undefined") return MATERIAL_FALLBACK[token];

  const value = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue(token)
    .trim();

  return value || MATERIAL_FALLBACK[token];
}

/** Mescola due colori esadecimali (`ratio` = quota del secondo colore). */
export function mix(from: string, to: string, ratio: number): string {
  const parse = (hex: string) => {
    const value = hex.replace("#", "");
    const full =
      value.length === 3
        ? value
            .split("")
            .map((c) => c + c)
            .join("")
        : value;
    return [
      parseInt(full.slice(0, 2), 16),
      parseInt(full.slice(2, 4), 16),
      parseInt(full.slice(4, 6), 16),
    ];
  };

  const [r1, g1, b1] = parse(from);
  const [r2, g2, b2] = parse(to);
  const channel = (a: number, b: number) =>
    Math.round(a + (b - a) * ratio)
      .toString(16)
      .padStart(2, "0");

  return `#${channel(r1, r2)}${channel(g1, g2)}${channel(b1, b2)}`;
}
