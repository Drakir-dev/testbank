/* Rikards eksempel fra prototypen: alle sju testene for en kvinne på 74 år.
   Den forventede DIPS-teksten er skrevet ut i sin helhet, og skal være lik prototypens tegn for tegn. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { TESTS, dipsText, libraryOrder } from "../js/registry.js";
import { protoDips } from "./hjelpere/prototype.js";

const profile = { age: "74", sex: "kvinne" };
const berg = { prev: "35" };
["4", "4", "4", "3", "3", "4", "3", "2", "3", "3", "2", "2", "1", "1"].forEach((v, i) => berg["b" + i] = v);
const states = {
  cfs: { level: "5", basis: "habituell", sources: [], prev: "4", note: "" },
  berg,
  ols: { ro: "4,1", lo: "9,0", rc: "", lc: "" },
  tug: { time: "14,2", aid: "ingen", prev: "15,5" },
  sppb: { sbs: "ja", semi: "ja", tandem: "5,2", tandemNo: false, g1: "5,9", g2: "5,4", gaitNo: false, chair: "14,1", chairNo: false, prev: "6" },
  sts30: { reps: "8", arms: false, prev: "6" },
  "10mwt": { time: "7,5", dist: "6", pace: "selvvalgt", aid: "ingen", prev: "0,72" }
};
// Valgt i tilfeldig rekkefølge; appen sorterer i bibliotekets rekkefølge
const selected = libraryOrder(["10mwt", "sppb", "cfs", "tug", "sts30", "ols", "berg"]);

const EXPECTED = [
  "Clinical Frailty Scale (CFS v2.0): 5 – Lever med mild skrøpelighet.",
  "Vurdert ut fra habituell funksjon ca. 2 uker før aktuell sykdom/forverring.",
  "Tolkning: Skrøpelig, mild grad (CFS ≥5).",
  "Endring fra forrige vurdering: CFS 4 → 5 (+1 nivå, forverring). Ingen etablert MCID for CFS.",
  "",
  "Berg balanseskala: 39/56.",
  "Ledd: 1:4, 2:4, 3:4, 4:3, 5:3, 6:4, 7:3, 8:2, 9:3, 10:3, 11:2, 12:2, 13:1, 14:1.",
  "Tolkning: Under 45 poeng, forbundet med økt fallrisk hos eldre (Berg 1992).",
  "Endring fra forrige: 35 → 39 (+4 poeng, bedring; under MDC på 5 poeng for utgangsskår 35). MDC etter Donoghue & Stokes 2009; ingen etablert MCID for eldre.",
  "",
  "Ettbensstående (best av 3, maks 45 s): Øyne åpne – høyre 4,1 s, venstre 9,0 s.",
  "Referanse 70–79 år (kvinner): gjennomsnitt øyne åpne 16,7 s, øyne lukket 3,7 s (Springer 2007).",
  "Tolkning: Under 5 s på ett ben er forbundet med økt risiko for fall med skade hos eldre (Vellas 1997).",
  "",
  "Timed Up and Go (TUG): 14,2 s, uten ganghjelpemiddel.",
  "Tolkning: Over grenseverdi for økt fallrisk hos hjemmeboende eldre (≥13,5 s; Shumway-Cook 2000). TUG alene har begrenset prediktiv verdi for fall og bør sees sammen med andre funn.",
  "Referanse 70–79 år: gjennomsnitt 9,2 s (Bohannon 2006).",
  "Endring fra forrige: 15,5 → 14,2 s (−1,3 s, bedring; over MCID). MCID: 0,8–1,4 s (hofteartrose, Wright 2011).",
  "",
  "SPPB: 8/12. Balanse 3/4, ganghastighet 3/4 (4 m på 5,40 s = 0,74 m/s), reise seg 5 ganger 2/4 (14,1 s).",
  "Tolkning: Lett begrenset funksjon (Guralnik 1994). ≤8 poeng indikerer nedsatt fysisk funksjon (EWGSOP2).",
  "Endring fra forrige: 6 → 8 poeng (+2 poeng, bedring; betydelig endring). MCID: liten meningsfull endring 0,5 poeng, betydelig 1 poeng (Perera 2006).",
  "",
  "30 s sit-to-stand: 8 reisinger.",
  "Tolkning: Under gjennomsnitt for kvinner 70–74 år (<10), forbundet med økt fallrisk (Rikli & Jones 1999; CDC STEADI).",
  "Endring fra forrige: 6 → 8 reisinger (+2 reisinger, bedring; over MCID). MCID: 2 reisinger (hofteartrose, Wright 2011).",
  "",
  "10 m gangtest (selvvalgt tempo, uten ganghjelpemiddel): 7,50 s over 6 m = 0,80 m/s.",
  "Tolkning: ≤0,8 m/s indikerer nedsatt fysisk funksjon (EWGSOP2, Cruz-Jentoft 2019).",
  "Endring fra forrige: 0,72 → 0,80 m/s (+0,08 m/s, bedring; over MCID). MCID: liten meningsfull endring 0,05 m/s, betydelig 0,10 m/s (Perera 2006)."
].join("\n");

test("valgte tester sorteres i bibliotekets rekkefølge", () => {
  assert.deepEqual(selected, ["cfs", "berg", "ols", "tug", "sppb", "sts30", "10mwt"]);
});

test("hele DIPS-teksten er lik den forventede teksten", () => {
  assert.equal(dipsText(selected, states, profile), EXPECTED);
});

test("hele DIPS-teksten er lik prototypens tekst", () => {
  assert.equal(dipsText(selected, states, profile), protoDips(selected, states, profile));
});

test("resultatkortene for eksempelet", () => {
  const r = id => TESTS.find(t => t.id === id).result(states[id], profile);
  assert.equal(r("cfs").sub, "Lever med mild skrøpelighet · CFS ≥5 · endring 4 → 5 (+1)");
  assert.equal(r("tug").main, "Økt fallrisk");
  assert.equal(r("sts30").main, "Under gjennomsnitt for alder og kjønn");
  assert.equal(r("10mwt").big, "0,80");
  assert.equal(r("ols").big, "4,1");
  assert.equal(r("berg").big, "39");
  assert.equal(r("sppb").sub, "Balanse 3 · gange 3 · reise seg 2 · ≤8: nedsatt fysisk funksjon");
});

test("tester uten utfylling gir ingen blokk", () => {
  const empty = Object.fromEntries(selected.map(id => [id, TESTS.find(t => t.id === id).initState()]));
  assert.equal(dipsText(selected, empty, { age: "", sex: "" }), "");
  assert.equal(dipsText(["cfs", "tug"], { ...empty, tug: states.tug }, profile), EXPECTED.split("\n\n")[3]);
});
