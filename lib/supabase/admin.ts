import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Client con la secret key Supabase — server-only, mai importato da codice
 * client. Usato solo per operazioni fidate dove l'id utente proviene da una
 * risposta Supabase Auth già verificata (es. subito dopo signUp), non da
 * input client, secondo il vincolo "mai fidarsi di user id forniti dal
 * client" in CLAUDE.md.
 */
export function createAdminClient() {
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("SUPABASE_SECRET_KEY non configurata");
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secretKey,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
