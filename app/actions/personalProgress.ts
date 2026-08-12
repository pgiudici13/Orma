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
 * Il CRUD completo (modifica/eliminazione, note multiple gestite) resta a
 * P4-T01: qui si copre solo la creazione minima richiesta dal pannello.
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

  await supabase.from("nota").insert({
    profile_id: user.id,
    tipo,
    riferimento_id: riferimentoId,
    testo,
  });

  revalidatePath("/");
}
