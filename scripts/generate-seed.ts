/**
 * Genera la migrazione di seed per il contenuto ufficiale (P3-T02b) a partire
 * da assets/processed/distintivi/manifest.json (prodotto da process-cards.ts).
 *
 * Esecuzione manuale una tantum: `node scripts/generate-seed.ts`.
 * Sovrascrive supabase/migrations/20260812100500_seed_official_content.sql.
 */

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const MANIFEST_PATH = path.join(
  process.cwd(),
  "assets/processed/distintivi/manifest.json",
);
const OUT_PATH = path.join(
  process.cwd(),
  "supabase/migrations/20260812100500_seed_official_content.sql",
);

type ManifestEntry = {
  slug: string;
  nome: string;
  immagine_path: string;
  ordine?: number;
};

type Manifest = {
  specialita: ManifestEntry[];
  brevetti: ManifestEntry[];
  tappe: ManifestEntry[];
};

function sqlString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function specialitaValues(entries: ManifestEntry[]): string {
  return entries
    .map(
      (e) =>
        `  (${sqlString(e.slug)}, ${sqlString(e.nome)}, ${sqlString(e.immagine_path)})`,
    )
    .join(",\n");
}

function tappaValues(entries: ManifestEntry[]): string {
  return entries
    .map(
      (e) =>
        `  (${sqlString(e.slug)}, ${sqlString(e.nome)}, ${e.ordine}, ${sqlString(e.immagine_path)})`,
    )
    .join(",\n");
}

function brevettoValues(entries: ManifestEntry[]): string {
  return entries
    .map(
      (e) =>
        `  (${sqlString(e.slug)}, ${sqlString(e.nome)}, ${sqlString(e.immagine_path)})`,
    )
    .join(",\n");
}

async function main() {
  const manifest: Manifest = JSON.parse(await readFile(MANIFEST_PATH, "utf8"));

  const sql = `-- Seed contenuto ufficiale (P3-T02b), generato da scripts/generate-seed.ts
-- a partire da assets/processed/distintivi/manifest.json. Non modificare a
-- mano: rigenerare con \`node scripts/generate-seed.ts\` dopo aver rilanciato
-- \`node scripts/process-cards.ts\`.
--
-- Nessuna relazione brevetto_specialita: la composizione di ogni brevetto
-- (quali Specialità lo formano) non è nota da nessuna fonte disponibile e non
-- va inventata (CLAUDE.md) — da popolare quando arriva materiale ufficiale.
--
-- Competenza non ha un catalogo fisso (progetti personalizzati, DEC-005):
-- seed minimo di poche voci di esempio, chiaramente segnaposto.

insert into public.specialita (slug, nome, immagine_path)
values
${specialitaValues(manifest.specialita)}
on conflict (slug) do nothing;

insert into public.tappa (slug, nome, ordine, immagine_path)
values
${tappaValues(manifest.tappe)}
on conflict (slug) do nothing;

insert into public.brevetto (slug, nome, immagine_path)
values
${brevettoValues(manifest.brevetti)}
on conflict (slug) do nothing;

-- Competenza: seed segnaposto, da sostituire con contenuto reale quando
-- disponibile (DEC-005, nessuna fonte per un catalogo Competenze).
insert into public.competenza (slug, nome, descrizione)
values
  ('educazione-alla-fede', 'Educazione alla Fede', 'Voce segnaposto: contenuto reale da definire.'),
  ('educazione-alla-affettivita', 'Educazione all''Affettività', 'Voce segnaposto: contenuto reale da definire.'),
  ('educazione-alla-corporeita', 'Educazione alla Corporeità', 'Voce segnaposto: contenuto reale da definire.'),
  ('educazione-al-servizio', 'Educazione al Servizio', 'Voce segnaposto: contenuto reale da definire.'),
  ('educazione-alla-cittadinanza', 'Educazione alla Cittadinanza', 'Voce segnaposto: contenuto reale da definire.')
on conflict (slug) do nothing;
`;

  await writeFile(OUT_PATH, sql);
  console.log(`Seed scritto in ${path.relative(process.cwd(), OUT_PATH)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
