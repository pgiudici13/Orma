import { createClient } from "@/lib/supabase/server";
import { distintivoPublicUrl } from "@/lib/supabase/storage";
import { markTappaCompleted, startTappa } from "./actions";

export const metadata = { title: "ORMA — Tappe" };

type TappaRow = {
  id: string;
  nome: string;
  ordine: number;
  immagine_path: string | null;
};

type UserTappaRow = {
  tappa_id: string;
  data_inizio: string;
  data_completamento: string | null;
};

export default async function TappePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: tappe }, { data: attive }, specialitaCount, competenzaCount] =
    await Promise.all([
      supabase
        .from("tappa")
        .select("id, nome, ordine, immagine_path")
        .order("ordine") as unknown as Promise<{ data: TappaRow[] | null }>,
      user
        ? (supabase
            .from("user_tappa")
            .select("tappa_id, data_inizio, data_completamento")
            .eq("profile_id", user.id) as unknown as Promise<{
            data: UserTappaRow[] | null;
          }>)
        : Promise.resolve({ data: [] as UserTappaRow[] }),
      user
        ? supabase
            .from("user_specialita")
            .select("id", { count: "exact", head: true })
            .eq("profile_id", user.id)
            .eq("stato", "completata")
        : Promise.resolve({ count: 0 }),
      user
        ? supabase
            .from("user_competenza")
            .select("id", { count: "exact", head: true })
            .eq("profile_id", user.id)
            .eq("stato", "completata")
        : Promise.resolve({ count: 0 }),
    ]);

  const progressByTappa = new Map(
    (attive ?? []).map((row) => [row.tappa_id, row]),
  );
  const completedSpecialita = specialitaCount.count ?? 0;
  const completedCompetenza = competenzaCount.count ?? 0;

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <p
        className="font-sans text-[10px] tracking-[0.16em] uppercase"
        style={{ color: "color-mix(in srgb, var(--ink) 60%, transparent)" }}
      >
        Percorso ufficiale
      </p>
      <h1
        className="font-serif text-3xl leading-tight"
        style={{ color: "var(--ink)" }}
      >
        Tappe
      </h1>
      <p
        className="mt-2 font-sans text-sm leading-relaxed"
        style={{ color: "color-mix(in srgb, var(--ink) 82%, transparent)" }}
      >
        {completedSpecialita} Specialità e {completedCompetenza} Competenze
        completate finora — nessuna regola di sblocco automatico: è
        un&apos;informazione, non un vincolo.
      </p>

      <ul className="mt-8 flex flex-col gap-3">
        {(tappe ?? []).map((item) => {
          const progress = progressByTappa.get(item.id);
          const imageUrl = distintivoPublicUrl(supabase, item.immagine_path);

          return (
            <li
              key={item.id}
              className="flex items-center gap-4 rounded-[3px] p-3"
              style={{
                backgroundColor: "var(--paper-base)",
                border:
                  "1px solid color-mix(in srgb, var(--wood-dark) 22%, transparent)",
              }}
            >
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- asset piccolo servito da Supabase Storage, non ottimizzabile via next/image senza dominio remoto configurato.
                <img
                  src={imageUrl}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-[2px] object-cover"
                />
              ) : null}

              <div className="flex-1">
                <p
                  className="font-serif text-sm leading-snug"
                  style={{ color: "var(--ink)" }}
                >
                  {item.nome}
                </p>
                <p
                  className="mt-1 font-sans text-xs"
                  style={{
                    color: "color-mix(in srgb, var(--ink) 60%, transparent)",
                  }}
                >
                  {progress
                    ? progress.data_completamento
                      ? `Completata il ${progress.data_completamento}`
                      : `Avviata il ${progress.data_inizio}`
                    : "Non ancora avviata"}
                </p>
              </div>

              {!progress ? (
                <form action={startTappa.bind(null, item.id)}>
                  <button
                    type="submit"
                    className="cursor-pointer font-sans text-[11px] tracking-wide underline underline-offset-2"
                    style={{ color: "var(--accent)" }}
                  >
                    Avvia
                  </button>
                </form>
              ) : !progress.data_completamento ? (
                <form action={markTappaCompleted.bind(null, item.id)}>
                  <button
                    type="submit"
                    className="cursor-pointer font-sans text-[11px] tracking-wide underline underline-offset-2"
                    style={{ color: "var(--accent)" }}
                  >
                    Segna come completata
                  </button>
                </form>
              ) : null}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
