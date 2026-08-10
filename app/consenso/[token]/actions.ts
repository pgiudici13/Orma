"use server";

import { createClient } from "@/lib/supabase/server";

export type ConsensoState = { success: boolean; error?: string } | null;

export async function confermaConsenso(
  _prevState: ConsensoState,
  formData: FormData,
): Promise<ConsensoState> {
  const token = String(formData.get("token") ?? "");
  const accetta = formData.get("accetta") === "on";

  if (!token) {
    return { success: false, error: "Link non valido." };
  }

  if (!accetta) {
    return {
      success: false,
      error: "Devi confermare la dichiarazione per procedere.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("confirm_parental_consent", {
    p_token: token,
  });

  if (error || !data) {
    return {
      success: false,
      error: "Link non valido, scaduto o già utilizzato.",
    };
  }

  return { success: true };
}
