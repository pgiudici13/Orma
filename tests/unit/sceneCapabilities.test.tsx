import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  resetWebGLSupportCache,
  useSceneCapabilities,
} from "@/lib/scene/useSceneCapabilities";

type MediaState = { wide: boolean; reducedMotion: boolean };

function stubMatchMedia({ wide, reducedMotion }: MediaState) {
  vi.stubGlobal(
    "matchMedia",
    (query: string) =>
      ({
        matches: query.includes("prefers-reduced-motion")
          ? reducedMotion
          : wide,
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as unknown as MediaQueryList,
  );
}

function stubWebGL(available: boolean) {
  resetWebGLSupportCache();
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() =>
    available ? ({} as never) : null,
  );
}

describe("scelta della resa del tavolo", () => {
  beforeEach(() => {
    resetWebGLSupportCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    resetWebGLSupportCache();
  });

  it("usa la scena 3D su viewport larga con WebGL disponibile", async () => {
    stubMatchMedia({ wide: true, reducedMotion: false });
    stubWebGL(true);

    const { result } = renderHook(() => useSceneCapabilities());

    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.mode).toBe("scene3d");
  });

  it("ripiega sulla composizione 2D senza WebGL", async () => {
    stubMatchMedia({ wide: true, reducedMotion: false });
    stubWebGL(false);

    const { result } = renderHook(() => useSceneCapabilities());

    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.mode).toBe("flat");
  });

  it("ripiega sulla composizione 2D su viewport stretta", async () => {
    stubMatchMedia({ wide: false, reducedMotion: false });
    stubWebGL(true);

    const { result } = renderHook(() => useSceneCapabilities());

    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.mode).toBe("flat");
  });

  it("rispetta prefers-reduced-motion", async () => {
    stubMatchMedia({ wide: true, reducedMotion: true });
    stubWebGL(true);

    const { result } = renderHook(() => useSceneCapabilities());

    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.mode).toBe("flat");
    expect(result.current.reducedMotion).toBe(true);
  });
});
