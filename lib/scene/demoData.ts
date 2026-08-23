import type { CardData, EventoData } from "./objects";

/**
 * Dati dimostrativi della sandbox di sviluppo (`app/tavolo-dev/`).
 *
 * Non sono contenuto ufficiale AGESCI e non finiscono mai in produzione:
 * servono solo a montare la scena con qualcosa di plausibile quando si lavora
 * su resa e interazione senza una sessione autenticata. I titoli sono generici
 * di proposito — nessuna grafica o testo ufficiale viene simulato qui
 * (`CLAUDE.md`, "Assets").
 */

export const DEMO_CARDS: readonly CardData[] = [
  {
    id: "demo-specialita",
    kind: "specialita",
    slug: "nodi-e-legature",
    title: "Nodi e Legature",
    stato: "in_corso",
    dataInizio: "2026-03-14",
    note: [{ id: "demo-nota", testo: "Provato il nodo parlato in uscita." }],
  },
  {
    id: "demo-competenza",
    kind: "competenza",
    slug: "educazione-alla-fede",
    title: "Educazione alla Fede",
    stato: "in_corso",
    dataInizio: "2026-01-08",
    note: [],
  },
  {
    id: "demo-tappa",
    kind: "tappa",
    slug: "tappa-della-scoperta",
    title: "Tappa della Scoperta",
    dataInizio: "2025-10-02",
    note: [],
  },
];

export const DEMO_EVENTS: readonly EventoData[] = [
  {
    id: "demo-uscita",
    titolo: "Uscita di Squadriglia",
    tipo: "uscita",
    dataInizio: "2026-09-12",
    dataFine: "2026-09-13",
    luogo: "Val Trebbia",
  },
  {
    id: "demo-riunione",
    titolo: "Riunione di Reparto",
    tipo: "riunione",
    dataInizio: "2026-09-05",
    luogo: "Sede",
  },
];
