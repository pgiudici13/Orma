-- Fix RLS (Fase 9 — archivio di Reparto): le policy INSERT sulle tabelle di
-- join uscita_partecipante/campo_partecipante/uscita_squadriglia/campo_squadriglia
-- (20260823120000_archivio_reparto.sql) verificavano solo che chi scrive sia
-- Capo/admin del Reparto dell'uscita/campo, ma non che il profile_id o lo
-- squadriglia_id inserito appartenga effettivamente allo stesso Reparto. Un
-- Capo del Reparto A poteva quindi associare come partecipante un profilo o
-- una Squadriglia del Reparto B (trovato in code review). Le migration
-- passate non si toccano: qui si corregge con `alter policy`, stesso stile
-- già usato in 20260812114232_rls_performance_fix.sql per modifiche a policy
-- esistenti. Pattern di verifica "stesso Reparto" preso da
-- assegna_squadriglia() in 20260823100000_reparto_funzionalita.sql.

alter policy "uscita_partecipante_insert_capo" on public.uscita_partecipante
  with check (
    exists (
      select 1
      from public.uscita u
      join public.profiles p on p.id = uscita_partecipante.profile_id
      where u.id = uscita_partecipante.uscita_id
        and p.reparto_id = u.reparto_id
        and (public.is_capo_reparto(u.reparto_id) or public.is_admin())
    )
  );

alter policy "campo_partecipante_insert_capo" on public.campo_partecipante
  with check (
    exists (
      select 1
      from public.campo c
      join public.profiles p on p.id = campo_partecipante.profile_id
      where c.id = campo_partecipante.campo_id
        and p.reparto_id = c.reparto_id
        and (public.is_capo_reparto(c.reparto_id) or public.is_admin())
    )
  );

alter policy "uscita_squadriglia_insert_capo" on public.uscita_squadriglia
  with check (
    exists (
      select 1
      from public.uscita u
      join public.squadriglia s on s.id = uscita_squadriglia.squadriglia_id
      where u.id = uscita_squadriglia.uscita_id
        and s.reparto_id = u.reparto_id
        and (public.is_capo_reparto(u.reparto_id) or public.is_admin())
    )
  );

alter policy "campo_squadriglia_insert_capo" on public.campo_squadriglia
  with check (
    exists (
      select 1
      from public.campo c
      join public.squadriglia s on s.id = campo_squadriglia.squadriglia_id
      where c.id = campo_squadriglia.campo_id
        and s.reparto_id = c.reparto_id
        and (public.is_capo_reparto(c.reparto_id) or public.is_admin())
    )
  );
