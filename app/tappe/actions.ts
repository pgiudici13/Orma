"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Avvia il percorso personale verso una Tappa (P3-T07, stesso pattern di
 * app/specialita/actions.ts). Idempotente: se l'utente l'ha già avviata,
 * l'unique constraint su (profile_id, tappa_id) fa fallire silenziosamente
 * il secondo inserimento.
 */
export async function startTappa(tappaId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("user_tappa")
    .insert({ profile_id: user.id, tappa_id: tappaId });

  if (error && error.code !== "23505") {
    throw new Error(`Impossibile avviare la Tappa: ${error.message}`);
  }

  revalidatePath("/tappe");
  revalidatePath("/");
}

/**
 * Segna una Tappa come completata. A differenza di Specialità/Competenza,
 * user_tappa non ha una colonna stato: il completamento è solo data_completamento.
 */
export async function markTappaCompleted(tappaId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("user_tappa")
    .update({ data_completamento: new Date().toISOString().slice(0, 10) })
    .eq("profile_id", user.id)
    .eq("tappa_id", tappaId);

  revalidatePath("/tappe");
  revalidatePath("/");
}
