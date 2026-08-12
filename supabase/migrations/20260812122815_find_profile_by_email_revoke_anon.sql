-- I privilegi di default del progetto concedono EXECUTE ad anon su ogni
-- nuova funzione in public, indipendentemente da `revoke ... from public`
-- (PUBLIC è uno pseudo-ruolo distinto da anon). Questa funzione restituisce
-- id+nome di un profilo dato un'email esatta: non deve essere richiamabile
-- da chi non è autenticato (get_advisors, anon_security_definer_function_executable).
revoke execute on function public.find_profile_by_email(text) from anon;
