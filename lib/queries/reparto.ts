import { createClient } from "@/lib/supabase/server";
import type { EventoData } from "@/lib/scene/objects";

/**
 * Dati della vita di Reparto: membri, Squadriglie, calendario, richieste di
 * adesione (RD-T06).
 *
 * L'isolamento per Reparto è garantito dalla RLS (DEC-018). I compagni di
 * Reparto si leggono tramite la funzione `membri_reparto()` (SECURITY
 * DEFINER, P10-T01): la tabella `profiles` non concede più visibilità a riga
 * intera tra membri, perché la RLS di Postgres filtra righe, non colonne — una
 * select diretta su `profiles` filtrata solo lato query avrebbe comunque
 * esposto data di nascita e contatti del genitore a chiunque interrogasse
 * l'API direttamente.
 */

export type MemberData = {
  id: string;
  nome: string;
  ruolo: string;
  squadrigliaId: string | null;
  squadrigliaNome: string | null;
  specialitaCompletate: { id: string; nome: string; slug?: string }[];
  competenzeCompletate: { id: string; nome: string }[];
  tappaAttuale: string | null;
};

export type SquadrigliaData = {
  id: string;
  nome: string;
  created_at: string;
};

export type RichiestaData = {
  id: string;
  nome: string;
  repartoNome: string;
  creataIl: string;
};

export type RepartoSurfaceData = {
  /** `null` quando l'utente non è ancora associato a un Reparto. */
  repartoNome: string | null;
  isCapo: boolean;
  isCapoOrAdmin: boolean;
  members: MemberData[];
  squadriglie: SquadrigliaData[];
  events: EventoData[];
  /** Solo per Capi e admin: richieste di adesione ancora da decidere. */
  richieste: RichiestaData[];
};

export const EMPTY_REPARTO: RepartoSurfaceData = {
  repartoNome: null,
  isCapo: false,
  isCapoOrAdmin: false,
  members: [],
  squadriglie: [],
  events: [],
  richieste: [],
};

type MembroRepartoRow = {
  id: string;
  nome: string;
  ruolo: string;
  squadriglia_id: string | null;
  squadriglia_nome: string | null;
};

type EventoDbRow = {
  id: string;
  titolo: string;
  descrizione: string | null;
  tipo: EventoData["tipo"];
  data_inizio: string;
  data_fine: string | null;
  luogo: string | null;
};

export async function getRepartoSurface(): Promise<RepartoSurfaceData> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return EMPTY_REPARTO;

  const { data: ownProfile } = (await supabase
    .from("profiles")
    .select("id, ruolo, is_admin, reparto_id, reparto:reparto_id(id, nome)")
    .eq("id", user.id)
    .single()) as unknown as {
    data: {
      ruolo: string;
      is_admin: boolean;
      reparto_id: string | null;
      reparto: { id: string; nome: string } | null;
    } | null;
  };

  const isCapo = ownProfile?.ruolo === "capo";
  const isCapoOrAdmin = isCapo || Boolean(ownProfile?.is_admin);

  if (!ownProfile?.reparto_id || !ownProfile.reparto) {
    return { ...EMPTY_REPARTO, isCapo, isCapoOrAdmin };
  }

  const repartoId = ownProfile.reparto_id;

  const [
    profilesRes,
    squadriglieRes,
    eventiRes,
    specialitaRes,
    competenzeRes,
    tappeRes,
    richiesteRes,
  ] = await Promise.all([
    supabase.rpc("membri_reparto"),
    supabase
      .from("squadriglia")
      .select("id, nome, created_at")
      .eq("reparto_id", repartoId)
      .order("nome"),
    supabase
      .from("evento")
      .select("id, titolo, descrizione, tipo, data_inizio, data_fine, luogo")
      .eq("reparto_id", repartoId)
      .order("data_inizio", { ascending: true }),
    supabase
      .from("user_specialita")
      .select("profile_id, specialita:specialita_id(id, nome, slug)")
      .eq("stato", "completata"),
    supabase
      .from("user_competenza")
      .select("profile_id, competenza:competenza_id(id, nome, slug)")
      .eq("stato", "completata"),
    supabase
      .from("user_tappa")
      .select("profile_id, tappa:tappa_id(id, nome, ordine)")
      .order("created_at", { ascending: true }),
    isCapoOrAdmin
      ? supabase
          .from("richiesta_reparto")
          .select(
            "id, created_at, profiles!profile_id(nome), reparto!reparto_id(nome)",
          )
          .eq("stato", "in_attesa")
          .order("created_at")
      : Promise.resolve({ data: [] }),
  ]);

  const profilesDb = (profilesRes.data ?? []) as unknown as MembroRepartoRow[];

  const byProfile = <T>(
    rows: { profile_id: string }[],
    pick: (row: never) => T | null,
  ) => {
    const map = new Map<string, T[]>();
    for (const row of rows) {
      const value = pick(row as never);
      if (!value) continue;
      const list = map.get(row.profile_id) ?? [];
      list.push(value);
      map.set(row.profile_id, list);
    }
    return map;
  };

  const specMap = byProfile(
    (specialitaRes.data ?? []) as unknown as { profile_id: string }[],
    (row: { specialita: { id: string; nome: string; slug: string } | null }) =>
      row.specialita,
  );
  const compMap = byProfile(
    (competenzeRes.data ?? []) as unknown as { profile_id: string }[],
    (row: { competenza: { id: string; nome: string } | null }) =>
      row.competenza,
  );
  const tappaMap = byProfile(
    (tappeRes.data ?? []) as unknown as { profile_id: string }[],
    (row: { tappa: { nome: string } | null }) => row.tappa?.nome ?? null,
  );

  return {
    repartoNome: ownProfile.reparto.nome,
    isCapo,
    isCapoOrAdmin,
    members: profilesDb.map((profile) => ({
      id: profile.id,
      nome: profile.nome,
      ruolo: profile.ruolo,
      squadrigliaId: profile.squadriglia_id,
      squadrigliaNome: profile.squadriglia_nome,
      specialitaCompletate: specMap.get(profile.id) ?? [],
      competenzeCompletate: compMap.get(profile.id) ?? [],
      // L'ultima registrata in ordine di inserimento: è la Tappa in corso.
      tappaAttuale: tappaMap.get(profile.id)?.at(-1) ?? null,
    })),
    squadriglie: (squadriglieRes.data ?? []) as unknown as SquadrigliaData[],
    events: ((eventiRes.data ?? []) as unknown as EventoDbRow[]).map(
      (evento) => ({
        id: evento.id,
        titolo: evento.titolo,
        descrizione: evento.descrizione ?? undefined,
        tipo: evento.tipo,
        dataInizio: evento.data_inizio,
        dataFine: evento.data_fine ?? undefined,
        luogo: evento.luogo ?? undefined,
      }),
    ),
    richieste: (
      (richiesteRes.data ?? []) as unknown as {
        id: string;
        created_at: string;
        profiles: { nome: string } | null;
        reparto: { nome: string } | null;
      }[]
    ).map((richiesta) => ({
      id: richiesta.id,
      nome: richiesta.profiles?.nome ?? "—",
      repartoNome: richiesta.reparto?.nome ?? "—",
      creataIl: richiesta.created_at.slice(0, 10),
    })),
  };
}
