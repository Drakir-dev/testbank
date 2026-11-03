import { test } from "node:test";
import assert from "node:assert/strict";
import NPRS, { nprsVal, interpretNprs, nprsChange } from "../js/modules/nprs.js";

const s = (o = {}) => ({ ...NPRS.initState(), ...o });

test("bare hele tall 0–10 godtas", () => {
  assert.equal(nprsVal("0"), 0);
  assert.equal(nprsVal("10"), 10);
  assert.equal(nprsVal(""), null);
  assert.equal(nprsVal("11"), null);
  assert.equal(nprsVal("-1"), null);
  assert.equal(nprsVal("4,5"), null);
  assert.equal(NPRS.toText(s({ now: "12" })), null);
});

test("grad etter Boonstra 2016: 0, 5/6 og 7/8", () => {
  assert.deepEqual(interpretNprs(0), { grade: "ingen smerte", tone: "ok" });
  assert.deepEqual(interpretNprs(5), { grade: "lett smerte", tone: "ok" });
  assert.deepEqual(interpretNprs(6), { grade: "moderat smerte", tone: "warn" });
  assert.deepEqual(interpretNprs(7), { grade: "moderat smerte", tone: "warn" });
  assert.deepEqual(interpretNprs(8), { grade: "sterk smerte", tone: "crit" });
  assert.equal(NPRS.result(s({ avg: "8" })).main, "Sterk smerte (snitt siste uke)");
});

test("MCID etter Farrar 2001: 2 poeng eller 30 %", () => {
  assert.deepEqual(nprsChange(9, 10), { diff: -1, pct: -10, dir: "bedring", over: false });
  assert.deepEqual(nprsChange(8, 10), { diff: -2, pct: -20, dir: "bedring", over: true });
  assert.equal(nprsChange(5, 7).pct, -29);   // 2 poeng, men 29 %
  assert.equal(nprsChange(5, 7).over, true);
  assert.deepEqual(nprsChange(2, 3), { diff: -1, pct: -33, dir: "bedring", over: true }); // 1 poeng, men 33 %
  assert.deepEqual(nprsChange(6, 7), { diff: -1, pct: -14, dir: "bedring", over: false });
  assert.deepEqual(nprsChange(4, 4), { diff: 0, pct: 0, dir: "uendret", over: false });
  assert.deepEqual(nprsChange(1, 0), { diff: 1, pct: null, dir: "forverring", over: false });
  assert.deepEqual(nprsChange(6, 4), { diff: 2, pct: 50, dir: "forverring", over: true });
});

test("uten snitt siste uke: ingen tolkning", () => {
  const r = NPRS.result(s({ now: "3", worst: "7" }));
  assert.equal(r.tone, "none");
  assert.equal(r.main, "Gradering krever snitt siste uke");
  assert.equal(NPRS.toText(s({ now: "3", worst: "7" })), "Smerte (NPRS 0–10): nå 3, verst siste uke 7.");
});

test("tomme felt gir ingen tekst", () => {
  assert.equal(NPRS.result(s()), null);
  assert.equal(NPRS.toText(s()), null);
  assert.equal(NPRS.toText(s({ prevAvg: "5" })), null);
});

test("forrige 0 gir endring uten prosent", () => {
  assert.match(NPRS.toText(s({ now: "2", prevNow: "0" })), /nå 0 → 2 \(\+2 poeng, forverring; over MCID\)/);
});

test("eksempel: full DIPS-tekst", () => {
  const t = NPRS.toText(s({ now: "3", avg: "5", worst: "8", prevNow: "4", prevAvg: "7" }));
  assert.equal(t, [
    "Smerte (NPRS 0–10): nå 3, gjennomsnitt siste uke 5, verst siste uke 8.",
    "Tolkning: Gjennomsnittlig smerte siste uke tilsvarer lett smerte (≤5 lett, 6–7 moderat, ≥8 sterk; kronisk muskel-skjelettsmerte, Boonstra 2016).",
    "Endring fra forrige: nå 4 → 3 (−1 poeng, −25 %, bedring; under MCID); gjennomsnitt siste uke 7 → 5 (−2 poeng, −29 %, bedring; over MCID). MCID: 2 poeng eller 30 % (kronisk smerte, Farrar 2001)."
  ].join("\n"));
});
