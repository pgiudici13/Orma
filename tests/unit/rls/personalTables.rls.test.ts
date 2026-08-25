import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Test RLS di isolamento tra utenti per le tabelle di percorso personale
 * (P3-T03). Primo test RLS del progetto: pattern pensato per essere replicato
 * in Fase 6/9/10 (docs/SDD.md §25) su qualunque nuova tabella con dati
 * personali o di Reparto.
 *
 * Richiede un progetto Supabase reale raggiungibile e due utenti di prova già
 * registrati (con profilo attivo, non in attesa di consenso genitoriale),
 * **nello stesso Reparto** (necessario per il test di visibilità di
 * user_tappa più sotto — non richiesto dagli altri casi, che restano isolati
 * indipendentemente dal Reparto):
 * NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
 * RLS_TEST_USER_A_EMAIL/PASSWORD, RLS_TEST_USER_B_EMAIL/PASSWORD.
 * Senza queste variabili la suite si salta da sola, come i test e2e
 * autenticati (tests/e2e/table.spec.ts) — nessun segreto nel repository.
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

describe.skipIf(!hasCredentials)("RLS — isolamento tra utenti", () => {
  let clientA: SupabaseClient;
  let clientB: SupabaseClient;
  let profileIdA: string;
  let specialitaId: string;
  let tappaId: string;
  let competenzaId: string;

  beforeAll(async () => {
    clientA = await signedInClient(emailA!, passwordA!);
    clientB = await signedInClient(emailB!, passwordB!);

    const { data: userA } = await clientA.auth.getUser();
    profileIdA = userA.user!.id;

    // Contenuto ufficiale: leggibile da qualunque utente autenticato,
    // serve solo per popolare una riga personale valida.
    const { data: specialita, error: specialitaError } = await clientA
      .from("specialita")
      .select("id")
      .limit(1)
      .single();
    if (specialitaError) throw specialitaError;
    specialitaId = specialita.id;

    const { data: tappa, error: tappaError } = await clientA
      .from("tappa")
      .select("id")
      .limit(1)
      .single();
    if (tappaError) throw tappaError;
    tappaId = tappa.id;

    const { data: competenza, error: competenzaError } = await clientA
      .from("competenza")
      .select("id")
      .limit(1)
      .single();
    if (competenzaError) throw competenzaError;
    competenzaId = competenza.id;
  });

  afterAll(async () => {
    await clientA.from("user_specialita").delete().eq("profile_id", profileIdA);
    await clientA.from("user_competenza").delete().eq("profile_id", profileIdA);
    await clientA.from("user_tappa").delete().eq("profile_id", profileIdA);
    await clientA.from("nota").delete().eq("profile_id", profileIdA);
    await clientA.from("maestro_esterno").delete().eq("profile_id", profileIdA);
  });

  type Case = {
    table: string;
    row: () => Record<string, unknown>;
    updatePatch: Record<string, unknown>;
  };

  // user_tappa non è qui: a differenza di user_specialita/user_competenza
  // (visibili ai compagni di Reparto solo se `stato = 'completata'`), la
  // policy `user_tappa_select_own` (P7-T01, migrazione reparto_funzionalita)
  // rende visibili ai membri dello stesso Reparto TUTTE le Tappe, non solo
  // quelle completate — scelta di design documentata nel commento della
  // migrazione ("I membri dello stesso Reparto possono consultare le Tappe
  // degli altri membri"), non un'eccezione dell'isolamento di questo test.
  // Verificato in un test dedicato più sotto.
  const cases: Case[] = [
    {
      table: "user_specialita",
      row: () => ({ specialita_id: specialitaId }),
      updatePatch: { stato: "completata" },
    },
    {
      table: "user_competenza",
      row: () => ({ competenza_id: competenzaId }),
      updatePatch: { stato: "completata" },
    },
    {
      table: "nota",
      row: () => ({
        tipo: "specialita",
        riferimento_id: specialitaId,
        testo: "Nota di test RLS",
      }),
      updatePatch: { testo: "Modificata da B — non deve riuscire" },
    },
    {
      table: "maestro_esterno",
      row: () => ({ nome: "Maestro di test RLS" }),
      updatePatch: { nome: "Modificato da B — non deve riuscire" },
    },
  ];

  it.each(cases)(
    "$table: l'utente B non vede/modifica/cancella righe dell'utente A",
    async ({ table, row, updatePatch }) => {
      const { data: inserted, error: insertError } = await clientA
        .from(table)
        .insert({ profile_id: profileIdA, ...row() })
        .select()
        .single();
      expect(insertError).toBeNull();
      const rowId = inserted!.id as string;

      // B non vede la riga di A: RLS filtra silenziosamente, nessun errore.
      const { data: seenByB, error: selectErrorB } = await clientB
        .from(table)
        .select()
        .eq("id", rowId);
      expect(selectErrorB).toBeNull();
      expect(seenByB).toEqual([]);

      // B non può modificarla: 0 righe interessate dall'update.
      const { data: updatedByB, error: updateErrorB } = await clientB
        .from(table)
        .update(updatePatch)
        .eq("id", rowId)
        .select();
      expect(updateErrorB).toBeNull();
      expect(updatedByB).toEqual([]);

      // B non può cancellarla: la riga esiste ancora per A dopo il tentativo.
      const { error: deleteErrorB } = await clientB
        .from(table)
        .delete()
        .eq("id", rowId);
      expect(deleteErrorB).toBeNull();

      const { data: stillThereForA, error: selectErrorA } = await clientA
        .from(table)
        .select()
        .eq("id", rowId)
        .single();
      expect(selectErrorA).toBeNull();
      expect(stillThereForA).not.toBeNull();

      await clientA.from(table).delete().eq("id", rowId);
    },
  );

  it("user_tappa: un compagno di Reparto la vede (per design, P7-T01) ma non può modificarla/cancellarla", async () => {
    // Richiede A e B nello stesso Reparto (vedi commento in testa al file):
    // a differenza di user_specialita/user_competenza (visibili ai compagni
    // di Reparto solo se completate), user_tappa è visibile ai membri dello
    // stesso Reparto indipendentemente dallo stato di completamento — vedi
    // il commento della policy in
    // supabase/migrations/20260823100000_reparto_funzionalita.sql.
    const { data: inserted, error: insertError } = await clientA
      .from("user_tappa")
      .insert({ profile_id: profileIdA, tappa_id: tappaId })
      .select()
      .single();
    expect(insertError).toBeNull();
    const rowId = inserted!.id as string;

    const { data: seenByB, error: selectErrorB } = await clientB
      .from("user_tappa")
      .select()
      .eq("id", rowId);
    expect(selectErrorB).toBeNull();
    expect(seenByB).toHaveLength(1);

    const { data: updatedByB, error: updateErrorB } = await clientB
      .from("user_tappa")
      .update({ data_completamento: "2026-01-01" })
      .eq("id", rowId)
      .select();
    expect(updateErrorB).toBeNull();
    expect(updatedByB).toEqual([]);

    const { error: deleteErrorB } = await clientB
      .from("user_tappa")
      .delete()
      .eq("id", rowId);
    expect(deleteErrorB).toBeNull();

    const { data: stillThereForA, error: selectErrorA } = await clientA
      .from("user_tappa")
      .select()
      .eq("id", rowId)
      .single();
    expect(selectErrorA).toBeNull();
    expect(stillThereForA).not.toBeNull();

    await clientA.from("user_tappa").delete().eq("id", rowId);
  });
});
