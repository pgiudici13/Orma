import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfiloForm } from "@/components/settings/ProfiloForm";
import { logout } from "./actions";

export const metadata = { title: "ORMA — Impostazioni" };

export default async function ImpostazioniPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = (await supabase
    .from("profiles")
    .select("nome, data_nascita, reparto:reparto_id(nome)")
    .eq("id", user.id)
    .single()) as unknown as {
    data: {
      nome: string;
      data_nascita: string;
      reparto: { nome: string } | null;
    } | null;
  };

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <p
        className="font-sans text-[10px] tracking-[0.16em] uppercase"
        style={{ color: "color-mix(in srgb, var(--ink) 60%, transparent)" }}
      >
        Il tuo profilo
      </p>
      <h1
        className="font-serif text-3xl leading-tight"
        style={{ color: "var(--ink)" }}
      >
        Impostazioni
      </h1>

      <div className="mt-8 flex flex-col gap-6">
        <ProfiloForm nome={profile?.nome ?? ""} />

        <dl className="font-sans text-sm">
          <dt
            className="text-[11px] tracking-wide uppercase"
            style={{ color: "color-mix(in srgb, var(--ink) 55%, transparent)" }}
          >
            Data di nascita
          </dt>
          <dd className="mt-1" style={{ color: "var(--ink)" }}>
            {profile?.data_nascita}
          </dd>

          <dt
            className="mt-4 text-[11px] tracking-wide uppercase"
            style={{ color: "color-mix(in srgb, var(--ink) 55%, transparent)" }}
          >
            Reparto
          </dt>
          <dd className="mt-1" style={{ color: "var(--ink)" }}>
            {profile?.reparto?.nome ?? "—"}
          </dd>
        </dl>

        <form action={logout}>
          <button
            type="submit"
            className="cursor-pointer font-sans text-[11px] tracking-wide underline underline-offset-2"
            style={{ color: "#b3382c" }}
          >
            Esci
          </button>
        </form>
      </div>
    </main>
  );
}
