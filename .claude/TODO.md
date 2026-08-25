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

## Phase 2 — Interactive Table (scena 3D) — **completata**

### P2-T01 — Setup React Three Fiber e canvas base

- **Obiettivo**: integrare R3F in una Client Component isolata, con un piano tavolo minimale e luce base.
- **Dipendenze**: P1-T02, [DEC-003](DECISIONS.md#dec-003--3d-threejs--react-three-fiber-uso-selettivo).
- **File/componenti**: `components/three/TableCanvas.tsx` (Client Component, caricata con `next/dynamic` `ssr: false`), `TableTop.tsx`, `Lighting.tsx`, `materials/`.
- **Criteri di completamento**: scena 3D renderizza senza errori SSR, 60fps su desktop di riferimento.
- **Test necessari**: verifica visiva, check console errori, check performance base (frame time).
- **Stato**: completato. Scena verificata via Playwright (screenshot desktop), console pulita, build di produzione senza errori SSR. Il frame rate reale su GPU fisica resta non misurato — verifica su hardware reale rimossa dal piano di build ([DEC-025](DECISIONS.md#dec-025--p10-t03-frame-rate-reali-su-device-mobile-rimosso-dal-piano)), il budget quantitativo automatico (`tests/e2e/budget.ts`) resta la verifica di performance continua.

### P2-T02 — Decisione state management (chiude DEC-004)

- **Obiettivo**: scegliere e implementare la gestione dello stato scena (camera, oggetto focalizzato, blur) e la separazione dallo stato dati server.
- **Dipendenze**: P2-T01.
- **Criteri di completamento**: DEC-004 aggiornata da `Open Decision` a `Accepted`.
- **Test necessari**: nessuno specifico, verificato tramite P2-T03.
- **Stato**: completato. Zustand, `lib/scene/store.ts`; DEC-004 `Accepted`.

### P2-T03 — Modello 3D riutilizzabile per le carte

- **Obiettivo**: un solo modello geometria carta, texture intercambiabili per Specialità/Competenze/Tappe (vincolo esplicito in `CLAUDE.md`: niente geometria duplicata per carta).
- **Dipendenze**: P2-T01.
- **File/componenti**: `components/three/Card3D.tsx`, `geometry.ts` (geometrie singleton), `materials/textures.ts` (texture procedurali memoizzate).
- **Criteri di completamento**: più carte in scena condividono la stessa geometria; performance verificata con N carte di test.
- **Test necessari**: check draw calls, check memoria texture.
- **Stato**: completato. 20 draw calls, 636 triangoli, 10,5 MB di texture a riposo, dentro il budget di SDD §10 e verificato automaticamente in E2E. Nessun asset in `assets/processed/cards/`: in Fase 2 le texture sono procedurali, gli asset reali arrivano da P3-T02b.

### P2-T04 — Interazione: focus → camera → blur → contenuto → chiusura

- **Obiettivo**: implementare il pattern di interazione descritto in `docs/UX.md` (oggetto → primo piano → leggero movimento camera → tavolo sfocato → contenuto → chiusura → ritorno).
- **Dipendenze**: P2-T02, P2-T03.
- **File/componenti**: `components/three/CameraRig.tsx` e `SceneObjects.tsx` (sollevamento oggetto, hotspot accessibili), `components/panel/ObjectPanel.tsx` (contenuto DOM).
- **Criteri di completamento**: transizione fluida testata su almeno una carta placeholder; non deve "sembrare un cambio di pagina" (requisito esplicito UX).
- **Test necessari**: verifica visiva, check regressioni performance.
- **Stato**: completato. Apertura/chiusura verificate visivamente e in E2E, incluso il ritorno del focus da tastiera all'oggetto di partenza. Il contenuto del pannello è strutturale (ufficiale → progresso → note → Maestro) con stati vuoti: i dati reali arrivano in Fase 3.

### P2-T05 — Adattamento mobile della scena

- **Obiettivo**: prima versione dell'esperienza mobile ridisegnata (non scena desktop rimpicciolita), come richiesto da `docs/UX.md`.
- **Dipendenze**: P2-T04.
- **Criteri di completamento**: layout mobile distinto validato su almeno un device/simulatore reale.
- **Test necessari**: verifica responsive, check performance GPU mobile.
- **Stato**: completato come composizione 2D dedicata ([DEC-013](DECISIONS.md)), non come scena 3D adattata: su mobile la scena WebGL non viene nemmeno caricata. Validato a 390×844 in Chromium (screenshot + E2E); il check GPU mobile su device fisico è stato rimosso dal piano ([DEC-025](DECISIONS.md#dec-025--p10-t03-frame-rate-reali-su-device-mobile-rimosso-dal-piano)) — non rilevante comunque per questo task, dato che la scena WebGL non è mai caricata su mobile.

---

## Phase 3 — Specialità / Competenze / Tappe (contenuto ufficiale) — **completata, deploy incluso**

Tutti i task sono implementati e applicati al progetto Supabase reale (`ouffyxrhxhzqcduvgpon`) via MCP Supabase. La fonte del catalogo non sono i PDF (rivelatisi non utilizzabili, vedi DEC-005 aggiornata) ma un set di immagini fornito direttamente dall'utente (`assets/source/distintivi/`, 65 Specialità + 15 Brevetti + 3 Tappe), processato da `scripts/process-cards.ts` in `assets/processed/distintivi/` + `manifest.json`, seedato da `scripts/generate-seed.ts` in `supabase/migrations/20260812100500_seed_official_content.sql`.

**Deploy completato via MCP Supabase**: le 4 migrazioni (`20260812100000_official_content.sql`, `20260812100500_seed_official_content.sql`, `20260812101000_personal_progress.sql`, `20260812110000_rls_performance_fix.sql`) sono applicate al progetto reale; il bucket Storage pubblico `distintivi` è stato creato (policy `distintivi_public_read`) e gli 83 asset processati caricati con `scripts/upload-assets.sh` (verificato: URL pubblico raggiungibile, 200 `image/webp`). `get_advisors` post-deploy: nessun nuovo advisor di sicurezza; risolti tutti gli `auth_rls_initplan` e `unindexed_foreign_keys` introdotti dalle nuove tabelle (migrazione `20260812110000`) — restano solo 3 warning pre-esistenti su `profiles` (Fase 5, fuori scope) e gli "unused index" attesi su tabelle ancora vuote.

"Brevetto" (raggruppamento di più Specialità) è stato aggiunto come entità ufficiale non prevista nei documenti originali — vedi DEC-005 aggiornata. La composizione `brevetto_specialita` non è popolata: nessuna fonte disponibile indica quali Specialità formano ogni brevetto.

### P3-T01 — Schema DB contenuto ufficiale

- **Obiettivo**: migrazioni Supabase per `specialita`, `competenza`, `tappa` (contenuto ufficiale, non duplicato per utente — regola esplicita in `docs/DATA_MODEL.md`).
- **Dipendenze**: P0-T04.
- **File/componenti**: `supabase/migrations/`.
- **Criteri di completamento**: schema applicato, popolabile via seed di test.
- **Test necessari**: query di verifica struttura, test che nessuna colonna di progresso utente sia presente in queste tabelle.
- **Stato**: completato. `supabase/migrations/20260812100000_official_content.sql` — `specialita`, `tappa`, `competenza`, `brevetto`, `brevetto_specialita` (nuova entità, vedi nota di fase), RLS select-only per `authenticated`, nessuna policy di scrittura applicativa (DEC-008). Non ancora applicata al progetto Supabase reale (nessuna CLI/MCP collegata in questa sessione).

### P3-T02a — Migrazione `files/` → `assets/source/` e ispezione PDF

- **Obiettivo**: spostare i 3 PDF già forniti (`Carta di Specialità.pdf`, `CARTA DI COMPETENZA.pdf`, `Manuale-della-Branca-EG.pdf`, attualmente in `files/` alla radice) nella struttura definitiva `assets/source/`; ispezionarli (testo selezionabile vs scansione, layout) per chiudere [DEC-005](DECISIONS.md#dec-005--asset-pipeline-pdf--texture-web) e scegliere lo strumento di estrazione.
- **Dipendenze**: nessuna (può partire già in Fase 0, in parallelo).
- **File/componenti**: `assets/source/`.
- **Criteri di completamento**: PDF originali intatti e spostati in `assets/source/`; DEC-005 aggiornata da `Open Decision` a `Accepted` con lo strumento scelto.
- **Test necessari**: verifica che lo spostamento non abbia alterato i file (checksum prima/dopo).
- **Stato**: completato, ma con esito diverso dall'ipotesi originale. Ispezione: i 3 PDF hanno testo selezionabile ma **non sono un catalogo** (due moduli personali vuoti di un Gruppo, un manuale metodologico in prosa) — restano in `files/`, non spostati. La fonte reale del catalogo è `assets/source/distintivi/` (immagini fornite dall'utente). DEC-005 aggiornata di conseguenza (Accepted, non più Open Decision).

### P3-T02b — Asset pipeline PDF → texture

- **Obiettivo**: implementare la pipeline `PDF → estrazione → processing → WebP/PNG` per le carte di Specialità/Competenze, usando i PDF reali ora disponibili.
- **Dipendenze**: P3-T01, P3-T02a.
- **File/componenti**: `assets/source/`, `assets/processed/`, script di processing (`scripts/process-cards.ts` o simile).
- **Criteri di completamento**: almeno una carta reale processata end-to-end, PDF originale intatto in `assets/source/`.
- **Test necessari**: verifica visiva della texture generata, verifica che il PDF sorgente non sia stato alterato.
- **Stato**: completato, adattato alla fonte reale (immagini, non PDF). `scripts/process-cards.ts` normalizza i nomi (mappa esplicita di correzioni), genera slug, converte in WebP (sharp) in `assets/processed/distintivi/`, produce `manifest.json`. `scripts/generate-seed.ts` genera la migrazione di seed da quel manifest. `components/three/materials/textures.ts` (`getCardTexture`) carica la texture reale via `THREE.TextureLoader` quando l'oggetto ha `imageUrl`, altrimenti resta sul placeholder procedurale di Fase 2. Verificato: `npm run test`, `tsc --noEmit`, `npm run lint`, `npm run build` puliti.

### P3-T03 — Schema DB percorso personale

- **Obiettivo**: migrazioni per `user_specialita`, `user_competenza`, `user_tappa` come relazioni separate dal contenuto ufficiale.
- **Dipendenze**: P3-T01.
- **File/componenti**: `supabase/migrations/`.
- **Criteri di completamento**: RLS attiva (solo il proprietario legge/scrive la propria riga); schema verificato con test di isolamento.
- **Test necessari**: test RLS (utente A non può leggere/scrivere righe di utente B).
- **Stato**: completato. `supabase/migrations/20260812101000_personal_progress.sql` — `user_specialita`, `user_competenza`, `user_tappa`, `nota` (generica per tipo+riferimento_id), `maestro_esterno` (anticipata per FK, popolamento reale in P4-T03). RLS `auth.uid() = profile_id` + funzione condivisa `has_active_consent()` che nega l'accesso quando `stato_consenso_genitoriale = 'in_attesa'` (DEC-010). Primo test RLS del progetto: `tests/unit/rls/personalTables.rls.test.ts`, richiede due utenti di prova via env (`RLS_TEST_USER_A/B_EMAIL/PASSWORD`), si salta da solo senza — pattern riusabile in Fase 6/9/10.

### P3-T04 — Catalogo Specialità (UI)

- **Obiettivo**: vista catalogo che mostra le Specialità ufficiali disponibili.
- **Dipendenze**: P3-T01, P2-T03.
- **File/componenti**: `app/specialita/page.tsx` o superficie tavolo equivalente.
- **Criteri di completamento**: catalogo renderizzato da dati reali Supabase, non mock statico.
- **Test necessari**: verifica dati, verifica che il contenuto ufficiale non sia editabile da UI.
- **Stato**: completato. `app/specialita/page.tsx` + `app/specialita/actions.ts` (`startSpecialita`, Server Action, idempotente su unique constraint). Nessuna policy di scrittura su `specialita` lato DB: l'azione scrive solo su `user_specialita`. La Home (`app/page.tsx`) mostra sul tavolo solo le carte con progresso attivo (`lib/queries/cards.ts` → `getTableCards`), non l'intero catalogo — il resto si consulta da questa vista.

### P3-T05 — Carta di Specialità: dettaglio + progresso + note

- **Obiettivo**: apertura carta con contenuto ufficiale, progresso personale, obiettivi, note, Maestro associato — nell'ordine descritto in `docs/UX.md` (ufficiale → progressi → note → Maestro).
- **Dipendenze**: P3-T03, P3-T04, P2-T04.
- **File/componenti**: `app/specialita/[id]/CardDetail.tsx`.
- **Criteri di completamento**: utente può segnare progresso/obiettivi e aggiungere note; contenuto ufficiale resta read-only.
- **Test necessari**: test che la scrittura utente non modifichi mai la riga di contenuto ufficiale.
- **Stato**: completato, con uno scope minimo dichiarato. `components/panel/ObjectPanel.tsx` legge `SceneObject.card` (dati reali, via `lib/scene/SceneDataContext.tsx`) e mostra le 4 sezioni nell'ordine prescritto con contenuto reale; senza `card` (oggetti decorativi, set dimostrativo di Fase 2 nei test) resta sui placeholder originali — nessun test esistente rotto. Azioni in `app/actions/personalProgress.ts`: `markCompleted` (solo specialita/competenza, unica colonna `stato`) e `addNota` (crea una nota, FormData). Nessun testo ufficiale descrittivo: lo schema non lo prevede (nessuna fonte disponibile) — la sezione "Contenuto ufficiale" mostra nome/immagine, non obiettivi inventati. Il CRUD note completo (modifica/eliminazione) resta a P4-T01 come da questo piano.

### P3-T06 — Competenze (replica pattern Specialità)

- **Obiettivo**: stesso lavoro di P3-T04/P3-T05 applicato a Competenze.
- **Dipendenze**: P3-T05 (pattern validato).
- **Criteri di completamento**: parità funzionale con Specialità.
- **Test necessari**: come P3-T05.
- **Stato**: completato. `app/competenze/page.tsx` + `app/competenze/actions.ts` (`startCompetenza`), stesso pattern di Specialità. Il dettaglio (pannello) era già generico per `kind` fin da P3-T05, nessun codice specifico aggiuntivo necessario. Catalogo seedato con 5 voci segnaposto (nessuna fonte reale disponibile, DEC-005): da sostituire quando arriva materiale ufficiale.

### P3-T07 — Tappe (percorso personale)

- **Obiettivo**: visualizzazione Tappa attuale, progresso, obiettivi, collegamenti a Specialità/Competenze.
- **Dipendenze**: P3-T05, P3-T06.
- **Criteri di completamento**: collegamenti tra Tappa e Specialità/Competenze completate visibili e corretti.
- **Test necessari**: verifica coerenza dei collegamenti con dati di test.
- **Stato**: completato come vista informativa, senza gating. `app/tappe/page.tsx` + `app/tappe/actions.ts` (`startTappa`, `markTappaCompleted` — `user_tappa` non ha colonna stato, solo date). Mostra il conteggio di Specialità/Competenze completate come contesto, non come regola di sblocco: nessuna regola di progressione è specificata nei documenti di prodotto, e non ne è stata inventata una qui (se serve, va decisa esplicitamente e registrata in DECISIONS.md prima di implementarla).

---

## Phase 4 — Personal Data (note, obiettivi, Maestri) — **completata, deploy incluso**

Lo schema DB (`nota`, `maestro_esterno`, colonne `maestro_profile_id`/`maestro_esterno_id` su `user_specialita`/`user_competenza`) esisteva già da P3-T03: questa fase ha aggiunto la superficie applicativa (Server Actions + UI nel pannello) mancante.

### P4-T01 — Note personali (CRUD)

- **Obiettivo**: creazione/modifica/eliminazione note collegate a Specialità/Competenze/Tappe, sempre di proprietà esclusiva dell'utente.
- **Dipendenze**: P3-T05.
- **Criteri di completamento**: RLS verificata; nessuna nota visibile ad altri utenti salvo condivisione esplicita futura (non nello scope attuale).
- **Test necessari**: test RLS su note.
- **Stato**: completato. `updateNota`/`deleteNota` in `app/actions/personalProgress.ts` (accanto ad `addNota`, ora con controllo esplicito dell'errore Supabase come `startSpecialita`/`startCompetenza`), filtro `id`+`profile_id` come difesa in profondità oltre alla RLS già esistente (`nota_update_own`/`nota_delete_own`, P3-T03). UI in `components/panel/ObjectPanel.tsx` (`NoteSection`): ogni nota è un form di modifica precompilato + un form di eliminazione, nessuna conferma richiesta (coerente con "Segna come completata").

### P4-T02 — Maestro interno (associazione a utente ORMA)

- **Obiettivo**: associare un Maestro che è già un utente ORMA al proprio percorso di Specialità/Competenza.
- **Dipendenze**: P3-T05.
- **Criteri di completamento**: associazione visibile su entrambi i lati (utente e Maestro, secondo permessi).
- **Test necessari**: test permessi di visibilità reciproca.
- **Stato**: completato con uno scope ridotto dichiarato. Reparto (Fase 6/7) e ricerca globale Maestri (Fase 8) non esistono ancora e un utente non può leggere il profilo di un altro (RLS `profiles`): l'associazione avviene tramite ricerca per **email esatta**, funzione `find_profile_by_email` (SECURITY DEFINER, nessuna ricerca parziale/elenco, `supabase/migrations/20260812122725_find_profile_by_email.sql` + revoke `anon` in `20260812122815_find_profile_by_email_revoke_anon.sql`, vedi correzione in `CORRECTIONS.md`). `assignMaestroInterno` in `app/actions/personalProgress.ts`. Nessuna visibilità reciproca lato Maestro implementata (fuori scope, non specificata da `docs/PERMISSIONS.md` oltre al principio generale): il Maestro non vede oggi di essere stato associato.

### P4-T03 — Maestro esterno (contatto senza account)

- **Obiettivo**: aggiunta manuale di un Maestro esterno senza richiedere creazione di account (vincolo esplicito in `CLAUDE.md` e `docs/DATA_MODEL.md`).
- **Dipendenze**: P3-T05.
- **File/componenti**: tabella `maestro_esterno` o equivalente, scoping per singolo utente.
- **Criteri di completamento**: nessun record `auth.users` creato per un Maestro esterno.
- **Test necessari**: test che verifica assenza di creazione account collaterale.
- **Stato**: completato. `addMaestroEsterno` in `app/actions/personalProgress.ts`: valida `nome` (obbligatorio) e `contatto` (opzionale), inserisce su `maestro_esterno` (già esistente da P3-T03) e aggiorna `maestro_esterno_id` sulla riga di percorso, azzerando `maestro_profile_id` (vincolo di mutua esclusione a DB). UI condivisa con P4-T02 nella sezione "Maestro" del pannello, mostrata solo quando nessun Maestro è ancora associato.

**Deploy**: migrazione applicata al progetto Supabase reale (`ouffyxrhxhzqcduvgpon`) via MCP Supabase. `get_advisors` post-deploy: nessun nuovo advisor di sicurezza (i warning esistenti — `confirm_parental_consent` callable da `anon`/`authenticated`, password leak protection disattivata — sono pre-esistenti; `find_profile_by_email` è callable solo da `authenticated`, come da disegno).

---

## Phase 5 — Authentication — **completata, deploy incluso**

P5-T02 non ha più richiesto di anticipare lo schema Reparto/Squadriglia completo di P6-T01: è stata creata solo la tabella `reparto` minima (id, nome), sufficiente a sbloccare l'onboarding. Squadriglia resta interamente in Fase 6/7.

### P5-T00 — Schema `profiles`: campi età/consenso + RLS

- **Obiettivo**: migrazione Supabase per la tabella `profiles` con i campi di consenso definiti in [DEC-010](DECISIONS.md#dec-010--registrazione-minorenni-auto-registrazione-con-consenso-genitoriale-verificato) (`data_nascita`, `consenso_privacy_accettato_at`, `privacy_policy_versione`, `stato_consenso_genitoriale`, `genitore_email`, `consenso_genitoriale_token`, `consenso_genitoriale_confermato_at`) e policy RLS che negano accesso quando `stato_consenso_genitoriale = 'in_attesa'`.
- **Dipendenze**: P0-T04.
- **File/componenti**: `supabase/migrations/`.
- **Criteri di completamento**: migrazione applicata; test RLS che verifica che un profilo `in_attesa` non sia leggibile/scrivibile fuori dal proprio flusso di attesa.
- **Test necessari**: test RLS dedicato.

### P5-T01 — Supabase Auth (registrazione/login) con verifica età

- **Obiettivo**: flusso di registrazione e login con Supabase Auth; calcolo età da `data_nascita` in fase di registrazione; se età < 14 anni, richiedere email del genitore/tutore e portare l'account in stato `in_attesa_consenso_genitoriale` invece di attivarlo subito.
- **Dipendenze**: P0-T04, P5-T00.
- **Criteri di completamento**: sessione persistente, redirect corretto a Home-tavolo post-login per account attivi; account `in_attesa_consenso_genitoriale` reindirizzati a una pagina di attesa, non alla Home-tavolo.
- **Test necessari**: test E2E login/logout; test registrazione ≥14 anni vs <14 anni.

### P5-T01b — Provider email transazionale e conferma consenso genitoriale

- **Obiettivo**: scegliere un provider email transazionale (nuova dipendenza esterna, da valutare esplicitamente — es. Resend/Postmark) per inviare al genitore/tutore il link univoco di conferma consenso; endpoint che valida il token, registra `consenso_genitoriale_confermato_at` e sblocca l'account.
- **Dipendenze**: P5-T00, P5-T01.
- **Criteri di completamento**: click sul link sblocca l'account in stato `confermato`; link a scadenza e monouso; nessun dato del minore accessibile prima della conferma.
- **Test necessari**: test token scaduto/già usato/non valido; test che l'account resti bloccato finché non confermato.

### P5-T02 — Profilo utente e appartenenza a Reparto

- **Obiettivo**: onboarding che collega un nuovo utente a un `Profile` e a un `Reparto` esistente (o crea richiesta di associazione).
- **Dipendenze**: P5-T01, P6-T01 (schema Reparto — richiede quindi che almeno lo schema base `reparto`/`squadriglia` di P6-T01 sia anticipato prima o in parallelo a questo task, non strettamente dopo la Fase 5).
- **Criteri di completamento**: un utente senza Reparto ha un percorso di onboarding chiaro, non uno stato rotto.
- **Test necessari**: test flusso onboarding senza Reparto assegnato.
- **Stato**: completato. `supabase/migrations/20260812130000_reparto_onboarding.sql` — tabella `reparto` minima (id, nome; seed manuale, nessuna scrittura applicativa, come DEC-008), `profiles.reparto_id` (popolato solo dall'approvazione), `richiesta_reparto` (stato in_attesa/approvata/rifiutata, indice unico parziale per una sola richiesta pendente per utente), funzione `decidi_richiesta_reparto()` (SECURITY DEFINER). Onboarding utente in `app/onboarding-reparto/` (form di richiesta), approvazione admin in `app/admin/richieste-reparto/`, gate in `lib/supabase/middleware.ts` (redirect a `/onboarding-reparto` se `reparto_id` è nullo). L'approvazione riusa `profiles.is_admin` (DEC-015) come permesso — temporaneo, vedi [DEC-016](DECISIONS.md#dec-016--approvazione-reparto-riuso-temporaneo-di-is_admin), da sostituire quando arriverà il modello Capo/Admin-di-Reparto in P6-T03. Squadriglia resta interamente fuori scope.

### P5-T03 — Gestione sessione e impostazioni account

- **Obiettivo**: pagina impostazioni personale (dati profilo, logout, gestione sessione).
- **Dipendenze**: P5-T01.
- **Criteri di completamento**: modifica profilo persistita e coerente con RLS (utente modifica solo sé stesso).
- **Test necessari**: test RLS su tabella profilo.
- **Stato**: completato. `app/impostazioni/` (nome editabile via `components/settings/ProfiloForm.tsx`, `useActionState`; data di nascita e Reparto in sola lettura; logout). Nessuna migrazione necessaria: `nome` era già coperto da `profiles_update_own`. Nessuna navigazione persistente esisteva nell'app prima di questo task: aggiunto un piccolo link "Impostazioni" nell'angolo del tavolo (`components/table/TableExperience.tsx`), visibile solo quando nessun oggetto è a fuoco.

**Deploy**: migrazioni `20260812130000_reparto_onboarding.sql` e `20260812130600_reparto_fk_indexes.sql` applicate al progetto Supabase reale (`ouffyxrhxhzqcduvgpon`) via MCP Supabase. `get_advisors` post-deploy: nessun advisor di sicurezza nuovo (il warning `authenticated_security_definer_function_executable` su `decidi_richiesta_reparto` è atteso, stesso pattern di `find_profile_by_email` — la funzione verifica `is_admin()` internamente); un fix di performance applicato subito dopo per gli indici FK mancanti su `profiles.reparto_id`/`richiesta_reparto.reparto_id`/`richiesta_reparto.decisa_da` (stesso tipo di fix di `20260812110000_rls_performance_fix.sql`, Fase 3). Nessun Reparto reale è stato seedato: `supabase/migrations/20260812130500_seed_reparto.sql` resta un template con nome placeholder, non applicato — da compilare a mano con il nome reale prima che l'onboarding sia utilizzabile in produzione.

---

## Phase 6 — Supabase (schema Reparto/organizzazione) — **completata, deploy incluso**

Tutti e tre i task sono stati chiusi insieme: `squadriglia` (P6-T01), le relative policy scoped-per-Reparto (P6-T02) e il modello di ruolo "Capo" (P6-T03, [DEC-017](DECISIONS.md#dec-017--ruolo-capo-scoped-al-reparto-fusione-con-admin-di-reparto)) sono strettamente accoppiati: il ruolo Capo è ciò che rende utile sia le policy di scrittura su `squadriglia` sia l'estensione dell'onboarding Reparto (chiude [DEC-016](DECISIONS.md#dec-016--approvazione-reparto-riuso-temporaneo-di-is_admin)).

**Deploy** (via MCP Supabase, progetto `ouffyxrhxhzqcduvgpon`): 4 migrazioni applicate — `reparto_ruolo` (`profiles.ruolo`, `is_capo_reparto()`), `squadriglia` (tabella + RLS + `profiles.squadriglia_id` + estensione trigger), `capo_richiesta_reparto` (policy Capo su `richiesta_reparto`/`profiles`, `decidi_richiesta_reparto()` aggiornata), `merge_capo_select_policies` (fix `multiple_permissive_policies` post-`get_advisors`, stesso pattern di `20260812120500_merge_admin_select_policies.sql`). `get_advisors` post-deploy: nessun nuovo advisor rispetto alla baseline pre-esistente.

**Limite dichiarato**: nessun test RLS automatizzato copre l'isolamento positivo cross-Reparto per un Capo reale — `ruolo`/`reparto_id`/`squadriglia_id` sono scrivibili solo da SQL diretto (project owner) o da `decidi_richiesta_reparto()` (essa stessa gated su `is_admin`/`is_capo_reparto`, circolare per un bootstrap in test), stesso limite già presente per `is_admin` (DEC-015). Vedi `.claude/CORRECTIONS.md`. `tests/unit/rls/reparto.rls.test.ts` copre solo il percorso di diniego (ruolo `eg` di default non è mai Capo). Verificato invece via introspezione diretta (`pg_policies`/`pg_proc` su MCP `execute_sql`): le policy e funzioni applicate combaciano esattamente col design.

### P6-T01 — Schema `reparto`, `squadriglia`

- **Obiettivo**: migrazioni per l'organizzazione scout.
- **Dipendenze**: P0-T04.
- **Criteri di completamento**: relazioni Reparto↔Squadriglia↔Profile corrette.
- **Test necessari**: test di integrità referenziale.
- **Stato**: completato. `squadriglia` (id, reparto_id FK→reparto, nome, created_at, unique(reparto_id, nome), indice su reparto_id), `profiles.squadriglia_id` (FK→squadriglia, indicizzato). Scrittura self-service bloccata dalla stessa estensione del trigger `profiles_block_self_consent_update` usata per `reparto_id` (P5-T02). **Fuori scope qui, deliberatamente**: nessuna funzione di assegnazione Squadriglia né UI — rimandate a P7-T02 insieme alla vista "Squadriglie", coerente con "Squadriglia resta fuori scope" già dichiarato in P5-T02.

### P6-T02 — RLS multi-tenant per Reparto

- **Obiettivo**: policy che impediscono l'accesso automatico ai dati di Reparti diversi dal proprio (requisito esplicito `docs/PERMISSIONS.md`).
- **Dipendenze**: P6-T01.
- **Criteri di completamento**: test di isolamento tra due Reparti di prova superato.
- **Test necessari**: test RLS cross-reparto (utente Reparto A non legge dati Reparto B).
- **Stato**: completato per `squadriglia` (SELECT scoped a `profiles.reparto_id = squadriglia.reparto_id` o `is_admin()`, a differenza di `reparto` che resta leggibile da chiunque per l'onboarding). Isolamento cross-Reparto verificato via introspezione diretta delle policy applicate (MCP `execute_sql` su `pg_policies`), non con un test automatizzato positivo (vedi limite dichiarato sopra e `.claude/CORRECTIONS.md`).

### P6-T03 — Ruoli (E/G, Capo, admin di Reparto)

- **Obiettivo**: modello di ruolo minimo per differenziare permessi (vedi `docs/PERMISSIONS.md` — "operazioni amministrative separate dai permessi normali").
- **Dipendenze**: P6-T01.
- **Criteri di completamento**: ruolo persistito e verificato in almeno una policy RLS reale.
- **Test necessari**: test che un E/G non possa eseguire azioni riservate ai Capi/admin.
- **Stato**: completato con [DEC-017](DECISIONS.md#dec-017--ruolo-capo-scoped-al-reparto-fusione-con-admin-di-reparto) (fonde "Capo" e "Admin di Reparto" in un ruolo unico scoped al Reparto, chiudendo l'Open Decision di `docs/SDD.md` §6/§29). `profiles.ruolo` (`'eg'|'capo'`, default `'eg'`), `is_capo_reparto(target_reparto_id)`. Verificato in policy RLS reali: `squadriglia` (insert/update/delete), `richiesta_reparto`/`profiles` (select per il Capo), `decidi_richiesta_reparto()` (chiude DEC-016). `app/admin/richieste-reparto/page.tsx` aggiornata per accettare anche `ruolo = 'capo'`, non solo `is_admin`. Nessuna UI per assegnare il ruolo: attivato manualmente via SQL, stesso pattern non derogabile di `is_admin` (DEC-015).

---

## Phase 7 — Reparto (funzionalità) — **completata**

Implementati tutti i 3 task con migrazione `20260823100000_reparto_funzionalita.sql` ([DEC-018](DECISIONS.md#dec-018--funzionalità-di-reparto-visibilità-membri-assegnazione-squadriglie-e-calendario-fase-7)), pagina dedicata `/reparto` con tab Membri, Squadriglie e Calendario, Server Actions e integrazione dinamica dell'oggetto `calendario` sul tavolo scout.

### P7-T01 — Elenco membri del Reparto (profili limitati)

- **Obiettivo**: vista membri con solo le informazioni che i permessi consentono (`docs/UX.md` — "concentrarsi sulle informazioni scout pertinenti").
- **Dipendenze**: P6-T02, P6-T03.
- **Criteri di completamento**: nessun dato privato esposto di default.
- **Test necessari**: test che verifica campi esclusi per utenti non autorizzati.
- **Stato**: completato. Policy RLS estese per `profiles`, `user_specialita`, `user_competenza` e `user_tappa` per i membri dello stesso Reparto; dati sensibili (data di nascita, email del genitore, note personali) esclusi dalla vista; filtri per nome e Squadriglia in `app/reparto/MembriSection.tsx`; test unitari in `tests/unit/repartoComponents.test.tsx`.

### P7-T02 — Squadriglie (vista e appartenenza)

- **Obiettivo**: visualizzazione Squadriglie e membri.
- **Dipendenze**: P7-T01.
- **Criteri di completamento**: coerente con schema P6-T01.
- **Test necessari**: verifica dati.
- **Stato**: completato. Funzione PostgreSQL `assegna_squadriglia` (SECURITY DEFINER, riservata ai Capi/Admin), UI di consultazione Squadriglie e membri non assegnati in `app/reparto/SquadriglieSection.tsx`, controlli di creazione/rinomina/eliminazione Squadriglie e assegnazione membri con Server Actions (`app/reparto/actions.ts`).

### P7-T03 — Calendario Reparto

- **Obiettivo**: vista calendario (metafora fisica — agenda/foglio, non stile Google Calendar) per uscite/campi/eventi.
- **Dipendenze**: P6-T02.
- **File/componenti**: schema `evento`, componente calendario coerente con `docs/DESIGN.md`.
- **Criteri di completamento**: eventi filtrati per Reparto/permessi dell'utente.
- **Test necessari**: test RLS su visibilità eventi.
- **Stato**: completato. Tabella `evento` con RLS multi-tenant (lettura per membri con consenso, scrittura per Capi/Admin); UI agenda scout in `app/reparto/CalendarioSection.tsx` con creazione/modifica/eliminazione; integrazione dinamica con l'oggetto `calendario` sul tavolo scout tramite `ObjectPanel` (`components/panel/ObjectPanel.tsx`) e query `getTableEvents` (`lib/queries/cards.ts`).

### Nota aperta — Reparto (`app/reparto/`, `app/onboarding-reparto/`) da rivedere: non rispetta la metafora del tavolo

Segnalato dal proprietario del progetto (2026-08-23): le pagine `app/reparto/*` e `app/onboarding-reparto/` sono route Next.js a pagina piena, fuori dalla scena tavolo — violano il vincolo §15 di `PROJECT.md` ("Non trasformare la Home in una dashboard/sidebar standard") e il principio 1 di `CLAUDE.md` ("Do not replace the desk concept with a standard sidebar/dashboard layout"). Vanno riportate dentro l'esperienza tavolo/carta (come già fatto per Calendario, che ha un oggetto `calendario` sul tavolo pur mantenendo l'`ObjectPanel` come superficie di contenuto), con più elementi/oggetti sul tavolo di quanto originariamente previsto in Fase 7. Contiene inoltre lo stesso bug di contrasto `--ink` senza sfondo esplicito descritto in `CORRECTIONS.md` ("Testo `--ink` illeggibile in dark mode...").

**Presa in carico dal Redesign trasversale qui sotto** (sessione del 2026-08-23): la nota si chiude con RD-T06/RD-T07.

---

## Redesign — Scena tavolo (trasversale, non è una nuova fase)

Sessione dedicata aperta il 2026-08-23 su richiesta del proprietario del progetto. Non altera la numerazione delle fasi di `CLAUDE.md`: riprende lavoro già svolto nelle Fasi 2, 3 e 7 e chiude la nota aperta qui sopra. Tre obiettivi, in ordine di priorità: (1) gli oggetti della scena non si riuscivano a cliccare; (2) ogni funzionalità dell'app deve essere un oggetto fisico sul tavolo, nessuna pagina piena; (3) resa visiva molto più vicina alla fotografia richiesta da `docs/DESIGN.md`.

### RD-T01 — Interazione: gli oggetti non si riescono a cliccare

- **Obiettivo**: rendere ogni oggetto interattivo cliccabile al centro, non solo di taglio.
- **Dipendenze**: nessuna.
- **File/componenti**: `components/three/SceneObjects.tsx`, `components/three/CameraRig.tsx`, `components/three/HitProxy.tsx` (nuovo), `components/three/geometry.ts`, `app/tavolo-dev/` (sandbox di sviluppo), `lib/supabase/middleware.ts`.
- **Criteri di completamento**: `document.elementFromPoint` al centro di ogni hotspot restituisce il canvas; un click di mouse apre il pannello; nessun errore in console mentre la camera si muove su una carta reale.
- **Test necessari**: `tests/unit/hitProxy.test.ts`, `tests/e2e/tableInteraction.spec.ts`.
- **Stato**: completato. Due cause distinte, entrambe registrate in `CORRECTIONS.md`: il wrapper `<Html>` di drei restava a `pointer-events: auto` e copriva ogni oggetto con un rettangolo di 80×96 px; `CameraRig` risolveva l'oggetto a fuoco nel set dimostrativo e sollevava un'eccezione dentro `useFrame` sugli id delle carte reali. Aggiunti volumi di presa invisibili (`HitProxy`) e quota di appoggio derivata dall'ingombro reale invece che da una tabella di costanti. I tre E2E sono stati verificati falliti sullo stato pre-fix prima di essere considerati validi.

### RD-T02 — Architettura della scena: registry di oggetti e superfici

- **Obiettivo**: un solo punto in cui si dichiara quali oggetti stanno sul tavolo e quale superficie apre ognuno, condiviso da scena 3D e composizione 2D.
- **Dipendenze**: RD-T01.
- **File/componenti**: `lib/scene/objects.ts` (`buildTable(context)`), `components/panel/ObjectPanel.tsx` + `components/panel/surfaces/`, `components/reparto/` (sezioni spostate da `app/reparto/`), `lib/scene/store.ts`.
- **Criteri di completamento**: nessun cambio visivo; `ObjectPanel` non contiene più uno `switch` per famiglia.
- **Test necessari**: unit sul registry delle superfici e su `buildTable`.
- **Stato**: completato. `buildTable(context)` come fonte unica degli oggetti (varia con il Reparto dell'utente), registro `kind → superficie` in `components/panel/surfaces/` al posto dello `switch` nel pannello, larghezza del foglio dichiarata per superficie, sezioni di Reparto spostate in `components/reparto/` e `RepartoTabs` eliminato (le tre schede sono ora tre oggetti distinti).

### RD-T03 — Caricamento dati per superficie

- **Obiettivo**: la Home non deve prefetchare membri, Squadriglie e catalogo per disegnare un tavolo.
- **Dipendenze**: RD-T02.
- **File/componenti**: `app/actions/surfaces.ts` (nuovo), hook `useSurfaceData`.
- **Criteri di completamento**: i dati di una superficie arrivano all'apertura dell'oggetto; autorizzazione sempre via RLS, mai `user_id` dal client.
- **Test necessari**: unit sullo stato di caricamento del pannello.
- **Stato**: completato. `app/actions/surfaces.ts` (sola lettura, identità dalla sessione, autorizzazione RLS) e hook `lib/scene/useSurfaceData.ts` con cache per pagina, gestione degli errori e `reload()` dopo ogni scrittura. Le sezioni riusate ricevono `onMutated`, perché `revalidatePath` invalida la cache del server e non quella del client.

### RD-T04 — Resa realistica: luce, ambiente, materiali

- **Obiettivo**: materiali PBR completi, ambiente per i riflessi, ombre morbide, tone mapping filmico ([DEC-020](DECISIONS.md)).
- **Dipendenze**: RD-T01.
- **File/componenti**: `components/three/Lighting.tsx`, `components/three/materials/*`, `components/three/geometry.ts`, `lib/scene/useSceneCapabilities.ts` (livelli di qualità).
- **Criteri di completamento**: verifica visiva a confronto con la baseline; nessun `EffectComposer` (DEC-014 resta valida).
- **Test necessari**: unit su texture/livelli di qualità, budget di performance E2E aggiornato.
- **Stato**: completato. Ambiente procedurale con `Lightformer` (nessun HDRI esterno), materiali dichiarati per materiale in `materials/Surfaces.tsx`, mappe di normali derivate dallo stesso tracciato del colore, occlusione/rugosità/metallicità impacchettate in una texture sola, lastre con angoli raccordati e spigolo smussato, livelli `alto`/`base` in `useSceneCapabilities` (forzabili con `?q=`). Direzione visiva conseguente: tavolo illuminato di sera, lampada come luce dominante.

### RD-T05 — Lampada a gas

- **Obiettivo**: nuovo oggetto decorativo con sorgente di luce reale, calda, coerente con `docs/DESIGN.md`.
- **Dipendenze**: RD-T04.
- **File/componenti**: `components/three/props/GasLamp.tsx`, `components/three/geometry.ts`, `docs/VISUAL_REFERENCE.md`.
- **Criteri di completamento**: la lampada illumina davvero gli oggetti vicini; budget di performance ri-misurato e documentato in `docs/SDD.md` §10.
- **Test necessari**: budget E2E, verifica visiva.
- **Stato**: completato. Lanterna da campo di ~30 cm (base, serbatoio, collare, vetro, cappello, maniglia) in `components/three/props/GasLamp.tsx`, con la sorgente calda della scena posizionata dentro il suo vetro: la luce ha una causa visibile. Decorativa, non intercetta eventi. Il vetro non usa `transmission` (costringerebbe il renderer a un passaggio in più su tutta la scena, per una differenza non percepibile a questa dimensione); il bagliore è un alone additivo molto tenue, non post-processing. Budget rimisurato: 21 draw call, 3 172 triangoli, 13,9 MB.

### RD-T06 — Reparto, Squadriglie, Calendario sul tavolo

- **Obiettivo**: chiudere la nota aperta di Fase 7 — nessuna pagina piena per le funzionalità di Reparto.
- **Dipendenze**: RD-T02, RD-T03.
- **File/componenti**: nuovi oggetti cassetta e guidone, superfici corrispondenti, `app/reparto/page.tsx` ridotta a deep-link.
- **Criteri di completamento**: `/reparto` apre il tavolo con l'oggetto a fuoco; le richieste di adesione sono visibili solo a Capo/admin.
- **Test necessari**: E2E di apertura superficie, unit sulle sezioni spostate.
- **Stato**: completato. Cassetta di Reparto (membri + richieste di adesione per Capi/admin) e guidone (Squadriglie), calendario completo con le azioni dei Capi; `/reparto` ridotta a deep-link. Chiude la nota aperta di Fase 7.

### RD-T07 — Percorso personale, Maestri, Impostazioni, adesione

- **Obiettivo**: album, quaderno, mappa, rubrica, tessera, busta; rimozione dei link di navigazione residui; `PaperPage` per le sole pagine che restano fuori dal tavolo.
- **Dipendenze**: RD-T06.
- **Criteri di completamento**: nessuna funzionalità raggiungibile solo da una pagina piena; contrasto testo corretto ovunque.
- **Test necessari**: E2E per ogni superficie, verifica contrasto in dark mode.
- **Stato**: completato. Album, quaderno, mappa, rubrica, tessera e busta con le rispettive superfici; `/impostazioni`, `/specialita`, `/competenze`, `/tappe`, `/onboarding-reparto` ridotte a deep-link; link di navigazione rimossi dalla scena; `components/layout/PaperPage.tsx` applicata alle sole pagine rimaste fuori dal tavolo (`app/admin/*`), che chiude la classe di bug `--ink` di `CORRECTIONS.md`.

### RD-T08 — Fallback 2D, suite e documentazione

- **Obiettivo**: parità di accesso nella composizione 2D (DEC-013) e allineamento finale dei documenti.
- **Dipendenze**: RD-T07.
- **Criteri di completamento**: gli stessi contenuti sono raggiungibili su viewport mobile; `PROJECT.md`, `SDD.md`, `UX.md`, `DECISIONS.md` allineati.
- **Test necessari**: suite completa unit + E2E.
- **Stato**: completato per la parte di parità 2D e suite (targhette per gli oggetti senza disegno piatto dedicato, 45 unit test e 6 E2E verdi). La verifica finale autenticata resta da fare con credenziali reali.

---

## Phase 8 — Maestri (ricerca globale) — **completata**

Implementati entrambi i task con la migrazione `20260823110000_maestri_ricerca_globale.sql` ([DEC-022](DECISIONS.md#dec-022--ricerca-globale-maestri-tabella-dedicata-con-opt-in-esplicito-e-funzione-di-ricerca-security-definer)): tabella `maestro_profilo` (opt-in esplicito `visibile`, campi dichiarati ricercabili) + `maestro_specialita` (N:N col contenuto ufficiale), funzione `cerca_maestri` (SECURITY DEFINER, espone solo i campi dichiarati), ricerca nella rubrica del tavolo (seconda scheda accanto a "I miei Maestri"), opt-in gestito dalla tessera (profilo/account) e associazione del Maestro trovato a una propria Specialità in corso.

### P8-T01 — Ricerca globale Maestri (cross-Reparto)

- **Obiettivo**: ricerca Maestri disponibili anche fuori dal proprio Reparto, mostrando solo informazioni esplicitamente rese ricercabili (`docs/PERMISSIONS.md`).
- **Dipendenze**: P4-T02, P6-T02.
- **Criteri di completamento**: un Maestro che non ha attivato la visibilità globale non compare in ricerca.
- **Test necessari**: test opt-in/opt-out di visibilità.
- **Stato**: completato. `maestro_profilo` (1:1 con `profiles`, `visibile` default false = opt-in, campi `regione`/`zona`/`localita`/`disponibile`) e `maestro_specialita` (N:N verso `specialita`) con RLS (proprietario scrive il proprio profilo; la lettura altrui è possibile solo quando `visibile` e con consenso attivo). `cerca_maestri(...)` SECURITY DEFINER, stesso pattern di `find_profile_by_email` (P4-T02): espone solo i campi dichiarati, esclude sé stessi e i profili in attesa di consenso, filtra sempre su `visibile = true`. UI: scheda "Cerca Maestri" nella rubrica (`components/panel/surfaces/MaestriSurface.tsx`), sezione "Maestro di Specialità" nella tessera (`ImpostazioniSurface.tsx`), associazione da risultato a una propria Specialità in corso (`associaMaestroDaRicerca`). Test RLS in `tests/unit/rls/maestri.rls.test.ts` (si salta senza credenziali, pattern P3-T03): non visibile → non compare e riga illeggibile; dopo opt-in → compare con i soli campi dichiarati; il profilo altrui non è modificabile.

### P8-T02 — Filtri di ricerca (Specialità, Regione, Zona, disponibilità)

- **Obiettivo**: implementare i filtri descritti in `IDEA.md`.
- **Dipendenze**: P8-T01.
- **Criteri di completamento**: filtri combinabili, risultati coerenti con permessi.
- **Test necessari**: test query con combinazioni di filtri.
- **Stato**: completato. Filtri combinabili nel form di ricerca (select Specialità dal catalogo ufficiale, input Regione/Zona, checkbox disponibilità) e nella funzione `cerca_maestri` (parametri `p_specialita_id`/`p_regione`/`p_zona`/`p_solo_disponibili`, match parziale su testo). La località si mostra nei risultati ma non filtra (SDD FR-14 non la elenca). Test: combinazioni coerenti/incoerenti coperte in `tests/unit/rls/maestri.rls.test.ts`; unit della superficie in `tests/unit/maestriSurface.test.tsx`.

**Deploy**: la migrazione `20260823110000_maestri_ricerca_globale.sql` risulta applicata al progetto Supabase reale (`ouffyxrhxhzqcduvgpon`) — la nota precedente ("da applicare") era stale, il deploy era già avvenuto senza il passaggio di chiusura che le fasi 3/5/6/7 eseguivano sempre prima di dichiararsi "deploy incluso". `get_advisors` post-hoc aveva mostrato avvisi mai triagiati: `auth_rls_initplan` e `multiple_permissive_policies` su `maestro_profilo`/`maestro_specialita`. Chiuso con `supabase/migrations/20260823174439_maestri_archivio_performance_fix.sql` (registrata con questo timestamp sul remoto, non quello del file creato in locale — stesso comportamento di `apply_migration` via MCP già documentato in `CORRECTIONS.md`), applicata il 2026-08-23: `get_advisors` post-fix non mostra più alcun avviso su `maestro_profilo`/`maestro_specialita` oltre a `cerca_maestri` come SECURITY DEFINER (atteso, per disegno).

---

## Phase 9 — Calendario / Archivio (storico Reparto) — **completata**

Implementati tutti e tre i task con la migrazione `20260823120000_archivio_reparto.sql` ([DEC-023](DECISIONS.md#dec-023--archivio-di-reparto-memoria-storica-separata-dal-calendario-metadati-in-postgres-e-file-in-bucket-privato)): schema storico (luogo, uscita, campo + join partecipanti/Squadriglie), metadati documenti in Postgres con file nel bucket privato `archivio` (policy Storage coerenti con la RLS di Reparto), e il **baule** come oggetto sul tavolo con superficie navigabile per ricordi e azioni di scrittura riservate ai Capi.

### P9-T01 — Schema `uscita`, `campo`, `luogo`

- **Obiettivo**: migrazioni per lo storico di Reparto.
- **Dipendenze**: P6-T01.
- **Criteri di completamento**: relazioni Uscita/Campo↔Luogo↔partecipanti↔Squadriglie corrette.
- **Test necessari**: test integrità referenziale.
- **Stato**: completato. Tabelle `luogo` (unique per nome nel Reparto), `uscita` (data, programma, materiale, note, luogo_id `on delete set null`), `campo` (anno, date, luogo_id) e quattro join con FK reali verso `profiles`/`squadriglia`; RLS lettura per i membri del Reparto, scrittura per Capi/admin (stesso pattern di `evento`); le policy dei join derivano la visibilità dal genitore. L'archivio è **separato** dal calendario `evento` (DEC-023): memoria storica, non eventi futuri. Nota sul criterio di test: l'integrità referenziale è garantita dai vincoli FK dello schema e va verificata via introspezione SQL — un test client con utenti `eg` non può popolare le tabelle (scrittura riservata ai Capi), stesso limite già dichiarato per l'isolamento cross-Reparto in Fase 6 (vedi `CORRECTIONS.md`).

### P9-T02 — Archivio fotografico e documenti (Supabase Storage)

- **Obiettivo**: upload e consultazione foto/documenti collegati a uscite/campi/luoghi.
- **Dipendenze**: P9-T01.
- **Criteri di completamento**: policy Storage coerenti con RLS Reparto; nessun bucket pubblico per contenuti privati.
- **Test necessari**: test accesso non autorizzato a bucket/file.
- **Stato**: completato. Metadati in `documento_archivio` (tipo foto/documento, entita_tipo + entita_id polymorphic, file_path, nome_file) con RLS come le altre tabelle di Reparto; bucket **privato** `archivio` (SDD §17) con policy su `storage.objects` che estraggono il Reparto dal percorso (`storage.foldername(name)[1]`, cast uuid protetto da regex): lettura per i membri, scrittura per i Capi. La UI apre i file con URL firmati a breve scadenza, mai URL pubblici. Azioni in `app/actions/archivio.ts` (`caricaDocumento` con rollback del file orfano se il metadato fallisce, `eliminaDocumento`, pulizia documenti alla cancellazione dell'entità). Test di diniego in `tests/unit/rls/archivio.rls.test.ts` (upload negato, lista vuota, bucket non pubblico).

### P9-T03 — Vista Archivio navigabile

- **Obiettivo**: UI di consultazione storica coerente con il linguaggio visivo del tavolo (`docs/UX.md`).
- **Dipendenze**: P9-T02.
- **Criteri di completamento**: navigazione per Campo→Luogo→partecipanti→attività→foto→documenti come da `docs/DATA_MODEL.md`.
- **Test necessari**: verifica visiva, verifica permessi.
- **Stato**: completato. Nuovo oggetto **baule** sul tavolo (kind `baule`, 3D in `components/three/props/Baule3D.tsx` con corpo, coperchio e fasce d'ottone, texture legno distinta dalla cassetta; composizione 2D con targhetta in `TableFlat`), visibile solo per chi appartiene a un Reparto (come cassetta/guidone/calendario). Superficie `components/panel/surfaces/ArchivioSurface.tsx` (larghezza "steso"): scaffale con Campi/Uscite/Luoghi → dettaglio con luogo, partecipanti, Squadriglie, programma/materiale/note, fotografie e documenti; per i Capi creazione/modifica/eliminazione di uscite, campi e luoghi (con multi-selezione di partecipanti e Squadriglie) e caricamento/eliminazione di foto e documenti. Query in `lib/queries/archivio.ts`, azioni in `app/actions/archivio.ts`. Unit in `tests/unit/archivioSurface.test.tsx` (scaffale, dettaglio, link firmati, permessi).

**Deploy**: la migrazione `20260823120000_archivio_reparto.sql` risulta applicata al progetto Supabase reale — stessa nota stale di Fase 8: il deploy era già avvenuto senza il passaggio di chiusura `get_advisors`. Avvisi mai triagiati: `unindexed_foreign_keys` (7 FK senza indice di copertura) e `auth_rls_initplan` (`auth.uid()` non wrappato nelle 7 policy `*_select_reparto`). Chiuso con lo stesso `supabase/migrations/20260823174439_maestri_archivio_performance_fix.sql` di Fase 8, applicata il 2026-08-23: `get_advisors` post-fix conferma gli indici creati (compaiono come `unused_index`, atteso per indici appena creati e mai ancora interrogati — non un problema) e nessun `auth_rls_initplan` residuo su `luogo`/`uscita`/`campo`/i quattro join/`documento_archivio`.

**Nota (chiarita, 2026-08-24)**: la migrazione `20260823172537_profiles_reparto_visibility_fix` era stata applicata da una sessione parallela in un worktree separato (lavoro di Fase 10, PR `worktree-fase-10-security-a11y-perf`) e mergiata in `main` mentre questa sessione era in corso su un altro worktree. Il file locale mancante è stato acquisito tramite `git merge origin/main` (risoluzione conflitti manuale su `lib/queries/reparto.ts`, che ha dovuto essere riscritto per usare `membri_reparto()` al posto di una select diretta su `profiles`, non più permessa dalla nuova RLS). Repository e progetto reale ora sincronizzati; vedi `.claude/CORRECTIONS.md` per il dettaglio della risoluzione.

---

## Phase 10 — Security / Accessibility / Performance — **completata**

### P10-T01 — Audit RLS completo

- **Obiettivo**: verificare che ogni tabella con dati personali o di Reparto abbia policy RLS esplicite (nessuna tabella "aperta" per default).
- **Dipendenze**: tutte le fasi con schema DB (3, 4, 6, 9).
- **Criteri di completamento**: checklist RLS per tabella, nessuna eccezione non documentata.
- **Test necessari**: test automatizzati RLS per ogni tabella sensibile.
- **Stato**: completato. Tutte le 24 tabelle `public.*` hanno RLS abilitata con policy esplicite (nessuna tabella aperta per default, verificato via `pg_policies`); le funzioni `SECURITY DEFINER` hanno tutte `search_path` fissato e grant coerenti con il ruolo previsto (`information_schema.routine_privileges`); i bucket Storage (`distintivi` pubblico, `archivio` privato) hanno policy coerenti con DEC-023.

  Trovata e corretta una fuga di colonne reale: `profiles_select_own` (P7-T01, DEC-018) concedeva l'**intera riga** `profiles` — inclusi `data_nascita` e `genitore_email` — a chiunque appartenesse allo stesso Reparto, perché la RLS filtra righe, non colonne; le query applicative chiedevano solo `id/nome`, ma un'interrogazione diretta a PostgREST poteva leggere qualunque colonna. Corretto in `supabase/migrations/20260823172537_profiles_reparto_visibility_fix.sql`: nuove funzioni `SECURITY DEFINER` `stesso_reparto_attivo()` (booleano, per le policy di percorso personale) e `membri_reparto()` (solo le colonne che l'app ha sempre mostrato), stesso pattern di `cerca_maestri`/`find_profile_by_email`. `lib/queries/reparto.ts` e `lib/queries/archivio.ts` aggiornati di conseguenza. Dettaglio in `.claude/CORRECTIONS.md` e nota a [DEC-018](DECISIONS.md#dec-018--funzionalità-di-reparto-visibilità-membri-assegnazione-squadriglie-e-calendario-fase-7). Migrazione già applicata al progetto reale via MCP Supabase. Test di regressione in `tests/unit/rls/reparto.rls.test.ts` (si salta senza credenziali, pattern esistente).

  Unico avviso non-RLS rimasto in `get_advisors`: "Leaked Password Protection Disabled" — impostazione di Supabase Auth (dashboard, non uno schema/RLS), non applicabile via migrazione; da attivare manualmente dal proprietario del progetto.

  **Addendum (2026-08-24, code review indipendente)**: l'audit verificava la *presenza* di policy esplicite, non la correttezza di ogni condizione — una revisione successiva ha trovato 3 problemi che quel criterio non copriva, tutti corretti e applicati al progetto reale: (1) le policy INSERT delle tabelle di join dell'archivio (`uscita_partecipante`/`campo_partecipante`/`uscita_squadriglia`/`campo_squadriglia`) verificavano il Reparto dell'uscita/campo ma non quello della riga referenziata — un Capo del Reparto A poteva associare un profilo/Squadriglia del Reparto B (`20260824090000_archivio_partecipanti_reparto_fix.sql`); (2) le policy di scrittura riservate ai Capi (`*_insert_capo`/`*_update_capo`/`*_delete_capo` su squadriglia/evento/archivio) non richiedevano `has_active_consent()`, a differenza di tutte le policy `_own` (`20260824110000_rls_capo_has_active_consent.sql`); (3) `profiles_insert_own`/`profiles_update_own` (Fase 5) non erano mai state incluse nei giri di fix `auth_rls_initplan` successivi (`20260824122455_profiles_own_rls_perf_fix.sql`). Dettaglio completo in `.claude/CORRECTIONS.md`.

### P10-T02 — Accessibilità UI non-3D

- **Obiettivo**: form, pannelli contenuto, navigazione da tastiera e screen reader sui componenti 2D/DOM.
- **Dipendenze**: Fase 3–7 (componenti UI esistenti).
- **Criteri di completamento**: controlli interattivi 2D raggiungibili da tastiera, contrasto testo conforme.
- **Test necessari**: audit accessibilità (es. axe) sui componenti DOM.
- **Stato**: completato. `@axe-core/playwright` aggiunta (DEC-006) e `tests/e2e/accessibility.spec.ts`: scansiona le pagine pubbliche (login, registrati, privacy) e, soprattutto, il pannello di **ognuno dei 13 oggetti** del tavolo via `/tavolo-dev` (nessuna credenziale richiesta, stesso pattern di `tableInteraction.spec.ts`) — copre quindi ogni superficie reale (`components/panel/surfaces/`), non solo un campione.

  Trovato e corretto un problema reale: la textarea "Aggiungi una nota" (`components/panel/surfaces/CardSurface.tsx`) non aveva un'etichetta accessibile (solo `placeholder`) — `aria-label` aggiunto a quella e alla textarea di modifica nota. Nessun altro problema di struttura/etichette/ruoli/tastiera trovato su nessuno dei 13 oggetti.

  Migliorato inoltre, per verifica diretta (non per il tool): il testo "attenuato" dei pannelli (`color-mix(in srgb, var(--ink) N%, transparent)`, 63 usi in 16 file con percentuali fino al 50%) aveva un contrasto reale insufficiente su `--paper-base` (fino a ~2.7:1 misurato, serve 4.5:1) — sostituito con tre token centralizzati (`--ink-muted-soft/--ink-muted/--ink-muted-strong`, `app/globals.css`) verificati ≥4.5:1 per calcolo diretto e per campionamento pixel dello schermo reso. La regola "color-contrast" di axe-core stessa non è affidabile per colori `color-mix()` (falsi positivi anche dopo il fix, vedi `.claude/CORRECTIONS.md`) ed è stata disattivata nel test con una nota esplicita — le altre regole WCAG restano attive.

  Non affrontato qui: contrasto della composizione 2D/`TableFlat` oltre allo smoke test automatico (nessuna violazione trovata, ma senza revisione manuale caso per caso) e navigazione da tastiera della scena 3D stessa (fuori scope, è un canvas WebGL — l'accesso via hotspot DOM è già coperto da `tableInteraction.spec.ts`).

### P10-T03 — rimosso dal piano ([DEC-025](DECISIONS.md#dec-025--p10-t03-frame-rate-reali-su-device-mobile-rimosso-dal-piano))

Chiedeva di misurare frame rate/uso GPU su device mobile reale — mai eseguibile in 8 fasi consecutive nell'ambiente di sviluppo headless usato per questo progetto (nessun device fisico o simulatore con GPU reale disponibile). Rimosso dal piano come task permanentemente non eseguibile, non per bassa priorità: le mitigazioni di design (qualità a due livelli, `frameloop="demand"`, geometrie/texture condivise) restano in atto e il budget quantitativo (`tests/e2e/budget.ts`, draw call/triangoli/texture) resta l'unica verifica di performance automatica. Se un device reale diventa disponibile in futuro, va gestito come attività ad-hoc del proprietario del progetto, non riaperto come task di fase.

---

## Phase 11 — Production QA

> Riscritta il 2026-08-24: la versione precedente copriva solo il flusso Specialità della Fase 3 e non rifletteva le fasi 5-9 (Reparto, Maestri, Archivio, Admin). Vedi l'analisi che ha portato alla riscrittura in conversazione — nessuna nuova DEC, è un'estensione dello scope già previsto per questa fase, non una decisione architetturale.

### P11-T01 — Verifica E2E dei flussi critici per ruolo

- **Obiettivo**: verificare senza errori console ogni flusso principale del prodotto per ciascun ruolo (E/G, Capo, admin), non solo il percorso Specialità originario.
- **Dipendenze**: tutte le fasi precedenti (2-9).
- **Flussi da coprire** (elenco esplicito, sostituisce il singolo flusso precedente):
  1. **E/G**: login → tavolo → apri carta (Specialità/Competenza/Tappa) → segna completata → nota (crea/modifica/elimina) → associa Maestro (interno via ricerca globale, esterno via form) → chiusura. Parzialmente già coperto da `tests/e2e/table.spec.ts`/`tableInteraction.spec.ts`.
  2. **Registrazione**: form → accettazione privacy → percorso adulto (nessun consenso richiesto) e percorso minorenne (email di consenso genitoriale → link → conferma → sblocco).
  3. **Onboarding Reparto**: richiesta di associazione → stato "in attesa" → approvazione da un Capo o admin → accesso sbloccato.
  4. **Reparto — Squadriglie**: crea, rinomina, elimina, assegna/sposta membro.
  5. **Reparto — Calendario**: crea, modifica, elimina evento; verifica comparsa sia sull'oggetto calendario del tavolo sia in `/reparto`.
  6. **Reparto — Archivio**: crea luogo/uscita/campo, associa partecipanti/Squadriglie, carica foto/documento, elimina (con la conferma introdotta il 2026-08-24).
  7. **Maestri**: attiva/disattiva visibilità dalla tessera, ricerca globale con filtri, associazione a una Specialità in corso.
  8. **Admin**: decide una richiesta Reparto (approva/rifiuta); verifica che un non-admin non veda `/admin`.
- **Criteri di completamento**: ognuno degli 8 flussi verificato manualmente e, dove le credenziali lo permettono, via test E2E automatizzato.
- **Test necessari**: estendere `tests/e2e/` con almeno un file per Reparto/Maestri/Admin (oggi coperti solo da unit test, non E2E). I flussi 4-8 richiedono un utente Capo e un utente admin nel progetto Supabase reale: creare credenziali di test dedicate e documentarle come nuove env var (`E2E_CAPO_EMAIL`/`E2E_CAPO_PASSWORD`, `E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD`), stesso pattern di `E2E_EMAIL`/`E2E_PASSWORD` già esistente (si saltano da soli senza credenziali).
- **Stato**: non iniziato.

### P11-T02 — Revisione sicurezza/privacy end-to-end

- **Obiettivo**: andare oltre "nessun advisor Supabase aperto" — verificare anche i pattern applicativi attorno a RLS che `get_advisors` non copre (la code review del 2026-08-24 ha trovato esattamente questo tipo di problema: errori Supabase ignorati, upload senza validazione, gap RLS sui join).
- **Dipendenze**: P10-T01.
- **Criteri di completamento**:
  1. `get_advisors` (security + performance) pulito, o eccezioni esplicitamente documentate — oggi: solo "Leaked Password Protection" e i `SECURITY DEFINER` intenzionali (`cerca_maestri`, `membri_reparto`, ecc., già motivati in `DECISIONS.md`).
  2. Ogni Server Action in `app/actions/*.ts` e `app/*/actions.ts` verificata per: identità sempre da `auth.getUser()` server-side (mai da un id passato dal client); ogni `{ error }` di Supabase controllato e propagato, mai ignorato; upload file validati per estensione/tipo.
  3. `tests/unit/rls/*.rls.test.ts` eseguiti almeno una volta con credenziali reali (`RLS_TEST_*`), non solo "skipped" come avviene di default.
  4. Nessuna chiave privilegiata (`SUPABASE_SECRET_KEY`, `RESEND_API_KEY`) referenziata fuori da `lib/supabase/admin.ts`/`lib/resend.ts` (grep di verifica).
  5. Flusso di consenso genitoriale verificato end-to-end: un profilo `in_attesa` non accede a nessuna funzionalità applicativa oltre `/attesa-consenso` (DEC-010).
- **Test necessari**: `get_advisors` via MCP, grep mirati sui punti 2/4, esecuzione manuale della suite RLS con credenziali reali.
- **Stato**: punti 1/2/4/5 completati (2026-08-25), punto 3 bloccato in attesa di credenziali di test reali.
  1. `get_advisors` (security + performance) via MCP: pulito. Security mostra solo gli 8 avvisi attesi (7 funzioni `SECURITY DEFINER` già motivate in `DECISIONS.md` — `find_profile_by_email`, `cerca_maestri`, `membri_reparto`, `stesso_reparto_attivo`, `decidi_richiesta_reparto`, `assegna_squadriglia`, più `confirm_parental_consent` non esplicitamente nominata in una DEC ma di disegno ovvio, P5-T01b: deve essere chiamabile da `anon`, il genitore non ha un account — e "Leaked Password Protection Disabled", noto, P11-T03 punto 2). Performance: solo `unused_index` (INFO, atteso su tabelle a basso traffico) — nessun `auth_rls_initplan`/`multiple_permissive_policies` residuo.
  2. Tutte le ~20 Server Action in `app/actions/*.ts` e `app/*/actions.ts` (incluse `app/consenso/[token]/actions.ts`, `app/admin/richieste-reparto/actions.ts`) verificate: identità sempre da `supabase.auth.getUser()` server-side, mai un id dal client. Trovato e corretto un problema reale: `markTappaCompleted` ignorava l'errore Supabase (unica eccezione al pattern, vedi `.claude/CORRECTIONS.md`). Upload file (`caricaDocumento`, unico punto di upload utente) valida estensione per allowlist e verifica che la destinazione appartenga al Reparto del chiamante prima di scrivere.
  3. **Non eseguito**: nessuna credenziale `RLS_TEST_USER_A/B_EMAIL/PASSWORD` configurata (né in `.env.local` né altrove in questa sessione) — la suite RLS gira sempre in modalità "skipped". Stesso bloccante di P11-T01 (credenziali Capo/admin): entrambi richiedono di creare utenti di test reali nel progetto Supabase e decidere come conservarne le credenziali.
  4. Grep mirato: `SUPABASE_SECRET_KEY`/`RESEND_API_KEY` referenziate solo in `lib/supabase/admin.ts`/`lib/resend.ts` in tutto l'albero sorgente (esclusi worktree in `.claude/worktrees/`, non codice attivo).
  5. Flusso di consenso genitoriale verificato per lettura di codice (non E2E, stesso bloccante del punto 3): `lib/supabase/middleware.ts` reindirizza a `/attesa-consenso` ogni percorso non esplicitamente pubblico quando `stato_consenso_genitoriale = 'in_attesa'`; `has_active_consent()` resta comunque il livello di difesa reale a livello RLS.

### P11-T03 — Go-live checklist

- **Obiettivo**: lista di verifica puntuale prima del primo deploy realmente pubblico, non una descrizione generica.
- **Dipendenze**: tutte.
- **Criteri di completamento** (ogni punto va verificato esplicitamente, non assunto):
  1. Env var di produzione su Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `NEXT_PUBLIC_SITE_URL` (dominio reale, non `localhost`).
  2. "Leaked Password Protection" abilitata su Supabase Auth (dashboard) — unico advisor noto non chiudibile via migrazione.
  3. Header di sicurezza (`next.config.ts`, aggiunti il 2026-08-24) verificati in produzione con una richiesta reale (`curl -I`), non solo in locale.
  4. Dominio: confermare esplicitamente se resta `orma-scout.vercel.app` o se va configurato un dominio custom — decisione del proprietario del progetto, non implicita.
  5. Pagine legali raggiungibili in produzione: `/privacy` (già linkata dal form di registrazione), checkbox di consenso obbligatorio verificato anche in produzione, non solo in sviluppo.
  6. Error monitoring: decisione esplicita — oggi solo `@vercel/analytics`/`@vercel/speed-insights` (metriche, non errori applicativi); scegliere se integrare un error tracker dedicato o dichiarare consapevolmente che i log delle Vercel Function bastano alla scala attuale.
  7. Backup/recovery: verificare cosa offre il piano Supabase attivo (piano free — point-in-time recovery tipicamente assente/limitato) e documentare la procedura in caso di perdita dati.
  8. Rollback: Vercel offre un rollback nativo a un deployment precedente — verificare che la procedura sia nota; per il DB la regola resta sempre una nuova migrazione correttiva, mai un downgrade dello schema (coerente con la Fase 10, dove non si è mai toccata una migrazione passata).
  9. Smoke test post-deploy: gli stessi flussi critici di P11-T01, eseguiti manualmente sul dominio di produzione appena deployato.
- **Test necessari**: smoke test manuale post-deploy sul dominio reale.
- **Stato**: verificato quanto possibile senza credenziali di test (2026-08-25); dominio ed error monitoring decisi dal proprietario del progetto (punti 4/6), un punto resta aperto (1, verifica manuale env var Vercel) e il punto 9 condivide il bloccante di P11-T01.
  1. **Non verificabile via strumenti disponibili**: nessun tool MCP Vercel elenca le env var di un progetto. `docs/PROJECT.md` §12 dichiara le 6 var Supabase/Resend/site-url configurate per production/preview/development, ma non è stato verificato qui — da confermare a mano nel dashboard Vercel prima del go-live.
  2. "Leaked Password Protection" **ancora disabilitata** (confermato via `get_advisors`, stesso stato di Fase 10) — impostazione dashboard Supabase Auth, nessun tool MCP disponibile per attivarla da remoto: azione manuale del proprietario del progetto.
  3. Header di sicurezza verificati con `curl -I` reale su `https://orma-scout.vercel.app/`: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` presenti (da `next.config.ts`) più `Strict-Transport-Security` aggiunto automaticamente da Vercel. Verificato anche `/login` e `/privacy` (200 in produzione).
  4. **Dominio**: confermato via MCP Vercel (`get_project`) — nessun dominio custom collegato, solo `orma-scout.vercel.app` + i due domini di preview/git automatici. Decisione esplicita del proprietario ancora da prendere.
  5. Pagine legali: `/privacy` raggiungibile in produzione (200, verificato con `curl`). Checkbox di consenso obbligatorio: stesso codice verificato in P11-T02 (`app/registrati/actions.ts` rifiuta `accettaPrivacy` falso) gira anche in produzione — non testato end-to-end con una registrazione reale per non creare un account di test non richiesto.
  6. **Error monitoring**: decisione presa dal proprietario del progetto (2026-08-25) — restano solo `@vercel/analytics`/`@vercel/speed-insights` (nessun error tracker esterno), con hardening applicativo mirato al posto di un nuovo servizio:
     - `app/global-error.tsx` (nuovo): cattura errori del root layout stesso, unico caso non coperto da `app/error.tsx` (Fase 2/Redesign); quest'ultimo ora logga anche via `console.error` gli errori puramente client (post-idratazione), raccolti nei log Vercel/console browser.
     - `Content-Security-Policy` in `next.config.ts`: `default-src 'self'`, senza origini esterne per script/immagini/connessioni oltre al solo host Supabase del progetto (letto da `NEXT_PUBLIC_SUPABASE_URL`); `'unsafe-inline'` resta necessario per l'idratazione di Next.js senza infrastruttura di nonce (non presente), `'unsafe-eval'` solo in sviluppo (richiesto da fast refresh/HMR). Verificato: build di produzione pulita, nessuna violazione CSP reale in console su `/login`/`/registrati`/`/privacy` con build locale (`next build && next start` + Playwright headless) — gli unici errori osservati sono 404 attesi di `/_vercel/insights|speed-insights/script.js`, endpoint che esistono solo su una vera piattaforma Vercel, non in locale.
     - Rate limiting applicativo su login/registrazione/conferma consenso (le tre azioni pubbliche/anonime più esposte): tabella `rate_limit_hit` + funzione `check_rate_limit(chiave, max, finestra_minuti)` (`supabase/migrations/20260825075402_rate_limit.sql`, **applicata al progetto reale** su conferma esplicita del proprietario del progetto — `get_advisors` post-deploy pulito: solo l'atteso `rls_enabled_no_policy` INFO su `rate_limit_hit`, per disegno — nessuna policy perché la tabella non è mai letta/scritta se non dalla funzione), chiamata solo dal client admin (service role) per evitare che un chiamante esterno possa manipolare direttamente il bucket di un'altra chiave via PostgREST (`lib/rateLimit.ts`). Soglie: login 8 tentativi/15min per coppia IP+email (+ 30/15min per IP), registrazione 5/60min per IP, conferma consenso 10/15min per IP. `tsc`/lint/unit test/build tutti puliti dopo l'integrazione.
  7. **Backup/recovery**: verificato via Supabase docs — il piano attivo (`free`, confermato via MCP `get_organization`) **non ha backup automatici di alcun tipo** (né giornalieri né point-in-time: quelli partono dal piano Pro). La documentazione ufficiale raccomanda export manuali regolari con `supabase db dump` e conservazione off-site. Nessuna procedura di questo tipo esiste oggi nel progetto — gap reale da colmare prima del go-live, non solo da "documentare".
  8. Rollback: Vercel offre rollback nativo a un deployment precedente (funzionalità della piattaforma, non verificata con un rollback reale per non alterare la produzione). Per il DB, la regola "sempre una nuova migrazione correttiva, mai un downgrade" è già la prassi effettiva del progetto (vedi i numerosi fix-migration in `.claude/CORRECTIONS.md`).
  9. Smoke test post-deploy sul dominio reale: stesso bloccante di P11-T01 (richiede i flussi Capo/admin) — eseguito solo il sottoinsieme non autenticato (home → redirect a `/login`, `/login`, `/privacy`), tutti 200/307 come atteso.

### P11-T04 — QA manuale multi-ruolo e multi-browser/device

- **Obiettivo**: coprire ciò che l'E2E automatizzato non copre strutturalmente — `playwright.config.ts` testa solo un progetto Chromium desktop (1440×900), nessun Firefox/Safari/viewport mobile reale.
- **Dipendenze**: P11-T01.
- **Criteri di completamento**:
  1. Verifica manuale su almeno un browser mobile reale (Safari iOS e Chrome Android, o equivalenti): la scena 3D è esclusa da mobile per design (DEC-013), quindi qui si verifica la composizione 2D dedicata (`TableFlat`) e la sua usabilità reale — non il frame rate 3D, la cui verifica è stata rimossa dal piano (DEC-025).
  2. Verifica manuale su almeno un browser desktop diverso da Chromium (Firefox e/o Safari), sia per la scena 3D sia per la composizione 2D.
  3. Verifica manuale con almeno 4 profili distinti: un E/G normale, un E/G minorenne in attesa di consenso, un Capo, un admin — stesso motivo del punto su credenziali multiple in P11-T01, qui a livello di sessione manuale completa (non solo un singolo flusso).
- **Test necessari**: sessione di test manuale strutturata (checklist), non automatizzabile con la configurazione Playwright attuale senza investimento aggiuntivo (progetti `webkit`/`firefox`/viewport mobile in `playwright.config.ts`).
- **Stato**: non iniziato.
