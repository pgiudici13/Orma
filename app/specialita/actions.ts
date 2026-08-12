"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Avvia il percorso personale verso una Specialità ufficiale (P3-T04).
 * Idempotente: se l'utente l'ha già avviata, l'unique constraint su
 * (profile_id, specialita_id) fa fallire silenziosamente il secondo inserimento.
 */
export async function startSpecialita(specialitaId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("user_specialita")
    .insert({ profile_id: user.id, specialita_id: specialitaId });

  // 23505 = unique_violation: la riga esiste già, non è un errore da segnalare.
  if (error && error.code !== "23505") {
    throw new Error(`Impossibile avviare la Specialità: ${error.message}`);
  }

  revalidatePath("/specialita");
  revalidatePath("/");
}
