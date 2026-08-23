# ORMA — UX

## Esperienza principale

L'esperienza principale di ORMA è rappresentata da un tavolo scout personale.

Dopo il login l'utente non deve essere portato davanti a una dashboard tradizionale.

Deve ritrovarsi nel proprio spazio.

---

## Home — Il tavolo

La Home è una scena realistica vista dall'alto.

**Ogni funzionalità dell'app è un oggetto fisico su questo tavolo.** Nessuna
funzionalità vive in una pagina a sé: aprire il Reparto, le Squadriglie, il
catalogo delle Specialità o le proprie impostazioni significa prendere in mano
l'oggetto corrispondente. Gli indirizzi diretti (`/reparto`, `/impostazioni`, …)
continuano a funzionare, ma aprono il tavolo con quell'oggetto già in mano.

Oggetti interattivi:

| Oggetto | Cosa apre |
| --- | --- |
| carte di Specialità, Competenza, Tappa | il percorso in corso: contenuto ufficiale, progresso, note, Maestro |
| cassetta di Reparto | i membri del Reparto e, per i Capi, le richieste di adesione |
| guidone di Squadriglia | le Squadriglie e l'assegnazione dei membri |
| calendario | uscite, campi, riunioni del Reparto |
| album dei distintivi | il catalogo delle Specialità |
| quaderno | il catalogo delle Competenze |
| mappa arrotolata | le Tappe |
| rubrica | i Maestri del proprio percorso |
| tessera | il proprio profilo e l'uscita |
| busta | la richiesta di adesione a un Reparto |
| taccuino, fogli | appunti personali |

Cosa c'è sul tavolo dipende dalla situazione reale di chi guarda: chi non
appartiene ancora a un Reparto trova la busta e non trova cassetta, guidone e
calendario. Il tavolo racconta la situazione, non offre cassetti vuoti.

Non tutti gli oggetti sono interattivi: matita, bussola e lampada a gas servono
esclusivamente a creare atmosfera. La lampada è anche la sorgente di luce calda
della scena: la luce ha una causa visibile.

---

## Interazione con gli oggetti

Gli elementi interattivi devono sembrare fisicamente presenti nella scena.

### Apertura

Quando l'utente clicca un oggetto:

1. l'oggetto viene evidenziato;
2. viene portato visivamente in primo piano;
3. la visuale può effettuare un leggero movimento;
4. il tavolo rimane visibile;
5. lo sfondo viene sfocato/scurito;
6. il contenuto viene mostrato.

Non deve sembrare un cambio di pagina.

---

## Chiusura

Quando l'utente chiude un contenuto:

1. il contenuto si richiude;
2. la camera torna alla posizione precedente;
3. il blur diminuisce;
4. il tavolo torna completamente visibile.

La transizione deve essere fluida e naturale.

---

# Specialità

Le Specialità sono una delle funzionalità principali dell'app.

L'utente può:

- visualizzare le proprie Specialità;
- aprire una carta;
- leggere il contenuto ufficiale;
- vedere il progresso;
- vedere gli obiettivi;
- segnare i propri progressi;
- aggiungere/modificare note;
- vedere il Maestro associato;
- cercare un Maestro.

---

## Carta di Specialità

La carta deve mantenere il più possibile l'aspetto del materiale originale.

Il contenuto ufficiale non è modificabile.

Le informazioni personali vengono mostrate separatamente.

Esempio:

Carta ufficiale
↓
Progressi personali
↓
Note personali
↓
Maestro

---

# Competenze

Seguono lo stesso paradigma delle Specialità.

La carta/documento ufficiale rimane separato dai dati personali.

---

# Tappe

Le Tappe devono essere visualizzate nello stesso linguaggio fisico delle carte.

L'utente può:

- vedere la Tappa;
- vedere il proprio progresso;
- vedere gli obiettivi;
- aggiungere note;
- collegare elementi del proprio percorso.

---

# Calendario

Il calendario è un oggetto del tavolo e deve mantenerne il linguaggio fisico.

Può essere rappresentato come:

- calendario cartaceo;
- agenda;
- foglio.

L'apertura deve mantenere visibile il tavolo sullo sfondo.

---

# Profili

Il proprio profilo si apre dalla **tessera** sul tavolo.

Il profilo personale contiene il percorso dell'utente.

All'interno del proprio Reparto l'utente può consultare i profili degli altri membri secondo i permessi previsti.

La visualizzazione deve concentrarsi sulle informazioni scout pertinenti.

ORMA non deve diventare un social network.

---

# Maestri

I Maestri già associati al proprio percorso si consultano dalla **rubrica** sul
tavolo. Si associano dalla carta della Specialità o della Competenza a cui si
riferiscono, dove il legame ha un significato.

Un Maestro può essere:

1. un utente ORMA;
2. una persona esterna senza account ORMA.

Un Maestro esterno può essere aggiunto manualmente dall'utente.

Non deve essere necessario creare un account per una persona che viene semplicemente associata come Maestro.

---

# Reparto

Si raggiunge dalla **cassetta di Reparto** sul tavolo; le Squadriglie dal
**guidone**, il calendario dal **calendario**.

Il Reparto è un contesto dati associato all'account.

Non è una dashboard condivisa.

Ogni utente vede il Reparto attraverso il proprio account e secondo i propri permessi.

---

# Archivio

L'archivio contiene:

- uscite;
- campi;
- luoghi;
- fotografie;
- documenti;
- attività;
- memoria storica.

Deve essere consultabile senza rompere il linguaggio visivo generale dell'app.

---

# Responsive

La scena del tavolo è principalmente pensata per desktop/tablet.

Su schermi piccoli non bisogna cercare di comprimere semplicemente la scena desktop.

L'esperienza mobile deve essere riprogettata mantenendo:

- atmosfera;
- gerarchia;
- carte;
- transizioni;
- chiarezza.
