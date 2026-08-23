-- Fase 8 — Maestri: ricerca globale (P8-T01, P8-T02)
-- 1. Schema e RLS: maestro_profilo (opt-in esplicito) + maestro_specialita
-- 2. Funzione di ricerca cerca_maestri() (SECURITY DEFINER)
--
-- Principio (docs/PERMISSIONS.md, SDD §19): la ricerca globale mostra solo le
-- informazioni che un Maestro ha scelto di rendere ricercabili. I campi di
-- visibilità NON stanno su profiles: una policy SELECT estesa lì esporrebbe
-- l'intero profilo (nome, data di nascita, email del genitore) a chiunque
-- legga la tabella, non solo i campi dichiarati ricercabili.

-- ============================================================================
-- 1. Schema e RLS
-- ============================================================================

create table if not exists public.maestro_profilo (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles (id) on delete cascade,
  -- Opt-in esplicito (FR-15): senza visibile = true nessuno compare in ricerca.
  visibile boolean not null default false,
  regione text,
  zona text,
  localita text,
  disponibile boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.maestro_profilo is
  'Profilo di Maestro di Specialità di un utente ORMA (Fase 8). Riga presente solo se l''utente vuole essere trovato: visibile è l''opt-in esplicito. Contiene esclusivamente i campi resi ricercabili, mai dati privati del profilo.';

create table if not exists public.maestro_specialita (
  maestro_id uuid not null references public.maestro_profilo (id) on delete cascade,
  specialita_id uuid not null references public.specialita (id) on delete cascade,
  primary key (maestro_id, specialita_id)
);

comment on table public.maestro_specialita is
  'Specialità ufficiali che un Maestro dichiara di poter accompagnare (Fase 8). Riferimento al contenuto ufficiale condiviso, mai duplicato.';

create index if not exists maestro_specialita_specialita_id_idx
  on public.maestro_specialita (specialita_id);

alter table public.maestro_profilo enable row level security;
alter table public.maestro_specialita enable row level security;

-- Il proprietario legge e gestisce il proprio profilo.
create policy "maestro_profilo_select_own"
  on public.maestro_profilo for select
  using (auth.uid() = profile_id and public.has_active_consent());

-- La ricerca globale legge le righe di chi ha fatto opt-in: solo i campi di
-- questa tabella (che sono quelli dichiarati ricercabili) diventano visibili,
-- mai l'intero profilo (SDD §19).
create policy "maestro_profilo_select_visibile"
  on public.maestro_profilo for select
  to authenticated
  using (visibile and public.has_active_consent());

create policy "maestro_profilo_insert_own"
  on public.maestro_profilo for insert
  with check (auth.uid() = profile_id and public.has_active_consent());

create policy "maestro_profilo_update_own"
  on public.maestro_profilo for update
  using (auth.uid() = profile_id and public.has_active_consent())
  with check (auth.uid() = profile_id and public.has_active_consent());

create policy "maestro_profilo_delete_own"
  on public.maestro_profilo for delete
  using (auth.uid() = profile_id and public.has_active_consent());

-- Le Specialità dichiarate: il proprietario le gestisce; chiunque le legge
-- solo quando il profilo del Maestro è visibile.
create policy "maestro_specialita_select_own"
  on public.maestro_specialita for select
  using (
    public.has_active_consent()
    and exists (
      select 1 from public.maestro_profilo mp
      where mp.id = maestro_specialita.maestro_id
        and mp.profile_id = auth.uid()
    )
  );

create policy "maestro_specialita_select_visibile"
  on public.maestro_specialita for select
  to authenticated
  using (
    public.has_active_consent()
    and exists (
      select 1 from public.maestro_profilo mp
      where mp.id = maestro_specialita.maestro_id
        and mp.visibile
    )
  );

create policy "maestro_specialita_insert_own"
  on public.maestro_specialita for insert
  with check (
    public.has_active_consent()
    and exists (
      select 1 from public.maestro_profilo mp
      where mp.id = maestro_specialita.maestro_id
        and mp.profile_id = auth.uid()
    )
  );

create policy "maestro_specialita_delete_own"
  on public.maestro_specialita for delete
  using (
    public.has_active_consent()
    and exists (
      select 1 from public.maestro_profilo mp
      where mp.id = maestro_specialita.maestro_id
        and mp.profile_id = auth.uid()
    )
  );

-- ============================================================================
-- 2. Ricerca globale (P8-T01/T02)
-- ============================================================================

-- SECURITY DEFINER, stesso pattern di find_profile_by_email (P4-T02): un
-- utente non può leggere profiles altrui via RLS, quindi la ricerca deve
-- passare da qui. La funzione espone SOLO i campi dichiarati ricercabili
-- (nome, Specialità, Regione/Zona/Località, disponibilità), esclude sé stessi
-- e i profili in attesa di consenso genitoriale (DEC-010), richiede consenso
-- attivo anche per chi cerca (stessa regola delle policy di lettura), e
-- filtra sempre su visibile = true: l'opt-in è condizione necessaria, non
-- solo un filtro.
create or replace function public.cerca_maestri(
  p_specialita_id uuid default null,
  p_regione text default null,
  p_zona text default null,
  p_solo_disponibili boolean default false
)
returns table (
  profile_id uuid,
  nome text,
  specialita_ids uuid[],
  specialita_nomi text[],
  regione text,
  zona text,
  localita text,
  disponibile boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    mp.profile_id,
    p.nome,
    -- Entrambi gli array ordinati per la stessa chiave: il client li abbina
    -- per indice, l'ordine va reso esplicito e non lasciato al caso.
    coalesce(
      array_agg(ms.specialita_id order by ms.specialita_id)
        filter (where ms.specialita_id is not null),
      '{}'::uuid[]
    ) as specialita_ids,
    coalesce(
      array_agg(s.nome order by ms.specialita_id)
        filter (where s.nome is not null),
      '{}'::text[]
    ) as specialita_nomi,
    mp.regione,
    mp.zona,
    mp.localita,
    mp.disponibile
  from public.maestro_profilo mp
  join public.profiles p on p.id = mp.profile_id
  left join public.maestro_specialita ms on ms.maestro_id = mp.id
  left join public.specialita s on s.id = ms.specialita_id
  where mp.visibile
    and p.stato_consenso_genitoriale <> 'in_attesa'
    and p.id <> auth.uid()
    and public.has_active_consent()
    and (p_specialita_id is null or exists (
      select 1 from public.maestro_specialita ms2
      where ms2.maestro_id = mp.id and ms2.specialita_id = p_specialita_id
    ))
    and (p_regione is null or mp.regione ilike '%' || p_regione || '%')
    and (p_zona is null or mp.zona ilike '%' || p_zona || '%')
    and (not p_solo_disponibili or mp.disponibile)
  group by mp.profile_id, p.nome, mp.regione, mp.zona, mp.localita, mp.disponibile
  order by p.nome;
$$;

comment on function public.cerca_maestri is
  'Ricerca globale dei Maestri di Specialità (Fase 8): solo chi ha fatto opt-in (visibile = true) compare, con i soli campi resi ricercabili. Filtri combinabili per Specialità, Regione, Zona e disponibilità (FR-14).';

revoke all on function public.cerca_maestri(uuid, text, text, boolean) from public;
revoke execute on function public.cerca_maestri(uuid, text, text, boolean) from anon;
grant execute on function public.cerca_maestri(uuid, text, text, boolean) to authenticated;
