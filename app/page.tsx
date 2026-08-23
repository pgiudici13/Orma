import { TableExperience } from "@/components/table/TableExperience";
import { getTableCards, getTableEvents } from "@/lib/queries/cards";

export default async function Home() {
  const [cards, events] = await Promise.all([
    getTableCards(),
    getTableEvents(),
  ]);
  return <TableExperience cards={cards} events={events} />;
}
