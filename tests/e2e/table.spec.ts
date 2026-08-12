import { expect, test, type Page } from "@playwright/test";

/**
 * Smoke end-to-end del tavolo.
 *
 * Il primo test non richiede credenziali. Quelli autenticati usano un account
 * di prova passato via ambiente (`E2E_EMAIL` / `E2E_PASSWORD`): senza quelle
 * variabili vengono saltati, così la suite resta eseguibile da chiunque senza
 * segreti nel repository.
 */

const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;
const hasCredentials = Boolean(email && password);

/** Soglie dichiarate in docs/SDD.md §10. */
const MAX_DRAW_CALLS = 25;
const MAX_TEXTURE_MB = 12;

type PerfSnapshot = {
  calls: number;
  triangles: number;
  textures: number;
  textureBytes: number;
};

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

    const perf = await page.waitForFunction(
      () => (window as unknown as { __ormaPerf?: PerfSnapshot }).__ormaPerf,
      undefined,
      { timeout: 15_000 },
    );
    const snapshot = (await perf.jsonValue()) as PerfSnapshot;

    expect(snapshot.calls).toBeLessThanOrEqual(MAX_DRAW_CALLS);
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

    const hotspot = page
      .locator('[data-scene-hotspot="specialita-nodi"]:visible')
      .first();
    await expect(hotspot).toBeAttached({ timeout: 15_000 });
    await hotspot.focus();
    await page.keyboard.press("Enter");

    const panel = page.getByRole("dialog");
    await expect(panel).toBeVisible();
    await expect(
      panel.getByRole("heading", { name: "Nodi e Legature" }),
    ).toBeVisible();

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
    await expect(
      page.getByRole("button", { name: /Nodi e Legature/i }).first(),
    ).toBeVisible();
  });
});
