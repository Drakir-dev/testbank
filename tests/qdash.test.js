import { test } from "node:test";
import assert from "node:assert/strict";
import QDASH, { QDASH_N, qdashVal, scoreQdash, scoreQdashModule, qdashChange } from "../js/modules/qdash.js";

const s = (o = {}) => Object.assign(QDASH.initState(), o);
const all = v => Object.fromEntries(Array.from({ length: QDASH_N }, (_, i) => ["q" + (i + 1), String(v)]));

test("11 ledd med knapper 1–5, og to moduler med 4 ledd", () => {
  const html = QDASH.form(QDASH.initState());
  assert.equal((html.match(/role="radiogroup"/g) || []).length, 19);
  assert.match(html, /value="1"/);
  assert.doesNotMatch(html, /id="qdash-1-0"/);
  assert.match(html, /id="qdash-1-5"/);
});

test("ledd må være heltall 1–5", () => {
  assert.equal(qdashVal("1"), 1);
  assert.equal(qdashVal("5"), 5);
  assert.equal(qdashVal("0"), null);
  assert.equal(qdashVal("6"), null);
  assert.equal(qdashVal("2,5"), null);
  assert.equal(qdashVal(""), null);
});

test("alle 1 gir 0, alle 5 gir 100, alle 3 gir 50", () => {
  assert.deepEqual(scoreQdash(s(all(1))), { score: 0, answered: 11 });
  assert.deepEqual(scoreQdash(s(all(5))), { score: 100, answered: 11 });
  assert.deepEqual(scoreQdash(s(all(3))), { score: 50, answered: 11 });
});

test("10 av 11 ledd gir skår av besvarte ledd, 9 gir ingen (Beaton 2005)", () => {
  // 9 × 2 + 1 × 4 = 22 / 10 = 2,2 → (2,2 − 1) × 25 = 30
  const ten = s({ ...all(2), q10: "4", q11: "" });
  assert.deepEqual(scoreQdash(ten), { score: 30, answered: 10 });
  const nine = s({ ...all(2), q10: "", q11: "" });
  assert.deepEqual(scoreQdash(nine), { score: null, answered: 9 });
  assert.equal(QDASH.toText(nine), null);
  assert.equal(QDASH.result(nine).main, "9 av 11 ledd besvart");
});

test("moduler krever alle fire ledd", () => {
  assert.deepEqual(scoreQdashModule(s({ A1: "1", A2: "2", A3: "3", A4: "4" }), "A"), { score: 37.5, answered: 4 });
  assert.deepEqual(scoreQdashModule(s({ S1: "5", S2: "5", S3: "5" }), "S"), { score: null, answered: 3 });
});

test("MCID 15,9 (Franchignoni 2014): 15,8 under, 15,9 over", () => {
  assert.deepEqual(qdashChange(34.1, 49.9), { diff: -15.8, dir: "bedring", over: false });
  assert.deepEqual(qdashChange(34.1, 50), { diff: -15.9, dir: "bedring", over: true });
  assert.deepEqual(qdashChange(60, 40), { diff: 20, dir: "forverring", over: true });
  assert.deepEqual(qdashChange(40, 40), { diff: 0, dir: "uendret", over: false });
});

test("tomt skjema gir ingen tekst", () => {
  assert.equal(QDASH.result(s()), null);
  assert.equal(QDASH.toText(s()), null);
});

test("eksempel: full DIPS-tekst med arbeidsmodul", () => {
  // Sum 26 av 11 ledd: (26/11 − 1) × 25 = 34,09 → 34,1
  const st = s({ q1: "3", q2: "2", q3: "3", q4: "2", q5: "2", q6: "1", q7: "3", q8: "3", q9: "2", q10: "3", q11: "2",
    A1: "2", A2: "2", A3: "3", A4: "1", prev: "50" });
  assert.equal(QDASH.toText(st), [
    "QuickDASH: 34,1 av 100 (11 av 11 ledd; 0 = ingen funksjonsnedsettelse, 100 = størst mulig funksjonsnedsettelse).",
    "Arbeidsmodul: 25,0 av 100.",
    "Tolkning: Ingen etablert grenseverdi.",
    "Endring fra forrige: 50,0 → 34,1 (−15,9 poeng, bedring; over MCID). MCID: 15,9 poeng (muskel-skjelettplager i overekstremiteten, fysioterapi, Franchignoni 2014)."
  ].join("\n"));
});
