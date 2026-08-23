import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RepartoTabs } from "./RepartoTabs";
import type { MemberData } from "./MembriSection";
import type { SquadrigliaData } from "./SquadriglieSection";
import type { EventoData } from "@/lib/scene/objects";

export const metadata = { title: "ORMA — Reparto" };

type ProfileDbRow = {
  id: string;
  nome: string;
  ruolo: string;
  squadriglia_id: string | null;
  squadriglia: { id: string; nome: string } | null;
};

type SpecialitaDbRow = {
  profile_id: string;
  specialita: { id: string; nome: string; slug: string } | null;
};

type CompetenzaDbRow = {
  profile_id: string;
  competenza: { id: string; nome: string; slug: string } | null;
};

type TappaDbRow = {
  profile_id: string;
  data_inizio: string;
  data_completamento: string | null;
  tappa: { id: string; nome: string; ordine: number } | null;
};

type EventoDbRow = {
  id: string;
  titolo: string;
  descrizione: string | null;
  tipo: "uscita" | "campo" | "riunione" | "altro";
  data_inizio: string;
  data_fine: string | null;
  luogo: string | null;
  created_at: string;
};

type SquadrigliaDbRow = {
  id: string;
  nome: string;
  created_at: string;
};

export default async function RepartoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: ownProfile } = (await supabase
    .from("profiles")
    .select(
      "id, nome, ruolo, is_admin, stato_consenso_genitoriale, reparto_id, squadriglia_id, reparto:reparto_id(id, nome)",
    )
    .eq("id", user.id)
    .single()) as unknown as {
    data: {
      id: string;
      nome: string;
      ruolo: string;
      is_admin: boolean;
      stato_consenso_genitoriale: string;
      reparto_id: string | null;
      squadriglia_id: string | null;
      reparto: { id: string; nome: string } | null;
    } | null;
  };

  if (ownProfile?.stato_consenso_genitoriale === "in_attesa") {
    redirect("/attesa-consenso");
  }

  // Se l'utente non fa parte di un Reparto
  if (!ownProfile?.reparto_id || !ownProfile.reparto) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <div className="mb-6">
          <Link
            href="/"
            className="font-sans text-xs underline underline-offset-2"
            style={{ color: "var(--accent)" }}
          >
            ← Torna al Tavolo
          </Link>
        </div>

        <p
          className="font-sans text-[10px] tracking-[0.16em] uppercase"
          style={{ color: "color-mix(in srgb, var(--ink) 60%, transparent)" }}
        >
          Comunità scout
        </p>
        <h1
          className="font-serif text-3xl leading-tight mt-1"
          style={{ color: "var(--ink)" }}
        >
          Il tuo Reparto
        </h1>

        <div
          className="mt-8 p-6 rounded-[3px] flex flex-col gap-4 shadow-sm"
          style={{
            backgroundColor: "var(--paper-base)",
            border:
              "1px solid color-mix(in srgb, var(--wood-dark) 22%, transparent)",
          }}
        >
          <p className="font-sans text-sm leading-relaxed" style={{ color: "var(--ink)" }}>
            Non risulti ancora associato a un Reparto. Per accedere all&apos;elenco
            membri, alle Squadriglie e al Calendario, richiedi l&apos;adesione al tuo
            Reparto.
          </p>

          <Link
            href="/onboarding-reparto"
            className="self-start rounded-[2px] px-4 py-2 font-sans text-xs font-medium tracking-wide"
            style={{
              backgroundColor: "var(--accent)",
              color: "#fff",
            }}
          >
            Richiedi adesione a un Reparto →
          </Link>
        </div>
      </main>
    );
  }

  const repartoId = ownProfile.reparto_id;
  const isCapoOrAdmin = ownProfile.ruolo === "capo" || ownProfile.is_admin;

  // Caricamento parallelo di membri, squadriglie, eventi e percorso scout
  const [
    profilesRes,
    squadriglieRes,
    eventiRes,
    specialitaRes,
    competenzeRes,
    tappeRes,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, nome, ruolo, squadriglia_id, squadriglia:squadriglia_id(id, nome)")
      .eq("reparto_id", repartoId)
      .neq("stato_consenso_genitoriale", "in_attesa")
      .order("nome"),
    supabase
      .from("squadriglia")
      .select("id, nome, created_at")
      .eq("reparto_id", repartoId)
      .order("nome"),
    supabase
      .from("evento")
      .select("id, titolo, descrizione, tipo, data_inizio, data_fine, luogo, created_at")
      .eq("reparto_id", repartoId)
      .order("data_inizio", { ascending: true }),
    supabase
      .from("user_specialita")
      .select("profile_id, specialita:specialita_id(id, nome, slug)")
      .eq("stato", "completata"),
    supabase
      .from("user_competenza")
      .select("profile_id, competenza:competenza_id(id, nome, slug)")
      .eq("stato", "completata"),
    supabase
      .from("user_tappa")
      .select("profile_id, data_inizio, data_completamento, tappa:tappa_id(id, nome, ordine)")
      .order("created_at", { ascending: true }),
  ]);

  const profilesDb = (profilesRes.data ?? []) as unknown as ProfileDbRow[];
  const squadriglieDb = (squadriglieRes.data ?? []) as unknown as SquadrigliaDbRow[];
  const eventiDb = (eventiRes.data ?? []) as unknown as EventoDbRow[];
  const specialitaDb = (specialitaRes.data ?? []) as unknown as SpecialitaDbRow[];
  const competenzeDb = (competenzeRes.data ?? []) as unknown as CompetenzaDbRow[];
  const tappeDb = (tappeRes.data ?? []) as unknown as TappaDbRow[];

  // Mappa delle specialità completate per profilo
  const specMap = new Map<string, { id: string; nome: string; slug?: string }[]>();
  for (const s of specialitaDb) {
    if (!s.specialita) continue;
    const list = specMap.get(s.profile_id) ?? [];
    list.push({ id: s.specialita.id, nome: s.specialita.nome, slug: s.specialita.slug });
    specMap.set(s.profile_id, list);
  }

  // Mappa delle competenze completate per profilo
  const compMap = new Map<string, { id: string; nome: string }[]>();
  for (const c of competenzeDb) {
    if (!c.competenza) continue;
    const list = compMap.get(c.profile_id) ?? [];
    list.push({ id: c.competenza.id, nome: c.competenza.nome });
    compMap.set(c.profile_id, list);
  }

  // Mappa dell'ultima tappa per profilo
  const tappaMap = new Map<string, string>();
  for (const t of tappeDb) {
    if (!t.tappa) continue;
    tappaMap.set(t.profile_id, t.tappa.nome);
  }

  const members: MemberData[] = profilesDb.map((p) => ({
    id: p.id,
    nome: p.nome,
    ruolo: p.ruolo,
    squadrigliaId: p.squadriglia_id,
    squadrigliaNome: p.squadriglia?.nome ?? null,
    specialitaCompletate: specMap.get(p.id) ?? [],
    competenzeCompletate: compMap.get(p.id) ?? [],
    tappaAttuale: tappaMap.get(p.id) ?? null,
  }));

  const squadriglie: SquadrigliaData[] = squadriglieDb.map((sq) => ({
    id: sq.id,
    nome: sq.nome,
    created_at: sq.created_at,
  }));

  const events: EventoData[] = eventiDb.map((e) => ({
    id: e.id,
    titolo: e.titolo,
    descrizione: e.descrizione ?? undefined,
    tipo: e.tipo,
    dataInizio: e.data_inizio,
    dataFine: e.data_fine ?? undefined,
    luogo: e.luogo ?? undefined,
  }));

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="font-sans text-xs underline underline-offset-2"
          style={{ color: "var(--accent)" }}
        >
          ← Torna al Tavolo
        </Link>
        <Link
          href="/impostazioni"
          className="font-sans text-xs underline underline-offset-2"
          style={{ color: "color-mix(in srgb, var(--ink) 60%, transparent)" }}
        >
          Impostazioni
        </Link>
      </div>

      <header className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b pb-6 mb-8" style={{ borderColor: "color-mix(in srgb, var(--ink) 18%, transparent)" }}>
        <div>
          <p
            className="font-sans text-[10px] tracking-[0.18em] uppercase font-semibold"
            style={{ color: "color-mix(in srgb, var(--ink) 60%, transparent)" }}
          >
            Reparto AGESCI
          </p>
          <h1
            className="font-serif text-3xl sm:text-4xl font-bold leading-tight mt-1"
            style={{ color: "var(--ink)" }}
          >
            {ownProfile.reparto.nome}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {ownProfile.ruolo === "capo" ? (
            <span
              className="rounded px-2.5 py-1 text-xs font-sans font-semibold tracking-wide uppercase"
              style={{
                backgroundColor: "color-mix(in srgb, var(--accent) 18%, transparent)",
                color: "var(--accent)",
              }}
            >
              👑 Capo Reparto
            </span>
          ) : (
            <span
              className="rounded px-2.5 py-1 text-xs font-sans font-medium tracking-wide uppercase"
              style={{
                backgroundColor: "color-mix(in srgb, var(--ink) 10%, transparent)",
                color: "var(--ink)",
              }}
            >
              Esploratore / Guida
            </span>
          )}
        </div>
      </header>

      <RepartoTabs
        members={members}
        squadriglie={squadriglie}
        events={events}
        isCapoOrAdmin={isCapoOrAdmin}
      />
    </main>
  );
}
