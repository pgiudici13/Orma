import { expect, test } from "@playwright/test";
import { login, openHotspot } from "./helpers";

/**
 * Flussi 4 e 5 di P11-T01 (Capo di Reparto): Squadriglie (crea, rinomina,
 * elimina) e Calendario (crea, modifica, elimina evento).
 *
 * `/reparto` è ormai solo un deep-link alla cassetta (RD-T06): non esiste più
 * una vista Squadriglie/Calendario separata a pagina piena, quindi la verifica
 * "anche in /reparto" del piano originale (P11-T01) non si applica più
 * all'architettura attuale — si verifica solo sull'oggetto del tavolo
 * corrispondente (guidone, calendario), che è l'unica superficie reale.
 *
 * Selettori per ruolo/testo, senza scoping via `filter({ hasText })` su
 * contenitori generici: titolo e bottoni di una card sono fratelli nel DOM
 * (non l'uno discendente dell'altro), quindi quel pattern risolve in modo
 * ambiguo o instabile quando la pagina ha una scena 3D che si ridisegna in
 * continuo. Con un solo elemento creato dal test alla volta, `.first()` su
 * un locator per ruolo è sufficiente e molto più robusto.
 */

const email = process.env.E2E_CAPO_EMAIL;
const password = process.env.E2E_CAPO_PASSWORD;
const hasCredentials = Boolean(email && password);

test.describe("Reparto — Squadriglie e Calendario (Capo)", () => {
  test.skip(!hasCredentials, "Servono E2E_CAPO_EMAIL e E2E_CAPO_PASSWORD");

  test("crea, rinomina e poi elimina una Squadriglia", async ({ page }) => {
    test.setTimeout(60_000);
    await login(page, email!, password!);
    await page.waitForURL(/\/($|\?)/, { timeout: 15_000 });

    const panel = await openHotspot(page, "guidone");
    const nome = `QA Sq. ${Date.now()}`;

    await panel.getByRole("button", { name: "+ Nuova Squadriglia" }).click();
    await panel.getByPlaceholder("Nome Squadriglia").fill(nome);
    await panel.getByRole("button", { name: "Crea" }).click();
    await expect(
      panel.getByRole("heading", { name: `Sq. ${nome}`, exact: true }),
    ).toBeVisible({ timeout: 10_000 });

    // Rinomina.
    const nomeRinominato = `${nome} bis`;
    await panel.getByRole("button", { name: "Rinomina" }).first().click();
    await panel.locator('input[name="nome"]').first().fill(nomeRinominato);
    await panel.getByRole("button", { name: "Salva" }).first().click();
    await expect(
      panel.getByRole("heading", {
        name: `Sq. ${nomeRinominato}`,
        exact: true,
      }),
    ).toBeVisible({ timeout: 10_000 });

    // Elimina (confirm nativo).
    page.once("dialog", (dialog) => dialog.accept());
    await panel.getByRole("button", { name: "Elimina" }).first().click();
    await expect(
      panel.getByRole("heading", {
        name: `Sq. ${nomeRinominato}`,
        exact: true,
      }),
    ).toBeHidden({ timeout: 10_000 });

    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
  });

  test("crea, modifica ed elimina un evento di calendario", async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await login(page, email!, password!);
    await page.waitForURL(/\/($|\?)/, { timeout: 15_000 });

    const panel = await openHotspot(page, "calendario");
    const titolo = `QA Uscita ${Date.now()}`;

    await panel.getByRole("button", { name: "+ Nuovo Evento" }).click();
    await panel.getByLabel("Titolo evento *").fill(titolo);
    await panel.getByLabel("Data inizio *").fill("2027-06-01");
    await panel.getByRole("button", { name: "Salva evento" }).click();
    await expect(
      panel.getByRole("heading", { name: titolo, exact: true }),
    ).toBeVisible({ timeout: 10_000 });

    // Modifica.
    await panel.getByRole("button", { name: "Modifica" }).first().click();
    const titoloModificato = `${titolo} (modificata)`;
    await panel.getByLabel("Titolo").first().fill(titoloModificato);
    await panel
      .getByRole("button", { name: "Salva modifiche" })
      .first()
      .click();
    await expect(
      panel.getByRole("heading", { name: titoloModificato, exact: true }),
    ).toBeVisible({ timeout: 10_000 });

    // Elimina (confirm nativo).
    page.once("dialog", (dialog) => dialog.accept());
    await panel.getByRole("button", { name: "Elimina" }).first().click();
    await expect(
      panel.getByRole("heading", { name: titoloModificato, exact: true }),
    ).toBeHidden({ timeout: 10_000 });

    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
  });
});
