-- Fix performance segnalato da get_advisors dopo 20260814091000: stesso
-- problema e stessa soluzione di 20260812120500_merge_admin_select_policies.sql
-- — policy SELECT permissive separate sulla stessa tabella vengono valutate
-- entrambe ad ogni query (multiple_permissive_policies). Le unisco.

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
  );
drop policy "profiles_select_capo_pending_request" on public.profiles;

alter policy "richiesta_reparto_select_own_or_admin" on public.richiesta_reparto
  using (
    (select auth.uid()) = profile_id
    or public.is_admin()
    or public.is_capo_reparto(reparto_id)
  );
drop policy "richiesta_reparto_select_capo" on public.richiesta_reparto;
