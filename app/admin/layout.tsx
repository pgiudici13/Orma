import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Gate di sicurezza per l'intero sottoalbero /admin/*: senza questo layout,
 * una nuova pagina admin che dimenticasse il proprio controllo is_admin
 * sarebbe raggiungibile da qualunque utente autenticato (il middleware
 * esenta /admin solo dal gate "Reparto non approvato", non verifica
 * is_admin — vedi lib/supabase/middleware.ts).
 *
 * Il controllo qui è il permesso più ampio richiesto da una qualunque
 * pagina admin oggi: admin globale (DEC-015) oppure Capo di Reparto
 * (DEC-017, che estende /admin/richieste-reparto anche a ruolo = "capo").
 * Pagine con un requisito più stretto (es. /admin, sola lettura cross-utente
 * riservata all'admin globale) mantengono il proprio controllo dedicato.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = (await supabase
    .from("profiles")
    .select("is_admin, ruolo")
    .eq("id", user.id)
    .single()) as unknown as {
    data: { is_admin: boolean; ruolo: string } | null;
  };

  if (!profile?.is_admin && profile?.ruolo !== "capo") redirect("/");

  return <>{children}</>;
}
