# ORMA — Idea

> Una web app personale per Esploratori e Guide, costruita attorno al proprio percorso scout.

## Visione

**ORMA** è una web app pensata principalmente per Esploratori e Guide del Reparto.

Non vuole essere un semplice gestionale, né una classica dashboard con tabelle e menu.

L'idea è creare un'esperienza **personale, immersiva e realistica**, nella quale ogni utente, dopo aver effettuato l'accesso, si ritrova davanti al proprio **tavolo da Reparto**.

Il tavolo rappresenta il suo spazio personale.

Su di esso sono presenti carte, documenti, calendario e oggetti legati al suo percorso scout.

L'interfaccia deve cercare di essere il più possibile vicina alla realtà, utilizzando quando possibile **materiali, grafiche e riferimenti ufficiali AGESCI**, nel rispetto dei relativi diritti di utilizzo.

---

# Il concetto del tavolo

La Home non deve sembrare una dashboard tradizionale.

Deve sembrare una **scena reale vista dall'alto**:

* tavolo
* luce naturale o artificiale
* carte
* fogli
* calendario
* taccuino
* matita
* piccoli oggetti scout
* altri elementi ambientali

Non tutto deve essere interattivo.

Gli oggetti puramente decorativi servono a rendere la scena realistica.

Solo gli elementi importanti diventano interattivi.

### Elementi principali

* Carte di Specialità
* Carte di Competenza
* Tappe
* Calendario
* Profilo/taccuino personale
* eventuali documenti o elementi del Reparto

---

# Interazione

L'esperienza deve essere principalmente **2D/3D immersiva**, non un videogioco.

Quando l'utente seleziona un elemento:

1. l'elemento viene portato in primo piano;
2. la visuale può effettuare un leggero zoom;
3. il tavolo rimane sullo sfondo;
4. lo sfondo viene sfocato tramite profondità di campo;
5. il contenuto viene mostrato in modo leggibile;
6. chiudendo il contenuto si ritorna alla stessa scena iniziale.

L'utente deve avere sempre la sensazione di trovarsi **nel proprio spazio personale**.

---

# Carte di Specialità

Le carte di Specialità sono il **cuore dell'app**.

Le Specialità ufficiali devono essere rappresentate utilizzando, quando possibile, il materiale ufficiale o una rappresentazione fedele dello stesso.

Il contenuto ufficiale della carta non deve essere modificabile dall'utente.

L'utente può invece aggiungere informazioni personali.

### Ogni carta può contenere

* nome
* categoria
* descrizione ufficiale
* requisiti/obiettivi
* stato di avanzamento
* completamento degli obiettivi
* note personali
* eventuali contenuti personali collegati

### Note personali

Le note appartengono all'utente e non modificano la carta ufficiale.

Esempio:

> "Devo completare questa parte durante la prossima uscita."

Le note devono essere facilmente modificabili.

---

# Carte di Competenza

Le Competenze seguono lo stesso principio delle Specialità.

Il contenuto ufficiale rimane separato dai dati personali dell'utente.

L'utente può:

* seguire il proprio progresso;
* segnare gli obiettivi completati;
* aggiungere note;
* consultare le informazioni ufficiali;
* eventualmente collegare attività o esperienze personali.

---

# Tappe

Le Tappe rappresentano il percorso personale dell'E/G.

Devono essere visualizzate in modo molto più immersivo rispetto a una normale progress bar.

Possibili elementi:

* carta/documento della Tappa;
* stato attuale;
* progresso;
* obiettivi;
* collegamenti con Specialità e Competenze;
* note personali.

La rappresentazione deve mantenere il linguaggio visivo del resto dell'app.

---

# Creazione e modifica

L'utente non crea nuove versioni delle Specialità o delle Competenze ufficiali.

Può invece creare e modificare:

* note personali;
* obiettivi personali eventualmente previsti dall'app;
* organizzazione personale;
* contenuti personali collegati al proprio percorso.

La fonte ufficiale deve rimanere distinguibile dai contenuti dell'utente.

---

# Calendario

Ogni utente deve poter vedere il calendario delle attività a cui ha accesso.

Il calendario deve essere coerente con la metafora del tavolo.

Non deve sembrare necessariamente Google Calendar.

Può essere rappresentato come:

* calendario cartaceo;
* foglio appoggiato sul tavolo;
* agenda;
* calendario da campo.

Le attività possono contenere:

* nome
* data
* orario
* luogo
* descrizione
* partecipanti
* materiale necessario
* documenti
* note

---

# Sistema di Reparto

ORMA deve avere un sistema di account.

Ogni account appartiene a un determinato contesto di Reparto.

Il database può contenere informazioni relative a diversi Reparti.

Le informazioni devono essere accessibili in base ai permessi dell'account.

## Informazioni del Reparto

Il sistema può contenere:

* persone
* Esploratori e Guide
* Capi
* Squadriglie
* uscite
* campi
* luoghi
* attività
* documenti
* fotografie
* archivio storico

Questi dati costituiscono il **database del Reparto**, ma l'esperienza dell'utente rimane individuale.

---

# Profili

Ogni utente possiede un profilo personale.

All'interno del proprio Reparto può essere possibile consultare i profili degli altri membri, secondo i permessi stabiliti.

Le informazioni visualizzabili possono includere:

* nome
* Squadriglia
* Specialità
* Competenze
* Tappe
* eventuali informazioni scout pertinenti

Le informazioni private non devono essere esposte agli altri utenti.

---

# Maestri di Specialità

Deve esistere una funzione globale per trovare i **Maestri di Specialità**.

Questa ricerca è diversa dalla consultazione dei profili del Reparto.

Un utente può cercare una Specialità e trovare Maestri disponibili anche al di fuori del proprio Reparto.

La ricerca deve mostrare solamente le informazioni necessarie alla funzione, evitando di trasformare il sistema in un social network pubblico.

Possibili filtri:

* Specialità
* Regione
* Zona
* località
* eventuale disponibilità

---

# Uscite

Ogni Reparto può avere uno storico delle proprie uscite.

Un'uscita può contenere:

* nome
* data
* luogo
* partecipanti
* Squadriglie
* programma
* materiale
* fotografie
* documenti
* note

Le uscite possono essere collegate alle persone, ai luoghi e alle attività.

---

# Campi

I campi rappresentano un elemento importante dell'archivio del Reparto.

Un campo può contenere:

* nome
* anno
* luogo
* date
* partecipanti
* Squadriglie
* attività
* fotografie
* documenti
* materiale
* note

Nel tempo il sistema può costruire una **storia digitale del Reparto**.

---

# Luoghi

I luoghi visitati dal Reparto possono essere archiviati.

Un luogo può essere collegato a:

* uscite
* campi
* fotografie
* note
* informazioni utili
* posizione geografica

Questo permette di costruire nel tempo una sorta di **mappa della storia del Reparto**.

---

# Archivio

L'archivio raccoglie la memoria del Reparto:

* vecchie uscite
* campi
* fotografie
* luoghi
* documenti
* attività
* altri contenuti storici

L'obiettivo non è creare semplicemente un database, ma conservare la **storia del Reparto** in modo navigabile.

---

# Dati ufficiali

Quando possibile, ORMA deve utilizzare informazioni provenienti da fonti ufficiali AGESCI.

In particolare possono essere rilevanti:

* Specialità
* Competenze
* Tappe
* informazioni sui Gruppi/Reparti
* eventuali informazioni pubbliche utili

Prima di utilizzare, copiare, modificare o redistribuire materiale ufficiale devono essere verificati:

* disponibilità dei dati;
* eventuali API;
* condizioni d'uso;
* copyright;
* marchi;
* permessi di utilizzo.

Non assumere che un contenuto pubblicato online sia automaticamente riutilizzabile.

---

# Filosofia del design

ORMA deve essere:

* **realistico**
* **immersivo**
* **personale**
* **elegante**
* **semplice**
* **molto curato nelle animazioni**
* **coerente con il mondo scout**
* **vicino ai materiali reali**

Da evitare:

* dashboard aziendale;
* UI piena di card generiche;
* estetica "AI-generated";
* gamification eccessiva;
* interazioni inutili;
* elementi 3D messi solo per mostrare tecnologia;
* animazioni esagerate;
* trasformare l'app in un social network.

Il 3D deve servire a rendere **più reale l'esperienza**, non a dimostrare che il sito usa il 3D.

---

# Principio fondamentale

> **Il tavolo è l'interfaccia. Le carte sono il contenuto. Il Reparto è il contesto. L'account è la persona.**

ORMA deve far sentire l'utente come se stesse aprendo il proprio spazio scout, non come se stesse aprendo un gestionale.

---

# Direzione tecnica iniziale

La direzione prevista è:

* **Frontend / deployment:** Vercel
* **Database:** Supabase
* **Authentication:** Supabase Auth
* **Storage:** Supabase Storage
* **Database:** PostgreSQL tramite Supabase
* **Frontend:** React / Next.js
* **3D:** Three.js / React Three Fiber
* **Animazioni:** libreria adatta al progetto, mantenendo le animazioni fluide e naturali

La scelta definitiva dello stack deve essere valutata durante la progettazione tecnica e non deve essere considerata vincolante solo perché indicata in questo documento.

---

# Stato del progetto

**Fase:** brainstorming / concept

Questo documento descrive la visione iniziale di ORMA.

Non è ancora una specifica tecnica definitiva.

Prima di implementare funzionalità importanti dovranno essere definiti:

* modello dei dati;
* sistema account e ruoli;
* permessi e privacy;
* fonti ufficiali;
* modalità di acquisizione dei dati AGESCI;
* struttura delle Specialità e Competenze;
* struttura dei Reparti;
* asset grafici e 3D;
* design system;
* esperienza mobile;
* architettura frontend/backend.

**Priorità assoluta:** preservare l'idea originale dell'esperienza e non sacrificare il concept del tavolo per trasformare ORMA in un normale gestionale.
