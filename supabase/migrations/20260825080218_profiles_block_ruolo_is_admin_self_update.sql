-- Fix di sicurezza critico (P11-T02, code review 2026-08-25): `ruolo` e
-- `is_admin` su `profiles` non erano nella lista di colonne bloccate da
-- `profiles_block_self_consent_update` (estesa più volte per reparto_id,
-- squadriglia_id, campi di consenso) — la RLS `profiles_update_own` filtra
-- solo per riga (`auth.uid() = id`), non per colonna, quindi qualunque
-- utente autenticato poteva auto-promuoversi Capo o admin globale con una
-- singola chiamata PostgREST (`update profiles set is_admin = true where id
-- = auth.uid()`), bypassando completamente l'app. Stessa classe di bug già
-- registrata in P10-T01 per `profiles_select_own` (RLS non protegge le
-- colonne), qui sul lato UPDATE.

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
     or new.squadriglia_id is distinct from old.squadriglia_id
     or new.ruolo is distinct from old.ruolo
     or new.is_admin is distinct from old.is_admin then
    raise exception 'stato_consenso_genitoriale, i campi collegati, reparto_id, squadriglia_id, ruolo e is_admin sono gestiti solo da funzioni dedicate (SECURITY DEFINER) o da SQL diretto con app.bypass_rls attivo';
  end if;

  return new;
end;
$$;
