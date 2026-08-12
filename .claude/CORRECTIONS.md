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
