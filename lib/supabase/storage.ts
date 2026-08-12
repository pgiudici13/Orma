import type { createClient } from "@/lib/supabase/server";

const DISTINTIVI_BUCKET = "distintivi";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/** URL pubblico di un asset processato dalla pipeline (P3-T02b), bucket read-only. */
export function distintivoPublicUrl(
  supabase: SupabaseServerClient,
  immaginePath: string | null | undefined,
): string | undefined {
  if (!immaginePath) return undefined;
  return supabase.storage.from(DISTINTIVI_BUCKET).getPublicUrl(immaginePath)
    .data.publicUrl;
}
