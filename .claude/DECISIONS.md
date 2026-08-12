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

- Il vecchio `components/table/Table.tsx` (prototipo statico P1-T02) è stato sostituito da `TableFlat.tsx`, che è interattivo e responsive.
- Su viewport strette esistono nel DOM entrambe le composizioni 2D (larga e stretta), una delle due nascosta con `display: none`: gli identificatori `data-scene-hotspot` non sono quindi univoci nel documento, cosa di cui i test devono tenere conto.

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
