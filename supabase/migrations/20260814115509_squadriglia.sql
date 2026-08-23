-- Schema Squadriglia (P6-T01). Appartiene a un Reparto (docs/DATA_MODEL.md).
-- Solo schema/RLS in questa fase: l'assegnazione utente↔Squadriglia (funzione
-- + UI) è fuori scope qui, rimandata a P7-T02 insieme alla vista "Squadriglie"
-- — coerente con "Squadriglia resta fuori scope" già dichiarato in P5-T02.

create table public.squadriglia (
  id uuid primary key default gen_random_uuid(),
  reparto_id uuid not null references public.reparto (id) on delete cascade,
  nome text not null,
  created_at timestamptz not null default now(),
  unique (reparto_id, nome)
);

-- Indice FK creato subito (non a posteriori): lezione delle fasi precedenti,
-- vedi 20260812110000_rls_performance_fix.sql e 20260812130600_reparto_fk_indexes.sql.
create index squadriglia_reparto_id_idx on public.squadriglia (reparto_id);

comment on table public.squadriglia is
  'Squadriglia, appartiene a un Reparto. Scrittura riservata al Capo del Reparto (DEC-017) o all''admin globale (DEC-015).';

alter table public.squadriglia enable row level security;

-- SELECT scoped al proprio Reparto: a differenza di `reparto` (nomi
-- leggibili da chiunque per l'onboarding), la Squadriglia è dato di Reparto
-- (docs/PERMISSIONS.md — "non deve poter accedere automaticamente ai dati di
-- altri Reparti").
create policy "squadriglia_select_own_reparto"
  on public.squadriglia for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.reparto_id = squadriglia.reparto_id
    )
    or public.is_admin()
  );

create policy "squadriglia_insert_capo"
  on public.squadriglia for insert
  with check (public.is_capo_reparto(reparto_id) or public.is_admin());

create policy "squadriglia_update_capo"
  on public.squadriglia for update
  using (public.is_capo_reparto(reparto_id) or public.is_admin())
  with check (public.is_capo_reparto(reparto_id) or public.is_admin());

create policy "squadriglia_delete_capo"
  on public.squadriglia for delete
  using (public.is_capo_reparto(reparto_id) or public.is_admin());

-- Appartenenza del profilo alla Squadriglia (nullable: non tutti i membri
-- sono già assegnati). Scritta solo da una funzione dedicata SECURITY
-- DEFINER, che arriverà in P7-T02 insieme alla UI di assegnazione — qui solo
-- lo schema e il blocco alla scrittura self-service.
alter table public.profiles
  add column squadriglia_id uuid references public.squadriglia (id) on delete set null;

create index profiles_squadriglia_id_idx on public.profiles (squadriglia_id);

comment on column public.profiles.squadriglia_id is
  'Squadriglia assegnata a questo profilo. Scritta solo dal Capo del proprio Reparto o dall''admin (DEC-017): l''utente non può auto-assegnarsi, stesso principio di reparto_id. Funzione di assegnazione dedicata in arrivo con P7-T02.';

-- Estende il trigger esistente (P5-T02): squadriglia_id non è
-- auto-modificabile dall'utente, stesso principio di reparto_id e dei campi
-- di consenso genitoriale.
create or replace function public.profiles_block_self_consent_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_setting('app.bypass_rls', true) = 'on' then
    return new;
  end if;

  if new.stato_consenso_genitoriale is distinct from old.stato_consenso_genitoriale
     or new.consenso_genitoriale_confermato_at is distinct from old.consenso_genitoriale_confermato_at
     or new.consenso_genitoriale_token is distinct from old.consenso_genitoriale_token
     or new.reparto_id is distinct from old.reparto_id
     or new.squadriglia_id is distinct from old.squadriglia_id then
    raise exception 'stato_consenso_genitoriale, i campi collegati, reparto_id e squadriglia_id sono gestiti solo da funzioni dedicate (SECURITY DEFINER)';
  end if;

  return new;
end;
$$;
