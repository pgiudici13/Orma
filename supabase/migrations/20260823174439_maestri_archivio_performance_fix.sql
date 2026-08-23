-- Fix performance segnalati da get_advisors dopo le migrazioni di Fase 8
-- (20260823110000_maestri_ricerca_globale.sql) e Fase 9
-- (20260823120000_archivio_reparto.sql), applicate al progetto reale senza
-- questo passaggio di chiusura (a differenza delle fasi precedenti — vedi
-- .claude/CORRECTIONS.md): indici mancanti sulle FK (unindexed_foreign_keys),
-- auth.uid() rivalutato per riga invece che una volta per query
-- (auth_rls_initplan), e due policy SELECT permissive sulla stessa tabella
-- valutate entrambe ad ogni query (multiple_permissive_policies). Stesso tipo
-- di fix di 20260812114232_rls_performance_fix.sql e
-- 20260814115630_merge_capo_select_policies.sql. Tocca solo le tabelle
-- introdotte in queste due fasi.

-- ============================================================================
-- 1. Indici mancanti sulle foreign key (unindexed_foreign_keys)
-- ============================================================================

create index if not exists campo_created_by_idx on public.campo (created_by);
create index if not exists uscita_created_by_idx on public.uscita (created_by);
create index if not exists campo_partecipante_profile_id_idx
  on public.campo_partecipante (profile_id);
create index if not exists uscita_partecipante_profile_id_idx
  on public.uscita_partecipante (profile_id);
create index if not exists campo_squadriglia_squadriglia_id_idx
  on public.campo_squadriglia (squadriglia_id);
create index if not exists uscita_squadriglia_squadriglia_id_idx
  on public.uscita_squadriglia (squadriglia_id);
create index if not exists documento_archivio_uploaded_by_idx
  on public.documento_archivio (uploaded_by);

-- ============================================================================
-- 2. auth.uid() valutato una volta per query, non per riga (auth_rls_initplan)
--    Fuse insieme al merge delle policy SELECT duplicate (§3) dove le due
--    cose toccano la stessa policy.
-- ============================================================================

alter policy "maestro_profilo_insert_own" on public.maestro_profilo
  with check ((select auth.uid()) = profile_id and public.has_active_consent());
alter policy "maestro_profilo_update_own" on public.maestro_profilo
  using ((select auth.uid()) = profile_id and public.has_active_consent())
  with check ((select auth.uid()) = profile_id and public.has_active_consent());
alter policy "maestro_profilo_delete_own" on public.maestro_profilo
  using ((select auth.uid()) = profile_id and public.has_active_consent());

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

alter policy "luogo_select_reparto" on public.luogo
  using (
    public.has_active_consent()
    and reparto_id = (select p.reparto_id from public.profiles p where p.id = (select auth.uid()))
  );

alter policy "uscita_select_reparto" on public.uscita
  using (
    public.has_active_consent()
    and reparto_id = (select p.reparto_id from public.profiles p where p.id = (select auth.uid()))
  );

alter policy "campo_select_reparto" on public.campo
  using (
    public.has_active_consent()
    and reparto_id = (select p.reparto_id from public.profiles p where p.id = (select auth.uid()))
  );

alter policy "uscita_partecipante_select_reparto" on public.uscita_partecipante
  using (
    public.has_active_consent()
    and exists (
      select 1 from public.uscita u
      where u.id = uscita_partecipante.uscita_id
        and u.reparto_id = (select p.reparto_id from public.profiles p where p.id = (select auth.uid()))
    )
  );

alter policy "campo_partecipante_select_reparto" on public.campo_partecipante
  using (
    public.has_active_consent()
    and exists (
      select 1 from public.campo c
      where c.id = campo_partecipante.campo_id
        and c.reparto_id = (select p.reparto_id from public.profiles p where p.id = (select auth.uid()))
    )
  );

alter policy "uscita_squadriglia_select_reparto" on public.uscita_squadriglia
  using (
    public.has_active_consent()
    and exists (
      select 1 from public.uscita u
      where u.id = uscita_squadriglia.uscita_id
        and u.reparto_id = (select p.reparto_id from public.profiles p where p.id = (select auth.uid()))
    )
  );

alter policy "campo_squadriglia_select_reparto" on public.campo_squadriglia
  using (
    public.has_active_consent()
    and exists (
      select 1 from public.campo c
      where c.id = campo_squadriglia.campo_id
        and c.reparto_id = (select p.reparto_id from public.profiles p where p.id = (select auth.uid()))
    )
  );

alter policy "documento_archivio_select_reparto" on public.documento_archivio
  using (
    public.has_active_consent()
    and reparto_id = (select p.reparto_id from public.profiles p where p.id = (select auth.uid()))
  );

-- ============================================================================
-- 3. Merge delle policy SELECT permissive duplicate (multiple_permissive_policies)
--    maestro_profilo_select_own + maestro_profilo_select_visibile → una sola
--    policy con OR, stessa semantica di prima (proprietario oppure visibile).
-- ============================================================================

alter policy "maestro_profilo_select_own" on public.maestro_profilo
  to authenticated
  using (
    public.has_active_consent()
    and ((select auth.uid()) = profile_id or visibile)
  );
drop policy "maestro_profilo_select_visibile" on public.maestro_profilo;

alter policy "maestro_specialita_select_own" on public.maestro_specialita
  to authenticated
  using (
    public.has_active_consent()
    and exists (
      select 1 from public.maestro_profilo mp
      where mp.id = maestro_specialita.maestro_id
        and (mp.profile_id = (select auth.uid()) or mp.visibile)
    )
  );
drop policy "maestro_specialita_select_visibile" on public.maestro_specialita;
