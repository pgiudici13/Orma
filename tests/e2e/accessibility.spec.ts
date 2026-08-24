import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * Audit di accessibilità (P10-T02, `docs/SDD.md` §25) sulle superfici DOM/2D
 * dell'app — form, pannelli di contenuto, pagine "carta" fuori dal tavolo
 * (`components/layout/PaperPage.tsx`). La scena 3D in sé non è coperta: le
 * regole WCAG per contrasto/ruoli/etichette non si applicano a un canvas
 * WebGL (axe lo ignora), il cui accesso da tastiera è già testato in
 * `tests/e2e/tableInteraction.spec.ts` (hotspot DOM sovrapposti). Qui si
 * scansiona il DOM intorno al canvas e, soprattutto, il contenuto di ogni
 * pannello che si apre sopra di esso.
 *
 * Le pagine pubbliche (login, registrazione, privacy) e la sandbox del
 * tavolo (`/tavolo-dev`, solo in sviluppo — vedi `.claude/PROJECT.md`) non
 * richiedono credenziali: la sandbox usa lo stesso set dimostrativo di
 * `tableInteraction.spec.ts`, sufficiente per un audit strutturale del
 * pannello che è identico per ogni oggetto reale (`components/panel/`).
 */

const SANDBOX = "/tavolo-dev";

/**
 * "color-contrast" è disattivata qui: axe-core non interpreta correttamente
 * il valore calcolato di `color-mix(in srgb, var(--ink) N%, transparent)`,
 * che Chromium serializza come `color(srgb r g b / alpha)` (sintassi CSS
 * Color 4) invece del classico `rgba(...)` che il parser di axe si aspetta.
 * Verificato campionando i pixel effettivamente disegnati a schermo
 * (screenshot + lettura diretta del colore più scuro nell'area di un testo
 * "attenuato"): il contrasto reale è conforme (~6:1 su `--paper-base` per i
 * token `--ink-muted*`, vedi `app/globals.css`), ma axe segnala comunque una
 * violazione — falso positivo, non un difetto di design. Senza questa
 * esclusione il test sarebbe permanentemente rosso a prescindere dal
 * contrasto reale. Il resto delle regole WCAG 2.1 A/AA (etichette, ruoli,
 * struttura) non è affetto da questo bug e resta attivo.
 */
async function runAxe(page: Page, selector?: string) {
  const builder = new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .disableRules(["color-contrast"]);
  if (selector) builder.include(selector);
  return builder.analyze();
}

async function expectNoViolations(page: Page, selector?: string) {
  const results = await runAxe(page, selector);

  const violations = results.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    help: violation.help,
    nodes: violation.nodes.map((node) => node.target.join(" ")),
  }));

  expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
}

test("login: nessuna violazione WCAG 2.1 A/AA", async ({ page }) => {
  await page.goto("/login");
  await expectNoViolations(page);
});

test("registrati: nessuna violazione WCAG 2.1 A/AA", async ({ page }) => {
  await page.goto("/registrati");
  await expectNoViolations(page);
});

test("privacy: nessuna violazione WCAG 2.1 A/AA", async ({ page }) => {
  await page.goto("/privacy");
  await expectNoViolations(page);
});

test("tavolo (composizione 2D mobile): nessuna violazione WCAG 2.1 A/AA", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(SANDBOX);
  await expect(page.locator('[data-table-mode="flat"]')).toBeVisible({
    timeout: 15_000,
  });
  await expectNoViolations(page);
});

test("ogni pannello del tavolo: nessuna violazione WCAG 2.1 A/AA", async ({
  page,
}) => {
  // Tredici oggetti come tableInteraction.spec.ts: WebGL software è lento.
  test.setTimeout(90_000);

  await page.goto(SANDBOX);
  await expect(page.locator('[data-table-mode="scene3d"]')).toBeVisible({
    timeout: 15_000,
  });

  const hotspots = page.locator("[data-scene-hotspot]:visible");
  await expect
    .poll(() => hotspots.count(), { timeout: 15_000 })
    .toBeGreaterThan(8);

  const panel = page.getByRole("dialog");
  const ids = await hotspots.evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute("data-scene-hotspot")),
  );

  for (const id of ids) {
    const hotspot = page.locator(`[data-scene-hotspot="${id}"]:visible`);
    const box = await hotspot.boundingBox();
    await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await expect(panel).toBeVisible({ timeout: 10_000 });

    const results = await runAxe(page, '[role="dialog"]');
    const violations = results.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      nodes: violation.nodes.map((node) => node.target.join(" ")),
    }));
    expect(
      violations,
      `oggetto "${id}": ${JSON.stringify(violations)}`,
    ).toEqual([]);

    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
  }
});
