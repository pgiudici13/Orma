"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUserAndProfile } from "@/app/reparto/actions";

/**
 * Azioni dell'archivio storico di Reparto (Fase 9).
 *
 * Scritture riservate ai Capi del Reparto (o admin globale), come il
 * calendario (P7-T03): l'archivio è memoria condivisa, non si modifica da
 * soli. La RLS resta la difesa — questi controlli sul ruolo servono a dare
 * messaggi chiari, non a proteggere i dati.
 */

type EntitaTipo = "uscita" | "campo" | "luogo";

const ENTITA_TABELLA: Record<EntitaTipo, string> = {
  uscita: "uscita",
  campo: "campo",
  luogo: "luogo",
};

/** Legge i valori comuni ai moduli di uscita e campo. */
function leggiAttivita(formData: FormData) {
  const titolo = String(formData.get("titolo") ?? "").trim();
  const luogoId = String(formData.get("luogo_id") ?? "").trim() || null;
  const programma = String(formData.get("programma") ?? "").trim() || null;
  const note = String(formData.get("note") ?? "").trim() || null;

  return { titolo, luogoId, programma, note };
}

/** Sostituisce partecipanti/Squadriglie di un'uscita o campo (il modulo invia la lista completa). */
async function sostituisciRelazioni(
  supabase: Awaited<ReturnType<typeof createClient>>,
  entitaTipo: "uscita" | "campo",
  entitaId: string,
  partecipanti: string[],
  squadriglie: string[],
) {
  const [partecipantiTable, squadriglieTable, fkPartecipanti, fkSquadriglie] =
    entitaTipo === "uscita"
      ? ([
          "uscita_partecipante",
          "uscita_squadriglia",
          "uscita_id",
          "uscita_id",
        ] as const)
      : ([
          "campo_partecipante",
          "campo_squadriglia",
          "campo_id",
          "campo_id",
        ] as const);

  await supabase.from(partecipantiTable).delete().eq(fkPartecipanti, entitaId);
  if (partecipanti.length > 0) {
    await supabase
      .from(partecipantiTable)
      .insert(
        partecipanti.map((profile_id) => ({
          [fkPartecipanti]: entitaId,
          profile_id,
        })),
      );
  }

  await supabase.from(squadriglieTable).delete().eq(fkSquadriglie, entitaId);
  if (squadriglie.length > 0) {
    await supabase
      .from(squadriglieTable)
      .insert(
        squadriglie.map((squadriglia_id) => ({
          [fkSquadriglie]: entitaId,
          squadriglia_id,
        })),
      );
  }
}

// ---------------------------------------------------------------------------
// Luoghi
// ---------------------------------------------------------------------------

export async function creaLuogo(formData: FormData) {
  const { supabase, profile, isCapoOrAdmin } =
    await getAuthenticatedUserAndProfile();
  if (!isCapoOrAdmin) {
    throw new Error("Permesso negato: operazione riservata ai Capi Reparto.");
  }

  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) throw new Error("Il nome del luogo è obbligatorio.");
  const descrizione = String(formData.get("descrizione") ?? "").trim() || null;

  const { error } = await supabase.from("luogo").insert({
    reparto_id: profile.reparto_id,
    nome,
    descrizione,
  });
  if (error) {
    throw new Error(`Errore nella creazione del luogo: ${error.message}`);
  }
  revalidatePath("/");
}

export async function eliminaLuogo(luogoId: string) {
  const { supabase, isCapoOrAdmin } = await getAuthenticatedUserAndProfile();
  if (!isCapoOrAdmin) {
    throw new Error("Permesso negato: operazione riservata ai Capi Reparto.");
  }

  const { error } = await supabase.from("luogo").delete().eq("id", luogoId);
  if (error) {
    throw new Error(`Errore nell'eliminazione del luogo: ${error.message}`);
  }
  revalidatePath("/");
}

// ---------------------------------------------------------------------------
// Uscite
// ---------------------------------------------------------------------------

export async function creaUscita(formData: FormData) {
  const { supabase, profile, isCapoOrAdmin } =
    await getAuthenticatedUserAndProfile();
  if (!isCapoOrAdmin) {
    throw new Error("Permesso negato: operazione riservata ai Capi Reparto.");
  }

  const { titolo, luogoId, programma, note } = leggiAttivita(formData);
  const data = String(formData.get("data") ?? "");
  const materiale = String(formData.get("materiale") ?? "").trim() || null;
  if (!titolo) throw new Error("Il titolo dell'uscita è obbligatorio.");
  if (!data) throw new Error("La data è obbligatoria.");

  const { data: inserita, error } = await supabase
    .from("uscita")
    .insert({
      reparto_id: profile.reparto_id,
      titolo,
      data,
      luogo_id: luogoId,
      programma,
      materiale,
      note,
    })
    .select("id")
    .single();
  if (error || !inserita) {
    throw new Error(
      `Errore nella creazione dell'uscita: ${error?.message ?? "errore sconosciuto"}`,
    );
  }

  await sostituisciRelazioni(
    supabase,
    "uscita",
    inserita.id,
    formData.getAll("partecipanti").map(String),
    formData.getAll("squadriglie").map(String),
  );

  revalidatePath("/");
}

export async function modificaUscita(uscitaId: string, formData: FormData) {
  const { supabase, isCapoOrAdmin } = await getAuthenticatedUserAndProfile();
  if (!isCapoOrAdmin) {
    throw new Error("Permesso negato: operazione riservata ai Capi Reparto.");
  }

  const { titolo, luogoId, programma, note } = leggiAttivita(formData);
  const data = String(formData.get("data") ?? "");
  const materiale = String(formData.get("materiale") ?? "").trim() || null;
  if (!titolo) throw new Error("Il titolo dell'uscita è obbligatorio.");
  if (!data) throw new Error("La data è obbligatoria.");

  const { error } = await supabase
    .from("uscita")
    .update({ titolo, data, luogo_id: luogoId, programma, materiale, note })
    .eq("id", uscitaId);
  if (error) {
    throw new Error(`Errore nella modifica dell'uscita: ${error.message}`);
  }

  await sostituisciRelazioni(
    supabase,
    "uscita",
    uscitaId,
    formData.getAll("partecipanti").map(String),
    formData.getAll("squadriglie").map(String),
  );

  revalidatePath("/");
}

export async function eliminaUscita(uscitaId: string) {
  const { supabase, isCapoOrAdmin } = await getAuthenticatedUserAndProfile();
  if (!isCapoOrAdmin) {
    throw new Error("Permesso negato: operazione riservata ai Capi Reparto.");
  }

  await rimuoviDocumentiDi(supabase, "uscita", uscitaId);

  const { error } = await supabase.from("uscita").delete().eq("id", uscitaId);
  if (error) {
    throw new Error(`Errore nell'eliminazione dell'uscita: ${error.message}`);
  }
  revalidatePath("/");
}

// ---------------------------------------------------------------------------
// Campi
// ---------------------------------------------------------------------------

export async function creaCampo(formData: FormData) {
  const { supabase, profile, isCapoOrAdmin } =
    await getAuthenticatedUserAndProfile();
  if (!isCapoOrAdmin) {
    throw new Error("Permesso negato: operazione riservata ai Capi Reparto.");
  }

  const { titolo, luogoId, programma, note } = leggiAttivita(formData);
  const anno = Number(formData.get("anno") ?? "");
  const dataInizio = String(formData.get("data_inizio") ?? "").trim() || null;
  const dataFine = String(formData.get("data_fine") ?? "").trim() || null;
  if (!titolo) throw new Error("Il titolo del campo è obbligatorio.");
  if (!Number.isInteger(anno)) throw new Error("L'anno è obbligatorio.");

  const { data: inserito, error } = await supabase
    .from("campo")
    .insert({
      reparto_id: profile.reparto_id,
      titolo,
      anno,
      data_inizio: dataInizio,
      data_fine: dataFine,
      luogo_id: luogoId,
      programma,
      note,
    })
    .select("id")
    .single();
  if (error || !inserito) {
    throw new Error(
      `Errore nella creazione del campo: ${error?.message ?? "errore sconosciuto"}`,
    );
  }

  await sostituisciRelazioni(
    supabase,
    "campo",
    inserito.id,
    formData.getAll("partecipanti").map(String),
    formData.getAll("squadriglie").map(String),
  );

  revalidatePath("/");
}

export async function modificaCampo(campoId: string, formData: FormData) {
  const { supabase, isCapoOrAdmin } = await getAuthenticatedUserAndProfile();
  if (!isCapoOrAdmin) {
    throw new Error("Permesso negato: operazione riservata ai Capi Reparto.");
  }

  const { titolo, luogoId, programma, note } = leggiAttivita(formData);
  const anno = Number(formData.get("anno") ?? "");
  const dataInizio = String(formData.get("data_inizio") ?? "").trim() || null;
  const dataFine = String(formData.get("data_fine") ?? "").trim() || null;
  if (!titolo) throw new Error("Il titolo del campo è obbligatorio.");
  if (!Number.isInteger(anno)) throw new Error("L'anno è obbligatorio.");

  const { error } = await supabase
    .from("campo")
    .update({
      titolo,
      anno,
      data_inizio: dataInizio,
      data_fine: dataFine,
      luogo_id: luogoId,
      programma,
      note,
    })
    .eq("id", campoId);
  if (error) {
    throw new Error(`Errore nella modifica del campo: ${error.message}`);
  }

  await sostituisciRelazioni(
    supabase,
    "campo",
    campoId,
    formData.getAll("partecipanti").map(String),
    formData.getAll("squadriglie").map(String),
  );

  revalidatePath("/");
}

export async function eliminaCampo(campoId: string) {
  const { supabase, isCapoOrAdmin } = await getAuthenticatedUserAndProfile();
  if (!isCapoOrAdmin) {
    throw new Error("Permesso negato: operazione riservata ai Capi Reparto.");
  }

  await rimuoviDocumentiDi(supabase, "campo", campoId);

  const { error } = await supabase.from("campo").delete().eq("id", campoId);
  if (error) {
    throw new Error(`Errore nell'eliminazione del campo: ${error.message}`);
  }
  revalidatePath("/");
}

// ---------------------------------------------------------------------------
// Documenti e fotografie (bucket privato "archivio")
// ---------------------------------------------------------------------------

/**
 * Elimina metadati e file dei documenti collegati a un'entità (usata quando
 * l'entità stessa viene cancellata: documento_archivio non ha FK sul target).
 */
async function rimuoviDocumentiDi(
  supabase: Awaited<ReturnType<typeof createClient>>,
  entitaTipo: EntitaTipo,
  entitaId: string,
) {
  const { data: documenti } = await supabase
    .from("documento_archivio")
    .select("file_path")
    .eq("entita_tipo", entitaTipo)
    .eq("entita_id", entitaId);

  const filePath = (documenti ?? []).map((d) => d.file_path);
  if (filePath.length > 0) {
    await supabase.storage.from("archivio").remove(filePath);
  }
  await supabase
    .from("documento_archivio")
    .delete()
    .eq("entita_tipo", entitaTipo)
    .eq("entita_id", entitaId);
}

export async function caricaDocumento(formData: FormData) {
  const { supabase, profile, isCapoOrAdmin } =
    await getAuthenticatedUserAndProfile();
  if (!isCapoOrAdmin) {
    throw new Error("Permesso negato: operazione riservata ai Capi Reparto.");
  }

  const tipo = String(formData.get("tipo") ?? "");
  const entitaTipo = String(formData.get("entitaTipo") ?? "") as EntitaTipo;
  const entitaId = String(formData.get("entitaId") ?? "");
  const file = formData.get("file");

  if (tipo !== "foto" && tipo !== "documento") {
    throw new Error("Tipo di documento non valido.");
  }
  if (!["uscita", "campo", "luogo"].includes(entitaTipo)) {
    throw new Error("Destinazione del documento non valida.");
  }
  if (!entitaId) throw new Error("Destinazione del documento mancante.");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Scegli un file da caricare.");
  }

  // Difesa in profondità: la destinazione deve appartenere al proprio Reparto.
  const tabella = ENTITA_TABELLA[entitaTipo];
  const { data: destinazione } = await supabase
    .from(tabella)
    .select("id")
    .eq("id", entitaId)
    .eq("reparto_id", profile.reparto_id)
    .maybeSingle();
  if (!destinazione) {
    throw new Error("La destinazione indicata non appartiene al tuo Reparto.");
  }

  const estensione = file.name.split(".").pop()?.toLowerCase() ?? "";
  const filePath = `${profile.reparto_id}/${entitaTipo}/${entitaId}/${crypto.randomUUID()}${estensione ? `.${estensione}` : ""}`;

  const { error: uploadError } = await supabase.storage
    .from("archivio")
    .upload(filePath, file, { contentType: file.type, upsert: false });
  if (uploadError) {
    throw new Error(`Errore nel caricamento del file: ${uploadError.message}`);
  }

  const { error: insertError } = await supabase
    .from("documento_archivio")
    .insert({
      reparto_id: profile.reparto_id,
      tipo,
      entita_tipo: entitaTipo,
      entita_id: entitaId,
      file_path: filePath,
      nome_file: file.name,
      uploaded_by: profile.id,
    });

  if (insertError) {
    // Rollback del file orfano: il metadato non è passato.
    await supabase.storage.from("archivio").remove([filePath]);
    throw new Error(
      `Errore nel salvataggio del documento: ${insertError.message}`,
    );
  }

  revalidatePath("/");
}

export async function eliminaDocumento(documentoId: string) {
  const { supabase, isCapoOrAdmin } = await getAuthenticatedUserAndProfile();
  if (!isCapoOrAdmin) {
    throw new Error("Permesso negato: operazione riservata ai Capi Reparto.");
  }

  // Prima il metadato (la RLS decide chi può), poi il file: un errore dopo la
  // cancellazione lascia al più un file orfano, mai un documento senza file.
  const { data: documento } = await supabase
    .from("documento_archivio")
    .select("file_path")
    .eq("id", documentoId)
    .maybeSingle();

  const { error } = await supabase
    .from("documento_archivio")
    .delete()
    .eq("id", documentoId);
  if (error) {
    throw new Error(`Errore nell'eliminazione del documento: ${error.message}`);
  }

  if (documento?.file_path) {
    await supabase.storage.from("archivio").remove([documento.file_path]);
  }

  revalidatePath("/");
}
