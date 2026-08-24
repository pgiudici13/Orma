import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";

/**
 * Client Supabase per Server Component/route handler. Wrappato in `cache()`:
 * più chiamate nello stesso render tree (es. `getTableContext` che richiama
 * `getTableCards`) riusano la stessa istanza invece di ricrearla, evitando
 * round-trip ridondanti verso Supabase Auth.
 */
export const createClient = cache(async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll chiamato da un Server Component: ignorato, la sessione
            // viene comunque aggiornata dal middleware.
          }
        },
      },
    },
  );
});

/**
 * Utente autenticato, dedotto una sola volta per render tree. `auth.getUser()`
 * fa sempre un round-trip di rete per validare il JWT: cache-ando il risultato
 * si evita di richiamarlo più volte per la stessa richiesta (es. da
 * `getTableContext` e `getTableCards`).
 */
export const getCachedUser = cache(async () => {
  const supabase = await createClient();
  return supabase.auth.getUser();
});
