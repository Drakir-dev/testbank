# Testbank Fysio

En mobilvennlig app for fysioterapeuter. Du velger kliniske tester, fyller inn resultatene og får en ferdig tekst som kopieres inn i journalnotatet i DIPS. Teksten har tolkning med grenseverdi og kilde, og endring fra forrige måling med MCID/MDC når forrige verdi er oppgitt.

**Appen:** https://drakir-dev.github.io/testbank/

Tester som er klare: Clinical Frailty Scale (CFS), Berg balanseskala, ettbensstående, Timed Up and Go (TUG), SPPB, 30 s sit-to-stand og 10 m gangtest. Flere tester og PROM-skjemaer kommer.

Appen er laget av Rikard, spesialfysioterapeut på Ahus. Den er et hjelpemiddel og erstatter ikke klinisk vurdering.

## Personvern

- **Ingen pasientdata lagres.** Alt du fyller inn ligger bare i minnet i nettleserfanen, og forsvinner når fanen lukkes eller du trykker Nullstill. Appen bruker ikke localStorage, IndexedDB, cookies eller noen server.
- Ingen analyseverktøy, sporing eller eksterne kall. Fontene ligger i appen, så den henter ingenting fra andre nettsteder.
- Appen spør bare om alder i hele år og kjønn, for normverdier. Skriv aldri navn, fødselsdato, fødselsnummer eller andre personopplysninger i kommentarfeltene.
- Service workeren (som gjør at appen virker uten nett) lagrer bare appens egne filer, aldri det du fyller inn.
- Automatiske tester (`tests/personvern.test.js`) stopper endringer som ville lagret data eller kontaktet andre nettsteder.

## Installer på telefonen

Appen er en PWA (progressiv webapp). Den kan legges på hjemskjermen som en vanlig app og virker uten nett når den først er åpnet én gang.

**iPhone (Safari)**
1. Åpne https://drakir-dev.github.io/testbank/ i Safari.
2. Trykk på Del-knappen (firkant med pil opp).
3. Velg **Legg til på Hjem-skjerm** og trykk **Legg til**.

**Android (Chrome)**
1. Åpne https://drakir-dev.github.io/testbank/ i Chrome.
2. Trykk **Installer** hvis Chrome foreslår det. Ellers: trykk på menyen ⋮ og velg **Installer app** eller **Legg til på startsiden**.

**Oppdateringer:** Når en ny versjon er publisert, hentes den automatisk neste gang du åpner appen med nett. Den tas i bruk når du lukker appen helt og åpner den igjen. Appen laster aldri inn på nytt av seg selv, så du mister ikke det du holder på å fylle ut.

## For utviklere

Ren HTML, CSS og JavaScript med ES-moduler. Ingen rammeverk, ingen byggesteg og ingen npm-pakker. Det eneste du trenger er [Node.js](https://nodejs.org/) (versjon 22 eller nyere).

### Kjør appen lokalt
```bash
node tools/serve.mjs
```
Åpne http://localhost:8080/. (ES-moduler virker ikke hvis du åpner `index.html` direkte som fil.)

### Kjør testene
```bash
node --test
```
Testene dekker skåring og tolkning for hver test, inkludert alle grenseverdier, hele DIPS-teksten for et fullt eksempel, og en sammenligning med den opprinnelige prototypen (`prototype/testbank.html`) for tusenvis av kombinasjoner. Kjør testene før hver commit.

### Filstruktur
```
index.html               siden
manifest.webmanifest     appnavn og ikoner for installasjon
sw.js                    service worker (offline)
css/app.css              utseende, lys og mørk modus
fonts/                   Atkinson Hyperlegible og IBM Plex Mono (SIL Open Font License)
icons/                   appikoner (lages med node tools/lag-ikoner.mjs)
js/app.js                kjerne: visning, utfylling, kopier og nullstill
js/registry.js           listen over tester og samlet DIPS-tekst
js/lib/                  felles hjelpere for tall, tekst og skjemafelt
js/modules/<id>.js       én fil per test
tests/                   tester (node --test)
tools/                   utviklingsserver og ikongenerator
prototype/testbank.html  den opprinnelige prototypen, som referanse
```

### Legge til en ny test
1. Lag `js/modules/<id>.js` etter modulgrensesnittet i `CLAUDE.md`. Skåring og tolkning skal være rene, eksporterte funksjoner.
2. Lag `tests/<id>.test.js` med grenseverdiene. Alle grenseverdier, normverdier og MCID/MDC skal ha kilde.
3. Importer modulen i `js/registry.js`.
4. Legg filen til i `ASSETS` i `sw.js` og **øk `CACHE`-versjonen** (f.eks. `testbank-v1` → `testbank-v2`). Gjør det ved hver endring i appen, ellers får installerte apper den gamle versjonen.

### Publisering
`main` publiseres automatisk til GitHub Pages. Oppsett, gjøres én gang: **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main`, mappe `/ (root)` → Save.** Filen `.nojekyll` gjør at GitHub serverer filene som de er.
