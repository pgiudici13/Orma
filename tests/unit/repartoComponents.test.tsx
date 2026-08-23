import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MembriSection } from "@/components/reparto/MembriSection";
import { SquadriglieSection } from "@/components/reparto/SquadriglieSection";
import { CalendarioSection } from "@/components/reparto/CalendarioSection";
import type { MemberData, SquadrigliaData } from "@/lib/queries/reparto";
import type { EventoData } from "@/lib/scene/objects";

const mockMembers: MemberData[] = [
  {
    id: "user-1",
    nome: "Marco Rossi",
    ruolo: "capo",
    squadrigliaId: null,
    squadrigliaNome: null,
    specialitaCompletate: [
      { id: "s-1", nome: "Pioniere" },
      { id: "s-2", nome: "Alpinista" },
    ],
    competenzeCompletate: [{ id: "c-1", nome: "Animazione Espressiva" }],
    tappaAttuale: "Responsabilità",
  },
  {
    id: "user-2",
    nome: "Chiara Bianchi",
    ruolo: "eg",
    squadrigliaId: "sq-1",
    squadrigliaNome: "Aquile",
    specialitaCompletate: [{ id: "s-3", nome: "Botanico" }],
    competenzeCompletate: [],
    tappaAttuale: "Competenza",
  },
  {
    id: "user-3",
    nome: "Luca Verdi",
    ruolo: "eg",
    squadrigliaId: "sq-2",
    squadrigliaNome: "Volpi",
    specialitaCompletate: [],
    competenzeCompletate: [],
    tappaAttuale: "Scoperta",
  },
  {
    id: "user-4",
    nome: "Sara Neri",
    ruolo: "eg",
    squadrigliaId: null,
    squadrigliaNome: null,
    specialitaCompletate: [],
    competenzeCompletate: [],
    tappaAttuale: null,
  },
];

const mockSquadriglie: SquadrigliaData[] = [
  { id: "sq-1", nome: "Aquile", created_at: "2026-01-01" },
  { id: "sq-2", nome: "Volpi", created_at: "2026-01-01" },
];

const mockEvents: EventoData[] = [
  {
    id: "ev-1",
    titolo: "Uscita di Apertura",
    tipo: "uscita",
    dataInizio: "2026-10-10",
    dataFine: "2026-10-11",
    luogo: "Prati di Monte Sole",
    descrizione: "Prima uscita dell'anno scout, tende e gavette.",
  },
  {
    id: "ev-2",
    titolo: "Campo Invernale",
    tipo: "campo",
    dataInizio: "2026-12-27",
    dataFine: "2026-12-30",
    luogo: "Rifugio Alpe",
    descrizione: "Campo invernale di Reparto sulla neve.",
  },
  {
    id: "ev-3",
    titolo: "Uscita Passata",
    tipo: "uscita",
    dataInizio: "2025-05-01",
    luogo: "Bosco",
  },
];

describe("Fase 7 — MembriSection (P7-T01)", () => {
  it("renderizza tutti i membri e le informazioni scout pertinenti", () => {
    render(<MembriSection members={mockMembers} />);

    expect(screen.getByText("Marco Rossi")).toBeInTheDocument();
    expect(screen.getByText("Chiara Bianchi")).toBeInTheDocument();
    expect(screen.getByText("Luca Verdi")).toBeInTheDocument();
    expect(screen.getByText("Sara Neri")).toBeInTheDocument();

    // Ruoli
    expect(screen.getAllByText(/Capo Reparto/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Esploratore \/ Guida/).length).toBeGreaterThan(
      0,
    );

    // Specialità e Tappe
    expect(screen.getByText("Pioniere, Alpinista")).toBeInTheDocument();
    expect(screen.getByText("Botanico")).toBeInTheDocument();
    expect(screen.getByText("Tappa Responsabilità")).toBeInTheDocument();
    expect(screen.getByText("Tappa Competenza")).toBeInTheDocument();
  });

  it("non espone dati anagrafici privati", () => {
    const { container } = render(<MembriSection members={mockMembers} />);
    const text = container.textContent ?? "";
    expect(text).not.toContain("data_nascita");
    expect(text).not.toContain("genitore_email");
    expect(text).not.toContain("consenso");
  });

  it("filtra i membri per testo di ricerca", () => {
    render(<MembriSection members={mockMembers} />);

    const searchInput = screen.getByPlaceholderText("Cerca per nome…");
    fireEvent.change(searchInput, { target: { value: "Chiara" } });

    expect(screen.getByText("Chiara Bianchi")).toBeInTheDocument();
    expect(screen.queryByText("Marco Rossi")).not.toBeInTheDocument();
    expect(screen.queryByText("Luca Verdi")).not.toBeInTheDocument();
  });

  it("filtra i membri per Squadriglia", () => {
    render(<MembriSection members={mockMembers} />);

    const select = screen.getByLabelText("Squadriglia:");
    fireEvent.change(select, { target: { value: "Aquile" } });

    expect(screen.getByText("Chiara Bianchi")).toBeInTheDocument();
    expect(screen.queryByText("Luca Verdi")).not.toBeInTheDocument();
  });
});

describe("Fase 7 — SquadriglieSection (P7-T02)", () => {
  it("renderizza le Squadriglie e i membri non assegnati", () => {
    render(
      <SquadriglieSection
        squadriglie={mockSquadriglie}
        members={mockMembers}
        isCapoOrAdmin={false}
      />,
    );

    expect(screen.getByText("Sq. Aquile")).toBeInTheDocument();
    expect(screen.getByText("Sq. Volpi")).toBeInTheDocument();
    expect(screen.getByText("Membri senza Squadriglia")).toBeInTheDocument();
    expect(screen.getByText("Chiara Bianchi")).toBeInTheDocument();
    expect(screen.getByText("Luca Verdi")).toBeInTheDocument();
    expect(screen.getByText("Sara Neri")).toBeInTheDocument();
  });

  it("nasconde i controlli di gestione a un utente normale non Capo", () => {
    render(
      <SquadriglieSection
        squadriglie={mockSquadriglie}
        members={mockMembers}
        isCapoOrAdmin={false}
      />,
    );

    expect(screen.queryByText("+ Nuova Squadriglia")).not.toBeInTheDocument();
    expect(screen.queryByText("Rinomina")).not.toBeInTheDocument();
    expect(screen.queryByText("Elimina")).not.toBeInTheDocument();
  });

  it("mostra i controlli di gestione se l'utente è Capo o Admin", () => {
    render(
      <SquadriglieSection
        squadriglie={mockSquadriglie}
        members={mockMembers}
        isCapoOrAdmin={true}
      />,
    );

    expect(screen.getByText("+ Nuova Squadriglia")).toBeInTheDocument();
    expect(screen.getAllByText("Rinomina").length).toBe(2);
    expect(screen.getAllByText("Elimina").length).toBe(2);
  });
});

describe("Fase 7 — CalendarioSection (P7-T03)", () => {
  it("renderizza gli eventi in programma e passati", () => {
    render(<CalendarioSection events={mockEvents} isCapoOrAdmin={false} />);

    expect(screen.getByText("Uscita di Apertura")).toBeInTheDocument();
    expect(screen.getByText("Campo Invernale")).toBeInTheDocument();
    expect(screen.getByText("Uscita Passata")).toBeInTheDocument();
    expect(screen.getByText(/Prati di Monte Sole/)).toBeInTheDocument();
    expect(
      screen.getByText(/Prima uscita dell'anno scout/),
    ).toBeInTheDocument();
  });

  it("mostra il pulsante + Nuovo Evento solo per i Capi/Admin", () => {
    const { rerender } = render(
      <CalendarioSection events={mockEvents} isCapoOrAdmin={false} />,
    );
    expect(screen.queryByText("+ Nuovo Evento")).not.toBeInTheDocument();

    rerender(<CalendarioSection events={mockEvents} isCapoOrAdmin={true} />);
    expect(screen.getByText("+ Nuovo Evento")).toBeInTheDocument();
  });
});
