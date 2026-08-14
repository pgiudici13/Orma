-- Integra il ruolo Capo (DEC-017) con l'onboarding Reparto esistente
-- (P5-T02): chiude DEC-016, che vincolava decidi_richiesta_reparto() al solo
-- flag globale is_admin (DEC-015) in attesa del modello di ruolo di Fase 6.

-- Il Capo vede le richieste dirette al proprio Reparto, oltre alle policy
-- già esistenti (propria richiesta, admin globale). Permissiva additiva:
-- nessuna policy esistente modificata.
create policy "richiesta_reparto_select_capo"
  on public.richiesta_reparto for select
  using (public.is_capo_reparto(reparto_id));

-- Il Capo deve poter leggere il nome di chi ha una richiesta pendente verso
-- il proprio Reparto per mostrarla in app/admin/richieste-reparto — il
-- richiedente ha reparto_id ancora nullo (non è stato approvato), quindi lo
-- scoping non può passare da profiles.reparto_id come in profiles_select_admin,
-- ma dalla richiesta stessa. Vincolo DEC-010 invariato: un profilo in attesa
-- di consenso genitoriale resta invisibile anche al Capo.
create policy "profiles_select_capo_pending_request"
  on public.profiles for select
  using (
    stato_consenso_genitoriale <> 'in_attesa'
    and exists (
      select 1 from public.richiesta_reparto rr
      where rr.profile_id = profiles.id
        and rr.stato = 'in_attesa'
        and public.is_capo_reparto(rr.reparto_id)
    )
  );

-- Permesso di decisione: admin globale o Capo del Reparto della richiesta.
create or replace function public.decidi_richiesta_reparto(
  p_richiesta_id uuid,
  p_esito text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid;
  v_reparto_id uuid;
begin
  if p_esito not in ('approvata', 'rifiutata') then
    raise exception 'Esito non valido: %', p_esito;
  end if;

  -- L'autorizzazione è nella WHERE, non in un controllo separato dopo la
  -- select: così un chiamante non autorizzato riceve lo stesso errore
  -- generico di un id inesistente/già deciso, senza rivelare che una
  -- richiesta pendente esiste per un Reparto che non gli compete.
  select profile_id, reparto_id into v_profile_id, v_reparto_id
  from public.richiesta_reparto
  where id = p_richiesta_id
    and stato = 'in_attesa'
    and (public.is_admin() or public.is_capo_reparto(reparto_id))
  for update;

  if v_profile_id is null then
    raise exception 'Richiesta non trovata, già decisa, o permesso insufficiente.';
  end if;

  update public.richiesta_reparto
  set stato = p_esito, decisa_at = now(), decisa_da = (select auth.uid())
  where id = p_richiesta_id;

  if p_esito = 'approvata' then
    perform set_config('app.bypass_rls', 'on', true);
    update public.profiles set reparto_id = v_reparto_id where id = v_profile_id;
  end if;
end;
$$;

comment on function public.decidi_richiesta_reparto is
  'Approva/rifiuta una richiesta di Reparto. Permesso: profiles.is_admin (DEC-015) o Capo del Reparto della richiesta (is_capo_reparto, DEC-017) — sostituisce il riuso temporaneo di is_admin descritto in DEC-016.';
