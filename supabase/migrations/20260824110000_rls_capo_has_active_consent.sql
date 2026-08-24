-- Fix RLS (DEC-010): policy di scrittura riservate ai Capi Reparto (suffisso
-- _insert_capo/_update_capo/_delete_capo) devono richiedere has_active_consent()
-- come tutte le altre policy che dipendono dallo stato_consenso_genitoriale.
--
-- Contesto: DEC-010 richiede che un profilo in stato "in_attesa" non possa usare
-- nessuna funzionalità applicativa. Le policy _own su tabelle personali (user_specialita,
-- nota, maestro_esterno, maestro_profilo...) lo richiedono sempre; queste policy di
-- Capo Reparto (squadriglia, evento, archivio, calendario) mancavano il controllo.
--
-- Rischio pratico: basso (il ruolo è assegnato via SQL/funzioni gated), ma è
-- un'incoerenza. Se un capo finisse in stato "in_attesa" (bug di importazione,
-- minore promosso per errore), potrebbe comunque scrivere dati sensibili.
--
-- Soluzione: aggiungere "and public.has_active_consent()" alla condizione di
-- ogni policy di scrittura per Capo, prima nella tabella (squadriglia, evento, etc.)
-- poi nel bucket Storage (archivio). Le policy di lettura (SELECT) restano invariate.
--
-- Pattern: alter policy ... using/with check (...) and public.has_active_consent().
-- Riferimento di stile: 20260812114232_rls_performance_fix.sql.

-- ============================================================================
-- Squadriglia (20260814115509_squadriglia.sql)
-- ============================================================================

alter policy "squadriglia_insert_capo" on public.squadriglia
  with check ((public.is_capo_reparto(reparto_id) or public.is_admin()) and public.has_active_consent());

alter policy "squadriglia_update_capo" on public.squadriglia
  using ((public.is_capo_reparto(reparto_id) or public.is_admin()) and public.has_active_consent())
  with check ((public.is_capo_reparto(reparto_id) or public.is_admin()) and public.has_active_consent());

alter policy "squadriglia_delete_capo" on public.squadriglia
  using ((public.is_capo_reparto(reparto_id) or public.is_admin()) and public.has_active_consent());

-- ============================================================================
-- Evento (20260823100000_reparto_funzionalita.sql)
-- ============================================================================

alter policy "evento_insert_capo" on public.evento
  with check ((public.is_capo_reparto(reparto_id) or public.is_admin()) and public.has_active_consent());

alter policy "evento_update_capo" on public.evento
  using ((public.is_capo_reparto(reparto_id) or public.is_admin()) and public.has_active_consent())
  with check ((public.is_capo_reparto(reparto_id) or public.is_admin()) and public.has_active_consent());

alter policy "evento_delete_capo" on public.evento
  using ((public.is_capo_reparto(reparto_id) or public.is_admin()) and public.has_active_consent());

-- ============================================================================
-- Archivio (20260823120000_archivio_reparto.sql)
-- ============================================================================

alter policy "luogo_insert_capo" on public.luogo
  with check ((public.is_capo_reparto(reparto_id) or public.is_admin()) and public.has_active_consent());

alter policy "luogo_update_capo" on public.luogo
  using ((public.is_capo_reparto(reparto_id) or public.is_admin()) and public.has_active_consent())
  with check ((public.is_capo_reparto(reparto_id) or public.is_admin()) and public.has_active_consent());

alter policy "luogo_delete_capo" on public.luogo
  using ((public.is_capo_reparto(reparto_id) or public.is_admin()) and public.has_active_consent());

alter policy "uscita_insert_capo" on public.uscita
  with check ((public.is_capo_reparto(reparto_id) or public.is_admin()) and public.has_active_consent());

alter policy "uscita_update_capo" on public.uscita
  using ((public.is_capo_reparto(reparto_id) or public.is_admin()) and public.has_active_consent())
  with check ((public.is_capo_reparto(reparto_id) or public.is_admin()) and public.has_active_consent());

alter policy "uscita_delete_capo" on public.uscita
  using ((public.is_capo_reparto(reparto_id) or public.is_admin()) and public.has_active_consent());

alter policy "campo_insert_capo" on public.campo
  with check ((public.is_capo_reparto(reparto_id) or public.is_admin()) and public.has_active_consent());

alter policy "campo_update_capo" on public.campo
  using ((public.is_capo_reparto(reparto_id) or public.is_admin()) and public.has_active_consent())
  with check ((public.is_capo_reparto(reparto_id) or public.is_admin()) and public.has_active_consent());

alter policy "campo_delete_capo" on public.campo
  using ((public.is_capo_reparto(reparto_id) or public.is_admin()) and public.has_active_consent());

-- Nota: le seguenti 4 policy sono state già modificate da
-- 20260824090000_archivio_partecipanti_reparto_fix.sql per aggiungere il controllo
-- di appartenenza allo stesso Reparto. Qui aggiungiamo has_active_consent()
-- preservando il fix già applicato.

alter policy "uscita_partecipante_insert_capo" on public.uscita_partecipante
  with check (
    (
      exists (
        select 1
        from public.uscita u
        join public.profiles p on p.id = uscita_partecipante.profile_id
        where u.id = uscita_partecipante.uscita_id
          and p.reparto_id = u.reparto_id
          and (public.is_capo_reparto(u.reparto_id) or public.is_admin())
      )
    ) and public.has_active_consent()
  );

alter policy "uscita_partecipante_delete_capo" on public.uscita_partecipante
  using (
    (
      exists (
        select 1 from public.uscita u
        where u.id = uscita_partecipante.uscita_id
          and (public.is_capo_reparto(u.reparto_id) or public.is_admin())
      )
    ) and public.has_active_consent()
  );

alter policy "campo_partecipante_insert_capo" on public.campo_partecipante
  with check (
    (
      exists (
        select 1
        from public.campo c
        join public.profiles p on p.id = campo_partecipante.profile_id
        where c.id = campo_partecipante.campo_id
          and p.reparto_id = c.reparto_id
          and (public.is_capo_reparto(c.reparto_id) or public.is_admin())
      )
    ) and public.has_active_consent()
  );

alter policy "campo_partecipante_delete_capo" on public.campo_partecipante
  using (
    (
      exists (
        select 1 from public.campo c
        where c.id = campo_partecipante.campo_id
          and (public.is_capo_reparto(c.reparto_id) or public.is_admin())
      )
    ) and public.has_active_consent()
  );

alter policy "uscita_squadriglia_insert_capo" on public.uscita_squadriglia
  with check (
    (
      exists (
        select 1
        from public.uscita u
        join public.squadriglia s on s.id = uscita_squadriglia.squadriglia_id
        where u.id = uscita_squadriglia.uscita_id
          and s.reparto_id = u.reparto_id
          and (public.is_capo_reparto(u.reparto_id) or public.is_admin())
      )
    ) and public.has_active_consent()
  );

alter policy "uscita_squadriglia_delete_capo" on public.uscita_squadriglia
  using (
    (
      exists (
        select 1 from public.uscita u
        where u.id = uscita_squadriglia.uscita_id
          and (public.is_capo_reparto(u.reparto_id) or public.is_admin())
      )
    ) and public.has_active_consent()
  );

alter policy "campo_squadriglia_insert_capo" on public.campo_squadriglia
  with check (
    (
      exists (
        select 1
        from public.campo c
        join public.squadriglia s on s.id = campo_squadriglia.squadriglia_id
        where c.id = campo_squadriglia.campo_id
          and s.reparto_id = c.reparto_id
          and (public.is_capo_reparto(c.reparto_id) or public.is_admin())
      )
    ) and public.has_active_consent()
  );

alter policy "campo_squadriglia_delete_capo" on public.campo_squadriglia
  using (
    (
      exists (
        select 1 from public.campo c
        where c.id = campo_squadriglia.campo_id
          and (public.is_capo_reparto(c.reparto_id) or public.is_admin())
      )
    ) and public.has_active_consent()
  );

alter policy "documento_archivio_insert_capo" on public.documento_archivio
  with check ((public.is_capo_reparto(reparto_id) or public.is_admin()) and public.has_active_consent());

alter policy "documento_archivio_delete_capo" on public.documento_archivio
  using ((public.is_capo_reparto(reparto_id) or public.is_admin()) and public.has_active_consent());

-- Nota: le policy di Storage (archivio_insert_capo, archivio_update_capo,
-- archivio_delete_capo su storage.objects) già hanno has_active_consent()
-- nella loro definizione originale (20260823120000_archivio_reparto.sql linee
-- 367, 381, 391, 405), quindi non necessitano modifica.
