import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Riceve il link di conferma inviato da Supabase Auth dopo signUp()
 * (`{{ .SiteURL }}/auth/confirm?token_hash=...&type=email`, richiede aver
 * aggiornato il template "Confirm signup" sulla dashboard Supabase — l'app
 * non può farlo da codice). Scambia il token per una sessione valida.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const redirectTo = request.nextUrl.clone();
  redirectTo.searchParams.delete("token_hash");
  redirectTo.searchParams.delete("type");

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      redirectTo.pathname = "/";
      return NextResponse.redirect(redirectTo);
    }
  }

  redirectTo.pathname = "/login";
  redirectTo.searchParams.set("errore", "link-non-valido");
  return NextResponse.redirect(redirectTo);
}
