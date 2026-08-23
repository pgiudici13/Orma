-- Fase 10 — Audit RLS (P10-T01): chiude una fuga di colonne su profiles
--
-- profiles_select_own (P7-T01, 20260823100000_reparto_funzionalita.sql) espone
-- l'intera riga profiles a chiunque appartenga allo stesso Reparto (ultimo ramo
-- OR). La RLS di Postgres è a livello di riga, non di colonna: quel ramo, pensato
-- solo per rendere leggibile l'esistenza della riga alle policy di
-- user_specialita/user_competenza/user_tappa (percorso completato tra membri
-- dello stesso Reparto, DEC-018), espone di fatto anche data_nascita e
-- genitore_email di ogni membro a chiunque interroghi direttamente PostgREST —
-- non solo attraverso le query applicative che chiedono solo id/nome
-- (lib/queries/reparto.ts, lib/queries/archivio.ts). Viola DEC-018 ("i dati
-- strettamente personali... non vengono esposti nella vista membri di
-- Reparto") e CLAUDE.md §4 ("never rely only on frontend checks").
--
-- Fix: sostituire il ramo di visibilità cross-membro con funzioni
-- SECURITY DEFINER che espongono solo l'esito (booleano) o le sole colonne
-- dichiarate — stesso pattern già in uso per cerca_maestri/find_profile_by_email
-- (DEC-022/P4-T02) — invece di una riga intera leggibile via RLS.

-- ============================================================================
-- 1. Funzione di appartenenza allo stesso Reparto (bypassa la RLS di profiles
--    internamente, restituisce solo un booleano)
-- ============================================================================

create or replace function public.stesso_reparto_attivo(target_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p_target
    join public.profiles p_viewer on p_viewer.id = (select auth.uid())
    where p_target.id = target_profile_id
      and p_target.stato_consenso_genitoriale <> 'in_attesa'
      and p_target.reparto_id is not null
      and p_target.reparto_id = p_viewer.reparto_id
  );
$$;

comment on function public.stesso_reparto_attivo is
  'Vero se target_profile_id ha consenso attivo e appartiene allo stesso Reparto di chi chiama. SECURITY DEFINER: usata dalle policy di user_specialita/user_competenza/user_tappa per non dover leggere l''intera riga profiles altrui via RLS (vedi profiles_select_own).';

revoke all on function public.stesso_reparto_attivo(uuid) from public;
revoke execute on function public.stesso_reparto_attivo(uuid) from anon;
grant execute on function public.stesso_reparto_attivo(uuid) to authenticated;

-- ============================================================================
-- 2. profiles_select_own: rimosso il ramo di visibilità cross-membro a riga
--    intera. Restano: riga propria, admin, Capo che valuta una richiesta
--    pendente per il proprio Reparto.
-- ============================================================================

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

-- ============================================================================
-- 3. user_specialita/user_competenza/user_tappa: il ramo "completato, membro
--    dello stesso Reparto" ora chiama stesso_reparto_attivo() invece di una
--    EXISTS diretta su profiles (che altrimenti, senza il ramo rimosso al
--    punto 2, non troverebbe più righe altrui).
-- ============================================================================

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
      and public.stesso_reparto_attivo(user_specialita.profile_id)
    )
  );

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
      and public.stesso_reparto_attivo(user_competenza.profile_id)
    )
  );

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
      and public.stesso_reparto_attivo(user_tappa.profile_id)
    )
  );

-- ============================================================================
-- 4. membri_reparto(): unica via per leggere i compagni di Reparto — solo le
--    colonne che la UI ha sempre mostrato (id, nome, ruolo, Squadriglia).
--    Sostituisce le select dirette su profiles in lib/queries/reparto.ts e
--    lib/queries/archivio.ts, che ora non possono più leggere righe altrui
--    dalla tabella base.
-- ============================================================================

create or replace function public.membri_reparto()
returns table (
  id uuid,
  nome text,
  ruolo text,
  squadriglia_id uuid,
  squadriglia_nome text
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.nome, p.ruolo, p.squadriglia_id, s.nome as squadriglia_nome
  from public.profiles p
  left join public.squadriglia s on s.id = p.squadriglia_id
  where public.has_active_consent()
    and p.stato_consenso_genitoriale <> 'in_attesa'
    and p.reparto_id is not null
    and p.reparto_id = (
      select viewer.reparto_id from public.profiles viewer
      where viewer.id = (select auth.uid())
    )
  order by p.nome;
$$;

comment on function public.membri_reparto is
  'Membri del Reparto di chi chiama: solo id/nome/ruolo/Squadriglia, mai data_nascita o genitore_email (DEC-018). SECURITY DEFINER, stesso pattern di cerca_maestri.';

revoke all on function public.membri_reparto() from public;
revoke execute on function public.membri_reparto() from anon;
grant execute on function public.membri_reparto() to authenticated;
