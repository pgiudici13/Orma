-- Modello di ruolo Reparto (P6-T03, DEC-017): ruolo unico "Capo", scoped al
-- proprio Reparto, che fonde "Capo" e "Admin di Reparto" (docs/SDD.md §6).
-- Distinto da profiles.is_admin (DEC-015): quello resta un permesso globale
-- del proprietario del progetto, questo è locale al Reparto del profilo.

alter table public.profiles
  add column ruolo text not null default 'eg'
    check (ruolo in ('eg', 'capo'));

comment on column public.profiles.ruolo is
  'Ruolo scoped al Reparto del profilo (DEC-017). "capo" fonde Capo e Admin di Reparto (docs/SDD.md §6). Attivato manualmente via SQL dal proprietario del progetto, stesso pattern non derogabile di is_admin (DEC-015): nessuna UI.';

-- Vero se l'utente corrente è Capo del Reparto indicato. Stesso pattern di
-- is_admin() (20260812120000_admin_visibility.sql): stable, security invoker,
-- legge solo il proprio profilo (nessun bypass RLS necessario).
create or replace function public.is_capo_reparto(target_reparto_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.ruolo = 'capo'
      and p.reparto_id = target_reparto_id
  );
$$;

comment on function public.is_capo_reparto is
  'Vero se il profilo autenticato è Capo (DEC-017) del Reparto target_reparto_id. Usata dalle policy RLS scoped-per-Reparto (squadriglia, richiesta_reparto, profiles) e da decidi_richiesta_reparto().';
