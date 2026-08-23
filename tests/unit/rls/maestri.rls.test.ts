import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Test RLS della ricerca globale Maestri (Fase 8, P8-T01/T02).
 *
 * Verifica i due criteri del piano: (P8-T01) un Maestro che non ha attivato la
 * visibilità globale non compare in ricerca, e i dati di chi è visibile sono
 * solo quelli dichiarati; (P8-T02) i filtri per Specialità, Regione, Zona e
 * disponibilità sono combinabili e coerenti con i permessi.
 *
 * Stesso pattern di `tests/unit/rls/personalTables.rls.test.ts`: richiede un
 * progetto Supabase reale e due utenti di prova già registrati
 * (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
 * RLS_TEST_USER_A/B_EMAIL/PASSWORD); senza variabili si salta da solo.
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

type Risultato = {
  profile_id: string;
  nome: string;
  specialita_ids: string[];
  regione: string | null;
  zona: string | null;
  localita: string | null;
  disponibile: boolean;
};

describe.skipIf(!hasCredentials)(
  "RLS — ricerca globale Maestri (Fase 8)",
  () => {
    let clientA: SupabaseClient;
    let clientB: SupabaseClient;
    let profileIdB: string;
    let specialitaId: string;
    let altraSpecialitaId: string;
    let maestroId: string | null = null;

    beforeAll(async () => {
      clientA = await signedInClient(emailA!, passwordA!);
      clientB = await signedInClient(emailB!, passwordB!);

      const {
        data: { user: userB },
      } = await clientB.auth.getUser();
      profileIdB = userB!.id;

      // Contenuto ufficiale, leggibile da qualunque utente autenticato: serve a
      // dichiarare le Specialità di competenza del Maestro di prova.
      const { data: specialita } = await clientA
        .from("specialita")
        .select("id")
        .limit(1)
        .single();
      specialitaId = specialita!.id;

      const { data: altra } = await clientA
        .from("specialita")
        .select("id")
        .neq("id", specialitaId)
        .limit(1)
        .single();
      altraSpecialitaId = altra!.id;
    });

    afterAll(async () => {
      if (maestroId) {
        await clientB.from("maestro_profilo").delete().eq("id", maestroId);
      }
    });

    async function risultatiDiA(
      filtri: Record<string, unknown>,
    ): Promise<Risultato[]> {
      const { data, error } = await clientA.rpc("cerca_maestri", filtri);
      expect(error).toBeNull();
      return (data ?? []) as Risultato[];
    }

    it("un Maestro senza opt-in non compare in ricerca e il suo profilo non è leggibile (P8-T01)", async () => {
      const { data: inserito, error: insertError } = await clientB
        .from("maestro_profilo")
        .insert({
          profile_id: profileIdB,
          visibile: false,
          regione: "Lombardia",
          zona: "Milano",
          localita: "Milano",
          disponibile: true,
        })
        .select("id")
        .single();
      expect(insertError).toBeNull();
      maestroId = inserito!.id as string;

      const { error: specialitaError } = await clientB
        .from("maestro_specialita")
        .insert({ maestro_id: maestroId, specialita_id: specialitaId });
      expect(specialitaError).toBeNull();

      // Filtro per la Specialità dichiarata: B non c'è finché non fa opt-in.
      const risultati = await risultatiDiA({ p_specialita_id: specialitaId });
      expect(risultati).not.toContainEqual(
        expect.objectContaining({ profile_id: profileIdB }),
      );

      // A non può leggere la riga di B finché non è visibile: RLS filtra in
      // silenzio, nessun errore.
      const { data: vista } = await clientA
        .from("maestro_profilo")
        .select()
        .eq("id", maestroId);
      expect(vista).toEqual([]);
    });

    it("dopo l'opt-in compare con i soli campi resi ricercabili (P8-T01)", async () => {
      const { error: updateError } = await clientB
        .from("maestro_profilo")
        .update({ visibile: true })
        .eq("id", maestroId);
      expect(updateError).toBeNull();

      const risultati = await risultatiDiA({});
      const trovato = risultati.find((r) => r.profile_id === profileIdB);
      expect(trovato).toBeDefined();
      expect(trovato!.nome).toBeTruthy();
      expect(trovato!.specialita_ids).toContain(specialitaId);
      expect(trovato!.regione).toBe("Lombardia");
      expect(trovato!.zona).toBe("Milano");
      expect(trovato!.disponibile).toBe(true);

      // La funzione espone solo i campi dichiarati: niente email, niente data di
      // nascita, niente altri dati del profilo (SDD §19).
      expect(trovato).not.toHaveProperty("email");
      expect(trovato).not.toHaveProperty("data_nascita");
    });

    it("filtri combinabili per Specialità, Regione, Zona e disponibilità (P8-T02)", async () => {
      // Specialità dichiarata → presente; diversa → assente.
      const perSpecialita = await risultatiDiA({
        p_specialita_id: specialitaId,
      });
      expect(perSpecialita).toContainEqual(
        expect.objectContaining({ profile_id: profileIdB }),
      );

      const perAltra = await risultatiDiA({
        p_specialita_id: altraSpecialitaId,
      });
      expect(perAltra).not.toContainEqual(
        expect.objectContaining({ profile_id: profileIdB }),
      );

      // Regione/Zona corrette → presente; errate → assente.
      const perRegione = await risultatiDiA({ p_regione: "Lombardia" });
      expect(perRegione).toContainEqual(
        expect.objectContaining({ profile_id: profileIdB }),
      );

      const perZona = await risultatiDiA({ p_zona: "Milano" });
      expect(perZona).toContainEqual(
        expect.objectContaining({ profile_id: profileIdB }),
      );

      const zonaErrata = await risultatiDiA({ p_zona: "Roma" });
      expect(zonaErrata).not.toContainEqual(
        expect.objectContaining({ profile_id: profileIdB }),
      );

      // Disponibilità: B è disponibile → presente col filtro.
      const perDisponibili = await risultatiDiA({ p_solo_disponibili: true });
      expect(perDisponibili).toContainEqual(
        expect.objectContaining({ profile_id: profileIdB }),
      );

      // Combinazione coerente → presente; combinazione incoerente → assente.
      const combinato = await risultatiDiA({
        p_specialita_id: specialitaId,
        p_regione: "Lombardia",
        p_solo_disponibili: true,
      });
      expect(combinato).toContainEqual(
        expect.objectContaining({ profile_id: profileIdB }),
      );

      const combinatoErrato = await risultatiDiA({
        p_specialita_id: specialitaId,
        p_regione: "Sicilia",
      });
      expect(combinatoErrato).not.toContainEqual(
        expect.objectContaining({ profile_id: profileIdB }),
      );
    });

    it("nessun utente può modificare il profilo Maestro di un altro", async () => {
      const { data: aggiornato, error } = await clientA
        .from("maestro_profilo")
        .update({ visibile: false })
        .eq("id", maestroId)
        .select();
      expect(error).toBeNull();
      expect(aggiornato).toEqual([]);

      // Per il proprietario il profilo resta intatto.
      const { data: ancora } = await clientB
        .from("maestro_profilo")
        .select("visibile")
        .eq("id", maestroId)
        .single();
      expect(ancora!.visibile).toBe(true);
    });
  },
);
