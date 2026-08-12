import { createClient } from "@/lib/supabase/server";
import { startSpecialita } from "./actions";

export const metadata = { title: "ORMA — Catalogo Specialità" };

type SpecialitaRow = { id: string; nome: string };

export default async function SpecialitaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: specialita }, { data: attive }] = await Promise.all([
    supabase
      .from("specialita")
      .select("id, nome")
      .order("nome") as unknown as Promise<{ data: SpecialitaRow[] | null }>,
    user
      ? supabase
          .from("user_specialita")
          .select("specialita_id")
          .eq("profile_id", user.id)
      : Promise.resolve({ data: [] as { specialita_id: string }[] }),
  ]);

  const activeIds = new Set((attive ?? []).map((row) => row.specialita_id));

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
        Specialità
      </h1>
      <p
        className="mt-2 font-sans text-sm leading-relaxed"
        style={{ color: "color-mix(in srgb, var(--ink) 82%, transparent)" }}
      >
        Sfoglia le Specialità ufficiali e avvia quella che vuoi portare avanti.
        Il contenuto ufficiale non è modificabile: il tuo percorso è sempre
        personale.
      </p>

      <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {(specialita ?? []).map((item) => {
          const isActive = activeIds.has(item.id);
          return (
            <li
              key={item.id}
              className="flex flex-col justify-between gap-3 rounded-[3px] p-3"
              style={{
                backgroundColor: "var(--paper-base)",
                border:
                  "1px solid color-mix(in srgb, var(--wood-dark) 22%, transparent)",
              }}
            >
              <p
                className="font-serif text-sm leading-snug"
                style={{ color: "var(--ink)" }}
              >
                {item.nome}
              </p>

              {isActive ? (
                <span
                  className="font-sans text-[11px] tracking-wide"
                  style={{
                    color: "color-mix(in srgb, var(--ink) 55%, transparent)",
                  }}
                >
                  Già nel tuo percorso
                </span>
              ) : (
                <form action={startSpecialita.bind(null, item.id)}>
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
