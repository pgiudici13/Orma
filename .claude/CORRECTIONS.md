# ORMA — Corrections

Registro di errori, assunzioni errate, bug importanti e lezioni specifiche del progetto.

## Rules

- aggiungere una correzione quando può prevenire un errore futuro;
- essere brevi e concreti;
- non usarlo come changelog;
- leggere le correzioni rilevanti prima di ripetere lavori simili.

## Corrections

### `next dev` riscrive `CLAUDE.md` (feature "agentRules")

Next.js 16 aggiunge automaticamente un blocco `<!-- BEGIN:nextjs-agent-rules -->...<!-- END -->` in fondo a `CLAUDE.md` ad ogni `next dev`/`next build`, sovrascrivendo le istruzioni operative del progetto. Disabilitato impostando `agentRules: false` in `next.config.ts` (vedi commit di bootstrap Fase 0). Verificare che resti disattivato dopo ogni upgrade di Next.js.

### `prettier --write .` riformatta anche i documenti di prodotto

Il primo giro di `prettier --write .` (P0-T02) ha riscritto `IDEA.md` e parte di `docs/*.md` (wrapping del testo), non solo il codice. I documenti di prodotto sono prosa curata a mano, non vanno passati al formatter. `docs/`, `IDEA.md`, `CLAUDE.md`, `.claude/` sono ora in `.prettierignore`.

### Il dominio di produzione Vercel documentato era diventato stale

`.claude/PROJECT.md` riportava `https://orma-topaz.vercel.app` (dal bootstrap Fase 0), ma il dominio reale al momento di P5-T01b era `https://orma-scout.vercel.app` — probabilmente rinominato/riassegnato da Vercel dopo il bootstrap. `NEXT_PUBLIC_SITE_URL` era stato impostato inizialmente con il valore stale, generando link di conferma consenso genitoriale con dominio sbagliato. Scoperto solo verificando con `vercel inspect <deployment>` invece di fidarsi della documentazione. Prima di usare un dominio di produzione per costruire URL (email, redirect), verificarlo con `vercel inspect` o dal dashboard, non assumerlo da `PROJECT.md`.

### Il Browser pane tiene la pagina `hidden`: React Three Fiber non può renderizzare

Durante la verifica di P2-T01 la scena 3D risultava nera con 0 draw calls, senza errori in console. Causa: nel Browser pane la pagina ha `document.visibilityState === "hidden"`, quindi `requestAnimationFrame` non viene mai eseguito; R3F non arriva nemmeno a configurare il renderer (il canvas resta 300×150) e `useFrame` non gira. Non è un bug del codice. Per verificare visivamente la scena 3D usare Playwright (`chromium` con `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader`), che rende la pagina visibile; il Browser pane resta utile per le superfici DOM.

### `onPointerMissed` chiude il pannello appena aperto da tastiera

Attivare con Invio un hotspot DOM sovrapposto al canvas genera un `click` che risale al wrapper di React Three Fiber: R3F non trova alcuna mesh sotto il puntatore (le coordinate sono 0,0) e chiama `onPointerMissed`, che chiudeva subito l'oggetto appena messo a fuoco. Il pannello lampeggiava e spariva, ma il test E2E passava lo stesso perché controllava solo l'istante dopo l'apertura. Il click a vuoto va accettato solo quando proviene davvero dalla superficie della scena (`event.target instanceof HTMLCanvasElement`). Regola generale: qualunque DOM sovrapposto al canvas può generare eventi che R3F interpreta come interazione con la scena.

### Conferma email Supabase: il template di default funziona già, non serve SMTP custom

Dopo la registrazione il login falliva ("Credenziali non valide", messaggio generico che nascondeva la causa reale): il progetto Supabase remoto ha la conferma email attiva ma `email_confirmed_at` restava `null` finché non si clicca il link ricevuto. Avevo assunto che servisse personalizzare il template "Confirm signup" (link con `token_hash`/`type=email` verso una route custom `/auth/confirm`, per ottenere sessione automatica) — ma la dashboard Supabase blocca la modifica di oggetto/corpo del template finché non si configura SMTP personalizzato (verificato in UI: il toggle "Source" resta disabilitato con solo il mailer di default). **Non è comunque necessario per sbloccare il login**: il link di default (`{{ .ConfirmationURL }}`) punta a `{project-ref}.supabase.co/auth/v1/verify`, un endpoint gestito da Supabase che conferma l'email lato server *prima* di reindirizzare, indipendentemente da come/se l'app intercetta il redirect successivo. Utente può quindi cliccare il link di default e poi fare login manuale — funziona subito, senza toccare la dashboard. Il route handler `/auth/confirm` (già scritto, P.F.) resta utile solo per l'auto-login seamless via link, un miglioramento UX opzionale, non un requisito — e resta inutilizzato finché il template non viene ripuntato lì (il che richiede SMTP custom). Prima di assumere che un flusso email-confirmation richieda modifiche al template, verificare cosa fa già il link di default.

### Ruoli privilegiati (`is_admin`, `is_capo_reparto`) non sono testabili con fixture RLS automatizzate

In Fase 6 (P6-T02/T03) ho provato a scrivere un test RLS automatizzato per l'isolamento cross-Reparto (Capo di un Reparto non vede/scrive dati di un altro). Non è praticabile con lo stack attuale: `profiles.reparto_id`, `profiles.ruolo` e `profiles.squadriglia_id` sono scrivibili solo da SQL diretto (project owner) o da `decidi_richiesta_reparto()` — che è essa stessa gated su `is_admin()`/`is_capo_reparto()`. Non esiste quindi un modo self-service, né tramite client anon autenticato né tramite il client service-role di PostgREST (che non ha un `auth.uid()` significativo e comunque non bypassa il trigger `profiles_block_self_consent_update`, pensato apposta per bloccare anche scritture dirette), per "diventare" Capo o admin dentro un test — bypassarlo richiederebbe indebolire lo schema con una funzione di test dedicata, scartato. Lo stesso limite vale già per `is_admin` (DEC-015): nessun test automatizzato lo copre, verificato solo manualmente con l'account reale del proprietario del progetto. `tests/unit/rls/reparto.rls.test.ts` copre quindi solo il percorso di diniego (ruolo `eg` di default non è mai Capo/admin), non l'isolamento positivo cross-Reparto: quello resta verificato via query dirette (MCP `execute_sql`) o manualmente in browser dopo una promozione SQL, non in CI.

### `revoke ... from public` non toglie l'`EXECUTE` di default ad `anon`/`authenticated`

In P4-T02, dopo aver creato `find_profile_by_email` (SECURITY DEFINER) con `revoke all on function ... from public; grant execute ... to authenticated;`, `get_advisors` segnalava comunque che `anon` poteva eseguirla. Verificato con una query su `information_schema.routine_privileges`: `anon` aveva `EXECUTE` nonostante il revoke. Causa: questo progetto Supabase ha privilegi di default che concedono `EXECUTE` ad `anon`/`authenticated`/`service_role` su ogni nuova funzione in `public` al momento della `CREATE FUNCTION` — `PUBLIC` è uno pseudo-ruolo distinto, quindi `revoke ... from public` non tocca i grant già assegnati direttamente ad `anon`. Serve un `revoke execute on function ... from anon` esplicito (migrazione separata: `20260812122815_find_profile_by_email_revoke_anon.sql`). Dopo aver creato una funzione `SECURITY DEFINER` non pensata per `anon`, verificare sempre `information_schema.routine_privileges` (o `get_advisors`) invece di assumere che il revoke da `public` basti.
