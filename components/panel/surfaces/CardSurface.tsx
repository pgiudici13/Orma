"use client";

import {
  addMaestroEsterno,
  addNota,
  assignMaestroInterno,
  deleteNota,
  markCompleted,
  updateNota,
} from "@/app/actions/personalProgress";
import type { CardData, ContentKind, SceneObject } from "@/lib/scene/objects";
import { PanelSection } from "../PanelSection";

/**
 * Superficie di una carta di Specialità/Competenza/Tappa.
 *
 * L'ordine delle sezioni è quello prescritto da `docs/UX.md`:
 * contenuto ufficiale → progressi → note → Maestro. Il contenuto ufficiale non
 * è mai modificabile: le sezioni successive sono il percorso personale, tenuto
 * visivamente separato (`CLAUDE.md`, "Official vs personal data").
 *
 * È anche la superficie di ripiego per gli oggetti che non ne hanno ancora una
 * dedicata (taccuino, foglio): mostra gli stessi segnaposto, senza inventare
 * contenuto che il modello dati non ha.
 */
export function CardSurface({ object }: { object: SceneObject }) {
  return (
    <>
      <PanelSection title="Contenuto ufficiale">
        {object.card ? (
          <p className="font-serif text-sm leading-relaxed">
            {object.card.title}
            {/* Nessun testo descrittivo ufficiale nel modello dati attuale
                (solo nome e immagine, P3-T01): nessun testo va inventato. */}
          </p>
        ) : (
          <p className="font-serif text-sm leading-relaxed italic">
            Il testo ufficiale di questa carta non è ancora stato caricato.
          </p>
        )}
      </PanelSection>

      <PanelSection title="Progresso">
        {object.card ? (
          <ProgressoSection kind={object.card.kind} card={object.card} />
        ) : (
          <p className="font-sans text-sm leading-relaxed">
            Nessun obiettivo registrato.
          </p>
        )}
      </PanelSection>

      <PanelSection title="Note personali">
        {object.card ? (
          <NoteSection kind={object.card.kind} card={object.card} />
        ) : (
          <p className="font-sans text-sm leading-relaxed">
            Non hai ancora scritto note su questa carta.
          </p>
        )}
      </PanelSection>

      {object.kind !== "tappa" ? (
        <PanelSection title="Maestro">
          {object.card && object.card.kind !== "tappa" ? (
            <MaestroSection kind={object.card.kind} card={object.card} />
          ) : (
            <p className="font-sans text-sm leading-relaxed">
              Nessun Maestro associato.
            </p>
          )}
        </PanelSection>
      ) : null}
    </>
  );
}

const STATO_LABEL: Record<NonNullable<CardData["stato"]>, string> = {
  in_corso: "In corso",
  completata: "Completata",
};

function ProgressoSection({
  kind,
  card,
}: {
  kind: ContentKind;
  card: CardData;
}) {
  const canComplete =
    (kind === "specialita" || kind === "competenza") &&
    card.stato === "in_corso";

  return (
    <div className="flex flex-col gap-2 font-sans text-sm leading-relaxed">
      <p>
        {card.stato ? STATO_LABEL[card.stato] : "In corso"}
        {card.dataInizio ? ` — avviata il ${card.dataInizio}` : ""}
        {card.dataCompletamento
          ? `, completata il ${card.dataCompletamento}`
          : ""}
      </p>

      {canComplete ? (
        <form action={markCompleted.bind(null, kind, card.id)}>
          <button
            type="submit"
            className="cursor-pointer text-[11px] tracking-wide underline underline-offset-2"
            style={{ color: "var(--accent)" }}
          >
            Segna come completata
          </button>
        </form>
      ) : null}
    </div>
  );
}

const fieldStyle = {
  backgroundColor: "var(--paper-base)",
  border: "1px solid color-mix(in srgb, var(--wood-dark) 22%, transparent)",
  color: "var(--ink)",
} as const;

const linkButtonStyle = { color: "var(--accent)" } as const;

function NoteSection({ kind, card }: { kind: ContentKind; card: CardData }) {
  return (
    <div className="flex flex-col gap-3 font-sans text-sm leading-relaxed">
      {card.note.length === 0 ? (
        <p>Non hai ancora scritto note su questa carta.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {card.note.map((nota) => (
            <li
              key={nota.id}
              className="flex flex-col gap-2 rounded-[2px] p-2"
              style={{
                backgroundColor:
                  "color-mix(in srgb, var(--paper-aged) 55%, transparent)",
              }}
            >
              <form
                action={updateNota.bind(null, nota.id)}
                className="flex flex-col gap-2"
              >
                <textarea
                  name="testo"
                  rows={2}
                  defaultValue={nota.testo}
                  required
                  aria-label="Modifica nota"
                  className="rounded-[2px] p-2 text-sm"
                  style={fieldStyle}
                />
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="cursor-pointer text-[11px] tracking-wide underline underline-offset-2"
                    style={linkButtonStyle}
                  >
                    Salva modifiche
                  </button>
                </div>
              </form>
              <form action={deleteNota.bind(null, nota.id)}>
                <button
                  type="submit"
                  className="cursor-pointer text-[11px] tracking-wide underline underline-offset-2"
                  style={linkButtonStyle}
                >
                  Elimina
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <form action={addNota} className="flex flex-col gap-2">
        <input type="hidden" name="tipo" value={kind} />
        <input type="hidden" name="riferimentoId" value={card.id} />
        <textarea
          name="testo"
          rows={2}
          placeholder="Aggiungi una nota…"
          required
          aria-label="Aggiungi una nota"
          className="rounded-[2px] p-2 text-sm"
          style={fieldStyle}
        />
        <button
          type="submit"
          className="cursor-pointer self-start text-[11px] tracking-wide underline underline-offset-2"
          style={linkButtonStyle}
        >
          Salva nota
        </button>
      </form>
    </div>
  );
}

function MaestroSection({
  kind,
  card,
}: {
  kind: "specialita" | "competenza";
  card: CardData;
}) {
  if (card.maestroNome) {
    return (
      <p className="font-sans text-sm leading-relaxed">{card.maestroNome}</p>
    );
  }

  return (
    <div className="flex flex-col gap-4 font-sans text-sm leading-relaxed">
      <p>Nessun Maestro associato.</p>

      <form
        action={assignMaestroInterno.bind(null, kind, card.id)}
        className="flex flex-col gap-2"
      >
        <label className="text-[11px] tracking-wide uppercase opacity-70">
          Maestro ORMA (email)
        </label>
        <input
          type="email"
          name="email"
          placeholder="email@esempio.it"
          required
          className="rounded-[2px] p-2 text-sm"
          style={fieldStyle}
        />
        <button
          type="submit"
          className="cursor-pointer self-start text-[11px] tracking-wide underline underline-offset-2"
          style={linkButtonStyle}
        >
          Associa Maestro ORMA
        </button>
      </form>

      <form
        action={addMaestroEsterno.bind(null, kind, card.id)}
        className="flex flex-col gap-2"
      >
        <label className="text-[11px] tracking-wide uppercase opacity-70">
          Maestro esterno
        </label>
        <input
          type="text"
          name="nome"
          placeholder="Nome"
          required
          className="rounded-[2px] p-2 text-sm"
          style={fieldStyle}
        />
        <input
          type="text"
          name="contatto"
          placeholder="Contatto (facoltativo)"
          className="rounded-[2px] p-2 text-sm"
          style={fieldStyle}
        />
        <button
          type="submit"
          className="cursor-pointer self-start text-[11px] tracking-wide underline underline-offset-2"
          style={linkButtonStyle}
        >
          Aggiungi Maestro esterno
        </button>
      </form>
    </div>
  );
}
