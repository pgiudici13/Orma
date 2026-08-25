-- Rate limiting applicativo per le azioni pubbliche/anonime più esposte ad
-- abuso (login, registrazione, conferma consenso genitoriale) — P11-T03,
-- decisione del proprietario del progetto (2026-08-25): nessun servizio
-- esterno dedicato, hardening applicativo sullo stack già in uso.

create table public.rate_limit_hit (
  id bigserial primary key,
  chiave text not null,
  creato_at timestamptz not null default now()
);

create index rate_limit_hit_chiave_creato_at_idx
  on public.rate_limit_hit (chiave, creato_at);

alter table public.rate_limit_hit enable row level security;
-- Nessuna policy: la tabella non è mai letta/scritta direttamente da un
-- client (anon/authenticated), solo dalla funzione SECURITY DEFINER sotto,
-- a sua volta richiamabile solo dal service role (vedi i grant/revoke).

create or replace function public.check_rate_limit(
  p_chiave text,
  p_max int,
  p_finestra_minuti int
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conteggio int;
begin
  -- Pulizia opportunistica: nessuna riga ha senso oltre la finestra più
  -- lunga usata dal progetto, un giorno di margine è ampiamente sufficiente.
  delete from public.rate_limit_hit
  where creato_at < now() - interval '1 day';

  select count(*) into v_conteggio
  from public.rate_limit_hit
  where chiave = p_chiave
    and creato_at >= now() - (p_finestra_minuti || ' minutes')::interval;

  if v_conteggio >= p_max then
    return false;
  end if;

  insert into public.rate_limit_hit (chiave) values (p_chiave);
  return true;
end;
$$;

-- Deliberatamente NON concessa ad anon/authenticated: un chiamante esterno
-- con accesso diretto a PostgREST potrebbe altrimenti "riempire" il bucket
-- di una chiave altrui (es. login:ip-email:<vittima>) passando un p_max alto
-- nella propria chiamata, bloccando di fatto un utente legittimo. Chiamata
-- solo dal service role, lato server, con parametri decisi dal codice
-- applicativo — mai passati dal client (lib/rateLimit.ts).
revoke all on function public.check_rate_limit(text, int, int) from public, anon, authenticated;
grant execute on function public.check_rate_limit(text, int, int) to service_role;
