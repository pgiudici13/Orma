import { expect, test } from "@playwright/test";
import {
  MAX_DRAW_CALLS,
  MAX_TEXTURE_MB,
  MAX_TRIANGLES,
  readPerf,
} from "./budget";

/**
 * Regressione sull'interazione con la scena 3D (sandbox di sviluppo, nessuna
 * credenziale richiesta).
 *
 * Copre le due cause per cui gli oggetti del tavolo non si riuscivano a
 * cliccare (vedi `.claude/CORRECTIONS.md`):
 *
 * 1. il wrapper `<Html>` di drei restava a `pointer-events: auto` e copriva ogni
 *    oggetto con un rettangolo opaco agli eventi;
 * 2. la camera risolveva l'oggetto a fuoco nel set dimostrativo e sollevava
 *    un'eccezione dentro `useFrame` sugli id delle carte reali.
 */

const SANDBOX = "/tavolo-dev";

test.describe("interazione con gli oggetti del tavolo", () => {
  test("il centro di ogni oggetto interattivo appartiene alla scena, non al DOM sovrapposto", async ({
    page,
  }) => {
    await page.goto(SANDBOX);
    await expect(page.locator('[data-table-mode="scene3d"]')).toBeVisible({
      timeout: 15_000,
    });

    const hotspots = page.locator("[data-scene-hotspot]:visible");
    // Gli hotspot compaiono al primo frame disegnato, non al mount: con WebGL
    // software la compilazione degli shader di scena può prendersi qualche
    // secondo prima che esistano.
    await expect
      .poll(() => hotspots.count(), { timeout: 15_000 })
      .toBeGreaterThan(0);

    for (const hotspot of await hotspots.all()) {
      const box = await hotspot.boundingBox();
      expect(box).not.toBeNull();

      const tagAtCenter = await page.evaluate(
        ([x, y]) => document.elementFromPoint(x, y)?.tagName ?? null,
        [box!.x + box!.width / 2, box!.y + box!.height / 2],
      );

      // Se qui compare DIV o BUTTON, il puntatore non arriva più al raycaster.
      expect(
        tagAtCenter,
        `id="${await hotspot.getAttribute("data-scene-hotspot")}"`,
      ).toBe("CANVAS");
    }
  });

  test("un click di mouse apre l'oggetto e la chiusura riporta al tavolo", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });

    await page.goto(SANDBOX);
    await expect(page.locator('[data-table-mode="scene3d"]')).toBeVisible({
      timeout: 15_000,
    });

    // Una carta di contenuto: ha un id derivato dai dati ("specialita:<slug>"),
    // il caso che faceva eccezione nel movimento di camera.
    const card = page.locator('[data-scene-hotspot^="specialita:"]:visible');
    await expect(card).toHaveCount(1, { timeout: 15_000 });

    const box = await card.boundingBox();
    await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);

    const panel = page.getByRole("dialog");
    await expect(panel).toBeVisible();
    await expect(
      panel.getByRole("heading", { name: "Nodi e Legature" }),
    ).toBeVisible();

    // La camera si muove per ~1s: se risolvesse male l'oggetto a fuoco,
    // l'eccezione arriverebbe in questa finestra, un frame dopo l'altro.
    await page.waitForTimeout(1200);

    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();

    expect(errors).toEqual([]);
  });

  test("ogni oggetto del tavolo apre la propria superficie", async ({
    page,
  }) => {
    // Tredici oggetti, ognuno con apertura, verifica e chiusura, su WebGL
    // renderizzato via software: il tempo di default non basta.
    test.setTimeout(90_000);

    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));

    await page.goto(SANDBOX);
    await expect(page.locator('[data-table-mode="scene3d"]')).toBeVisible({
      timeout: 15_000,
    });

    const hotspots = page.locator("[data-scene-hotspot]:visible");
    await expect
      .poll(() => hotspots.count(), { timeout: 15_000 })
      .toBeGreaterThan(8);

    const panel = page.getByRole("dialog");

    for (const hotspot of await hotspots.all()) {
      const id = await hotspot.getAttribute("data-scene-hotspot");

      const box = await hotspot.boundingBox();
      await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);

      // Il titolo del pannello è quello dell'oggetto: se il registro delle
      // superfici sbagliasse oggetto, si aprirebbe il contenuto di un altro.
      // Si guarda l'intestazione del pannello per identificativo, non per
      // testo: alcune superfici hanno titoli propri che conterrebbero la
      // stessa parola.
      const label = (await hotspot.getAttribute("aria-label")) ?? "";
      const title = label.split(": ").slice(1).join(": ");
      await expect(
        panel.locator(`[id="panel-title-${id}"]`),
        `oggetto "${id}"`,
      ).toHaveText(title, { timeout: 10_000 });

      await page.keyboard.press("Escape");
      await expect(panel).toBeHidden();
    }

    expect(errors).toEqual([]);
  });

  test("resta dentro il budget di performance dichiarato", async ({ page }) => {
    await page.goto(SANDBOX);
    await expect(page.locator('[data-table-mode="scene3d"]')).toBeVisible({
      timeout: 15_000,
    });

    const perf = await readPerf(page);

    expect(perf.calls).toBeLessThanOrEqual(MAX_DRAW_CALLS);
    expect(perf.triangles).toBeLessThanOrEqual(MAX_TRIANGLES);
    expect(perf.textureBytes / (1024 * 1024)).toBeLessThanOrEqual(
      MAX_TEXTURE_MB,
    );
  });

  test("anche gli oggetti piccoli si aprono con un click", async ({ page }) => {
    await page.goto(SANDBOX);
    await expect(page.locator('[data-table-mode="scene3d"]')).toBeVisible({
      timeout: 15_000,
    });

    // Il calendario è largo 26 cm e spesso 12 mm: prima del volume di presa
    // era interamente coperto dalla zona morta dell'hotspot.
    const calendario = page.locator(
      '[data-scene-hotspot="calendario"]:visible',
    );
    const box = await calendario.boundingBox();
    await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);

    await expect(page.getByRole("dialog")).toBeVisible();
  });
});
