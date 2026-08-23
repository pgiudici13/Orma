-- Fix performance segnalati da get_advisors dopo le migrazioni di Fase 3
-- (P3-T01/T03): indici mancanti sulle FK e policy RLS che rivalutano
-- auth.uid() per ogni riga invece che una volta per query
-- (https://supabase.com/docs/guides/database/database-linter?lint=0003_auth_rls_initplan).
-- Tocca solo le tabelle introdotte in questa fase: le policy profiles_*
-- pre-esistenti (Fase 5) restano fuori scope, non toccate qui.

-- Indici mancanti sulle foreign key (unindexed_foreign_keys).
create index if not exists brevetto_specialita_specialita_id_idx
  on public.brevetto_specialita (specialita_id);
create index if not exists maestro_esterno_profile_id_idx
  on public.maestro_esterno (profile_id);
create index if not exists nota_profile_id_idx
  on public.nota (profile_id);
create index if not exists user_competenza_competenza_id_idx
  on public.user_competenza (competenza_id);
create index if not exists user_competenza_maestro_esterno_id_idx
  on public.user_competenza (maestro_esterno_id);
create index if not exists user_competenza_maestro_profile_id_idx
  on public.user_competenza (maestro_profile_id);
create index if not exists user_specialita_maestro_esterno_id_idx
  on public.user_specialita (maestro_esterno_id);
create index if not exists user_specialita_maestro_profile_id_idx
  on public.user_specialita (maestro_profile_id);
create index if not exists user_specialita_specialita_id_idx
  on public.user_specialita (specialita_id);
create index if not exists user_tappa_tappa_id_idx
  on public.user_tappa (tappa_id);

-- has_active_consent(): auth.uid() valutato una volta, non per riga.
create or replace function public.has_active_consent()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.stato_consenso_genitoriale <> 'in_attesa'
  );
$$;

alter policy "maestro_esterno_select_own" on public.maestro_esterno
  using ((select auth.uid()) = profile_id and public.has_active_consent());
alter policy "maestro_esterno_insert_own" on public.maestro_esterno
  with check ((select auth.uid()) = profile_id and public.has_active_consent());
alter policy "maestro_esterno_update_own" on public.maestro_esterno
  using ((select auth.uid()) = profile_id and public.has_active_consent())
  with check ((select auth.uid()) = profile_id and public.has_active_consent());
alter policy "maestro_esterno_delete_own" on public.maestro_esterno
  using ((select auth.uid()) = profile_id and public.has_active_consent());

alter policy "user_specialita_select_own" on public.user_specialita
  using ((select auth.uid()) = profile_id and public.has_active_consent());
alter policy "user_specialita_insert_own" on public.user_specialita
  with check ((select auth.uid()) = profile_id and public.has_active_consent());
alter policy "user_specialita_update_own" on public.user_specialita
  using ((select auth.uid()) = profile_id and public.has_active_consent())
  with check ((select auth.uid()) = profile_id and public.has_active_consent());
alter policy "user_specialita_delete_own" on public.user_specialita
  using ((select auth.uid()) = profile_id and public.has_active_consent());

alter policy "user_competenza_select_own" on public.user_competenza
  using ((select auth.uid()) = profile_id and public.has_active_consent());
alter policy "user_competenza_insert_own" on public.user_competenza
  with check ((select auth.uid()) = profile_id and public.has_active_consent());
alter policy "user_competenza_update_own" on public.user_competenza
  using ((select auth.uid()) = profile_id and public.has_active_consent())
  with check ((select auth.uid()) = profile_id and public.has_active_consent());
alter policy "user_competenza_delete_own" on public.user_competenza
  using ((select auth.uid()) = profile_id and public.has_active_consent());

alter policy "user_tappa_select_own" on public.user_tappa
  using ((select auth.uid()) = profile_id and public.has_active_consent());
alter policy "user_tappa_insert_own" on public.user_tappa
  with check ((select auth.uid()) = profile_id and public.has_active_consent());
alter policy "user_tappa_update_own" on public.user_tappa
  using ((select auth.uid()) = profile_id and public.has_active_consent())
  with check ((select auth.uid()) = profile_id and public.has_active_consent());
alter policy "user_tappa_delete_own" on public.user_tappa
  using ((select auth.uid()) = profile_id and public.has_active_consent());

alter policy "nota_select_own" on public.nota
  using ((select auth.uid()) = profile_id and public.has_active_consent());
alter policy "nota_insert_own" on public.nota
  with check ((select auth.uid()) = profile_id and public.has_active_consent());
alter policy "nota_update_own" on public.nota
  using ((select auth.uid()) = profile_id and public.has_active_consent())
  with check ((select auth.uid()) = profile_id and public.has_active_consent());
alter policy "nota_delete_own" on public.nota
  using ((select auth.uid()) = profile_id and public.has_active_consent());
