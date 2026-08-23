"use client";

import { decidiRichiesta } from "@/app/admin/richieste-reparto/actions";
import { loadRepartoSurface } from "@/app/actions/surfaces";
import { MembriSection } from "@/components/reparto/MembriSection";
import type { RichiestaData } from "@/lib/queries/reparto";
import { useSurfaceData } from "@/lib/scene/useSurfaceData";
import { PanelSection } from "../PanelSection";
import { SurfaceLoading } from "./SurfaceLoading";

/**
 * Superficie della cassetta di Reparto: chi ne fa parte e, per i Capi, chi ha
 * chiesto di entrare.
 *
 * Sostituisce la pagina piena `/reparto` (RD-T06): le stesse informazioni,
 * dentro l'esperienza del tavolo. La consultazione resta limitata alle
 * informazioni scout pertinenti — data di nascita, contatti del genitore e note
 * personali non vengono nemmeno richieste al database (`lib/queries/reparto.ts`).
 */
export function RepartoSurface() {
  const { data, loading, reload } = useSurfaceData(
    "reparto",
    loadRepartoSurface,
  );

  if (!data) return <SurfaceLoading label="Apro la cassetta di Reparto…" />;

  if (!data.repartoNome) {
    return (
      <PanelSection title="Reparto">
        <p className="font-sans text-sm leading-relaxed">
          Non fai ancora parte di un Reparto. La busta sul tavolo serve a
          chiederne l&apos;adesione.
        </p>
      </PanelSection>
    );
  }

  return (
    <div className="mt-5 flex flex-col gap-6" aria-busy={loading}>
      <div
        className="flex items-baseline justify-between gap-4 border-b pb-3"
        style={{
          borderColor: "color-mix(in srgb, var(--ink) 14%, transparent)",
        }}
      >
        <p className="font-serif text-lg" style={{ color: "var(--ink)" }}>
          {data.repartoNome}
        </p>
        <p
          className="font-sans text-[11px] tracking-wide uppercase"
          style={{ color: "color-mix(in srgb, var(--ink) 60%, transparent)" }}
        >
          {data.isCapo ? "Capo Reparto" : "Esploratore / Guida"}
        </p>
      </div>

      {data.isCapoOrAdmin && data.richieste.length > 0 ? (
        <RichiesteSection richieste={data.richieste} onDecided={reload} />
      ) : null}

      <MembriSection members={data.members} />
    </div>
  );
}

/**
 * Richieste di adesione ancora da decidere. Visibile solo a chi può davvero
 * decidere: la scrittura passa comunque da `decidi_richiesta_reparto()`, che
 * verifica il permesso lato database (DEC-017).
 */
function RichiesteSection({
  richieste,
  onDecided,
}: {
  richieste: RichiestaData[];
  onDecided: () => void;
}) {
  return (
    <PanelSection title="Richieste di adesione">
      <ul className="flex flex-col gap-2">
        {richieste.map((richiesta) => (
          <li
            key={richiesta.id}
            className="flex items-center justify-between gap-3 rounded-[2px] p-2.5"
            style={{
              backgroundColor:
                "color-mix(in srgb, var(--paper-aged) 55%, transparent)",
            }}
          >
            <div className="font-sans text-sm">
              <p style={{ color: "var(--ink)" }}>{richiesta.nome}</p>
              <p
                className="text-[11px]"
                style={{
                  color: "color-mix(in srgb, var(--ink) 60%, transparent)",
                }}
              >
                {richiesta.repartoNome} · {richiesta.creataIl}
              </p>
            </div>

            <div className="flex shrink-0 gap-3">
              <form
                action={async () => {
                  await decidiRichiesta(richiesta.id, "approvata");
                  onDecided();
                }}
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
                action={async () => {
                  await decidiRichiesta(richiesta.id, "rifiutata");
                  onDecided();
                }}
              >
                <button
                  type="submit"
                  className="cursor-pointer font-sans text-[11px] tracking-wide underline underline-offset-2"
                  style={{
                    color: "color-mix(in srgb, var(--ink) 65%, transparent)",
                  }}
                >
                  Rifiuta
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </PanelSection>
  );
}
