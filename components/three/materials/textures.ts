import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";
import type { SceneObject } from "@/lib/scene/objects";
import { materialColor, mix } from "./palette";

/**
 * Texture procedurali della scena, generate da canvas 2D a partire dai token
 * materiali. Sono placeholder di Fase 2: gli asset reali (carte ufficiali
 * AGESCI) arrivano dalla pipeline PDF di Fase 3 e sostituiranno solo le `map`,
 * senza toccare geometrie o materiali.
 *
 * Ogni texture è memoizzata a livello di modulo: la stessa superficie esiste
 * una volta sola in memoria, qualunque sia il numero di oggetti che la usano.
 */

const cache = new Map<string, CanvasTexture>();
let allocatedBytes = 0;

/** Stima dei byte GPU occupati dalle texture generate (RGBA + mipmap). */
export function textureBudgetBytes(): number {
  return allocatedBytes;
}

/** Solo per i test: svuota la cache e azzera il budget. */
export function resetTextureCache() {
  cache.forEach((texture) => texture.dispose());
  cache.clear();
  allocatedBytes = 0;
}

type DrawFn = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
) => void;

function createTexture(
  key: string,
  width: number,
  height: number,
  draw: DrawFn,
): CanvasTexture {
  const cached = cache.get(key);
  if (cached) return cached;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error(`Canvas 2D non disponibile per la texture "${key}"`);
  }

  draw(ctx, width, height);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;

  cache.set(key, texture);
  // RGBA a 8 bit + catena di mipmap (~1/3 in più).
  allocatedBytes += Math.round(width * height * 4 * 1.34);

  // I titoli usano i font web caricati da `app/layout.tsx`: quando sono
  // pronti la texture viene ridisegnata una volta sola.
  document.fonts?.ready.then(() => {
    draw(ctx, width, height);
    texture.needsUpdate = true;
  });

  return texture;
}

/** PRNG deterministico: la stessa superficie ha sempre le stesse imperfezioni. */
function seededRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

// ---------------------------------------------------------------- legno

export function getWoodTexture(): CanvasTexture {
  const texture = createTexture("wood", 1024, 1024, (ctx, w, h) => {
    const base = materialColor("--wood-base");
    const grain = materialColor("--wood-grain");
    const dark = materialColor("--wood-dark");
    const random = seededRandom(20250812);

    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);

    // Doghe: leggere variazioni di tono lungo l'asse lungo del tavolo.
    const plankHeight = h / 5;
    for (let i = 0; i < 5; i += 1) {
      const shade = mix(base, i % 2 === 0 ? dark : "#ffffff", 0.05);
      ctx.fillStyle = shade;
      ctx.fillRect(0, i * plankHeight, w, plankHeight);
      ctx.strokeStyle = mix(base, dark, 0.45);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, i * plankHeight);
      ctx.lineTo(w, i * plankHeight);
      ctx.stroke();
    }

    // Venature: linee sinusoidali sottili, mai perfettamente parallele.
    for (let i = 0; i < 220; i += 1) {
      const y = random() * h;
      const amplitude = 2 + random() * 9;
      const wavelength = 140 + random() * 420;
      const phase = random() * Math.PI * 2;

      ctx.strokeStyle = mix(base, grain, 0.2 + random() * 0.5);
      ctx.globalAlpha = 0.18 + random() * 0.34;
      ctx.lineWidth = 0.6 + random() * 1.8;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 8) {
        const offset = Math.sin(x / wavelength + phase) * amplitude;
        if (x === 0) ctx.moveTo(x, y + offset);
        else ctx.lineTo(x, y + offset);
      }
      ctx.stroke();
    }

    // Nodi del legno.
    ctx.globalAlpha = 1;
    for (let i = 0; i < 6; i += 1) {
      const cx = random() * w;
      const cy = random() * h;
      const radius = 6 + random() * 14;
      for (let ring = 5; ring > 0; ring -= 1) {
        ctx.strokeStyle = mix(base, dark, 0.12 * ring);
        ctx.globalAlpha = 0.5;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.ellipse(
          cx,
          cy,
          radius * ring * 0.32,
          radius * ring * 0.5,
          0.4,
          0,
          Math.PI * 2,
        );
        ctx.stroke();
      }
    }

    // Usura: macchie chiare e scure appena percettibili.
    for (let i = 0; i < 60; i += 1) {
      const cx = random() * w;
      const cy = random() * h;
      const radius = 30 + random() * 120;
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      gradient.addColorStop(0, random() > 0.5 ? "#ffffff" : dark);
      gradient.addColorStop(1, "transparent");
      ctx.globalAlpha = 0.035;
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  });

  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  // Il piano è più largo che profondo: senza questo le venature risulterebbero
  // stirate lungo l'asse lungo del tavolo.
  texture.repeat.set(1.4, 1);

  return texture;
}

// ----------------------------------------------------------------- carta

function paperGrain(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  seed: number,
) {
  const ink = materialColor("--ink");
  const random = seededRandom(seed);

  for (let i = 0; i < 2600; i += 1) {
    ctx.globalAlpha = 0.015 + random() * 0.05;
    ctx.fillStyle = random() > 0.5 ? ink : "#ffffff";
    ctx.fillRect(random() * w, random() * h, 1.4, 1.4);
  }
  ctx.globalAlpha = 1;
}

const VARIANT_ACCENT: Record<string, () => string> = {
  specialita: () => materialColor("--accent"),
  competenza: () => materialColor("--fabric-base"),
  tappa: () => materialColor("--metal-base"),
};

/**
 * Faccia superiore di una carta. Placeholder deliberatamente astratto: nessuna
 * grafica ufficiale AGESCI è riprodotta o simulata.
 */
export function getCardTexture(object: SceneObject): CanvasTexture {
  return createTexture(`card:${object.id}`, 384, 548, (ctx, w, h) => {
    const paper = materialColor("--paper-base");
    const aged = materialColor("--paper-aged");
    const ink = materialColor("--ink");
    const accent = VARIANT_ACCENT[object.kind]?.() ?? materialColor("--accent");

    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, w, h);

    // Bordo leggermente ingiallito, come una carta maneggiata.
    const edge = ctx.createLinearGradient(0, 0, 0, h);
    edge.addColorStop(0, mix(paper, aged, 0.5));
    edge.addColorStop(0.12, paper);
    edge.addColorStop(0.88, paper);
    edge.addColorStop(1, mix(paper, aged, 0.6));
    ctx.fillStyle = edge;
    ctx.fillRect(0, 0, w, h);

    paperGrain(ctx, w, h, object.title.length * 977 + 13);

    // Banda del tipo di carta.
    ctx.fillStyle = accent;
    ctx.fillRect(34, 40, 74, 9);

    ctx.fillStyle = mix(paper, ink, 0.62);
    ctx.font = "500 19px 'Geist', system-ui, sans-serif";
    ctx.letterSpacing = "3px";
    ctx.fillText(object.label.toUpperCase(), 34, 86);
    ctx.letterSpacing = "0px";

    // Titolo, in serif editoriale (docs/VISUAL_REFERENCE.md §3).
    ctx.fillStyle = ink;
    ctx.font = "500 38px 'Newsreader', Georgia, serif";
    const words = object.title.split(" ");
    let line = "";
    let y = 148;
    words.forEach((word) => {
      const candidate = line ? `${line} ${word}` : word;
      if (ctx.measureText(candidate).width > w - 68 && line) {
        ctx.fillText(line, 34, y);
        line = word;
        y += 44;
      } else {
        line = candidate;
      }
    });
    ctx.fillText(line, 34, y);

    // Righe di scrittura vuote: struttura, non contenuto inventato.
    ctx.strokeStyle = mix(paper, ink, 0.16);
    ctx.lineWidth = 1;
    for (let i = 0; i < 9; i += 1) {
      const lineY = y + 62 + i * 34;
      ctx.beginPath();
      ctx.moveTo(34, lineY);
      ctx.lineTo(i % 3 === 2 ? w - 120 : w - 34, lineY);
      ctx.stroke();
    }

    // Cornice sottile.
    ctx.strokeStyle = mix(paper, ink, 0.22);
    ctx.lineWidth = 2;
    ctx.strokeRect(16, 16, w - 32, h - 32);
  });
}

export function getSheetTexture(): CanvasTexture {
  return createTexture("sheet", 320, 420, (ctx, w, h) => {
    const paper = materialColor("--paper-aged");
    const ink = materialColor("--ink");

    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, w, h);
    paperGrain(ctx, w, h, 4231);

    ctx.strokeStyle = mix(paper, ink, 0.14);
    ctx.lineWidth = 1;
    for (let i = 1; i < 12; i += 1) {
      const y = i * 32;
      ctx.beginPath();
      ctx.moveTo(24, y);
      ctx.lineTo(i % 4 === 3 ? w - 96 : w - 24, y);
      ctx.stroke();
    }
  });
}

export function getCalendarTexture(): CanvasTexture {
  return createTexture("calendar", 320, 384, (ctx, w, h) => {
    const paper = materialColor("--paper-base");
    const ink = materialColor("--ink");
    const accent = materialColor("--accent");

    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, w, h);
    paperGrain(ctx, w, h, 8891);

    ctx.fillStyle = mix(paper, ink, 0.6);
    ctx.font = "500 20px 'Geist', system-ui, sans-serif";
    ctx.letterSpacing = "4px";
    ctx.fillText("AGOSTO", 28, 56);
    ctx.letterSpacing = "0px";

    ctx.fillStyle = ink;
    ctx.font = "500 132px 'Newsreader', Georgia, serif";
    ctx.fillText("12", 24, 186);

    ctx.fillStyle = accent;
    ctx.fillRect(28, 214, 56, 6);

    ctx.strokeStyle = mix(paper, ink, 0.18);
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i += 1) {
      const y = 258 + i * 30;
      ctx.beginPath();
      ctx.moveTo(28, y);
      ctx.lineTo(i === 3 ? w - 110 : w - 28, y);
      ctx.stroke();
    }
  });
}

export function getCompassTexture(): CanvasTexture {
  return createTexture("compass", 192, 192, (ctx, w, h) => {
    const paper = materialColor("--paper-base");
    const ink = materialColor("--ink");
    const accent = materialColor("--accent");
    const metal = materialColor("--metal-base");
    const cx = w / 2;
    const cy = h / 2;
    const radius = w / 2 - 6;

    ctx.fillStyle = mix(paper, metal, 0.12);
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = mix(paper, ink, 0.5);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 4, 0, Math.PI * 2);
    ctx.stroke();

    // Tacche dei punti cardinali e intermedi.
    for (let i = 0; i < 32; i += 1) {
      const angle = (i * Math.PI) / 16;
      const long = i % 8 === 0;
      const outer = radius - 6;
      const inner = outer - (long ? 16 : i % 4 === 0 ? 10 : 6);
      ctx.strokeStyle = mix(paper, ink, long ? 0.85 : 0.45);
      ctx.lineWidth = long ? 2.4 : 1;
      ctx.beginPath();
      ctx.moveTo(cx + outer * Math.sin(angle), cy - outer * Math.cos(angle));
      ctx.lineTo(cx + inner * Math.sin(angle), cy - inner * Math.cos(angle));
      ctx.stroke();
    }

    // Ago: nord rosso, sud scuro.
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(cx, cy - radius + 26);
    ctx.lineTo(cx + 7, cy);
    ctx.lineTo(cx - 7, cy);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = mix(paper, ink, 0.9);
    ctx.beginPath();
    ctx.moveTo(cx, cy + radius - 26);
    ctx.lineTo(cx + 7, cy);
    ctx.lineTo(cx - 7, cy);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = mix(paper, ink, 0.8);
    ctx.font = "500 15px 'Newsreader', Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("N", cx, 26);
    ctx.textAlign = "start";
  });
}

export function getNotebookTexture(): CanvasTexture {
  return createTexture("notebook", 256, 344, (ctx, w, h) => {
    const fabric = materialColor("--fabric-base");
    const aged = materialColor("--paper-aged");
    const ink = materialColor("--ink");
    const random = seededRandom(7717);

    ctx.fillStyle = fabric;
    ctx.fillRect(0, 0, w, h);

    // Trama della tela.
    for (let y = 0; y < h; y += 3) {
      ctx.strokeStyle = mix(fabric, y % 6 === 0 ? "#ffffff" : ink, 0.08);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    for (let x = 0; x < w; x += 3) {
      ctx.strokeStyle = mix(fabric, x % 6 === 0 ? "#ffffff" : ink, 0.06);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // Toppa etichetta cucita.
    const px = 52;
    const py = 128;
    const pw = w - 104;
    const ph = 88;
    ctx.fillStyle = aged;
    ctx.fillRect(px, py, pw, ph);
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = mix(aged, ink, 0.45);
    ctx.lineWidth = 1.4;
    ctx.strokeRect(px + 6, py + 6, pw - 12, ph - 12);
    ctx.setLineDash([]);

    ctx.fillStyle = mix(aged, ink, 0.75);
    ctx.font = "500 26px 'Newsreader', Georgia, serif";
    ctx.fillText("Taccuino", px + 22, py + 56);

    // Usura sui bordi.
    for (let i = 0; i < 400; i += 1) {
      ctx.globalAlpha = 0.05 + random() * 0.08;
      ctx.fillStyle = random() > 0.5 ? "#ffffff" : ink;
      ctx.fillRect(random() * w, random() * h, 1.5, 1.5);
    }
    ctx.globalAlpha = 1;
  });
}
