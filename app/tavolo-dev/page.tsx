import { notFound } from "next/navigation";
import { TableExperience } from "@/components/table/TableExperience";
import { DEMO_CARDS, DEMO_EVENTS } from "@/lib/scene/demoData";

/**
 * Sandbox di sviluppo della scena tavolo.
 *
 * Serve a lavorare su resa 3D e interazione senza una sessione autenticata: la
 * scena si verifica solo in un browser reale (il Browser pane tiene la pagina
 * `hidden` e R3F non renderizza — vedi `.claude/CORRECTIONS.md`), e passare dal
 * login ad ogni iterazione rende la verifica visiva impraticabile.
 *
 * Non esiste in produzione: la rotta risponde 404 e il middleware la considera
 * pubblica solo fuori da `production` (`lib/supabase/middleware.ts`).
 */
export const metadata = { title: "ORMA — Sandbox tavolo" };

export default function TavoloDevPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return <TableExperience cards={[...DEMO_CARDS]} events={[...DEMO_EVENTS]} />;
}
