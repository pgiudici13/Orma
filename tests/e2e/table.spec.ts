import { expect, test, type Page } from "@playwright/test";

/**
 * Smoke end-to-end del tavolo.
 *
 * Il primo test non richiede credenziali. Quelli autenticati usano un account
 * di prova passato via ambiente (`E2E_EMAIL` / `E2E_PASSWORD`): senza quelle
 * variabili vengono saltati, così la suite resta eseguibile da chiunque senza
 * segreti nel repository.
 */

import {
  MAX_DRAW_CALLS,
  MAX_TEXTURE_MB,
  MAX_TRIANGLES,
  readPerf,
} from "./budget";

const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;
const hasCredentials = Boolean(email && password);

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email!);
  await page.getByLabel("Password").fill(password!);
  await page.getByRole("button", { name: "Accedi" }).click();
  await page.waitForURL("/");
}

test("la Home non autenticata porta al login", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
});

test.describe("tavolo autenticato", () => {
  test.skip(
    !hasCredentials,
    "Servono E2E_EMAIL e E2E_PASSWORD per il flusso autenticato",
  );

  test("mostra la scena 3D entro il budget di performance", async ({
    page,
  }) => {
    await login(page);

    const canvas = page.locator("canvas");
    await expect(canvas).toBeVisible();

    // Il renderer ha davvero configurato il canvas (non resta 300x150).
    await expect
      .poll(() => canvas.evaluate((node: HTMLCanvasElement) => node.width), {
        timeout: 15_000,
      })
      .toBeGreaterThan(600);

    const snapshot = await readPerf(page);

    expect(snapshot.calls).toBeLessThanOrEqual(MAX_DRAW_CALLS);
    expect(snapshot.triangles).toBeLessThanOrEqual(MAX_TRIANGLES);
    expect(snapshot.textureBytes / (1024 * 1024)).toBeLessThanOrEqual(
      MAX_TEXTURE_MB,
    );
  });

  test("apre una carta e torna al tavolo", async ({ page }) => {
    await login(page);

    // Attende che la scena 3D sia la resa attiva: prima del mount la pagina
    // mostra la composizione 2D, che ha hotspot con lo stesso identificativo.
    await expect(page.locator('[data-table-mode="scene3d"]')).toBeVisible({
      timeout: 15_000,
    });

    // Dalla Fase 3 le carte di contenuto vengono da Supabase (P3-T04): l'id
    // dell'hotspot è dinamico ("specialita:<slug>", ecc.), non più fisso.
    // Il test verifica il pattern di interazione, non un contenuto specifico
    // — richiede che l'utente di prova abbia almeno una Specialità/Competenza/
    // Tappa con progresso attivo, altrimenti si salta.
    const hotspot = page
      .locator(
        '[data-scene-hotspot^="specialita:"]:visible, [data-scene-hotspot^="competenza:"]:visible, [data-scene-hotspot^="tappa:"]:visible',
      )
      .first();
    const hasContentCard = (await hotspot.count()) > 0;
    test.skip(
      !hasContentCard,
      "L'utente di prova non ha nessuna Specialità/Competenza/Tappa con progresso attivo",
    );

    const title = await hotspot.getAttribute("aria-label");
    await hotspot.focus();
    await page.keyboard.press("Enter");

    const panel = page.getByRole("dialog");
    await expect(panel).toBeVisible();
    if (title) {
      // aria-label è "Apri <famiglia>: <titolo>": il titolo compare anche
      // nell'intestazione del pannello.
      const cardTitle = title.split(": ").slice(1).join(": ");
      await expect(
        panel.getByRole("heading", { name: cardTitle }),
      ).toBeVisible();
    }

    // Sezioni nell'ordine prescritto da docs/UX.md.
    await expect(panel.getByRole("heading", { level: 3 })).toHaveText([
      "Contenuto ufficiale",
      "Progresso",
      "Note personali",
      "Maestro",
    ]);

    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();

    // Il focus torna sull'oggetto da cui si era partiti.
    await expect(hotspot).toBeFocused();
  });

  test("su viewport mobile usa la composizione 2D", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await login(page);

    await expect(page.locator('[data-table-mode="flat"]')).toBeVisible();
    await expect(page.locator("canvas")).toHaveCount(0);
    // Taccuino è sempre presente (oggetto decorativo/di navigazione fisso),
    // a differenza delle carte di contenuto che dipendono dai dati dell'utente.
    await expect(
      page.getByRole("button", { name: /Taccuino/i }).first(),
    ).toBeVisible();
  });
});
