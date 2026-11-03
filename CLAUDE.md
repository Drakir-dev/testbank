# Testbank Fysio

En mobilvennlig app for fysioterapeuter på Ahus. Brukeren velger kliniske tester og PROM-skjemaer, fyller inn resultater og får en ferdig tekst som kopieres inn i journalnotatet i DIPS. Appen er en PWA: den kan installeres på telefonen, virker uten nett, og publiseres via GitHub Pages.

Eier: Rikard, spesialfysioterapeut på Ahus. Han er klinikeren og tar alle faglige beslutninger. Han lærer seg Git og Claude Code underveis, så forklar kort hva du gjør når du gjør noe med Git (branch, commit, push, pull request).

## Absolutte regler

### Personvern
- Appen skal **aldri lagre pasientdata**: ingen localStorage, IndexedDB, cookies eller server. All utfylling ligger bare i minnet og forsvinner når fanen lukkes eller nullstilles.
- Ingen analyseverktøy, sporing eller eksterne kall med brukerdata.
- Profilfeltene er bare alder i hele år og kjønn, til normverdier. Spør aldri etter navn, fødselsdato eller fødselsnummer.
- Service workeren skal bare cache appens egne statiske filer.
- localStorage kan brukes til rene brukerinnstillinger uten pasientdata, for eksempel tema eller sist valgte tester, men bare hvis Rikard ber om det.

### Faglig korrekthet
- **Ikke finn på verdier.** Hver grenseverdi, normverdi, MCID og MDC skal ha en kilde (forfatter, år, tidsskrift). Kilden skal stå i testens veiledning, og den skal stå i DIPS-teksten når verdien brukes i tolkningen.
- Hvis du ikke finner en sikker kilde, si det. Legg da verdien inn som `TODO` og spør Rikard, ikke gjett.
- Når MCID kommer fra én bestemt populasjon (f.eks. hofteartrose), skal populasjonen nevnes i DIPS-teksten.
- Mangler MCID, skal appen skrive «Ingen etablert MCID», og eventuelt bruke MDC med kilde.
- Skåringslogikk skal ha automatiske tester (se under) før den merges.

### Opphavsrett for PROM-skjemaer
- Kan bygges som fullt skjema, ledd for ledd: NPRS, PSFS, PGIC og Örebro.
- IKDC (© AOSSM, helseforetak må ha lisens), ACL-RSI og Tegner (rettigheter uavklart, «no information» på ePROVIDE): sjekket 3.11.2026. De er bygget uten spørsmåls- og nivåtekster, og svarene tastes inn fra pasientens skjema. CFS og funksjonstestene kan også brukes fritt, med kildeangivelse.
- KOOS og HOOS: vilkårene er endret (sjekket 3.11.2026, koos.nu). De er «© Ewa M. Roos, all rights reserved» og krever alltid lisens via Mapi. De er bygget **ledd for ledd med leddkoder** (P1, S1 …): svaret 0–4 tastes inn fra pasientens lisensierte skjema, uten spørsmålstekst.
- Spørsmålstekst (3.11.2026): Rikard oppgir at Mapi har godkjent digital bruk via Ahus-lisensen. Rikard legger selv inn teksten for KOOS, HOOS, IKDC og ACL-RSI i `js/data/ledd-tekst.js`, fra Ahus' lisensierte norske versjoner. Claude henter eller skriver ikke av spørsmålstekst fra nettet. Et tomt felt viser bare leddkoden.
- Tegner (3.11.2026): Rikard limte inn den engelske originalteksten og ba om norsk oversettelse. Nivåbeskrivelsene i `js/data/ledd-tekst.js` er appens egen oversettelse, ikke en validert norsk versjon. Bytt dem ut med den offisielle norske teksten hvis Ahus har en.
- Krever lisens eller tillatelse for digital gjengivelse: ODI og EQ-5D (Mapi/EuroQol), Oxford Shoulder Score, QuickDASH, WORC/WOSI og antakelig NDI og STarT Back. Disse bygges inntil videre med **inntasting av delskårer/totalskår**, ikke med spørsmålstekstene.
- Sjekk bruksvilkårene på nytt før hvert skjema bygges, og oppgi rettighetshaveren i veiledningen.

## Teknisk

- Ren HTML, CSS og JavaScript med ES-moduler. **Ingen rammeverk og ingen byggesteg**, så GitHub Pages kan servere filene direkte.
- Ingen eksterne avhengigheter i produksjon. Fonter hostes lokalt i repoet (Atkinson Hyperlegible og IBM Plex Mono, begge med åpen lisens), eller vi bruker systemfonter, slik at appen virker offline.
- Tester kjøres med Nodes innebygde testløper: `node --test`. Ingen npm-pakker uten at Rikard godkjenner det.
- Mobil først (ca. 400 px), men appen skal også fungere på PC. Lys og mørk modus via CSS-variabler.

### Struktur
```
index.html
manifest.webmanifest
sw.js                  service worker, precache-liste og versjonert cache
css/app.css
fonts/                 woff2 + OFL-lisenser
icons/                 lages med tools/lag-ikoner.mjs
js/app.js              kjerne (DOM): rendering, binding, kopier, nullstill, registrering av SW
js/registry.js         testregister, bibliotekets rekkefølge og samlet DIPS-tekst (ingen DOM)
js/lib/format.js       num(), f() (desimalkomma), fs(), changeText(), aidText()
js/lib/form.js         esc(), inputF(), radioF(), checkF(), AIDS
js/lib/koos-hoos.js    felles skåring og skjema for KOOS og HOOS (delskårer 0–100), itemRow() for ledd-rader
js/data/ledd-tekst.js  spørsmålstekst per leddkode (KOOS, HOOS, IKDC, ACL-RSI) og Tegner-nivåer
js/modules/<id>.js     én fil per test
tests/<id>.test.js     tester for skåring og tolkning per test
tests/eksempel.test.js hele DIPS-teksten for Rikards eksempel
tests/prototype.test.js sammenligner med prototype/testbank.html
tests/personvern.test.js, tests/sw.test.js  vakter for personvern og offline-cache
tools/serve.mjs        lokal utviklingsserver: node tools/serve.mjs
prototype/testbank.html  prototypen fra Cowork, uendret referanse
```

### Ny test eller ny fil
- Ny test: lag `js/modules/<id>.js` og `tests/<id>.test.js`, importer modulen i `js/registry.js` og legg filen i `ASSETS` i `sw.js`.
- **Øk `CACHE`-versjonen i `sw.js` ved hver endring i appen**, ellers får installerte apper den gamle versjonen fra cachen. `tests/sw.test.js` feiler hvis en fil mangler i listen.
- `prototype.test.js` sammenligner bare de sju testene fra prototypen. Endres en av dem faglig med vilje, må sammenligningen for den testen tas ut eller oppdateres.

### Modulgrensesnitt
Hver test er en modul som eksporterer:
```js
export default {
  id, name, category, status: "aktiv" | "planlagt",
  title, meta,
  initState(),            // tom tilstand
  form(state),            // HTML-streng, felter bindes via data-k="nøkkel"
  paint?(card, state),    // valgfri visuell oppdatering
  result(state, profile), // {tone, big, main, sub} | null  (tone: ok|warn|crit|none|lvl)
  toText(state, profile), // DIPS-tekst | null
  guide                   // HTML med prosedyre og kilder
};
```
**Skåring og tolkning skal være rene funksjoner**, eksportert separat (f.eks. `scoreSppb(state)`), slik at de kan testes uten DOM.

### DIPS-tekst
- Ren tekst uten formatering, på norsk og med desimalkomma.
- Format: testnavn og resultat → «Tolkning: …» med grense og kilde → «Endring fra forrige: …» med MCID/MDC og kilde, når forrige verdi er oppgitt.
- Flere tester skilles med en tom linje, i samme rekkefølge som i biblioteket.

## Status

Ferdig: CFS, Berg balanseskala, ettbensstående, TUG, SPPB, 30 s sit-to-stand og 10 m gangtest. Restrukturert fra prototypen (`prototype/testbank.html`) til moduler med tester og PWA, med uendret DIPS-tekst. Deretter NPRS, PSFS og PGIC (generiske skjemaer), KOOS og HOOS (ledd for ledd uten spørsmålstekst), og IKDC, ACL-RSI og Tegner (uten spørsmåls- og nivåtekster).

Planlagt:
1. Mini-BESTest og 6MWT.
2. Lisensierte skjemaer med inntasting av skårer: QuickDASH, OSS, WORC/WOSI, ODI, NDI, Örebro, STarT Back og EQ-5D.

Åpne faglige punkter som Rikard skal avklare:
- CFS nivå 4: kontroller ordlyden mot Helsedirektoratets norske v2.0. Prototypen bruker «Lever med svært lett skrøpelighet».
- Berg: kontroller de forkortede leddkriteriene mot den norske versjonen.
- Berg MDC for utgangsskår 0–24 (5 poeng ifølge Donoghue & Stokes 2009): verifiser i originalartikkelen.
- PSFS er «© P Stratford 1995, all rights reserved» (ePROVIDE). Bruksvilkårene vises bare etter innlogging på ePROVIDE: sjekk dem.
- PGIC: den norske ordlyden er appens egen oversettelse. Bytt til en publisert norsk versjon hvis det finnes en.
- KOOS/HOOS: kontroller at leddkodene og antallet ledd per delskår stemmer med det lisensierte norske skjemaet. Avklar med Mapi om Ahus-lisensen dekker spørsmålstekst i appen.
- IKDC: kontroller at leddnumrene (1–8, 9a–9i, 10) og poengnøkkelen stemmer med det norske skjemaet, og at Ahus har lisens fra AOSSM.

## Arbeidsmåte
- Skriv på norsk i UI, i DIPS-tekst, i commit-meldinger og i kommunikasjonen med Rikard.
- Én ny branch per test eller endring, små commits og pull request mot `main`. `main` publiseres automatisk til GitHub Pages.
- Bruk plan mode før større endringer, og vis planen før du koder.
- Kjør `node --test` før hver commit.
