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
