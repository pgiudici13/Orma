"use client";

import { useCallback, useState } from "react";
import { loadCatalogo } from "@/app/actions/surfaces";
import { startCompetenza } from "@/app/competenze/actions";
import { startSpecialita } from "@/app/specialita/actions";
import { startTappa } from "@/app/tappe/actions";
import type { CatalogoVoce } from "@/lib/queries/percorso";
import type { ContentKind, SceneObject } from "@/lib/scene/objects";
import { useSurfaceData } from "@/lib/scene/useSurfaceData";
import { SurfaceLoading } from "./SurfaceLoading";

/**
 * Catalogo ufficiale di una famiglia di contenuto, con lo stato del proprio
 * percorso (RD-T07): l'album dei distintivi, il quaderno delle Competenze, la
 * mappa delle Tappe.
 *
 * Sostituisce le pagine `/specialita`, `/competenze`, `/tappe`. Il contenuto
 * ufficiale non è modificabile da qui: l'unica azione è avviare il proprio
 * percorso verso una voce, che crea una relazione personale separata.
 */

const KIND_BY_OBJECT: Partial<Record<SceneObject["kind"], ContentKind>> = {
  album: "specialita",
  quaderno: "competenza",
  mappa: "tappa",
};

const START_ACTION: Record<ContentKind, (id: string) => Promise<void>> = {
  specialita: startSpecialita,
  competenza: startCompetenza,
  tappa: startTappa,
};

const EMPTY_LABEL: Record<ContentKind, string> = {
  specialita: "Nessuna Specialità nel catalogo.",
  competenza: "Nessuna Competenza nel catalogo.",
  tappa: "Nessuna Tappa nel catalogo.",
};

const OPENING_LABEL: Record<ContentKind, string> = {
  specialita: "Sfoglio l'album dei distintivi…",
  competenza: "Apro il quaderno…",
  tappa: "Srotolo la mappa…",
};

export function CatalogoSurface({ object }: { object: SceneObject }) {
  const kind = KIND_BY_OBJECT[object.kind] ?? "specialita";
  const load = useCallback(() => loadCatalogo(kind), [kind]);
  const { data, reload } = useSurfaceData(`catalogo:${kind}`, load);

  if (!data) return <SurfaceLoading label={OPENING_LABEL[kind]} />;

  if (data.voci.length === 0) {
    return (
      <p className="mt-6 font-sans text-sm leading-relaxed">
        {EMPTY_LABEL[kind]}
      </p>
    );
  }

  return (
    <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
      {data.voci.map((voce) => (
        <VoceCatalogo
          key={voce.id}
          voce={voce}
          kind={kind}
          onStarted={reload}
        />
      ))}
    </ul>
  );
}

const STATO_LABEL: Record<"in_corso" | "completata", string> = {
  in_corso: "In corso",
  completata: "Completata",
};

function VoceCatalogo({
  voce,
  kind,
  onStarted,
}: {
  voce: CatalogoVoce;
  kind: ContentKind;
  onStarted: () => void;
}) {
  const [error, setError] = useState<string | null>(null);

  return (
    <li
      className="flex flex-col justify-between gap-2 rounded-[3px] p-3"
      style={{
        backgroundColor:
          "color-mix(in srgb, var(--paper-aged) 55%, transparent)",
        border:
          "1px solid color-mix(in srgb, var(--wood-dark) 18%, transparent)",
      }}
    >
      <div className="flex flex-col gap-1">
        {voce.imageUrl ? (
          // Distintivo ufficiale: immagine, non decorazione generata.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={voce.imageUrl}
            alt=""
            className="mb-1 h-16 w-16 self-center object-contain"
            loading="lazy"
          />
        ) : null}
        <span
          className="font-serif text-sm leading-snug"
          style={{ color: "var(--ink)" }}
        >
          {voce.nome}
        </span>
        {voce.descrizione ? (
          <span
            className="font-sans text-[11px] leading-relaxed"
            style={{ color: "var(--ink-muted-strong)" }}
          >
            {voce.descrizione}
          </span>
        ) : null}
      </div>

      {voce.stato ? (
        <span
          className="font-sans text-[10px] tracking-wide uppercase"
          style={{ color: "var(--ink-muted)" }}
        >
          {STATO_LABEL[voce.stato]}
        </span>
      ) : (
        <form
          action={async () => {
            try {
              await START_ACTION[kind](voce.id);
              onStarted();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Errore imprevisto.");
            }
          }}
        >
          <button
            type="submit"
            className="cursor-pointer font-sans text-[11px] tracking-wide underline underline-offset-2"
            style={{ color: "var(--accent)" }}
          >
            Avvia il percorso
          </button>
        </form>
      )}
      {error ? (
        <p className="font-sans text-[11px]" style={{ color: "#b3382c" }}>
          {error}
        </p>
      ) : null}
    </li>
  );
}
