import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MaestriSurface } from "@/components/panel/surfaces/MaestriSurface";
import { resetSurfaceCache } from "@/lib/scene/useSurfaceData";

// Le superfici caricano i propri dati con Server Action (DEC-021), che in
// jsdom non hanno una richiesta a cui agganciarsi: qui le azioni sono simulati
// e la ricerca restituisce un risultato fisso.
vi.mock("@/app/actions/surfaces", () => ({
  loadMaestri: vi.fn(async () => []),
  loadCatalogo: vi.fn(async () => ({
    kind: "specialita",
    voci: [
      { id: "s1", nome: "Nodi e Legature", stato: null },
      { id: "s2", nome: "Fuoco", stato: null },
    ],
  })),
}));

vi.mock("@/app/actions/maestri", () => ({
  associaMaestroDaRicerca: vi.fn(async () => {}),
  cercaMaestriAction: vi.fn(async () => ({
    risultati: [
      {
        profileId: "p-maestro-1",
        nome: "Anna Verdi",
        specialitaIds: ["s1", "s2"],
        specialitaNomi: ["Nodi e Legature", "Fuoco"],
        regione: "Lombardia",
        zona: "Milano",
        localita: "Milano",
        disponibile: true,
      },
    ],
    // L'utente ha in corso solo "Nodi e Legature": l'associazione è possibile
    // solo verso quella (il Maestro vive su una carta).
    mieSpecialitaAttive: ["s1"],
    cercato: true,
  })),
}));

import {
  associaMaestroDaRicerca,
  cercaMaestriAction,
} from "@/app/actions/maestri";

describe("MaestriSurface — ricerca globale (Fase 8)", () => {
  beforeEach(() => {
    resetSurfaceCache();
    vi.clearAllMocks();
  });

  it("apre sulla scheda 'I miei Maestri' con lo stato vuoto", async () => {
    render(<MaestriSurface />);

    expect(
      await screen.findByText(/Nessun Maestro associato al tuo percorso/),
    ).toBeInTheDocument();
  });

  it("la scheda 'Cerca Maestri' mostra i filtri per Specialità, Regione, Zona e disponibilità", async () => {
    render(<MaestriSurface />);
    await screen.findByText(/Nessun Maestro associato al tuo percorso/);

    await userEvent.click(screen.getByRole("tab", { name: "Cerca Maestri" }));

    const panel = screen.getByRole("tabpanel", { name: "Cerca Maestri" });
    expect(
      within(panel).getByRole("combobox", { name: "Specialità" }),
    ).toBeInTheDocument();
    expect(within(panel).getByLabelText("Regione")).toBeInTheDocument();
    expect(within(panel).getByLabelText("Zona")).toBeInTheDocument();
    expect(
      within(panel).getByLabelText("Solo Maestri disponibili"),
    ).toBeInTheDocument();
    expect(
      within(panel).getByRole("button", { name: "Cerca" }),
    ).toBeInTheDocument();
  });

  it("cerca, mostra i risultati e permette di associare solo a Specialità in corso", async () => {
    render(<MaestriSurface />);
    await screen.findByText(/Nessun Maestro associato al tuo percorso/);

    await userEvent.click(screen.getByRole("tab", { name: "Cerca Maestri" }));
    const panel = screen.getByRole("tabpanel", { name: "Cerca Maestri" });

    await userEvent.click(within(panel).getByRole("button", { name: "Cerca" }));

    // Il risultato arriva dalla Server Action simulata.
    expect(await within(panel).findByText("Anna Verdi")).toBeInTheDocument();
    expect(cercaMaestriAction).toHaveBeenCalledTimes(1);

    // Solo "Nodi e Legature" (in corso) è associabile; "Fuoco" non ha una
    // carta attiva su cui agganciare il Maestro.
    expect(
      within(panel).getByRole("button", {
        name: "Associa a «Nodi e Legature»",
      }),
    ).toBeInTheDocument();
    expect(
      within(panel).queryByRole("button", { name: "Associa a «Fuoco»" }),
    ).not.toBeInTheDocument();

    await userEvent.click(
      within(panel).getByRole("button", {
        name: "Associa a «Nodi e Legature»",
      }),
    );

    await waitFor(() => {
      expect(associaMaestroDaRicerca).toHaveBeenCalledWith("s1", "p-maestro-1");
    });
  });
});
