import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { ObjectPanel } from "@/components/panel/ObjectPanel";
import type { CardData, SceneObject } from "@/lib/scene/objects";
import { SceneDataProvider } from "@/lib/scene/SceneDataContext";
import { useSceneStore } from "@/lib/scene/store";

/**
 * Verifica la superficie UI aggiunta in Fase 4 (note CRUD, associazione
 * Maestro) su una carta con dati reali — non coperta da tableFlat.test.tsx,
 * che usa il set dimostrativo senza `card`.
 */
function buildCard(overrides: Partial<CardData> = {}): CardData {
  return {
    id: "nodi",
    kind: "specialita",
    slug: "nodi",
    title: "Nodi e Legature",
    note: [],
    ...overrides,
  };
}

function renderPanelWithObject(object: SceneObject) {
  useSceneStore.setState({ focusedId: object.id, focusOrigin: null });
  return render(
    <SceneDataProvider objects={[object]}>
      <ObjectPanel />
    </SceneDataProvider>,
  );
}

describe("ObjectPanel — Fase 4 (note e Maestro)", () => {
  beforeEach(() => {
    useSceneStore.setState({ focusedId: null, focusOrigin: null });
  });

  it("mostra modifica ed eliminazione per ogni nota esistente", async () => {
    const card = buildCard({
      note: [{ id: "nota-1", testo: "Prima nota" }],
    });
    renderPanelWithObject({
      id: "specialita:nodi",
      kind: "specialita",
      title: card.title,
      label: "Specialità",
      interactive: true,
      spot: [0, 0],
      tilt: 0,
      card,
    });

    const panel = await screen.findByRole("dialog");
    const textarea = within(panel).getByDisplayValue("Prima nota");
    expect(textarea).toBeInTheDocument();
    expect(
      within(panel).getByRole("button", { name: "Salva modifiche" }),
    ).toBeInTheDocument();
    expect(
      within(panel).getByRole("button", { name: "Elimina" }),
    ).toBeInTheDocument();
  });

  it("mostra i form di associazione Maestro quando nessuno è assegnato", async () => {
    const card = buildCard();
    renderPanelWithObject({
      id: "specialita:nodi",
      kind: "specialita",
      title: card.title,
      label: "Specialità",
      interactive: true,
      spot: [0, 0],
      tilt: 0,
      card,
    });

    const panel = await screen.findByRole("dialog");
    expect(
      within(panel).getByPlaceholderText("email@esempio.it"),
    ).toBeInTheDocument();
    expect(
      within(panel).getByRole("button", { name: "Associa Maestro ORMA" }),
    ).toBeInTheDocument();
    expect(
      within(panel).getByRole("button", {
        name: "Aggiungi Maestro esterno",
      }),
    ).toBeInTheDocument();
  });

  it("mostra solo il nome quando un Maestro è già associato", async () => {
    const card = buildCard({ maestroNome: "Mario Rossi" });
    renderPanelWithObject({
      id: "specialita:nodi",
      kind: "specialita",
      title: card.title,
      label: "Specialità",
      interactive: true,
      spot: [0, 0],
      tilt: 0,
      card,
    });

    const panel = await screen.findByRole("dialog");
    expect(within(panel).getByText("Mario Rossi")).toBeInTheDocument();
    expect(
      within(panel).queryByPlaceholderText("email@esempio.it"),
    ).not.toBeInTheDocument();
  });

  it("non mostra la sezione Maestro per le Tappe", async () => {
    const card = buildCard({ kind: "tappa", id: "scoperta", slug: "scoperta" });
    renderPanelWithObject({
      id: "tappa:scoperta",
      kind: "tappa",
      title: card.title,
      label: "Tappa",
      interactive: true,
      spot: [0, 0],
      tilt: 0,
      card,
    });

    const panel = await screen.findByRole("dialog");
    expect(
      within(panel).queryByRole("heading", { name: "Maestro" }),
    ).not.toBeInTheDocument();
  });
});
