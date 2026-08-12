"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type RichiediRepartoState = { error: string } | null;

/**
 * Crea una richiesta di associazione a un Reparto (P5-T02). L'indice unico
 * parziale su richiesta_reparto (profile_id) where stato = 'in_attesa'
 * impedisce più richieste pendenti contemporanee per lo stesso utente.
 */
export async function richiediReparto(
  _prevState: RichiediRepartoState,
  formData: FormData,
): Promise<RichiediRepartoState> {
  const repartoId = String(formData.get("repartoId") ?? "").trim();
  if (!repartoId) {
    return { error: "Seleziona un Reparto." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Devi essere autenticato." };
  }

  const { error } = await supabase
    .from("richiesta_reparto")
    .insert({ profile_id: user.id, reparto_id: repartoId });

  if (error) {
    if (error.code === "23505") {
      return { error: "Hai già una richiesta in attesa." };
    }
    return { error: `Impossibile inviare la richiesta: ${error.message}` };
  }

  revalidatePath("/onboarding-reparto");
  return null;
}
