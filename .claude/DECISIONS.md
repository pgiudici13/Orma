# ORMA — Architecture Decisions

Registro delle decisioni architetturali. Non cancellare decisioni superate: marcarle come `Superseded` e collegare quella che le sostituisce.

Stati possibili: `Accepted`, `Proposed`, `Open Decision`, `Superseded`.

---

## DEC-001 — Stack frontend: React + Next.js su Vercel

### Status

Proposed

### Context

`IDEA.md` indica una "direzione tecnica iniziale" (React/Next.js, Vercel, Supabase) esplicitamente dichiarata non vincolante. Il repository non contiene ancora codice, `package.json` o configurazione di alcun framework.

### Decision

Adottare React con Next.js come framework frontend, deploy su Vercel, in assenza di ragioni concrete per deviare.

### Why

- Next.js su Vercel è la combinazione con il minor attrito operativo (deploy, preview, edge functions) e si integra bene con Supabase.
- App Router di Next.js consente di isolare la scena 3D (client component) dal resto dell'app.
- Riduce la superficie di configurazione rispetto a un setup Vite+React separato da gestire a mano su Vercel.

### Alternatives

- **Vite + React (SPA)**: più semplice per una scena 3D pura, ma perde SSR/route handling nativo e richiede più configurazione manuale per il deploy Vercel.
- **Remix**: nessun vantaggio chiaro per questo caso d'uso rispetto a Next.js, meno integrazione nativa con l'ecosistema Vercel.

### Consequences

- Il routing e i data-fetching pattern devono rispettare le convenzioni Next.js.
- La scena 3D (Three.js/R3F) dovrà essere isolata in Client Components per evitare problemi di SSR con WebGL.

---

## DEC-002 — Backend: Supabase (Postgres + Auth + Storage + RLS)

### Status

Accepted

### Context

`IDEA.md` e `docs/PERMISSIONS.md` indicano esplicitamente Supabase come piattaforma backend, con obbligo di Row Level Security e divieto di esporre la service-role key al client.

### Decision

Usare Supabase come unico backend: Postgres per i dati relazionali, Supabase Auth per l'identità, Supabase Storage per gli asset, RLS per l'autorizzazione a livello database.

### Why

- Allineato esplicitamente con la direzione di prodotto in `IDEA.md` e con i requisiti di privacy in `docs/PERMISSIONS.md` (autorizzazione mai solo lato client).
- Evita di costruire un livello di autorizzazione custom quando RLS copre il caso d'uso (dati per utente, dati per Reparto).

### Alternatives

- Backend custom (Node/Express + Postgres gestito a mano): più controllo ma più superficie da mantenere, nessun vantaggio dato il fit di Supabase con i requisiti.

### Consequences

- Ogni tabella con dati personali o di Reparto richiede policy RLS esplicite prima di essere considerata completa.
- Le migrazioni Supabase sono l'unico modo accettato per modificare lo schema.

---

## DEC-003 — 3D: Three.js / React Three Fiber, uso selettivo

### Status

Accepted (confermata in Fase 2, P2-T01)

### Context

Il concept di prodotto richiede una scena tavolo realistica e immersiva, ma sia `docs/DESIGN.md` sia `CLAUDE.md` vietano esplicitamente l'uso del 3D "perché è disponibile" e impongono di valutare sempre l'impatto sulle performance mobile.

### Decision

Usare React Three Fiber (wrapper React di Three.js) per la scena tavolo, le carte e gli oggetti interattivi. Le superfici puramente testuali/di editing (form note, impostazioni) restano DOM/React standard, non 3D.

### Why

- R3F si integra meglio con lo state management React rispetto a Three.js puro.
- Mantiene il confine netto tra "scena immersiva" (3D) e "contenuto/editing" (2D) richiesto da `docs/UX.md` e `docs/DESIGN.md`.

### Alternatives

- Three.js puro senza R3F: più controllo a basso livello, ma integrazione più manuale con React e maggiore rischio di divergenza tra stato React e scena.
- CSS 3D / pseudo-3D senza WebGL: più leggero e più semplice da rendere accessibile, ma non raggiunge il livello di realismo richiesto dal concept del tavolo.

### Consequences

- Le carte devono usare un modello 3D riutilizzabile con texture diverse, non geometria duplicata per carta (vincolo esplicito in `CLAUDE.md`).
- Serve un budget di performance esplicito (draw calls, texture size, shadow map) da definire in fase di prototipo visivo.

---

## DEC-004 — Gestione stato applicativo

### Status

Accepted

### Context

La Fase 2 (P2-T02) richiede uno stato di scena condiviso fra la scena 3D (quale oggetto è a fuoco, dove deve andare la camera) e la UI DOM (pannello di contenuto, blur di sfondo). Nessuna scelta di state management era stata fatta.

### Decision

**Zustand** per lo stato di presentazione della scena (`lib/scene/store.ts`: oggetto a fuoco e punto dello schermo da cui è stato aperto). I dati di dominio non passano da qui: contenuto ufficiale e dati personali restano su Server Components/Supabase (SDD §9).

### Why

- È lo store canonico dell'ecosistema React Three Fiber: lo stato si può leggere dentro `useFrame` senza rerender dell'albero React, cosa che con Context costringerebbe a rerenderizzare i consumer ad ogni cambio di focus.
- Lo stesso store serve identico alla scena 3D e alla composizione 2D di fallback, senza duplicare la logica di apertura/chiusura.
- Dipendenza minima (~1 kB) e senza provider da montare, quindi nessun impatto sui Server Component esistenti.

### Alternatives

- **React Context + useReducer**: zero dipendenze, sufficiente per la quantità di stato attuale, ma ogni cambio di focus rerenderizza i consumer e richiede attenzione per non toccare il render loop 3D.
- **Valtio / Jotai**: entrambe usate con R3F, nessun vantaggio concreto qui rispetto a Zustand.

### Consequences

- `zustand` aggiunta come dependency.
- Lo store contiene **solo** stato di presentazione: se in futuro servisse cache di dati server, va aperta una decisione separata (TanStack Query o equivalente), non estesa questa.

---

## DEC-005 — Asset pipeline immagini distintivi → texture web

### Status

Accepted (parzialmente — vedi Consequences per lo scope residuo)

### Context

I 3 PDF originariamente disponibili in `files/` (`Carta di Specialità.pdf`, `CARTA DI COMPETENZA.pdf`, `Manuale-della-Branca-EG.pdf`) sono stati ispezionati in P3-T02a: **non sono un catalogo utilizzabile**. I primi due sono moduli personali vuoti di un singolo Gruppo (Pavia 4, Reparto Mafeking/La Cometa), il terzo è il manuale metodologico generale della Branca E/G (346 pagine di prosa continua, nessun elenco strutturato di Specialità/Competenze/Tappe). Restano in `files/` come riferimento metodologico, ma non entrano nella pipeline immagini.

È stato inoltre valutato e **rifiutato** lo scraping di immagini prodotto da un sito di e-commerce terzo (caravellascout.it, negozio commerciale non ufficiale AGESCI): rischio di copyright non verificato su foto di prodotto, vietato sia dalle policy dell'assistente sia da questo stesso documento (§"External/official data" di `CLAUDE.md` — non costruire uno scraper senza aver verificato licenza/termini d'uso).

L'utente ha fornito direttamente un catalogo di immagini reali (65 Specialità, 15 "Brevetti", 3 Tappe — JPEG 236×305, reperite autonomamente dall'utente), dichiarando la fonte fuori dalla verifica dell'assistente e assumendosene la responsabilità di provenienza/licenza.

### Decision

- Fonte immagini reale: materiale fornito dall'utente, spostato in `assets/source/distintivi/{specialita,brevetti,tappe}/` (file originali intatti, nessuna modifica distruttiva).
- Nessuno scraping automatico da siti terzi in questo o futuri task di Fase 3, salvo nuova verifica esplicita di licenza.
- Pipeline: JPEG sorgente → normalizzazione nome (mappa esplicita di correzioni per i refusi nei filename, non automatica) → slug → ottimizzazione WebP in `assets/processed/distintivi/**` → seed Supabase (P3-T02b).
- "Brevetto" (cartella `brevetti/`, 15 immagini) è un concetto nuovo non presente in `docs/DATA_MODEL.md`: per indicazione dell'utente rappresenta un raggruppamento di più Specialità correlate ("super-specialità"), modellato come entità ufficiale a sé (tabella `brevetto`) con relazione N:N verso `specialita` (`brevetto_specialita`), completamento calcolato dalle `user_specialita` esistenti, senza tabella di progresso personale dedicata.

### Why

Verificare la fonte prima di costruire una pipeline era un vincolo esplicito di questo stesso documento (`CLAUDE.md`, sezione "External/official data"). L'ispezione ha mostrato che l'assunzione iniziale (i PDF come fonte del catalogo) era sbagliata; lo scraping commerciale era l'alternativa più ovvia ma comporta un rischio di copyright non accettabile senza permesso verificato.

### Alternatives

Contattare l'editore/negozio per un permesso esplicito di riuso immagini (scartata per ora, nessun contatto avviato); costruire il catalogo da zero senza immagini, solo testo (scartata: l'utente ha reso disponibile materiale reale).

### Consequences

- Il catalogo ufficiale di Specialità/Tappe/Brevetti userà le immagini in `assets/source/distintivi/`, di provenienza e licenza non verificate dall'assistente — responsabilità esplicitamente assunta dall'utente.
- "Competenza" resta senza immagini reali (nessuna fonte fornita, e metodologicamente le Competenze sono progetti personalizzati senza badge fisso): seed minimo testuale, texture procedurale di Fase 2 invariata per questa entità.
- Se in futuro emerge un'esigenza di materiale ufficiale AGESCI aggiuntivo (es. testo descrittivo/obiettivi ufficiali per Specialità), va riaperta una decisione dedicata con verifica di fonte/licenza, non riusata questa.

---

## DEC-006 — Testing strategy

### Status

Accepted

### Context

Da chiudere prima della Fase 2 (tavolo interattivo), che introduce la prima logica non banale lato client: stato di scena, geometrie condivise, budget texture, pattern di apertura/chiusura degli oggetti.

### Decision

- **Vitest + Testing Library** (ambiente `jsdom`) per unit e component test: `npm run test`, sorgenti in `tests/unit/`.
- **Playwright** (solo Chromium) per gli end-to-end: `npm run test:e2e`, sorgenti in `tests/e2e/`.
- `tsc --noEmit` e `eslint` restano obbligatori ad ogni change significativo.

### Why

- Vitest condivide la pipeline di trasformazione di Vite ed è immediato da configurare su un progetto TypeScript/React senza aggiungere Babel o Jest.
- Playwright è l'unico dei due in grado di verificare la scena 3D: serve un browser reale con WebGL, e serve una pagina **visibile** (vedi `CORRECTIONS.md`).
- Gli E2E autenticati si saltano da soli senza `E2E_EMAIL`/`E2E_PASSWORD`, così nessuna credenziale finisce nel repository e la suite resta eseguibile da chiunque.

### Alternatives

- **Jest + Testing Library**: equivalente sul piano funzionale, più configurazione per TypeScript/ESM.
- **Cypress** al posto di Playwright: nessun vantaggio qui, supporto WebGL headless meno diretto.

### Consequences

- Le soglie del budget di performance 3D (§10 SDD) sono verificate automaticamente: la scena espone i contatori del renderer su `window.__ormaPerf` **solo in sviluppo** e l'E2E le controlla.
- Playwright richiede `npx playwright install chromium` sulle macchine dove si eseguono gli E2E, e i flag SwiftShader configurati in `playwright.config.ts` per avere WebGL in headless.
- **Estensione P10-T02 (Fase 10)**: `@axe-core/playwright` aggiunta come devDependency per l'audit di accessibilità (`tests/e2e/accessibility.spec.ts`) sulle pagine pubbliche e su ogni pannello del tavolo (via `/tavolo-dev`, nessuna credenziale richiesta, stesso pattern di `tableInteraction.spec.ts`). La regola `color-contrast` di axe è disattivata: non interpreta correttamente `color-mix()` (vedi `.claude/CORRECTIONS.md`) — il contrasto reale va verificato per campionamento pixel quando serve, non solo fidandosi del tool.

---

## DEC-007 — Deployment target

### Status

Accepted

### Context

`IDEA.md` indica Vercel esplicitamente per frontend/deployment.

### Decision

Vercel come piattaforma di hosting/deploy del frontend Next.js, con Supabase come backend gestito separatamente.

### Why

Coerente con la direzione di prodotto dichiarata e con DEC-001.

### Alternatives

Nessuna valutata: nessuna ragione emersa per deviare dalla direzione già indicata in `IDEA.md`.

### Consequences

CI/CD basato su preview deployment Vercel per branch/PR; variabili d'ambiente Supabase (URL, anon key) configurate come environment variable Vercel, mai committate.

---

## DEC-008 — Gestione del contenuto ufficiale (Specialità/Competenze/Tappe)

### Status

Accepted

### Context

Nessun documento di prodotto specifica chi popola/mantiene il catalogo ufficiale di Specialità, Competenze e Tappe. Il modello ruoli in `docs/SDD.md` §6 prevede solo un "Admin di Reparto" scoped al singolo Reparto, non adatto a un catalogo condiviso cross-Reparto.

### Decision

Nessun ruolo applicativo dedicato e nessuna UI di editing per il contenuto ufficiale. Il proprietario del progetto popola e mantiene il catalogo ufficiale direttamente (seed/migrazioni Supabase), prima del deploy finale di ogni release che introduce nuovo contenuto ufficiale.

### Why

Decisione esplicita dell'utente: gestione manuale da parte del proprietario del progetto, senza costruire un ruolo/UI di amministrazione del catalogo che al momento non serve.

### Alternatives

- Ruolo "Content Admin" globale con UI dedicata: scartato per ora, nessun bisogno concreto identificato.

### Consequences

- Le tabelle di contenuto ufficiale (`specialita`, `competenza`, `tappa`) non hanno policy RLS di INSERT/UPDATE/DELETE per alcun ruolo utente applicativo; le scritture avvengono solo tramite migrazioni/seed con credenziali di servizio, mai da un client autenticato come utente normale.
- Se in futuro servisse un flusso di aggiornamento più frequente del catalogo, va aperta una nuova decisione (non anticipata qui).

---

## DEC-009 — Styling: Tailwind per UI 2D, CSS dedicato per materiali 3D

### Status

Accepted

### Context

P0-T03 richiede di scegliere la soluzione di styling per la UI non-3D (form, pannelli contenuto) e di registrare la decisione, valutando se Tailwind è coerente con l'estetica realistica richiesta da `docs/DESIGN.md` o se serve un approccio più custom (CSS Modules per texture/materiali).

### Decision

Usare Tailwind CSS per la UI di sistema (form, pannelli contenuto, testo, layout 2D). I materiali della scena 3D (texture, illuminazione, superfici realistiche) restano fuori da Tailwind: CSS/inline dedicato o proprietà dei materiali Three.js/R3F, non utility class.

### Why

- Tailwind riduce l'attrito per la UI di editing/contenuto (form note, pannelli, impostazioni), che non deve essere fotorealistica ma solo leggibile e accessibile.
- La richiesta di realismo fotografico (`docs/DESIGN.md`) riguarda la scena tavolo/carte in 3D, non i pannelli di contenuto testuale — le due superfici sono già concettualmente separate in `docs/UX.md`.
- Evita di reinventare uno stack CSS custom per la parte 2D quando Tailwind è lo standard nell'ecosistema Next.js (coerente con DEC-001).

### Alternatives

- **CSS Modules puro per tutto**: più controllo su ogni classe, ma più lento da scrivere per la UI di sistema senza un beneficio reale sull'estetica del tavolo, dove il realismo si gioca nella scena 3D e negli asset, non nei pannelli di form.

### Consequences

- `tailwind.config`/`postcss.config` fanno parte del bootstrap Next.js (P0-T01/T03).
- Le regole di `docs/DESIGN.md` (no estetica SaaS/glassmorphism/cartoon) si applicano comunque alle classi Tailwind usate: niente card generiche, niente glassmorphism, anche nei pannelli 2D.

---

## DEC-010 — Registrazione minorenni: auto-registrazione con consenso genitoriale verificato

### Status

Accepted

### Context

`docs/SDD.md` §14 e `.claude/PROJECT.md` §11 segnalavano come **Open Decision** il metodo di autenticazione e, in particolare, il trattamento degli utenti E/G minorenni. Il D.Lgs. 101/2018 (art. 2-quinquies Codice Privacy) fissa a 14 anni la soglia sotto la quale il consenso al trattamento dati richiede anche quello di chi esercita la responsabilità genitoriale.

Decisione utente: progetto personale, community iniziale piccola e nota (un Reparto), ma con auto-registrazione (non solo account creati da un adulto) e consenso genitoriale raccolto in-app, non fuori dal prodotto.

### Decision

Flusso di registrazione:

1. L'E/G si registra da solo con email, password, nome, **data di nascita**.
2. Se età calcolata ≥ 14 anni: consenso proprio, tramite accettazione esplicita (checkbox non pre-selezionata) dell'Informativa Privacy in fase di registrazione. Account attivo dopo la verifica email standard di Supabase Auth.
3. Se età calcolata < 14 anni: la registrazione richiede anche l'**email di un genitore/tutore**. L'account viene creato in stato `in_attesa_consenso_genitoriale`: nessun accesso alle funzionalità applicative oltre a una pagina di attesa, nessuna scrittura/lettura di dati diversi dal proprio profilo minimo. Al genitore viene inviata un'email con un link univoco e a scadenza (token firmato) che, se cliccato, registra il consenso con timestamp e verione della Privacy Policy accettata, e sblocca l'account.
4. Il consenso genitoriale deve risultare da un'azione positiva e verificabile (click sul link), non dalla sola apertura dell'email o da una dichiarazione del minore.

Restano **Open Decision separate e non bloccanti per lo schema dati**:

- provider email transazionale per l'invio del link al genitore (nuova dipendenza esterna, es. Resend/Postmark — da scegliere in fase di implementazione P5-T01, non anticipato qui).
- metodo di autenticazione esatto (password vs magic link) per l'E/G stesso.

### Why

- Decisione esplicita dell'utente (auto-registrazione con consenso in-app, non invito da adulto).
- La soglia di 14 anni e la richiesta di un'azione positiva e verificabile per il consenso genitoriale riflettono l'art. 2-quinquies del Codice Privacy italiano e l'Art. 8 GDPR.
- Registrare timestamp e versione della Privacy Policy accettata rende il consenso dimostrabile (principio di accountability, Art. 5.2 GDPR), non solo dichiarato.
- Bloccare l'accesso ai dati fino a consenso confermato evita di trattare dati di un minore <14 anni prima che il consenso genitoriale sia verificato.

### Alternatives

- **Invito da adulto (account creati solo da un Capo Reparto)**: più semplice legalmente (il consenso lo raccoglie l'adulto una tantum, anche fuori dall'app) ma scartata esplicitamente dall'utente in favore dell'auto-registrazione.
- **Nessuna distinzione per età**: non conforme, scartata.

### Consequences

- Lo schema `Profile` deve includere `data_nascita`, `consenso_privacy_accettato_at`, `privacy_policy_versione`, `stato_consenso_genitoriale` (`non_richiesto` | `in_attesa` | `confermato`), `genitore_email`, `consenso_genitoriale_token`, `consenso_genitoriale_confermato_at` (vedi `docs/DATA_MODEL.md`).
- Le policy RLS su ogni tabella con dati personali devono negare accesso quando `stato_consenso_genitoriale = 'in_attesa'`.
- P5-T01 (`TODO.md`) si aggiorna per includere esplicitamente questo flusso.

---

## DEC-011 — Provider email transazionale: Resend

### Status

Accepted

### Context

[DEC-010](#dec-010--registrazione-minorenni-auto-registrazione-con-consenso-genitoriale-verificato) richiede l'invio di un'email al genitore/tutore con il link di conferma consenso. Nessun provider email era ancora scelto (P5-T01b).

### Decision

Usare [Resend](https://resend.com) per l'invio dell'email di richiesta consenso genitoriale.

### Why

- Integrazione nativa e minima con Next.js/Vercel (stesso ecosistema di DEC-001/DEC-007), SDK ufficiale (`resend`) leggero.
- Piano gratuito sufficiente per il volume atteso di un progetto personale a uso limitato ("in pochi").
- Nessuna infrastruttura SMTP da gestire.

### Alternatives

- Postmark: paragonabile, nessun vantaggio concreto per questo volume, aggiunge solo scelta senza beneficio.
- SMTP custom (es. tramite provider email personale): più attrito operativo, deliverability meno affidabile per email transazionali.

### Consequences

- Nuova dipendenza esterna: richiede una API key Resend (`RESEND_API_KEY`) come variabile d'ambiente server-side, mai esposta al client.
- Richiede un mittente verificato (dominio o indirizzo) su Resend prima che l'invio funzioni in produzione.

---

## DEC-012 — Libreria animazione 2D/transizioni UI: `motion`

### Status

Accepted

### Context

P1-T03 richiede di scegliere la libreria per le transizioni non-3D (apertura pannelli contenuto, fade, blur) coerente con "animazioni fluide, non eccessive" (`docs/DESIGN.md`). La scelta deve reggere anche il caso d'uso futuro vincolante di `docs/UX.md`: apertura di un oggetto della scena con pattern focus → leggero movimento camera → tavolo sfocato sullo sfondo → contenuto → chiusura, implementato in Fase 2 (P2-T04) sul livello DOM/2D dei pannelli di contenuto (la scena 3D vera e propria resta React Three Fiber, DEC-003).

### Decision

Usare `motion` (pacchetto npm `motion`, ex Framer Motion) per tutte le transizioni DOM/2D: apertura/chiusura pannelli, fade, blur di sfondo, shared-element transition per "un oggetto che si solleva e si apre restando la stessa entità visiva". Non sostituisce l'animazione della scena 3D (Fase 2 userà `useFrame`/valori Three nativi per il movimento camera).

### Why

- Copre nativamente l'intero pattern UX richiesto: `AnimatePresence` per enter/exit coordinati di contenuto che si apre/chiude, `layoutId` per shared-layout transition (l'oggetto che "si solleva e si avvicina" restando lo stesso elemento, non un cambio di pagina — requisito esplicito di `docs/UX.md`), animazione nativa di `filter: blur()` combinata con `opacity`/`scale`, spring physics configurabili per un movimento "fisicamente plausibile" (`docs/DESIGN.md`).
- Integrazione ufficiale con React 19/Next.js App Router; componenti client isolabili (`"use client"`) senza impatto sui Server Component esistenti.
- Scegliendola ora evita di dover cambiare libreria a metà progetto quando in Fase 2 si implementa il pattern completo.

### Alternatives

- **CSS transitions/animations pure**: sufficienti per fade/slide semplici, ma senza orchestrazione dichiarativa di sequenze multi-step né shared-element transition — richiederebbe reimplementare a mano ciò che `AnimatePresence`/`layoutId` offrono, con più codice e più rischio di stati inconsistenti durante l'exit animation. Restano comunque la scelta per le micro-interazioni CSS-only più semplici (hover, piccoli cambi di colore), che non passano da `motion`.
- **`@react-spring/web`**: fisica a molla valida, ma API meno ergonomica per orchestrazione dichiarativa enter/exit multi-elemento e nessun equivalente pronto all'uso di `layoutId` per lo shared-layout richiesto dal pattern camera/focus.

### Consequences

- `motion` aggiunta come dependency in `package.json`.
- Il layer 3D (R3F, Fase 2) e il layer DOM/2D (`motion`) restano concettualmente separati, coerente con DEC-003/DEC-009.
- Uso iniziale minimo (P1-T02): un solo wrapper (`FadeIn`) per validare l'integrazione, nessuna orchestrazione complessa finché non serve in Fase 2.

---

## DEC-013 — Scena 3D su desktop/tablet, composizione 2D dedicata altrove

### Status

Accepted

### Context

`docs/UX.md` e `docs/DESIGN.md` indicano desktop/tablet come riferimento primario per la scena tavolo e chiedono esplicitamente che mobile abbia una composizione **riprogettata**, non una versione rimpicciolita. In più la scena 3D non è sempre disponibile: WebGL può mancare o essere disattivato, e chi imposta `prefers-reduced-motion` non deve subire movimenti di camera.

### Decision

Una sola esperienza, due rese, scelte a runtime da `lib/scene/useSceneCapabilities.ts`:

| Condizione | Resa |
| --- | --- |
| Viewport ≥ 768px, WebGL disponibile, nessuna richiesta di movimento ridotto | scena 3D (`components/three/TableCanvas.tsx`) |
| Viewport < 768px | composizione 2D verticale (`components/table/TableFlat.tsx`) |
| WebGL assente o `prefers-reduced-motion: reduce` | composizione 2D |
| SSR e prima paint | composizione 2D |

Le due rese condividono la definizione degli oggetti (`lib/scene/objects.ts`), lo store (`lib/scene/store.ts`) e il pannello di contenuto (`components/panel/ObjectPanel.tsx`): cambia la rappresentazione, non il modello di interazione. Il codice 3D è caricato con `next/dynamic` (`ssr: false`), quindi chi resta sulla composizione 2D non scarica Three.js.

### Why

- Il prototipo 2D di Fase 1 era già stato validato visivamente: riusarlo come composizione mobile costa meno che ridisegnare da zero e mantiene lo stesso linguaggio materiale.
- La composizione 2D funziona senza JavaScript e senza GPU, quindi il contenuto resta raggiungibile anche dove la scena 3D non può esistere (SDD NFR-6).
- Evita il vincolo, altrimenti inevitabile, di far reggere alla stessa scena WebGL sia il desktop sia i device mobili di fascia bassa.

### Alternatives

- **Una sola scena 3D per tutti i formati**: più coerente sulla carta, ma senza alcun fallback se WebGL manca e con un costo GPU non giustificato su mobile.
- **Rotta separata `/tavolo` per il 3D**: lascerebbe due Home in parallelo da mantenere.

### Consequences

- Estesa da [DEC-020](#dec-020--resa-realistica-pbr-in-tempo-reale-ambiente-procedurale-ombre-morbide--niente-path-tracing): la scelta a runtime non riguarda più solo "3D o 2D", ma anche **quanto** costa il 3D — `quality: "alto" | "base"` nello stesso `useSceneCapabilities`.
- Il vecchio `components/table/Table.tsx` (prototipo statico P1-T02) è stato sostituito da `TableFlat.tsx`, che è interattivo e responsive.
- Su viewport strette esistono nel DOM entrambe le composizioni 2D (larga e stretta), una delle due nascosta con `display: none`: gli identificatori `data-scene-hotspot` non sono quindi univoci nel documento, cosa di cui i test devono tenere conto.

---

## DEC-019 — Ogni funzionalità è un oggetto del tavolo; le rotte restano come deep-link

### Status

Accepted

### Context

La nota aperta a fine Fase 7 di [`TODO.md`](TODO.md) segnalava che `app/reparto/*` e `app/onboarding-reparto/` erano pagine piene fuori dalla scena tavolo, in violazione del §15 di [`PROJECT.md`](PROJECT.md) e del principio 1 di `CLAUDE.md`. Lo stesso valeva per `app/impostazioni/`, `app/specialita/`, `app/competenze/`, `app/tappe/`: funzionalità raggiungibili solo abbandonando il tavolo, con due link di navigazione in alto a destra sopra la scena — l'ultimo residuo di dashboard.

Indicazione esplicita del proprietario del progetto (2026-08-23): **tutto deve stare sul tavolo, nulla da altre parti**.

### Decision

- Ogni funzionalità dell'app è un oggetto fisico sul tavolo, che apre la propria superficie dentro lo stesso `ObjectPanel`:

  | Oggetto | Superficie |
  | --- | --- |
  | cassetta di Reparto | membri del Reparto + richieste di adesione (solo Capi/admin) |
  | guidone di Squadriglia | Squadriglie, assegnazione membri |
  | calendario | calendario di Reparto, con le azioni dei Capi |
  | album dei distintivi | catalogo Specialità |
  | quaderno | catalogo Competenze |
  | mappa arrotolata | Tappe |
  | rubrica | Maestri del proprio percorso |
  | tessera | profilo, dati dell'account, uscita |
  | busta | richiesta di adesione a un Reparto |
  | carte, taccuino, foglio | invariati da Fase 2/3 |

- Quali oggetti ci siano dipende dal contesto reale dell'utente (`buildTable` in `lib/scene/objects.ts`): chi non appartiene a un Reparto trova la busta e **non** trova cassetta, guidone e calendario.
- Le superfici sono un registro `kind → componente` (`components/panel/surfaces/`), non uno `switch` dentro il pannello: aggiungere un oggetto è aggiungere una riga.
- Le rotte esistenti restano come **deep-link**: renderizzano il tavolo con l'oggetto già a fuoco (`initialFocus`). Nessuna di esse è più una pagina.
- I due link di navigazione sopra la scena sono stati rimossi.
- Restano fuori dal tavolo solo le superfici che non possono starci: autenticazione (non c'è ancora un tavolo) e `/admin` globale (non linkata, DEC-015).

### Why

- È il vincolo di prodotto non negoziabile del progetto: la Home è un tavolo, non una dashboard.
- Mantenere le rotte come deep-link costa poco e conserva i collegamenti diretti, il gate a tre stadi del middleware (che manda a `/onboarding-reparto`) e i rimandi già esistenti nel codice.
- Un registro di superfici tiene il pannello piccolo mentre gli oggetti aumentano, ed è la stessa struttura per entrambe le rese (3D e composizione 2D).

### Alternatives

- **Rimuovere del tutto le rotte** (redirect alla Home): metafora più pura, ma rompe i link diretti e richiede di ridisegnare il gate di onboarding. Scartata dal proprietario del progetto.
- **Pannelli guidati dal routing** (layout condiviso + rotte annidate, stile modal route di Next.js): idiomatico e con i dati caricati lato server, ma ogni apertura diventa una navigazione, e il tavolo deve restare immobile sotto il pannello. Scartata: l'esperienza richiesta è "prendere in mano un oggetto", non cambiare pagina.

### Consequences

- Le sezioni di Reparto si sono spostate da `app/reparto/` a `components/reparto/`, riusate identiche dalle superfici; `RepartoTabs` è stato eliminato — le tre schede sono ora tre oggetti distinti sul tavolo.
- La composizione 2D (DEC-013) deve raggiungere le stesse superfici: gli oggetti senza un disegno piatto dedicato usano una targhetta (`components/table/Plaque.tsx`), rappresentazione diversa ma stesso modello di interazione.
- La camera è stata allargata (fov 41, posizione più arretrata) per contenere tutti gli oggetti.
- Chiude la nota aperta di Fase 7.

---

## DEC-020 — Resa realistica: PBR in tempo reale, ambiente procedurale, ombre morbide — niente path tracing

### Status

Accepted

### Context

`docs/DESIGN.md` chiede un risultato "fotorealistico o molto vicino alla fotografia". La scena di Fase 2 era lontana: ogni oggetto era un parallelepipedo a spigolo vivo con una sola texture di colore, nessuna mappa di rilievo o di rugosità, una sola luce direzionale e nessun ambiente da riflettere. Il proprietario del progetto ha chiesto esplicitamente "raytracing", lasciando però la scelta della tecnica all'implementazione, con il vincolo dichiarato delle performance mobile (`CLAUDE.md`).

### Decision

Nessun path tracing. La resa si ottiene con tecniche in tempo reale:

- **materiali PBR completi**: mappe di normali, rugosità e occlusione generate proceduralmente dallo stesso disegno che produce il colore (`components/three/materials/textures.ts`), impacchettate come nel formato glTF (R = occlusione, G = rugosità, B = metallicità) per non moltiplicare le allocazioni;
- **materiali dichiarati per **materiale**, non per aspetto** (`components/three/materials/Surfaces.tsx`): legno verniciato, carta, tela, ottone;
- **ambiente procedurale**: `<Environment>` di drei composto con `<Lightformer>` (finestra fredda, alone caldo della lampada, rimbalzo del piano), cotto una volta sola in una cubemap. Nessun file HDRI: nessun asset da verificare per licenza, nessun megabyte da scaricare;
- **geometrie smussate**: le lastre (carte, taccuino, calendario, foglio, piano) sono estrusioni con angoli raccordati e spigolo smussato, non parallelepipedi;
- **ombre morbide ad area** (PCSS, `SoftShadows` di drei) sul livello di qualità alto;
- **due livelli di qualità** (`alto`/`base`) scelti a runtime in `lib/scene/useSceneCapabilities.ts`, estensione di [DEC-013](#dec-013--scena-3d-su-desktoptablet-composizione-2d-dedicata-altrove): cambia la qualità, mai il contenuto.

Direzione visiva conseguente: il tavolo è illuminato **di sera**, con la lampada a gas come luce dominante calda e la finestra come riempimento freddo. È il contrasto fra le due a dare volume agli oggetti.

### Why

- Un path tracer (`three-gpu-pathtracer`) richiede di ricostruire la BVH ad ogni movimento: nella scena ORMA gli oggetti si sollevano all'hover e al focus e la camera si sposta, quindi l'immagine tornerebbe rumorosa **proprio durante l'interazione**, il momento in cui deve essere più credibile.
- WebGPU non è ancora affidabile su tutti i browser di riferimento, e su GPU mobile il path tracing è fuori discussione — mentre il vincolo di `CLAUDE.md` sulle performance resta.
- Il divario di realismo non era nel motore di rendering ma nei materiali: senza rilievo, rugosità e ambiente da riflettere, nessun algoritmo di illuminazione produce una superficie credibile.
- Le tecniche scelte non aggiungono **nessuna dipendenza npm**: `@react-three/drei` era già in `package.json` (DEC-003).

### Alternatives

- **Path tracing ibrido solo desktop** (`three-gpu-pathtracer` a scena ferma, raster durante l'interazione): massimo realismo a riposo, ma dipendenza pesante, BVH da ricostruire, rumore visibile durante hover e focus, tablet e mobile esclusi. Scartata.
- **Baking offline con Blender** (lightmap pre-calcolate con un path tracer vero): realismo massimo a costo runtime quasi nullo, ma richiede authoring 3D esterno e mal si concilia con carte generate da dati dinamici. Scartata.

### Consequences

- **DEC-014 resta valida**: nessun `EffectComposer`, nessun pass di post-processing. `SoftShadows` è una patch agli shader e `ContactShadows` (se servirà) è un render target dedicato, non un passaggio sull'immagine finale; il blur del tavolo resta sul layer DOM.
- Il budget di performance di `docs/SDD.md` §10 è stato rimisurato e alzato: più triangoli (bordi smussati), più texture (mappe PBR), una seconda luce con ombre sul livello alto.
- La sonda di performance misura ora il **picco** e non l'ultimo frame: con `frameloop="demand"` l'ultimo frame disegnato può essere un passaggio ausiliario che non descrive la scena.
- I colori dei nuovi materiali (ottone, vetro, fiamma) sono token in `app/globals.css`, con i fallback allineati in `components/three/materials/palette.ts` e la documentazione in `docs/VISUAL_REFERENCE.md`: le tre fonti vanno tenute allineate.

---

## DEC-014 — Niente post-processing: sfocatura e scurimento sul layer DOM

### Status

Accepted

### Context

Il pattern di apertura di `docs/UX.md` chiede che, aperto un oggetto, il tavolo resti visibile ma sfocato e leggermente più scuro. La via "da manuale" in Three.js sarebbe un `EffectComposer` con un pass di blur.

### Decision

Nessun post-processing 3D. La sfocatura e il calo di luminosità sono una transizione CSS `filter` sul contenitore DOM della scena, animata con `motion` (DEC-012).

### Why

- Evita una dipendenza aggiuntiva (`@react-three/postprocessing`) e un intero render target in più, con il costo GPU relativo — proprio ciò che `CLAUDE.md` chiede di evitare su mobile.
- Con `frameloop="demand"` la scena è ferma mentre il pannello è aperto: il browser compone un layer già sfocato, senza ridisegnare nulla.
- Lo stesso effetto si applica identico alla composizione 2D di fallback, che non ha alcun renderer 3D.

### Alternatives

- **`EffectComposer` + blur pass**: qualità del blur migliore e limitabile per profondità, ma dipendenza e costo per un effetto che qui è puramente di contesto.

### Consequences

- L'oggetto a fuoco viene sfocato insieme al resto della scena: la leggibilità del contenuto è affidata al pannello DOM, non alla carta 3D. Il blur è tenuto basso (4px) proprio perché l'oggetto resti riconoscibile.
- Se in futuro servisse un blur selettivo (sfondo sfocato, oggetto nitido), va riaperta questa decisione.

---

## DEC-015 — Visibilità admin read-only cross-utente

### Status

Accepted

### Context

Con lo schema di Fase 3 in produzione (percorso personale con RLS `auth.uid() = profile_id` su ogni tabella), il proprietario del progetto ha chiesto una visibilità su tutti gli utenti anche dentro l'app ORMA — non solo dalla dashboard Supabase, che già dà accesso completo bypassando la RLS. Nessun account viene creato da Claude Code per l'utente (regola di sicurezza non derogabile): l'utente si registra da `/registrati` come chiunque altro; il flag admin viene attivato manualmente via SQL dopo la registrazione.

### Decision

- Colonna `profiles.is_admin boolean not null default false`, funzione `public.is_admin()` (stesso pattern di `has_active_consent()`, `security invoker`).
- Policy RLS **aggiuntive** (permissive, si sommano in OR alle policy `_own` esistenti — nessuna policy esistente modificata) per SELECT su `profiles`, `user_specialita`, `user_competenza`, `user_tappa`, `nota`, `maestro_esterno`.
- Nessuna policy insert/update/delete per admin: sola lettura.
- Il vincolo di `DEC-010` resta prioritario: un profilo con `stato_consenso_genitoriale = 'in_attesa'` resta invisibile anche all'admin, in ogni policy admin.
- Pagina `/admin` (`app/admin/page.tsx`): redirect a `/` se il profilo corrente non ha `is_admin = true`; altrimenti tabella read-only di profili + conteggi di progresso.

### Why

Richiesta esplicita del proprietario del progetto. Non contraddice `DEC-008`: quella decisione riguarda solo l'editing del contenuto ufficiale (Specialità/Competenze/Tappe), qui invariato — l'admin non scrive né su contenuto ufficiale né sui dati personali altrui.

### Alternatives

Nessuna: l'accesso via dashboard Supabase esiste già, ma non copre il caso "vedere i dati dentro l'esperienza dell'app".

### Consequences

- Prima apertura del modello "privacy by default" a un ruolo con visibilità estesa. Ogni tabella futura con dati personali (Fase 4/6/7/9) che debba essere visibile ad admin richiede la stessa policy additiva read-only con lo stesso vincolo di esclusione `in_attesa` — non estendere l'admin a scrittura senza riaprire questa decisione.
- Nessuna UI pubblicizza `/admin` a chi non è admin: la pagina esiste ma non è raggiungibile né linkata per gli altri utenti.

---

## DEC-016 — Approvazione Reparto: riuso temporaneo di `is_admin`

### Status

Superseded by [DEC-017](#dec-017--ruolo-capo-scoped-al-reparto-fusione-con-admin-di-reparto) (P6-T03 ha sostituito il riuso di `is_admin` con `is_capo_reparto()`, come previsto qui sotto)

### Context

P5-T02 introduce un flusso di richiesta/approvazione per l'appartenenza a un Reparto: un nuovo utente registrato richiede l'associazione a un Reparto esistente (seedato a mano dal proprietario del progetto, stesso principio di DEC-008) e la richiesta resta pendente finché non viene approvata. Il modello di ruolo Capo/Admin-di-Reparto scoped-per-Reparto (menzionato in `docs/PERMISSIONS.md`, `docs/SDD.md` §6/§15) è previsto solo in Fase 6 (P6-T03) e non esiste ancora. Serve comunque un permesso di approvazione operativo da subito, senza costruire l'intera Fase 6.

### Decision

Si riusa `profiles.is_admin` (DEC-015) come unico permesso abilitante per `decidi_richiesta_reparto()` (SECURITY DEFINER, `supabase/migrations/20260812130000_reparto_onboarding.sql`). Nessuna policy RLS di UPDATE viene aggiunta per admin su `profiles`/`richiesta_reparto`: la scrittura passa esclusivamente da questa funzione, per non violare l'invariante "sola lettura" di DEC-015. `profiles.reparto_id` è bloccato alla scrittura self-service dallo stesso trigger che protegge i campi di consenso genitoriale (`profiles_block_self_consent_update`).

### Why

A questa scala (community piccola e nota, DEC-010) un admin globale è sufficiente e non richiede di anticipare un modello di ruolo per-Reparto non ancora progettato. Isolare la scrittura in un'unica funzione la rende sostituibile con un controllo `is_capo_reparto(reparto_id)` in P6-T03 senza toccare le RLS esistenti.

### Alternatives

Anticipare il modello di ruolo Capo/Admin-di-Reparto già in Fase 5: scartato, fuori scope per questo task e prematuro senza i requisiti di P6-T03.

### Consequences

- Quando P6-T03 introdurrà il modello di ruolo per-Reparto, `decidi_richiesta_reparto()` va aggiornata per verificare quel ruolo invece di (o in aggiunta a) `is_admin()` — questa decisione va rivista in quel momento, non semplicemente estesa.
- Squadriglia resta interamente fuori scope: solo la tabella `reparto` (minima: `id`, `nome`) è stata creata in P5-T02.

---

## DEC-017 — Ruolo Capo scoped al Reparto, fusione con "Admin di Reparto"

### Status

Accepted

### Context

`docs/SDD.md` §6/§29 elencava "Capo" e "Admin di Reparto" come righe separate nella tabella dei ruoli, con i permessi di "Capo" segnalati esplicitamente come **Open Decision**. P6-T03 (Fase 6) richiedeva di chiudere questo punto per sostituire il riuso temporaneo di `is_admin` in `decidi_richiesta_reparto()` (DEC-016) con un controllo scoped-per-Reparto, e per dare un senso concreto alla nuova tabella `squadriglia` (P6-T01).

### Decision

- Un solo ruolo scoped al Reparto, `profiles.ruolo` (`'eg' | 'capo'`, default `'eg'`), che fonde "Capo" e "Admin di Reparto" della tabella SDD: chi è Capo ha tutti i permessi amministrativi sul proprio Reparto (approvare/rifiutare richieste di adesione, gestire le Squadriglie del proprio Reparto), nessun livello di permesso più granulare per ora.
- Funzione `is_capo_reparto(target_reparto_id)` (stesso pattern di `is_admin()`, DEC-015): vero se il profilo autenticato ha `ruolo = 'capo'` e `reparto_id = target_reparto_id`.
- Nessuna UI per assegnare `ruolo = 'capo'`: attivato manualmente via SQL dal proprietario del progetto, stesso pattern non derogabile di `is_admin` (DEC-015).
- L'assegnazione di un membro a una Squadriglia (`profiles.squadriglia_id`) non è mai self-service: solo il Capo del Reparto o l'admin globale possono scriverla (stesso principio di `reparto_id`, bloccato allo stesso trigger `profiles_block_self_consent_update`). Il meccanismo applicativo di assegnazione (funzione + UI) è rimandato a P7-T02: qui solo schema/RLS.
- `decidi_richiesta_reparto()` accetta `is_admin()` **o** `is_capo_reparto(reparto della richiesta)` — chiude DEC-016.

### Why

Decisione utente esplicita in fase di pianificazione di Fase 6: alla scala del progetto (community piccola e nota, stesso ragionamento di DEC-010/DEC-016) un ruolo granulare separato per "Admin di Reparto" non ha un caso d'uso concreto oggi. Un ruolo unico riduce la superficie di permessi da mantenere e resta coerente con l'invariante generale di ORMA (autorizzazione sempre verificata via RLS, mai solo lato client).

### Alternatives

- **Ruoli distinti "Capo" e "Admin di Reparto"** con permessi separati (proposto come opzione in fase di pianificazione, non scelto): richiederebbe progettare ora una granularità di permessi che nessuna funzionalità concreta richiede ancora — prematuro.

### Consequences

- `profiles.ruolo` aggiunta con `20260814090000_reparto_ruolo.sql` (o equivalente, vedi timestamp reale in `supabase/migrations/`); `is_capo_reparto()` usata dalle policy di `squadriglia`, `richiesta_reparto`, `profiles` (vedi `20260814090500_squadriglia.sql`, `20260814091000_capo_richiesta_reparto.sql`).
- `app/admin/richieste-reparto/page.tsx` accessibile anche a `ruolo = 'capo'`, non solo a `is_admin`.
- Se in futuro emergesse un bisogno concreto di permessi più granulari (es. un Capo che gestisce solo le Squadriglie ma non approva richieste), va riaperta questa decisione, non semplicemente estesa con flag ad-hoc.
- Nessun test RLS automatizzato copre l'isolamento positivo cross-Reparto per un Capo reale (stesso limite già presente per `is_admin`, vedi `.claude/CORRECTIONS.md`): `ruolo`/`reparto_id`/`squadriglia_id` sono scrivibili solo da SQL diretto o da `decidi_richiesta_reparto()`, non self-service in un test.

---

## DEC-018 — Funzionalità di Reparto: visibilità membri, assegnazione Squadriglie e Calendario (Fase 7)

### Status

Accepted

### Context

La Fase 7 implementa le funzionalità di Reparto (P7-T01, P7-T02, P7-T03): la consultazione dei membri del Reparto nel rispetto della privacy scout, la gestione e assegnazione delle Squadriglie da parte dei Capi, e il Calendario di Reparto (eventi, uscite, campi) integrato sia nella metafora fisica del tavolo sia nella pagina Reparto.

### Decision

1. **Visibilità membri e percorso scout (P7-T01)**:
   - Estesa la policy `profiles_select_own` per consentire ai membri dello stesso Reparto (con `has_active_consent()` e `stato_consenso_genitoriale <> 'in_attesa'`) di leggere i profili dei compagni del proprio Reparto.
   - I dati strettamente personali (data di nascita, email/token del genitore) non vengono esposti nella vista membri di Reparto.
   - Estese le policy di `user_specialita`, `user_competenza` e `user_tappa` per consentire la lettura delle Specialità/Competenze completate e delle Tappe tra membri dello stesso Reparto.
   - `nota` e `maestro_esterno` restano confidenziali e di proprietà esclusiva dell'utente (`auth.uid() = profile_id` o admin globale).

2. **Assegnazione Squadriglia (P7-T02)**:
   - Funzione PostgreSQL `assegna_squadriglia(p_profile_id uuid, p_squadriglia_id uuid)` (`SECURITY DEFINER`): verifica che il chiamante sia `is_admin()` o `is_capo_reparto(reparto_id)`, verifica che la Squadriglia (se indicata) appartenga allo stesso Reparto del profilo, e aggiorna `profiles.squadriglia_id`.
   - UI in `/reparto` per la creazione, rinomina ed eliminazione di Squadriglie, e menu rapido per l'assegnazione dei membri.

3. **Calendario di Reparto (P7-T03)**:
   - Tabella `public.evento` (`id`, `reparto_id`, `titolo`, `descrizione`, `tipo`, `data_inizio`, `data_fine`, `luogo`, `created_at`).
   - RLS multi-tenant: lettura per i membri del Reparto con consenso attivo, scrittura riservata ai Capi del Reparto (`is_capo_reparto(reparto_id)`) o all'admin globale (`is_admin()`).
   - Integrazione tavolo scout: quando l'utente interagisce con l'oggetto `calendario` sul tavolo, `ObjectPanel` mostra i prossimi eventi del Reparto dell'utente con la metafora grafica analogica.
   - Pagina `/reparto` con sezione Calendario completa e form per i Capi.

### Why

Rispetta i requisiti di `docs/PERMISSIONS.md` (privacy by default, isolamento multi-tenant a livello RLS) e la metafora visiva scout di `docs/DESIGN.md` e `docs/UX.md`.

### Consequences

- Pagina `/reparto` con tab Membri, Squadriglie e Calendario.
- Oggetto `calendario` sul tavolo scout popolato dinamicamente con i dati reali del Reparto dell'utente.
- **Corretto in Fase 10 (P10-T01, `.claude/CORRECTIONS.md`)**: l'estensione di `profiles_select_own` qui descritta concedeva l'intera riga `profiles` (inclusi `data_nascita`/`genitore_email`) a chiunque appartenesse allo stesso Reparto — la RLS filtra righe, non colonne, quindi contraddiceva il punto 1 di questa stessa decisione. Sostituita da `stesso_reparto_attivo()`/`membri_reparto()` (SECURITY DEFINER, `20260823172537_profiles_reparto_visibility_fix.sql`), che espongono solo booleano/colonne dichiarate, stesso pattern di DEC-022.


---

## DEC-021 — Caricamento dei dati per superficie, su richiesta

### Status

Accepted

### Context

Con [DEC-019](#dec-019--ogni-funzionalità-è-un-oggetto-del-tavolo-le-rotte-restano-come-deep-link) il tavolo ospita ogni funzionalità dell'app. Se la Home caricasse in anticipo i dati di tutte le superfici — membri del Reparto, Squadriglie, calendario, 65 Specialità del catalogo, Maestri, profilo — pagherebbe l'intero costo per disegnare un tavolo su cui l'utente forse aprirà un solo oggetto.

### Decision

- I dati di una superficie si caricano quando l'oggetto viene aperto, tramite Server Action di sola lettura in `app/actions/surfaces.ts`, che chiamano le query in `lib/queries/`.
- L'hook `lib/scene/useSurfaceData.ts` gestisce caricamento, cache a livello di modulo (riaprire un oggetto non ricarica) ed errori (una superficie già aperta non si svuota se la rete cade).
- Dopo una scrittura, la superficie chiama `reload()`: le sezioni riusate ricevono una callback `onMutated`, perché `revalidatePath` invalida la cache del server, non quella del client.
- La Home continua a caricare lato server solo ciò che serve a **disegnare** il tavolo: le carte del percorso attivo e i prossimi eventi (`getTableContext`).

### Why

- Mantiene la Home leggera quanto in Fase 3, indipendentemente da quanti oggetti ci sono sul tavolo.
- Nessun identificativo utente arriva dal client: l'identità è quella della sessione e l'autorizzazione resta la RLS (`docs/PERMISSIONS.md`), esattamente come per le pagine che queste superfici sostituiscono.

### Alternatives

- **Prefetch di tutto nella Home**: un solo round-trip, ma costo proporzionale al numero di oggetti anche quando non si apre nulla.
- **Route handler REST dedicati**: equivalenti nella sostanza, ma richiedono di progettare e mantenere una superficie API che le Server Action rendono superflua.

### Consequences

- Aprire un oggetto pesante mostra per un istante una riga di attesa (`SurfaceLoading`) invece del contenuto: accettabile, ed è il motivo per cui il calendario mostra subito gli eventi che l'oggetto porta già con sé.
- La cache è per pagina: un aggiornamento fatto altrove non si riflette finché non si ricarica o non si scrive da qui.
- I test unitari che montano una superficie devono simulare la Server Action: in jsdom non esiste una richiesta a cui agganciarsi (vedi `tests/unit/objectPanelCalendario.test.tsx`).

---

## DEC-022 — Ricerca globale Maestri: tabella dedicata con opt-in esplicito e funzione di ricerca SECURITY DEFINER

### Status

Accepted

### Context

La Fase 8 (P8-T01/T02, `TODO.md`) implementa FR-14/FR-15: ricerca globale dei Maestri di Specialità cross-Reparto, filtrabile per Specialità/Regione/Zona/disponibilità, con visibilità controllata esplicitamente dal Maestro. Il vincolo di prodotto è duplice (`docs/PERMISSIONS.md`, SDD §19, `CLAUDE.md` §6): la ricerca mostra **solo** le informazioni rese ricercabili, e l'opt-in è la condizione necessaria per comparire. Inoltre gli utenti non possono leggere `profiles` altrui via RLS (l'unica eccezione esistente era `find_profile_by_email`, P4-T02), quindi la ricerca non può fare join su `profiles` dal client.

### Decision

1. **Tabella dedicata `maestro_profilo`** (1:1 con `profiles`, `visibile boolean not null default false` = opt-in esplicito FR-15) con i soli campi dichiarati ricercabili: `regione`, `zona`, `localita`, `disponibile`. Niente colonne di visibilità su `profiles`: una policy SELECT estesa lì esporrebbe l'intero profilo (data di nascita, email del genitore) a chiunque, non solo i campi dichiarati — la separazione tabella è ciò che rende l'"interroga solo i campi marcati ricercabili" di SDD §19 una proprietà strutturale e non un'accortezza della query.
2. **`maestro_specialita`** (N:N verso il contenuto ufficiale `specialita`): le Specialità che il Maestro dichiara di accompagnare. Riferimento al contenuto condiviso, mai duplicato (`CLAUDE.md`, "Official content must be reusable").
3. **RLS**: il proprietario legge/gestisce il proprio profilo (`auth.uid() = profile_id` + `has_active_consent()`); la lettura altrui è permessa **solo** quando `visibile` e con consenso attivo. Le policy di scrittura restano `_own`.
4. **`cerca_maestri(p_specialita_id, p_regione, p_zona, p_solo_disponibili)`**, SECURITY DEFINER, stesso pattern di `find_profile_by_email` (P4-T02): un utente non può leggere `profiles` altrui via RLS, quindi la ricerca passa da una funzione che espone **solo** le colonne dichiarate (nome, Specialità, Regione/Zona/Località, disponibilità), esclude sempre sé stessi e i profili `in_attesa` (DEC-010), e filtra sempre su `visibile = true` — l'opt-in è condizione necessaria, non un filtro dell'utente.
5. **Filtri** (FR-14): Specialità, Regione, Zona, disponibilità — combinabili. La località si mostra nei risultati ma non filtra (SDD FR-14 non la elenca).
6. **UX** ([DEC-019](#dec-019--ogni-funzionalità-è-un-oggetto-del-tavolo-le-rotte-restano-come-deep-link)): la ricerca vive nella **rubrica** (l'oggetto Maestri del tavolo) come seconda scheda accanto a "I miei Maestri"; l'opt-in si gestisce dalla **tessera** (profilo/account). Da un risultato di ricerca si può associare il Maestro a una propria Specialità **in corso** (chiusura del flusso "cerca → associa" di `docs/PRODUCT.md`); se non si ha quella Specialità attiva, si deve prima avviarla dal catalogo.

### Why

- L'opt-in e l'esposizione minima non sono richieste accessorie ma il vincolo di prodotto centrale della funzione (`PERMISSIONS.md`): senza la separazione fisica dei campi, qualsiasi errore futuro di policy su `profiles` tradirebbe il principio "solo le informazioni rese ricercabili".
- La funzione SECURITY DEFINER replica il pattern già accettato e verificato di P4-T02: unica via per leggere dati di altri profili senza allargare la RLS di `profiles`.
- La ricerca nella rubrica evita un oggetto nuovo sul tavolo per una funzione che è la naturale estensione della rubrica stessa; la tessera è già la superficie "profilo/account" ([DEC-019](#dec-019--ogni-funzionalità-è-un-oggetto-del-tavolo-le-rotte-restano-come-deep-link)).

### Alternatives

- **Colonne di opt-in su `profiles`** con una policy SELECT estesa: più semplice, ma qualunque lettura di chi fa opt-in esporrebbe l'intero profilo — viola SDD §19. Scartata.
- **Vista `security_invoker`** per la ricerca: il join con `profiles` fallirebbe comunque sulla RLS di `profiles`; e una vista `security_definer` equivale alla funzione, con meno controllo sui parametri. Scartata.

### Consequences

- `supabase/migrations/20260823110000_maestri_ricerca_globale.sql` da applicare al progetto reale (come tutte le migrazioni, tramite MCP Supabase).
- L'associazione per **email esatta** (`assignMaestroInterno`, P4-T02) resta: è la via per associare chi non è (ancora) ricercabile; `associaMaestroDaRicerca` è la via dalla ricerca.
- Test RLS in `tests/unit/rls/maestri.rls.test.ts` (pattern `personalTables.rls.test.ts`, si saltano senza credenziali): opt-in/opt-out, esposizione solo campi dichiarati, filtri combinabili, immodificabilità del profilo altrui.
- La tessera mostra la sezione "Maestro di Specialità" a chiunque: un E/G o un Capo può essere Maestro (SDD §6), non serve un ruolo dedicato.

---

## DEC-023 — Archivio di Reparto: memoria storica separata dal calendario, metadati in Postgres e file in bucket privato

### Status

Accepted

### Context

La Fase 9 (P9-T01/T02/T03, FR-19) implementa l'archivio storico di Reparto: uscite, campi, luoghi, fotografie e documenti, navigabili come da `docs/DATA_MODEL.md` (Campo → Luogo → Partecipanti → Squadriglie → Attività → Foto → Documenti). Vincoli: `docs/DATA_MODEL.md` modella Uscita, Campo e Luogo come entità distinte con join di partecipanti e Squadriglie; SDD §17 impone metadati in Postgres e file in Storage, con nessun bucket pubblico per contenuti che includano minori.

### Decision

1. **Schema storico distinto dal calendario**: tabelle `luogo`, `uscita`, `campo` (scoped a `reparto_id`) + quattro join con FK reali (`uscita_partecipante`, `campo_partecipante`, `uscita_squadriglia`, `campo_squadriglia`). L'archivio **non** è collegato a `evento` (P7-T03): il calendario guarda avanti, l'archivio è la memoria — nessun collegamento obbligato tra i due.
2. **Metadati in Postgres, file in Storage** (SDD §17): `documento_archivio` (reparto_id, tipo `foto`/`documento`, entita_tipo `uscita`/`campo`/`luogo` + entita_id, file_path, nome_file) — polymorphic come `nota`, nessuna FK diretta sul target.
3. **RLS coerente con DEC-018**: lettura per i membri del Reparto con consenso attivo; scrittura (insert/update/delete) per i Capi del Reparto o admin globale. Le policy dei join derivano la visibilità dal genitore (l'uscita/campo a cui appartengono), perché la riga di join non ha un reparto proprio — stesso pattern di `maestro_specialita`.
4. **Storage privato**: bucket `archivio` (`public = false`), percorso `archivio/{reparto_id}/{entita_tipo}/{entita_id}/{file}`. Le policy su `storage.objects` estraggono il Reparto dal percorso (`storage.foldername(name)[1]`); il cast a uuid è protetto da una regex per non far esplodere la policy su percorsi malformati. Lettura per i membri, scrittura per i Capi. Nessun URL pubblico: la UI apre i file con URL firmati a breve scadenza generati dalle query.
5. **UX** ([DEC-019](#dec-019--ogni-funzionalità-è-un-oggetto-del-tavolo-le-rotte-restano-come-deep-link)): l'archivio è il **baule** sul tavolo — oggetto nuovo, distinto dalla cassetta (che tiene i membri); la superficie naviga per ricordi (scaffale → dettaglio), con azioni di scrittura riservate ai Capi.
6. **Cancellazione pulita**: eliminare un'uscita/campo rimuove anche metadati e file dei suoi documenti (l'assenza di FK polymorphic lascerebbe orfani); `luogo` è `on delete set null` sulle uscite/campi.

### Why

- La separazione calendario/archivio rispetta i documenti di prodotto: il calendario è FR-18 (eventi a cui si ha accesso), l'archivio è FR-19 (consultazione storica) — due superfici, due modelli.
- I metadati in Postgres permettono RLS granulare (per chi, per cosa) che Storage da solo non offre; il bucket privato è l'unico modo di conservare fotografie con minori (SDD §17).
- Il baule estende il vincolo DEC-019 senza forzare un oggetto esistente a due ruoli: la cassetta è il Reparto vivo, il baule la sua memoria.

### Alternatives

- **Estendere `evento`** con luogo/partecipanti/file: mescolerebbe due cicli di vita diversi (un evento si sposta, un ricordo no) e renderebbe il calendario pesante dei dati storici. Scartata.
- **Bucket pubblico** con nomi difficili da indovinare: viola esplicitamente SDD §17 per contenuti con minori. Scartata.

### Consequences

- `supabase/migrations/20260823120000_archivio_reparto.sql` (tabelle + RLS + bucket e policy Storage) da applicare al progetto reale.
- Test RLS in `tests/unit/rls/archivio.rls.test.ts` (percorso di diniego per utenti `eg`, incluse le policy Storage — stesso limite già dichiarato per l'isolamento cross-Reparto dei Capi, vedi `.claude/CORRECTIONS.md`); l'integrità referenziale (P9-T01) è garantita dai vincoli FK dello schema e va verificata via introspezione SQL, non automatizzabile via client con utenti non-Capo.
- Unit della superficie in `tests/unit/archivioSurface.test.tsx` (scaffale, dettaglio, permessi).

---

## DEC-024 — Archivio: eccezione a DEC-015 per dati sensibili (fotografie con minori)

### Status

Proposed

### Context

[DEC-015](#dec-015--visibilità-admin-read-only-cross-utente) stabilisce che l'admin globale (`is_admin()`) ha visibilità read-only cross-Reparto sui dati degli utenti per funzionalità di ricerca e profilo. La policy `evento_select_own_reparto` in `20260823100000_reparto_funzionalita.sql` (Fase 7, tabelle di Reparto) include `or public.is_admin()` nel SELECT, coerentemente con DEC-015.

Tuttavia le policy SELECT su `luogo`, `uscita`, `campo` e `documento_archivio` in `20260823120000_archivio_reparto.sql` (Fase 9, archivio storico) **non** includono `or public.is_admin()`, restringendo l'accesso soltanto ai membri del Reparto di cui l'admin non fa parte. Questo contraddice il principio generale di DEC-015.

### Decision

Documentare esplicitamente questa eccezione: le policy di archivio storico (`luogo_select_reparto`, `uscita_select_reparto`, `campo_select_reparto`, `documento_archivio_select_reparto`) intenzionalmente non espongono i dati all'admin globale.

La restrizione è giustificata se **deliberata**: l'archivio contiene fotografie e documenti di minori (Fase 9, ricordi storici del Reparto), dato sensibile rispetto alla consultazione di profili, calendario e progressi scout. Evita accesso accidentale in-app a fotografie di minori durante ricerche amministrative, rispettando pienamente SDD §17 ("nessun bucket pubblico per contenuti che includano minori") e il principio di privacy-by-default.

Se invece è una **svista** e dev'essere allineata a DEC-015, il maintainer del progetto deve aggiornare le quattro policy con `or public.is_admin()` e riaprire questa decisione.

### Why

- L'archivio storico contiene fotografie e documenti di minori: dato più sensibile rispetto a profili, calendario e progressi scout che l'admin consulta normalmente.
- Privacy by default (DEC-010, CLAUDE.md §4): l'accesso a fotografie/documenti di minori non dovrebbe essere automatico neppure per un admin globale.
- Protezione dall'accesso accidentale durante una ricerca amministrativa in-app.
- L'admin ha accesso totale via dashboard Supabase (service-role key) comunque — questa eccezione non è una "sicurezza vera", bensì una protezione dall'accesso accidentale tramite UI.

### Alternatives

- **Allineare a DEC-015**: aggiungere `or public.is_admin()` alle quattro policy di archivio, rendendo coerente il modello di visibilità admin su tutte le tabelle di Reparto.
- **Allineare altre tabelle a questa eccezione**: rimuovere `or public.is_admin()` anche da `evento_select_own_reparto` e dalle policy di profilo/specialità/competenza/tappa — scartato: la consultazione di eventi e progressi scout è caso d'uso legittimo per un admin, diverso dall'accesso a fotografie personali di minori.

### Consequences

- Finché questa decisione resta **Proposed**, il maintainer può verificare se è intenzionale o una svista.
- Se intenzionale: nessun change necessario, il codice attuale è corretto.
- Se sbagliata: le quattro policy vanno aggiornate in una nuova migrazione; questa voce marcata `Accepted`; DEC-015 confermato come principio generale senza eccezioni.
- Un contributor futuro che noti questa incoerenza comprenderà che è una scelta consapevole, non un'accortezza di copiatura del template.
