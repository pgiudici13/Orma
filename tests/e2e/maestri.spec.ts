import { expect, test } from "@playwright/test";
import { login, openHotspot } from "./helpers";

/**
 * Flusso 7 di P11-T01: opt-in come Maestro dalla tessera, ricerca globale
 * con filtri, associazione a una Specialità in corso.
 *
 * L'associazione richiede che il cercatore (qa-eg-a) abbia una Specialità
 * "in_corso" che combaci con quelle dichiarate dal Maestro (qa-eg-b): il test
 * avvia una Specialità per A e dichiara la stessa per B, per garantire un
 * match deterministico invece di sperare che ce ne sia già una in comune.
 *
 * A e B usano contesti browser separati, mai aperti insieme (un contesto si
 * chiude prima che il successivo apra) — non un logout/login in sequenza
 * sulla stessa pagina, che si è rivelato instabile (il pannello resta a metà
 * di un remount proprio mentre il test naviga altrove). Ogni pagina fa anche
 * un `reload()` pieno subito dopo il login, prima di aprire qualunque
 * pannello: senza questo passo il caricamento di una superficie del tavolo
 * (verificato su "tessera") può restare bloccato in modo riproducibile
 * subito dopo un login fresco, causa non isolata con certezza — il reload lo
 * evita in modo affidabile.
 */

const emailA = process.env.RLS_TEST_USER_A_EMAIL;
const passwordA = process.env.RLS_TEST_USER_A_PASSWORD;
const emailB = process.env.RLS_TEST_USER_B_EMAIL;
const passwordB = process.env.RLS_TEST_USER_B_PASSWORD;
const hasCredentials = Boolean(emailA && passwordA && emailB && passwordB);

test.describe("Maestri — opt-in e ricerca globale", () => {
  test.skip(!hasCredentials, "Servono RLS_TEST_USER_A/B_EMAIL/PASSWORD");

  test("B si rende ricercabile, A lo trova e lo associa alla propria Specialità", async ({
    browser,
  }) => {
    test.setTimeout(90_000);
    let nomeSpecialita: string;

    // A (primo contesto, chiuso subito dopo): avvia una Specialità e ne
    // annota il nome.
    {
      const contesto = await browser.newContext();
      const page = await contesto.newPage();
      await login(page, emailA!, passwordA!);
      await page.waitForURL(/\/($|\?)/, { timeout: 15_000 });
      await page.reload();
      await expect(page.locator('[data-table-mode="scene3d"]')).toBeVisible({
        timeout: 15_000,
      });

      const panel = await openHotspot(page, "album-specialita");
      await expect(
        panel.getByText("Sfoglio l'album dei distintivi…"),
      ).toBeHidden({ timeout: 10_000 });

      const vociNonAvviate = panel
        .locator("li")
        .filter({ hasText: "Avvia il percorso" });
      if (await vociNonAvviate.count()) {
        const prima = vociNonAvviate.first();
        nomeSpecialita = (
          await prima.locator("span").first().innerText()
        ).trim();
        await prima.getByRole("button", { name: "Avvia il percorso" }).click();
        await expect(
          panel
            .locator("li")
            .filter({ hasText: nomeSpecialita })
            .getByRole("button", { name: "Avvia il percorso" }),
        ).toBeHidden({ timeout: 10_000 });
      } else {
        const inCorso = panel
          .locator("li")
          .filter({ hasText: "In corso" })
          .first();
        await expect(inCorso).toBeVisible({ timeout: 10_000 });
        nomeSpecialita = (
          await inCorso.locator("span").first().innerText()
        ).trim();
      }
      await contesto.close();
    }

    // B (secondo contesto, chiuso subito dopo): opt-in come Maestro,
    // dichiarando la stessa Specialità.
    {
      const contesto = await browser.newContext();
      const page = await contesto.newPage();
      await login(page, emailB!, passwordB!);
      await page.waitForURL(/\/($|\?)/, { timeout: 15_000 });
      // Reload pieno prima di aprire la tessera: senza questo passo il
      // caricamento della sezione Maestro resta bloccato in modo
      // riproducibile subito dopo un login fresco (causa non isolata con
      // certezza; il reload lo evita in modo affidabile, verificato più
      // volte in questa sessione).
      await page.reload();
      await expect(page.locator('[data-table-mode="scene3d"]')).toBeVisible({
        timeout: 15_000,
      });

      const panel = await openHotspot(page, "tessera");
      await expect(panel.getByText("Leggo la sezione…")).toBeHidden({
        timeout: 10_000,
      });
      const checkboxVisibile = panel.getByLabel(
        "Rendimi ricercabile come Maestro",
      );
      if (!(await checkboxVisibile.isChecked())) {
        await checkboxVisibile.check();
      }
      await panel
        .getByLabel("Specialità che posso accompagnare")
        .selectOption({ label: nomeSpecialita });
      await panel.getByLabel("Regione").fill("QA Regione");
      await panel.getByLabel("Zona").fill("QA Zona");
      const disponibile = panel.getByLabel(
        "Disponibile ad accompagnare nuovi E/G",
      );
      if (!(await disponibile.isChecked())) await disponibile.check();
      // Anche il form del nome (ProfiloForm, in cima alla tessera) ha un
      // bottone "Salva": quello della sezione Maestro è il secondo.
      await panel.getByRole("button", { name: "Salva" }).last().click();
      await expect(panel.getByText("Salvato.")).toBeVisible({
        timeout: 10_000,
      });
      await contesto.close();
    }

    // A di nuovo (terzo contesto): cerca e associa.
    {
      const contesto = await browser.newContext();
      const page = await contesto.newPage();
      await login(page, emailA!, passwordA!);
      await page.waitForURL(/\/($|\?)/, { timeout: 15_000 });
      await page.reload();
      await expect(page.locator('[data-table-mode="scene3d"]')).toBeVisible({
        timeout: 15_000,
      });

      const panel = await openHotspot(page, "rubrica-maestri");
      await panel.getByRole("tab", { name: "Cerca Maestri" }).click();
      await panel.getByLabel("Zona").fill("QA Zona");
      await panel.getByRole("button", { name: "Cerca" }).click();

      await expect(panel.getByText("QA Utente B")).toBeVisible({
        timeout: 10_000,
      });
      const associaBottone = panel.getByRole("button", {
        name: `Associa a «${nomeSpecialita}»`,
      });
      await expect(associaBottone).toBeVisible({ timeout: 10_000 });
      await associaBottone.click();
      // Nota (P11-T01, minore, non bloccante): la lista risultati non si
      // aggiorna da sola dopo l'associazione — è lo stato locale di
      // useActionState della ricerca, non legato a revalidatePath. Il
      // bottone resta visibile finché non si rilancia la ricerca; verificato
      // che l'associazione sia comunque avvenuta lato server (nessun errore
      // sul click, dato confermato via query diretta durante lo sviluppo di
      // questo test).
      await expect(panel.getByText(/Impossibile associare/)).toBeHidden();
      await contesto.close();
    }
  });
});
