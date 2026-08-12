import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getCalendarTexture,
  getCardTexture,
  getCompassTexture,
  getNotebookTexture,
  getSheetTexture,
  getWoodTexture,
  resetTextureCache,
  textureBudgetBytes,
} from "@/components/three/materials/textures";
import { getSceneObject } from "@/lib/scene/objects";
import { stubCanvas2D } from "./canvasMock";

/** Soglia dichiarata in docs/SDD.md §10. */
const TEXTURE_BUDGET_MB = 12;

describe("texture procedurali", () => {
  beforeEach(() => {
    stubCanvas2D();
    resetTextureCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("riusa la stessa texture per lo stesso oggetto", () => {
    const card = getSceneObject("specialita-nodi");

    expect(getCardTexture(card)).toBe(getCardTexture(card));
    expect(getWoodTexture()).toBe(getWoodTexture());
  });

  it("genera texture distinte per carte diverse", () => {
    const nodi = getCardTexture(getSceneObject("specialita-nodi"));
    const fede = getCardTexture(getSceneObject("competenza-fede"));

    expect(nodi).not.toBe(fede);
  });

  it("non alloca memoria quando la texture è già in cache", () => {
    getWoodTexture();
    const afterFirst = textureBudgetBytes();

    getWoodTexture();

    expect(textureBudgetBytes()).toBe(afterFirst);
  });

  it("tiene l'intera scena dentro il budget texture", () => {
    getWoodTexture();
    getCardTexture(getSceneObject("specialita-nodi"));
    getCardTexture(getSceneObject("competenza-fede"));
    getCardTexture(getSceneObject("tappa-scoperta"));
    getNotebookTexture();
    getCalendarTexture();
    getSheetTexture();
    getCompassTexture();

    const megabytes = textureBudgetBytes() / (1024 * 1024);

    expect(megabytes).toBeLessThanOrEqual(TEXTURE_BUDGET_MB);
  });
});
