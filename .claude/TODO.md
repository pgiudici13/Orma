# ORMA — Piano operativo

Piano per milestone. Ogni task ha un identificatore univoco (`P<fase>-T<numero>`), obiettivo, dipendenze, file/componenti coinvolti (quando prevedibili), criteri di completamento e test necessari.

Stato attuale del repository: solo documentazione (`IDEA.md`, `docs/*`, `.claude/*`). Nessun codice, nessuna configurazione, nessun asset. Le fasi 0 e 1 partono da zero.

---

## Phase 0 — Foundation

### P0-T01 — Bootstrap del progetto Next.js

- **Obiettivo**: inizializzare il progetto Next.js (TypeScript, App Router) come da [DEC-001](DECISIONS.md#dec-001--stack-frontend-react--nextjs-su-vercel).
- **Dipendenze**: nessuna.
- **File/componenti**: `package.json`, `tsconfig.json`, `next.config.ts`, `app/`.
- **Criteri di completamento**: `npm run dev` avvia un'app vuota senza errori; TypeScript in strict mode.
- **Test necessari**: type-check (`tsc --noEmit`) pulito.

### P0-T02 — Configurazione lint/formatter

- **Obiettivo**: ESLint + Prettier (o formatter equivalente già standard nell'ecosistema Next.js) configurati e coerenti con lo stile richiesto (TypeScript strict, no unused, no `any` implicito).
- **Dipendenze**: P0-T01.
- **File/componenti**: `.eslintrc*`, config Prettier.
- **Criteri di completamento**: `npm run lint` pulito su progetto vuoto.
- **Test necessari**: lint CI-ready.

### P0-T03 — Setup Tailwind (o soluzione styling scelta)

- **Obiettivo**: introdurre la soluzione di styling per la UI non-3D (form, pannelli contenuto), valutando se Tailwind è coerente con l'estetica realistica richiesta da `docs/DESIGN.md` o se serve un approccio più custom (CSS Modules per texture/materiali).
- **Dipendenze**: P0-T01.
- **File/componenti**: `tailwind.config.ts` o equivalente.
- **Criteri di completamento**: decisione registrata in `DECISIONS.md`; setup funzionante su una pagina di test.
- **Test necessari**: build di produzione senza errori.

### P0-T04 — Setup progetto Supabase

- **Obiettivo**: creare il progetto Supabase per ORMA (ambiente di sviluppo), configurare CLI e migrazioni locali.
- **Dipendenze**: nessuna (parallelo a P0-T01).
- **File/componenti**: `supabase/` (config, `migrations/`), variabili d'ambiente locali (`.env.local`, mai committate).
- **Criteri di completamento**: `supabase start` funzionante in locale o progetto cloud creato; connessione verificata da script/CLI.
- **Test necessari**: connessione DB verificata manualmente.

### P0-T05 — Deploy iniziale su Vercel

- **Obiettivo**: collegare il repository a un progetto Vercel, verificare preview deployment automatici.
- **Dipendenze**: P0-T01.
- **File/componenti**: `vercel.json` (se necessario), environment variables Vercel.
- **Criteri di completamento**: deploy dell'app vuota raggiungibile via URL Vercel.
- **Test necessari**: build di produzione Vercel senza errori.

---

## Phase 1 — Design / Visual Prototype

### P1-T01 — Direzione visiva: moodboard e riferimenti materiali

- **Obiettivo**: tradurre `docs/DESIGN.md` in riferimenti concreti (palette derivata da legno/carta/tessuto, tipografia editoriale + sans leggibile) prima di scrivere componenti.
- **Dipendenze**: nessuna (attività di design, non codice).
- **Criteri di completamento**: documento/riferimento visivo condiviso (fuori da questo repo di codice, o in `docs/` se persistente).
- **Test necessari**: nessuno (deliverable di design).

### P1-T02 — Prototipo statico della scena tavolo (2D)

- **Obiettivo**: prima rappresentazione statica (immagine/HTML non interattivo) della Home-tavolo per validare composizione, luce, materiali prima di investire in 3D.
- **Dipendenze**: P1-T01.
- **File/componenti**: `app/page.tsx` (versione statica).
- **Criteri di completamento**: la scena statica rispetta i vincoli di `docs/DESIGN.md` (no estetica SaaS/cartoon/glassmorphism).
- **Test necessari**: verifica visiva in browser, responsive check desktop/tablet.

### P1-T03 — Scelta libreria animazioni 2D/transizioni UI

- **Obiettivo**: selezionare la libreria per le transizioni non-3D (apertura pannelli contenuto, fade, blur) coerente con "animazioni fluide, non eccessive" (`docs/DESIGN.md`).
- **Dipendenze**: P1-T02.
- **Criteri di completamento**: decisione registrata in `DECISIONS.md`.
- **Test necessari**: nessuno.

---

## Phase 2 — Interactive Table (scena 3D)

### P2-T01 — Setup React Three Fiber e canvas base

- **Obiettivo**: integrare R3F in una Client Component isolata, con un piano tavolo minimale e luce base.
- **Dipendenze**: P1-T02, [DEC-003](DECISIONS.md#dec-003--3d-threejs--react-three-fiber-uso-selettivo).
- **File/componenti**: `app/table/Scene.tsx` (Client Component), `components/three/`.
- **Criteri di completamento**: scena 3D renderizza senza errori SSR, 60fps su desktop di riferimento.
- **Test necessari**: verifica visiva, check console errori, check performance base (frame time).

### P2-T02 — Decisione state management (chiude DEC-004)

- **Obiettivo**: scegliere e implementare la gestione dello stato scena (camera, oggetto focalizzato, blur) e la separazione dallo stato dati server.
- **Dipendenze**: P2-T01.
- **Criteri di completamento**: DEC-004 aggiornata da `Open Decision` a `Accepted`.
- **Test necessari**: nessuno specifico, verificato tramite P2-T03.

### P2-T03 — Modello 3D riutilizzabile per le carte

- **Obiettivo**: un solo modello geometria carta, texture intercambiabili per Specialità/Competenze/Tappe (vincolo esplicito in `CLAUDE.md`: niente geometria duplicata per carta).
- **Dipendenze**: P2-T01.
- **File/componenti**: `components/three/Card.tsx`, asset placeholder in `assets/processed/cards/`.
- **Criteri di completamento**: più carte in scena condividono la stessa geometria; performance verificata con N carte di test.
- **Test necessari**: check draw calls, check memoria texture.

### P2-T04 — Interazione: focus → camera → blur → contenuto → chiusura

- **Obiettivo**: implementare il pattern di interazione descritto in `docs/UX.md` (oggetto → primo piano → leggero movimento camera → tavolo sfocato → contenuto → chiusura → ritorno).
- **Dipendenze**: P2-T02, P2-T03.
- **File/componenti**: `components/three/CardFocus.tsx`, gestione transizione camera.
- **Criteri di completamento**: transizione fluida testata su almeno una carta placeholder; non deve "sembrare un cambio di pagina" (requisito esplicito UX).
- **Test necessari**: verifica visiva, check regressioni performance.

### P2-T05 — Adattamento mobile della scena

- **Obiettivo**: prima versione dell'esperienza mobile ridisegnata (non scena desktop rimpicciolita), come richiesto da `docs/UX.md`.
- **Dipendenze**: P2-T04.
- **Criteri di completamento**: layout mobile distinto validato su almeno un device/simulatore reale.
- **Test necessari**: verifica responsive, check performance GPU mobile.

---

## Phase 3 — Specialità / Competenze / Tappe (contenuto ufficiale)

### P3-T01 — Schema DB contenuto ufficiale

- **Obiettivo**: migrazioni Supabase per `specialita`, `competenza`, `tappa` (contenuto ufficiale, non duplicato per utente — regola esplicita in `docs/DATA_MODEL.md`).
- **Dipendenze**: P0-T04.
- **File/componenti**: `supabase/migrations/`.
- **Criteri di completamento**: schema applicato, popolabile via seed di test.
- **Test necessari**: query di verifica struttura, test che nessuna colonna di progresso utente sia presente in queste tabelle.

### P3-T02a — Migrazione `files/` → `assets/source/` e ispezione PDF

- **Obiettivo**: spostare i 3 PDF già forniti (`Carta di Specialità.pdf`, `CARTA DI COMPETENZA.pdf`, `Manuale-della-Branca-EG.pdf`, attualmente in `files/` alla radice) nella struttura definitiva `assets/source/`; ispezionarli (testo selezionabile vs scansione, layout) per chiudere [DEC-005](DECISIONS.md#dec-005--asset-pipeline-pdf--texture-web) e scegliere lo strumento di estrazione.
- **Dipendenze**: nessuna (può partire già in Fase 0, in parallelo).
- **File/componenti**: `assets/source/`.
- **Criteri di completamento**: PDF originali intatti e spostati in `assets/source/`; DEC-005 aggiornata da `Open Decision` a `Accepted` con lo strumento scelto.
- **Test necessari**: verifica che lo spostamento non abbia alterato i file (checksum prima/dopo).

### P3-T02b — Asset pipeline PDF → texture

- **Obiettivo**: implementare la pipeline `PDF → estrazione → processing → WebP/PNG` per le carte di Specialità/Competenze, usando i PDF reali ora disponibili.
- **Dipendenze**: P3-T01, P3-T02a.
- **File/componenti**: `assets/source/`, `assets/processed/`, script di processing (`scripts/process-cards.ts` o simile).
- **Criteri di completamento**: almeno una carta reale processata end-to-end, PDF originale intatto in `assets/source/`.
- **Test necessari**: verifica visiva della texture generata, verifica che il PDF sorgente non sia stato alterato.

### P3-T03 — Schema DB percorso personale

- **Obiettivo**: migrazioni per `user_specialita`, `user_competenza`, `user_tappa` come relazioni separate dal contenuto ufficiale.
- **Dipendenze**: P3-T01.
- **File/componenti**: `supabase/migrations/`.
- **Criteri di completamento**: RLS attiva (solo il proprietario legge/scrive la propria riga); schema verificato con test di isolamento.
- **Test necessari**: test RLS (utente A non può leggere/scrivere righe di utente B).

### P3-T04 — Catalogo Specialità (UI)

- **Obiettivo**: vista catalogo che mostra le Specialità ufficiali disponibili.
- **Dipendenze**: P3-T01, P2-T03.
- **File/componenti**: `app/specialita/page.tsx` o superficie tavolo equivalente.
- **Criteri di completamento**: catalogo renderizzato da dati reali Supabase, non mock statico.
- **Test necessari**: verifica dati, verifica che il contenuto ufficiale non sia editabile da UI.

### P3-T05 — Carta di Specialità: dettaglio + progresso + note

- **Obiettivo**: apertura carta con contenuto ufficiale, progresso personale, obiettivi, note, Maestro associato — nell'ordine descritto in `docs/UX.md` (ufficiale → progressi → note → Maestro).
- **Dipendenze**: P3-T03, P3-T04, P2-T04.
- **File/componenti**: `app/specialita/[id]/CardDetail.tsx`.
- **Criteri di completamento**: utente può segnare progresso/obiettivi e aggiungere note; contenuto ufficiale resta read-only.
- **Test necessari**: test che la scrittura utente non modifichi mai la riga di contenuto ufficiale.

### P3-T06 — Competenze (replica pattern Specialità)

- **Obiettivo**: stesso lavoro di P3-T04/P3-T05 applicato a Competenze.
- **Dipendenze**: P3-T05 (pattern validato).
- **Criteri di completamento**: parità funzionale con Specialità.
- **Test necessari**: come P3-T05.

### P3-T07 — Tappe (percorso personale)

- **Obiettivo**: visualizzazione Tappa attuale, progresso, obiettivi, collegamenti a Specialità/Competenze.
- **Dipendenze**: P3-T05, P3-T06.
- **Criteri di completamento**: collegamenti tra Tappa e Specialità/Competenze completate visibili e corretti.
- **Test necessari**: verifica coerenza dei collegamenti con dati di test.

---

## Phase 4 — Personal Data (note, obiettivi, Maestri)

### P4-T01 — Note personali (CRUD)

- **Obiettivo**: creazione/modifica/eliminazione note collegate a Specialità/Competenze/Tappe, sempre di proprietà esclusiva dell'utente.
- **Dipendenze**: P3-T05.
- **Criteri di completamento**: RLS verificata; nessuna nota visibile ad altri utenti salvo condivisione esplicita futura (non nello scope attuale).
- **Test necessari**: test RLS su note.

### P4-T02 — Maestro interno (associazione a utente ORMA)

- **Obiettivo**: associare un Maestro che è già un utente ORMA al proprio percorso di Specialità/Competenza.
- **Dipendenze**: P3-T05.
- **Criteri di completamento**: associazione visibile su entrambi i lati (utente e Maestro, secondo permessi).
- **Test necessari**: test permessi di visibilità reciproca.

### P4-T03 — Maestro esterno (contatto senza account)

- **Obiettivo**: aggiunta manuale di un Maestro esterno senza richiedere creazione di account (vincolo esplicito in `CLAUDE.md` e `docs/DATA_MODEL.md`).
- **Dipendenze**: P3-T05.
- **File/componenti**: tabella `maestro_esterno` o equivalente, scoping per singolo utente.
- **Criteri di completamento**: nessun record `auth.users` creato per un Maestro esterno.
- **Test necessari**: test che verifica assenza di creazione account collaterale.

---

## Phase 5 — Authentication

### P5-T01 — Supabase Auth (registrazione/login)

- **Obiettivo**: flusso di registrazione e login con Supabase Auth.
- **Dipendenze**: P0-T04.
- **Criteri di completamento**: sessione persistente, redirect corretto a Home-tavolo post-login.
- **Test necessari**: test E2E login/logout.

### P5-T02 — Profilo utente e appartenenza a Reparto

- **Obiettivo**: onboarding che collega un nuovo utente a un `Profile` e a un `Reparto` esistente (o crea richiesta di associazione).
- **Dipendenze**: P5-T01, P6-T01 (schema Reparto — richiede quindi che almeno lo schema base `reparto`/`squadriglia` di P6-T01 sia anticipato prima o in parallelo a questo task, non strettamente dopo la Fase 5).
- **Criteri di completamento**: un utente senza Reparto ha un percorso di onboarding chiaro, non uno stato rotto.
- **Test necessari**: test flusso onboarding senza Reparto assegnato.

### P5-T03 — Gestione sessione e impostazioni account

- **Obiettivo**: pagina impostazioni personale (dati profilo, logout, gestione sessione).
- **Dipendenze**: P5-T01.
- **Criteri di completamento**: modifica profilo persistita e coerente con RLS (utente modifica solo sé stesso).
- **Test necessari**: test RLS su tabella profilo.

---

## Phase 6 — Supabase (schema Reparto/organizzazione)

### P6-T01 — Schema `reparto`, `squadriglia`

- **Obiettivo**: migrazioni per l'organizzazione scout.
- **Dipendenze**: P0-T04.
- **Criteri di completamento**: relazioni Reparto↔Squadriglia↔Profile corrette.
- **Test necessari**: test di integrità referenziale.

### P6-T02 — RLS multi-tenant per Reparto

- **Obiettivo**: policy che impediscono l'accesso automatico ai dati di Reparti diversi dal proprio (requisito esplicito `docs/PERMISSIONS.md`).
- **Dipendenze**: P6-T01.
- **Criteri di completamento**: test di isolamento tra due Reparti di prova superato.
- **Test necessari**: test RLS cross-reparto (utente Reparto A non legge dati Reparto B).

### P6-T03 — Ruoli (E/G, Capo, admin di Reparto)

- **Obiettivo**: modello di ruolo minimo per differenziare permessi (vedi `docs/PERMISSIONS.md` — "operazioni amministrative separate dai permessi normali").
- **Dipendenze**: P6-T01.
- **Criteri di completamento**: ruolo persistito e verificato in almeno una policy RLS reale.
- **Test necessari**: test che un E/G non possa eseguire azioni riservate ai Capi/admin.

---

## Phase 7 — Reparto (funzionalità)

### P7-T01 — Elenco membri del Reparto (profili limitati)

- **Obiettivo**: vista membri con solo le informazioni che i permessi consentono (`docs/UX.md` — "concentrarsi sulle informazioni scout pertinenti").
- **Dipendenze**: P6-T02, P6-T03.
- **Criteri di completamento**: nessun dato privato esposto di default.
- **Test necessari**: test che verifica campi esclusi per utenti non autorizzati.

### P7-T02 — Squadriglie (vista e appartenenza)

- **Obiettivo**: visualizzazione Squadriglie e membri.
- **Dipendenze**: P7-T01.
- **Criteri di completamento**: coerente con schema P6-T01.
- **Test necessari**: verifica dati.

### P7-T03 — Calendario Reparto

- **Obiettivo**: vista calendario (metafora fisica — agenda/foglio, non stile Google Calendar) per uscite/campi/eventi.
- **Dipendenze**: P6-T02.
- **File/componenti**: schema `attivita`/`evento`, componente calendario coerente con `docs/DESIGN.md`.
- **Criteri di completamento**: eventi filtrati per Reparto/permessi dell'utente.
- **Test necessari**: test RLS su visibilità eventi.

---

## Phase 8 — Maestri (ricerca globale)

### P8-T01 — Ricerca globale Maestri (cross-Reparto)

- **Obiettivo**: ricerca Maestri disponibili anche fuori dal proprio Reparto, mostrando solo informazioni esplicitamente rese ricercabili (`docs/PERMISSIONS.md`).
- **Dipendenze**: P4-T02, P6-T02.
- **Criteri di completamento**: un Maestro che non ha attivato la visibilità globale non compare in ricerca.
- **Test necessari**: test opt-in/opt-out di visibilità.

### P8-T02 — Filtri di ricerca (Specialità, Regione, Zona, disponibilità)

- **Obiettivo**: implementare i filtri descritti in `IDEA.md`.
- **Dipendenze**: P8-T01.
- **Criteri di completamento**: filtri combinabili, risultati coerenti con permessi.
- **Test necessari**: test query con combinazioni di filtri.

---

## Phase 9 — Calendario / Archivio (storico Reparto)

### P9-T01 — Schema `uscita`, `campo`, `luogo`

- **Obiettivo**: migrazioni per lo storico di Reparto.
- **Dipendenze**: P6-T01.
- **Criteri di completamento**: relazioni Uscita/Campo↔Luogo↔partecipanti↔Squadriglie corrette.
- **Test necessari**: test integrità referenziale.

### P9-T02 — Archivio fotografico e documenti (Supabase Storage)

- **Obiettivo**: upload e consultazione foto/documenti collegati a uscite/campi/luoghi.
- **Dipendenze**: P9-T01.
- **Criteri di completamento**: policy Storage coerenti con RLS Reparto; nessun bucket pubblico per contenuti privati.
- **Test necessari**: test accesso non autorizzato a bucket/file.

### P9-T03 — Vista Archivio navigabile

- **Obiettivo**: UI di consultazione storica coerente con il linguaggio visivo del tavolo (`docs/UX.md`).
- **Dipendenze**: P9-T02.
- **Criteri di completamento**: navigazione per Campo→Luogo→partecipanti→attività→foto→documenti come da `docs/DATA_MODEL.md`.
- **Test necessari**: verifica visiva, verifica permessi.

---

## Phase 10 — Security / Accessibility / Performance

### P10-T01 — Audit RLS completo

- **Obiettivo**: verificare che ogni tabella con dati personali o di Reparto abbia policy RLS esplicite (nessuna tabella "aperta" per default).
- **Dipendenze**: tutte le fasi con schema DB (3, 4, 6, 9).
- **Criteri di completamento**: checklist RLS per tabella, nessuna eccezione non documentata.
- **Test necessari**: test automatizzati RLS per ogni tabella sensibile.

### P10-T02 — Accessibilità UI non-3D

- **Obiettivo**: form, pannelli contenuto, navigazione da tastiera e screen reader sui componenti 2D/DOM.
- **Dipendenze**: Fase 3–7 (componenti UI esistenti).
- **Criteri di completamento**: controlli interattivi 2D raggiungibili da tastiera, contrasto testo conforme.
- **Test necessari**: audit accessibilità (es. axe) sui componenti DOM.

### P10-T03 — Performance 3D su mobile

- **Obiettivo**: verificare frame rate e uso GPU della scena tavolo su device mobile reali/simulati.
- **Dipendenze**: P2-T05.
- **Criteri di completamento**: soglia minima di frame rate definita e rispettata su device di riferimento.
- **Test necessari**: profiling performance su almeno un device mobile reale.

---

## Phase 11 — Production QA

### P11-T01 — Verifica end-to-end dei flussi critici

- **Obiettivo**: login → tavolo → apertura carta Specialità → segna progresso → nota → chiusura, senza errori console.
- **Dipendenze**: tutte le fasi precedenti.
- **Criteri di completamento**: flusso completo verificato manualmente e via test E2E.
- **Test necessari**: suite E2E completa (Playwright o equivalente scelto in DEC-006).

### P11-T02 — Revisione privacy/RLS pre-produzione

- **Obiettivo**: ultima verifica che nessun dato privato sia esposto da API pubbliche non protette (`docs/PERMISSIONS.md`).
- **Dipendenze**: P10-T01.
- **Criteri di completamento**: nessun advisor di sicurezza Supabase critico aperto.
- **Test necessari**: `get_advisors` (Supabase) pulito o eccezioni documentate.

### P11-T03 — Go-live checklist

- **Obiettivo**: variabili d'ambiente di produzione, dominio, monitoraggio errori minimo.
- **Dipendenze**: tutte.
- **Criteri di completamento**: deploy di produzione stabile, rollback plan noto.
- **Test necessari**: smoke test post-deploy.
