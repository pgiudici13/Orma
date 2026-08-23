import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  // Un worker alla volta: questi test aprono contesti WebGL renderizzati via
  // software (SwiftShader, vedi `launchOptions`). Quattro scene 3D concorrenti
  // saturano la CPU e la scena non arriva a disegnare entro i timeout — un
  // fallimento dell'ambiente di test, non dell'applicazione. La suite è
  // piccola: il costo è qualche decina di secondi.
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
        launchOptions: {
          // WebGL via SwiftShader: senza questo la scena 3D non parte in
          // headless e il test verificherebbe solo il fallback 2D.
          args: [
            "--use-gl=angle",
            "--use-angle=swiftshader",
            "--enable-unsafe-swiftshader",
          ],
        },
      },
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
