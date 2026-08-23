# ORMA — Project Knowledge

> Questo documento è la **source of truth corrente** del progetto: descrive cosa è ORMA oggi, a livello concettuale e architetturale. Non è un changelog. Per la visione originale vedi [`IDEA.md`](../IDEA.md); per la specifica tecnica dettagliata vedi [`docs/SDD.md`](../docs/SDD.md); per le decisioni vedi [`DECISIONS.md`](DECISIONS.md); per il piano vedi [`TODO.md`](TODO.md).

---

## 1. Cos'è ORMA

ORMA è una web app personale per Esploratori e Guide (E/G) AGESCI, costruita attorno alla metafora del **tavolo scout personale**: dopo il login l'utente si ritrova davanti a una scena realistica (vista dall'alto) del proprio spazio, con carte, documenti, calendario e oggetti scout, invece di una dashboard tradizionale.

Non è un gestionale, non è un social network, non è un videogioco. È un ambiente digitale che rappresenta il percorso scout personale dell'utente.

Riferimento: [`IDEA.md`](../IDEA.md), [`docs/PRODUCT.md`](../docs/PRODUCT.md).

## 2. Obiettivo e target

- **Obiettivo**: digitalizzare e rendere immersivo il percorso di Specialità, Competenze e Tappe di un E/G, preservando la separazione tra contenuto ufficiale AGESCI e dati personali.
- **Target primario**: un singolo E/G che usa l'app per seguire il proprio percorso.
- **Target secondario**: membri dello stesso Reparto (Capi, altri E/G) che consultano informazioni condivise secondo permessi; Maestri di Specialità (interni o esterni al sistema).

## 3. Filosofia del prodotto

> "Il tavolo è l'interfaccia. Le carte sono il contenuto. Il Reparto è il contesto. L'account è la persona." — [`IDEA.md`](../IDEA.md)

Principi guida:

- **Realismo prima del tecnicismo** — 3D e animazioni solo se aumentano l'immersione, mai per mostrare tecnologia.
- **Official vs personal** — il contenuto ufficiale (Specialità, Competenze, Tappe) non è mai modificato dall'utente; il progresso personale vive in relazioni separate.
- **Privacy by default** — se non è chiaro se un dato debba essere pubblico, è privato.
- **Non generico** — evitare dashboard SaaS, card generiche, glassmorphism, gamification aggressiva, estetica "AI-generated".

Vedi [`docs/DESIGN.md`](../docs/DESIGN.md) per la direzione visiva completa.

## 4. Funzionalità core

| Area                                                                            | Stato concettuale                                         |
| ------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Account (registrazione, login, profilo, sessione, Reparto)                      | Definito in `docs/PRODUCT.md`                             |
| Specialità (catalogo, carta, progresso, obiettivi, note, Maestro)               | Feature centrale — vedi §2 di `IDEA.md`                   |
| Competenze                                                                      | Stesso paradigma delle Specialità                         |
| Tappe                                                                           | Percorso personale, rappresentazione immersiva            |
| Maestri (interni/esterni, ricerca globale)                                      | Vedi §19                                                  |
| Reparto (membri, Squadriglie, Capi, uscite, campi, luoghi, documenti, archivio) | Contesto dati, non dashboard condivisa                    |
| Calendario                                                                      | Metafora fisica (agenda/foglio), non tipo Google Calendar |
| Archivio                                                                        | Memoria storica navigabile del Reparto                    |

Dettaglio requisiti funzionali completo: [`docs/SDD.md`](../docs/SDD.md) §4.

## 5. Architettura (target)

```
Browser (React, Three.js/R3F per la scena tavolo)
        │
        ▼
Next.js (Vercel) — SSR/rendering, route handler leggeri
        │
        ▼
Supabase (Postgres + Auth + Storage + RLS)
```

- **Frontend**: React con Next.js, deploy su Vercel. Scelta _proposta_ in `IDEA.md`, non ancora vincolante — vedi [DEC-001](DECISIONS.md).
- **3D**: Three.js / React Three Fiber ([DEC-003](DECISIONS.md#dec-003--3d-threejs--react-three-fiber-uso-selettivo), in uso dalla Fase 2), solo dove aumenta il realismo della scena tavolo/carte. La scena è riservata a desktop/tablet con WebGL; mobile e fallback usano una composizione 2D DOM ([DEC-013](DECISIONS.md)).
- **Stato**: Zustand per lo stato di presentazione della scena (oggetto a fuoco, origine dell'apertura) — [DEC-004](DECISIONS.md); i dati restano su Server Components/Supabase.
- **Backend**: Supabase — Postgres, Supabase Auth, Supabase Storage, Row Level Security.
- **Deployment**: Vercel per il frontend/edge, Supabase Cloud per il backend.

Nessun repository di codice esiste ancora: questa è l'architettura target, non lo stato attuale (vedi §8).

## 6. Struttura del progetto (attuale)

```
Orma/
├── CLAUDE.md              # istruzioni operative per Claude Code
├── IDEA.md                # visione di prodotto originale
├── app/                    # Next.js App Router (auth Fase 5, catalogo Fase 3, Home tavolo)
│   ├── specialita/         # catalogo + avvio percorso (P3-T04)
│   ├── competenze/         # catalogo + avvio percorso (P3-T06)
│   ├── tappe/               # percorso Tappe, informativo (P3-T07)
│   ├── onboarding-reparto/  # richiesta associazione Reparto (P5-T02)
│   ├── reparto/             # dati + Server Action di Reparto (la UI vive sul tavolo, RD-T02)
│   ├── tavolo-dev/          # sandbox della scena, solo in sviluppo (404 in produzione)
│   ├── impostazioni/        # profilo, logout (P5-T03)
│   ├── admin/                # visibilità read-only (DEC-015) + richieste-reparto/ (P5-T02)
│   └── actions/             # Server Action condivise (progresso, note, dati delle superfici)
├── components/
│   ├── layout/             # PaperPage: sfondo esplicito per le pagine fuori dal tavolo
│   ├── panel/              # involucro del pannello DOM (condiviso 3D/2D)
│   │   └── surfaces/       # una superficie di contenuto per famiglia di oggetti
│   ├── reparto/            # sezioni Membri/Squadriglie/Calendario (usate dalle superfici)
│   ├── table/              # scelta della resa + composizione 2D/mobile
│   └── three/              # scena R3F: canvas, tavolo, camera, materiali
│       ├── materials/      # texture procedurali (colore + normali + finitura) e materiali
│       └── props/          # modelli degli oggetti: lampada, Reparto, percorso
├── lib/
│   ├── scene/              # store scena, definizione oggetti, capacità del device, dati reali (SceneDataContext)
│   ├── queries/             # fetch dati Supabase per Server Component (P3-T04)
│   └── supabase/           # client browser/server/admin + proxy sessione + storage helper
├── scripts/                 # pipeline asset one-shot (process-cards.ts, generate-seed.ts)
├── tests/
│   ├── unit/               # Vitest + Testing Library (incl. rls/ per i test RLS)
│   └── e2e/                # Playwright
├── public/
├── assets/
│   ├── source/              # asset originali intatti (distintivi/, mai modificati)
│   └── processed/           # output pipeline (WebP + manifest.json)
├── supabase/
│   ├── config.toml
│   └── migrations/          # schema profiles (Fase 5) + contenuto ufficiale/personale (Fase 3)
├── docs/
│   ├── PRODUCT.md
│   ├── UX.md
│   ├── DATA_MODEL.md
│   ├── PERMISSIONS.md
│   ├── DESIGN.md
│   ├── VISUAL_REFERENCE.md # palette/tipografia concrete (Fase 1)
│   └── SDD.md              # specifica tecnica
└── .claude/
    ├── PROJECT.md           # questo file
    ├── TODO.md
    ├── DECISIONS.md
    └── CORRECTIONS.md
```

**Fase 0 (Foundation) completata**: Next.js 16 (TypeScript, App Router, strict mode) con ESLint + Prettier, Tailwind CSS (DEC-009), progetto Supabase creato (org "Scout", regione eu-central-1, piano free), progetto Vercel collegato al repository GitHub `pgiudici13/Orma` con preview deployment automatici. Deploy di produzione raggiungibile su https://orma-scout.vercel.app. Nessuno schema DB applicativo ancora presente (Fase 3+).

**Fase 1 (Design / Visual Prototype) completata**: direzione visiva tradotta in `docs/VISUAL_REFERENCE.md` (palette da materiali reali — legno/carta/tessuto/metallo — e tipografia: Geist Sans per la UI funzionale, Newsreader come serif editoriale per titoli/contenuto carte), token materializzati in `app/globals.css`/`app/layout.tsx`. Libreria di transizioni scelta: `motion` (DEC-012). Primo prototipo statico 2D della scena tavolo in `components/table/` (Table, TableSurface, Card, Notebook, Calendar, LooseSheet, Pencil, Compass, FadeIn), non interattivo, che sostituisce il placeholder in `app/page.tsx`. Verificato in browser desktop/tablet; mobile non ottimizzato (demandato a P2-T05).

**Fase 2 (Interactive Table) completata**: scena 3D React Three Fiber in `components/three/` — piano tavolo in legno, una sola luce con ombre, carte di Specialità/Competenza/Tappa che condividono un'unica geometria (`geometry.ts`) con texture procedurali distinte, taccuino, calendario, foglio e oggetti decorativi (matita, bussola) che non intercettano eventi. Interazione completa `oggetto → focus → camera → tavolo sfocato → pannello → chiusura` con `Esc`, click sul tavolo e bottone Chiudi; ogni oggetto interattivo ha un hotspot DOM raggiungibile da tastiera con ritorno del focus alla chiusura. Stato scena in Zustand (DEC-004), blur sul layer DOM (DEC-014), scena 3D solo su desktop/tablet con WebGL e composizione 2D dedicata altrove (DEC-013). Suite di test introdotta (DEC-006): 18 unit test Vitest e 4 E2E Playwright, tra cui il controllo automatico del budget di performance. Misure a riposo: 20 draw calls, 636 triangoli, 10,5 MB di texture.

Limite dichiarato: le texture sono procedurali, non asset AGESCI reali — `docs/DESIGN.md` chiede realismo fotografico, raggiungibile solo con la pipeline PDF di Fase 3, che sostituirà le `map` senza toccare geometrie o interazione. I frame rate reali su GPU desktop/mobile restano da misurare (P10-T03).

Nota operativa: la CLI `supabase` locale non è collegata al progetto remoto (`supabase link` richiede `supabase login` interattivo, non eseguibile in sessione headless) — le migrazioni verranno applicate tramite l'MCP Supabase (`apply_migration`) finché non si esegue il login manuale.

**Fase 3 (Specialità/Competenze/Tappe) completata, deploy incluso**: schema DB per contenuto ufficiale (`specialita`, `tappa`, `competenza`, `brevetto`, `brevetto_specialita`) e percorso personale (`user_specialita`, `user_competenza`, `user_tappa`, `nota`, `maestro_esterno`) con RLS completa, incluso il primo test RLS del progetto (`tests/unit/rls/`). Il catalogo reale (65 Specialità, 15 Brevetti, 3 Tappe) viene da immagini fornite direttamente dall'utente (`assets/source/distintivi/`), non dai 3 PDF originari — risultati non un catalogo utilizzabile all'ispezione (vedi DEC-005 aggiornata) — né da scraping di terze parti (rifiutato per rischio di copyright non verificato). La scena tavolo (`app/page.tsx`, Server Component) e il pannello di dettaglio mostrano dati reali per l'utente autenticato tramite `lib/queries/cards.ts` e `lib/scene/SceneDataContext.tsx`; le carte demo di Fase 2 restano come fallback quando nessun Provider è montato (test, storybook). Cataloghi dedicati per avviare il percorso: `/specialita`, `/competenze`, `/tappe`.

**Deploy** (via MCP Supabase, progetto `ouffyxrhxhzqcduvgpon`): 4 migrazioni applicate (incluso un fix di performance post-`get_advisors`: indici mancanti sulle FK e policy RLS che rivalutavano `auth.uid()` per riga, `20260812110000_rls_performance_fix.sql`); bucket Storage pubblico `distintivi` creato con policy di lettura pubblica; 83 asset caricati con `scripts/upload-assets.sh`. Nessun advisor di sicurezza nuovo.

Limiti dichiarati: (1) `brevetto_specialita` (composizione di ogni Brevetto) non è popolata, nessuna fonte disponibile la specifica; (2) Competenza non ha catalogo immagini reale, solo 5 voci segnaposto; (3) sul tavolo compare al più una carta per famiglia (semplificazione dichiarata in `lib/scene/objects.ts`), il resto del percorso si consulta dai cataloghi dedicati.

**Fase 4 (Personal Data) completata, deploy incluso**: CRUD completo per le note (`updateNota`/`deleteNota` accanto ad `addNota` in `app/actions/personalProgress.ts`) e associazione Maestro (interno via ricerca per email esatta — funzione `find_profile_by_email`, SECURITY DEFINER, nessuna ricerca parziale — o esterno via `addMaestroEsterno`, senza mai creare un account) nella sezione "Maestro" del pannello. Lo schema DB (`nota`, `maestro_esterno`) esisteva già da P3-T03: questa fase copre solo la superficie applicativa mancante. Reparto e ricerca globale Maestri non esistono ancora (Fase 6/7/8): l'associazione del Maestro interno resta scoped alla sola email esatta, senza visibilità reciproca lato Maestro (fuori scope, non specificata dai documenti di prodotto). Migrazioni applicate al progetto Supabase reale; nessun nuovo advisor di sicurezza.

**Fase 5 (Authentication) completata, deploy incluso**: oltre a registrazione/login/consenso genitoriale (già presenti da P5-T00/T01/T01b), aggiunti onboarding Reparto (P5-T02) e impostazioni account (P5-T03). Schema minimo (`supabase/migrations/20260812130000_reparto_onboarding.sql`): tabella `reparto` (seed manuale, stesso principio di DEC-008), `profiles.reparto_id` (popolato solo dall'approvazione), `richiesta_reparto` (richiesta/storico, una sola pendente per utente) e la funzione `decidi_richiesta_reparto()` (SECURITY DEFINER) come unico punto di scrittura privilegiata. L'approvazione riusa `profiles.is_admin` (DEC-015) — placeholder temporaneo, [DEC-016](DECISIONS.md#dec-016--approvazione-reparto-riuso-temporaneo-di-is_admin), da sostituire con un ruolo Capo/Admin-di-Reparto in P6-T03. Superficie: `app/onboarding-reparto/` (richiesta), `app/admin/richieste-reparto/` (approvazione), `app/impostazioni/` (profilo, logout). Gate a tre stadi in `lib/supabase/middleware.ts`: non autenticato → login; consenso genitoriale `in_attesa` → `/attesa-consenso`; Reparto non approvato → `/onboarding-reparto`. Squadriglia resta interamente fuori scope (Fase 6/7). Nessun Reparto reale seedato: `20260812130500_seed_reparto.sql` è un template non applicato. Migrazioni applicate al progetto reale; un fix di performance (indici FK mancanti) applicato subito dopo, nessun advisor di sicurezza nuovo.

**Fase 6 (Supabase: schema Reparto/organizzazione) completata, deploy incluso**: schema `squadriglia` (id, `reparto_id` FK→`reparto`, nome, `unique(reparto_id, nome)`, indice su `reparto_id`) e `profiles.squadriglia_id` (indicizzato), più il modello di ruolo `profiles.ruolo` (`'eg'|'capo'`, default `'eg'`) con [DEC-017](DECISIONS.md#dec-017--ruolo-capo-scoped-al-reparto-fusione-con-admin-di-reparto) — un ruolo unico "Capo" scoped al proprio Reparto, che fonde "Capo" e "Admin di Reparto" e chiude l'Open Decision di `docs/SDD.md` §6/§29. RLS: `squadriglia` leggibile solo da chi appartiene allo stesso Reparto (o admin globale, DEC-015), scrivibile solo dal Capo del Reparto o admin — a differenza di `reparto`, leggibile da chiunque autenticato per l'onboarding. Scrittura di `squadriglia_id` bloccata self-service dalla stessa estensione del trigger `profiles_block_self_consent_update` usata per `reparto_id`. Il Capo può inoltre vedere/decidere le richieste di adesione dirette al proprio Reparto: `decidi_richiesta_reparto()` accetta ora `is_admin()` o `is_capo_reparto(reparto)` — chiude [DEC-016](DECISIONS.md#dec-016--approvazione-reparto-riuso-temporaneo-di-is_admin); `app/admin/richieste-reparto/page.tsx` accessibile anche a un Capo. Nessuna UI per assegnare il ruolo Capo (via SQL, come `is_admin`) e nessuna funzione/UI di assegnazione Squadriglia — rimandata a P7-T02 insieme alla vista "Squadriglie": qui solo schema/RLS, come da titolo della fase.

**Fase 7 (Reparto: funzionalità) completata**: implementata la superficie applicativa e il modello dati per la vita di Reparto ([DEC-018](DECISIONS.md#dec-018--funzionalità-di-reparto-visibilità-membri-assegnazione-squadriglie-e-calendario-fase-7)):
1. **Elenco membri (P7-T01)**: vista dei compagni di Reparto con le informazioni scout pertinenti (Specialità conseguite, Tappe), escludendo strettamente dati anagrafici privati (data di nascita, email/token del genitore) e note personali; filtri per nome e Squadriglia (`app/reparto/MembriSection.tsx`).
2. **Squadriglie (P7-T02)**: visualizzazione delle Squadriglie e membri non assegnati (`app/reparto/SquadriglieSection.tsx`), con funzione PostgreSQL `assegna_squadriglia` (SECURITY DEFINER, riservata a Capi/Admin) e Server Actions per creare, rinominare, eliminare Squadriglie e assegnare/spostare i membri.
3. **Calendario di Reparto (P7-T03)**: tabella `evento` con RLS multi-tenant per-Reparto; UI agenda scout (`app/reparto/CalendarioSection.tsx`) per la gestione delle uscite/campi/riunioni da parte dei Capi; integrazione dinamica dell'oggetto `calendario` sul tavolo scout attraverso `ObjectPanel` (`components/panel/ObjectPanel.tsx`) e query `getTableEvents` (`lib/queries/cards.ts`).

**Deploy** (via MCP Supabase, progetto `ouffyxrhxhzqcduvgpon`): 4 migrazioni applicate (`reparto_ruolo`, `squadriglia`, `capo_richiesta_reparto`, `merge_capo_select_policies` — quest'ultima un fix di performance per `multiple_permissive_policies` segnalato da `get_advisors`, stesso pattern di `20260812120500_merge_admin_select_policies.sql`). Nessun nuovo advisor di sicurezza rispetto alla baseline pre-esistente.

**Redesign della scena tavolo (trasversale, 2026-08-23)**: sessione dedicata su richiesta del proprietario del progetto, con tre obiettivi in ordine di priorità.

1. **Interazione riparata**. Gli oggetti della scena erano difficili o impossibili da cliccare, per tre cause distinte tutte registrate in `CORRECTIONS.md`: il wrapper `<Html>` di drei restava a `pointer-events: auto` e copriva ogni oggetto con un rettangolo di 80×96 px; `CameraRig` risolveva l'oggetto a fuoco nel set dimostrativo e sollevava un'eccezione dentro `useFrame` sugli id delle carte reali; gli hotspot DOM si proiettavano con la camera del frame precedente e, con `frameloop="demand"`, si congelavano un frame indietro. Aggiunti volumi di presa invisibili per gli oggetti sottili e una quota di appoggio derivata dall'ingombro reale invece che da una tabella di costanti. Tre test E2E di regressione, verificati falliti sullo stato pre-fix.
2. **Tutto sul tavolo** ([DEC-019](DECISIONS.md#dec-019--ogni-funzionalità-è-un-oggetto-del-tavolo-le-rotte-restano-come-deep-link), [DEC-021](DECISIONS.md)): nove nuovi oggetti con altrettante superfici di contenuto, registro `kind → superficie` al posto dello `switch` nel pannello, dati caricati su richiesta all'apertura dell'oggetto, rotte ridotte a deep-link, link di navigazione rimossi. Chiude la nota aperta di Fase 7.
3. **Resa realistica** ([DEC-020](DECISIONS.md)): materiali PBR con mappe di rilievo e finitura derivate dallo stesso disegno del colore, ambiente procedurale per i riflessi, ombre morbide ad area, bordi smussati, due livelli di qualità, e una lampada a gas che è insieme oggetto di scena e sorgente di luce calda. Budget rimisurato: 34 draw call, 4 984 triangoli, 16,9 MB di texture (soglie in `tests/e2e/budget.ts`).

Limiti dichiarati: le superfici `taccuino` e `foglio` mostrano ancora i segnaposto di Fase 2 (nessun modello dati per le note libere); i frame rate reali restano da misurare su hardware vero (P10-T03).

**Fase 8 (Maestri: ricerca globale) completata** ([DEC-022](DECISIONS.md#dec-022--ricerca-globale-maestri-tabella-dedicata-con-opt-in-esplicito-e-funzione-di-ricerca-security-definer)): tabella `maestro_profilo` (opt-in esplicito `visibile`, default false) con i soli campi dichiarati ricercabili (`regione`, `zona`, `localita`, `disponibile`) e `maestro_specialita` (N:N verso il contenuto ufficiale `specialita`), RLS per proprietario + lettura altrui solo quando visibile; funzione `cerca_maestri(...)` SECURITY DEFINER (stesso pattern di `find_profile_by_email`) che espone solo i campi dichiarati, esclude sé stessi e i profili in attesa di consenso, con filtri combinabili per Specialità/Regione/Zona/disponibilità. La ricerca vive nella **rubrica** (scheda "Cerca Maestri" accanto a "I miei Maestri") e l'opt-in si gestisce dalla **tessera** (sezione "Maestro di Specialità"); da un risultato si associa il Maestro a una propria Specialità in corso. Test RLS opt-in/opt-out + filtri in `tests/unit/rls/maestri.rls.test.ts` e unit della superficie in `tests/unit/maestriSurface.test.tsx`. Migrazione `20260823110000_maestri_ricerca_globale.sql` da applicare al progetto Supabase reale (via MCP Supabase).

**Fase 9 (Calendario/Archivio: storico di Reparto) completata** ([DEC-023](DECISIONS.md#dec-023--archivio-di-reparto-memoria-storica-separata-dal-calendario-metadati-in-postgres-e-file-in-bucket-privato)): schema storico `luogo`, `uscita`, `campo` + join partecipanti/Squadriglie con FK reali, RLS lettura-membri/scrittura-Capi (stesso pattern di `evento`); `documento_archivio` per i metadati di foto e documenti, con i file nel bucket **privato** `archivio` (policy su `storage.objects` con il Reparto nel percorso, URL firmati per la lettura, SDD §17). L'archivio è separato dal calendario `evento`: è la memoria storica, non gli eventi futuri. L'oggetto sul tavolo è il **baule** (3D + composizione 2D), visibile solo per chi appartiene a un Reparto; la superficie `ArchivioSurface` naviga per ricordi (scaffale → dettaglio: luogo, partecipanti, Squadriglie, programma, fotografie, documenti) con azioni riservate ai Capi (`app/actions/archivio.ts`). Test RLS di diniego (incluse le policy Storage) in `tests/unit/rls/archivio.rls.test.ts` e unit della superficie in `tests/unit/archivioSurface.test.tsx`. Migrazione `20260823120000_archivio_reparto.sql` da applicare al progetto Supabase reale (via MCP Supabase).

Limite dichiarato (Fase 7): nessun test RLS automatizzato copre l'isolamento positivo cross-Reparto per un Capo reale — `ruolo`/`reparto_id`/`squadriglia_id` sono scrivibili solo da SQL diretto o da `decidi_richiesta_reparto()` (gated a sua volta su `is_admin`/`is_capo_reparto`, circolare per un bootstrap in test), stesso limite già presente per `is_admin` (mai testato automaticamente). Vedi `.claude/CORRECTIONS.md`. Verificato invece con introspezione diretta delle policy/funzioni applicate (MCP `execute_sql`).

## 7. Modello dati ad alto livello

Entità principali (dettaglio in [`docs/DATA_MODEL.md`](../docs/DATA_MODEL.md) e SDD §13):

- **Contenuto ufficiale** (condiviso, non duplicato per utente): `Specialita`, `Competenza`, `Tappa`.
- **Percorso personale** (relazione utente↔contenuto ufficiale): `UserSpecialita`, `UserCompetenza`, `UserTappa` — stato, progresso, obiettivi completati, Maestro associato. Le note sono probabilmente un'entità separata collegata (una o più per Specialità/Competenza/Tappa), non una singola colonna — dettaglio in SDD §13.
- **Identità/organizzazione**: `User`, `Profile` (con `reparto_id`, popolato solo dall'approvazione; `ruolo` `'eg'|'capo'`, DEC-017; `squadriglia_id`), `Reparto` (schema minimo da Fase 5, seed manuale), `RichiestaReparto` (richiesta/storico di associazione), `Squadriglia` (schema/RLS da Fase 6 — assegnazione utente↔Squadriglia rimandata a P7-T02).
- **Maestri**: Maestro interno (ha un `User`; profilo ricercabile in `maestro_profilo`, opt-in esplicito, Fase 8) vs Maestro esterno (contatto senza account, `maestro_esterno`).
- **Archivio/attività** (Fase 9): `Uscita`, `Campo`, `Luogo` con join di partecipanti/Squadriglie; `DocumentoArchivio` (metadati) + bucket privato `archivio` per i file.

Regola non negoziabile: **una Specialità/Competenza/Tappa ufficiale esiste una sola volta nel database**; il progresso personale è sempre una relazione separata.

## 8. UX e design direction

- Home = scena tavolo, non dashboard. Interazione: oggetto → focus → leggero movimento camera → tavolo sfocato sullo sfondo → contenuto → chiusura → ritorno alla scena.
- **Il tavolo è l'unica superficie di navigazione** ([DEC-019](DECISIONS.md#dec-019--ogni-funzionalità-è-un-oggetto-del-tavolo-le-rotte-restano-come-deep-link)): ogni funzionalità è un oggetto fisico — cassetta di Reparto (membri, richieste di adesione), guidone (Squadriglie), calendario, album dei distintivi (Specialità), quaderno (Competenze), mappa (Tappe), rubrica (Maestri), tessera (profilo e uscita), busta (adesione a un Reparto), più le carte del percorso attivo. Le rotte omonime esistono ancora ma sono deep-link che aprono il tavolo con l'oggetto già a fuoco.
- Cosa c'è sul tavolo dipende dal contesto reale dell'utente: chi non ha un Reparto trova la busta e non la cassetta.
- Non tutti gli oggetti sono interattivi; elementi decorativi restano statici (matita, bussola, lampada a gas — quest'ultima è anche la sorgente di luce calda della scena).
- Responsive: desktop/tablet sono il riferimento primario per la scena tavolo; mobile richiede una composizione ridisegnata (non una scena rimpicciolita).
- Palette e tipografia derivano dai materiali reali (legno, carta, tessuto, metallo), non da un design system definito a priori.

Dettaglio completo: [`docs/UX.md`](../docs/UX.md), [`docs/DESIGN.md`](../docs/DESIGN.md).

## 9. Asset pipeline

Le carte ufficiali di Specialità/Competenze/Tappe devono derivare da materiale originale AGESCI quando disponibile e autorizzato. Pipeline target:

```
Source asset (PDF/scansione ufficiale)
   → estrazione
   → processing
   → WebP/PNG ottimizzati
   → texture 3D / viewer
```

Regole:

- separare sempre **source assets** (originali, mai modificati distruttivamente), **processed assets** (output della pipeline) e **runtime assets** (serviti dall'app);
- non assumere che materiale trovato online sia liberamente riutilizzabile — verificare fonte, licenza, termini d'uso prima di ogni integrazione;
- non costruire scraper senza aver verificato che sia consentito.

**Stato attuale (aggiornato Fase 3)**: i 3 PDF originari (`Carta di Specialità.pdf`, `CARTA DI COMPETENZA.pdf`, `Manuale-della-Branca-EG.pdf`, ancora in `files/`) si sono rivelati non utilizzabili come catalogo — vedi [DEC-005](DECISIONS.md#dec-005--asset-pipeline-immagini-distintivi--texture-web) aggiornata. La pipeline reale parte da immagini fornite direttamente dall'utente in `assets/source/distintivi/{specialita,brevetti,tappe}/` (65 + 15 + 3 file), processate da `scripts/process-cards.ts` (normalizzazione nomi, conversione WebP via `sharp`) in `assets/processed/distintivi/` + `manifest.json`, da cui `scripts/generate-seed.ts` genera la migrazione di seed. Le texture reali si caricano in `components/three/materials/textures.ts` via `THREE.TextureLoader` quando l'oggetto ha `imageUrl`.

Il popolamento e la manutenzione del catalogo ufficiale restano a carico del proprietario del progetto tramite seed/migrazioni — nessun ruolo o UI di amministrazione in-app è previsto ([DEC-008](DECISIONS.md#dec-008--gestione-del-contenuto-ufficiale-specialit%C3%A0competenzetappe)).

## 10. Supabase

- Postgres per lo schema relazionale (contenuto ufficiale + percorso personale + Reparto).
- Supabase Auth per identità e sessione.
- Supabase Storage per asset processati (immagini carte, documenti, fotografie archivio).
- Row Level Security obbligatoria su ogni tabella con dati personali o dati di Reparto.
- Migrazioni versionate, mai modifiche manuali allo schema in produzione.
- Nessun progetto Supabase è stato ancora creato per ORMA.

## 11. Autenticazione e privacy

- Autenticazione via Supabase Auth (email/password e/o OAuth, da decidere in fase di design tecnico).
- Autorizzazione sempre verificata server-side/database-side (RLS), mai solo lato client.
- Nessuna service-role key esposta al client.
- Privacy by default: dato privato salvo condivisione esplicita.
- Registrazione minorenni: auto-registrazione con data di nascita; sotto i 14 anni l'account resta bloccato in attesa di consenso genitoriale verificato via link email univoco (consenso, non semplice apertura) — vedi [DEC-010](DECISIONS.md#dec-010--registrazione-minorenni-auto-registrazione-con-consenso-genitoriale-verificato).
- Gate applicativo a tre stadi (`lib/supabase/middleware.ts`): non autenticato → `/login`; consenso genitoriale `in_attesa` → `/attesa-consenso`; Reparto non ancora approvato → `/onboarding-reparto`. L'approvazione delle richieste Reparto è ristretta a `profiles.is_admin` (globale, DEC-015) o al Capo del Reparto della richiesta (`profiles.ruolo = 'capo'`, scoped, [DEC-017](DECISIONS.md#dec-017--ruolo-capo-scoped-al-reparto-fusione-con-admin-di-reparto) — chiude [DEC-016](DECISIONS.md#dec-016--approvazione-reparto-riuso-temporaneo-di-is_admin)).
- Nessuna funzionalità di ricerca/esposizione pubblica di profili senza rispettare comunque privacy by default.

Dettaglio: [`docs/PERMISSIONS.md`](../docs/PERMISSIONS.md), SDD §14–16, [`docs/legal/PRIVACY_POLICY.md`](../docs/legal/PRIVACY_POLICY.md).

## 12. Deployment

- Vercel per il frontend: progetto `orma` (org `pedro13-projects`) collegato al repository GitHub `pgiudici13/Orma`, preview deployment automatici per branch/PR. Deploy di produzione: https://orma-scout.vercel.app.
- Supabase Cloud per il backend: progetto `orma` (org "Scout", `ouffyxrhxhzqcduvgpon`, eu-central-1, piano free).
- Environment variables Supabase (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) configurate su Vercel per production/preview/development e in `.env.local` (non committato) per lo sviluppo locale.
- Nessuna pipeline CI/CD oltre ai preview/production deployment automatici di Vercel.

## 13. Testing

Strategia scelta in [DEC-006](DECISIONS.md#dec-006--testing-strategy) e attiva dalla Fase 2:

- `tsc --noEmit` e `eslint` obbligatori ad ogni change significativo;
- **Vitest + Testing Library** (`npm run test`) per store, geometrie, texture, composizione 2D e pannello;
- **Playwright** (`npm run test:e2e`) per gli end-to-end, unico ambiente che esercita davvero la scena 3D; i test autenticati richiedono `E2E_EMAIL`/`E2E_PASSWORD` e si saltano da soli senza;
- verifica visiva in browser per ogni lavoro sulla scena.

Dettaglio in SDD §25.

## 14. Performance

Vincoli per la scena 3D, con budget quantitativo in SDD §10 e verifica automatica in E2E:

- texture di dimensioni contenute e riutilizzate tra carte (stesso modello 3D, texture diverse); le mappe PBR di un materiale sono condivise da tutti gli oggetti fatti di quel materiale (una sola fibra di carta per tutta la scena) e occlusione/rugosità/metallicità stanno in un'unica texture impacchettata;
- niente geometria duplicata per ogni carta — geometrie singleton in `components/three/geometry.ts`;
- due livelli di qualità ([DEC-020](DECISIONS.md#dec-020--resa-realistica-pbr-in-tempo-reale-ambiente-procedurale-ombre-morbide--niente-path-tracing)): `base` con una sola luce che proietta ombre, `alto` con la seconda ombra della lampada e ombre morbide ad area. Nessun post-processing in nessuno dei due, `frameloop="demand"` quando la scena è ferma;
- budget misurato (tavolo completo, livello alto): 34 draw call, 4 984 triangoli, 16,9 MB di texture — soglie in `tests/e2e/budget.ts`;
- attenzione a ombre, render loop e GPU mobile (frame rate reali da misurare in P10-T03).

## 15. Vincoli

- Non trasformare la Home in una dashboard/sidebar standard.
- Non duplicare contenuto ufficiale per utente.
- Non introdurre dipendenze non necessarie.
- Non inventare API o dataset AGESCI non verificati.
- Non implementare funzionalità social non esplicitamente richieste.

## 16. Principi di sviluppo

- Sviluppo incrementale per milestone (vedi [`TODO.md`](TODO.md)), non un'unica implementazione monolitica.
- Nessuna libreria nuova senza giustificazione chiara.
- Ogni decisione architetturale rilevante va registrata in [`DECISIONS.md`](DECISIONS.md).
- Ogni errore/lezione rilevante va registrato in [`CORRECTIONS.md`](CORRECTIONS.md).
- Aggiornare questo documento quando l'architettura o lo stato concettuale del progetto cambia.
