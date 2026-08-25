"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";

export type LoginState = { error: string } | null;

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Inserisci email e password." };
  }

  const ip = await clientIp();
  const [entroLimiteIp, entroLimiteCoppia] = await Promise.all([
    checkRateLimit(`login:ip:${ip}`, 30, 15),
    checkRateLimit(`login:ip-email:${ip}:${email.toLowerCase()}`, 8, 15),
  ]);
  if (!entroLimiteIp || !entroLimiteCoppia) {
    return { error: "Troppi tentativi. Riprova tra qualche minuto." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (error.code === "email_not_confirmed") {
      return { error: "Conferma prima la tua email: controlla la posta." };
    }
    return { error: "Credenziali non valide." };
  }

  redirect("/");
}
