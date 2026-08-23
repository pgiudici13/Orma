import Link from "next/link";
import { redirect } from "next/navigation";
import { PaperPage } from "@/components/layout/PaperPage";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "ORMA — Admin" };

type ProfileRow = {
  id: string;
  nome: string;
  data_nascita: string;
  stato_consenso_genitoriale: string;
};

type ProgressRow = { profile_id: string; stato: string };
type TappaRow = { profile_id: string };

function countByStato(rows: ProgressRow[], profileId: string) {
  const mine = rows.filter((r) => r.profile_id === profileId);
  return {
    inCorso: mine.filter((r) => r.stato === "in_corso").length,
    completate: mine.filter((r) => r.stato === "completata").length,
  };
}

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: ownProfile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!ownProfile?.is_admin) redirect("/");

  const [
    { data: profiles },
    { data: specialita },
    { data: competenza },
    { data: tappa },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, nome, data_nascita, stato_consenso_genitoriale")
      .order("nome") as unknown as Promise<{ data: ProfileRow[] | null }>,
    supabase
      .from("user_specialita")
      .select("profile_id, stato") as unknown as Promise<{
      data: ProgressRow[] | null;
    }>,
    supabase
      .from("user_competenza")
      .select("profile_id, stato") as unknown as Promise<{
      data: ProgressRow[] | null;
    }>,
    supabase.from("user_tappa").select("profile_id") as unknown as Promise<{
      data: TappaRow[] | null;
    }>,
  ]);

  const specialitaRows = specialita ?? [];
  const competenzaRows = competenza ?? [];
  const tappaRows = tappa ?? [];

  return (
    <PaperPage larghezza="max-w-4xl">
      <p
        className="font-sans text-[10px] tracking-[0.16em] uppercase"
        style={{ color: "color-mix(in srgb, var(--ink) 60%, transparent)" }}
      >
        Solo lettura — visibilità admin (DEC-015)
      </p>
      <h1
        className="font-serif text-3xl leading-tight"
        style={{ color: "var(--ink)" }}
      >
        Utenti
      </h1>

      <Link
        href="/admin/richieste-reparto"
        className="mt-2 inline-block font-sans text-[11px] tracking-wide underline underline-offset-2"
        style={{ color: "var(--accent)" }}
      >
        Richieste Reparto in attesa
      </Link>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full border-collapse text-left font-sans text-sm">
          <thead>
            <tr
              style={{
                borderBottom:
                  "1px solid color-mix(in srgb, var(--wood-dark) 30%, transparent)",
              }}
            >
              <th className="py-2 pr-4">Nome</th>
              <th className="py-2 pr-4">Data di nascita</th>
              <th className="py-2 pr-4">Consenso</th>
              <th className="py-2 pr-4">Specialità</th>
              <th className="py-2 pr-4">Competenze</th>
              <th className="py-2 pr-4">Tappe</th>
            </tr>
          </thead>
          <tbody>
            {(profiles ?? []).map((profile) => {
              const spec = countByStato(specialitaRows, profile.id);
              const comp = countByStato(competenzaRows, profile.id);
              const tappeCount = tappaRows.filter(
                (r) => r.profile_id === profile.id,
              ).length;

              return (
                <tr
                  key={profile.id}
                  style={{
                    borderBottom:
                      "1px solid color-mix(in srgb, var(--ink) 12%, transparent)",
                  }}
                >
                  <td className="py-2 pr-4" style={{ color: "var(--ink)" }}>
                    {profile.nome}
                  </td>
                  <td className="py-2 pr-4">{profile.data_nascita}</td>
                  <td className="py-2 pr-4">
                    {profile.stato_consenso_genitoriale}
                  </td>
                  <td className="py-2 pr-4">
                    {spec.inCorso} in corso, {spec.completate} completate
                  </td>
                  <td className="py-2 pr-4">
                    {comp.inCorso} in corso, {comp.completate} completate
                  </td>
                  <td className="py-2 pr-4">{tappeCount}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </PaperPage>
  );
}
