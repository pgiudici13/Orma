-- Ricerca Maestro interno per email esatta (P4-T02).
--
-- Reparto (Fase 6/7) e ricerca globale Maestri (Fase 8) non esistono ancora,
-- e un utente normale non può leggere il profilo di un altro (RLS profiles
-- limitata a auth.uid()). Questa funzione è l'unica via, in questa fase, per
-- trovare l'id di un altro utente ORMA da associare come Maestro: prende
-- un'email esatta (nessuna ricerca parziale/elenco) e restituisce solo id e
-- nome, mai altri dati personali. SECURITY DEFINER perché deve leggere
-- auth.users (email) e profiles di un utente diverso da chi chiama.
create or replace function public.find_profile_by_email(p_email text)
returns table (id uuid, nome text)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.nome
  from public.profiles p
  join auth.users u on u.id = p.id
  where lower(u.email) = lower(p_email)
    and p.stato_consenso_genitoriale <> 'in_attesa'
  limit 1;
$$;

revoke all on function public.find_profile_by_email(text) from public;
grant execute on function public.find_profile_by_email(text) to authenticated;
