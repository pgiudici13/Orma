"use client";

import { loadMaestri } from "@/app/actions/surfaces";
import { useSurfaceData } from "@/lib/scene/useSurfaceData";
import { SurfaceLoading } from "./SurfaceLoading";

/**
 * Rubrica dei Maestri (RD-T07): chi accompagna l'utente nel proprio percorso.
 *
 * Solo i propri. La ricerca globale dei Maestri è la Fase 8 e richiede prima un
 * meccanismo di visibilità esplicita (`docs/PERMISSIONS.md`): finché non
 * esiste, questa superficie non mostra nessuno che l'utente non abbia già
 * associato di persona.
 */
export function MaestriSurface() {
  const { data } = useSurfaceData("maestri", loadMaestri);

  if (!data) return <SurfaceLoading label="Apro la rubrica…" />;

  if (data.length === 0) {
    return (
      <p className="mt-6 font-sans text-sm leading-relaxed">
        Nessun Maestro associato al tuo percorso. Si aggiunge dalla carta della
        Specialità o della Competenza che stai portando avanti.
      </p>
    );
  }

  return (
    <ul className="mt-5 flex flex-col gap-2">
      {data.map((maestro) => (
        <li
          key={maestro.id}
          className="flex items-baseline justify-between gap-3 border-b pb-2 font-sans text-sm"
          style={{
            borderColor: "color-mix(in srgb, var(--ink) 12%, transparent)",
          }}
        >
          <span style={{ color: "var(--ink)" }}>
            {maestro.nome}
            {maestro.esterno ? (
              <span
                className="ml-2 text-[10px] tracking-wide uppercase"
                style={{
                  color: "color-mix(in srgb, var(--ink) 55%, transparent)",
                }}
              >
                esterno
              </span>
            ) : null}
          </span>
          <span
            className="shrink-0 font-serif text-[13px]"
            style={{ color: "color-mix(in srgb, var(--ink) 70%, transparent)" }}
          >
            {maestro.per}
          </span>
        </li>
      ))}
    </ul>
  );
}
