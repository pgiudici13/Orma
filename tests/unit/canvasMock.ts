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
        // Le mappe derivate (normal map da altezza) leggono e riscrivono i
        // pixel: senza questi due lo stub restituirebbe `undefined` e la
        // derivazione fallirebbe solo nei test.
        if (property === "getImageData" || property === "createImageData") {
          return (...args: number[]) => {
            const [width, height] =
              args.length === 4 ? args.slice(2) : args.slice(0, 2);
            return {
              width,
              height,
              data: new Uint8ClampedArray(width * height * 4),
            };
          };
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
