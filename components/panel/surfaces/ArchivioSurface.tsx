"use client";

import { useState } from "react";
import {
  caricaDocumento,
  creaCampo,
  creaLuogo,
  creaUscita,
  eliminaCampo,
  eliminaDocumento,
  eliminaLuogo,
  eliminaUscita,
  modificaCampo,
  modificaUscita,
} from "@/app/actions/archivio";
import { loadArchivio } from "@/app/actions/surfaces";
import type {
  ArchivioData,
  AttivitaArchivio,
  DocumentoArchivio,
  LuogoArchivio,
} from "@/lib/queries/archivio";
import { useSurfaceData } from "@/lib/scene/useSurfaceData";
import { PanelSection } from "../PanelSection";
import { SurfaceLoading } from "./SurfaceLoading";

/**
 * Baule dell'archivio (Fase 9): la memoria storica del Reparto.
 *
 * Navigazione come da `docs/DATA_MODEL.md`: Campo → Luogo → Partecipanti →
 * Squadriglie → Attività → Foto → Documenti. La lettura è per tutti i membri
 * del Reparto; le scritture (aggiungere ricordi, caricare fotografie e
 * documenti) sono riservate ai Capi, come per il calendario.
 */

type Vista =
  | { tipo: "scaffale" }
  | { tipo: "dettaglio"; entitaTipo: "uscita" | "campo" | "luogo"; id: string };

const fieldStyle = {
  backgroundColor: "var(--paper-base)",
  border: "1px solid color-mix(in srgb, var(--wood-dark) 22%, transparent)",
  color: "var(--ink)",
} as const;

const linkButtonStyle = { color: "var(--accent)" } as const;

export function ArchivioSurface() {
  const { data, reload } = useSurfaceData("archivio", loadArchivio);
  const [vista, setVista] = useState<Vista>({ tipo: "scaffale" });

  if (!data) return <SurfaceLoading label="Apro il baule…" />;

  if (data.repartoNome === null) {
    return (
      <p className="mt-6 font-sans text-sm leading-relaxed">
        Il baule è quello del tuo Reparto: si aprirà appena ne farai parte.
      </p>
    );
  }

  if (vista.tipo === "dettaglio") {
    const elenco =
      vista.entitaTipo === "campo"
        ? data.campi
        : vista.entitaTipo === "uscita"
          ? data.uscite
          : data.luoghi;
    const dettaglio = elenco.find((voce) => voce.id === vista.id);

    if (dettaglio) {
      return (
        <Dettaglio
          data={data}
          entitaTipo={vista.entitaTipo}
          dettaglio={dettaglio}
          onBack={() => setVista({ tipo: "scaffale" })}
          onMutated={reload}
        />
      );
    }
  }

  return (
    <Scaffale
      data={data}
      onApri={(entitaTipo, id) =>
        setVista({ tipo: "dettaglio", entitaTipo, id })
      }
      onMutated={reload}
    />
  );
}

// ---------------------------------------------------------------------------
// Scaffale: campi, uscite, luoghi
// ---------------------------------------------------------------------------

function Scaffale({
  data,
  onApri,
  onMutated,
}: {
  data: ArchivioData;
  onApri: (entitaTipo: "uscita" | "campo" | "luogo", id: string) => void;
  onMutated: () => void;
}) {
  const [modulo, setModulo] = useState<"uscita" | "campo" | "luogo" | null>(
    null,
  );
  const [luoghiError, setLuoghiError] = useState<string | null>(null);

  return (
    <div className="mt-5 flex flex-col gap-6">
      <p className="font-sans text-sm leading-relaxed">
        La memoria del Reparto: i campi, le uscite e i luoghi che hanno fatto la
        sua storia. Ogni ricordo conserva le fotografie e i documenti di quel
        momento.
      </p>

      <PanelSection title="Campi">
        <ElencoAttivita
          voci={data.campi}
          vuoto="Nessun campo nell'archivio."
          etichetta={(voce) =>
            voce.anno ? `${voce.titolo} — ${voce.anno}` : voce.titolo
          }
          onApri={(id) => onApri("campo", id)}
        />
        <BottoneAggiungi
          visibile={data.isCapoOrAdmin && modulo === null}
          etichetta="Aggiungi un campo"
          onClick={() => setModulo("campo")}
        />
        {modulo === "campo" ? (
          <FormAttivita
            data={data}
            entitaTipo="campo"
            onSalvato={() => {
              onMutated();
              setModulo(null);
            }}
            onChiuso={() => setModulo(null)}
          />
        ) : null}
      </PanelSection>

      <PanelSection title="Uscite">
        <ElencoAttivita
          voci={data.uscite}
          vuoto="Nessuna uscita nell'archivio."
          etichetta={(voce) =>
            voce.data ? `${voce.titolo} — ${voce.data}` : voce.titolo
          }
          onApri={(id) => onApri("uscita", id)}
        />
        <BottoneAggiungi
          visibile={data.isCapoOrAdmin && modulo === null}
          etichetta="Aggiungi un'uscita"
          onClick={() => setModulo("uscita")}
        />
        {modulo === "uscita" ? (
          <FormAttivita
            data={data}
            entitaTipo="uscita"
            onSalvato={() => {
              onMutated();
              setModulo(null);
            }}
            onChiuso={() => setModulo(null)}
          />
        ) : null}
      </PanelSection>

      <PanelSection title="Luoghi">
        {data.luoghi.length === 0 ? (
          <p className="font-sans text-sm leading-relaxed">
            Nessun luogo registrato.
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {data.luoghi.map((luogo) => (
              <li
                key={luogo.id}
                className="flex items-baseline justify-between gap-3 border-b pb-1 font-sans text-sm"
                style={{
                  borderColor:
                    "color-mix(in srgb, var(--ink) 12%, transparent)",
                }}
              >
                <button
                  type="button"
                  onClick={() => onApri("luogo", luogo.id)}
                  className="cursor-pointer text-left underline-offset-2 hover:underline"
                  style={{ color: "var(--ink)" }}
                >
                  {luogo.nome}
                </button>
                {data.isCapoOrAdmin ? (
                  <form
                    action={async () => {
                      if (
                        confirm(
                          `Sei sicuro di voler eliminare il luogo "${luogo.nome}"?`,
                        )
                      ) {
                        try {
                          await eliminaLuogo(luogo.id);
                          onMutated();
                        } catch (e) {
                          setLuoghiError(
                            e instanceof Error
                              ? e.message
                              : "Errore imprevisto.",
                          );
                        }
                      }
                    }}
                  >
                    <button
                      type="submit"
                      className="cursor-pointer text-[11px] underline underline-offset-2"
                      style={linkButtonStyle}
                    >
                      Elimina
                    </button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        {luoghiError ? (
          <p className="mt-2 font-sans text-sm" style={{ color: "#b3382c" }}>
            {luoghiError}
          </p>
        ) : null}
        <BottoneAggiungi
          visibile={data.isCapoOrAdmin && modulo === null}
          etichetta="Aggiungi un luogo"
          onClick={() => setModulo("luogo")}
        />
        {modulo === "luogo" ? (
          <form
            action={async (formData) => {
              try {
                await creaLuogo(formData);
                onMutated();
                setModulo(null);
              } catch (e) {
                setLuoghiError(
                  e instanceof Error ? e.message : "Errore imprevisto.",
                );
              }
            }}
            className="mt-3 flex flex-col gap-2"
          >
            <input
              name="nome"
              placeholder="Nome del luogo"
              required
              className="rounded-[2px] p-2 text-sm"
              style={fieldStyle}
            />
            <input
              name="descrizione"
              placeholder="Descrizione (facoltativa)"
              className="rounded-[2px] p-2 text-sm"
              style={fieldStyle}
            />
            <button
              type="submit"
              className="cursor-pointer self-start text-[11px] tracking-wide underline underline-offset-2"
              style={linkButtonStyle}
            >
              Salva luogo
            </button>
          </form>
        ) : null}
      </PanelSection>
    </div>
  );
}

function ElencoAttivita({
  voci,
  vuoto,
  etichetta,
  onApri,
}: {
  voci: AttivitaArchivio[];
  vuoto: string;
  etichetta: (voce: AttivitaArchivio) => string;
  onApri: (id: string) => void;
}) {
  if (voci.length === 0) {
    return <p className="font-sans text-sm leading-relaxed">{vuoto}</p>;
  }

  return (
    <ul className="flex flex-col gap-1">
      {voci.map((voce) => (
        <li
          key={voce.id}
          className="border-b pb-1"
          style={{
            borderColor: "color-mix(in srgb, var(--ink) 12%, transparent)",
          }}
        >
          <button
            type="button"
            onClick={() => onApri(voce.id)}
            className="cursor-pointer text-left font-serif text-sm underline-offset-2 hover:underline"
            style={{ color: "var(--ink)" }}
          >
            {etichetta(voce)}
          </button>
          {voce.luogo ? (
            <span
              className="ml-2 font-sans text-[11px]"
              style={{
                color: "var(--ink-muted-soft)",
              }}
            >
              {voce.luogo.nome}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function BottoneAggiungi({
  visibile,
  etichetta,
  onClick,
}: {
  visibile: boolean;
  etichetta: string;
  onClick: () => void;
}) {
  if (!visibile) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-2 cursor-pointer self-start text-[11px] tracking-wide underline underline-offset-2"
      style={linkButtonStyle}
    >
      {etichetta}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Dettaglio: un ricordo (campo, uscita) o un luogo
// ---------------------------------------------------------------------------

function Dettaglio({
  data,
  entitaTipo,
  dettaglio,
  onBack,
  onMutated,
}: {
  data: ArchivioData;
  entitaTipo: "uscita" | "campo" | "luogo";
  dettaglio: AttivitaArchivio | LuogoArchivio;
  onBack: () => void;
  onMutated: () => void;
}) {
  const [modifica, setModifica] = useState(false);
  const [eliminaError, setEliminaError] = useState<string | null>(null);
  const attivita =
    entitaTipo === "luogo" ? null : (dettaglio as AttivitaArchivio);
  const documenti =
    attivita?.documenti ??
    (entitaTipo === "luogo"
      ? (dettaglio as LuogoArchivio).documenti
      : undefined) ??
    [];

  const elimina = async () => {
    try {
      if (entitaTipo === "uscita") await eliminaUscita(dettaglio.id);
      else if (entitaTipo === "campo") await eliminaCampo(dettaglio.id);
      else await eliminaLuogo(dettaglio.id);
      onMutated();
      onBack();
    } catch (e) {
      setEliminaError(e instanceof Error ? e.message : "Errore imprevisto.");
    }
  };

  return (
    <div className="mt-5 flex flex-col gap-5">
      <button
        type="button"
        onClick={onBack}
        className="cursor-pointer self-start font-sans text-[11px] tracking-wide underline underline-offset-2"
        style={linkButtonStyle}
      >
        ← Torna all&apos;archivio
      </button>

      <PanelSection
        title={
          entitaTipo === "campo"
            ? "Campo"
            : entitaTipo === "uscita"
              ? "Uscita"
              : "Luogo"
        }
      >
        <DettaglioCampi dettaglio={dettaglio} attivita={attivita} />

        {data.isCapoOrAdmin ? (
          <div className="mt-4 flex gap-4 font-sans text-[11px] tracking-wide">
            {entitaTipo !== "luogo" ? (
              <button
                type="button"
                onClick={() => setModifica((value) => !value)}
                className="cursor-pointer underline underline-offset-2"
                style={linkButtonStyle}
              >
                {modifica ? "Annulla modifica" : "Modifica"}
              </button>
            ) : null}
            <form
              action={async () => {
                const tipoLabel =
                  entitaTipo === "campo"
                    ? "campo"
                    : entitaTipo === "uscita"
                      ? "uscita"
                      : "luogo";
                const nome =
                  "titolo" in dettaglio ? dettaglio.titolo : dettaglio.nome;

                if (
                  confirm(
                    `Sei sicuro di voler eliminare questo ${tipoLabel} "${nome}"?`,
                  )
                ) {
                  await elimina();
                }
              }}
            >
              <button
                type="submit"
                className="cursor-pointer underline underline-offset-2"
                style={{ color: "#b3382c" }}
              >
                Elimina
              </button>
            </form>
          </div>
        ) : null}
        {eliminaError ? (
          <p className="mt-2 font-sans text-sm" style={{ color: "#b3382c" }}>
            {eliminaError}
          </p>
        ) : null}
      </PanelSection>

      {modifica && attivita ? (
        <FormAttivita
          data={data}
          entitaTipo={entitaTipo as "uscita" | "campo"}
          initial={attivita}
          onSalvato={() => {
            onMutated();
            setModifica(false);
          }}
          onChiuso={() => setModifica(false)}
        />
      ) : (
        <>
          {attivita ? (
            <>
              <PanelSection title="Partecipanti">
                {attivita.partecipanti.length > 0 ? (
                  <p className="font-sans text-sm leading-relaxed">
                    {attivita.partecipanti.join(", ")}
                  </p>
                ) : (
                  <p className="font-sans text-sm leading-relaxed italic">
                    Non registrati.
                  </p>
                )}
              </PanelSection>

              <PanelSection title="Squadriglie">
                {attivita.squadriglie.length > 0 ? (
                  <p className="font-sans text-sm leading-relaxed">
                    {attivita.squadriglie.join(", ")}
                  </p>
                ) : (
                  <p className="font-sans text-sm leading-relaxed italic">
                    Non registrate.
                  </p>
                )}
              </PanelSection>
            </>
          ) : null}

          <SezioneDocumenti
            documenti={documenti.filter(
              (documento) => documento.tipo === "foto",
            )}
            vuoto="Nessuna fotografia in questo ricordo."
            titolo="Fotografie"
            isCapoOrAdmin={data.isCapoOrAdmin}
            onMutated={onMutated}
          />
          <SezioneDocumenti
            documenti={documenti.filter(
              (documento) => documento.tipo === "documento",
            )}
            vuoto="Nessun documento in questo ricordo."
            titolo="Documenti"
            isCapoOrAdmin={data.isCapoOrAdmin}
            onMutated={onMutated}
          />

          {data.isCapoOrAdmin ? (
            <FormDocumento
              entitaTipo={entitaTipo}
              entitaId={dettaglio.id}
              onMutated={onMutated}
            />
          ) : null}
        </>
      )}
    </div>
  );
}

function DettaglioCampi({
  dettaglio,
  attivita,
}: {
  dettaglio: AttivitaArchivio | LuogoArchivio;
  attivita: AttivitaArchivio | null;
}) {
  const titolo = "titolo" in dettaglio ? dettaglio.titolo : dettaglio.nome;
  const descrizioneLuogo =
    "descrizione" in dettaglio ? dettaglio.descrizione : undefined;

  return (
    <div className="flex flex-col gap-3">
      <h3
        className="font-serif text-xl leading-tight"
        style={{ color: "var(--ink)" }}
      >
        {titolo}
      </h3>

      <dl className="flex flex-col gap-2 font-sans text-sm">
        {attivita ? (
          <>
            <dt
              className="text-[11px] tracking-wide uppercase"
              style={{
                color: "var(--ink-muted-soft)",
              }}
            >
              Quando
            </dt>
            <dd style={{ color: "var(--ink)" }}>
              {attivita.anno
                ? `${attivita.anno}${attivita.dataInizio ? ` — dal ${attivita.dataInizio}` : ""}${attivita.dataFine ? ` al ${attivita.dataFine}` : ""}`
                : (attivita.data ?? "—")}
            </dd>
          </>
        ) : null}
        <dt
          className="text-[11px] tracking-wide uppercase"
          style={{ color: "var(--ink-muted-soft)" }}
        >
          Luogo
        </dt>
        <dd style={{ color: "var(--ink)" }}>{attivita?.luogo?.nome ?? "—"}</dd>
        {descrizioneLuogo ? (
          <>
            <dt
              className="text-[11px] tracking-wide uppercase"
              style={{
                color: "var(--ink-muted-soft)",
              }}
            >
              Descrizione
            </dt>
            <dd className="leading-relaxed" style={{ color: "var(--ink)" }}>
              {descrizioneLuogo}
            </dd>
          </>
        ) : null}
        {attivita?.programma ? (
          <>
            <dt
              className="text-[11px] tracking-wide uppercase"
              style={{
                color: "var(--ink-muted-soft)",
              }}
            >
              Programma
            </dt>
            <dd className="leading-relaxed" style={{ color: "var(--ink)" }}>
              {attivita.programma}
            </dd>
          </>
        ) : null}
        {attivita?.materiale ? (
          <>
            <dt
              className="text-[11px] tracking-wide uppercase"
              style={{
                color: "var(--ink-muted-soft)",
              }}
            >
              Materiale
            </dt>
            <dd className="leading-relaxed" style={{ color: "var(--ink)" }}>
              {attivita.materiale}
            </dd>
          </>
        ) : null}
        {attivita?.note ? (
          <>
            <dt
              className="text-[11px] tracking-wide uppercase"
              style={{
                color: "var(--ink-muted-soft)",
              }}
            >
              Note
            </dt>
            <dd className="leading-relaxed" style={{ color: "var(--ink)" }}>
              {attivita.note}
            </dd>
          </>
        ) : null}
      </dl>
    </div>
  );
}

function SezioneDocumenti({
  documenti,
  vuoto,
  titolo,
  isCapoOrAdmin,
  onMutated,
}: {
  documenti: DocumentoArchivio[];
  vuoto: string;
  titolo: string;
  isCapoOrAdmin: boolean;
  onMutated: () => void;
}) {
  const [error, setError] = useState<string | null>(null);

  return (
    <PanelSection title={titolo}>
      {documenti.length === 0 ? (
        <p className="font-sans text-sm leading-relaxed italic">{vuoto}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {documenti.map((documento) => (
            <li
              key={documento.id}
              className="flex items-baseline justify-between gap-3"
            >
              <a
                href={documento.url}
                target="_blank"
                rel="noreferrer"
                className="font-sans text-sm underline underline-offset-2"
                style={linkButtonStyle}
              >
                {documento.nomeFile}
              </a>
              {isCapoOrAdmin ? (
                <form
                  action={async () => {
                    if (
                      confirm(
                        `Sei sicuro di voler eliminare il documento "${documento.nomeFile}"?`,
                      )
                    ) {
                      try {
                        await eliminaDocumento(documento.id);
                        onMutated();
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
                    className="cursor-pointer font-sans text-[11px] underline underline-offset-2"
                    style={linkButtonStyle}
                  >
                    Elimina
                  </button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      {error ? (
        <p className="mt-2 font-sans text-sm" style={{ color: "#b3382c" }}>
          {error}
        </p>
      ) : null}
    </PanelSection>
  );
}

function FormDocumento({
  entitaTipo,
  entitaId,
  onMutated,
}: {
  entitaTipo: "uscita" | "campo" | "luogo";
  entitaId: string;
  onMutated: () => void;
}) {
  const [error, setError] = useState<string | null>(null);

  return (
    <PanelSection title="Aggiungi fotografia o documento">
      <form
        action={async (formData) => {
          try {
            await caricaDocumento(formData);
            onMutated();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Errore imprevisto.");
          }
        }}
        className="flex flex-col gap-2"
      >
        <input type="hidden" name="entitaTipo" value={entitaTipo} />
        <input type="hidden" name="entitaId" value={entitaId} />
        <select
          name="tipo"
          className="rounded-[2px] p-2 text-sm"
          style={fieldStyle}
        >
          <option value="foto">Fotografia</option>
          <option value="documento">Documento</option>
        </select>
        <input
          type="file"
          name="file"
          required
          className="rounded-[2px] p-2 text-sm"
          style={fieldStyle}
        />
        <button
          type="submit"
          className="cursor-pointer self-start text-[11px] tracking-wide underline underline-offset-2"
          style={linkButtonStyle}
        >
          Carica
        </button>
        {error ? (
          <p className="font-sans text-sm" style={{ color: "#b3382c" }}>
            {error}
          </p>
        ) : null}
      </form>
    </PanelSection>
  );
}

// ---------------------------------------------------------------------------
// Form di creazione/modifica di uscite e campi (Capi)
// ---------------------------------------------------------------------------

function FormAttivita({
  data,
  entitaTipo,
  initial,
  onSalvato,
  onChiuso,
}: {
  data: ArchivioData;
  entitaTipo: "uscita" | "campo";
  initial?: AttivitaArchivio;
  onSalvato: () => void;
  onChiuso: () => void;
}) {
  const [error, setError] = useState<string | null>(null);

  const azione = async (formData: FormData) => {
    try {
      if (initial) {
        if (entitaTipo === "uscita") await modificaUscita(initial.id, formData);
        else await modificaCampo(initial.id, formData);
      } else {
        if (entitaTipo === "uscita") await creaUscita(formData);
        else await creaCampo(formData);
      }
      onSalvato();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore imprevisto.");
    }
  };

  return (
    <PanelSection
      title={
        initial
          ? `Modifica ${entitaTipo}`
          : `Nuova ${entitaTipo === "uscita" ? "uscita" : "campo"}`
      }
    >
      <form action={azione} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 font-sans text-sm">
          Titolo
          <input
            name="titolo"
            required
            defaultValue={initial?.titolo}
            className="rounded-[2px] p-2 text-sm"
            style={fieldStyle}
          />
        </label>

        {entitaTipo === "uscita" ? (
          <label className="flex flex-col gap-1 font-sans text-sm">
            Data
            <input
              name="data"
              type="date"
              required
              defaultValue={initial?.data}
              className="rounded-[2px] p-2 text-sm"
              style={fieldStyle}
            />
          </label>
        ) : (
          <>
            <label className="flex flex-col gap-1 font-sans text-sm">
              Anno
              <input
                name="anno"
                type="number"
                min={1900}
                max={2200}
                required
                defaultValue={initial?.anno}
                className="rounded-[2px] p-2 text-sm"
                style={fieldStyle}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 font-sans text-sm">
                Inizio
                <input
                  name="data_inizio"
                  type="date"
                  defaultValue={initial?.dataInizio}
                  className="rounded-[2px] p-2 text-sm"
                  style={fieldStyle}
                />
              </label>
              <label className="flex flex-col gap-1 font-sans text-sm">
                Fine
                <input
                  name="data_fine"
                  type="date"
                  defaultValue={initial?.dataFine}
                  className="rounded-[2px] p-2 text-sm"
                  style={fieldStyle}
                />
              </label>
            </div>
          </>
        )}

        <label className="flex flex-col gap-1 font-sans text-sm">
          Luogo
          <select
            name="luogo_id"
            className="rounded-[2px] p-2 text-sm"
            style={fieldStyle}
          >
            <option value="">Nessuno</option>
            {data.luoghi.map((luogo) => (
              <option key={luogo.id} value={luogo.id}>
                {luogo.nome}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 font-sans text-sm">
          Programma
          <textarea
            name="programma"
            rows={3}
            defaultValue={initial?.programma}
            className="rounded-[2px] p-2 text-sm"
            style={fieldStyle}
          />
        </label>

        {entitaTipo === "uscita" ? (
          <label className="flex flex-col gap-1 font-sans text-sm">
            Materiale
            <textarea
              name="materiale"
              rows={2}
              defaultValue={initial?.materiale}
              className="rounded-[2px] p-2 text-sm"
              style={fieldStyle}
            />
          </label>
        ) : null}

        <label className="flex flex-col gap-1 font-sans text-sm">
          Note
          <textarea
            name="note"
            rows={2}
            defaultValue={initial?.note}
            className="rounded-[2px] p-2 text-sm"
            style={fieldStyle}
          />
        </label>

        <label className="flex flex-col gap-1 font-sans text-sm">
          Partecipanti
          <select
            name="partecipanti"
            multiple
            size={4}
            defaultValue={initial?.partecipanteIds ?? []}
            className="rounded-[2px] p-2 text-sm"
            style={fieldStyle}
          >
            {data.membri.map((membro) => (
              <option key={membro.id} value={membro.id}>
                {membro.nome}
              </option>
            ))}
          </select>
          <span
            className="text-[11px]"
            style={{ color: "var(--ink-muted-soft)" }}
          >
            Tieni premuto Ctrl (⌘ su Mac) per sceglierne più d&apos;una.
          </span>
        </label>

        <label className="flex flex-col gap-1 font-sans text-sm">
          Squadriglie coinvolte
          <select
            name="squadriglie"
            multiple
            size={3}
            defaultValue={initial?.squadrigliaIds ?? []}
            className="rounded-[2px] p-2 text-sm"
            style={fieldStyle}
          >
            {data.squadriglie.map((squadriglia) => (
              <option key={squadriglia.id} value={squadriglia.id}>
                {squadriglia.nome}
              </option>
            ))}
          </select>
        </label>

        <div className="flex gap-4">
          <button
            type="submit"
            className="cursor-pointer self-start text-[11px] tracking-wide underline underline-offset-2"
            style={linkButtonStyle}
          >
            Salva
          </button>
          <button
            type="button"
            onClick={onChiuso}
            className="cursor-pointer self-start font-sans text-[11px] tracking-wide"
            style={{ color: "var(--ink-muted)" }}
          >
            Annulla
          </button>
        </div>
        {error ? (
          <p className="font-sans text-sm" style={{ color: "#b3382c" }}>
            {error}
          </p>
        ) : null}
      </form>
    </PanelSection>
  );
}
