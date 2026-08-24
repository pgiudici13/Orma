-- Fix performance segnalato da get_advisors: auth.uid() rivalutato per ogni
-- riga invece che una volta per query (auth_rls_initplan) su profiles_insert_own
-- e profiles_update_own (Fase 5, 20260810175930_profiles_parental_consent.sql).
--
-- 20260812114232_rls_performance_fix.sql aveva applicato lo stesso fix solo
-- alle tabelle introdotte in Fase 3, escludendo esplicitamente le policy
-- profiles_* pre-esistenti ("restano fuori scope, non toccate qui"). Non sono
-- mai state corrette in un giro successivo. profiles_select_own è già stata
-- riscritta con (select auth.uid()) da 20260823172537_profiles_reparto_visibility_fix.sql,
-- quindi non compare più nell'advisor: qui si allineano le altre due.

alter policy "profiles_insert_own" on public.profiles
  with check ((select auth.uid()) = id);

alter policy "profiles_update_own" on public.profiles
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
