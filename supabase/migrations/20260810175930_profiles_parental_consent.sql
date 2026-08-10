-- Profiles: campi di età e consenso genitoriale (DEC-010).
-- Un profilo con stato_consenso_genitoriale = 'in_attesa' non deve essere
-- utilizzabile da nessuna funzionalità applicativa oltre alla pagina di attesa.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null,
  data_nascita date not null,
  consenso_privacy_accettato_at timestamptz,
  privacy_policy_versione text,
  stato_consenso_genitoriale text not null default 'non_richiesto'
    check (stato_consenso_genitoriale in ('non_richiesto', 'in_attesa', 'confermato')),
  genitore_email text,
  consenso_genitoriale_token uuid unique,
  consenso_genitoriale_token_scade_at timestamptz,
  consenso_genitoriale_confermato_at timestamptz,
  created_at timestamptz not null default now(),
  constraint genitore_email_richiesta_se_in_attesa
    check (stato_consenso_genitoriale <> 'in_attesa' or genitore_email is not null)
);

comment on table public.profiles is
  'Profilo applicativo per utente. Include i campi di consenso genitoriale per minori di 14 anni (DEC-010).';
comment on column public.profiles.stato_consenso_genitoriale is
  'non_richiesto: utente >=14 anni o consenso non applicabile. in_attesa: <14 anni, in attesa di conferma del genitore. confermato: conferma ricevuta.';

alter table public.profiles enable row level security;

-- L'utente legge sempre il proprio profilo (serve a mostrare la pagina di attesa).
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

-- L'utente crea solo il proprio profilo, alla registrazione.
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

-- L'utente può aggiornare solo i propri dati anagrafici.
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Un client autenticato normale non deve mai poter cambiare da solo lo stato
-- del proprio consenso genitoriale o la sua data di conferma: quei campi
-- cambiano solo tramite confirm_parental_consent() (SECURITY DEFINER),
-- eseguita fuori da una sessione RLS con set_config('app.bypass_rls', ...).
create or replace function public.profiles_block_self_consent_update()
returns trigger
language plpgsql
as $$
begin
  if current_setting('app.bypass_rls', true) = 'on' then
    return new;
  end if;

  if new.stato_consenso_genitoriale is distinct from old.stato_consenso_genitoriale
     or new.consenso_genitoriale_confermato_at is distinct from old.consenso_genitoriale_confermato_at
     or new.consenso_genitoriale_token is distinct from old.consenso_genitoriale_token then
    raise exception 'stato_consenso_genitoriale e i campi collegati sono gestiti solo da confirm_parental_consent()';
  end if;

  return new;
end;
$$;

create trigger profiles_block_self_consent_update
  before update on public.profiles
  for each row
  execute function public.profiles_block_self_consent_update();

-- Conferma del consenso genitoriale tramite token univoco.
-- SECURITY DEFINER: il genitore non è autenticato come l'utente minore,
-- quindi questa è l'unica via per sbloccare l'account, a valle della verifica del token.
create or replace function public.confirm_parental_consent(p_token uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  perform set_config('app.bypass_rls', 'on', true);

  update public.profiles
  set
    stato_consenso_genitoriale = 'confermato',
    consenso_genitoriale_confermato_at = now(),
    consenso_genitoriale_token = null
  where
    consenso_genitoriale_token = p_token
    and stato_consenso_genitoriale = 'in_attesa'
    and consenso_genitoriale_token_scade_at > now();

  get diagnostics v_count = row_count;
  return v_count > 0;
end;
$$;

revoke all on function public.confirm_parental_consent(uuid) from public;
grant execute on function public.confirm_parental_consent(uuid) to anon, authenticated;
