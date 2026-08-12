import { createClient } from "@/lib/supabase/server";
import { startCompetenza } from "./actions";

export const metadata = { title: "ORMA — Catalogo Competenze" };

type CompetenzaRow = { id: string; nome: string; descrizione: string | null };

export default async function CompetenzePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: competenze }, { data: attive }] = await Promise.all([
    supabase
      .from("competenza")
      .select("id, nome, descrizione")
      .order("nome") as unknown as Promise<{ data: CompetenzaRow[] | null }>,
    user
      ? supabase
          .from("user_competenza")
          .select("competenza_id")
          .eq("profile_id", user.id)
      : Promise.resolve({ data: [] as { competenza_id: string }[] }),
  ]);

  const activeIds = new Set((attive ?? []).map((row) => row.competenza_id));

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p
        className="font-sans text-[10px] tracking-[0.16em] uppercase"
        style={{ color: "color-mix(in srgb, var(--ink) 60%, transparent)" }}
      >
        Catalogo ufficiale
      </p>
      <h1
        className="font-serif text-3xl leading-tight"
        style={{ color: "var(--ink)" }}
      >
        Competenze
      </h1>
      <p
        className="mt-2 font-sans text-sm leading-relaxed"
        style={{ color: "color-mix(in srgb, var(--ink) 82%, transparent)" }}
      >
        Le Competenze sono progetti personalizzati, non un catalogo di
        distintivi: queste voci sono un punto di partenza, non un elenco chiuso.
      </p>

      <ul className="mt-8 flex flex-col gap-3">
        {(competenze ?? []).map((item) => {
          const isActive = activeIds.has(item.id);
          return (
            <li
              key={item.id}
              className="flex items-start justify-between gap-4 rounded-[3px] p-3"
              style={{
                backgroundColor: "var(--paper-base)",
                border:
                  "1px solid color-mix(in srgb, var(--wood-dark) 22%, transparent)",
              }}
            >
              <div>
                <p
                  className="font-serif text-sm leading-snug"
                  style={{ color: "var(--ink)" }}
                >
                  {item.nome}
                </p>
                {item.descrizione ? (
                  <p
                    className="mt-1 font-sans text-xs leading-relaxed"
                    style={{
                      color: "color-mix(in srgb, var(--ink) 70%, transparent)",
                    }}
                  >
                    {item.descrizione}
                  </p>
                ) : null}
              </div>

              {isActive ? (
                <span
                  className="shrink-0 font-sans text-[11px] tracking-wide"
                  style={{
                    color: "color-mix(in srgb, var(--ink) 55%, transparent)",
                  }}
                >
                  Già nel tuo percorso
                </span>
              ) : (
                <form
                  action={startCompetenza.bind(null, item.id)}
                  className="shrink-0"
                >
                  <button
                    type="submit"
                    className="cursor-pointer font-sans text-[11px] tracking-wide underline underline-offset-2"
                    style={{ color: "var(--accent)" }}
                  >
                    Avvia
                  </button>
                </form>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
