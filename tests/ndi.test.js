import { test } from "node:test";
import assert from "node:assert/strict";
import NDI, { scoreNdi, ndiGrade, ndiChange } from "../js/modules/ndi.js";

const s = (o = {}) => Object.assign(NDI.initState(), o);
const all = v => Object.fromEntries(Array.from({ length: 10 }, (_, i) => ["n" + (i + 1), String(v)]));

test("10 seksjoner med knapper 0–5", () => {
  assert.equal((NDI.form(NDI.initState()).match(/role="radiogroup"/g) || []).length, 10);
});

test("alle 0 gir 0 av 50, alle 5 gir 50 av 50 (100 %)", () => {
  assert.deepEqual(scoreNdi(s(all(0))), { sum: 0, answered: 10, pct: 0 });
  assert.deepEqual(scoreNdi(s(all(5))), { sum: 50, answered: 10, pct: 100 });
});

test("én eller to manglende seksjoner gir prosent av besvarte, tre gir ingen skår (Vernon 2008)", () => {
  assert.equal(scoreNdi(s({ ...all(2), n10: "" })).pct, 40);       // 18 av 45
  assert.equal(scoreNdi(s({ ...all(1), n1: "4", n9: "", n10: "" })).pct, 28); // 11 av 40 = 27,5 → 28
  const three = s({ ...all(2), n8: "", n9: "", n10: "" });
  assert.equal(scoreNdi(three).pct, null);
  assert.equal(NDI.toText(three), null);
});

test("grader for råskår: 4/5, 14/15, 24/25, 34/35", () => {
  assert.equal(ndiGrade(4).grade, "ingen funksjonsnedsettelse");
  assert.equal(ndiGrade(5).grade, "lett funksjonsnedsettelse");
  assert.equal(ndiGrade(14).grade, "lett funksjonsnedsettelse");
  assert.equal(ndiGrade(15).grade, "moderat funksjonsnedsettelse");
  assert.equal(ndiGrade(24).grade, "moderat funksjonsnedsettelse");
  assert.equal(ndiGrade(25).grade, "alvorlig funksjonsnedsettelse");
  assert.equal(ndiGrade(34).grade, "alvorlig funksjonsnedsettelse");
  assert.equal(ndiGrade(34.5).grade, "alvorlig funksjonsnedsettelse");
  assert.equal(ndiGrade(35).grade, "komplett funksjonsnedsettelse");
});

test("MCID 16,6 % (Johansen 2014): 16 under, 17 over", () => {
  assert.deepEqual(ndiChange(24, 40), { diff: -16, dir: "bedring", over: false });
  assert.deepEqual(ndiChange(24, 41), { diff: -17, dir: "bedring", over: true });
  assert.deepEqual(ndiChange(40, 20), { diff: 20, dir: "forverring", over: true });
});

test("tomt skjema gir ingen tekst", () => {
  assert.equal(NDI.result(s()), null);
  assert.equal(NDI.toText(s()), null);
});

test("eksempel: full DIPS-tekst", () => {
  // Sum 14 av 50 = 28 %
  const st = s({ n1: "2", n2: "1", n3: "1", n4: "2", n5: "2", n6: "1", n7: "1", n8: "2", n9: "1", n10: "1", prev: "46" });
  assert.equal(NDI.toText(st), [
    "Neck Disability Index: 14 av 50 (28 %; høyere = mer funksjonsnedsettelse).",
    "Tolkning: Lett funksjonsnedsettelse (råskår 0–4 ingen, 5–14 lett, 15–24 moderat, 25–34 alvorlig, ≥35 komplett; Vernon 2008).",
    "Endring fra forrige: 46 → 28 % (−18 prosentpoeng, bedring; over MCID). MCID: 16,6 %, MDC 12,3 % (nakkesmerte, spesialisert poliklinikk, norsk versjon, Johansen 2014)."
  ].join("\n"));
});

test("eksempel med manglende seksjon: omregnet råskår", () => {
  const st = s({ ...all(2), n10: "" }); // 18 av 45 = 40 % → 20 av 50
  assert.equal(NDI.toText(st).split("\n")[0], "Neck Disability Index: 40 % (9 av 10 seksjoner, omregnet råskår 20,0 av 50; høyere = mer funksjonsnedsettelse).");
  assert.match(NDI.toText(st), /Tolkning: Moderat/);
});
