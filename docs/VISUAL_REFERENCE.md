# ORMA — Riferimento visivo (P1-T01)

> Traduzione operativa di [`DESIGN.md`](DESIGN.md) in valori concreti: palette, tipografia, regole d'uso. Nessun tool di generazione immagini è stato usato — questo documento è il "moodboard" scritto, motivato materiale per materiale. Quando la pipeline asset di Fase 3 produrrà texture/foto reali, questo documento resta il riferimento di intento da rispettare.

---

## 1. Materiali di riferimento

Ogni colore nasce da un materiale fisico presente sul tavolo, non da una palette astratta (regola esplicita di `DESIGN.md`: "non definire una palette artificiale prima di avere stabilito l'aspetto del tavolo").

| Materiale | Riferimento reale | Hex | Uso |
| --- | --- | --- | --- |
| Legno chiaro | Piano di un tavolo da campo in abete/faggio, usurato | `#8A6A49` | superficie tavolo, base |
| Legno scuro | Bordi, incisioni, ombra propria degli oggetti sul legno | `#42311F` | bordi tavolo, ombre proiettate, venature |
| Carta naturale | Foglio kraft/carta riciclata non sbiancata | `#E7DEC7` | sfondo carte, fogli sciolti |
| Carta invecchiata | Pagina di taccuino usata, leggermente ingiallita | `#D6C7A1` | pieghe, retro carte, agenda |
| Tessuto | Tela/canvas da zaino o divisa scout, verde oliva scuro | `#3C4A38` | copertina taccuino, dettagli tessuto |
| Metallo | Ottone/alluminio opaco di bussola, fibbie, graffette | `#8D8C7E` | bussola, fermagli, dettagli metallici |
| Inchiostro | Inchiostro/matita su carta chiara, non nero puro | `#2C2216` | testo su carta, contorni |
| Accento | Filo/cordino rosso dei distintivi scout, usato con parsimonia | `#9C3B2B` | stati attivi, piccoli dettagli, mai come sfondo |

Nota deliberata: la carta **non** è un bianco/crema puro (evita l'estetica "moodboard AI" da crema piatta + accento decorativo) — è spostata verso il kraft/khaki, coerente con carta reale non sbiancata. Il tessuto verde oliva, non il rosso, è il colore dominante secondario (memoria visiva della divisa/zaino scout), l'accento rosso resta un dettaglio sporadico (distintivo, cordino), mai un blocco di colore.

## 2. Token semantici

Materializzati in `app/globals.css` come CSS custom properties, esposti a Tailwind via `@theme inline`.

| Token | Valore | Ispirazione | Uso previsto |
| --- | --- | --- | --- |
| `--wood-base` | `#8A6A49` | legno chiaro | superficie tavolo |
| `--wood-dark` | `#42311F` | legno scuro | bordi, ombre, venature |
| `--wood-grain` | `#5C4530` | venatura intermedia | pattern SVG venature (opacità bassa) |
| `--paper-base` | `#E7DEC7` | carta naturale | sfondo carte, fogli |
| `--paper-aged` | `#D6C7A1` | carta invecchiata | retro/pieghe, agenda, taccuino |
| `--fabric-base` | `#3C4A38` | tessuto canvas | copertina taccuino, dettagli tessuto |
| `--metal-base` | `#8D8C7E` | metallo opaco | bussola, fermagli |
| `--ink` | `#2C2216` | inchiostro/matita | testo su carta |
| `--accent` | `#9C3B2B` | filo/distintivo | stato attivo, dettaglio puntuale |

I materiali **non** seguono `prefers-color-scheme`: un tavolo di legno reale non ha un "dark mode fisico". Il blocco `@media (prefers-color-scheme: dark)` esistente in `globals.css` resta limitato a `--background`/`--foreground`, usati dalle superfici di sistema (login, registrazione, form) che restano DOM standard — non dalla scena tavolo.

## 3. Tipografia

- **Sans funzionale — Geist Sans** (già in uso, `next/font/google`): resta per form, date, badge di stato, note personali, ogni informazione funzionale. Nessun costo aggiuntivo, già integrato, molto leggibile.
- **Serif editoriale — Newsreader** (`next/font/google`, pesi 400/500/600, optical sizing): per titoli della scena e contenuto ufficiale delle carte. Scelto invece del più comune Fraunces per restare più vicino a un registro da "diario di campo/quaderno stampato" che a un serif da editoriale patinato — meno decorativo, buon x-height per reggere paragrafi lunghi di contenuto ufficiale, non un display font. Alternativa di ripiego se il risultato in browser non convince: Source Serif 4 (più neutra/istituzionale) — il nome è isolato in `--font-newsreader`/`--font-serif`, sostituirlo non richiede modifiche strutturali.

Regole d'uso:

- Serif (`font-serif`) obbligatorio su: titoli di sezione della scena, nome/contenuto ufficiale delle carte di Specialità/Competenza/Tappa.
- Sans (`font-sans`, Geist) obbligatorio su: date, badge di stato, etichette funzionali, note personali, form.
- Non mischiare le due famiglie nello stesso blocco di testo continuo.

## 4. Checklist "da evitare" (riuso in review di P1-T02 e oltre)

Ripresa diretta dai vincoli di `DESIGN.md`/`CLAUDE.md`:

- niente estetica cartoon, plasticosa, fantasy, videogame;
- niente glassmorphism, niente "AI aesthetic" (gradient sparati, ombre Material generiche `shadow-lg` piatte);
- niente card generiche stile SaaS;
- niente bounce esagerati o transizioni troppo lunghe;
- niente elementi 3D "perché possiamo" (in questa fase non c'è comunque 3D);
- palette sempre derivata dai token sopra, mai hex hardcoded fuori da questo set.
