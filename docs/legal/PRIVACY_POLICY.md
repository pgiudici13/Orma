# ORMA — Informativa Privacy

> ⚠️ **Bozza tecnica, non consulenza legale.** Questo documento è una base ragionevole per un progetto personale a uso limitato, redatta seguendo la struttura richiesta dall'Art. 13 GDPR e dal Codice Privacy italiano (D.Lgs. 196/2003 come modificato dal D.Lgs. 101/2018). Prima di un utilizzo con dati reali di minori su scala più ampia di un singolo Reparto conosciuto, fai rivedere questo testo da un professionista (legale o DPO). I campi tra `[ ]` vanno completati prima della pubblicazione.

Ultimo aggiornamento: 2026-08-10 — versione `1.0`.

---

## 1. Titolare del trattamento

Pietro, contattabile all'indirizzo email dev@foggy.day.

ORMA è un progetto personale, non gestito da una società o associazione. Il Titolare tratta i dati nella sua qualità di persona fisica che offre il servizio agli utenti descritti in questa informativa.

## 2. Quali dati raccoliamo

| Categoria | Esempi | Perché |
|---|---|---|
| Dati di account | email, password (cifrata), data di nascita | creazione e sicurezza dell'account |
| Dati di profilo scout | nome, Reparto, Squadriglia, ruolo | funzionamento del servizio (percorso scout personale) |
| Percorso personale | progressi su Specialità/Competenze/Tappe, obiettivi, note personali | finalità stessa del servizio |
| Dati di Maestri esterni | nome, contatto (se inseriti da un utente) | associazione volontaria di un Maestro al proprio percorso |
| Dati tecnici minimi | log di accesso, indirizzo IP a fini di sicurezza | sicurezza del servizio, prevenzione abusi |

Non raccogliamo dati non necessari al funzionamento del servizio (minimizzazione, Art. 5.1.c GDPR).

## 3. Base giuridica del trattamento

- **Consenso** (Art. 6.1.a GDPR) per la creazione dell'account e l'uso del servizio.
- Per gli utenti **minori di 14 anni**, il consenso è integrato da quello di chi esercita la responsabilità genitoriale, come richiesto dall'Art. 2-quinquies del Codice Privacy italiano e dall'Art. 8 GDPR — vedi §5.
- **Legittimo interesse** (Art. 6.1.f GDPR) limitatamente ai log tecnici necessari a garantire la sicurezza del servizio.

## 4. Come vengono trattati i dati

- Il contenuto ufficiale (Specialità, Competenze, Tappe) è distinto dai dati personali: l'utente non modifica mai il contenuto ufficiale, solo il proprio progresso personale.
- I dati sono privati per impostazione predefinita; nulla è reso visibile ad altri utenti o pubblicamente senza un'azione esplicita dell'utente.
- L'accesso ai dati è protetto a livello di database (Row Level Security), non solo lato interfaccia: nessun utente può leggere o scrivere dati che non gli appartengono, salvo le condivisioni esplicite previste dal servizio (es. visibilità limitata ai membri del proprio Reparto, secondo ruolo).

## 5. Utenti minorenni e consenso genitoriale

Parte degli utenti di ORMA (Esploratori/Guide) può essere minorenne. Il servizio distingue due casi:

- **14 anni o più**: l'utente può registrarsi autonomamente, prestando personalmente il consenso al trattamento dei propri dati in fase di registrazione.
- **Meno di 14 anni**: la registrazione richiede l'indicazione dell'email di un genitore o tutore. L'account resta inattivo (nessun dato personale è trattato oltre al minimo necessario per l'attesa) finché il genitore/tutore non conferma il consenso tramite un link univoco ricevuto via email — vedi [`CONSENSO_GENITORIALE.md`](CONSENSO_GENITORIALE.md).
- Il genitore/tutore può in qualsiasi momento revocare il consenso, chiedendo la cancellazione dell'account del minore tramite i contatti indicati al §9.

## 6. Con chi condividiamo i dati

I dati sono trattati tramite i seguenti fornitori (sub-responsabili del trattamento, Art. 28 GDPR), scelti perché offrono garanzie GDPR e infrastruttura nell'Unione Europea:

| Fornitore | Ruolo | Localizzazione dati |
|---|---|---|
| Supabase | Database, autenticazione, storage file | Regione `eu-central-1` (Francoforte, UE) |
| Vercel | Hosting dell'applicazione web | Rete globale con opzioni di residenza EU per le funzioni edge; verificare configurazione region |
| Resend | Invio dell'email di richiesta consenso genitoriale | Vedi [DEC-011](../../.claude/DECISIONS.md#dec-011--provider-email-transazionale-resend) per la scelta del fornitore |

Non vendiamo né condividiamo dati con terzi per finalità pubblicitarie o di profilazione.

## 7. Trasferimento dati extra-UE

Se uno dei fornitori sopra elencati trattasse dati fuori dallo Spazio Economico Europeo, ciò avviene solo nell'ambito di garanzie adeguate previste dal fornitore stesso (es. Clausole Contrattuali Standard). Ad oggi il progetto Supabase è configurato in regione UE.

## 8. Conservazione dei dati

I dati sono conservati per la durata dell'account. Alla cancellazione dell'account (richiesta dall'utente o dal genitore/tutore per un minore), i dati personali sono cancellati o resi anonimi entro un tempo ragionevole, salvo obblighi di legge che richiedano una conservazione più lunga.

## 9. Diritti dell'interessato

In qualsiasi momento è possibile richiedere, scrivendo a dev@foggy.day:

- accesso ai propri dati (Art. 15 GDPR);
- rettifica di dati inesatti (Art. 16);
- cancellazione ("diritto all'oblio", Art. 17);
- limitazione del trattamento (Art. 18);
- portabilità dei dati (Art. 20);
- opposizione al trattamento (Art. 21);
- revoca del consenso in qualsiasi momento, senza pregiudicare la liceità del trattamento precedente alla revoca.

È inoltre possibile proporre reclamo al Garante per la Protezione dei Dati Personali (www.garanteprivacy.it).

## 10. Sicurezza

Adottiamo misure tecniche adeguate: cifratura delle comunicazioni (HTTPS), autorizzazione verificata a livello di database (RLS) e non solo lato interfaccia, nessuna esposizione di credenziali con privilegi elevati al client.

## 11. Modifiche a questa informativa

Eventuali modifiche sostanziali saranno comunicate agli utenti attivi e, per gli utenti minori di 14 anni, potranno richiedere un nuovo consenso genitoriale se cambiano in modo rilevante le finalità del trattamento. La versione accettata da ciascun utente è registrata (`privacy_policy_versione`).
