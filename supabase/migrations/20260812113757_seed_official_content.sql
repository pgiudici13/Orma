-- Seed contenuto ufficiale (P3-T02b), generato da scripts/generate-seed.ts
-- a partire da assets/processed/distintivi/manifest.json. Non modificare a
-- mano: rigenerare con `node scripts/generate-seed.ts` dopo aver rilanciato
-- `node scripts/process-cards.ts`.
--
-- Nessuna relazione brevetto_specialita: la composizione di ogni brevetto
-- (quali Specialità lo formano) non è nota da nessuna fonte disponibile e non
-- va inventata (CLAUDE.md) — da popolare quando arriva materiale ufficiale.
--
-- Competenza non ha un catalogo fisso (progetti personalizzati, DEC-005):
-- seed minimo di poche voci di esempio, chiaramente segnaposto.

insert into public.specialita (slug, nome, immagine_path)
values
  ('allevatore', 'Allevatore', 'distintivi/specialita/allevatore.webp'),
  ('alpinista', 'Alpinista', 'distintivi/specialita/alpinista.webp'),
  ('amico-degli-animali', 'Amico degli animali', 'distintivi/specialita/amico-degli-animali.webp'),
  ('amico-del-quartiere', 'Amico del quartiere', 'distintivi/specialita/amico-del-quartiere.webp'),
  ('archeologo', 'Archeologo', 'distintivi/specialita/archeologo.webp'),
  ('artigiano', 'Artigiano', 'distintivi/specialita/artigiano.webp'),
  ('artista-di-strada', 'Artista di strada', 'distintivi/specialita/artista-di-strada.webp'),
  ('astronomo', 'Astronomo', 'distintivi/specialita/astronomo.webp'),
  ('atleta', 'Atleta', 'distintivi/specialita/atleta.webp'),
  ('attore', 'Attore', 'distintivi/specialita/attore.webp'),
  ('battelliere', 'Battelliere', 'distintivi/specialita/battelliere.webp'),
  ('boscaiolo', 'Boscaiolo', 'distintivi/specialita/boscaiolo.webp'),
  ('botanico', 'Botanico', 'distintivi/specialita/botanico.webp'),
  ('campeggiatore', 'Campeggiatore', 'distintivi/specialita/campeggiatore.webp'),
  ('canoista', 'Canoista', 'distintivi/specialita/canoista.webp'),
  ('cantante', 'Cantante', 'distintivi/specialita/cantante.webp'),
  ('carpentiere-navale', 'Carpentiere navale', 'distintivi/specialita/carpentiere-navale.webp'),
  ('ciclista', 'Ciclista', 'distintivi/specialita/ciclista.webp'),
  ('collezionista', 'Collezionista', 'distintivi/specialita/collezionista.webp'),
  ('coltivatore', 'Coltivatore', 'distintivi/specialita/coltivatore.webp'),
  ('corrispondente', 'Corrispondente', 'distintivi/specialita/corrispondente.webp'),
  ('corrispondente-radio', 'Corrispondente radio', 'distintivi/specialita/corrispondente-radio.webp'),
  ('cuoco', 'Cuoco', 'distintivi/specialita/cuoco.webp'),
  ('danzatore', 'Danzatore', 'distintivi/specialita/danzatore.webp'),
  ('disegnatore', 'Disegnatore', 'distintivi/specialita/disegnatore.webp'),
  ('elettricista', 'Elettricista', 'distintivi/specialita/elettricista.webp'),
  ('elettronico', 'Elettronico', 'distintivi/specialita/elettronico.webp'),
  ('esperto-del-computer', 'Esperto del computer', 'distintivi/specialita/esperto-del-computer.webp'),
  ('europeista', 'Europeista', 'distintivi/specialita/europeista.webp'),
  ('falegname', 'Falegname', 'distintivi/specialita/falegname.webp'),
  ('folclorista', 'Folclorista', 'distintivi/specialita/folclorista.webp'),
  ('fotografo', 'Fotografo', 'distintivi/specialita/fotografo.webp'),
  ('geologo', 'Geologo', 'distintivi/specialita/geologo.webp'),
  ('giardiniere', 'Giardiniere', 'distintivi/specialita/giardiniere.webp'),
  ('giocattolaio', 'Giocattolaio', 'distintivi/specialita/giocattolaio.webp'),
  ('grafico', 'Grafico', 'distintivi/specialita/grafico.webp'),
  ('guida', 'Guida', 'distintivi/specialita/guida.webp'),
  ('guida-marina', 'Guida Marina', 'distintivi/specialita/guida-marina.webp'),
  ('hebertista', 'Hebertista', 'distintivi/specialita/hebertista.webp'),
  ('idraulico', 'Idraulico', 'distintivi/specialita/idraulico.webp'),
  ('infermiere', 'Infermiere', 'distintivi/specialita/infermiere.webp'),
  ('interprete', 'Interprete', 'distintivi/specialita/interprete.webp'),
  ('lavoratore-in-cuoio', 'Lavoratore in cuoio', 'distintivi/specialita/lavoratore-in-cuoio.webp'),
  ('maestro-dei-giochi', 'Maestro dei giochi', 'distintivi/specialita/maestro-dei-giochi.webp'),
  ('maestro-dei-nodi', 'Maestro dei nodi', 'distintivi/specialita/maestro-dei-nodi.webp'),
  ('meccanico', 'Meccanico', 'distintivi/specialita/meccanico.webp'),
  ('modellista', 'Modellista', 'distintivi/specialita/modellista.webp'),
  ('muratore', 'Muratore', 'distintivi/specialita/muratore.webp'),
  ('musicista', 'Musicista', 'distintivi/specialita/musicista.webp'),
  ('nuotatore', 'Nuotatore', 'distintivi/specialita/nuotatore.webp'),
  ('omnia', 'Omnia', 'distintivi/specialita/omnia.webp'),
  ('osservatore', 'Osservatore', 'distintivi/specialita/osservatore.webp'),
  ('osservatore-meteo', 'Osservatore meteo', 'distintivi/specialita/osservatore-meteo.webp'),
  ('pescatore', 'Pescatore', 'distintivi/specialita/pescatore.webp'),
  ('pompiere', 'Pompiere', 'distintivi/specialita/pompiere.webp'),
  ('redattore', 'Redattore', 'distintivi/specialita/redattore.webp'),
  ('regista', 'Regista', 'distintivi/specialita/regista.webp'),
  ('sarto', 'Sarto', 'distintivi/specialita/sarto.webp'),
  ('scenografo', 'Scenografo', 'distintivi/specialita/scenografo.webp'),
  ('segnalatore', 'Segnalatore', 'distintivi/specialita/segnalatore.webp'),
  ('servizio-della-parola', 'Servizio della parola', 'distintivi/specialita/servizio-della-parola.webp'),
  ('servizio-liturgico', 'Servizio liturgico', 'distintivi/specialita/servizio-liturgico.webp'),
  ('servizio-missionario', 'Servizio missionario', 'distintivi/specialita/servizio-missionario.webp'),
  ('topografo', 'Topografo', 'distintivi/specialita/topografo.webp'),
  ('velista', 'Velista', 'distintivi/specialita/velista.webp')
on conflict (slug) do nothing;

insert into public.tappa (slug, nome, ordine, immagine_path)
values
  ('competenza', 'Competenza', 2, 'distintivi/tappe/competenza.webp'),
  ('responsabilita', 'Responsabilità', 3, 'distintivi/tappe/responsabilita.webp'),
  ('scoperta', 'Scoperta', 1, 'distintivi/tappe/scoperta.webp')
on conflict (slug) do nothing;

insert into public.brevetto (slug, nome, immagine_path)
values
  ('amico-della-natura', 'Amico della natura', 'distintivi/brevetti/amico-della-natura.webp'),
  ('animazione-espressiva', 'Animazione espressiva', 'distintivi/brevetti/animazione-espressiva.webp'),
  ('animazione-giornalistica', 'Animazione giornalistica', 'distintivi/brevetti/animazione-giornalistica.webp'),
  ('animazione-grafica-e-multimediale', 'Animazione grafica e multimediale', 'distintivi/brevetti/animazione-grafica-e-multimediale.webp'),
  ('animazione-internazionale', 'Animazione internazionale', 'distintivi/brevetti/animazione-internazionale.webp'),
  ('animazione-religiosa', 'Animazione religiosa', 'distintivi/brevetti/animazione-religiosa.webp'),
  ('animazione-sportiva', 'Animazione sportiva', 'distintivi/brevetti/animazione-sportiva.webp'),
  ('esploratore-delle-acque', 'Esploratore delle acque', 'distintivi/brevetti/esploratore-delle-acque.webp'),
  ('guida-alpina', 'Guida alpina', 'distintivi/brevetti/guida-alpina.webp'),
  ('maestro-delle-tecnologie', 'Maestro delle tecnologie', 'distintivi/brevetti/maestro-delle-tecnologie.webp'),
  ('mani-abili', 'Mani abili', 'distintivi/brevetti/mani-abili.webp'),
  ('pioniere', 'Pioniere', 'distintivi/brevetti/pioniere.webp'),
  ('sherpa', 'Sherpa', 'distintivi/brevetti/sherpa.webp'),
  ('soccorso', 'Soccorso', 'distintivi/brevetti/soccorso.webp'),
  ('trappeur', 'Trappeur', 'distintivi/brevetti/trappeur.webp')
on conflict (slug) do nothing;

-- Competenza: seed segnaposto, da sostituire con contenuto reale quando
-- disponibile (DEC-005, nessuna fonte per un catalogo Competenze).
insert into public.competenza (slug, nome, descrizione)
values
  ('educazione-alla-fede', 'Educazione alla Fede', 'Voce segnaposto: contenuto reale da definire.'),
  ('educazione-alla-affettivita', 'Educazione all''Affettività', 'Voce segnaposto: contenuto reale da definire.'),
  ('educazione-alla-corporeita', 'Educazione alla Corporeità', 'Voce segnaposto: contenuto reale da definire.'),
  ('educazione-al-servizio', 'Educazione al Servizio', 'Voce segnaposto: contenuto reale da definire.'),
  ('educazione-alla-cittadinanza', 'Educazione alla Cittadinanza', 'Voce segnaposto: contenuto reale da definire.')
on conflict (slug) do nothing;
