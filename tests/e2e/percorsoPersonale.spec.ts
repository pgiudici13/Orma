import { expect, test } from "@playwright/test";
import { login, openHotspot } from "./helpers";

/**
 * Flusso 1 di P11-T01 (E/G): login → tavolo → avvia Specialità/Competenza →
 * apri carta → segna completata → nota (crea/modifica/elimina) → associa
 * Maestro (interno via email, esterno via form) → chiusura.
 *
 * Richiede E2E_EMAIL/PASSWORD (qa-eg-a) e, per l'associazione del Maestro
 * interno, un secondo utente ORMA reale la cui email sia nota: usa
 * E2E_MAESTRO_INTERNO_EMAIL se impostata, altrimenti si salta solo quel
 * passo (il resto del flusso resta verificato).
 */

const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;
const maestroInternoEmail = process.env.RLS_TEST_USER_B_EMAIL;
const hasCredentials = Boolean(email && password);

test.describe("percorso personale (E/G)", () => {
  test.skip(!hasCredentials, "Servono E2E_EMAIL e E2E_PASSWORD");

  test("avvia una Specialità, la completa, gestisce note e Maestro interno", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await login(page, email!, password!);
    await page.waitForURL(/\/($|\?)/, { timeout: 15_000 });

    // Apre l'album e avvia la prima Specialità disponibile (idempotente: se
    // già avviata da un run precedente, il bottone non c'è più — si salta).
    // Il catalogo carica i dati in modo asincrono dopo l'apertura del
    // pannello: si attende lo stato di caricamento prima di decidere.
    let panel = await openHotspot(page, "album-specialita");
    await expect(panel.getByText("Sfoglio l'album dei distintivi…")).toBeHidden(
      { timeout: 10_000 },
    );
    // Il catalogo ha decine di voci: `.first()` dopo un reload trova sempre
    // *un* bottone "Avvia il percorso" (le altre voci non toccate), quindi si
    // verifica lo specifico elemento del catalogo scelto (per nome), non "il
    // primo bottone qualunque esso sia in quel momento".
    const primaVoceNonAvviata = panel
      .locator("li")
      .filter({ hasText: "Avvia il percorso" })
      .first();
    if (await primaVoceNonAvviata.count()) {
      const nomeVoce = await primaVoceNonAvviata
        .locator("span")
        .first()
        .innerText();
      await primaVoceNonAvviata
        .getByRole("button", { name: "Avvia il percorso" })
        .click();
      const voceScelta = panel.locator("li").filter({ hasText: nomeVoce });
      await expect(
        voceScelta.getByRole("button", { name: "Avvia il percorso" }),
      ).toBeHidden({ timeout: 10_000 });
    }
    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();

    // La Specialità avviata compare come carta reale sul tavolo solo dopo un
    // caricamento fresco (gli oggetti scena vengono dal Server Component).
    await page.reload();
    await expect(page.locator('[data-table-mode="scene3d"]')).toBeVisible({
      timeout: 15_000,
    });

    const card = page
      .locator('[data-scene-hotspot^="specialita:"]:visible')
      .first();
    await expect(card).toBeVisible({ timeout: 15_000 });
    await card.focus();
    await page.keyboard.press("Enter");

    panel = page.getByRole("dialog");
    await expect(panel).toBeVisible();
    await expect(panel.getByRole("heading", { level: 3 })).toHaveText([
      "Contenuto ufficiale",
      "Progresso",
      "Note personali",
      "Maestro",
    ]);

    // Segna come completata (idempotente: se già completata, il bottone non c'è).
    const completaBottone = panel.getByRole("button", {
      name: "Segna come completata",
    });
    if (await completaBottone.isVisible().catch(() => false)) {
      await completaBottone.click();
      await expect(completaBottone).toBeHidden({ timeout: 10_000 });
      await expect(panel.getByText("Completata")).toBeVisible({
        timeout: 10_000,
      });
    }

    // Nota: crea, modifica, elimina.
    const testoNota = `Nota di test P11-T01 ${Date.now()}`;
    await panel.getByLabel("Aggiungi una nota").fill(testoNota);
    await panel.getByRole("button", { name: "Salva nota" }).click();
    await expect(panel.getByText(testoNota)).toBeVisible({ timeout: 10_000 });

    const testoModificato = `${testoNota} — modificata`;
    const notaTextarea = panel.getByLabel("Modifica nota").first();
    await notaTextarea.fill(testoModificato);
    await panel
      .getByRole("button", { name: "Salva modifiche" })
      .first()
      .click();
    await expect(panel.getByText(testoModificato)).toBeVisible({
      timeout: 10_000,
    });

    page.once("dialog", (dialog) => dialog.accept());
    await panel.getByRole("button", { name: "Elimina" }).first().click();
    await expect(panel.getByText(testoModificato)).toBeHidden({
      timeout: 10_000,
    });

    // Maestro interno (via email di un utente ORMA reale) — opzionale.
    if (maestroInternoEmail) {
      await panel.locator('input[name="email"]').fill(maestroInternoEmail);
      await panel.getByRole("button", { name: "Associa Maestro ORMA" }).click();
      await expect(
        panel.getByRole("button", { name: "Associa Maestro ORMA" }),
      ).toBeHidden({ timeout: 10_000 });
    }

    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
  });
});
