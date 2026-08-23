-- Contenuto ufficiale (P3-T01): specialita, tappa, competenza, brevetto.
-- Regola non negoziabile (docs/DATA_MODEL.md, PROJECT.md §7): queste tabelle
-- non contengono mai progresso utente, sono condivise cross-Reparto, e non
-- hanno nessuna policy di scrittura applicativa (DEC-008) — si popolano solo
-- via migrazioni/seed con service role.

create table if not exists public.specialita (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nome text not null,
  categoria text,
  immagine_path text,
  created_at timestamptz not null default now()
);

comment on table public.specialita is
  'Contenuto ufficiale. Una Specialità esiste una sola volta nel database (DEC-008). Nessuna scrittura applicativa.';

create table if not exists public.tappa (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nome text not null,
  ordine smallint not null unique,
  immagine_path text,
  created_at timestamptz not null default now()
);

comment on table public.tappa is
  'Contenuto ufficiale: le 3 Tappe del percorso E/G (Scoperta, Competenza, Responsabilità).';

create table if not exists public.competenza (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nome text not null,
  descrizione text,
  created_at timestamptz not null default now()
);

comment on table public.competenza is
  'Contenuto ufficiale. Le Competenze sono progetti personalizzati: nessun catalogo immagini disponibile, seed testuale minimo.';

create table if not exists public.brevetto (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nome text not null,
  immagine_path text,
  created_at timestamptz not null default now()
);

comment on table public.brevetto is
  'Contenuto ufficiale: raggruppamento di più Specialità correlate ("super-specialità", vedi DEC-005). Composizione in brevetto_specialita.';

create table if not exists public.brevetto_specialita (
  brevetto_id uuid not null references public.brevetto (id) on delete cascade,
  specialita_id uuid not null references public.specialita (id) on delete cascade,
  primary key (brevetto_id, specialita_id)
);

comment on table public.brevetto_specialita is
  'Composizione N:N di un brevetto. Il completamento utente è calcolato dalle user_specialita esistenti, non duplicato qui.';

alter table public.specialita enable row level security;
alter table public.tappa enable row level security;
alter table public.competenza enable row level security;
alter table public.brevetto enable row level security;
alter table public.brevetto_specialita enable row level security;

-- Contenuto ufficiale: leggibile da ogni utente autenticato, nessuna policy
-- di insert/update/delete applicativa (DEC-008).
create policy "specialita_select_authenticated"
  on public.specialita for select
  to authenticated
  using (true);

create policy "tappa_select_authenticated"
  on public.tappa for select
  to authenticated
  using (true);

create policy "competenza_select_authenticated"
  on public.competenza for select
  to authenticated
  using (true);

create policy "brevetto_select_authenticated"
  on public.brevetto for select
  to authenticated
  using (true);

create policy "brevetto_specialita_select_authenticated"
  on public.brevetto_specialita for select
  to authenticated
  using (true);
