import { createClient } from "@/lib/supabase/server";
import type { CardData, ContentKind, NotaData } from "@/lib/scene/objects";
import { distintivoPublicUrl } from "@/lib/supabase/storage";

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

function maestroNome(row: {
  maestro_esterno: { nome: string } | null;
  maestro_profile: { nome: string } | null;
}): string | undefined {
  return row.maestro_esterno?.nome ?? row.maestro_profile?.nome ?? undefined;
}

/**
 * Specialità/Competenze/Tappe con progresso attivo dell'utente autenticato,
 * pronte per la scena tavolo e il pannello di dettaglio (P3-T04/T05). RLS
 * applica già l'isolamento per profilo (P3-T03): questa query non filtra
 * nulla che il database non filtrerebbe comunque, si limita a comporre i
 * dati per la UI.
 */
export async function getTableCards(): Promise<CardData[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const [specialitaRes, competenzaRes, tappaRes] = await Promise.all([
    supabase
      .from("user_specialita")
      .select(
        "stato, data_inizio, data_completamento, specialita:specialita_id(id, slug, nome, immagine_path), maestro_esterno:maestro_esterno_id(nome), maestro_profile:maestro_profile_id(nome)",
      )
      .eq("profile_id", user.id),
    supabase
      .from("user_competenza")
      .select(
        "stato, data_inizio, data_completamento, competenza:competenza_id(id, slug, nome), maestro_esterno:maestro_esterno_id(nome), maestro_profile:maestro_profile_id(nome)",
      )
      .eq("profile_id", user.id),
    supabase
      .from("user_tappa")
      .select(
        "data_inizio, data_completamento, tappa:tappa_id(id, slug, nome, immagine_path)",
      )
      .eq("profile_id", user.id),
  ]);

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
    maestro_profile: { nome: string } | null;
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
      maestroNome: maestroNome(row),
    });
  }

  type CompetenzaRow = {
    stato: "in_corso" | "completata";
    data_inizio: string;
    data_completamento: string | null;
    competenza: { id: string; slug: string; nome: string } | null;
    maestro_esterno: { nome: string } | null;
    maestro_profile: { nome: string } | null;
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
      maestroNome: maestroNome(row),
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
