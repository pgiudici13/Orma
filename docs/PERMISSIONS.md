# ORMA — Permissions & Privacy

## Principio fondamentale

Ogni dato deve avere un proprietario e un livello di visibilità esplicito.

Non affidarsi esclusivamente alla UI per nascondere dati.

I permessi devono essere applicati anche a livello database.

---

# Account

Un utente può leggere e modificare i propri dati personali.

Non può modificare i dati personali di altri utenti.

---

# Reparto

Un utente può accedere ai dati del proprio Reparto secondo il ruolo assegnato.

Non deve poter accedere automaticamente ai dati di altri Reparti.

---

# Profili

Gli utenti dello stesso Reparto possono visualizzare solamente le informazioni consentite.

Le informazioni personali private non devono essere esposte.

---

# Specialità

Il contenuto ufficiale è leggibile dagli utenti autorizzati.

Il progresso e le note appartengono all'utente.

Un utente non può modificare il contenuto ufficiale.

---

# Maestri

La ricerca globale deve mostrare esclusivamente le informazioni che un Maestro ha scelto di rendere ricercabili.

Un Maestro esterno aggiunto manualmente appartiene solamente al relativo utente, salvo esplicita condivisione.

---

# Amministrazione

Le operazioni amministrative devono essere separate dai normali permessi degli utenti.

Mai affidarsi a un controllo frontend per proteggere dati sensibili.

---

# Supabase

Quando verrà implementato il backend:

- utilizzare Row Level Security;
- applicare policy per utente;
- applicare policy per Reparto;
- separare dati pubblici e privati;
- evitare service-role key nel client;
- non esporre dati personali tramite API pubbliche non protette.

---

# Privacy by default

Quando non è chiaro se un dato debba essere pubblico:

> considerarlo privato.

La condivisione deve essere una scelta esplicita.