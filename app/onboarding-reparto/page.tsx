import { redirect } from "next/navigation";
import { TableExperience } from "@/components/table/TableExperience";
import { getTableContext } from "@/lib/queries/cards";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "ORMA — Associazione al Reparto" };

/**
 * Deep-link al tavolo con la busta della richiesta di adesione già aperta
 * (DEC-019).
 *
 * È la destinazione del gate di `lib/supabase/middleware.ts` per chi non
 * appartiene ancora a un Reparto: invece di un modulo a pagina piena, il
 * proprio tavolo con sopra una busta da compilare. Gli oggetti di Reparto
 * (cassetta, guidone, calendario) non compaiono finché non c'è un Reparto —
 * `buildTable` in `lib/scene/objects.ts`.
 */
export default async function OnboardingRepartoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { cards, events, hasReparto } = await getTableContext();
  if (hasReparto) redirect("/");

  return (
    <TableExperience
      cards={cards}
      events={events}
      hasReparto={false}
      initialFocus="busta-adesione"
    />
  );
}
