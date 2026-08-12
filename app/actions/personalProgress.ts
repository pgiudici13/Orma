"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type CompletableKind = "specialita" | "competenza";

const TABLE_BY_KIND: Record<CompletableKind, string> = {
  specialita: "user_specialita",
  competenza: "user_competenza",
};

const FK_BY_KIND: Record<CompletableKind, string> = {
  specialita: "specialita_id",
  competenza: "competenza_id",
};

/**
 * Segna come completata una Specialità/Competenza in corso (P3-T05). Le
 * Tappe non hanno un campo stato (solo date), quindi non sono coperte qui.
 */
export async function markCompleted(kind: CompletableKind, contentId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from(TABLE_BY_KIND[kind])
    .update({
      stato: "completata",
      data_completamento: new Date().toISOString().slice(0, 10),
    })
    .eq("profile_id", user.id)
    .eq(FK_BY_KIND[kind], contentId);

  revalidatePath("/");
}

/**
 * Aggiunge una nota personale su una Specialità/Competenza/Tappa (P3-T05).
 * Riceve FormData (come le altre action del progetto, es. app/login/actions.ts)
 * perché il testo arriva da un campo del form, non da un parametro fisso.
 */
export async function addNota(formData: FormData) {
  const tipo = String(formData.get("tipo") ?? "");
  const riferimentoId = String(formData.get("riferimentoId") ?? "");
  const testo = String(formData.get("testo") ?? "").trim();
  if (!tipo || !riferimentoId || !testo) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from("nota").insert({
    profile_id: user.id,
    tipo,
    riferimento_id: riferimentoId,
    testo,
  });

  if (error) {
    throw new Error(`Impossibile salvare la nota: ${error.message}`);
  }

  revalidatePath("/");
}

/**
 * Modifica il testo di una nota esistente (P4-T01). Il filtro su profile_id
 * è difesa in profondità: la RLS (`nota_update_own`) già impedisce di
 * modificare note altrui.
 */
export async function updateNota(id: string, formData: FormData) {
  const testoTrim = String(formData.get("testo") ?? "").trim();
  if (!testoTrim) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("nota")
    .update({ testo: testoTrim })
    .eq("id", id)
    .eq("profile_id", user.id);

  if (error) {
    throw new Error(`Impossibile modificare la nota: ${error.message}`);
  }

  revalidatePath("/");
}

/**
 * Elimina una nota esistente (P4-T01). Nessuna conferma richiesta, coerente
 * con il resto del pannello (es. "Segna come completata").
 */
export async function deleteNota(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("nota")
    .delete()
    .eq("id", id)
    .eq("profile_id", user.id);

  if (error) {
    throw new Error(`Impossibile eliminare la nota: ${error.message}`);
  }

  revalidatePath("/");
}

/**
 * Associa come Maestro interno un altro utente ORMA, trovato per email esatta
 * (P4-T02). Reparto e ricerca globale Maestri non esistono ancora (Fase 6/7/8),
 * quindi l'email esatta è l'unico modo per trovare l'id di un altro profilo:
 * vedi `find_profile_by_email` (SECURITY DEFINER, nessuna ricerca parziale).
 * Il vincolo `*_maestro_unico` a DB impone maestro_esterno_id = null qui.
 */
export async function assignMaestroInterno(
  kind: CompletableKind,
  contentId: string,
  formData: FormData,
) {
  const emailTrim = String(formData.get("email") ?? "").trim();
  if (!emailTrim) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: found, error: lookupError } = await supabase
    .rpc("find_profile_by_email", { p_email: emailTrim })
    .maybeSingle<{ id: string; nome: string }>();

  if (lookupError) {
    throw new Error(`Impossibile cercare il Maestro: ${lookupError.message}`);
  }
  if (!found) {
    throw new Error("Nessun utente ORMA trovato con questa email.");
  }

  const { error } = await supabase
    .from(TABLE_BY_KIND[kind])
    .update({ maestro_profile_id: found.id, maestro_esterno_id: null })
    .eq("profile_id", user.id)
    .eq(FK_BY_KIND[kind], contentId);

  if (error) {
    throw new Error(`Impossibile associare il Maestro: ${error.message}`);
  }

  revalidatePath("/");
}

/**
 * Aggiunge manualmente un Maestro esterno (senza account ORMA) e lo associa
 * al percorso (P4-T03). Nessun record auth.users viene mai creato.
 */
export async function addMaestroEsterno(
  kind: CompletableKind,
  contentId: string,
  formData: FormData,
) {
  const nome = String(formData.get("nome") ?? "").trim();
  const contatto = String(formData.get("contatto") ?? "").trim();
  if (!nome) {
    throw new Error("Il nome del Maestro è obbligatorio.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: maestro, error: insertError } = await supabase
    .from("maestro_esterno")
    .insert({
      profile_id: user.id,
      nome,
      contatto: contatto || null,
    })
    .select("id")
    .single();

  if (insertError || !maestro) {
    throw new Error(
      `Impossibile aggiungere il Maestro: ${insertError?.message ?? "errore sconosciuto"}`,
    );
  }

  const { error } = await supabase
    .from(TABLE_BY_KIND[kind])
    .update({ maestro_esterno_id: maestro.id, maestro_profile_id: null })
    .eq("profile_id", user.id)
    .eq(FK_BY_KIND[kind], contentId);

  if (error) {
    throw new Error(`Impossibile associare il Maestro: ${error.message}`);
  }

  revalidatePath("/");
}
