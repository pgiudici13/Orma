-- Fix (P11-T01, code review 2026-08-25): dopo aver associato un Maestro
-- interno a una Specialità/Competenza, il suo nome non veniva mai mostrato —
-- `lib/queries/cards.ts` leggeva `maestro_profile:maestro_profile_id(nome)`
-- come embed PostgREST su `profiles`, ma la RLS di `profiles` (P10-T01) non
-- concede più la visibilità "stesso Reparto" con cui questo embed
-- funzionava prima del fix di sicurezza — l'embed torna sempre null anche
-- quando `maestro_profile_id` è valorizzato, quindi il pannello mostra
-- sempre "Nessun Maestro associato" e il modulo di associazione, mai il
-- nome. Stesso pattern già usato per `membri_reparto()`/`cerca_maestri()`:
-- una funzione SECURITY DEFINER che espone solo `id`/`nome`, scoped alle
-- proprie associazioni, non un allargamento della RLS di `profiles`.

create or replace function public.maestri_interni_nomi()
returns table (profile_id uuid, nome text)
language sql
security definer
set search_path = public
stable
as $$
  select p.id, p.nome
  from public.profiles p
  where p.id in (
    select maestro_profile_id from public.user_specialita
    where profile_id = (select auth.uid()) and maestro_profile_id is not null
    union
    select maestro_profile_id from public.user_competenza
    where profile_id = (select auth.uid()) and maestro_profile_id is not null
  );
$$;

revoke all on function public.maestri_interni_nomi() from public, anon;
grant execute on function public.maestri_interni_nomi() to authenticated;
