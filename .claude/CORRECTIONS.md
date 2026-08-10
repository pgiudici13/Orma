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
