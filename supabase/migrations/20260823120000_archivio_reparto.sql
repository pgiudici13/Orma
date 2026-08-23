-- Fase 9 — Calendario / Archivio (storico di Reparto) (P9-T01, P9-T02)
-- 1. Schema storico: luogo, uscita, campo, join partecipanti/Squadriglie
-- 2. Metadati documenti/foto (documento_archivio) + bucket Storage privato
--
-- L'archivio è la memoria storica del Reparto (docs/DATA_MODEL.md): uscite e
-- campi passati, luoghi visitati, fotografie e documenti. È separato dal
-- calendario (evento, P7-T03): lì c'è il futuro, qui il ricordo — nessun
-- collegamento obbligato tra i due. RLS coerente con DEC-018: lettura per i
-- membri del Reparto con consenso attivo, scrittura per i Capi del Reparto o
-- l'admin globale. Nessun bucket pubblico per contenuti con minori (SDD §17).

-- ============================================================================
-- 1. Schema storico
-- ============================================================================

create table if not exists public.luogo (
  id uuid primary key default gen_random_uuid(),
  reparto_id uuid not null references public.reparto (id) on delete cascade,
  nome text not null,
  descrizione text,
  created_at timestamptz not null default now(),
  unique (reparto_id, nome)
);

comment on table public.luogo is
  'Luogo visitato dal Reparto (Fase 9): collegabile a più uscite e campi, come memoria storica condivisa.';

create table if not exists public.uscita (
  id uuid primary key default gen_random_uuid(),
  reparto_id uuid not null references public.reparto (id) on delete cascade,
  titolo text not null,
  data date not null,
  programma text,
  materiale text,
  note text,
  luogo_id uuid references public.luogo (id) on delete set null,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

comment on table public.uscita is
  'Uscita passata del Reparto, per l''archivio storico (Fase 9).';

create table if not exists public.campo (
  id uuid primary key default gen_random_uuid(),
  reparto_id uuid not null references public.reparto (id) on delete cascade,
  titolo text not null,
  anno smallint not null check (anno between 1900 and 2200),
  data_inizio date,
  data_fine date,
  luogo_id uuid references public.luogo (id) on delete set null,
  programma text,
  note text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  constraint campo_data_fine_ge_data_inizio check (data_fine is null or data_inizio is null or data_fine >= data_inizio)
);

comment on table public.campo is
  'Campo estivo o evento ampio passato del Reparto (Fase 9): la memoria storica più importante dell''archivio.';

-- Partecipanti e Squadriglie coinvolte (N:N, integrità referenziale reale).
create table if not exists public.uscita_partecipante (
  uscita_id uuid not null references public.uscita (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  primary key (uscita_id, profile_id)
);

create table if not exists public.campo_partecipante (
  campo_id uuid not null references public.campo (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  primary key (campo_id, profile_id)
);

create table if not exists public.uscita_squadriglia (
  uscita_id uuid not null references public.uscita (id) on delete cascade,
  squadriglia_id uuid not null references public.squadriglia (id) on delete cascade,
  primary key (uscita_id, squadriglia_id)
);

create table if not exists public.campo_squadriglia (
  campo_id uuid not null references public.campo (id) on delete cascade,
  squadriglia_id uuid not null references public.squadriglia (id) on delete cascade,
  primary key (campo_id, squadriglia_id)
);

create index if not exists uscita_reparto_id_idx on public.uscita (reparto_id);
create index if not exists campo_reparto_id_idx on public.campo (reparto_id);
create index if not exists luogo_reparto_id_idx on public.luogo (reparto_id);
create index if not exists uscita_luogo_id_idx on public.uscita (luogo_id);
create index if not exists campo_luogo_id_idx on public.campo (luogo_id);

-- ============================================================================
-- 2. Metadati documenti/foto (file in Storage, metadati qui — SDD §17)
-- ============================================================================

create table if not exists public.documento_archivio (
  id uuid primary key default gen_random_uuid(),
  reparto_id uuid not null references public.reparto (id) on delete cascade,
  tipo text not null check (tipo in ('foto', 'documento')),
  entita_tipo text not null check (entita_tipo in ('uscita', 'campo', 'luogo')),
  -- Nessuna FK diretta: il target cambia con entita_tipo (stesso pattern di nota).
  entita_id uuid not null,
  file_path text not null unique,
  nome_file text not null,
  uploaded_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

comment on table public.documento_archivio is
  'Metadati di fotografie e documenti dell''archivio (Fase 9). Il file vive nel bucket privato "archivio" (SDD §17): qui solo il riferimento, mai contenuti minori in bucket pubblici.';

create index if not exists documento_archivio_entita_idx
  on public.documento_archivio (entita_tipo, entita_id);
create index if not exists documento_archivio_reparto_id_idx
  on public.documento_archivio (reparto_id);

-- ============================================================================
-- 3. RLS
-- ============================================================================

-- Il Reparto dell'utente autenticato (con consenso attivo): confronto comune
-- a tutte le policy di lettura dell'archivio.
alter table public.luogo enable row level security;
alter table public.uscita enable row level security;
alter table public.campo enable row level security;
alter table public.uscita_partecipante enable row level security;
alter table public.campo_partecipante enable row level security;
alter table public.uscita_squadriglia enable row level security;
alter table public.campo_squadriglia enable row level security;
alter table public.documento_archivio enable row level security;

create policy "luogo_select_reparto"
  on public.luogo for select
  using (
    public.has_active_consent()
    and reparto_id = (select p.reparto_id from public.profiles p where p.id = auth.uid())
  );

create policy "luogo_insert_capo"
  on public.luogo for insert
  with check (public.is_capo_reparto(reparto_id) or public.is_admin());

create policy "luogo_update_capo"
  on public.luogo for update
  using (public.is_capo_reparto(reparto_id) or public.is_admin())
  with check (public.is_capo_reparto(reparto_id) or public.is_admin());

create policy "luogo_delete_capo"
  on public.luogo for delete
  using (public.is_capo_reparto(reparto_id) or public.is_admin());

create policy "uscita_select_reparto"
  on public.uscita for select
  using (
    public.has_active_consent()
    and reparto_id = (select p.reparto_id from public.profiles p where p.id = auth.uid())
  );

create policy "uscita_insert_capo"
  on public.uscita for insert
  with check (public.is_capo_reparto(reparto_id) or public.is_admin());

create policy "uscita_update_capo"
  on public.uscita for update
  using (public.is_capo_reparto(reparto_id) or public.is_admin())
  with check (public.is_capo_reparto(reparto_id) or public.is_admin());

create policy "uscita_delete_capo"
  on public.uscita for delete
  using (public.is_capo_reparto(reparto_id) or public.is_admin());

create policy "campo_select_reparto"
  on public.campo for select
  using (
    public.has_active_consent()
    and reparto_id = (select p.reparto_id from public.profiles p where p.id = auth.uid())
  );

create policy "campo_insert_capo"
  on public.campo for insert
  with check (public.is_capo_reparto(reparto_id) or public.is_admin());

create policy "campo_update_capo"
  on public.campo for update
  using (public.is_capo_reparto(reparto_id) or public.is_admin())
  with check (public.is_capo_reparto(reparto_id) or public.is_admin());

create policy "campo_delete_capo"
  on public.campo for delete
  using (public.is_capo_reparto(reparto_id) or public.is_admin());

-- Join: la visibilità segue il genitore (l'entità storica a cui appartengono),
-- mai un confronto diretto con il proprio Reparto: la riga di join non lo ha.
create policy "uscita_partecipante_select_reparto"
  on public.uscita_partecipante for select
  using (
    public.has_active_consent()
    and exists (
      select 1 from public.uscita u
      where u.id = uscita_partecipante.uscita_id
        and u.reparto_id = (select p.reparto_id from public.profiles p where p.id = auth.uid())
    )
  );

create policy "uscita_partecipante_insert_capo"
  on public.uscita_partecipante for insert
  with check (
    exists (
      select 1 from public.uscita u
      where u.id = uscita_partecipante.uscita_id
        and (public.is_capo_reparto(u.reparto_id) or public.is_admin())
    )
  );

create policy "uscita_partecipante_delete_capo"
  on public.uscita_partecipante for delete
  using (
    exists (
      select 1 from public.uscita u
      where u.id = uscita_partecipante.uscita_id
        and (public.is_capo_reparto(u.reparto_id) or public.is_admin())
    )
  );

create policy "campo_partecipante_select_reparto"
  on public.campo_partecipante for select
  using (
    public.has_active_consent()
    and exists (
      select 1 from public.campo c
      where c.id = campo_partecipante.campo_id
        and c.reparto_id = (select p.reparto_id from public.profiles p where p.id = auth.uid())
    )
  );

create policy "campo_partecipante_insert_capo"
  on public.campo_partecipante for insert
  with check (
    exists (
      select 1 from public.campo c
      where c.id = campo_partecipante.campo_id
        and (public.is_capo_reparto(c.reparto_id) or public.is_admin())
    )
  );

create policy "campo_partecipante_delete_capo"
  on public.campo_partecipante for delete
  using (
    exists (
      select 1 from public.campo c
      where c.id = campo_partecipante.campo_id
        and (public.is_capo_reparto(c.reparto_id) or public.is_admin())
    )
  );

create policy "uscita_squadriglia_select_reparto"
  on public.uscita_squadriglia for select
  using (
    public.has_active_consent()
    and exists (
      select 1 from public.uscita u
      where u.id = uscita_squadriglia.uscita_id
        and u.reparto_id = (select p.reparto_id from public.profiles p where p.id = auth.uid())
    )
  );

create policy "uscita_squadriglia_insert_capo"
  on public.uscita_squadriglia for insert
  with check (
    exists (
      select 1 from public.uscita u
      where u.id = uscita_squadriglia.uscita_id
        and (public.is_capo_reparto(u.reparto_id) or public.is_admin())
    )
  );

create policy "uscita_squadriglia_delete_capo"
  on public.uscita_squadriglia for delete
  using (
    exists (
      select 1 from public.uscita u
      where u.id = uscita_squadriglia.uscita_id
        and (public.is_capo_reparto(u.reparto_id) or public.is_admin())
    )
  );

create policy "campo_squadriglia_select_reparto"
  on public.campo_squadriglia for select
  using (
    public.has_active_consent()
    and exists (
      select 1 from public.campo c
      where c.id = campo_squadriglia.campo_id
        and c.reparto_id = (select p.reparto_id from public.profiles p where p.id = auth.uid())
    )
  );

create policy "campo_squadriglia_insert_capo"
  on public.campo_squadriglia for insert
  with check (
    exists (
      select 1 from public.campo c
      where c.id = campo_squadriglia.campo_id
        and (public.is_capo_reparto(c.reparto_id) or public.is_admin())
    )
  );

create policy "campo_squadriglia_delete_capo"
  on public.campo_squadriglia for delete
  using (
    exists (
      select 1 from public.campo c
      where c.id = campo_squadriglia.campo_id
        and (public.is_capo_reparto(c.reparto_id) or public.is_admin())
    )
  );

create policy "documento_archivio_select_reparto"
  on public.documento_archivio for select
  using (
    public.has_active_consent()
    and reparto_id = (select p.reparto_id from public.profiles p where p.id = auth.uid())
  );

create policy "documento_archivio_insert_capo"
  on public.documento_archivio for insert
  with check (public.is_capo_reparto(reparto_id) or public.is_admin());

create policy "documento_archivio_delete_capo"
  on public.documento_archivio for delete
  using (public.is_capo_reparto(reparto_id) or public.is_admin());

-- ============================================================================
-- 4. Storage: bucket privato "archivio" e policy
-- ============================================================================
--
-- Percorso dei file: archivio/{reparto_id}/{entita_tipo}/{entita_id}/{file}.
-- Il Reparto è nel percorso: le policy di Storage lo estraggono con
-- storage.foldername(name)[1]. Nessun bucket pubblico: foto e documenti
-- contengono minori e momenti privati del Reparto (SDD §17).

insert into storage.buckets (id, name, public)
values ('archivio', 'archivio', false)
on conflict (id) do nothing;

-- Lettura: solo i membri dello stesso Reparto (con consenso attivo).
create policy "archivio_select_reparto"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'archivio'
    and public.has_active_consent()
    and (storage.foldername(name))[1] = (
      select p.reparto_id::text from public.profiles p where p.id = auth.uid()
    )
  );

-- Scrittura: solo i Capi del Reparto indicato nel percorso, o l'admin globale.
-- Il cast a uuid è protetto da una regex: un percorso senza Reparto valido non
-- deve far esplodere la policy con un errore di conversione.
create policy "archivio_insert_capo"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'archivio'
    and public.has_active_consent()
    and (storage.foldername(name))[1] is not null
    and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and (
      public.is_admin()
      or public.is_capo_reparto(((storage.foldername(name))[1])::uuid)
    )
  );

create policy "archivio_update_capo"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'archivio'
    and public.has_active_consent()
    and (storage.foldername(name))[1] is not null
    and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and (
      public.is_admin()
      or public.is_capo_reparto(((storage.foldername(name))[1])::uuid)
    )
  )
  with check (
    bucket_id = 'archivio'
    and public.has_active_consent()
    and (storage.foldername(name))[1] is not null
    and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and (
      public.is_admin()
      or public.is_capo_reparto(((storage.foldername(name))[1])::uuid)
    )
  );

create policy "archivio_delete_capo"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'archivio'
    and public.has_active_consent()
    and (storage.foldername(name))[1] is not null
    and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and (
      public.is_admin()
      or public.is_capo_reparto(((storage.foldername(name))[1])::uuid)
    )
  );
