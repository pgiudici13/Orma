import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { ObjectPanel } from "@/components/panel/ObjectPanel";
import { TableFlat } from "@/components/table/TableFlat";
import { INTERACTIVE_OBJECTS } from "@/lib/scene/objects";
import { useSceneStore } from "@/lib/scene/store";

describe("composizione 2D del tavolo", () => {
  beforeEach(() => {
    useSceneStore.setState({ focusedId: null, focusOrigin: null });
  });

  it("espone ogni oggetto interattivo come bottone accessibile", () => {
    render(<TableFlat />);

    INTERACTIVE_OBJECTS.forEach((object) => {
      const buttons = screen.getAllByRole("button", {
        name: new RegExp(object.title, "i"),
      });
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  it("non rende cliccabili gli oggetti decorativi", () => {
    render(<TableFlat />);

    expect(
      screen.queryByRole("button", { name: /bussola/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /matita/i }),
    ).not.toBeInTheDocument();
  });

  it("apre il pannello dell'oggetto scelto e lo richiude con Esc", async () => {
    const user = userEvent.setup();
    render(
      <>
        <TableFlat />
        <ObjectPanel />
      </>,
    );

    const [card] = screen.getAllByRole("button", {
      name: /Nodi e Legature/i,
    });
    await user.click(card);

    expect(useSceneStore.getState().focusedId).toBe("specialita-nodi");

    const panel = await screen.findByRole("dialog");
    expect(
      within(panel).getByRole("heading", { name: "Nodi e Legature" }),
    ).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(useSceneStore.getState().focusedId).toBeNull();
  });

  it("mostra le sezioni nell'ordine previsto da docs/UX.md", async () => {
    const user = userEvent.setup();
    render(
      <>
        <TableFlat />
        <ObjectPanel />
      </>,
    );

    const [card] = screen.getAllByRole("button", { name: /Nodi e Legature/i });
    await user.click(card);

    const panel = await screen.findByRole("dialog");
    const sections = within(panel)
      .getAllByRole("heading", { level: 3 })
      .map((heading) => heading.textContent);

    expect(sections).toEqual([
      "Contenuto ufficiale",
      "Progresso",
      "Note personali",
      "Maestro",
    ]);
  });
});
