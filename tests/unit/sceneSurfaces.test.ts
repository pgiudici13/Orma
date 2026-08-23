import { describe, expect, it } from "vitest";
import { SURFACE_MAX_WIDTH, surfaceFor } from "@/components/panel/surfaces";
import { CalendarioSurface } from "@/components/panel/surfaces/CalendarioSurface";
import { CardSurface } from "@/components/panel/surfaces/CardSurface";
import {
  buildTable,
  DECORATIVE_OBJECTS,
  type CardData,
} from "@/lib/scene/objects";

const CARD: CardData = {
  id: "card-1",
  kind: "specialita",
  slug: "nodi-e-legature",
  title: "Nodi e Legature",
  stato: "in_corso",
  note: [],
};

describe("composizione del tavolo", () => {
  it("senza contesto mostra gli oggetti di chi ha già un Reparto", () => {
    const kinds = buildTable().map((object) => object.kind);

    expect(kinds).toContain("cassetta");
    expect(kinds).toContain("guidone");
    expect(kinds).toContain("calendario");
    // La busta serve solo a chi un Reparto non ce l'ha ancora.
    expect(kinds).not.toContain("busta");
  });

  it("chi non ha un Reparto trova la busta al posto degli oggetti di Reparto", () => {
    const kinds = buildTable({ hasReparto: false }).map(
      (object) => object.kind,
    );

    expect(kinds).toContain("busta");
    expect(kinds).not.toContain("cassetta");
    expect(kinds).not.toContain("guidone");
    expect(kinds).not.toContain("calendario");
    // Il percorso personale resta raggiungibile: non dipende dal Reparto.
    expect(kinds).toContain("album");
    expect(kinds).toContain("tessera");
  });

  it("non lascia fuori nessun oggetto dichiarato", () => {
    const dichiarati = new Set(DECORATIVE_OBJECTS.map((object) => object.id));
    const sulTavolo = new Set([
      ...buildTable().map((object) => object.id),
      ...buildTable({ hasReparto: false }).map((object) => object.id),
    ]);

    expect([...dichiarati].filter((id) => !sulTavolo.has(id))).toEqual([]);
  });

  it("aggiunge una sola carta per famiglia, posizionata sul suo posto", () => {
    const gemella: CardData = { ...CARD, id: "card-2", slug: "topografia" };
    const objects = buildTable({ cards: [CARD, gemella] });

    const carte = objects.filter((object) => object.kind === "specialita");
    expect(carte).toHaveLength(1);
    expect(carte[0].id).toBe("specialita:nodi-e-legature");
    expect(carte[0].interactive).toBe(true);
  });

  it("passa gli eventi al calendario senza toccare gli altri oggetti", () => {
    const objects = buildTable({
      events: [
        {
          id: "e1",
          titolo: "Uscita",
          tipo: "uscita",
          dataInizio: "2026-09-12",
        },
      ],
    });

    const calendario = objects.find((object) => object.kind === "calendario");
    expect(calendario?.events).toHaveLength(1);
    expect(
      objects.filter((object) => object.events !== undefined),
    ).toHaveLength(1);
  });
});

describe("registro delle superfici", () => {
  it("apre il calendario sulla sua superficie dedicata", () => {
    const calendario = DECORATIVE_OBJECTS.find(
      (object) => object.kind === "calendario",
    )!;

    expect(surfaceFor(calendario).component).toBe(CalendarioSurface);
  });

  it("usa la scheda carta per gli oggetti senza superficie propria", () => {
    // Taccuino e foglio non hanno ancora una superficie dedicata: devono
    // ricadere sui segnaposto della scheda, non lasciare il pannello vuoto.
    for (const kind of ["taccuino", "foglio"] as const) {
      const object = DECORATIVE_OBJECTS.find((item) => item.kind === kind)!;
      expect(surfaceFor(object).component).toBe(CardSurface);
    }
  });

  it("non lascia il pannello a tutto schermo su nessuna larghezza", () => {
    // Il tavolo deve restare visibile dietro il pannello (docs/UX.md).
    for (const value of Object.values(SURFACE_MAX_WIDTH)) {
      expect(value).toMatch(/^max-w-\[/);
    }
  });
});
