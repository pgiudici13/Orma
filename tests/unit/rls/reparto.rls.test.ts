import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Test RLS per l'onboarding Reparto (P5-T02, DEC-016) e per Squadriglia/ruolo
 * Capo (Fase 6, P6-T01/T02/T03, DEC-017): stesso pattern di
 * tests/unit/rls/personalTables.rls.test.ts. Richiede un progetto Supabase
 * reale con almeno un Reparto seedato e due utenti di prova (senza
 * reparto_id già approvato, altrimenti l'insert su richiesta_reparto entra
 * comunque, ma il test si concentra solo sull'isolamento RLS).
 *
 * Env richieste: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
 * RLS_TEST_USER_A_EMAIL/PASSWORD, RLS_TEST_USER_B_EMAIL/PASSWORD. Senza,
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

describe.skipIf(!hasCredentials)("RLS — onboarding Reparto", () => {
  let clientA: SupabaseClient;
  let clientB: SupabaseClient;
  let profileIdA: string;
  let repartoId: string;

  beforeAll(async () => {
    clientA = await signedInClient(emailA!, passwordA!);
    clientB = await signedInClient(emailB!, passwordB!);

    const { data: userA } = await clientA.auth.getUser();
    profileIdA = userA.user!.id;

    const { data: reparto, error: repartoError } = await clientA
      .from("reparto")
      .select("id")
      .limit(1)
      .single();
    if (repartoError) throw repartoError;
    repartoId = reparto.id;
  });

  afterAll(async () => {
    await clientA
      .from("richiesta_reparto")
      .delete()
      .eq("profile_id", profileIdA);
  });

  it("reparto: leggibile da un utente autenticato, non scrivibile", async () => {
    const { data, error } = await clientA.from("reparto").select("id");
    expect(error).toBeNull();
    expect(data?.length).toBeGreaterThan(0);

    const { error: insertError } = await clientA
      .from("reparto")
      .insert({ nome: "Reparto di test RLS — non deve riuscire" });
    expect(insertError).not.toBeNull();
  });

  it("richiesta_reparto: B non vede/modifica/cancella la richiesta di A", async () => {
    const { data: inserted, error: insertError } = await clientA
      .from("richiesta_reparto")
      .insert({ profile_id: profileIdA, reparto_id: repartoId })
      .select()
      .single();
    expect(insertError).toBeNull();
    const richiestaId = inserted!.id as string;

    const { data: seenByB, error: selectErrorB } = await clientB
      .from("richiesta_reparto")
      .select()
      .eq("id", richiestaId);
    expect(selectErrorB).toBeNull();
    expect(seenByB).toEqual([]);

    const { data: updatedByB, error: updateErrorB } = await clientB
      .from("richiesta_reparto")
      .update({ stato: "approvata" })
      .eq("id", richiestaId)
      .select();
    expect(updateErrorB).toBeNull();
    expect(updatedByB).toEqual([]);

    const { error: deleteErrorB } = await clientB
      .from("richiesta_reparto")
      .delete()
      .eq("id", richiestaId);
    expect(deleteErrorB).toBeNull();

    const { data: stillThereForA, error: selectErrorA } = await clientA
      .from("richiesta_reparto")
      .select()
      .eq("id", richiestaId)
      .single();
    expect(selectErrorA).toBeNull();
    expect(stillThereForA).not.toBeNull();
  });

  it("decidi_richiesta_reparto: un utente non admin non può decidere", async () => {
    const { data: inserted, error: insertError } = await clientB
      .from("richiesta_reparto")
      .insert({ profile_id: profileIdA, reparto_id: repartoId })
      .select()
      .single();
    // B non può inserire una richiesta a nome di A (RLS insert_own): errore atteso.
    expect(insertError).not.toBeNull();
    expect(inserted).toBeNull();

    const { error: rpcError } = await clientB.rpc("decidi_richiesta_reparto", {
      p_richiesta_id: "00000000-0000-0000-0000-000000000000",
      p_esito: "approvata",
    });
    expect(rpcError).not.toBeNull();
  });
});

/**
 * Test RLS per Squadriglia e ruolo Capo (Fase 6 — P6-T01/T02/T03, DEC-017).
 * Copre solo il percorso di diniego di default (ruolo "eg", nessun Reparto
 * approvato): l'isolamento cross-Reparto per un Capo reale non è
 * automatizzabile qui, perché `ruolo`/`reparto_id` sono scrivibili solo da
 * SQL diretto o da `decidi_richiesta_reparto()` (già lei stessa gated su
 * is_admin/is_capo_reparto — nessun modo self-service o via service-role
 * PostgREST di "diventare" Capo senza bypassare il trigger
 * `profiles_block_self_consent_update`, per design). Stesso limite già
 * presente per le policy `is_admin` (DEC-015), mai coperte da un test
 * automatizzato per lo stesso motivo — vedi `.claude/CORRECTIONS.md`.
 */
describe.skipIf(!hasCredentials)("RLS — Squadriglia e ruolo Capo", () => {
  let clientA: SupabaseClient;
  let repartoId: string;

  beforeAll(async () => {
    clientA = await signedInClient(emailA!, passwordA!);

    const { data: reparto, error: repartoError } = await clientA
      .from("reparto")
      .select("id")
      .limit(1)
      .single();
    if (repartoError) throw repartoError;
    repartoId = reparto.id;
  });

  it("is_capo_reparto: un profilo con ruolo 'eg' di default non è Capo", async () => {
    const { data, error } = await clientA.rpc("is_capo_reparto", {
      target_reparto_id: repartoId,
    });
    expect(error).toBeNull();
    expect(data).toBe(false);
  });

  it("squadriglia: un utente senza ruolo Capo non può creare una Squadriglia", async () => {
    const { data, error } = await clientA
      .from("squadriglia")
      .insert({ reparto_id: repartoId, nome: "Squadriglia di test RLS" })
      .select();
    expect(error).not.toBeNull();
    expect(data).toBeNull();
  });
});
