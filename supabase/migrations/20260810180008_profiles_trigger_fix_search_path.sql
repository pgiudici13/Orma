-- Fix: profiles_block_self_consent_update aveva search_path mutabile
-- (Supabase security advisor: function_search_path_mutable).

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
     or new.consenso_genitoriale_token is distinct from old.consenso_genitoriale_token then
    raise exception 'stato_consenso_genitoriale e i campi collegati sono gestiti solo da confirm_parental_consent()';
  end if;

  return new;
end;
$$;
