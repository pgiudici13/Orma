"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { inviaEmailConsensoGenitoriale } from "@/lib/resend";
import {
  PRIVACY_POLICY_VERSIONE,
  TOKEN_CONSENSO_VALIDITA_GIORNI,
  richiedeConsensoGenitoriale,
} from "@/lib/consent";

export type RegistratiState = { error: string } | null;

export async function registrati(
  _prevState: RegistratiState,
  formData: FormData,
): Promise<RegistratiState> {
  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const dataNascitaStr = String(formData.get("dataNascita") ?? "");
  const genitoreEmail = String(formData.get("genitoreEmail") ?? "").trim();
  const accettaPrivacy = formData.get("accettaPrivacy") === "on";

  if (!nome || !email || !password || !dataNascitaStr) {
    return { error: "Compila tutti i campi obbligatori." };
  }

  if (!accettaPrivacy) {
    return { error: "Devi accettare l'Informativa Privacy per registrarti." };
  }

  const dataNascita = new Date(dataNascitaStr);
  if (Number.isNaN(dataNascita.getTime())) {
    return { error: "Data di nascita non valida." };
  }

  const serveConsenso = richiedeConsensoGenitoriale(dataNascita);
  if (serveConsenso && !genitoreEmail) {
    return {
      error:
        "Inserisci l'email di un genitore/tutore: è richiesta sotto i 14 anni.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error || !data.user) {
    return { error: error?.message ?? "Registrazione non riuscita." };
  }

  const admin = createAdminClient();
  const consensoToken = serveConsenso ? randomUUID() : null;
  const tokenScadeAt = serveConsenso
    ? new Date(
        Date.now() + TOKEN_CONSENSO_VALIDITA_GIORNI * 24 * 60 * 60 * 1000,
      ).toISOString()
    : null;

  const { error: profileError } = await admin.from("profiles").insert({
    id: data.user.id,
    nome,
    data_nascita: dataNascitaStr,
    consenso_privacy_accettato_at: new Date().toISOString(),
    privacy_policy_versione: PRIVACY_POLICY_VERSIONE,
    stato_consenso_genitoriale: serveConsenso ? "in_attesa" : "non_richiesto",
    genitore_email: serveConsenso ? genitoreEmail : null,
    consenso_genitoriale_token: consensoToken,
    consenso_genitoriale_token_scade_at: tokenScadeAt,
  });

  if (profileError) {
    // Compensazione best-effort: elimina l'utente Auth orfano appena creato
    // così l'email torna libera per un nuovo tentativo di registrazione.
    await admin.auth.admin.deleteUser(data.user.id).catch(() => {});
    return { error: "Registrazione non riuscita. Riprova." };
  }

  if (serveConsenso && consensoToken) {
    const confirmUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/consenso/${consensoToken}`;
    try {
      await inviaEmailConsensoGenitoriale({
        genitoreEmail,
        nomeMinore: nome,
        confirmUrl,
      });
    } catch {
      // Il profilo con stato "in_attesa" e il token sono già salvati: un
      // errore del servizio email non deve bloccare il redirect alla pagina
      // di attesa (nessun logging esterno esiste nel progetto).
    }
    redirect("/attesa-consenso");
  }

  redirect("/registrati/controlla-email");
}
