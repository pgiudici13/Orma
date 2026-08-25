import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Rate limiting applicativo per azioni pubbliche/anonime (P11-T03). Server-only:
 * chiama `check_rate_limit` sempre con il client admin (service role), mai
 * esposta ad anon/authenticated via PostgREST — vedi il commento nella
 * migrazione `20260825120000_rate_limit.sql` sul perché.
 *
 * In caso di errore imprevisto della funzione, non blocca l'utente: questo è
 * uno strato di difesa aggiuntivo, non l'unico controllo sull'azione.
 */
export async function checkRateLimit(
  chiave: string,
  max: number,
  finestraMinuti: number,
): Promise<boolean> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("check_rate_limit", {
    p_chiave: chiave,
    p_max: max,
    p_finestra_minuti: finestraMinuti,
  });

  if (error) return true;
  return data === true;
}

/** IP del chiamante secondo l'header impostato dall'edge network di Vercel. */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}
