import { expect, test } from "@playwright/test";
import { login, openHotspot } from "./helpers";

/**
 * Flusso 6 di P11-T01 (Capo di Reparto): Archivio — crea luogo/uscita,
 * associa un partecipante, carica una fotografia, elimina con conferma.
 */

const email = process.env.E2E_CAPO_EMAIL;
const password = process.env.E2E_CAPO_PASSWORD;
const hasCredentials = Boolean(email && password);

// PNG 1x1 minimo valido, per non dipendere da un file su disco.
const PIXEL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

test.describe("Archivio di Reparto (Capo)", () => {
  test.skip(!hasCredentials, "Servono E2E_CAPO_EMAIL e E2E_CAPO_PASSWORD");

  test("crea un luogo, un'uscita con partecipanti, carica una foto ed elimina tutto", async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await login(page, email!, password!);
    await page.waitForURL(/\/($|\?)/, { timeout: 15_000 });

    const panel = await openHotspot(page, "baule-archivio");
    const nomeLuogo = `QA Luogo ${Date.now()}`;
    const titoloUscita = `QA Uscita archivio ${Date.now()}`;

    // Luogo.
    await panel.getByRole("button", { name: "Aggiungi un luogo" }).click();
    await panel.getByPlaceholder("Nome del luogo").fill(nomeLuogo);
    await panel.getByRole("button", { name: "Salva luogo" }).click();
    await expect(panel.getByText(nomeLuogo)).toBeVisible({ timeout: 10_000 });

    // Uscita, collegata al luogo appena creato.
    await panel.getByRole("button", { name: "Aggiungi un'uscita" }).click();
    await panel.getByLabel("Titolo").fill(titoloUscita);
    await panel.getByLabel("Data").fill("2027-07-10");
    await panel.getByLabel("Luogo").selectOption({ label: nomeLuogo });
    await panel.getByRole("button", { name: "Salva" }).click();

    await panel.getByRole("button", { name: titoloUscita }).click();
    await expect(
      panel.getByRole("heading", { name: "Uscita", exact: true }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(panel.getByText(nomeLuogo)).toBeVisible();

    // Fotografia.
    await panel.locator('input[type="file"]').setInputFiles({
      name: "qa-test.png",
      mimeType: "image/png",
      buffer: PIXEL_PNG,
    });
    await panel.getByRole("button", { name: "Carica" }).click();
    await expect(panel.getByText("qa-test.png")).toBeVisible({
      timeout: 15_000,
    });

    // Elimina la fotografia (confirm nativo). Il bottone "Elimina" a livello
    // di uscita precede nel DOM quello della singola fotografia (entrambi
    // coesistono nella stessa vista): si individua quello che segue il nome
    // del file, non il primo "Elimina" della pagina.
    const eliminaFoto = panel
      .getByText("qa-test.png")
      .locator("xpath=following::button[normalize-space(.)='Elimina'][1]");
    page.once("dialog", (dialog) => dialog.accept());
    await eliminaFoto.click();
    await expect(panel.getByText("qa-test.png")).toBeHidden({
      timeout: 10_000,
    });

    // Elimina l'uscita: ora è rimasto un solo bottone "Elimina" nel pannello.
    page.once("dialog", (dialog) => dialog.accept());
    await panel.getByRole("button", { name: "Elimina" }).first().click();
    await expect(panel.getByText(titoloUscita)).toBeHidden({
      timeout: 10_000,
    });

    const luogoRow = panel.locator("li").filter({ hasText: nomeLuogo });
    page.once("dialog", (dialog) => dialog.accept());
    await luogoRow.getByRole("button", { name: "Elimina" }).click();
    await expect(panel.getByText(nomeLuogo)).toBeHidden({ timeout: 10_000 });

    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
  });
});
