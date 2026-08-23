import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RichiediRepartoForm } from "./RichiediRepartoForm";

export const metadata = { title: "ORMA — Associazione al Reparto" };

type RepartoRow = { id: string; nome: string };
type RichiestaRow = { stato: "in_attesa" | "approvata" | "rifiutata" };

export default async function OnboardingRepartoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: ownProfile } = await supabase
    .from("profiles")
    .select("reparto_id")
    .eq("id", user.id)
    .single();
  if (ownProfile?.reparto_id) redirect("/");

  const [{ data: reparti }, { data: ultimaRichiesta }] = await Promise.all([
    supabase
      .from("reparto")
      .select("id, nome")
      .order("nome") as unknown as Promise<{ data: RepartoRow[] | null }>,
    supabase
      .from("richiesta_reparto")
      .select("stato")
      .eq("profile_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle() as unknown as Promise<{ data: RichiestaRow | null }>,
  ]);

  const inAttesa = ultimaRichiesta?.stato === "in_attesa";

  return (
    <main
      className="flex min-h-full flex-1 items-center justify-center px-6 py-16"
      style={{
        backgroundColor: "color-mix(in srgb, var(--wood-dark) 88%, black)",
      }}
    >
      <div
        className="w-full max-w-md rounded-[3px] p-8 shadow-sm"
        style={{
          backgroundColor: "var(--paper-base)",
          border:
            "1px solid color-mix(in srgb, var(--wood-dark) 22%, transparent)",
        }}
      >
        <p
          className="font-sans text-[10px] tracking-[0.16em] uppercase"
          style={{ color: "color-mix(in srgb, var(--ink) 60%, transparent)" }}
        >
          Prima di entrare
        </p>
        <h1
          className="font-serif text-3xl leading-tight"
          style={{ color: "var(--ink)" }}
        >
          Associazione al Reparto
        </h1>

        {inAttesa ? (
          <p
            className="mt-4 font-sans text-sm leading-relaxed"
            style={{ color: "color-mix(in srgb, var(--ink) 82%, transparent)" }}
          >
            La tua richiesta è in attesa di approvazione da parte di un admin.
            Riprova più tardi.
          </p>
        ) : (
          <>
            <p
              className="mt-4 font-sans text-sm leading-relaxed"
              style={{
                color: "color-mix(in srgb, var(--ink) 82%, transparent)",
              }}
            >
              {ultimaRichiesta?.stato === "rifiutata"
                ? "La tua richiesta precedente è stata rifiutata. Puoi inviarne una nuova."
                : "Per accedere al tuo tavolo, richiedi l'associazione al tuo Reparto."}
            </p>
            <RichiediRepartoForm reparti={reparti ?? []} />
          </>
        )}
      </div>
    </main>
  );
}
