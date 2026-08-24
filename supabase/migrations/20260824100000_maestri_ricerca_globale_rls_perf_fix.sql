-- Fix performance per policy RLS in maestro_profilo e maestro_specialita
-- (Fase 8): auth.uid() rivalutato per ogni riga invece che una volta per query
-- (https://supabase.com/docs/guides/database/database-linter?lint=0003_auth_rls_initplan).
-- Applica lo stesso pattern di wrapping già usato in 20260812114232_rls_performance_fix.sql.

alter policy "maestro_profilo_select_own" on public.maestro_profilo
  using ((select auth.uid()) = profile_id and public.has_active_consent());

alter policy "maestro_profilo_insert_own" on public.maestro_profilo
  with check ((select auth.uid()) = profile_id and public.has_active_consent());

alter policy "maestro_profilo_update_own" on public.maestro_profilo
  using ((select auth.uid()) = profile_id and public.has_active_consent())
  with check ((select auth.uid()) = profile_id and public.has_active_consent());

alter policy "maestro_profilo_delete_own" on public.maestro_profilo
  using ((select auth.uid()) = profile_id and public.has_active_consent());

alter policy "maestro_specialita_select_own" on public.maestro_specialita
  using (
    public.has_active_consent()
    and exists (
      select 1 from public.maestro_profilo mp
      where mp.id = maestro_specialita.maestro_id
        and mp.profile_id = (select auth.uid())
    )
  );

alter policy "maestro_specialita_insert_own" on public.maestro_specialita
  with check (
    public.has_active_consent()
    and exists (
      select 1 from public.maestro_profilo mp
      where mp.id = maestro_specialita.maestro_id
        and mp.profile_id = (select auth.uid())
    )
  );

alter policy "maestro_specialita_delete_own" on public.maestro_specialita
  using (
    public.has_active_consent()
    and exists (
      select 1 from public.maestro_profilo mp
      where mp.id = maestro_specialita.maestro_id
        and mp.profile_id = (select auth.uid())
    )
  );
