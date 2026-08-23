import { createClient } from "@/lib/supabase/server";

/**
 * Ricerca globale dei Maestri di Specialità (Fase 8).
 *
 * La visibilità è opt-in esplicito (FR-15, `docs/PERMISSIONS.md`): chi non ha
 * attivato `maestro_profilo.visibile` non compare mai. La funzione `cerca_maestri`
 * (SECURITY DEFINER) espone solo i campi dichiarati ricercabili, mai l'intero
 * profilo (SDD §19) — per lo stesso motivo di `find_profile_by_email` (P4-T02),
 * un utente non può leggere `profiles` altrui via RLS.
 */

export type MaestroRicerca = {
  profileId: string;
  nome: string;
  /** Id delle Specialità ufficiali che questo Maestro accompagna. */
  specialitaIds: string[];
  specialitaNomi: string[];
  regione?: string;
  zona?: string;
  localita?: string;
  disponibile: boolean;
};

export type CercaMaestriFiltri = {
  specialitaId?: string;
  regione?: string;
  zona?: string;
  soloDisponibili?: boolean;
};

type CercaMaestriRow = {
  profile_id: string;
  nome: string;
  specialita_ids: string[] | null;
  specialita_nomi: string[] | null;
  regione: string | null;
  zona: string | null;
  localita: string | null;
  disponibile: boolean;
};

export async function cercaMaestri(
  filtri: CercaMaestriFiltri,
): Promise<MaestroRicerca[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("cerca_maestri", {
    p_specialita_id: filtri.specialitaId || null,
    p_regione: filtri.regione?.trim() ? filtri.regione.trim() : null,
    p_zona: filtri.zona?.trim() ? filtri.zona.trim() : null,
    p_solo_disponibili: Boolean(filtri.soloDisponibili),
  });

  if (error) {
    throw new Error(`Impossibile cercare i Maestri: ${error.message}`);
  }

  return ((data ?? []) as unknown as CercaMaestriRow[]).map((row) => ({
    profileId: row.profile_id,
    nome: row.nome,
    specialitaIds: row.specialita_ids ?? [],
    specialitaNomi: row.specialita_nomi ?? [],
    regione: row.regione ?? undefined,
    zona: row.zona ?? undefined,
    localita: row.localita ?? undefined,
    disponibile: row.disponibile,
  }));
}

export type MaestroProfiloData = {
  id: string;
  visibile: boolean;
  regione?: string;
  zona?: string;
  localita?: string;
  disponibile: boolean;
  /** Id delle Specialità ufficiali dichiarate. */
  specialitaIds: string[];
};

/**
 * Il proprio profilo di Maestro (per la tessera). `null` finché l'utente non
 * ha mai compilato la sezione "Maestro di Specialità".
 */
export async function getMaestroProfilo(): Promise<MaestroProfiloData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = (await supabase
    .from("maestro_profilo")
    .select(
      "id, visibile, regione, zona, localita, disponibile, specialita:maestro_specialita(specialita_id)",
    )
    .eq("profile_id", user.id)
    .maybeSingle()) as unknown as {
    data: {
      id: string;
      visibile: boolean;
      regione: string | null;
      zona: string | null;
      localita: string | null;
      disponibile: boolean;
      specialita: { specialita_id: string }[];
    } | null;
  };

  if (!data) return null;

  return {
    id: data.id,
    visibile: data.visibile,
    regione: data.regione ?? undefined,
    zona: data.zona ?? undefined,
    localita: data.localita ?? undefined,
    disponibile: data.disponibile,
    specialitaIds: (data.specialita ?? []).map((s) => s.specialita_id),
  };
}

/**
 * Le Specialità con percorso in corso di chi guarda: solo verso queste si può
 * associare un Maestro trovato in ricerca (il Maestro vive su una carta).
 */
export async function getSpecialitaAttive(): Promise<string[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("user_specialita")
    .select("specialita_id")
    .eq("profile_id", user.id)
    .eq("stato", "in_corso");

  return ((data ?? []) as { specialita_id: string }[]).map(
    (row) => row.specialita_id,
  );
}
