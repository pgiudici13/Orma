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
- **3D**: Three.js / React Three Fiber, usato solo dove aumenta il realismo della scena tavolo/carte, non ovunque.
- **Stato**: da definire quando si passa all'implementazione (vedi Open Decision in `DECISIONS.md`).
- **Backend**: Supabase — Postgres, Supabase Auth, Supabase Storage, Row Level Security.
- **Deployment**: Vercel per il frontend/edge, Supabase Cloud per il backend.

Nessun repository di codice esiste ancora: questa è l'architettura target, non lo stato attuale (vedi §8).

## 6. Struttura del progetto (attuale)

```
Orma/
├── CLAUDE.md              # istruzioni operative per Claude Code
├── IDEA.md                # visione di prodotto originale
├── docs/
│   ├── PRODUCT.md
│   ├── UX.md
│   ├── DATA_MODEL.md
│   ├── PERMISSIONS.md
│   ├── DESIGN.md
│   └── SDD.md              # specifica tecnica (questo bootstrap)
└── .claude/
    ├── PROJECT.md           # questo file
    ├── TODO.md
    ├── DECISIONS.md
    └── CORRECTIONS.md
```

Non esiste ancora codice applicativo, `package.json`, configurazione di build, asset o schema Supabase. Il progetto è in **fase di fondazione documentale**.

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

**Stato attuale**: 3 PDF sorgente sono disponibili in `files/` alla radice del repository (`Carta di Specialità.pdf`, `CARTA DI COMPETENZA.pdf`, `Manuale-della-Branca-EG.pdf`). Non sono ancora nella struttura `assets/source/` definitiva prevista dalla pipeline; la migrazione e la scelta dello strumento di estrazione restano da fare in Fase 0/3 — vedi [DEC-005](DECISIONS.md#dec-005--asset-pipeline-pdf--texture-web).

Il popolamento e la manutenzione del catalogo ufficiale (contenuto derivato da questi PDF) restano a carico del proprietario del progetto tramite seed/migrazioni — nessun ruolo o UI di amministrazione in-app è previsto ([DEC-008](DECISIONS.md#dec-008--gestione-del-contenuto-ufficiale-specialit%C3%A0competenzetappe)).

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
- Considerare che una parte degli utenti (E/G) può essere minorenne: nessuna funzionalità di ricerca/esposizione pubblica di profili senza una strategia di privacy e consenso esplicita — vedi Open Decision.

Dettaglio: [`docs/PERMISSIONS.md`](../docs/PERMISSIONS.md), SDD §14–16.

## 12. Deployment

- Vercel per il frontend (target).
- Supabase Cloud per il backend.
- Nessuna pipeline CI/CD, nessun ambiente configurato ad oggi.

## 13. Testing

Nessuna strategia di test è stata ancora implementata (non esiste codice). Direzione attesa quando si inizierà l'implementazione: type-check + lint obbligatori ad ogni change significativo, test automatici dove il framework lo consente, verifica visiva in browser per il lavoro sulla scena 3D. Dettaglio in SDD §25.

## 14. Performance

Vincoli noti fin da ora per la scena 3D (da rispettare quando si implementa):

- texture di dimensioni contenute e riutilizzate tra carte (stesso modello 3D, texture diverse);
- niente geometria duplicata per ogni carta;
- attenzione a ombre, post-processing, render loop e GPU mobile.

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
