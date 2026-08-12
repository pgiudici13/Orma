import { beforeEach, describe, expect, it } from "vitest";
import { useSceneStore } from "@/lib/scene/store";

describe("store della scena", () => {
  beforeEach(() => {
    useSceneStore.setState({ focusedId: null, focusOrigin: null });
  });

  it("parte senza nessun oggetto a fuoco", () => {
    expect(useSceneStore.getState().focusedId).toBeNull();
    expect(useSceneStore.getState().focusOrigin).toBeNull();
  });

  it("mette a fuoco un oggetto e ricorda il punto di apertura", () => {
    useSceneStore.getState().focus("specialita-nodi", { x: 120, y: 240 });

    expect(useSceneStore.getState().focusedId).toBe("specialita-nodi");
    expect(useSceneStore.getState().focusOrigin).toEqual({ x: 120, y: 240 });
  });

  it("azzera l'origine quando il focus arriva senza posizione", () => {
    useSceneStore.getState().focus("taccuino", { x: 10, y: 10 });
    useSceneStore.getState().focus("calendario");

    expect(useSceneStore.getState().focusedId).toBe("calendario");
    expect(useSceneStore.getState().focusOrigin).toBeNull();
  });

  it("torna al tavolo con clear", () => {
    useSceneStore.getState().focus("tappa-scoperta", { x: 1, y: 2 });
    useSceneStore.getState().clear();

    expect(useSceneStore.getState().focusedId).toBeNull();
    expect(useSceneStore.getState().focusOrigin).toBeNull();
  });
});
