"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AggiornaProfiloState = { error: string } | { success: true } | null;

export async function aggiornaProfilo(
  _prevState: AggiornaProfiloState,
  formData: FormData,
): Promise<AggiornaProfiloState> {
  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) {
    return { error: "Il nome non può essere vuoto." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Devi essere autenticato." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ nome })
    .eq("id", user.id);

  if (error) {
    return { error: `Impossibile salvare: ${error.message}` };
  }

  revalidatePath("/impostazioni");
  return { success: true };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
