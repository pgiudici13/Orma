import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ObjectPanel } from "@/components/panel/ObjectPanel";
import { resetSurfaceCache } from "@/lib/scene/useSurfaceData";

// Le superfici caricano i propri dati con una Server Action (DEC-021), che in
// jsdom non ha una richiesta a cui agganciarsi. Qui interessa il contenuto che
// l'oggetto porta già con sé: il caricamento resta in sospeso, come quando la
// rete è lenta.
vi.mock("@/app/actions/surfaces", () => ({
  loadRepartoSurface: () => new Promise(() => {}),
}));
import type { EventoData, SceneObject } from "@/lib/scene/objects";
import { SceneDataProvider } from "@/lib/scene/SceneDataContext";
import { useSceneStore } from "@/lib/scene/store";

function renderPanelWithObject(object: SceneObject) {
  useSceneStore.setState({ focusedId: object.id, focusOrigin: null });
  return render(
    <SceneDataProvider objects={[object]}>
      <ObjectPanel />
    </SceneDataProvider>,
  );
}

describe("ObjectPanel — Calendario di Reparto (P7-T03)", () => {
  beforeEach(() => {
    useSceneStore.setState({ focusedId: null, focusOrigin: null });
    resetSurfaceCache();
  });

  it("mostra gli eventi del calendario di Reparto quando l'oggetto calendario è a fuoco", async () => {
    const events: EventoData[] = [
      {
        id: "ev-1",
        titolo: "Uscita San Giorgio",
        tipo: "uscita",
        dataInizio: "2026-04-23",
        dataFine: "2026-04-25",
        luogo: "Parco Regionale",
        descrizione: "Grande gioco di San Giorgio e gare di cucina.",
      },
    ];

    renderPanelWithObject({
      id: "calendario",
      kind: "calendario",
      title: "Calendario",
      label: "Calendario",
      interactive: true,
      spot: [0, 0],
      tilt: 0,
      events,
    });

    const panel = await screen.findByRole("dialog");
    expect(within(panel).getByText("Uscita San Giorgio")).toBeInTheDocument();
    expect(within(panel).getByText(/Parco Regionale/)).toBeInTheDocument();
    expect(
      within(panel).getByText(/Grande gioco di San Giorgio/),
    ).toBeInTheDocument();
    // Il rimando alla pagina Reparto non serve più: il Reparto è la cassetta
    // accanto sul tavolo, non una pagina altrove (DEC-019).
    expect(within(panel).queryByText("Apri Reparto →")).toBeNull();
  });

  it("mostra un messaggio informativo quando non ci sono eventi in programma", async () => {
    renderPanelWithObject({
      id: "calendario",
      kind: "calendario",
      title: "Calendario",
      label: "Calendario",
      interactive: true,
      spot: [0, 0],
      tilt: 0,
      events: [],
    });

    const panel = await screen.findByRole("dialog");
    expect(
      within(panel).getByText("Nessun evento futuro registrato al momento."),
    ).toBeInTheDocument();
  });
});
