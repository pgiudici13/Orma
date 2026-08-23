import {
  CanvasTexture,
  RepeatWrapping,
  SRGBColorSpace,
  Texture,
  TextureLoader,
} from "three";
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
const imageCache = new Map<string, Texture>();
const imageLoader = new TextureLoader();
let allocatedBytes = 0;

/** Stima dei byte GPU occupati dalle texture generate (RGBA + mipmap). */
export function textureBudgetBytes(): number {
  return allocatedBytes;
}

/** Solo per i test: svuota la cache e azzera il budget. */
export function resetTextureCache() {
  cache.forEach((texture) => texture.dispose());
  cache.clear();
  imageCache.forEach((texture) => texture.dispose());
  imageCache.clear();
  allocatedBytes = 0;
}

/**
 * Texture reale caricata da Supabase Storage (pipeline P3-T02b), al posto
 * della texture procedurale. Il caricamento è asincrono: `TextureLoader`
 * restituisce subito la texture e la aggiorna (`needsUpdate`) quando
 * l'immagine arriva, come già avviene per i titoli in `createTexture`.
 */
function getImageTexture(url: string): Texture {
  const cached = imageCache.get(url);
  if (cached) return cached;

  const texture = imageLoader.load(url);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;

  imageCache.set(url, texture);
  // Dimensione reale nota solo a caricamento completato; stima conservativa
  // sul target della pipeline (300px di larghezza, SDD §10).
  allocatedBytes += Math.round(300 * 384 * 4 * 1.34);

  return texture;
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

/**
 * Come `createTexture`, per le mappe che non contengono colore ma dati
 * (normali, rugosità, occlusione): niente conversione sRGB, che falserebbe i
 * valori, e nessun ridisegno all'arrivo dei font — qui non c'è testo.
 */
function createDataTexture(
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
  texture.anisotropy = 4;

  cache.set(key, texture);
  allocatedBytes += Math.round(width * height * 4 * 1.34);

  return texture;
}

/**
 * Deriva una normal map da una mappa di altezza in scala di grigi (Sobel a 4
 * campioni). Le coordinate sono cicliche, così una texture pensata per essere
 * ripetuta non mostra una cucitura sui bordi.
 *
 * `strength` è la pendenza: valori bassi per la carta (una fibra si vede
 * appena), più alti per il legno, dove la venatura è un solco vero.
 */
function normalFromHeight(
  key: string,
  size: number,
  drawHeight: DrawFn,
  strength: number,
): CanvasTexture {
  return createDataTexture(key, size, size, (ctx, width, height) => {
    drawHeight(ctx, width, height);

    const source = ctx.getImageData(0, 0, width, height);
    const target = ctx.createImageData(width, height);
    const at = (x: number, y: number) =>
      source.data[
        (((y + height) % height) * width + ((x + width) % width)) * 4
      ] / 255;

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const dx = (at(x - 1, y) - at(x + 1, y)) * strength;
        const dy = (at(x, y - 1) - at(x, y + 1)) * strength;
        const length = Math.hypot(dx, dy, 1);
        const index = (y * width + x) * 4;

        target.data[index] = ((dx / length) * 0.5 + 0.5) * 255;
        target.data[index + 1] = ((dy / length) * 0.5 + 0.5) * 255;
        target.data[index + 2] = (1 / length) * 255;
        target.data[index + 3] = 255;
      }
    }

    ctx.putImageData(target, 0, 0);
  });
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

const WOOD_SIZE = 1024;
const WOOD_PLANKS = 5;

type GrainLine = {
  y: number;
  amplitude: number;
  wavelength: number;
  phase: number;
  width: number;
  alpha: number;
  tone: number;
  /** Asse di appartenenza: la venatura non attraversa mai una fuga. */
  plank: number;
};

type Knot = { x: number; y: number; radius: number };

/**
 * Disegno della venatura, calcolato una volta sola.
 *
 * Colore, rilievo e rugosità del legno devono descrivere le **stesse** fibre:
 * se ognuno se le generasse per conto proprio, la luce scorrerebbe su solchi
 * che non coincidono con le venature che si vedono, ed è esattamente ciò che
 * fa sembrare finto un legno in computer grafica.
 */
let woodPattern: {
  lines: GrainLine[];
  knots: Knot[];
  plankShades: number[];
} | null = null;

function getWoodPattern() {
  if (woodPattern) return woodPattern;

  const random = seededRandom(20250812);
  const lines: GrainLine[] = [];
  const knots: Knot[] = [];
  // Ogni asse viene da un pezzo di tronco diverso: il tono cambia da una
  // all'altra, ed è questa differenza a farle leggere come tavole separate
  // invece che come un unico laminato rigato.
  const plankShades = Array.from(
    { length: WOOD_PLANKS },
    () => random() * 0.16 - 0.06,
  );

  const plankHeight = WOOD_SIZE / WOOD_PLANKS;
  for (let i = 0; i < 220; i += 1) {
    const plank = Math.floor(random() * WOOD_PLANKS);
    lines.push({
      // La fibra resta dentro la propria asse, con un margine dalla fuga.
      y: (plank + 0.08 + random() * 0.84) * plankHeight,
      amplitude: 2 + random() * 9,
      wavelength: 140 + random() * 420,
      phase: random() * Math.PI * 2,
      tone: 0.2 + random() * 0.5,
      alpha: 0.18 + random() * 0.34,
      width: 0.6 + random() * 1.8,
      plank,
    });
  }

  for (let i = 0; i < 6; i += 1) {
    knots.push({
      x: random() * WOOD_SIZE,
      y: random() * WOOD_SIZE,
      radius: 6 + random() * 14,
    });
  }

  woodPattern = { lines, knots, plankShades };
  return woodPattern;
}

/** Esegue un disegno confinato alla singola asse. */
function withinPlank(
  ctx: CanvasRenderingContext2D,
  plank: number,
  width: number,
  draw: () => void,
) {
  const plankHeight = WOOD_SIZE / WOOD_PLANKS;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, plank * plankHeight, width, plankHeight);
  ctx.clip();
  draw();
  ctx.restore();
}

/** Traccia una fibra: condivisa da colore, altezza e rugosità. */
function strokeGrainLine(
  ctx: CanvasRenderingContext2D,
  line: GrainLine,
  width: number,
) {
  ctx.beginPath();
  for (let x = 0; x <= width; x += 8) {
    const offset = Math.sin(x / line.wavelength + line.phase) * line.amplitude;
    if (x === 0) ctx.moveTo(x, line.y + offset);
    else ctx.lineTo(x, line.y + offset);
  }
  ctx.stroke();
}

function strokeKnot(
  ctx: CanvasRenderingContext2D,
  knot: Knot,
  ring: number,
  style: string,
) {
  ctx.strokeStyle = style;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(
    knot.x,
    knot.y,
    knot.radius * ring * 0.32,
    knot.radius * ring * 0.5,
    0.4,
    0,
    Math.PI * 2,
  );
  ctx.stroke();
}

/** Ripetizione della texture sul piano: più largo che profondo. */
function tileWood(texture: CanvasTexture): CanvasTexture {
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  // Senza questo le venature risulterebbero stirate lungo l'asse lungo del
  // tavolo.
  texture.repeat.set(1.4, 1);
  return texture;
}

export function getWoodTexture(): CanvasTexture {
  const texture = createTexture("wood", WOOD_SIZE, WOOD_SIZE, (ctx, w, h) => {
    const base = materialColor("--wood-base");
    const grain = materialColor("--wood-grain");
    const dark = materialColor("--wood-dark");
    const { lines, knots, plankShades } = getWoodPattern();
    const random = seededRandom(778811);

    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);

    // Assi: ognuna con il proprio tono, separate da una fuga scura con il
    // bordo superiore che prende luce, come due tavole accostate.
    const plankHeight = h / WOOD_PLANKS;
    for (let i = 0; i < WOOD_PLANKS; i += 1) {
      const shade = plankShades[i];
      ctx.fillStyle = mix(base, shade < 0 ? dark : "#ffffff", Math.abs(shade));
      ctx.fillRect(0, i * plankHeight, w, plankHeight);

      ctx.strokeStyle = mix(base, dark, 0.9);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, i * plankHeight);
      ctx.lineTo(w, i * plankHeight);
      ctx.stroke();

      ctx.strokeStyle = mix(base, "#ffffff", 0.08);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, i * plankHeight + 2);
      ctx.lineTo(w, i * plankHeight + 2);
      ctx.stroke();
    }

    for (const line of lines) {
      ctx.strokeStyle = mix(base, grain, line.tone);
      ctx.globalAlpha = line.alpha;
      ctx.lineWidth = line.width;
      withinPlank(ctx, line.plank, w, () => strokeGrainLine(ctx, line, w));
    }

    ctx.globalAlpha = 1;
    for (const knot of knots) {
      for (let ring = 5; ring > 0; ring -= 1) {
        ctx.globalAlpha = 0.5;
        strokeKnot(ctx, knot, ring, mix(base, dark, 0.12 * ring));
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

  return tileWood(texture);
}

/** Rilievo delle fibre: le venature sono solchi, i nodi sono avvallamenti. */
export function getWoodNormalTexture(): CanvasTexture {
  const texture = normalFromHeight(
    "wood-normal",
    WOOD_SIZE / 2,
    (ctx, w, h) => {
      const { lines, knots } = getWoodPattern();
      const scale = w / WOOD_SIZE;

      ctx.fillStyle = "#808080";
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.scale(scale, scale);

      // Fuga fra le assi: un solco vero, l'unico rilievo marcato del piano.
      const plankHeight = WOOD_SIZE / WOOD_PLANKS;
      for (let i = 0; i < WOOD_PLANKS; i += 1) {
        ctx.strokeStyle = "rgb(40,40,40)";
        ctx.lineWidth = 3 / scale;
        ctx.beginPath();
        ctx.moveTo(0, i * plankHeight);
        ctx.lineTo(WOOD_SIZE, i * plankHeight);
        ctx.stroke();
      }

      for (const line of lines) {
        // Più la fibra è scura, più il solco è profondo. Il solco resta
        // superficiale: una venatura è una depressione di frazioni di
        // millimetro, non una scanalatura.
        const depth = Math.round(128 - line.tone * 34);
        ctx.strokeStyle = `rgb(${depth},${depth},${depth})`;
        ctx.globalAlpha = line.alpha * 0.7;
        ctx.lineWidth = line.width / scale;
        withinPlank(ctx, line.plank, WOOD_SIZE, () =>
          strokeGrainLine(ctx, line, WOOD_SIZE),
        );
      }

      ctx.globalAlpha = 0.45;
      for (const knot of knots) {
        for (let ring = 5; ring > 0; ring -= 1) {
          strokeKnot(ctx, knot, ring, `rgb(104,104,104)`);
        }
      }
      ctx.restore();
      ctx.globalAlpha = 1;
    },
    1.1,
  );

  return tileWood(texture);
}

/**
 * Finitura del legno, impacchettata in un'unica texture come nel formato glTF:
 * rosso = occlusione ambientale, verde = rugosità, blu = metallicità. Tre mappe
 * in una sola allocazione di memoria.
 *
 * La vernice si consuma sulle fibre in rilievo e resta lucida negli avvallamenti:
 * la venatura si vede quindi anche in un riflesso, non solo nel colore.
 */
export function getWoodSurfaceTexture(): CanvasTexture {
  const texture = createDataTexture(
    "wood-surface",
    WOOD_SIZE / 2,
    WOOD_SIZE / 2,
    (ctx, w, h) => {
      const { lines, knots } = getWoodPattern();
      const scale = w / WOOD_SIZE;

      // Base: nessuna occlusione (R alto), vernice satinata (G medio),
      // nessun metallo (B a zero).
      ctx.fillStyle = "rgb(255,150,0)";
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.scale(scale, scale);
      for (const line of lines) {
        // Fibra più opaca e un filo di ombra propria dentro il solco.
        ctx.strokeStyle = "rgb(225,205,0)";
        ctx.globalAlpha = line.alpha * 0.9;
        ctx.lineWidth = line.width / scale;
        withinPlank(ctx, line.plank, WOOD_SIZE, () =>
          strokeGrainLine(ctx, line, WOOD_SIZE),
        );
      }

      ctx.globalAlpha = 0.5;
      for (const knot of knots) {
        for (let ring = 5; ring > 0; ring -= 1) {
          strokeKnot(ctx, knot, ring, "rgb(200,215,0)");
        }
      }
      ctx.restore();
      ctx.globalAlpha = 1;
    },
  );

  return tileWood(texture);
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

/**
 * Fibra della carta: rilievo minuto e irregolare, ripetuto su tutti gli oggetti
 * di carta del tavolo. È una sola texture piccola condivisa da carte, foglio e
 * calendario — la fibra della carta non cambia da un foglio all'altro, e
 * generarne una per oggetto sprecherebbe memoria per una differenza invisibile.
 */
export function getPaperNormalTexture(): CanvasTexture {
  const texture = normalFromHeight(
    "paper-normal",
    256,
    (ctx, w, h) => {
      const random = seededRandom(5150);

      ctx.fillStyle = "#808080";
      ctx.fillRect(0, 0, w, h);

      // Fibre corte orientate a caso, come in un foglio a mano.
      for (let i = 0; i < 2400; i += 1) {
        const x = random() * w;
        const y = random() * h;
        const length = 1 + random() * 5;
        const angle = random() * Math.PI;
        const tone = Math.round(110 + random() * 60);

        ctx.strokeStyle = `rgb(${tone},${tone},${tone})`;
        ctx.globalAlpha = 0.5;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    },
    0.55,
  );

  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(5, 7);

  return texture;
}

/** Trama della tela del taccuino: ordito e trama regolari, in rilievo. */
export function getFabricNormalTexture(): CanvasTexture {
  const texture = normalFromHeight(
    "fabric-normal",
    256,
    (ctx, w, h) => {
      ctx.fillStyle = "#707070";
      ctx.fillRect(0, 0, w, h);

      const step = 8;
      ctx.lineWidth = step / 2;
      for (let y = 0; y < h; y += step) {
        ctx.strokeStyle = "#c8c8c8";
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      for (let x = 0; x < w; x += step) {
        ctx.strokeStyle = "#9a9a9a";
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
    },
    1.6,
  );

  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(6, 8);

  return texture;
}

const VARIANT_ACCENT: Record<string, () => string> = {
  specialita: () => materialColor("--accent"),
  competenza: () => materialColor("--fabric-base"),
  tappa: () => materialColor("--metal-base"),
};

/**
 * Faccia superiore di una carta. Se `object.imageUrl` è presente carica la
 * texture reale (P3-T02b); altrimenti usa il placeholder procedurale di Fase
 * 2, deliberatamente astratto: nessuna grafica ufficiale AGESCI è riprodotta
 * o simulata.
 */
export function getCardTexture(object: SceneObject): Texture {
  if (object.imageUrl) {
    return getImageTexture(object.imageUrl);
  }
  return getProceduralCardTexture(object);
}

function getProceduralCardTexture(object: SceneObject): CanvasTexture {
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

/**
 * Copertina di un oggetto da tavolo: un fondo di materiale, una toppa di carta
 * incollata sopra e una scritta a mano.
 *
 * È la stessa costruzione per l'album dei distintivi, il quaderno delle
 * Competenze, la rubrica, la tessera e la busta: cambiano colore e parola, non
 * il modo in cui l'oggetto è fatto. Una sola funzione invece di cinque disegni
 * quasi identici — e una sola cosa da correggere quando la resa non convince.
 */
export function getCoverTexture(
  key: string,
  {
    base,
    label,
    labelPaper = true,
    seed = 4242,
  }: { base: string; label: string; labelPaper?: boolean; seed?: number },
): CanvasTexture {
  return createTexture(`cover:${key}`, 256, 320, (ctx, w, h) => {
    const aged = materialColor("--paper-aged");
    const ink = materialColor("--ink");
    const random = seededRandom(seed);

    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);

    // Usura: il materiale non è mai uniforme, soprattutto sui bordi.
    for (let i = 0; i < 500; i += 1) {
      ctx.globalAlpha = 0.04 + random() * 0.07;
      ctx.fillStyle = random() > 0.5 ? "#ffffff" : ink;
      ctx.fillRect(random() * w, random() * h, 1.6, 1.6);
    }
    ctx.globalAlpha = 1;

    if (labelPaper) {
      const px = 34;
      const py = 96;
      const pw = w - 68;
      const ph = 92;

      ctx.fillStyle = aged;
      ctx.fillRect(px, py, pw, ph);
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = mix(aged, ink, 0.4);
      ctx.lineWidth = 1.4;
      ctx.strokeRect(px + 6, py + 6, pw - 12, ph - 12);
      ctx.setLineDash([]);

      ctx.fillStyle = mix(aged, ink, 0.8);
      ctx.font = "500 26px 'Newsreader', Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText(label, w / 2, py + ph / 2 + 9, pw - 28);
      ctx.textAlign = "start";
    } else {
      // Scritta direttamente sul materiale: deve staccare dal fondo, che qui è
      // chiaro (tessera, busta) — non schiarirla ancora.
      ctx.fillStyle = mix(base, ink, 0.72);
      ctx.font = "500 24px 'Newsreader', Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText(label, w / 2, h / 2 + 8, w - 40);
      ctx.textAlign = "start";
    }
  });
}

/** Legno della cassetta di Reparto: assi verticali, più scuro del piano. */
export function getCassettaTexture(): CanvasTexture {
  return createTexture("cassetta", 256, 256, (ctx, w, h) => {
    const base = mix(
      materialColor("--wood-base"),
      materialColor("--wood-dark"),
      0.4,
    );
    const dark = materialColor("--wood-dark");
    const random = seededRandom(31337);

    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);

    // Assi verticali con la fuga in mezzo.
    const boards = 4;
    for (let i = 1; i < boards; i += 1) {
      ctx.strokeStyle = mix(base, dark, 0.75);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo((i * w) / boards, 0);
      ctx.lineTo((i * w) / boards, h);
      ctx.stroke();
    }

    // Venatura verticale e usura sugli spigoli.
    for (let i = 0; i < 90; i += 1) {
      const x = random() * w;
      ctx.strokeStyle = mix(base, dark, 0.2 + random() * 0.4);
      ctx.globalAlpha = 0.2 + random() * 0.3;
      ctx.lineWidth = 0.6 + random() * 1.4;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      for (let y = 0; y <= h; y += 12) {
        ctx.lineTo(x + Math.sin(y / 40 + i) * 2.5, y);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  });
}

/**
 * Drappo del guidone: due bande di colore, nessun emblema.
 *
 * Non riproduce e non simula alcuna grafica ufficiale AGESCI (`CLAUDE.md`):
 * è un guidone generico, come lo sarebbe un pezzo di stoffa cucito in sede.
 */
export function getGuidoneTexture(): CanvasTexture {
  return createTexture("guidone", 256, 192, (ctx, w, h) => {
    const fabric = materialColor("--fabric-base");
    const accent = materialColor("--accent");
    const aged = materialColor("--paper-aged");

    ctx.fillStyle = fabric;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = accent;
    ctx.fillRect(0, h * 0.42, w, h * 0.16);

    // Bordo cucito lungo il lato dell'asta.
    ctx.strokeStyle = mix(fabric, aged, 0.5);
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(6, 4);
    ctx.lineTo(6, h - 4);
    ctx.stroke();
    ctx.setLineDash([]);
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
