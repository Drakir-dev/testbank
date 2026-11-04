import { test } from "node:test";
import assert from "node:assert/strict";
import MOCA, { scoreMoca, interpretMoca } from "../js/modules/moca.js";
import { TESTS } from "../js/registry.js";

const s = (o = {}) => Object.assign(MOCA.initState(), o);

test("Kognisjon-rekkefølgen: 4AT, Mini-Cog, MMSE-NR3, MoCA", () => {
  assert.deepEqual(TESTS.filter(t => t.category === "Kognisjon").map(t => t.id), ["4at", "minicog", "mmsenr3", "moca"]);
});

test("skjemaet har bare totalskår, utdanningstillegg og forrige skår", () => {
  const html = MOCA.form(MOCA.initState());
  assert.deepEqual([...html.matchAll(/data-k="(\w+)"/g)].map(m => m[1]), ["raw", "lowEdu", "prev"]);
});

test("utdanningstillegg +1 ved ≤12 år, høyst 30", () => {
  assert.deepEqual(scoreMoca(s({ raw: "25" })), { raw: 25, bonus: 0, total: 25 });
  assert.deepEqual(scoreMoca(s({ raw: "25", lowEdu: true })), { raw: 25, bonus: 1, total: 26 });
  assert.deepEqual(scoreMoca(s({ raw: "30", lowEdu: true })), { raw: 30, bonus: 0, total: 30 });
  assert.equal(scoreMoca(s({ raw: "31" })).total, null);
  assert.equal(scoreMoca(s({ raw: "" })).total, null);
});

test("grense 26 (Nasreddine 2005)", () => {
  assert.equal(interpretMoca(25).main, "Under grensen for normal kognisjon");
  assert.equal(interpretMoca(26).main, "Innenfor normalområdet");
  assert.equal(MOCA.result(s({ raw: "25", lowEdu: true }), {}).tone, "ok");
  assert.equal(MOCA.result(s({ raw: "25" }), {}).tone, "warn");
});

test("tomt gir ingen tekst", () => {
  assert.equal(MOCA.result(s(), {}), null);
  assert.equal(MOCA.toText(s(), {}), null);
});

test("eksempel: full DIPS-tekst med tillegg, norsk norm (70+) og endring", () => {
  assert.equal(MOCA.toText(s({ raw: "23", lowEdu: true, prev: "25" }), { age: "81" }), [
    "MoCA: 24 av 30 (23 + 1 for ≤12 års utdanning).",
    "Tolkning: Under grensen for normal kognisjon (<26; Nasreddine 2005). Norske normer for 70 år og eldre ligger lavere (gjennomsnitt 22–27 etter alder, kjønn og utdanning; Engedal 2022), så skåren tolkes med forsiktighet.",
    "Endring fra forrige: MoCA 25 → 24 (−1 poeng, forverring). Ingen etablert MCID for MoCA."
  ].join("\n"));
});

test("norsk norm nevnes bare under 26 og fra 70 år", () => {
  assert.equal(MOCA.toText(s({ raw: "27" }), { age: "81" }), "MoCA: 27 av 30.\nTolkning: Innenfor normalområdet (≥26; Nasreddine 2005).");
  assert.doesNotMatch(MOCA.toText(s({ raw: "22" }), { age: "65" }), /Engedal/);
  assert.doesNotMatch(MOCA.toText(s({ raw: "22" }), { age: "" }), /Engedal/);
});
