import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/login",
  "/registrati",
  "/consenso",
  "/privacy",
  "/attesa-consenso",
  "/auth",
  // Sandbox della scena tavolo: esiste solo in sviluppo (`app/tavolo-dev/`
  // risponde 404 in produzione), dove serve poter aprire la scena senza
  // passare dal login ad ogni iterazione di verifica visiva.
  ...(process.env.NODE_ENV === "production" ? [] : ["/tavolo-dev"]),
];

// Esenti dal gate "Reparto non approvato" (P5-T02): l'onboarding stesso,
// le impostazioni (utile anche in attesa di approvazione) e l'admin (che
// deve poter approvare le richieste altrui senza esserne bloccato).
const REPARTO_GATE_EXEMPT_PATHS = [
  "/onboarding-reparto",
  "/impostazioni",
  "/admin",
];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublicPath = PUBLIC_PATHS.some((path) =>
    request.nextUrl.pathname.startsWith(path),
  );

  if (!user && !isPublicPath) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    return NextResponse.redirect(redirectUrl);
  }

  if (user && !isPublicPath) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("stato_consenso_genitoriale, reparto_id")
      .eq("id", user.id)
      .single();

    const inAttesa = profile?.stato_consenso_genitoriale === "in_attesa";
    const isAttesaPath =
      request.nextUrl.pathname.startsWith("/attesa-consenso");

    if (inAttesa && !isAttesaPath) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/attesa-consenso";
      return NextResponse.redirect(redirectUrl);
    }

    const isRepartoGateExempt = REPARTO_GATE_EXEMPT_PATHS.some((path) =>
      request.nextUrl.pathname.startsWith(path),
    );

    if (!inAttesa && !profile?.reparto_id && !isRepartoGateExempt) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/onboarding-reparto";
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}
