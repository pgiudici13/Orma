import { expect, test } from "@playwright/test";
import {
  adminClient,
  hasRoleCredentials,
  login,
  logout,
  openHotspot,
} from "./helpers";

/**
 * Flussi 2, 3 e 8 di P11-T01: registrazione (adulto e minorenne),
 * onboarding Reparto (richiesta → approvazione) e gate admin.
 *
 * La conferma email di Supabase Auth non è testabile senza una casella di
 * posta reale: dopo la registrazione via UI, il test marca l'email come
 * confermata via client admin (service role) — equivalente a "click sul
 * link di conferma", stesso principio già usato per il consenso genitoriale
 * qui sotto (letto il token dal database invece che da un'email reale).
 */

const TEST_REPARTO_ID = "f1b84ef3-2bed-4919-b63d-96da77178343"; // "test"

function emailUnica(prefisso: string) {
  // Non ormaqa.test: la validazione email di Supabase Auth in fase di
  // registrazione pubblica (signUp) rifiuta quel dominio come non valido —
  // a differenza dell'API admin (usata per gli account di test già
  // esistenti), che non applica lo stesso controllo.
  return `${prefisso}-${Date.now()}@example.com`;
}

async function confermaEmail(email: string) {
  const admin = adminClient();
  const { data } = await admin.auth.admin.listUsers({ perPage: 200 });
  const utente = data.users.find((u) => u.email === email);
  if (!utente)
    throw new Error(`Utente ${email} non trovato dopo la registrazione`);
  await admin.auth.admin.updateUserById(utente.id, { email_confirm: true });
  return utente.id;
}

test.describe("Registrazione, onboarding Reparto e admin", () => {
  test.skip(
    !hasRoleCredentials,
    "Servono SUPABASE_SECRET_KEY, E2E_CAPO_*, E2E_ADMIN_*",
  );

  test("registrazione adulto → onboarding Reparto → approvazione del Capo", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    const email = emailUnica("qa-adulto");
    const password = "PasswordTest123!";

    await page.goto("/registrati");
    await page.getByLabel("Nome").fill("QA Adulto Journey");
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByLabel("Data di nascita").fill("1990-01-01");
    await page.getByLabel(/Ho letto e accetto/).check();
    await page.getByRole("button", { name: "Registrati" }).click();

    await expect(
      page.getByRole("heading", { name: "Controlla la tua email" }),
    ).toBeVisible({ timeout: 15_000 });

    await confermaEmail(email);

    await login(page, email, password);
    // Nessun Reparto: il gate porta a /onboarding-reparto (busta già aperta).
    await page.waitForURL(/\/onboarding-reparto$/, { timeout: 15_000 });
    const busta = page.getByRole("dialog");
    await expect(busta).toBeVisible();
    await expect(busta.getByText("Apro la busta…")).toBeHidden({
      timeout: 10_000,
    });

    await busta.getByLabel("Reparto").selectOption({ value: TEST_REPARTO_ID });
    await busta.getByRole("button", { name: "Richiedi associazione" }).click();
    await expect(
      busta.getByRole("button", { name: "Richiedi associazione" }),
    ).toBeHidden({ timeout: 10_000 });

    // Il Capo approva dalla cassetta di Reparto.
    await logout(page);

    await login(
      page,
      process.env.E2E_CAPO_EMAIL!,
      process.env.E2E_CAPO_PASSWORD!,
    );
    await page.waitForURL(/\/($|\?)/, { timeout: 15_000 });

    const panelCapo = await openHotspot(page, "cassetta-reparto");
    await expect(
      panelCapo.getByText("Apro la cassetta di Reparto…"),
    ).toBeHidden({ timeout: 10_000 });

    const richiesta = panelCapo
      .locator("li")
      .filter({ hasText: "QA Adulto Journey" });
    await expect(richiesta).toBeVisible({ timeout: 10_000 });
    await richiesta.getByRole("button", { name: "Approva" }).click();
    await expect(richiesta).toBeHidden({ timeout: 10_000 });

    await page.keyboard.press("Escape");
    await logout(page);

    // Il nuovo utente ora accede al tavolo con gli oggetti di Reparto.
    await login(page, email, password);
    await page.waitForURL(/\/($|\?)/, { timeout: 15_000 });
    await expect(
      page.locator('[data-scene-hotspot="cassetta-reparto"]:visible'),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("registrazione minorenne → consenso genitoriale → sblocco", async ({
    page,
  }) => {
    test.setTimeout(60_000);
    const email = emailUnica("qa-minore");
    const emailGenitore = "qa-parent@example.com";
    const password = "PasswordTest123!";

    await page.goto("/registrati");
    await page.getByLabel("Nome").fill("QA Minorenne Journey");
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByLabel("Data di nascita").fill("2018-01-01"); // ~8 anni
    await page.getByLabel(/Email di un genitore\/tutore/).fill(emailGenitore);
    await page.getByLabel(/Ho letto e accetto/).check();
    await page.getByRole("button", { name: "Registrati" }).click();

    await expect(
      page.getByRole("heading", { name: "Account in attesa di conferma" }),
    ).toBeVisible({ timeout: 15_000 });

    const userId = await confermaEmail(email);

    const admin = adminClient();
    const { data: profilo } = await admin
      .from("profiles")
      .select("consenso_genitoriale_token, stato_consenso_genitoriale")
      .eq("id", userId)
      .single();
    expect(profilo?.stato_consenso_genitoriale).toBe("in_attesa");
    const token = profilo?.consenso_genitoriale_token;
    expect(token).toBeTruthy();

    await page.goto(`/consenso/${token}`);
    await page.getByLabel(/Dichiaro di essere il genitore/).check();
    await page.getByRole("button", { name: "Confermo il consenso" }).click();
    await expect(
      page.getByText("Grazie, il consenso è stato registrato."),
    ).toBeVisible({ timeout: 10_000 });

    // Sbloccato: login ora porta all'onboarding Reparto, non più a /attesa-consenso.
    await login(page, email, password);
    await page.waitForURL(/\/onboarding-reparto$/, { timeout: 15_000 });
  });

  test("un non-admin/non-Capo non può vedere /admin", async ({ page }) => {
    await login(
      page,
      process.env.RLS_TEST_USER_A_EMAIL!,
      process.env.RLS_TEST_USER_A_PASSWORD!,
    );
    await page.waitForURL(/\/($|\?)/, { timeout: 15_000 });

    await page.goto("/admin");
    await page.waitForURL(/\/($|\?)/, { timeout: 10_000 });
  });

  test("l'admin decide una richiesta Reparto da /admin/richieste-reparto", async ({
    page,
  }) => {
    test.setTimeout(60_000);
    const email = emailUnica("qa-richiedente");
    const password = "PasswordTest123!";

    // Crea un utente e una richiesta pendente direttamente via admin client:
    // questo test verifica la decisione admin, non di nuovo la registrazione.
    const admin = adminClient();
    const { data: created } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    await admin.from("profiles").insert({
      id: created.user!.id,
      nome: "QA Richiedente Admin",
      data_nascita: "1990-01-01",
      consenso_privacy_accettato_at: new Date(0).toISOString(),
      privacy_policy_versione: "qa-setup",
      stato_consenso_genitoriale: "non_richiesto",
    });
    await admin
      .from("richiesta_reparto")
      .insert({ profile_id: created.user!.id, reparto_id: TEST_REPARTO_ID });

    await login(
      page,
      process.env.E2E_ADMIN_EMAIL!,
      process.env.E2E_ADMIN_PASSWORD!,
    );
    await page.waitForURL(/\/($|\?)/, { timeout: 15_000 });

    await page.goto("/admin/richieste-reparto");
    const riga = page.locator("li").filter({ hasText: "QA Richiedente Admin" });
    await expect(riga).toBeVisible({ timeout: 10_000 });
    await riga.getByRole("button", { name: "Approva" }).click();
    await expect(riga).toBeHidden({ timeout: 10_000 });
  });
});
