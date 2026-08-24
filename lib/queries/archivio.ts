import { createClient } from "@/lib/supabase/server";

/**
 * Archivio storico di Reparto (Fase 9): uscite, campi, luoghi, fotografie e
 * documenti (FR-19, `docs/DATA_MODEL.md`).
 *
 * Come per la vita di Reparto (DEC-018), l'isolamento per Reparto è la RLS. I
 * nomi dei compagni di Reparto (membri, partecipanti a uscite/campi) si
 * risolvono tramite la funzione `membri_reparto()` (SECURITY DEFINER,
 * P10-T01), non con un embed diretto su `profiles`: quest'ultima non concede
 * più visibilità a riga intera tra membri (la RLS filtra righe, non colonne —
 * avrebbe esposto anche data di nascita e contatti del genitore). I file
 * vivono nel bucket privato "archivio": qui si generano solo URL firmati a
 * breve scadenza, mai URL pubblici (SDD §17).
 */

export type LuogoArchivio = {
  id: string;
  nome: string;
  descrizione?: string;
  documenti: DocumentoArchivio[];
};

export type DocumentoArchivio = {
  id: string;
  tipo: "foto" | "documento";
  nomeFile: string;
  /** URL firmato a breve scadenza (bucket privato). */
  url: string;
};

/** Un'uscita o un campo dell'archivio: la struttura è la stessa, cambiano i campi. */
export type AttivitaArchivio = {
  id: string;
  titolo: string;
  luogo?: { id: string; nome: string };
  programma?: string;
  note?: string;
  materiale?: string;
  partecipanti: string[];
  partecipanteIds: string[];
  squadriglie: string[];
  squadrigliaIds: string[];
  documenti: DocumentoArchivio[];
  /** Solo uscite. */
  data?: string;
  /** Solo campi. */
  anno?: number;
  dataInizio?: string;
  dataFine?: string;
};

export type ArchivioData = {
  /** `null` quando l'utente non è ancora associato a un Reparto. */
  repartoNome: string | null;
  isCapoOrAdmin: boolean;
  luoghi: LuogoArchivio[];
  uscite: AttivitaArchivio[];
  campi: AttivitaArchivio[];
  /** Nomi e Squadriglie del Reparto, per i moduli riservati ai Capi. */
  membri: { id: string; nome: string }[];
  squadriglie: { id: string; nome: string }[];
};

type UscitaRow = {
  id: string;
  titolo: string;
  data: string;
  programma: string | null;
  materiale: string | null;
  note: string | null;
  luogo: { id: string; nome: string } | null;
};

type CampoRow = {
  id: string;
  titolo: string;
  anno: number;
  data_inizio: string | null;
  data_fine: string | null;
  programma: string | null;
  note: string | null;
  luogo: { id: string; nome: string } | null;
};

type DocumentoDbRow = {
  id: string;
  tipo: "foto" | "documento";
  entita_tipo: "uscita" | "campo" | "luogo";
  entita_id: string;
  nome_file: string;
  file_path: string;
};

/** Raggruppa una lista di join per l'entità di riferimento: id e nomi allineati. */
function joinPerEntita<T>(
  rows: T[],
  getKey: (row: T) => string,
  getId: (row: T) => string | null,
  getNome: (row: T) => string | null,
): Map<string, { ids: string[]; nomi: string[] }> {
  const map = new Map<string, { ids: string[]; nomi: string[] }>();
  for (const row of rows) {
    const id = getId(row);
    const nome = getNome(row);
    if (!id || !nome) continue;
    const key = getKey(row);
    const entry = map.get(key) ?? { ids: [], nomi: [] };
    entry.ids.push(id);
    entry.nomi.push(nome);
    map.set(key, entry);
  }
  return map;
}

export async function getArchivio(): Promise<ArchivioData> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      repartoNome: null,
      isCapoOrAdmin: false,
      luoghi: [],
      uscite: [],
      campi: [],
      membri: [],
      squadriglie: [],
    };
  }

  const { data: ownProfile } = (await supabase
    .from("profiles")
    .select("ruolo, is_admin, reparto_id, reparto:reparto_id(nome)")
    .eq("id", user.id)
    .single()) as unknown as {
    data: {
      ruolo: string;
      is_admin: boolean;
      reparto_id: string | null;
      reparto: { nome: string } | null;
    } | null;
  };

  const isCapoOrAdmin =
    ownProfile?.ruolo === "capo" || Boolean(ownProfile?.is_admin);

  if (!ownProfile?.reparto_id || !ownProfile.reparto) {
    return {
      repartoNome: null,
      isCapoOrAdmin,
      luoghi: [],
      uscite: [],
      campi: [],
      membri: [],
      squadriglie: [],
    };
  }

  const repartoId = ownProfile.reparto_id;

  const [
    luoghiRes,
    usciteRes,
    campiRes,
    membriRes,
    squadriglieRes,
    documentiRes,
  ] = await Promise.all([
    supabase
      .from("luogo")
      .select("id, nome, descrizione")
      .eq("reparto_id", repartoId)
      .order("nome"),
    supabase
      .from("uscita")
      .select(
        "id, titolo, data, programma, materiale, note, luogo:luogo_id(id, nome)",
      )
      .eq("reparto_id", repartoId)
      .order("data", { ascending: false }),
    supabase
      .from("campo")
      .select(
        "id, titolo, anno, data_inizio, data_fine, programma, note, luogo:luogo_id(id, nome)",
      )
      .eq("reparto_id", repartoId)
      .order("anno", { ascending: false }),
    supabase.rpc("membri_reparto"),
    supabase
      .from("squadriglia")
      .select("id, nome")
      .eq("reparto_id", repartoId)
      .order("nome"),
    supabase
      .from("documento_archivio")
      .select("id, tipo, entita_tipo, entita_id, nome_file, file_path")
      .eq("reparto_id", repartoId),
  ]);

  const [
    uscitaPartecipantiRes,
    campoPartecipantiRes,
    uscitaSquadriglieRes,
    campoSquadriglieRes,
  ] = await Promise.all([
    supabase.from("uscita_partecipante").select("uscita_id, profile_id"),
    supabase.from("campo_partecipante").select("campo_id, profile_id"),
    supabase
      .from("uscita_squadriglia")
      .select("uscita_id, squadriglia_id, squadriglia:squadriglia_id(nome)"),
    supabase
      .from("campo_squadriglia")
      .select("campo_id, squadriglia_id, squadriglia:squadriglia_id(nome)"),
  ]);

  const membriDb = (membriRes.data ?? []) as unknown as {
    id: string;
    nome: string;
  }[];
  const nomeMembroById = new Map(membriDb.map((m) => [m.id, m.nome]));

  const documentiDb = (documentiRes.data ?? []) as unknown as DocumentoDbRow[];

  // Bucket privato: ogni file si apre con un URL firmato a breve scadenza.
  const { data: signed } = await supabase.storage
    .from("archivio")
    .createSignedUrls(
      documentiDb.map((d) => d.file_path),
      3600,
    );

  const documentiPerEntita = new Map<string, DocumentoArchivio[]>();
  documentiDb.forEach((documento, index) => {
    const signedUrl = signed?.[index]?.signedUrl;
    if (!signedUrl) return;
    const key = `${documento.entita_tipo}:${documento.entita_id}`;
    const list = documentiPerEntita.get(key) ?? [];
    list.push({
      id: documento.id,
      tipo: documento.tipo,
      nomeFile: documento.nome_file,
      url: signedUrl,
    });
    documentiPerEntita.set(key, list);
  });

  const uscitaPartecipanti = joinPerEntita(
    (uscitaPartecipantiRes.data ?? []) as unknown as {
      uscita_id: string;
      profile_id: string;
    }[],
    (row) => row.uscita_id,
    (row) => row.profile_id,
    (row) => nomeMembroById.get(row.profile_id) ?? null,
  );
  const campoPartecipanti = joinPerEntita(
    (campoPartecipantiRes.data ?? []) as unknown as {
      campo_id: string;
      profile_id: string;
    }[],
    (row) => row.campo_id,
    (row) => row.profile_id,
    (row) => nomeMembroById.get(row.profile_id) ?? null,
  );
  const uscitaSquadriglie = joinPerEntita(
    (uscitaSquadriglieRes.data ?? []) as unknown as {
      uscita_id: string;
      squadriglia_id: string;
      squadriglia: { nome: string } | null;
    }[],
    (row) => row.uscita_id,
    (row) => row.squadriglia_id,
    (row) => row.squadriglia?.nome ?? null,
  );
  const campoSquadriglie = joinPerEntita(
    (campoSquadriglieRes.data ?? []) as unknown as {
      campo_id: string;
      squadriglia_id: string;
      squadriglia: { nome: string } | null;
    }[],
    (row) => row.campo_id,
    (row) => row.squadriglia_id,
    (row) => row.squadriglia?.nome ?? null,
  );

  const uscite: AttivitaArchivio[] = (
    (usciteRes.data ?? []) as unknown as UscitaRow[]
  ).map((row) => ({
    id: row.id,
    titolo: row.titolo,
    data: row.data,
    luogo: row.luogo ?? undefined,
    programma: row.programma ?? undefined,
    materiale: row.materiale ?? undefined,
    note: row.note ?? undefined,
    partecipanti: uscitaPartecipanti.get(row.id)?.nomi ?? [],
    partecipanteIds: uscitaPartecipanti.get(row.id)?.ids ?? [],
    squadriglie: uscitaSquadriglie.get(row.id)?.nomi ?? [],
    squadrigliaIds: uscitaSquadriglie.get(row.id)?.ids ?? [],
    documenti: documentiPerEntita.get(`uscita:${row.id}`) ?? [],
  }));

  const campi: AttivitaArchivio[] = (
    (campiRes.data ?? []) as unknown as CampoRow[]
  ).map((row) => ({
    id: row.id,
    titolo: row.titolo,
    anno: row.anno,
    dataInizio: row.data_inizio ?? undefined,
    dataFine: row.data_fine ?? undefined,
    luogo: row.luogo ?? undefined,
    programma: row.programma ?? undefined,
    note: row.note ?? undefined,
    partecipanti: campoPartecipanti.get(row.id)?.nomi ?? [],
    partecipanteIds: campoPartecipanti.get(row.id)?.ids ?? [],
    squadriglie: campoSquadriglie.get(row.id)?.nomi ?? [],
    squadrigliaIds: campoSquadriglie.get(row.id)?.ids ?? [],
    documenti: documentiPerEntita.get(`campo:${row.id}`) ?? [],
  }));

  return {
    repartoNome: ownProfile.reparto.nome,
    isCapoOrAdmin,
    luoghi: ((luoghiRes.data ?? []) as unknown as LuogoArchivio[]).map(
      (luogo) => ({
        id: luogo.id,
        nome: luogo.nome,
        descrizione: luogo.descrizione ?? undefined,
        documenti: documentiPerEntita.get(`luogo:${luogo.id}`) ?? [],
      }),
    ),
    uscite,
    campi,
    membri: membriDb.map((membro) => ({ id: membro.id, nome: membro.nome })),
    squadriglie: (
      (squadriglieRes.data ?? []) as unknown as { id: string; nome: string }[]
    ).map((squadriglia) => ({ id: squadriglia.id, nome: squadriglia.nome })),
  };
}
