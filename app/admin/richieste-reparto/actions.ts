"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Approva/rifiuta una richiesta di Reparto (P5-T02). La verifica
 * dell'permesso admin avviene dentro decidi_richiesta_reparto()
 * (SECURITY DEFINER, DEC-016): nessun controllo duplicato qui, coerente con
 * il resto delle Server Action del progetto.
 */
export async function decidiRichiesta(
  richiestaId: string,
  esito: "approvata" | "rifiutata",
) {
  const supabase = await createClient();

  const { error } = await supabase.rpc("decidi_richiesta_reparto", {
    p_richiesta_id: richiestaId,
    p_esito: esito,
  });

  if (error) {
    throw new Error(`Impossibile decidere la richiesta: ${error.message}`);
  }

  revalidatePath("/admin/richieste-reparto");
}
