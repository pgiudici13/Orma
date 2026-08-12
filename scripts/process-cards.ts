/**
 * Pipeline asset P3-T02b: assets/source/distintivi/** (JPEG originali forniti
 * dall'utente) → assets/processed/distintivi/**.webp + manifest JSON per il
 * seed Supabase (P3-T02b/P3-T01/P3-T04).
 *
 * Esecuzione manuale una tantum, non a runtime: `node scripts/process-cards.ts`.
 * Non modifica mai i file in assets/source/ (fonte master, DEC-005).
 */

import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SOURCE_ROOT = path.join(process.cwd(), "assets/source/distintivi");
const PROCESSED_ROOT = path.join(process.cwd(), "assets/processed/distintivi");
const MANIFEST_PATH = path.join(PROCESSED_ROOT, "manifest.json");

/**
 * Correzioni esplicite dei refusi nei filename sorgente. Nessuna correzione
 * automatica silenziosa (CLAUDE.md): ogni voce qui è verificabile a mano.
 * Chiave = nome derivato dal filename (dopo title-case), valore = nome corretto.
 */
const NAME_CORRECTIONS: Record<string, string> = {
  Elettrecista: "Elettricista",
  Interpetre: "Interprete",
  Collezzionista: "Collezionista",
  "Servizio missonario": "Servizio missionario",
};

type Category = "specialita" | "brevetti" | "tappe";

type ManifestEntry = {
  slug: string;
  nome: string;
  immagine_path: string;
  ordine?: number;
};

const TAPPA_ORDER: Record<string, number> = {
  scoperta: 1,
  competenza: 2,
  responsabilita: 3,
};

/** Maiuscola solo sulla prima lettera (stile italiano), resto invariato. */
function sentenceCase(input: string): string {
  return input.length === 0 ? input : input[0].toUpperCase() + input.slice(1);
}

function stripDiacritics(input: string): string {
  return input.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function slugify(input: string): string {
  return stripDiacritics(input)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function canonicalName(rawFileName: string, category: Category): string {
  const base = path.basename(rawFileName, path.extname(rawFileName));
  const cased = category === "specialita" ? base : sentenceCase(base);
  return NAME_CORRECTIONS[cased] ?? cased;
}

async function processCategory(category: Category): Promise<ManifestEntry[]> {
  const sourceDir = path.join(SOURCE_ROOT, category);
  const outDir = path.join(PROCESSED_ROOT, category);
  await mkdir(outDir, { recursive: true });

  const files = (await readdir(sourceDir)).filter((f) =>
    f.toLowerCase().endsWith(".jpg"),
  );

  const entries: ManifestEntry[] = [];

  for (const file of files) {
    const nome = canonicalName(file, category);
    const slug = slugify(nome);
    const outFile = path.join(outDir, `${slug}.webp`);

    await sharp(path.join(sourceDir, file))
      .resize({ width: 300, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(outFile);

    const entry: ManifestEntry = {
      slug,
      nome,
      immagine_path: `distintivi/${category}/${slug}.webp`,
    };
    if (category === "tappe") {
      entry.ordine = TAPPA_ORDER[slug];
    }
    entries.push(entry);
  }

  entries.sort((a, b) => a.nome.localeCompare(b.nome, "it"));
  return entries;
}

async function main() {
  const [specialita, brevetti, tappe] = await Promise.all([
    processCategory("specialita"),
    processCategory("brevetti"),
    processCategory("tappe"),
  ]);

  const manifest = { specialita, brevetti, tappe };
  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");

  console.log(
    `Manifest scritto in ${path.relative(process.cwd(), MANIFEST_PATH)}: ` +
      `${specialita.length} specialità, ${brevetti.length} brevetti, ${tappe.length} tappe.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
