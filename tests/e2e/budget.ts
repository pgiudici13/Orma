/**
 * Budget di performance della scena 3D, dichiarato in `docs/SDD.md` §10.
 *
 * Sta in un file a parte perché lo verificano due test: quello sulla sandbox di
 * sviluppo, che gira sempre, e quello sul tavolo reale, che richiede
 * credenziali. Una soglia sola, un posto solo dove alzarla — e alzarla è una
 * decisione da documentare, non un aggiustamento silenzioso.
 */

export type PerfSnapshot = {
  calls: number;
  triangles: number;
  textures: number;
  textureBytes: number;
};

export const MAX_DRAW_CALLS = 60;
export const MAX_TRIANGLES = 20_000;
export const MAX_TEXTURE_MB = 24;

/** Legge il picco misurato dalla sonda in sviluppo (`components/three/PerfHud.tsx`). */
export async function readPerf(page: {
  waitForFunction: (
    fn: () => unknown,
    arg?: unknown,
    options?: { timeout?: number },
  ) => Promise<{ jsonValue: () => Promise<unknown> }>;
}): Promise<PerfSnapshot> {
  const handle = await page.waitForFunction(
    () => (window as unknown as { __ormaPerf?: PerfSnapshot }).__ormaPerf,
    undefined,
    { timeout: 15_000 },
  );
  return (await handle.jsonValue()) as PerfSnapshot;
}
