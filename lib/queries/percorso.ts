import { createClient } from "@/lib/supabase/server";
import { distintivoPublicUrl } from "@/lib/supabase/storage";
import type { ContentKind } from "@/lib/scene/objects";

/**
 * Contenuto ufficiale (Specialità, Competenze, Tappe) con lo stato del percorso
 * personale di chi guarda — le superfici che sostituiscono le pagine catalogo
 * `/specialita`, `/competenze`, `/tappe` (RD-T07).
 *
 * Il contenuto ufficiale e il progresso personale restano due cose distinte
 * anche qui: la voce di catalogo è il contenuto ufficiale, `stato` è la
 * relazione dell'utente con quella voce (`CLAUDE.md`, "Official vs personal").
 */

export type CatalogoVoce = {
  id: string;
  nome: string;
  descrizione?: string;
  imageUrl?: string;
  /** `null` quando l'utente non ha ancora avviato questa voce. */
  stato: "in_corso" | "completata" | null;
};

export type CatalogoData = {
  kind: ContentKind;
  voci: CatalogoVoce[];
};

type OfficialRow = {
  id: string;
  nome: string;
  descrizione?: string | null;
  immagine_path?: string | null;
};

type ProgressRow = {
  riferimento: string;
  stato?: "in_corso" | "completata";
  data_completamento?: string | null;
};

/** Tabelle e colonne di ciascuna famiglia: l'unica differenza fra i tre casi. */
const SOURCE: Record<
  ContentKind,
  {
    official: string;
    columns: string;
    order: string;
    progress: string;
    foreignKey: string;
  }
> = {
  specialita: {
    official: "specialita",
    columns: "id, nome, immagine_path",
    order: "nome",
    progress: "user_specialita",
    foreignKey: "specialita_id",
  },
  competenza: {
    official: "competenza",
    columns: "id, nome, descrizione",
    order: "nome",
    progress: "user_competenza",
    foreignKey: "competenza_id",
  },
  tappa: {
    official: "tappa",
    columns: "id, nome, immagine_path",
    order: "ordine",
    progress: "user_tappa",
    foreignKey: "tappa_id",
  },
};

export async function getCatalogo(kind: ContentKind): Promise<CatalogoData> {
  const source = SOURCE[kind];
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [officialRes, progressRes] = await Promise.all([
    supabase.from(source.official).select(source.columns).order(source.order),
    user
      ? supabase
          .from(source.progress)
          .select(
            // Le Tappe non hanno uno stato: si deducono dalla data di fine.
            kind === "tappa"
              ? `${source.foreignKey}, data_completamento`
              : `${source.foreignKey}, stato`,
          )
          .eq("profile_id", user.id)
      : Promise.resolve({ data: [] }),
  ]);

  const progress = new Map<string, CatalogoVoce["stato"]>();
  for (const row of (progressRes.data ?? []) as unknown as (ProgressRow &
    Record<string, string>)[]) {
    const riferimento = row[source.foreignKey];
    progress.set(
      riferimento,
      kind === "tappa"
        ? row.data_completamento
          ? "completata"
          : "in_corso"
        : (row.stato ?? "in_corso"),
    );
  }

  return {
    kind,
    voci: ((officialRes.data ?? []) as unknown as OfficialRow[]).map((row) => ({
      id: row.id,
      nome: row.nome,
      descrizione: row.descrizione ?? undefined,
      imageUrl: distintivoPublicUrl(supabase, row.immagine_path ?? null),
      stato: progress.get(row.id) ?? null,
    })),
  };
}

export type MaestroVoce = {
  id: string;
  nome: string;
  /** Contenuto ufficiale per cui questo Maestro accompagna l'utente. */
  per: string;
  esterno: boolean;
};

/**
 * I Maestri associati al proprio percorso (RD-T07).
 *
 * Solo i propri: la ricerca globale dei Maestri è la Fase 8 e richiede un
 * meccanismo di visibilità esplicita (`docs/PERMISSIONS.md`), che non esiste
 * ancora. Qui non si espone nessun dato che l'utente non abbia già inserito.
 */
export async function getMaestri(): Promise<MaestroVoce[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const [specialitaRes, competenzeRes] = await Promise.all([
    supabase
      .from("user_specialita")
      .select(
        "specialita:specialita_id(nome), maestro_esterno:maestro_esterno_id(id, nome), maestro_profile:maestro_profile_id(id, nome)",
      )
      .eq("profile_id", user.id),
    supabase
      .from("user_competenza")
      .select(
        "competenza:competenza_id(nome), maestro_esterno:maestro_esterno_id(id, nome), maestro_profile:maestro_profile_id(id, nome)",
      )
      .eq("profile_id", user.id),
  ]);

  type Row = {
    specialita?: { nome: string } | null;
    competenza?: { nome: string } | null;
    maestro_esterno: { id: string; nome: string } | null;
    maestro_profile: { id: string; nome: string } | null;
  };

  const rows = [
    ...((specialitaRes.data ?? []) as unknown as Row[]),
    ...((competenzeRes.data ?? []) as unknown as Row[]),
  ];

  return rows.flatMap((row) => {
    const maestro = row.maestro_esterno ?? row.maestro_profile;
    if (!maestro) return [];
    return [
      {
        id: `${maestro.id}:${row.specialita?.nome ?? row.competenza?.nome ?? ""}`,
        nome: maestro.nome,
        per: row.specialita?.nome ?? row.competenza?.nome ?? "—",
        esterno: Boolean(row.maestro_esterno),
      },
    ];
  });
}

export type AdesioneData = {
  reparti: { id: string; nome: string }[];
  inAttesa: boolean;
  rifiutata: boolean;
};

/**
 * Stato della richiesta di adesione a un Reparto (RD-T07).
 *
 * `reparto` è l'unica tabella leggibile da qualunque utente autenticato: senza
 * questo elenco l'onboarding sarebbe impossibile (vedi Fase 6, RLS di
 * `squadriglia` a confronto).
 */
export async function getAdesione(): Promise<AdesioneData> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { reparti: [], inAttesa: false, rifiutata: false };

  const [repartiRes, ultimaRes] = await Promise.all([
    supabase.from("reparto").select("id, nome").order("nome"),
    supabase
      .from("richiesta_reparto")
      .select("stato")
      .eq("profile_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const stato = (ultimaRes.data as { stato?: string } | null)?.stato;

  return {
    reparti: (repartiRes.data ?? []) as { id: string; nome: string }[],
    inAttesa: stato === "in_attesa",
    rifiutata: stato === "rifiutata",
  };
}

export type ProfiloData = {
  nome: string;
  dataNascita: string | null;
  repartoNome: string | null;
};

/** Dati del proprio profilo, per la superficie Impostazioni (RD-T07). */
export async function getProfilo(): Promise<ProfiloData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = (await supabase
    .from("profiles")
    .select("nome, data_nascita, reparto:reparto_id(nome)")
    .eq("id", user.id)
    .single()) as unknown as {
    data: {
      nome: string;
      data_nascita: string | null;
      reparto: { nome: string } | null;
    } | null;
  };

  if (!data) return null;

  return {
    nome: data.nome,
    dataNascita: data.data_nascita,
    repartoNome: data.reparto?.nome ?? null,
  };
}
