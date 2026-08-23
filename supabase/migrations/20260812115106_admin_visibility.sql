-- Visibilità admin (DEC-015): un profilo con is_admin = true può leggere i
-- dati personali di tutti gli utenti anche dentro l'app, non solo dalla
-- dashboard Supabase. Sola lettura: nessuna policy insert/update/delete per
-- admin. Non tocca il contenuto ufficiale (DEC-008 resta invariata).
--
-- Vincolo non negoziabile ripreso da DEC-010: un profilo con
-- stato_consenso_genitoriale = 'in_attesa' resta invisibile anche all'admin.
--
-- Nessuna policy esistente viene modificata: queste sono policy aggiuntive
-- (permissive, si sommano in OR alle policy "_own" già presenti).

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

comment on column public.profiles.is_admin is
  'Visibilità read-only cross-utente in-app (DEC-015). Attivato manualmente via SQL dal proprietario del progetto, mai tramite UI.';

create or replace function public.is_admin()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.is_admin = true
  );
$$;

create policy "profiles_select_admin"
  on public.profiles for select
  using (
    public.is_admin()
    and stato_consenso_genitoriale <> 'in_attesa'
  );

create policy "user_specialita_select_admin"
  on public.user_specialita for select
  using (
    public.is_admin()
    and exists (
      select 1 from public.profiles p
      where p.id = user_specialita.profile_id
        and p.stato_consenso_genitoriale <> 'in_attesa'
    )
  );

create policy "user_competenza_select_admin"
  on public.user_competenza for select
  using (
    public.is_admin()
    and exists (
      select 1 from public.profiles p
      where p.id = user_competenza.profile_id
        and p.stato_consenso_genitoriale <> 'in_attesa'
    )
  );

create policy "user_tappa_select_admin"
  on public.user_tappa for select
  using (
    public.is_admin()
    and exists (
      select 1 from public.profiles p
      where p.id = user_tappa.profile_id
        and p.stato_consenso_genitoriale <> 'in_attesa'
    )
  );

create policy "nota_select_admin"
  on public.nota for select
  using (
    public.is_admin()
    and exists (
      select 1 from public.profiles p
      where p.id = nota.profile_id
        and p.stato_consenso_genitoriale <> 'in_attesa'
    )
  );

create policy "maestro_esterno_select_admin"
  on public.maestro_esterno for select
  using (
    public.is_admin()
    and exists (
      select 1 from public.profiles p
      where p.id = maestro_esterno.profile_id
        and p.stato_consenso_genitoriale <> 'in_attesa'
    )
  );
