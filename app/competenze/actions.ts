"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Avvia il percorso personale verso una Competenza ufficiale (P3-T06,
 * stesso pattern di app/specialita/actions.ts). Idempotente: se l'utente
 * l'ha già avviata, l'unique constraint su (profile_id, competenza_id) fa
 * fallire silenziosamente il secondo inserimento.
 */
export async function startCompetenza(competenzaId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("user_competenza")
    .insert({ profile_id: user.id, competenza_id: competenzaId });

  // 23505 = unique_violation: la riga esiste già, non è un errore da segnalare.
  if (error && error.code !== "23505") {
    throw new Error(`Impossibile avviare la Competenza: ${error.message}`);
  }

  revalidatePath("/competenze");
  revalidatePath("/");
}
