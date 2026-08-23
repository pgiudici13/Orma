import { TableExperience } from "@/components/table/TableExperience";
import { getTableContext } from "@/lib/queries/cards";

export default async function Home() {
  const { cards, events, hasReparto } = await getTableContext();
  return (
    <TableExperience cards={cards} events={events} hasReparto={hasReparto} />
  );
}
