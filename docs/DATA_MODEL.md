# ORMA — Data Model

## Principio

Il database deve distinguere chiaramente:

- identità;
- organizzazione scout;
- contenuti ufficiali;
- percorso personale;
- dati storici;
- contatti esterni.

---

# Entità principali

## User

Account autenticato.

Contiene il riferimento al profilo applicativo.

---

## Profile

Informazioni personali/scout dell'utente.

Relazioni:

- User
- Reparto
- Squadriglia
- Specialità personali
- Competenze personali
- Tappa
- note

---

## Reparto

Rappresenta un Reparto.

Può avere:

- membri;
- Squadriglie;
- Capi;
- uscite;
- campi;
- luoghi;
- documenti.

---

## Squadriglia

Appartiene a un Reparto.

Ha membri appartenenti allo stesso Reparto.

---

# Contenuti ufficiali

## Specialità

Contenuto ufficiale.

Non contiene direttamente il progresso di un utente.

---

## Competenza

Contenuto ufficiale.

Non contiene direttamente il progresso di un utente.

---

## Tappa

Contenuto ufficiale/metodologico.

---

# Percorso personale

## UserSpecialità

Collega un utente a una Specialità.

Può contenere:

- stato;
- progresso;
- obiettivi completati;
- data di inizio;
- data di completamento;
- Maestro;
- note.

---

## UserCompetenza

Collega un utente a una Competenza.

Può contenere:

- stato;
- progresso;
- obiettivi completati;
- note;
- Maestro.

---

## UserTappa

Rappresenta il percorso personale dell'utente rispetto alle Tappe.

---

## Note

Le note personali appartengono esclusivamente all'utente che le ha create, salvo eventuali funzionalità esplicite di condivisione.

---

# Maestri

## Maestro interno

Un Maestro che possiede un account ORMA.

Può essere associato direttamente al percorso dell'utente.

## Maestro esterno

Persona senza account ORMA.

Può essere salvata come contatto associato all'utente.

Non deve diventare automaticamente un account.

---

# Attività

## Uscita

Appartiene a un Reparto.

Può essere collegata a:

- partecipanti;
- Squadriglie;
- luogo;
- documenti;
- fotografie.

---

## Campo

Simile a un'uscita ma rappresenta un evento più ampio e storico.

---

## Luogo

Può essere collegato a più uscite e campi.

---

# Archivio

Le entità storiche devono poter essere collegate tra loro.

Esempio:

Campo
→ Luogo
→ Partecipanti
→ Squadriglie
→ Attività
→ Foto
→ Documenti

---

# Regola importante

Non duplicare i contenuti ufficiali per ogni utente.

Una Specialità ufficiale deve esistere una volta nel database.

Il progresso personale deve essere rappresentato da una relazione separata.

Stesso principio per Competenze e Tappe.