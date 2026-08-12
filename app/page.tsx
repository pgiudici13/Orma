import { TableExperience } from "@/components/table/TableExperience";
import { getTableCards } from "@/lib/queries/cards";

export default async function Home() {
  const cards = await getTableCards();
  return <TableExperience cards={cards} />;
}
