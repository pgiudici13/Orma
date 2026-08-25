import { createClient, getCachedUser } from "@/lib/supabase/server";
import type {
  CardData,
  ContentKind,
  EventoData,
  NotaData,
} from "@/lib/scene/objects";
import { distintivoPublicUrl } from "@/lib/supabase/storage";
import type { User } from "@supabase/supabase-js";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/** Note dell'utente per un tipo di contenuto, raggruppate per riferimento_id. */
async function getNoteByReference(
  supabase: SupabaseServerClient,
  profileId: string,
  tipo: ContentKind,
  riferimentoIds: string[],
): Promise<Map<string, NotaData[]>> {
  const map = new Map<string, NotaData[]>();
  if (riferimentoIds.length === 0) return map;

  const { data } = await supabase
    .from("nota")
    .select("id, riferimento_id, testo")
    .eq("profile_id", profileId)
    .eq("tipo", tipo)
    .in("riferimento_id", riferimentoIds);

  for (const row of (data ?? []) as {
    id: string;
    riferimento_id: string;
    testo: string;
  }[]) {
    const list = map.get(row.riferimento_id) ?? [];
    list.push({ id: row.id, testo: row.testo });
    map.set(row.riferimento_id, list);
  }
  return map;
}

function maestroNome(
  row: {
    maestro_esterno: { nome: string } | null;
    maestro_profile_id: string | null;
  },
  maestriInterni: Map<string, string>,
): string | undefined {
  return (
    row.maestro_esterno?.nome ??
    (row.maestro_profile_id
      ? maestriInterni.get(row.maestro_profile_id)
      : undefined) ??
    undefined
  );
}

/**
 * Specialità/Competenze/Tappe con progresso attivo dell'utente autenticato,
 * pronte per la scena tavolo e il pannello di dettaglio (P3-T04/T05). RLS
 * applica già l'isolamento per profilo (P3-T03): questa query non filtra
 * nulla che il database non filtrerebbe comunque, si limita a comporre i
 * dati per la UI.
 *
 * `supabase`/`user` sono opzionali: se non passati (es. chiamata diretta da
 * `app/reparto/page.tsx`), vengono ottenuti dalle funzioni cache-ate di
 * `lib/supabase/server.ts`, che deduplicano comunque le chiamate ripetute
 * nello stesso render tree (es. da `getTableContext`).
 */
export async function getTableCards(
  supabase?: SupabaseServerClient,
  user?: User | null,
): Promise<CardData[]> {
  supabase ??= await createClient();
  if (user === undefined) {
    ({
      data: { user },
    } = await getCachedUser());
  }
  if (!user) return [];

  const [specialitaRes, competenzaRes, tappaRes, maestriInterniRes] =
    await Promise.all([
      supabase
        .from("user_specialita")
        .select(
          "stato, data_inizio, data_completamento, specialita:specialita_id(id, slug, nome, immagine_path), maestro_esterno:maestro_esterno_id(nome), maestro_profile_id",
        )
        .eq("profile_id", user.id),
      supabase
        .from("user_competenza")
        .select(
          "stato, data_inizio, data_completamento, competenza:competenza_id(id, slug, nome), maestro_esterno:maestro_esterno_id(nome), maestro_profile_id",
        )
        .eq("profile_id", user.id),
      supabase
        .from("user_tappa")
        .select(
          "data_inizio, data_completamento, tappa:tappa_id(id, slug, nome, immagine_path)",
        )
        .eq("profile_id", user.id),
      // Il nome di un Maestro interno non è leggibile via embed diretto su
      // `profiles` (RLS, P10-T01): funzione dedicata, stesso pattern di
      // `membri_reparto()`/`cerca_maestri()` — vedi la migrazione
      // `maestro_interno_nome_visibile.sql`.
      supabase.rpc("maestri_interni_nomi"),
    ]);

  const maestriInterni = new Map(
    (
      (maestriInterniRes.data ?? []) as { profile_id: string; nome: string }[]
    ).map((m) => [m.profile_id, m.nome] as const),
  );

  const cards: CardData[] = [];

  type SpecialitaRow = {
    stato: "in_corso" | "completata";
    data_inizio: string;
    data_completamento: string | null;
    specialita: {
      id: string;
      slug: string;
      nome: string;
      immagine_path: string | null;
    } | null;
    maestro_esterno: { nome: string } | null;
    maestro_profile_id: string | null;
  };
  const specialitaRows = (specialitaRes.data ??
    []) as unknown as SpecialitaRow[];
  const specialitaNote = await getNoteByReference(
    supabase,
    user.id,
    "specialita",
    specialitaRows
      .map((r) => r.specialita?.id)
      .filter((id): id is string => Boolean(id)),
  );
  for (const row of specialitaRows) {
    if (!row.specialita) continue;
    cards.push({
      id: row.specialita.id,
      kind: "specialita",
      slug: row.specialita.slug,
      title: row.specialita.nome,
      imageUrl: distintivoPublicUrl(supabase, row.specialita.immagine_path),
      stato: row.stato,
      dataInizio: row.data_inizio,
      dataCompletamento: row.data_completamento ?? undefined,
      note: specialitaNote.get(row.specialita.id) ?? [],
      maestroNome: maestroNome(row, maestriInterni),
    });
  }

  type CompetenzaRow = {
    stato: "in_corso" | "completata";
    data_inizio: string;
    data_completamento: string | null;
    competenza: { id: string; slug: string; nome: string } | null;
    maestro_esterno: { nome: string } | null;
    maestro_profile_id: string | null;
  };
  const competenzaRows = (competenzaRes.data ??
    []) as unknown as CompetenzaRow[];
  const competenzaNote = await getNoteByReference(
    supabase,
    user.id,
    "competenza",
    competenzaRows
      .map((r) => r.competenza?.id)
      .filter((id): id is string => Boolean(id)),
  );
  for (const row of competenzaRows) {
    if (!row.competenza) continue;
    cards.push({
      id: row.competenza.id,
      kind: "competenza",
      slug: row.competenza.slug,
      title: row.competenza.nome,
      stato: row.stato,
      dataInizio: row.data_inizio,
      dataCompletamento: row.data_completamento ?? undefined,
      note: competenzaNote.get(row.competenza.id) ?? [],
      maestroNome: maestroNome(row, maestriInterni),
    });
  }

  type TappaRow = {
    data_inizio: string;
    data_completamento: string | null;
    tappa: {
      id: string;
      slug: string;
      nome: string;
      immagine_path: string | null;
    } | null;
  };
  const tappaRows = (tappaRes.data ?? []) as unknown as TappaRow[];
  const tappaNote = await getNoteByReference(
    supabase,
    user.id,
    "tappa",
    tappaRows.map((r) => r.tappa?.id).filter((id): id is string => Boolean(id)),
  );
  for (const row of tappaRows) {
    if (!row.tappa) continue;
    cards.push({
      id: row.tappa.id,
      kind: "tappa",
      slug: row.tappa.slug,
      title: row.tappa.nome,
      imageUrl: distintivoPublicUrl(supabase, row.tappa.immagine_path),
      dataInizio: row.data_inizio,
      dataCompletamento: row.data_completamento ?? undefined,
      note: tappaNote.get(row.tappa.id) ?? [],
    });
  }

  return cards;
}

/**
 * Contesto del tavolo: cosa mostrare e a chi (RD-T07).
 *
 * Quali oggetti compaiono dipende dalla situazione reale dell'utente — chi non
 * appartiene ancora a un Reparto trova la busta della richiesta al posto della
 * cassetta e del guidone (`buildTable` in `lib/scene/objects.ts`). Il profilo
 * viene letto una volta sola e riusato per gli eventi.
 */
export async function getTableContext(): Promise<{
  cards: CardData[];
  events: EventoData[];
  hasReparto: boolean;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await getCachedUser();
  if (!user) return { cards: [], events: [], hasReparto: false };

  const { data: profile } = (await supabase
    .from("profiles")
    .select("reparto_id")
    .eq("id", user.id)
    .single()) as unknown as { data: { reparto_id: string | null } | null };

  const repartoId = profile?.reparto_id ?? null;
  const [cards, events] = await Promise.all([
    getTableCards(supabase, user),
    repartoId ? getRepartoEvents(supabase, repartoId) : Promise.resolve([]),
  ]);

  return { cards, events, hasReparto: Boolean(repartoId) };
}

/**
 * Eventi del calendario di Reparto dell'utente autenticato (P7-T03).
 */
export async function getTableEvents(): Promise<EventoData[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profile } = (await supabase
    .from("profiles")
    .select("reparto_id")
    .eq("id", user.id)
    .single()) as unknown as { data: { reparto_id: string | null } | null };

  if (!profile?.reparto_id) return [];

  return getRepartoEvents(supabase, profile.reparto_id);
}

async function getRepartoEvents(
  supabase: SupabaseServerClient,
  repartoId: string,
): Promise<EventoData[]> {
  const { data: eventi } = (await supabase
    .from("evento")
    .select("id, titolo, descrizione, tipo, data_inizio, data_fine, luogo")
    .eq("reparto_id", repartoId)
    .order("data_inizio", { ascending: true })
    .limit(10)) as unknown as {
    data:
      | {
          id: string;
          titolo: string;
          descrizione: string | null;
          tipo: "uscita" | "campo" | "riunione" | "altro";
          data_inizio: string;
          data_fine: string | null;
          luogo: string | null;
        }[]
      | null;
  };

  if (!eventi) return [];

  return eventi.map((e) => ({
    id: e.id,
    titolo: e.titolo,
    descrizione: e.descrizione ?? undefined,
    tipo: e.tipo,
    dataInizio: e.data_inizio,
    dataFine: e.data_fine ?? undefined,
    luogo: e.luogo ?? undefined,
  }));
}
