-- Percorso personale (P3-T03): user_specialita, user_competenza, user_tappa,
-- nota, maestro_esterno. Sempre relazioni separate dal contenuto ufficiale
-- (docs/DATA_MODEL.md), mai duplicazione di Specialità/Competenza/Tappa.

-- Helper RLS condiviso: un profilo con consenso genitoriale in_attesa non deve
-- accedere a nessun dato personale oltre al proprio flusso di attesa (DEC-010).
create or replace function public.has_active_consent()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.stato_consenso_genitoriale <> 'in_attesa'
  );
$$;

create table if not exists public.maestro_esterno (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  nome text not null,
  contatto text,
  created_at timestamptz not null default now()
);

comment on table public.maestro_esterno is
  'Maestro senza account ORMA, di proprietà esclusiva del profilo che lo ha aggiunto. Mai creazione automatica di account (CLAUDE.md).';

create table if not exists public.user_specialita (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  specialita_id uuid not null references public.specialita (id),
  stato text not null default 'in_corso'
    check (stato in ('in_corso', 'completata')),
  data_inizio date not null default current_date,
  data_completamento date,
  maestro_profile_id uuid references public.profiles (id),
  maestro_esterno_id uuid references public.maestro_esterno (id),
  created_at timestamptz not null default now(),
  unique (profile_id, specialita_id),
  constraint user_specialita_maestro_unico
    check (maestro_profile_id is null or maestro_esterno_id is null)
);

comment on table public.user_specialita is
  'Percorso personale verso una Specialità ufficiale. Cancellare il profilo cancella questa relazione, mai il contenuto ufficiale collegato.';

create table if not exists public.user_competenza (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  competenza_id uuid not null references public.competenza (id),
  stato text not null default 'in_corso'
    check (stato in ('in_corso', 'completata')),
  data_inizio date not null default current_date,
  data_completamento date,
  maestro_profile_id uuid references public.profiles (id),
  maestro_esterno_id uuid references public.maestro_esterno (id),
  created_at timestamptz not null default now(),
  unique (profile_id, competenza_id),
  constraint user_competenza_maestro_unico
    check (maestro_profile_id is null or maestro_esterno_id is null)
);

create table if not exists public.user_tappa (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  tappa_id uuid not null references public.tappa (id),
  data_inizio date not null default current_date,
  data_completamento date,
  created_at timestamptz not null default now(),
  unique (profile_id, tappa_id)
);

create table if not exists public.nota (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  tipo text not null check (tipo in ('specialita', 'competenza', 'tappa')),
  riferimento_id uuid not null,
  testo text not null,
  created_at timestamptz not null default now()
);

comment on table public.nota is
  'Nota personale, di proprietà esclusiva dell''utente che l''ha creata. riferimento_id punta a specialita/competenza/tappa a seconda di tipo (nessuna FK diretta: il target cambia con tipo).';

alter table public.maestro_esterno enable row level security;
alter table public.user_specialita enable row level security;
alter table public.user_competenza enable row level security;
alter table public.user_tappa enable row level security;
alter table public.nota enable row level security;

create policy "maestro_esterno_select_own"
  on public.maestro_esterno for select
  using (auth.uid() = profile_id and public.has_active_consent());

create policy "maestro_esterno_insert_own"
  on public.maestro_esterno for insert
  with check (auth.uid() = profile_id and public.has_active_consent());

create policy "maestro_esterno_update_own"
  on public.maestro_esterno for update
  using (auth.uid() = profile_id and public.has_active_consent())
  with check (auth.uid() = profile_id and public.has_active_consent());

create policy "maestro_esterno_delete_own"
  on public.maestro_esterno for delete
  using (auth.uid() = profile_id and public.has_active_consent());

create policy "user_specialita_select_own"
  on public.user_specialita for select
  using (auth.uid() = profile_id and public.has_active_consent());

create policy "user_specialita_insert_own"
  on public.user_specialita for insert
  with check (auth.uid() = profile_id and public.has_active_consent());

create policy "user_specialita_update_own"
  on public.user_specialita for update
  using (auth.uid() = profile_id and public.has_active_consent())
  with check (auth.uid() = profile_id and public.has_active_consent());

create policy "user_specialita_delete_own"
  on public.user_specialita for delete
  using (auth.uid() = profile_id and public.has_active_consent());

create policy "user_competenza_select_own"
  on public.user_competenza for select
  using (auth.uid() = profile_id and public.has_active_consent());

create policy "user_competenza_insert_own"
  on public.user_competenza for insert
  with check (auth.uid() = profile_id and public.has_active_consent());

create policy "user_competenza_update_own"
  on public.user_competenza for update
  using (auth.uid() = profile_id and public.has_active_consent())
  with check (auth.uid() = profile_id and public.has_active_consent());

create policy "user_competenza_delete_own"
  on public.user_competenza for delete
  using (auth.uid() = profile_id and public.has_active_consent());

create policy "user_tappa_select_own"
  on public.user_tappa for select
  using (auth.uid() = profile_id and public.has_active_consent());

create policy "user_tappa_insert_own"
  on public.user_tappa for insert
  with check (auth.uid() = profile_id and public.has_active_consent());

create policy "user_tappa_update_own"
  on public.user_tappa for update
  using (auth.uid() = profile_id and public.has_active_consent())
  with check (auth.uid() = profile_id and public.has_active_consent());

create policy "user_tappa_delete_own"
  on public.user_tappa for delete
  using (auth.uid() = profile_id and public.has_active_consent());

create policy "nota_select_own"
  on public.nota for select
  using (auth.uid() = profile_id and public.has_active_consent());

create policy "nota_insert_own"
  on public.nota for insert
  with check (auth.uid() = profile_id and public.has_active_consent());

create policy "nota_update_own"
  on public.nota for update
  using (auth.uid() = profile_id and public.has_active_consent())
  with check (auth.uid() = profile_id and public.has_active_consent());

create policy "nota_delete_own"
  on public.nota for delete
  using (auth.uid() = profile_id and public.has_active_consent());
