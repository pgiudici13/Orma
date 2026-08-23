# ORMA — Software Design Document

> Specifica tecnica dell'architettura. Per la visione di prodotto vedi [`IDEA.md`](../IDEA.md); per lo stato corrente del progetto vedi [`.claude/PROJECT.md`](../.claude/PROJECT.md); per le decisioni vedi [`.claude/DECISIONS.md`](../.claude/DECISIONS.md); per il piano vedi [`.claude/TODO.md`](../.claude/TODO.md).
>
> Stato del repository al momento della stesura: solo documentazione. Nessun codice, nessuna configurazione, nessun asset presente.

---

## 1. Executive Summary

ORMA è una web app personale per Esploratori e Guide AGESCI, la cui Home è una scena realistica del proprio "tavolo scout" invece di una dashboard. L'utente segue Specialità, Competenze e Tappe come carte fisiche interattive, distinguendo sempre contenuto ufficiale (immutabile dall'utente) da dati personali (progresso, note, Maestro associato). Il sistema include anche un contesto di Reparto (membri, Squadriglie, uscite, campi, archivio) e una funzione di ricerca globale dei Maestri di Specialità, con privacy by default in ogni superficie.

Architettura target: Next.js su Vercel per il frontend, React Three Fiber per la scena tavolo, Supabase (Postgres + Auth + Storage + RLS) per il backend.

## 2. Goals

- Rendere il percorso di Specialità/Competenze/Tappe un'esperienza immersiva e personale, non un elenco o una tabella.
- Mantenere una separazione netta e verificabile tra contenuto ufficiale e dati personali, a livello di modello dati e di UI.
- Applicare privacy by default e autorizzazione enforced a livello database (RLS), non solo in UI.
- Supportare Maestri esterni senza richiedere loro un account.
- Costruire un archivio storico di Reparto navigabile, non solo un database.
- Sviluppo incrementale, verificabile milestone per milestone.

## 3. Non-goals

- Non è un social network: nessun feed pubblico, nessuna funzionalità di interazione sociale generica (like, commenti pubblici, messaggistica libera).
- Non è un gestionale amministrativo generico per Reparti (niente contabilità, gestione iscrizioni/pagamenti nello scope attuale).
- Non è un videogioco: nessuna gamification aggressiva (punteggi, classifiche, badge competitivi).
- Non replica il sito AGESCI né si presenta come fonte ufficiale AGESCI.
- Non introduce funzionalità di scraping automatico di contenuti AGESCI senza verifica esplicita di licenza e termini d'uso.
- Non implementa, in questa fase, funzionalità multi-lingua, multi-organizzazione (oltre AGESCI) o white-label.

## 4. Functional Requirements

### 4.1 Account

- FR-1: registrazione e login utente (Supabase Auth).
- FR-2: profilo personale con appartenenza a un Reparto.
- FR-3: gestione sessione e impostazioni account.

### 4.2 Specialità

- FR-4: catalogo delle Specialità ufficiali, consultabile da ogni utente autorizzato.
- FR-5: apertura carta con contenuto ufficiale in sola lettura.
- FR-6: visualizzazione e aggiornamento del progresso personale (stato, obiettivi completati).
- FR-7: note personali collegate a una Specialità, editabili solo dal proprietario.
- FR-8: associazione di un Maestro (interno o esterno) alla propria Specialità.

### 4.3 Competenze

- FR-9: stesso set di requisiti FR-4–FR-8 applicato alle Competenze.

### 4.4 Tappe

- FR-10: visualizzazione della Tappa attuale e del relativo progresso.
- FR-11: collegamento tra Tappa e Specialità/Competenze completate.
- FR-12: note personali collegate alla Tappa.

### 4.5 Maestri

- FR-13: aggiunta manuale di un Maestro esterno, senza creazione di account.
- FR-14: ricerca globale di Maestri disponibili (cross-Reparto), filtrabile per Specialità/Regione/Zona/disponibilità.
- FR-15: un Maestro controlla esplicitamente se è visibile nella ricerca globale (opt-in).

### 4.6 Reparto

- FR-16: consultazione membri, Squadriglie, Capi del proprio Reparto secondo permessi.
- FR-17: nessun accesso automatico ai dati di Reparti diversi dal proprio.

### 4.7 Calendario

- FR-18: visualizzazione di uscite, campi, eventi a cui l'utente ha accesso.

### 4.8 Archivio

- FR-19: consultazione storica di uscite, campi, luoghi, fotografie, documenti del Reparto.

## 5. Non-functional Requirements

- NFR-1 (Privacy): ogni dato ha proprietario e visibilità esplicita; default privato; enforcement a livello database (RLS), non solo UI.
- NFR-2 (Performance): la scena 3D deve restare fluida su hardware desktop comune e su mobile di fascia media; niente geometria duplicata per carta; texture ottimizzate.
- NFR-3 (Realismo): l'interfaccia non deve leggersi come una dashboard SaaS generica; il 3D è usato solo dove aumenta l'immersione.
- NFR-4 (Manutenibilità): componenti piccoli e focalizzati, tipizzazione stretta, nessuna astrazione prematura.
- NFR-5 (Sicurezza): nessuna service-role key esposta al client; validazione input su ogni confine di sistema.
- NFR-6 (Accessibilità): i componenti 2D/DOM (form, pannelli contenuto) devono essere navigabili da tastiera e da screen reader; la scena 3D è un'esperienza visiva complementare, non l'unico canale per accedere al contenuto.
- NFR-7 (Integrità dei contenuti ufficiali): impossibile, a livello di permessi database, per un utente non amministratore modificare contenuto ufficiale.

## 6. User Roles

| Ruolo                   | Descrizione                                        | Note                                                                                              |
| ----------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| E/G (Esploratore/Guida) | Utente principale, gestisce il proprio percorso    | Ruolo di default                                                                                  |
| Capo                    | Membro dello staff di Reparto                      | Può avere permessi aggiuntivi su dati di Reparto (dettaglio da definire — vedi Open Question §29) |
| Maestro (interno)       | Utente ORMA associabile come Maestro di Specialità | Non è un ruolo esclusivo: un E/G o un Capo può anche essere Maestro                               |
| Maestro (esterno)       | Persona senza account ORMA                         | Non è un `User`, è un record dati associato all'utente che lo ha aggiunto                         |
| Admin di Reparto        | Gestisce dati amministrativi del Reparto           | Scoped al singolo Reparto — **non** gestisce il catalogo ufficiale (vedi nota sotto)              |

Il modello di ruolo dettagliato (permessi granulari per Capo/Admin di Reparto) era un **Open Decision** (Open Question §29) — chiusa in Fase 6 con [DEC-017](../.claude/DECISIONS.md#dec-017--ruolo-capo-scoped-al-reparto-fusione-con-admin-di-reparto): un ruolo unico "Capo", scoped al proprio Reparto, che fonde le due righe di questa tabella. Nessun livello di permesso più granulare per ora.

**Nota**: il contenuto ufficiale (Specialità/Competenze/Tappe) non ha un ruolo applicativo dedicato. Per decisione esplicita ([DEC-008](../.claude/DECISIONS.md#dec-008--gestione-del-contenuto-ufficiale-specialit%C3%A0competenzetappe)), il catalogo è popolato e mantenuto dal proprietario del progetto tramite seed/migrazioni, non tramite una UI o un ruolo "Content Admin" in-app.

## 7. UX Architecture

Pattern di interazione unico per ogni elemento interattivo della scena (carte, calendario, taccuino):

```
oggetto (stato riposo)
   → click/focus
   → oggetto in primo piano + leggero movimento camera
   → tavolo visibile sullo sfondo, sfocato
   → contenuto mostrato (pannello leggibile, non "pagina")
   → chiusura
   → ritorno alla scena precedente (stessa posizione camera)
```

Non tutti gli oggetti sono interattivi: gli elementi decorativi restano statici e non intercettano eventi di click/hover in modo da non generare falsi affordance.

Responsive: desktop/tablet sono il riferimento primario per la scena tavolo. Mobile richiede una composizione ridisegnata (non una versione scalata della scena desktop) che preservi atmosfera, gerarchia, carte e transizioni.

## 8. Information Architecture

```
Home (Tavolo)
├── Carte Specialità → Catalogo → Carta → [Ufficiale | Progresso | Obiettivi | Note | Maestro]
├── Carte Competenza → stesso pattern
├── Tappa → [Contenuto | Progresso | Obiettivi | Collegamenti | Note]
├── Calendario → Uscite/Campi/Eventi
├── Taccuino → Note personali trasversali
└── (accesso separato, non sul tavolo) Profilo/Impostazioni, Reparto, Ricerca Maestri, Archivio
```

Non ogni superficie deve necessariamente vivere "sul tavolo": Reparto, ricerca Maestri e Archivio sono contenuti più ampi che possono avere un punto di accesso dal tavolo (es. un oggetto specifico) ma una propria navigazione interna una volta aperti.

## 9. Frontend Architecture

- **Framework**: Next.js (App Router), TypeScript strict — [DEC-001](../.claude/DECISIONS.md#dec-001--stack-frontend-react--nextjs-su-vercel).
- **Confine 3D/2D**: la scena tavolo (R3F) vive in Client Component isolate; i pannelli di contenuto (dettaglio carta, form note, impostazioni) sono componenti React DOM standard, sovrapposti/instradati dalla scena ma indipendenti da essa.
- **Superfici di contenuto**: il pannello (`components/panel/ObjectPanel.tsx`) è solo l'involucro — apertura, chiusura, intestazione, ritorno del focus. Cosa contiene lo decide un registro `kind → componente` in `components/panel/surfaces/`, con la larghezza del foglio dichiarata per superficie ([DEC-019](../.claude/DECISIONS.md#dec-019--ogni-funzionalità-è-un-oggetto-del-tavolo-le-rotte-restano-come-deep-link)). Aggiungere un oggetto al tavolo è aggiungere una riga al registro.
- **Rotte**: le rotte omonime delle superfici (`/reparto`, `/impostazioni`, `/specialita`, `/competenze`, `/tappe`, `/onboarding-reparto`) sono deep-link: renderizzano il tavolo con l'oggetto già a fuoco, non pagine.
- **Data fetching**: la Home carica lato server solo ciò che serve a disegnare il tavolo (`getTableContext`: carte del percorso attivo, prossimi eventi, appartenenza a un Reparto). I dati di una superficie arrivano quando l'oggetto viene aperto, tramite Server Action di sola lettura in `app/actions/surfaces.ts` e l'hook `lib/scene/useSurfaceData.ts` — [DEC-021](../.claude/DECISIONS.md#dec-021--caricamento-dei-dati-per-superficie-su-richiesta). Nessun identificativo utente arriva dal client: l'identità è quella della sessione, l'autorizzazione resta la RLS.
- **Componenti**: piccoli, focalizzati, senza duplicazione di logica tra Specialità/Competenze (che condividono lo stesso paradigma — vedi §4.3).

## 10. 3D Architecture

- **Libreria**: React Three Fiber su Three.js — [DEC-003](../.claude/DECISIONS.md#dec-003--3d-threejs--react-three-fiber-uso-selettivo).
- **Modelli riutilizzabili**: un solo modello geometria "carta", texture diverse per ogni Specialità/Competenza/Tappa (vincolo esplicito, vedi `CLAUDE.md` root). Le geometrie sono singleton esportate da `components/three/geometry.ts`; un test verifica che nessun altro file della scena crei geometrie proprie. Le lastre appoggiate sul piano (carte, taccuino, calendario, foglio, piano stesso) sono estrusioni con angoli raccordati e spigolo smussato: uno spigolo vivo non esiste in natura ed è la smussatura a raccogliere la luce che dà spessore all'oggetto.
- **Ingombri**: `OBJECT_SIZE` in `geometry.ts` è la fonte unica delle misure di ogni famiglia di oggetti; da lì derivano la quota di appoggio (`restingHeight`) e il volume di presa (`hitScale`), senza costanti da tenere allineate a mano.
- **Texture**: procedurali (`CanvasTexture` generata dai token materiali di `app/globals.css`), memoizzate a livello di modulo in `components/three/materials/textures.ts`. Oltre al colore, ogni materiale ha rilievo e finitura: le mappe di normali sono derivate da una mappa di altezza disegnata **dallo stesso** tracciato del colore (la venatura del legno è lo stesso solco nelle due mappe), e occlusione/rugosità/metallicità stanno in un'unica texture impacchettata come nel formato glTF. Le carte reali della pipeline P3-T02b sostituiscono solo la `map`.
- **Materiali**: dichiarati per materiale, non per aspetto, in `components/three/materials/Surfaces.tsx` — legno verniciato, carta, tela, ottone. Un oggetto dichiara di che cosa è fatto; rilievo, rugosità e modo di riflettere arrivano con il materiale.
- **Illuminazione** — [DEC-020](../.claude/DECISIONS.md#dec-020--resa-realistica-pbr-in-tempo-reale-ambiente-procedurale-ombre-morbide--niente-path-tracing): ambiente procedurale (`Environment` + `Lightformer` di drei, nessun file HDRI) cotto una volta in cubemap; lampada a gas come luce calda dominante con decadimento fisico; finestra fredda come riempimento e sorgente dell'ombra principale; ombre morbide ad area (PCSS) sul livello di qualità alto. Nessun path tracing: la BVH andrebbe ricostruita ad ogni hover e l'immagine sarebbe rumorosa proprio durante l'interazione.
- **Livelli di qualità**: `alto` e `base`, scelti a runtime in `lib/scene/useSceneCapabilities.ts` (`?q=alto` / `?q=base` per forzarli in verifica). Cambiano risoluzione delle mappe d'ombra, `dpr`, ombre morbide e ombre della lampada — mai il contenuto della scena.
- **Render loop**: `frameloop="demand"`; le animazioni richiedono i frame con `invalidate()` e smettono appena il movimento è esaurito. Con `?perf=1` il loop resta continuo per misurare il frame rate.
- **Quale resa dove**: la scena 3D è per desktop/tablet con WebGL; mobile, assenza di WebGL e `prefers-reduced-motion` usano la composizione 2D DOM — [DEC-013](../.claude/DECISIONS.md#dec-013--scena-3d-su-desktoptablet-composizione-2d-dedicata-altrove).
- **Nessun post-processing**: blur e scurimento del tavolo aperto un oggetto vivono sul layer DOM — [DEC-014](../.claude/DECISIONS.md#dec-014--niente-post-processing-sfocatura-e-scurimento-sul-layer-dom).
- **Camera**: movimento limitato e prevedibile (focus su oggetto), non una camera libera esplorabile stile videogioco.

**Performance budget** (picco misurato in sviluppo dalla sonda `components/three/PerfHud.tsx`, soglie in `tests/e2e/budget.ts`, verificate sia sulla sandbox sia sul tavolo autenticato):

| Metrica                           | Soglia            | Misura attuale (tavolo completo, livello alto) |
| --------------------------------- | ----------------- | ----------------------------------- |
| Draw calls                        | ≤ 60              | 34                                  |
| Triangoli                         | ≤ 20 000          | 4 984                               |
| Memoria texture stimata           | ≤ 24 MB           | 16,9 MB                             |
| Luci che proiettano ombra (alto)  | 2 (2048 + 1024)   | 2                                   |
| Luci che proiettano ombra (base)  | 1 (1024)          | 1                                   |
| Post-processing                   | nessuno           | nessuno                             |
| Frame rate desktop di riferimento | 60 fps            | da confermare su GPU reale          |
| Frame rate mobile (P10-T03)       | ≥ 30 fps          | non ancora misurato                 |

Le soglie sono state alzate rispetto alla Fase 2 con [DEC-020](../.claude/DECISIONS.md#dec-020--resa-realistica-pbr-in-tempo-reale-ambiente-procedurale-ombre-morbide--niente-path-tracing): i bordi smussati costano triangoli, le mappe PBR costano memoria, la lampada costa una seconda mappa d'ombra. Il margine tiene conto degli oggetti che il tavolo deve ancora accogliere.

La sonda registra il **picco** e non l'ultimo frame: con `frameloop="demand"` l'ultimo frame disegnato può essere un passaggio ausiliario (la cottura dell'ambiente) i cui contatori non descrivono la scena.

I frame rate non sono misurabili nell'ambiente di sviluppo headless usato finora (WebGL software SwiftShader): restano da verificare su hardware reale in P10-T03.

## 11. Asset Pipeline

```
assets/source/      ← PDF/scansioni ufficiali originali, mai modificati
assets/processed/   ← output della pipeline (WebP/PNG ottimizzati)
[runtime]           ← serviti da Supabase Storage o bundle statico, secondo dimensione
```

Pipeline: PDF originale → estrazione → processing → WebP/PNG → texture/viewer.

**Stato attuale**: 3 PDF sorgente sono disponibili in `files/` alla radice del repository (`Carta di Specialità.pdf`, `CARTA DI COMPETENZA.pdf`, `Manuale-della-Branca-EG.pdf`), non ancora spostati nella struttura `assets/source/` prevista. Lo strumento di estrazione (es. `pdf.js`, `pdf-lib`, processo manuale) resta un **Open Decision** ([DEC-005](../.claude/DECISIONS.md#dec-005--asset-pipeline-pdf--texture-web)) da chiudere ispezionando il contenuto reale di questi file, in Fase 0/3 del piano. Verificare sempre licenza/attribuzione prima di processare materiale non palesemente di proprietà del Reparto/utente.

## 12. Backend Architecture

Supabase come backend unico:

```
Next.js (Vercel)
   ├── Server Components / Route Handlers → Supabase (service context solo server-side, mai esposto al client)
   └── Client → Supabase client con anon key + RLS (accesso diretto autorizzato per-utente dove appropriato)
```

Nessuna API custom intermedia prevista salvo logica di dominio che non può vivere in RLS/Postgres (es. ricerca Maestri con filtri complessi) — da valutare come Route Handler Next.js o Supabase Edge Function in fase di implementazione.

## 13. Database Architecture

Principio guida: **nessuna duplicazione di contenuto ufficiale per utente**; il progresso personale è sempre una relazione separata.

Entità principali (dettaglio concettuale in [`docs/DATA_MODEL.md`](DATA_MODEL.md)):

**Identità/organizzazione**

- `profile` (1:1 con `auth.users`)
- `reparto`
- `squadriglia` (FK `reparto_id`)

**Contenuto ufficiale** (letto da tutti gli utenti autorizzati, scritto solo da processo/ruolo amministrativo)

- `specialita`
- `competenza`
- `tappa`

**Percorso personale** (FK verso `profile` + verso il contenuto ufficiale)

- `user_specialita` (stato, progresso, obiettivi completati, data inizio/completamento, maestro, note — o note in tabella separata, vedi sotto)
- `user_competenza`
- `user_tappa`

**Note**

- `nota` — possibile tabella dedicata invece di colonna, per supportare note multiple per Specialità/Competenza/Tappa nel tempo (decisione di dettaglio in fase di schema, Fase 3 del piano).

**Maestri**

- `maestro_esterno` (FK `profile_id` del proprietario, nessun collegamento a `auth.users`)
- Maestro interno: rappresentato direttamente da un riferimento a `profile_id` (nessuna tabella dedicata necessaria, salvo campi di opt-in ricerca globale — vedi FR-15)

**Attività/archivio**

- `uscita`, `campo`, `luogo`
- tabelle ponte per partecipanti/Squadriglie coinvolte
- documenti/foto: metadati in Postgres, file in Supabase Storage

Lo schema SQL dettagliato (colonne, vincoli, indici) è definito durante l'implementazione (Fase 3/6/9 del piano), non in questo documento, per evitare dettagli prematuri.

## 14. Authentication

- Supabase Auth come unico provider di identità.
- Metodo esatto (email/password vs magic link) da confermare in fase di implementazione — **Open Decision** minore, non bloccante.
- Registrazione minorenni: **chiusa**, vedi [DEC-010](../.claude/DECISIONS.md#dec-010--registrazione-minorenni-auto-registrazione-con-consenso-genitoriale-verificato). Auto-registrazione con data di nascita; sotto i 14 anni l'account resta in stato `in_attesa_consenso_genitoriale` finché un genitore/tutore non conferma tramite link univoco inviato via email. Provider email transazionale da scegliere in P5-T01 (nuova dipendenza esterna).

## 15. Authorization

- Autorizzazione sempre verificata server-side/database-side, mai solo in UI (vincolo esplicito e non negoziabile).
- Modello a due livelli: proprietà individuale (dati personali) + appartenenza a Reparto (dati condivisi con permessi).
- Ruoli: E/G (default) e Capo (`profiles.ruolo`, scoped al Reparto — fonde Capo e Admin di Reparto, [DEC-017](../.claude/DECISIONS.md#dec-017--ruolo-capo-scoped-al-reparto-fusione-con-admin-di-reparto)) mappano a policy RLS distinte, chiuso in Fase 6 del piano.

## 16. RLS Strategy

Principi:

- ogni tabella con dati personali: policy `USING (auth.uid() = owner_id)` per SELECT/UPDATE/DELETE; INSERT vincolato a `auth.uid()`.
- ogni tabella con dati di Reparto: policy che verifica appartenenza dell'utente al Reparto della riga (via `profile.reparto_id`).
- contenuto ufficiale: SELECT aperto agli utenti autenticati (o a chi ha accesso al contesto pertinente); nessuna policy INSERT/UPDATE/DELETE per alcun ruolo applicativo — le scritture avvengono solo tramite migrazioni/seed con credenziali di servizio ([DEC-008](../.claude/DECISIONS.md#dec-008--gestione-del-contenuto-ufficiale-specialit%C3%A0competenzetappe)).
- nessuna tabella sensibile senza RLS abilitata — verifica esplicita richiesta prima di ogni deploy (P10-T01 nel piano, `get_advisors` di Supabase come controllo automatico).

Le policy esatte (SQL) sono implementate insieme allo schema in Fase 3/6/9, non anticipate qui in dettaglio per evitare di fissare decisioni premature su colonne non ancora definite.

## 17. Storage

- Supabase Storage per asset processati (immagini carte) e per contenuti utente/Reparto (foto, documenti archivio).
- Bucket separati per contenuto pubblico/condiviso (es. texture carte ufficiali, se non sensibili) e contenuto privato (foto/documenti di Reparto, soggetti a RLS-equivalente via Storage policy).
- Nessun bucket pubblico per dati che includano informazioni personali o minori.

## 18. Reparto Architecture

Il Reparto è un contesto dati associato all'account, non una dashboard condivisa: ogni utente vede il Reparto attraverso il proprio account e i propri permessi, non come vista aggregata neutra. Un Reparto contiene membri, Squadriglie, Capi, uscite, campi, luoghi, documenti, archivio — tutti scoped a `reparto_id` con RLS.

Un utente appartiene, nella fase iniziale, a un solo Reparto attivo (assunzione semplificatrice; multi-Reparto per singolo utente è fuori scope salvo richiesta futura esplicita — non menzionato in nessun documento di prodotto).

**Archivio storico** (Fase 9, [DEC-023](../.claude/DECISIONS.md#dec-023--archivio-di-reparto-memoria-storica-separata-dal-calendario-metadati-in-postgres-e-file-in-bucket-privato)): `luogo`, `uscita`, `campo` scoped a `reparto_id` con join N:N a `profiles`/`squadriglia` (FK reali); `documento_archivio` per i metadati di foto e documenti (polymorphic `entita_tipo`/`entita_id`, come `nota`), con i file nel bucket privato `archivio` — percorso `{reparto_id}/{entita_tipo}/{entita_id}/{file}`, policy di Storage coerenti con la RLS di Reparto (lettura per i membri, scrittura per i Capi), nessun bucket pubblico per contenuti con minori (§17). L'archivio è separato dal calendario `evento` (§4.7): è la memoria storica, non gli eventi futuri. In UI è il **baule** sul tavolo (DEC-019), con navigazione Campo→Luogo→Partecipanti→Squadriglie→Attività→Foto→Documenti (`docs/DATA_MODEL.md`).

## 19. Maestro Architecture

Due categorie distinte, non unificate in un'unica tabella "persona astratta" per evitare over-engineering prematuro:

- **Maestro interno**: riferimento a un `profile_id` esistente. Compare in ricerca globale solo se ha attivato esplicitamente la visibilità (opt-in, coerente con `docs/PERMISSIONS.md`: "solo le informazioni che un Maestro ha scelto di rendere ricercabili").
- **Maestro esterno**: record `maestro_esterno` di proprietà esclusiva dell'utente che lo ha creato (nome, contatto, Specialità di competenza, note) — mai promosso automaticamente ad account.

La ricerca globale Maestri è concettualmente separata dalla consultazione dei profili di Reparto: interroga solo i campi esplicitamente marcati ricercabili, mai l'intero profilo.

Implementazione (Fase 8, [DEC-022](../.claude/DECISIONS.md#dec-022--ricerca-globale-maestri-tabella-dedicata-con-opt-in-esplicito-e-funzione-di-ricerca-security-definer)):

- **`maestro_profilo`** (1:1 con `profiles`): `visibile` (opt-in esplicito, FR-15, default `false`), `regione`, `zona`, `localita`, `disponibile`. I campi di visibilità **non** stanno su `profiles`: una policy SELECT estesa lì esporrebbe l'intero profilo a chi legge la tabella, non solo i campi dichiarati ricercabili. RLS: il proprietario gestisce il proprio profilo; la lettura altrui è permessa solo quando `visibile` e con consenso attivo.
- **`maestro_specialita`** (N:N verso `specialita`): le Specialità ufficiali che il Maestro dichiara di accompagnare.
- **`cerca_maestri(p_specialita_id, p_regione, p_zona, p_solo_disponibili)`** — SECURITY DEFINER, stesso pattern di `find_profile_by_email` (FR-14): un utente non può leggere `profiles` altrui via RLS, quindi la ricerca espone solo le colonne dichiarate (nome, Specialità, Regione/Zona/Località, disponibilità), esclude sé stessi e i profili in attesa di consenso (DEC-010), e filtra sempre su `visibile = true`.
- **UX**: la ricerca vive nella rubrica del tavolo (scheda "Cerca Maestri" accanto a "I miei Maestri", DEC-019); l'opt-in si gestisce dalla tessera (profilo/account). Da un risultato di ricerca si può associare il Maestro a una propria Specialità in corso.

## 20. Official Content Architecture

Specialità/Competenze/Tappe sono tabelle singole, condivise da tutti i Reparti/utenti. Non esistono copie per Reparto o per utente. Ogni riga rappresenta il contenuto AGESCI ufficiale (nome, categoria, descrizione, obiettivi ufficiali), derivato dai PDF sorgente (§11). La modifica di queste tabelle non è esposta a nessun ruolo applicativo né in RLS né in UI: avviene esclusivamente tramite seed/migrazioni gestite dal proprietario del progetto ([DEC-008](../.claude/DECISIONS.md#dec-008--gestione-del-contenuto-ufficiale-specialit%C3%A0competenzetappe)).

## 21. Personal Progress Architecture

Le tabelle `user_specialita`/`user_competenza`/`user_tappa` sono la relazione N:1 tra `profile` e contenuto ufficiale, e contengono esclusivamente dati di proprietà dell'utente: stato, progresso, obiettivi completati, date, Maestro associato, riferimento a note. Cancellare un `profile` non deve mai cancellare o alterare il contenuto ufficiale collegato (integrità referenziale unidirezionale).

## 22. Performance

- Scena 3D: modello carta riutilizzato, texture compresse (WebP), attenzione a shadow map e post-processing (vedi §10, `docs/DESIGN.md`).
- Frontend: Next.js Server Components dove possibile per ridurre JS lato client sui pannelli non-3D.
- Nessuna metrica quantitativa (fps target, bundle size budget) è ancora definita — da stabilire in Fase 1–2 come parte del prototipo visivo, non in questo documento.

## 23. Accessibility

- Componenti DOM (form, pannelli, navigazione Reparto/Archivio/Maestri) devono rispettare contrasto e navigabilità da tastiera.
- La scena 3D è un'esperienza complementare: il contenuto informativo (dati Specialità, progresso, note) deve restare accessibile anche a chi non può interagire pienamente con la scena 3D (es. tramite un percorso di navigazione alternativo ai pannelli). Dettaglio implementativo da definire in Fase 2/10.

## 24. Security

- RLS come meccanismo primario di autorizzazione dati.
- Nessuna service-role key nel client.
- Validazione input su ogni form che scrive dati (note, obiettivi, profilo, Maestro esterno).
- Nessuna assunzione di fiducia su ID utente forniti dal client: l'identità è sempre quella della sessione autenticata Supabase.
- Audit periodico con `get_advisors` (Supabase) prima di ogni release significativa.

## 25. Testing

- Type-check (`tsc --noEmit`) e lint obbligatori a ogni change significativo.
- **Vitest + Testing Library** (`npm run test`, `tests/unit/`) per unit e component test — [DEC-006](../.claude/DECISIONS.md#dec-006--testing-strategy).
- **Playwright** (`npm run test:e2e`, `tests/e2e/`) per gli end-to-end, unico ambiente in grado di esercitare la scena 3D reale.
- Gli E2E autenticati richiedono `E2E_EMAIL` e `E2E_PASSWORD` in ambiente e si saltano da soli quando mancano: nessuna credenziale nel repository.
- Test unitari per logica di dominio pura (calcolo progresso, regole di permesso) quando introdotta.
- Test RLS espliciti per ogni tabella sensibile (vedi P10-T01 nel piano).
- Test E2E per i flussi critici (login → tavolo → apertura carta → progresso → nota) prima del go-live.

## 26. Deployment

- Vercel per il frontend, con preview deployment per branch/PR.
- Supabase Cloud per il backend, migrazioni versionate applicate esplicitamente (mai modifiche manuali in produzione).
- Variabili d'ambiente (URL/anon key Supabase) configurate come environment variable Vercel, mai committate nel repository.

## 27. Observability

Nessuna soluzione di monitoring/error tracking è ancora scelta. Per il go-live (Fase 11 del piano) serve almeno: log errori applicativi lato server, alert su errori RLS/autorizzazione anomali. Strumento specifico non deciso — **Open Decision**, da valutare solo quando l'app avrà traffico reale.

## 28. Risks

| Rischio                                                                                    | Impatto                                             | Mitigazione                                                                                                |
| ------------------------------------------------------------------------------------------ | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Materiale AGESCI non liberamente riutilizzabile                                            | Blocco legale/rimozione contenuti                   | Verificare licenza/permessi prima di ogni integrazione asset (vedi §11)                                    |
| Complessità 3D che degrada performance mobile                                              | Esperienza inutilizzabile su device di fascia bassa | Budget di performance esplicito da Fase 1, test su device reali (P10-T03)                                  |
| RLS mal configurata espone dati privati (inclusi minori)                                   | Violazione privacy grave                            | Audit RLS sistematico (P10-T01, P11-T02), privacy by default                                               |
| Il concept "tavolo" degrada verso dashboard generica per pressione di velocità di sviluppo | Perdita del differenziale di prodotto               | Vincolo esplicito in `CLAUDE.md`: non sostituire il tavolo con sidebar/dashboard senza richiesta esplicita |
| Scope creep verso funzionalità social/gestionali                                           | Prodotto snatura la propria identità                | Non-goals espliciti in questo documento, da rispettare in ogni review                                      |

## 29. Open Questions

Vedi anche le Open Decision in [`.claude/DECISIONS.md`](../.claude/DECISIONS.md) (DEC-004, DEC-005, DEC-006). In sintesi:

- Gestione stato applicativo (scena 3D + dati server) — DEC-004.
- Strumento di estrazione preciso della pipeline PDF → texture, da scegliere ispezionando i 3 PDF ora disponibili in `files/` — DEC-005.
- Framework di test — DEC-006.
- Metodo di autenticazione esatto (password, magic link, OAuth) e policy su utenti minorenni.
- ~~Modello di ruolo dettagliato per Capo/Admin di Reparto (permessi granulari)~~ — chiusa in Fase 6, vedi [DEC-017](../.claude/DECISIONS.md#dec-017--ruolo-capo-scoped-al-reparto-fusione-con-admin-di-reparto). La governance del contenuto ufficiale è invece chiusa da prima, vedi [DEC-008](../.claude/DECISIONS.md#dec-008--gestione-del-contenuto-ufficiale-specialit%C3%A0competenzetappe).
- Osservabilità/error tracking in produzione.

## 30. Architecture Decisions

Vedi [`.claude/DECISIONS.md`](../.claude/DECISIONS.md) per il registro completo (DEC-001 → DEC-007).

## 31. Implementation Dependencies

```
P0 (Foundation)
 └─→ P1 (Design/Visual Prototype)
      └─→ P2 (Interactive Table)
           └─→ P3 (Specialità/Competenze/Tappe)
                ├─→ P4 (Personal Data: note, Maestri)
                └─→ P5 (Authentication) ──┐
                                          ├─→ P6 (Supabase: Reparto/ruoli)
                                          │     ├─→ P7 (Reparto)
                                          │     ├─→ P8 (Maestri: ricerca globale, dipende anche da P4)
                                          │     └─→ P9 (Calendario/Archivio)
                                          │
                                          └─→ P10 (Security/Accessibility/Performance)
                                                └─→ P11 (Production QA)
```

P0-T04 (setup Supabase) può partire in parallelo a P0-T01 (setup Next.js). I PDF sorgente per l'asset pipeline sono ora disponibili (`files/`, vedi §11); P3-T02a (migrazione/ispezione) può partire già in Fase 0, in parallelo, senza attendere il resto della Fase 3.
