-- Fase 7 — Reparto: Funzionalità (P7-T01, P7-T02, P7-T03)
-- 1. Visibilità membri dello stesso Reparto (P7-T01)
-- 2. Assegnazione Squadriglia (P7-T02)
-- 3. Calendario di Reparto: tabella evento e RLS (P7-T03)

-- ============================================================================
-- 1. P7-T01: Visibilità profili e percorso scout per membri dello stesso Reparto
-- ============================================================================

-- Estende la policy SELECT su profiles: un membro autenticato con consenso attivo
-- può leggere i profili dei membri del proprio stesso Reparto (escludendo profili in_attesa).
alter policy "profiles_select_own" on public.profiles
  using (
    (select auth.uid()) = id
    or (public.is_admin() and stato_consenso_genitoriale <> 'in_attesa')
    or (
      stato_consenso_genitoriale <> 'in_attesa'
      and exists (
        select 1 from public.richiesta_reparto rr
        where rr.profile_id = profiles.id
          and rr.stato = 'in_attesa'
          and public.is_capo_reparto(rr.reparto_id)
      )
    )
    or (
      stato_consenso_genitoriale <> 'in_attesa'
      and reparto_id is not null
      and public.has_active_consent()
      and reparto_id = (
        select p.reparto_id from public.profiles p where p.id = (select auth.uid())
      )
    )
  );

-- Visibilità dei progressi completati (Specialità, Competenze, Tappe) per i membri dello stesso Reparto:
-- I membri dello stesso Reparto possono consultare le Specialità completate degli altri membri.
alter policy "user_specialita_select_own" on public.user_specialita
  using (
    ((select auth.uid()) = profile_id and public.has_active_consent())
    or (
      public.is_admin()
      and exists (
        select 1 from public.profiles p
        where p.id = user_specialita.profile_id
          and p.stato_consenso_genitoriale <> 'in_attesa'
      )
    )
    or (
      stato = 'completata'
      and public.has_active_consent()
      and exists (
        select 1 from public.profiles p_target
        where p_target.id = user_specialita.profile_id
          and p_target.stato_consenso_genitoriale <> 'in_attesa'
          and p_target.reparto_id is not null
          and p_target.reparto_id = (
            select p_viewer.reparto_id from public.profiles p_viewer
            where p_viewer.id = (select auth.uid())
          )
      )
    )
  );

-- I membri dello stesso Reparto possono consultare le Competenze completate degli altri membri.
alter policy "user_competenza_select_own" on public.user_competenza
  using (
    ((select auth.uid()) = profile_id and public.has_active_consent())
    or (
      public.is_admin()
      and exists (
        select 1 from public.profiles p
        where p.id = user_competenza.profile_id
          and p.stato_consenso_genitoriale <> 'in_attesa'
      )
    )
    or (
      stato = 'completata'
      and public.has_active_consent()
      and exists (
        select 1 from public.profiles p_target
        where p_target.id = user_competenza.profile_id
          and p_target.stato_consenso_genitoriale <> 'in_attesa'
          and p_target.reparto_id is not null
          and p_target.reparto_id = (
            select p_viewer.reparto_id from public.profiles p_viewer
            where p_viewer.id = (select auth.uid())
          )
      )
    )
  );

-- I membri dello stesso Reparto possono consultare le Tappe degli altri membri.
alter policy "user_tappa_select_own" on public.user_tappa
  using (
    ((select auth.uid()) = profile_id and public.has_active_consent())
    or (
      public.is_admin()
      and exists (
        select 1 from public.profiles p
        where p.id = user_tappa.profile_id
          and p.stato_consenso_genitoriale <> 'in_attesa'
      )
    )
    or (
      public.has_active_consent()
      and exists (
        select 1 from public.profiles p_target
        where p_target.id = user_tappa.profile_id
          and p_target.stato_consenso_genitoriale <> 'in_attesa'
          and p_target.reparto_id is not null
          and p_target.reparto_id = (
            select p_viewer.reparto_id from public.profiles p_viewer
            where p_viewer.id = (select auth.uid())
          )
      )
    )
  );

-- Nota e Maestro Esterno restano strettamente privati (nessuna modifica alle relative policy).

-- ============================================================================
-- 2. P7-T02: Funzione di assegnazione Squadriglia
-- ============================================================================

-- Assegna o rimuove un profilo a una Squadriglia.
-- Permesso: Admin globale (DEC-015) o Capo del Reparto del profilo (DEC-017).
create or replace function public.assegna_squadriglia(
  p_profile_id uuid,
  p_squadriglia_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reparto_id uuid;
  v_sq_reparto_id uuid;
begin
  -- Recupera il reparto del profilo target
  select reparto_id into v_reparto_id
  from public.profiles
  where id = p_profile_id;

  if v_reparto_id is null then
    raise exception 'Profilo non trovato o non associato ad alcun Reparto.';
  end if;

  -- Verifica autorizzazione: admin o Capo del Reparto target
  if not (public.is_admin() or public.is_capo_reparto(v_reparto_id)) then
    raise exception 'Permesso negato: solo i Capi del Reparto o gli amministratori possono assegnare le Squadriglie.';
  end if;

  -- Se p_squadriglia_id è fornito, verifica che appartenga allo stesso Reparto
  if p_squadriglia_id is not null then
    select reparto_id into v_sq_reparto_id
    from public.squadriglia
    where id = p_squadriglia_id;

    if v_sq_reparto_id is null or v_sq_reparto_id <> v_reparto_id then
      raise exception 'La Squadriglia indicata non appartiene allo stesso Reparto del profilo.';
    end if;
  end if;

  -- Bypass trigger di blocco per aggiornare squadriglia_id
  perform set_config('app.bypass_rls', 'on', true);
  update public.profiles
  set squadriglia_id = p_squadriglia_id
  where id = p_profile_id;
end;
$$;

comment on function public.assegna_squadriglia is
  'Assegna o rimuove un membro da una Squadriglia del suo Reparto. Riservata ai Capi del Reparto o Admin.';

revoke all on function public.assegna_squadriglia(uuid, uuid) from public;
revoke execute on function public.assegna_squadriglia(uuid, uuid) from anon;
grant execute on function public.assegna_squadriglia(uuid, uuid) to authenticated;

-- ============================================================================
-- 3. P7-T03: Calendario di Reparto (schema evento e RLS)
-- ============================================================================

create table if not exists public.evento (
  id uuid primary key default gen_random_uuid(),
  reparto_id uuid not null references public.reparto (id) on delete cascade,
  titolo text not null,
  descrizione text,
  tipo text not null default 'uscita'
    check (tipo in ('uscita', 'campo', 'riunione', 'altro')),
  data_inizio date not null,
  data_fine date,
  luogo text,
  created_at timestamptz not null default now(),
  constraint data_fine_ge_data_inizio check (data_fine is null or data_fine >= data_inizio)
);

create index if not exists evento_reparto_id_idx on public.evento (reparto_id);
create index if not exists evento_data_inizio_idx on public.evento (data_inizio);

comment on table public.evento is
  'Eventi, uscite, campi e attività di Reparto (P7-T03). Visualizzabili dai membri del Reparto, modificabili dai Capi o dall''admin.';

alter table public.evento enable row level security;

create policy "evento_select_own_reparto"
  on public.evento for select
  using (
    (
      public.has_active_consent()
      and exists (
        select 1 from public.profiles p
        where p.id = (select auth.uid())
          and p.reparto_id = evento.reparto_id
      )
    )
    or public.is_admin()
  );

create policy "evento_insert_capo"
  on public.evento for insert
  with check (public.is_capo_reparto(reparto_id) or public.is_admin());

create policy "evento_update_capo"
  on public.evento for update
  using (public.is_capo_reparto(reparto_id) or public.is_admin())
  with check (public.is_capo_reparto(reparto_id) or public.is_admin());

create policy "evento_delete_capo"
  on public.evento for delete
  using (public.is_capo_reparto(reparto_id) or public.is_admin());
