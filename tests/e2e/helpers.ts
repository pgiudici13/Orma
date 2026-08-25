import { createClient } from "@supabase/supabase-js";
import type { Page } from "@playwright/test";

/**
 * Helper condivisi dai test E2E di Fase 11 (P11-T01) che vanno oltre lo smoke
 * test del tavolo: registrazione, onboarding Reparto, ruoli Capo/admin.
 *
 * Autocontenuti (nessun import da `@/lib/...`), stesso principio delle
 * altre suite E2E/RLS del progetto — niente dipendenza dalla risoluzione
 * degli alias del bundler dell'app, che Playwright non condivide con Next.js.
 */

/** Client con la secret key Supabase, solo per queste suite di test. */
export function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY mancanti: servono per i test E2E di registrazione/onboarding.",
    );
  }
  return createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Accedi" }).click();
}

export async function logout(page: Page) {
  await page.goto("/impostazioni");
  const panel = page.getByRole("dialog");
  await panel.waitFor({ state: "visible", timeout: 10_000 });
  // La sezione Maestro carica i propri dati in modo asincrono: senza questa
  // attesa il pannello si ridisegna sotto al click e il bottone "Esci"
  // (fuori da quella sezione, ma nello stesso pannello) risulta staccato dal
  // DOM a metà del gesto.
  await panel.getByText("Leggo la sezione…").waitFor({
    state: "hidden",
    timeout: 10_000,
  });
  await page.getByRole("button", { name: "Esci" }).click();
  await page.waitForURL(/\/login$/);
}

/** Apre un oggetto del tavolo reale (non /tavolo-dev) da tastiera. */
export async function openHotspot(page: Page, hotspotId: string) {
  const hotspot = page.locator(`[data-scene-hotspot="${hotspotId}"]:visible`);
  await hotspot.waitFor({ timeout: 15_000 });
  await hotspot.focus();
  await page.keyboard.press("Enter");
  const panel = page.getByRole("dialog");
  await panel.waitFor({ state: "visible", timeout: 10_000 });
  return panel;
}

const requiredE2eEnv = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SECRET_KEY",
  "E2E_CAPO_EMAIL",
  "E2E_CAPO_PASSWORD",
  "E2E_ADMIN_EMAIL",
  "E2E_ADMIN_PASSWORD",
  "RLS_TEST_USER_A_EMAIL",
  "RLS_TEST_USER_A_PASSWORD",
] as const;

export const hasRoleCredentials = requiredE2eEnv.every(
  (key) => !!process.env[key],
);
