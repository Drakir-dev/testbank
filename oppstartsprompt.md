Les CLAUDE.md og testbank.html i repoet. testbank.html er en fungerende prototype i én fil, laget i Claude Cowork. Den skal gjøres om til et vedlikeholdbart prosjekt **uten at funksjonen eller DIPS-teksten endres**.

Start i plan mode og vis meg planen før du koder.

Oppgaver i denne økten:

1. **Restrukturer** etter strukturen og modulgrensesnittet i CLAUDE.md: index.html, css/app.css, js/app.js, js/lib/format.js og én fil per test i js/modules/. Skill skåring og tolkning ut i rene, eksporterte funksjoner.
2. **Lag tester** med `node --test` for all skårings- og tolkningslogikk, inkludert grenseverdiene, for eksempel TUG 13,4 og 13,5 s, SPPB-gange 4,82, 6,20 og 8,70 s, og 5 reisinger på 11,19, 11,20, 13,69, 13,70, 16,69 og 16,70 s. Disse eksemplene fra prototypen skal gi nøyaktig samme resultat:
   - Profil 74 år, kvinne.
   - CFS 5 med forrige 4 → «Lever med mild skrøpelighet», +1 nivå, forverring.
   - TUG 14,2 s med forrige 15,5 → over 13,5-grensen, −1,3 s, over MCID.
   - 30 s STS 8 med forrige 6 → under gjennomsnitt for kvinner 70–74 (<10), +2, over MCID.
   - 10 m gangtest 7,5 s over 6 m → 0,80 m/s, ≤0,8 (EWGSOP2). Forrige 0,72 → +0,08 m/s, over MCID.
   - Ettbensstående høyre 4,1 s og venstre 9,0 s → under 5 s (Vellas). Normverdi kvinner 70–79: 16,7 og 3,7 s.
   - Berg med leddene 4,4,4,3,3,4,3,2,3,3,2,2,1,1 → 39/56. Forrige 35 → +4, under MDC 5.
   - SPPB med side ved side ja, semi ja, tandem 5,2 s, gange 5,9 og 5,4 s, stol 14,1 s → balanse 3, gange 3 (0,74 m/s), reise seg 2, total 8. Forrige 6 → betydelig endring.
   Lag også en test som sammenligner hele DIPS-teksten for dette eksemplet med prototypens tekst.
3. **Gjør appen til en PWA**: manifest.webmanifest med norsk navn («Testbank Fysio»), ikoner (lag et enkelt, nøytralt ikon i SVG og PNG 192/512) og sw.js som cacher appens egne filer for offline-bruk. Bytt ut Google Fonts med lokalt hostede fonter.
4. **Sett opp GitHub Pages** fra `main` og forklar meg stegene jeg må gjøre i GitHub-innstillingene.
5. **Lag README.md** på norsk: hva appen er, personvernprinsippene, hvordan den installeres på telefonen (iPhone og Android), og hvordan testene kjøres.
6. **Flytt testbank.html** til `prototype/testbank.html` som referanse.

Jobb på en egen branch (f.eks. `restrukturering`), commit i logiske steg og lag en pull request når alle testene passerer. Forklar kort hva du gjør med Git underveis.
