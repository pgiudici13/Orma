# ORMA — Consenso genitoriale per utenti minori di 14 anni

> ⚠️ **Bozza tecnica, non consulenza legale.** Testo di riferimento per (a) l'email inviata al genitore/tutore e (b) la pagina che apre cliccando il link di conferma. I campi tra `[ ]` vanno completati/collegati all'implementazione (P5-T01b in `TODO.md`).

---

## A. Email inviata al genitore/tutore

**Oggetto:** Richiesta di consenso — account ORMA per `[nome del minore]`

Gentile genitore/tutore,

`[nome del minore]` ha richiesto la creazione di un account su **ORMA**, un'applicazione personale che aiuta Esploratori e Guide AGESCI a seguire il proprio percorso di Specialità, Competenze e Tappe.

Poiché `[nome del minore]` ha meno di 14 anni, la legge italiana (Codice Privacy, come modificato dal D.Lgs. 101/2018) richiede il Suo consenso, in qualità di chi esercita la responsabilità genitoriale, prima che l'account possa essere attivato e prima che qualsiasi dato personale del minore venga trattato.

**Quali dati saranno trattati**, se conferma: email, data di nascita, nome, Reparto/Squadriglia di appartenenza, progressi personali su Specialità/Competenze/Tappe, note personali inserite dal minore stesso. Nessun dato è reso pubblico o condiviso al di fuori del Reparto senza un'azione esplicita. Il dettaglio completo è nell'[Informativa Privacy](PRIVACY_POLICY.md).

Se acconsente, clicchi sul link qui sotto. Il link è valido 7 giorni e utilizzabile una sola volta.

**[Conferma il consenso e attiva l'account →]** `[link univoco con token]`

Se non riconosce questa richiesta, o non desidera prestare il consenso, non deve fare nulla: l'account resterà inattivo. Il link scade dopo 7 giorni; l'eliminazione automatica degli account mai confermati non è ancora implementata (nessun job schedulato — vedi `.claude/TODO.md`).

Per qualsiasi domanda può scrivere a dev@foggy.day.

---

## B. Pagina di conferma (dopo il click)

**Titolo:** Consenso al trattamento dei dati di `[nome del minore]`

Prima di confermare, la invitiamo a leggere:

- l'[Informativa Privacy](PRIVACY_POLICY.md) completa;
- il riepilogo dei dati trattati (sezione A sopra).

**Dichiarazione richiesta** (checkbox non pre-selezionata, obbligatoria per procedere):

> ☐ Dichiaro di essere il genitore, o di esercitare la responsabilità genitoriale/tutela, nei confronti di `[nome del minore]`, e acconsento al trattamento dei suoi dati personali per l'utilizzo di ORMA secondo l'Informativa Privacy sopra indicata.

**[Confermo il consenso]** — pulsante attivo solo con checkbox selezionata.

Dopo la conferma:

- viene registrato `consenso_genitoriale_confermato_at` (timestamp) e la versione dell'Informativa Privacy accettata;
- l'account del minore passa da `in_attesa_consenso_genitoriale` a `confermato` e diventa utilizzabile;
- il genitore/tutore riceve una email di conferma con le istruzioni per revocare il consenso in futuro, se lo desidera.

---

## C. Revoca del consenso

Il genitore/tutore può in qualsiasi momento richiedere la cancellazione dell'account e dei dati del minore scrivendo a dev@foggy.day. Alla revoca, l'account viene disattivato e i dati cancellati secondo quanto descritto nell'Informativa Privacy (§8).
