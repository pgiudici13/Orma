# ORMA — Claude Code Instructions

## Project

ORMA is a personal web application for Scout Explorer/Guide users.

The core experience is a realistic interactive scout desk/table.

The project is currently in the foundation/design stage.

Read these files before making significant changes:

- `IDEA.md`
- `docs/PRODUCT.md`
- `docs/UX.md`
- `docs/DATA_MODEL.md`
- `docs/PERMISSIONS.md`
- `docs/DESIGN.md`
- `docs/SDD.md`

These documents define the product intent.

---

## Project Knowledge

`.claude/PROJECT.md` is the current source of truth for the project's state and architecture. `docs/SDD.md` is the full technical specification. Architectural decisions are logged in `.claude/DECISIONS.md`. Lessons and mistakes are logged in `.claude/CORRECTIONS.md`. The build plan is `.claude/TODO.md`.

Before making significant changes:

1. Read `.claude/PROJECT.md`.
2. Read the relevant section(s) of `.claude/TODO.md`.
3. Read relevant entries in `.claude/DECISIONS.md` — do not contradict an `Accepted` decision without flagging it first.
4. Read relevant entries in `.claude/CORRECTIONS.md`.

Keep these documents synchronized with the actual project state: update `PROJECT.md`/`docs/SDD.md` when architecture changes, log new entries in `DECISIONS.md` for non-trivial technical choices, and log new entries in `CORRECTIONS.md` when a mistake or wrong assumption is found. Do not implement arbitrary features or architecture changes that contradict an `Accepted` decision or the product concept below without raising it first.

---

# Core principles

## 1. Preserve the concept

ORMA must not become a generic dashboard.

The main experience is a realistic personal scout desk.

Do not replace the desk concept with a standard sidebar/dashboard layout unless explicitly requested.

---

## 2. Specialità, Competenze and Tappe are core

These are not secondary features.

The main purpose of the product is to help an E/G manage and follow their personal scout path.

Treat these features as first-class product surfaces.

---

## 3. Official vs personal data

Never modify or overwrite official content with user data.

Official content:

- Specialità
- Competenze
- Tappe
- official documents

Personal content:

- progress
- completed objectives
- notes
- personal relationships
- personal history

Keep these concepts separate in both the data model and UI.

---

## 4. Privacy

Never expose private user data simply because it exists in the database.

When implementing backend functionality:

- use Supabase Row Level Security;
- enforce authorization server-side/database-side;
- never rely only on frontend checks;
- never expose service-role credentials to the client.

Privacy defaults to private.

---

## 5. Reparto

The Reparto is a data context associated with an account.

ORMA is an individual experience, not a shared dashboard.

Users may be able to inspect other members of their Reparto according to permissions, but this does not mean all data is shared.

---

## 6. Maestri di Specialità

A Maestro may be:

1. an ORMA user;
2. an external person without an ORMA account.

Do not require an external Maestro to create an account.

Global Maestro discovery must expose only information explicitly intended to be discoverable.

---

# Design rules

## Realism

Prefer realistic physical materials and interactions.

The table should feel like a real physical environment.

Avoid:

- generic SaaS UI;
- excessive cards;
- glassmorphism everywhere;
- neon;
- fantasy UI;
- videogame aesthetics;
- unnecessary 3D effects.

---

## 3D

Use 3D where it improves the physical illusion.

Do not use 3D merely because Three.js is available.

The 3D scene should remain performant.

---

## Interaction

Interactive objects should behave like physical objects.

Typical interaction:

object → focus → camera movement → blurred table → content → close → return.

Do not turn every object into an interactive element.

Decorative objects can remain completely static.

---

## Assets

Prefer real and official assets when legally permitted.

Never invent official AGESCI graphics or claim generated graphics are official.

Keep original source assets separate from processed web assets.

Preserve attribution/licensing/source information when relevant.

---

# Development principles

## Work incrementally

Do not implement the entire product in one pass.

Build in small, testable milestones.

Preferred order (mirrors `.claude/TODO.md` phase-by-phase — keep these two in sync, do not let them drift):

0. Foundation;
1. Design / Visual Prototype;
2. Interactive Table;
3. Specialità / Competenze / Tappe;
4. Personal Data;
5. Authentication;
6. Supabase (Reparto/organization schema);
7. Reparto;
8. Maestri;
9. Calendario / Archivio;
10. Security / Accessibility / Performance;
11. Production QA.

See `.claude/TODO.md` for the granular task breakdown (`P<phase>-T<n>`) of each phase.

---

## Before changing architecture

Check existing project documentation and code.

Do not introduce a new library when the existing stack can solve the problem cleanly.

Avoid unnecessary dependencies.

---

## Before implementing a feature

Determine:

1. What user problem does it solve?
2. Where does it belong in the ORMA experience?
3. What data does it require?
4. What permissions does it require?
5. Does it preserve the physical/immersive metaphor?

If the feature does not fit the product, flag the issue before implementing it.

---

# Code quality

Prefer:

- TypeScript;
- strict typing;
- small focused components;
- reusable primitives;
- clear naming;
- accessible controls;
- responsive layouts;
- performance-conscious rendering.

Avoid:

- giant components;
- duplicated logic;
- unnecessary abstractions;
- magic values;
- dead code;
- temporary hacks becoming permanent architecture.

---

# 3D performance

Be especially careful with:

- texture sizes;
- unnecessary geometry;
- duplicate models;
- excessive shadows;
- post-processing;
- render loops;
- mobile GPU usage.

Prefer reusable models and textures.

Cards should use a reusable 3D model with different textures rather than separate geometry for every card.

---

# Data architecture

Official content must be reusable and shared.

Do not duplicate the same Specialità/Competenza/Tappa for every user.

Use relationships for user-specific state.

Personal notes and progress belong to the user.

---

# Supabase

When Supabase is introduced:

- use migrations;
- document schema changes;
- use RLS;
- keep secrets server-side;
- validate user input;
- avoid trusting client-provided user IDs;
- use authenticated identity as the source of ownership.

---

# External/official data

Do not assume AGESCI data is available through an API.

Before implementing integrations:

1. verify the source;
2. verify whether an API actually exists;
3. verify terms of use;
4. verify licensing/copyright;
5. determine whether scraping is permitted.

Do not build a scraper just because a website contains the required information.

---

# Documentation

If an architectural or product decision changes, update the appropriate document.

Important decisions should not live only inside chat history.

---

# Verification

After meaningful changes:

- run type checks;
- run linting;
- run tests when available;
- verify the UI in a browser;
- check responsive behavior;
- check console errors;
- check that animations do not introduce regressions.

For visual work, prioritize visual verification.

---

# Corrections

If a bug, incorrect assumption, failed approach, or important correction is discovered, record the lesson in:

`.claude/CORRECTIONS.md`

Do not repeatedly make the same mistake.

---

# Communication

When working autonomously:

- explain the current milestone briefly;
- state important assumptions;
- do not invent requirements;
- do not silently change product direction;
- flag conflicts between implementation and product documentation.

Prefer solving small problems directly rather than asking unnecessary questions.

When a product decision is genuinely ambiguous and materially affects the architecture or UX, ask before committing to it.
