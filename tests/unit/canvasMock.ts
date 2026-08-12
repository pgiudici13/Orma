import { vi } from "vitest";

/**
 * jsdom non implementa il contesto 2D: questo stub restituisce no-op per ogni
 * chiamata di disegno, così le factory di texture possono essere testate per
 * memoizzazione e budget senza un canvas reale.
 */
export function stubCanvas2D() {
  const context = new Proxy(
    {},
    {
      get(_target, property) {
        if (
          property === "createLinearGradient" ||
          property === "createRadialGradient"
        ) {
          return () => ({ addColorStop: () => {} });
        }
        if (property === "measureText") {
          return () => ({ width: 42 });
        }
        return () => {};
      },
      set: () => true,
    },
  );

  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
    context as never,
  );
}
