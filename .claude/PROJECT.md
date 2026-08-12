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
│   └── actions/             # Server Action condivise (progresso, note)
├── components/
│   ├── panel/              # pannello di contenuto DOM (condiviso 3D/2D)
│   ├── table/              # scelta della resa + composizione 2D/mobile
│   └── three/              # scena R3F: canvas, tavolo, carte, camera, materiali
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

## 7. Modello dati ad alto livello

Entità principali (dettaglio in [`docs/DATA_MODEL.md`](../docs/DATA_MODEL.md) e SDD §13):

- **Contenuto ufficiale** (condiviso, non duplicato per utente): `Specialita`, `Competenza`, `Tappa`.
- **Percorso personale** (relazione utente↔contenuto ufficiale): `UserSpecialita`, `UserCompetenza`, `UserTappa` — stato, progresso, obiettivi completati, Maestro associato. Le note sono probabilmente un'entità separata collegata (una o più per Specialità/Competenza/Tappa), non una singola colonna — dettaglio in SDD §13.
- **Identità/organizzazione**: `User`, `Profile`, `Reparto`, `Squadriglia`.
- **Maestri**: Maestro interno (ha un `User`) vs Maestro esterno (contatto senza account).
- **Archivio/attività**: `Uscita`, `Campo`, `Luogo`, documenti, fotografie.

Regola non negoziabile: **una Specialità/Competenza/Tappa ufficiale esiste una sola volta nel database**; il progresso personale è sempre una relazione separata.

## 8. UX e design direction

- Home = scena tavolo, non dashboard. Interazione: oggetto → focus → leggero movimento camera → tavolo sfocato sullo sfondo → contenuto → chiusura → ritorno alla scena.
- Non tutti gli oggetti sono interattivi; elementi decorativi restano statici.
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

- texture di dimensioni contenute e riutilizzate tra carte (stesso modello 3D, texture diverse);
- niente geometria duplicata per ogni carta — geometrie singleton in `components/three/geometry.ts`;
- una sola luce con ombre, nessun post-processing, `frameloop="demand"` quando la scena è ferma;
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
