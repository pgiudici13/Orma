import { TableExperience } from "@/components/table/TableExperience";
import { getTableCards, getTableEvents } from "@/lib/queries/cards";

export const metadata = { title: "ORMA — Reparto" };

/**
 * Deep-link al tavolo con la cassetta di Reparto già aperta (DEC-019).
 *
 * Non è più una pagina: le funzionalità di Reparto vivono sul tavolo, in
 * `components/panel/surfaces/RepartoSurface.tsx`. La rotta resta perché un
 * collegamento diretto deve continuare a funzionare — ed è la destinazione a
 * cui puntano i rimandi esistenti.
 */
export default async function RepartoPage() {
  const [cards, events] = await Promise.all([
    getTableCards(),
    getTableEvents(),
  ]);

  return (
    <TableExperience
      cards={cards}
      events={events}
      initialFocus="cassetta-reparto"
    />
  );
}
