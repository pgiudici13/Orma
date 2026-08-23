import { redirect } from "next/navigation";
import { PaperPage } from "@/components/layout/PaperPage";
import { createClient } from "@/lib/supabase/server";
import { decidiRichiesta } from "./actions";

export const metadata = { title: "ORMA — Richieste Reparto" };

type RichiestaRow = {
  id: string;
  created_at: string;
  profiles: { nome: string } | null;
  reparto: { nome: string } | null;
};

export default async function RichiesteRepartoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: ownProfile } = await supabase
    .from("profiles")
    .select("is_admin, ruolo")
    .eq("id", user.id)
    .single();
  if (!ownProfile?.is_admin && ownProfile?.ruolo !== "capo") redirect("/");

  const { data: richieste } = (await supabase
    .from("richiesta_reparto")
    .select(
      "id, created_at, profiles!profile_id(nome), reparto!reparto_id(nome)",
    )
    .eq("stato", "in_attesa")
    .order("created_at")) as unknown as { data: RichiestaRow[] | null };

  return (
    <PaperPage>
      <p
        className="font-sans text-[10px] tracking-[0.16em] uppercase"
        style={{ color: "color-mix(in srgb, var(--ink) 60%, transparent)" }}
      >
        Admin
      </p>
      <h1
        className="font-serif text-3xl leading-tight"
        style={{ color: "var(--ink)" }}
      >
        Richieste Reparto
      </h1>

      <ul className="mt-8 flex flex-col gap-3">
        {(richieste ?? []).length === 0 ? (
          <p
            className="font-sans text-sm"
            style={{ color: "color-mix(in srgb, var(--ink) 60%, transparent)" }}
          >
            Nessuna richiesta in attesa.
          </p>
        ) : null}

        {(richieste ?? []).map((richiesta) => (
          <li
            key={richiesta.id}
            className="flex items-center gap-4 rounded-[3px] p-3"
            style={{
              backgroundColor: "var(--paper-base)",
              border:
                "1px solid color-mix(in srgb, var(--wood-dark) 22%, transparent)",
            }}
          >
            <div className="flex-1">
              <p
                className="font-serif text-sm leading-snug"
                style={{ color: "var(--ink)" }}
              >
                {richiesta.profiles?.nome ?? "Utente"} →{" "}
                {richiesta.reparto?.nome ?? "Reparto"}
              </p>
              <p
                className="mt-1 font-sans text-xs"
                style={{
                  color: "color-mix(in srgb, var(--ink) 60%, transparent)",
                }}
              >
                Richiesta il {richiesta.created_at.slice(0, 10)}
              </p>
            </div>

            <form
              action={decidiRichiesta.bind(null, richiesta.id, "approvata")}
            >
              <button
                type="submit"
                className="cursor-pointer font-sans text-[11px] tracking-wide underline underline-offset-2"
                style={{ color: "var(--accent)" }}
              >
                Approva
              </button>
            </form>
            <form
              action={decidiRichiesta.bind(null, richiesta.id, "rifiutata")}
            >
              <button
                type="submit"
                className="cursor-pointer font-sans text-[11px] tracking-wide underline underline-offset-2"
                style={{ color: "#b3382c" }}
              >
                Rifiuta
              </button>
            </form>
          </li>
        ))}
      </ul>
    </PaperPage>
  );
}
