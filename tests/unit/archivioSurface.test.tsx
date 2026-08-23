import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadArchivio } from "@/app/actions/surfaces";
import { ArchivioSurface } from "@/components/panel/surfaces/ArchivioSurface";
import type { ArchivioData } from "@/lib/queries/archivio";
import { resetSurfaceCache } from "@/lib/scene/useSurfaceData";

// Le superfici caricano i dati con Server Action (DEC-021), che in jsdom non
// hanno una richiesta a cui agganciarsi: `loadArchivio` è simulato con un
// fixture e le azioni di scrittura sono stub (nessun submit reale nei test).
vi.mock("@/app/actions/surfaces", () => ({
  loadArchivio: vi.fn(),
}));

vi.mock("@/app/actions/archivio", () => ({
  caricaDocumento: vi.fn(async () => {}),
  creaCampo: vi.fn(async () => {}),
  creaLuogo: vi.fn(async () => {}),
  creaUscita: vi.fn(async () => {}),
  eliminaCampo: vi.fn(async () => {}),
  eliminaDocumento: vi.fn(async () => {}),
  eliminaLuogo: vi.fn(async () => {}),
  eliminaUscita: vi.fn(async () => {}),
  modificaCampo: vi.fn(async () => {}),
  modificaUscita: vi.fn(async () => {}),
}));

const archivioFixture: ArchivioData = {
  repartoNome: "Reparto Mafeking",
  isCapoOrAdmin: true,
  luoghi: [{ id: "l1", nome: "Bosco di Gerenzago", documenti: [] }],
  uscite: [
    {
      id: "u1",
      titolo: "Uscita di San Giorgio",
      data: "2026-04-23",
      luogo: { id: "l1", nome: "Bosco di Gerenzago" },
      programma: "Grande gioco e gare di cucina.",
      materiale: "Corde e fischietti",
      note: "Sotto la pioggia: replica al coperto.",
      partecipanti: ["Anna Verdi"],
      partecipanteIds: ["p1"],
      squadriglie: ["Falchi"],
      squadrigliaIds: ["s1"],
      documenti: [
        {
          id: "d1",
          tipo: "foto",
          nomeFile: "san-giorgio.jpg",
          url: "https://example.test/signed/1",
        },
      ],
    },
  ],
  campi: [
    {
      id: "c1",
      titolo: "Campo estivo",
      anno: 2025,
      luogo: { id: "l1", nome: "Bosco di Gerenzago" },
      partecipanti: ["Anna Verdi"],
      partecipanteIds: ["p1"],
      squadriglie: [],
      squadrigliaIds: [],
      documenti: [],
    },
  ],
  membri: [{ id: "p1", nome: "Anna Verdi" }],
  squadriglie: [{ id: "s1", nome: "Falchi" }],
};

describe("ArchivioSurface — baule dell'archivio (Fase 9)", () => {
  beforeEach(() => {
    resetSurfaceCache();
    vi.clearAllMocks();
    vi.mocked(loadArchivio).mockReset();
    vi.mocked(loadArchivio).mockResolvedValue(archivioFixture);
  });

  it("lo scaffale mostra campi, uscite e luoghi", async () => {
    render(<ArchivioSurface />);

    expect(await screen.findByText("Campo estivo — 2025")).toBeInTheDocument();
    expect(
      screen.getByText("Uscita di San Giorgio — 2026-04-23"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Bosco di Gerenzago").length).toBeGreaterThan(0);
    // Per un Capo compare l'azione di aggiunta.
    expect(
      screen.getByRole("button", { name: "Aggiungi un campo" }),
    ).toBeInTheDocument();
  });

  it("aprire un campo mostra luogo, partecipanti e Squadriglie (P9-T03)", async () => {
    render(<ArchivioSurface />);
    await screen.findByText("Campo estivo — 2025");

    await userEvent.click(
      screen.getByRole("button", { name: "Campo estivo — 2025" }),
    );

    expect(
      screen.getByRole("heading", { name: "Campo estivo" }),
    ).toBeInTheDocument();

    // Navigazione Campo → Luogo → Partecipanti → Squadriglie (DATA_MODEL.md).
    expect(screen.getByText("Bosco di Gerenzago")).toBeInTheDocument();
    expect(screen.getByText("Anna Verdi")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Partecipanti" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Squadriglie" }),
    ).toBeInTheDocument();
    // Nessuna fotografia e nessun documento in questo campo.
    expect(
      screen.getByText("Nessuna fotografia in questo ricordo."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Nessun documento in questo ricordo."),
    ).toBeInTheDocument();
  });

  it("un'uscita con fotografie le mostra come link al file firmato", async () => {
    render(<ArchivioSurface />);
    await screen.findByText("Campo estivo — 2025");

    await userEvent.click(
      screen.getByRole("button", {
        name: "Uscita di San Giorgio — 2026-04-23",
      }),
    );

    const link = await screen.findByRole("link", { name: "san-giorgio.jpg" });
    expect(link).toHaveAttribute("href", "https://example.test/signed/1");
    expect(
      screen.getByText("Grande gioco e gare di cucina."),
    ).toBeInTheDocument();
  });

  it("chi non è Capo non vede le azioni di scrittura", async () => {
    vi.mocked(loadArchivio).mockResolvedValueOnce({
      ...archivioFixture,
      isCapoOrAdmin: false,
    });
    render(<ArchivioSurface />);

    await screen.findByText("Campo estivo — 2025");
    expect(
      screen.queryByRole("button", { name: "Aggiungi un campo" }),
    ).not.toBeInTheDocument();
  });
});
