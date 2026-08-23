import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { beforeAll, describe, expect, it } from "vitest";

/**
 * Test RLS dell'archivio di Reparto (Fase 9, P9-T01/T02): stesso pattern di
 * tests/unit/rls/reparto.rls.test.ts — utenti di prova con ruolo `eg` di
 * default, quindi qui si copre il percorso di diniego (le scritture sono
 * riservate ai Capi) e le policy di Storage (P9-T02: nessun bucket pubblico,
 * accesso non autorizzato negato).
 *
 * L'integrità referenziale (P9-T01) è garantita dai vincoli FK dello schema,
 * che un test client non può popolare senza privilegi da Capo (stesso limite
 * dell'isolamento cross-Reparto di Fase 6, vedi `.claude/CORRECTIONS.md`):
 * va verificata via SQL diretto/introspezione, come le policy stesse.
 *
 * Env richieste: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
 * RLS_TEST_USER_A_EMAIL/PASSWORD (e B per il confronto cross-utente). Senza,
 * la suite si salta da sola.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const emailA = process.env.RLS_TEST_USER_A_EMAIL;
const passwordA = process.env.RLS_TEST_USER_A_PASSWORD;
const emailB = process.env.RLS_TEST_USER_B_EMAIL;
const passwordB = process.env.RLS_TEST_USER_B_PASSWORD;

const hasCredentials = Boolean(
  url && anonKey && emailA && passwordA && emailB && passwordB,
);

async function signedInClient(email: string, password: string) {
  const client = createClient(url!, anonKey!);
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error(`Login test RLS fallito per ${email}: ${error.message}`);
  }
  return client;
}

describe.skipIf(!hasCredentials)("RLS — archivio di Reparto (Fase 9)", () => {
  let clientA: SupabaseClient;
  let clientB: SupabaseClient;
  let repartoId: string;

  beforeAll(async () => {
    clientA = await signedInClient(emailA!, passwordA!);
    clientB = await signedInClient(emailB!, passwordB!);

    // `reparto` è l'unica tabella di organizzazione leggibile da chiunque
    // autenticato (onboarding, Fase 5): serve solo un id valido per i tentativi.
    const { data: reparto, error: repartoError } = await clientA
      .from("reparto")
      .select("id")
      .limit(1)
      .single();
    if (repartoError) throw repartoError;
    repartoId = reparto.id;
  });

  it("luogo/uscita/campo: un utente senza ruolo Capo non può scrivere nell'archivio", async () => {
    for (const insert of [
      clientA.from("luogo").insert({ reparto_id: repartoId, nome: "Test" }),
      clientA
        .from("uscita")
        .insert({ reparto_id: repartoId, titolo: "Test", data: "2026-01-01" }),
      clientA
        .from("campo")
        .insert({ reparto_id: repartoId, titolo: "Test", anno: 2026 }),
    ]) {
      const { data, error } = await insert.select();
      expect(error).not.toBeNull();
      expect(data).toBeNull();
    }
  });

  it("documento_archivio: un utente senza ruolo Capo non può registrare documenti", async () => {
    const { data, error } = await clientA
      .from("documento_archivio")
      .insert({
        reparto_id: repartoId,
        tipo: "foto",
        entita_tipo: "campo",
        entita_id: "00000000-0000-0000-0000-000000000000",
        file_path: `${repartoId}/campo/00000000-0000-0000-0000-000000000000/foto.jpg`,
        nome_file: "foto.jpg",
      })
      .select();
    expect(error).not.toBeNull();
    expect(data).toBeNull();
  });

  it("join partecipanti/squadriglie: non scrivibili senza ruolo Capo", async () => {
    const uscitaId = "00000000-0000-0000-0000-000000000000";
    const { data, error } = await clientA
      .from("uscita_partecipante")
      .insert({ uscita_id: uscitaId, profile_id: uscitaId })
      .select();
    expect(error).not.toBeNull();
    expect(data).toBeNull();
  });

  it("Storage: il bucket 'archivio' non è pubblico e un non membro non può caricare", async () => {
    // Il bucket è privato: un URL pubblico non è un accesso — il download deve
    // fallire anche su un percorso ben formato, perché la policy di lettura
    // richiede l'appartenenza al Reparto del percorso.
    const percorso = `${repartoId}/campo/00000000-0000-0000-0000-000000000000/foto.jpg`;

    const { data: upload, error: uploadError } = await clientA.storage
      .from("archivio")
      .upload(percorso, new Blob(["test"]), { contentType: "image/jpeg" });
    expect(uploadError).not.toBeNull();
    expect(upload).toBeNull();

    // Un utente senza il Reparto del percorso non vede nulla nella lista.
    const { data: lista, error: listError } = await clientA.storage
      .from("archivio")
      .list("", { limit: 100 });
    expect(listError).toBeNull();
    expect(lista ?? []).toEqual([]);
  });

  it("Storage: anche la firma di un URL non riesce senza accesso di lettura", async () => {
    // Il file non esiste: l'errore arriva comunque — con o senza policy. È un
    // fumo, non una prova; la prova di lettura è la lista vuota qui sopra.
    const { error: signedError } = await clientB.storage
      .from("archivio")
      .createSignedUrl(
        `${repartoId}/campo/00000000-0000-0000-0000-000000000000/foto.jpg`,
        60,
      );
    expect(signedError).not.toBeNull();
  });
});
