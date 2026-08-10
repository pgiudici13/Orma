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

Proposed

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

Open Decision

### Context

Nessuna scelta di state management (Zustand, Redux, React Context, Jotai, TanStack Query per i dati server) è menzionata in nessun documento di prodotto esistente.

### Decision

Da decidere in fase di design tecnico, prima della Fase 2 (Tavolo interattivo) del piano in `TODO.md`.

### Why

N/A — nessuna decisione presa.

### Alternatives

- Da valutare: stato scena 3D separato da stato dati server (es. Zustand per stato scena/camera, TanStack Query o Server Components per dati Supabase).

### Consequences

Bloccante solo per l'implementazione della scena interattiva (Fase 2), non per la fase di fondazione/design attuale.

---

## DEC-005 — Asset pipeline PDF → texture web

### Status

Open Decision (parzialmente sbloccata)

### Context

I PDF sorgente sono ora disponibili in `files/` alla radice del repository (`Carta di Specialità.pdf`, `CARTA DI COMPETENZA.pdf`, `Manuale-della-Branca-EG.pdf` — quest'ultimo verosimilmente la fonte per le Tappe). `docs/DESIGN.md` conferma che il PDF originale deve essere trattato come fonte master e mai modificato distruttivamente.

`files/` non è ancora la posizione definitiva prevista dalla pipeline (`assets/source/` — vedi SDD §11): è una cartella di staging temporanea creata fuori dalla struttura `docs/`/`.claude/` di questo bootstrap.

### Decision

Definita la forma della pipeline (PDF → estrazione → processing → WebP/PNG → texture/viewer) e ora anche la disponibilità dei PDF reali. Restano da decidere in fase di implementazione (Fase 0/3 del piano):

- lo strumento di estrazione specifico (es. `pdf-lib`, `pdf.js`, conversione manuale) — verificabile solo ispezionando i 3 PDF reali (testo selezionabile vs scansione, layout);
- la migrazione di `files/` → `assets/source/` secondo la convenzione della pipeline.

### Why

I PDF erano assenti al momento della stesura iniziale di questo bootstrap; ora sono stati forniti dall'utente. Lo strumento di estrazione va comunque scelto ispezionando il contenuto reale dei file, non anticipato qui.

### Alternatives

Da valutare in P3-T02a una volta ispezionato il contenuto dei 3 PDF.

### Consequences

La Fase 3 (Specialità/Competenze/Tappe, asset pipeline) non è più bloccata da assenza totale di materiale sorgente. Rimane da fare, come primo task pratico: spostare/riorganizzare `files/` in `assets/source/` e ispezionare i PDF per scegliere lo strumento di estrazione — prima però va completata la fondazione (Fase 0), come da questo bootstrap che non implementa codice.

---

## DEC-006 — Testing strategy

### Status

Open Decision

### Context

Nessun framework di test è ancora scelto; non esiste codice da testare.

### Decision

Da definire quando si introduce il primo codice applicativo. Direzione minima attesa: type-check (`tsc --noEmit`) e lint obbligatori ad ogni commit significativo; test unitari per logica di dominio (permessi, calcolo progresso); test E2E leggeri per i flussi critici (login, apertura carta) quando l'app avrà una UI stabile.

### Alternatives

Vitest + Testing Library per unit/component; Playwright per E2E — scelta standard nell'ecosistema Next.js/Vercel, da confermare in fase di implementazione.

### Consequences

Nessuna finché non esiste codice. Da chiudere prima della Fase 2.

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
