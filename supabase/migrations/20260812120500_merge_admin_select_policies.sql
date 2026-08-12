-- Fix performance segnalato da get_advisors dopo DEC-015: avere policy SELECT
-- separate "_own" e "_admin" sulla stessa tabella le fa valutare entrambe ad
-- ogni query (multiple_permissive_policies). Le unisco in un'unica policy per
-- tabella con OR: stessa semantica di prima (proprietario oppure admin),
-- una sola valutazione. Approfitto per sistemare anche l'auth.uid() non
-- wrappato in profiles_select_own (auth_rls_initplan, pre-esistente da
-- Fase 5), dato che la policy va comunque toccata per il merge.

alter policy "profiles_select_own" on public.profiles
  using (
    (select auth.uid()) = id
    or (public.is_admin() and stato_consenso_genitoriale <> 'in_attesa')
  );
drop policy "profiles_select_admin" on public.profiles;

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
  );
drop policy "user_specialita_select_admin" on public.user_specialita;

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
  );
drop policy "user_competenza_select_admin" on public.user_competenza;

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
  );
drop policy "user_tappa_select_admin" on public.user_tappa;

alter policy "nota_select_own" on public.nota
  using (
    ((select auth.uid()) = profile_id and public.has_active_consent())
    or (
      public.is_admin()
      and exists (
        select 1 from public.profiles p
        where p.id = nota.profile_id
          and p.stato_consenso_genitoriale <> 'in_attesa'
      )
    )
  );
drop policy "nota_select_admin" on public.nota;

alter policy "maestro_esterno_select_own" on public.maestro_esterno
  using (
    ((select auth.uid()) = profile_id and public.has_active_consent())
    or (
      public.is_admin()
      and exists (
        select 1 from public.profiles p
        where p.id = maestro_esterno.profile_id
          and p.stato_consenso_genitoriale <> 'in_attesa'
      )
    )
  );
drop policy "maestro_esterno_select_admin" on public.maestro_esterno;
