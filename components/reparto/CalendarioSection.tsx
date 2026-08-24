"use client";

import { useState } from "react";
import type { EventoData } from "@/lib/scene/objects";
import {
  creaEvento,
  eliminaEvento,
  modificaEvento,
} from "@/app/reparto/actions";

export function CalendarioSection({
  events,
  isCapoOrAdmin,
  onMutated,
}: {
  events: readonly EventoData[];
  isCapoOrAdmin: boolean;
  /** Chiamata dopo ogni scrittura, per ricaricare la superficie (DEC-021). */
  onMutated?: () => void;
}) {
  const [showNewEventForm, setShowNewEventForm] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [newEventError, setNewEventError] = useState<string | null>(null);

  const todayStr = new Date().toISOString().slice(0, 10);
  const upcomingEvents = events.filter(
    (e) => (e.dataFine ?? e.dataInizio) >= todayStr,
  );
  const pastEvents = events.filter(
    (e) => (e.dataFine ?? e.dataInizio) < todayStr,
  );

  return (
    <section className="flex flex-col gap-8">
      {/* Header e Azione Capo */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2
            className="font-serif text-2xl leading-tight font-semibold"
            style={{ color: "var(--ink)" }}
          >
            Calendario delle Attività
          </h2>
          <p
            className="font-sans text-xs mt-1"
            style={{ color: "color-mix(in srgb, var(--ink) 70%, transparent)" }}
          >
            Uscite, campi, riunioni ed eventi del Reparto
          </p>
        </div>

        {isCapoOrAdmin && !showNewEventForm ? (
          <button
            type="button"
            onClick={() => setShowNewEventForm(true)}
            className="cursor-pointer rounded-[2px] px-3 py-1.5 font-sans text-xs tracking-wide font-medium shadow-sm transition-colors"
            style={{
              backgroundColor: "var(--accent)",
              color: "#fff",
            }}
          >
            + Nuovo Evento
          </button>
        ) : null}
      </div>

      {/* Form Nuovo Evento */}
      {isCapoOrAdmin && showNewEventForm ? (
        <form
          action={async (formData) => {
            try {
              await creaEvento(formData);
              setShowNewEventForm(false);
              onMutated?.();
            } catch (e) {
              setNewEventError(
                e instanceof Error ? e.message : "Errore imprevisto.",
              );
            }
          }}
          className="flex flex-col gap-4 p-5 rounded-[3px]"
          style={{
            backgroundColor: "var(--paper-base)",
            border: "1px solid var(--accent)",
          }}
        >
          <h3
            className="font-serif text-lg font-semibold"
            style={{ color: "var(--ink)" }}
          >
            Aggiungi un evento al calendario
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans text-xs">
            <div>
              <label
                htmlFor="evento-titolo"
                className="block uppercase tracking-wider mb-1"
                style={{
                  color: "color-mix(in srgb, var(--ink) 70%, transparent)",
                }}
              >
                Titolo evento *
              </label>
              <input
                id="evento-titolo"
                type="text"
                name="titolo"
                placeholder="es. Uscita dei Passaggi"
                required
                className="w-full rounded-[2px] px-3 py-1.5 text-sm"
                style={{
                  backgroundColor: "var(--paper-base)",
                  border:
                    "1px solid color-mix(in srgb, var(--wood-dark) 30%, transparent)",
                  color: "var(--ink)",
                }}
              />
            </div>

            <div>
              <label
                htmlFor="evento-tipo"
                className="block uppercase tracking-wider mb-1"
                style={{
                  color: "color-mix(in srgb, var(--ink) 70%, transparent)",
                }}
              >
                Tipo di attività *
              </label>
              <select
                id="evento-tipo"
                name="tipo"
                required
                className="w-full rounded-[2px] px-3 py-1.5 text-sm cursor-pointer"
                style={{
                  backgroundColor: "var(--paper-base)",
                  border:
                    "1px solid color-mix(in srgb, var(--wood-dark) 30%, transparent)",
                  color: "var(--ink)",
                }}
              >
                <option value="uscita">Uscita</option>
                <option value="campo">Campo</option>
                <option value="riunione">Riunione</option>
                <option value="altro">Altro</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="evento-data-inizio"
                className="block uppercase tracking-wider mb-1"
                style={{
                  color: "color-mix(in srgb, var(--ink) 70%, transparent)",
                }}
              >
                Data inizio *
              </label>
              <input
                id="evento-data-inizio"
                type="date"
                name="data_inizio"
                required
                defaultValue={todayStr}
                className="w-full rounded-[2px] px-3 py-1.5 text-sm"
                style={{
                  backgroundColor: "var(--paper-base)",
                  border:
                    "1px solid color-mix(in srgb, var(--wood-dark) 30%, transparent)",
                  color: "var(--ink)",
                }}
              />
            </div>

            <div>
              <label
                htmlFor="evento-data-fine"
                className="block uppercase tracking-wider mb-1"
                style={{
                  color: "color-mix(in srgb, var(--ink) 70%, transparent)",
                }}
              >
                Data fine (se su più giorni)
              </label>
              <input
                id="evento-data-fine"
                type="date"
                name="data_fine"
                className="w-full rounded-[2px] px-3 py-1.5 text-sm"
                style={{
                  backgroundColor: "var(--paper-base)",
                  border:
                    "1px solid color-mix(in srgb, var(--wood-dark) 30%, transparent)",
                  color: "var(--ink)",
                }}
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="evento-luogo"
                className="block uppercase tracking-wider mb-1"
                style={{
                  color: "color-mix(in srgb, var(--ink) 70%, transparent)",
                }}
              >
                Luogo / Base scout
              </label>
              <input
                id="evento-luogo"
                type="text"
                name="luogo"
                placeholder="es. Rifugio Scout Monte Sole"
                className="w-full rounded-[2px] px-3 py-1.5 text-sm"
                style={{
                  backgroundColor: "var(--paper-base)",
                  border:
                    "1px solid color-mix(in srgb, var(--wood-dark) 30%, transparent)",
                  color: "var(--ink)",
                }}
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="evento-descrizione"
                className="block uppercase tracking-wider mb-1"
                style={{
                  color: "color-mix(in srgb, var(--ink) 70%, transparent)",
                }}
              >
                Descrizione / Note operative
              </label>
              <textarea
                id="evento-descrizione"
                name="descrizione"
                rows={3}
                placeholder="Dettagli logistici, materiale occorrente, orari di ritrovo…"
                className="w-full rounded-[2px] px-3 py-1.5 text-sm"
                style={{
                  backgroundColor: "var(--paper-base)",
                  border:
                    "1px solid color-mix(in srgb, var(--wood-dark) 30%, transparent)",
                  color: "var(--ink)",
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="cursor-pointer rounded-[2px] px-4 py-1.5 font-sans text-xs tracking-wide font-medium"
              style={{
                backgroundColor: "var(--accent)",
                color: "#fff",
              }}
            >
              Salva evento
            </button>
            <button
              type="button"
              onClick={() => setShowNewEventForm(false)}
              className="cursor-pointer rounded-[2px] px-3 py-1.5 font-sans text-xs tracking-wide"
              style={{
                border:
                  "1px solid color-mix(in srgb, var(--wood-dark) 30%, transparent)",
                color: "var(--ink)",
              }}
            >
              Annulla
            </button>
          </div>
          {newEventError ? (
            <p className="font-sans text-xs" style={{ color: "#b3382c" }}>
              {newEventError}
            </p>
          ) : null}
        </form>
      ) : null}

      {/* Prossimi Eventi */}
      <div className="flex flex-col gap-4">
        <h3
          className="text-xs uppercase tracking-widest font-sans font-semibold"
          style={{ color: "color-mix(in srgb, var(--ink) 65%, transparent)" }}
        >
          Prossimi Eventi in Programma
        </h3>

        {upcomingEvents.length === 0 ? (
          <div
            className="p-8 rounded-[3px] text-center font-sans text-sm italic"
            style={{
              backgroundColor: "var(--paper-base)",
              border:
                "1px solid color-mix(in srgb, var(--wood-dark) 18%, transparent)",
              color: "color-mix(in srgb, var(--ink) 60%, transparent)",
            }}
          >
            Nessun evento futuro registrato al momento.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {upcomingEvents.map((ev) => (
              <EventCard
                key={ev.id}
                event={ev}
                isCapoOrAdmin={isCapoOrAdmin}

                onMutated={onMutated}
                isEditing={editingEventId === ev.id}
                onStartEdit={() => setEditingEventId(ev.id)}
                onCancelEdit={() => setEditingEventId(null)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Eventi Passati */}
      {pastEvents.length > 0 ? (
        <div className="flex flex-col gap-4 mt-4">
          <h3
            className="text-xs uppercase tracking-widest font-sans font-semibold"
            style={{ color: "color-mix(in srgb, var(--ink) 50%, transparent)" }}
          >
            Attività Passate
          </h3>

          <div className="flex flex-col gap-3 opacity-80">
            {pastEvents.map((ev) => (
              <EventCard
                key={ev.id}
                event={ev}
                isCapoOrAdmin={isCapoOrAdmin}

                onMutated={onMutated}
                isEditing={editingEventId === ev.id}
                onStartEdit={() => setEditingEventId(ev.id)}
                onCancelEdit={() => setEditingEventId(null)}
              />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function EventCard({
  event,
  isCapoOrAdmin,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onMutated,
}: {
  event: EventoData;
  isCapoOrAdmin: boolean;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onMutated?: () => void;
}) {
  const [error, setError] = useState<string | null>(null);

  if (isEditing) {
    return (
      <form
        action={async (formData) => {
          try {
            await modificaEvento(event.id, formData);
            onCancelEdit();
            onMutated?.();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Errore imprevisto.");
          }
        }}
        className="flex flex-col gap-4 p-5 rounded-[3px]"
        style={{
          backgroundColor: "var(--paper-base)",
          border: "1px solid var(--accent)",
        }}
      >
        <h4
          className="font-serif text-lg font-semibold"
          style={{ color: "var(--ink)" }}
        >
          Modifica evento
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans text-xs">
          <div>
            <label
              htmlFor={`edit-titolo-${event.id}`}
              className="block uppercase tracking-wider mb-1"
            >
              Titolo
            </label>
            <input
              id={`edit-titolo-${event.id}`}
              type="text"
              name="titolo"
              defaultValue={event.titolo}
              required
              className="w-full rounded-[2px] px-3 py-1.5 text-sm"
              style={{
                backgroundColor: "var(--paper-base)",
                border: "1px solid var(--wood-dark)",
                color: "var(--ink)",
              }}
            />
          </div>

          <div>
            <label
              htmlFor={`edit-tipo-${event.id}`}
              className="block uppercase tracking-wider mb-1"
            >
              Tipo
            </label>
            <select
              id={`edit-tipo-${event.id}`}
              name="tipo"
              defaultValue={event.tipo}
              className="w-full rounded-[2px] px-3 py-1.5 text-sm cursor-pointer"
              style={{
                backgroundColor: "var(--paper-base)",
                border: "1px solid var(--wood-dark)",
                color: "var(--ink)",
              }}
            >
              <option value="uscita">Uscita</option>
              <option value="campo">Campo</option>
              <option value="riunione">Riunione</option>
              <option value="altro">Altro</option>
            </select>
          </div>

          <div>
            <label
              htmlFor={`edit-data-inizio-${event.id}`}
              className="block uppercase tracking-wider mb-1"
            >
              Data inizio
            </label>
            <input
              id={`edit-data-inizio-${event.id}`}
              type="date"
              name="data_inizio"
              defaultValue={event.dataInizio}
              required
              className="w-full rounded-[2px] px-3 py-1.5 text-sm"
              style={{
                backgroundColor: "var(--paper-base)",
                border: "1px solid var(--wood-dark)",
                color: "var(--ink)",
              }}
            />
          </div>

          <div>
            <label
              htmlFor={`edit-data-fine-${event.id}`}
              className="block uppercase tracking-wider mb-1"
            >
              Data fine
            </label>
            <input
              id={`edit-data-fine-${event.id}`}
              type="date"
              name="data_fine"
              defaultValue={event.dataFine ?? ""}
              className="w-full rounded-[2px] px-3 py-1.5 text-sm"
              style={{
                backgroundColor: "var(--paper-base)",
                border: "1px solid var(--wood-dark)",
                color: "var(--ink)",
              }}
            />
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor={`edit-luogo-${event.id}`}
              className="block uppercase tracking-wider mb-1"
            >
              Luogo
            </label>
            <input
              id={`edit-luogo-${event.id}`}
              type="text"
              name="luogo"
              defaultValue={event.luogo ?? ""}
              className="w-full rounded-[2px] px-3 py-1.5 text-sm"
              style={{
                backgroundColor: "var(--paper-base)",
                border: "1px solid var(--wood-dark)",
                color: "var(--ink)",
              }}
            />
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor={`edit-desc-${event.id}`}
              className="block uppercase tracking-wider mb-1"
            >
              Descrizione
            </label>
            <textarea
              id={`edit-desc-${event.id}`}
              name="descrizione"
              rows={3}
              defaultValue={event.descrizione ?? ""}
              className="w-full rounded-[2px] px-3 py-1.5 text-sm"
              style={{
                backgroundColor: "var(--paper-base)",
                border: "1px solid var(--wood-dark)",
                color: "var(--ink)",
              }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="cursor-pointer rounded-[2px] px-3 py-1.5 font-sans text-xs tracking-wide font-medium"
            style={{
              backgroundColor: "var(--accent)",
              color: "#fff",
            }}
          >
            Salva modifiche
          </button>
          <button
            type="button"
            onClick={onCancelEdit}
            className="cursor-pointer rounded-[2px] px-3 py-1.5 font-sans text-xs tracking-wide"
            style={{
              border: "1px solid var(--wood-dark)",
              color: "var(--ink)",
            }}
          >
            Annulla
          </button>
        </div>
        {error ? (
          <p className="font-sans text-xs" style={{ color: "#b3382c" }}>
            {error}
          </p>
        ) : null}
      </form>
    );
  }

  return (
    <div
      className="flex flex-col gap-3 rounded-[3px] p-5 shadow-sm transition-all"
      style={{
        backgroundColor: "var(--paper-base)",
        border:
          "1px solid color-mix(in srgb, var(--wood-dark) 24%, transparent)",
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="rounded px-2 py-0.5 text-[10px] font-sans font-semibold uppercase tracking-wider"
              style={{
                backgroundColor:
                  event.tipo === "uscita"
                    ? "color-mix(in srgb, #2e6b35 18%, transparent)"
                    : event.tipo === "campo"
                      ? "color-mix(in srgb, #b25822 18%, transparent)"
                      : "color-mix(in srgb, var(--ink) 12%, transparent)",
                color:
                  event.tipo === "uscita"
                    ? "#1b4d21"
                    : event.tipo === "campo"
                      ? "#7d3910"
                      : "var(--ink)",
              }}
            >
              {event.tipo}
            </span>
            <h4
              className="font-serif text-xl font-bold leading-snug"
              style={{ color: "var(--ink)" }}
            >
              {event.titolo}
            </h4>
          </div>

          <div
            className="text-xs font-sans mt-1 flex items-center gap-3 flex-wrap"
            style={{ color: "color-mix(in srgb, var(--ink) 75%, transparent)" }}
          >
            <span>
              📅 {event.dataInizio}
              {event.dataFine && event.dataFine !== event.dataInizio
                ? ` → ${event.dataFine}`
                : ""}
            </span>
            {event.luogo ? <span>📍 {event.luogo}</span> : null}
          </div>
        </div>

        {isCapoOrAdmin ? (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onStartEdit}
              className="text-[11px] font-sans underline cursor-pointer"
              style={{ color: "var(--accent)" }}
            >
              Modifica
            </button>
            <form
              action={async () => {
                if (
                  confirm(
                    `Sei sicuro di voler eliminare l'evento "${event.titolo}"?`,
                  )
                ) {
                  try {
                    await eliminaEvento(event.id);
                    onMutated?.();
                  } catch (e) {
                    setError(
                      e instanceof Error ? e.message : "Errore imprevisto.",
                    );
                  }
                }
              }}
            >
              <button
                type="submit"
                className="text-[11px] font-sans underline cursor-pointer text-red-700"
              >
                Elimina
              </button>
            </form>
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="font-sans text-xs" style={{ color: "#b3382c" }}>
          {error}
        </p>
      ) : null}

      {event.descrizione ? (
        <p
          className="text-xs font-sans leading-relaxed pt-2 border-t mt-1"
          style={{
            borderColor: "color-mix(in srgb, var(--ink) 10%, transparent)",
            color: "color-mix(in srgb, var(--ink) 85%, transparent)",
          }}
        >
          {event.descrizione}
        </p>
      ) : null}
    </div>
  );
}
