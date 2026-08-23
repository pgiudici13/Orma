-- Onboarding Reparto (P5-T02, DEC-016): un nuovo utente richiede
-- l'associazione a un Reparto esistente; un admin (profiles.is_admin,
-- DEC-015, permesso temporaneo — vedi DEC-016) approva o rifiuta.
--
-- Squadriglia resta interamente fuori scope (Fase 6/7): questa migrazione
-- crea solo lo schema minimo di Reparto necessario a sbloccare l'onboarding.

-- Contenuto gestito manualmente dal proprietario del progetto (stesso
-- principio di DEC-008 per il contenuto ufficiale): nessuna scrittura
-- applicativa, seed solo via migrazione/SQL diretto.
create table public.reparto (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  created_at timestamptz not null default now()
);

alter table public.reparto enable row level security;

create policy "reparto_select_authenticated"
  on public.reparto for select
  to authenticated
  using (true);

comment on table public.reparto is
  'Reparto scout. Seedato a mano dal proprietario del progetto, nessuna policy insert/update/delete (stesso principio di DEC-008).';

-- Appartenenza materializzata: un solo Reparto attivo per utente (SDD §18),
-- popolata solo dall'approvazione tramite decidi_richiesta_reparto().
alter table public.profiles
  add column reparto_id uuid references public.reparto (id) on delete set null;

comment on column public.profiles.reparto_id is
  'Reparto approvato per questo utente. Scritto solo da decidi_richiesta_reparto() (SECURITY DEFINER), mai dal client direttamente — vedi profiles_block_self_consent_update.';

-- Richieste di associazione: storico, una sola "in_attesa" per utente.
create table public.richiesta_reparto (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  reparto_id uuid not null references public.reparto (id) on delete cascade,
  stato text not null default 'in_attesa'
    check (stato in ('in_attesa', 'approvata', 'rifiutata')),
  created_at timestamptz not null default now(),
  decisa_at timestamptz,
  decisa_da uuid references public.profiles (id)
);

create unique index richiesta_reparto_one_pending_per_profile
  on public.richiesta_reparto (profile_id)
  where stato = 'in_attesa';

comment on table public.richiesta_reparto is
  'Richieste di associazione utente-Reparto (P5-T02). Decise solo tramite decidi_richiesta_reparto() (SECURITY DEFINER): nessuna policy update/delete applicativa.';

alter table public.richiesta_reparto enable row level security;

create policy "richiesta_reparto_select_own_or_admin"
  on public.richiesta_reparto for select
  using (
    (select auth.uid()) = profile_id
    or public.is_admin()
  );

create policy "richiesta_reparto_insert_own"
  on public.richiesta_reparto for insert
  with check ((select auth.uid()) = profile_id);

-- Estende il trigger esistente (P5-T00): reparto_id non è auto-modificabile
-- dall'utente, stesso principio dei campi di consenso genitoriale.
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
     or new.reparto_id is distinct from old.reparto_id then
    raise exception 'stato_consenso_genitoriale, i campi collegati e reparto_id sono gestiti solo da funzioni dedicate (SECURITY DEFINER)';
  end if;

  return new;
end;
$$;

-- Decisione admin: approva/rifiuta, atomica. Nessuna policy UPDATE per admin
-- su profiles/richiesta_reparto: l'unico punto di scrittura privilegiata è
-- questa funzione, per non violare l'invariante "sola lettura" di DEC-015.
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
  if not public.is_admin() then
    raise exception 'Solo un admin può decidere una richiesta di Reparto.';
  end if;
  if p_esito not in ('approvata', 'rifiutata') then
    raise exception 'Esito non valido: %', p_esito;
  end if;

  select profile_id, reparto_id into v_profile_id, v_reparto_id
  from public.richiesta_reparto
  where id = p_richiesta_id and stato = 'in_attesa'
  for update;

  if v_profile_id is null then
    raise exception 'Richiesta non trovata o già decisa.';
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
  'Approva/rifiuta una richiesta di Reparto. Permesso basato su profiles.is_admin (DEC-015), placeholder temporaneo: da sostituire con un ruolo Capo/Admin-di-Reparto scoped-per-Reparto in P6-T03 (vedi DEC-016).';

revoke all on function public.decidi_richiesta_reparto(uuid, text) from public;
grant execute on function public.decidi_richiesta_reparto(uuid, text) to authenticated;
-- I privilegi di default del progetto concedono EXECUTE ad anon su ogni
-- nuova funzione in public, indipendentemente da `revoke ... from public`
-- (vedi correzione in .claude/CORRECTIONS.md, scoperta con find_profile_by_email).
revoke execute on function public.decidi_richiesta_reparto(uuid, text) from anon;
