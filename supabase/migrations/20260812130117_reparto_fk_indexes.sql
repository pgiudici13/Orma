-- Fix performance segnalato da get_advisors dopo la migrazione Reparto
-- (P5-T02): FK senza indice di copertura (unindexed_foreign_keys), stesso
-- tipo di fix già applicato in Fase 3 (20260812110000_rls_performance_fix.sql).

create index profiles_reparto_id_idx on public.profiles (reparto_id);
create index richiesta_reparto_reparto_id_idx on public.richiesta_reparto (reparto_id);
create index richiesta_reparto_decisa_da_idx on public.richiesta_reparto (decisa_da);
