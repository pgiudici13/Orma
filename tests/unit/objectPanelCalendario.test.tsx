import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { ObjectPanel } from "@/components/panel/ObjectPanel";
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
    expect(within(panel).getByText("Apri Reparto →")).toBeInTheDocument();
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
      within(panel).getByText("Nessun evento in programma per il tuo Reparto."),
    ).toBeInTheDocument();
  });
});
