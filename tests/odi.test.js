import { test } from "node:test";
import assert from "node:assert/strict";
import ODI, { scoreOdi, odiGrade, odiChange } from "../js/modules/odi.js";
import { sectionVal, sectionScore } from "../js/lib/seksjoner.js";

const s = (o = {}) => Object.assign(ODI.initState(), o);
const all = v => Object.fromEntries(Array.from({ length: 10 }, (_, i) => ["d" + (i + 1), String(v)]));

test("10 seksjoner med knapper 0–5", () => {
  const html = ODI.form(ODI.initState());
  assert.equal((html.match(/role="radiogroup"/g) || []).length, 10);
  assert.match(html, /id="odi-1-5"/);
});

test("seksjon må være heltall 0–5", () => {
  assert.equal(sectionVal("0"), 0);
  assert.equal(sectionVal("5"), 5);
  assert.equal(sectionVal("6"), null);
  assert.equal(sectionVal("2,5"), null);
});

test("alle 0 gir 0 %, alle 5 gir 100 %, sum 16 gir 32 %", () => {
  assert.equal(scoreOdi(s(all(0))).pct, 0);
  assert.equal(scoreOdi(s(all(5))).pct, 100);
  assert.equal(scoreOdi(s({ ...all(2), d1: "0", d2: "0" })).pct, 32);
});

test("én manglende seksjon: 16 av 45 = 36 %, to manglende gir ingen skår (Fairbank & Pynsent 2000)", () => {
  const one = s({ ...all(2), d1: "0", d10: "" }); // 0 + 8×2 = 16 av 45
  assert.deepEqual(scoreOdi(one), { sum: 16, answered: 9, pct: 36 });
  const two = s({ ...all(2), d9: "", d10: "" });
  assert.equal(scoreOdi(two).pct, null);
  assert.equal(ODI.toText(two), null);
  assert.equal(ODI.result(two).main, "8 av 10 seksjoner besvart");
  assert.equal(sectionScore(Array(10).fill(""), 10).pct, null);
});

test("grader: 20/21, 40/41, 60/61, 80/81", () => {
  assert.equal(odiGrade(20).grade, "minimal funksjonsnedsettelse");
  assert.equal(odiGrade(21).grade, "moderat funksjonsnedsettelse");
  assert.equal(odiGrade(40).grade, "moderat funksjonsnedsettelse");
  assert.equal(odiGrade(41).grade, "alvorlig funksjonsnedsettelse");
  assert.equal(odiGrade(60).grade, "alvorlig funksjonsnedsettelse");
  assert.equal(odiGrade(61).grade, "svært alvorlig funksjonsnedsettelse");
  assert.equal(odiGrade(80).grade, "svært alvorlig funksjonsnedsettelse");
  assert.equal(odiGrade(81).grade, "sengeliggende eller overrapportering av symptomer");
});

test("MCID 10 poeng eller 30 % (Ostelo 2008)", () => {
  assert.deepEqual(odiChange(31, 40), { diff: -9, pct: -22, dir: "bedring", over: false });
  assert.deepEqual(odiChange(30, 40), { diff: -10, pct: -25, dir: "bedring", over: true });
  assert.deepEqual(odiChange(14, 20), { diff: -6, pct: -30, dir: "bedring", over: true });
  assert.deepEqual(odiChange(15, 20), { diff: -5, pct: -25, dir: "bedring", over: false });
  assert.deepEqual(odiChange(8, 0), { diff: 8, pct: null, dir: "forverring", over: false });
});

test("tomt skjema gir ingen tekst", () => {
  assert.equal(ODI.result(s()), null);
  assert.equal(ODI.toText(s()), null);
});

test("eksempel: full DIPS-tekst", () => {
  // Sum 17 → 34 %
  const st = s({ d1: "2", d2: "1", d3: "2", d4: "2", d5: "1", d6: "2", d7: "3", d8: "0", d9: "2", d10: "2", prev: "48" });
  assert.equal(ODI.toText(st), [
    "Oswestry Disability Index: 34 % (10 av 10 seksjoner; 0 = ingen, 100 = størst mulig funksjonsnedsettelse).",
    "Tolkning: Moderat funksjonsnedsettelse (0–20 minimal, 21–40 moderat, 41–60 alvorlig, 61–80 svært alvorlig, 81–100 sengeliggende eller overrapportering; Fairbank & Pynsent 2000).",
    "Endring fra forrige: 48 → 34 % (−14 poeng, −29 %, bedring; over MCID). MCID: 10 poeng eller 30 % (korsryggsmerte, Ostelo 2008). Repeterbarhet 11 poeng (korsryggsmerte, norsk versjon, Grotle 2003)."
  ].join("\n"));
});
