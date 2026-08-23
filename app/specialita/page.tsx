import { TableExperience } from "@/components/table/TableExperience";
import { getTableContext } from "@/lib/queries/cards";

export const metadata = { title: "ORMA — Catalogo Specialità" };

/**
 * Deep-link al tavolo con l'album dei distintivi già aperto (DEC-019).
 *
 * Non è più una pagina: il contenuto vive in
 * `components/panel/surfaces/`. La rotta resta perché un collegamento
 * diretto deve continuare a funzionare.
 */
export default async function Page() {
  const { cards, events, hasReparto } = await getTableContext();

  return (
    <TableExperience
      cards={cards}
      events={events}
      hasReparto={hasReparto}
      initialFocus="album-specialita"
    />
  );
}
