import { test } from "node:test";
import assert from "node:assert/strict";
import BERG, { BERG_ITEMS, bergMDC, bergScored, scoreBerg } from "../js/modules/berg.js";

const s = (items, prev = "") => { const st = BERG.initState(); items.forEach((v, i) => st["b" + i] = String(v)); st.prev = prev; return st; };
const all = v => Array(14).fill(v);

test("14 ledd med 5 kriterier hver", () => {
  assert.equal(BERG_ITEMS.length, 14);
  BERG_ITEMS.forEach(([, crit]) => assert.equal(crit.length, 5));
});

test("totalskår bare når alle 14 ledd er skåret", () => {
  assert.equal(scoreBerg(s([4, 4, 4])), null);
  assert.deepEqual(bergScored(s([4, 0, 3])), [4, 0, 3]);
  assert.equal(scoreBerg(s(all(4))), 56);
  assert.equal(scoreBerg(s(all(0))), 0);
});

test("ufullstendig skjema", () => {
  assert.equal(BERG.result(s([])), null);
  assert.deepEqual(BERG.result(s([4, 3])), { tone: "none", big: "7", main: "2 av 14 ledd skåret", sub: "Foreløpig sum 7" });
  assert.equal(BERG.toText(s([4, 3])), null);
});

test("MDC etter utgangsskår (Donoghue & Stokes 2009)", () => {
  assert.equal(bergMDC(56), 4);
  assert.equal(bergMDC(45), 4);
  assert.equal(bergMDC(44), 5);
  assert.equal(bergMDC(35), 5);
  assert.equal(bergMDC(34), 7);
  assert.equal(bergMDC(25), 7);
  assert.equal(bergMDC(24), 5);
  assert.equal(bergMDC(0), 5);
});

test("grense <45 og ≤20", () => {
  const at = t => { const v = all(0); let r = t; for (let i = 0; i < 14 && r > 0; i++) { v[i] = Math.min(4, r); r -= v[i]; } return s(v); };
  assert.equal(BERG.result(at(45)).tone, "ok");
  assert.equal(BERG.result(at(44)).tone, "warn");
  assert.equal(BERG.result(at(21)).tone, "warn");
  assert.equal(BERG.result(at(20)).tone, "crit");
  assert.match(BERG.toText(at(45)), /Tolkning: 45 poeng eller mer/);
  assert.match(BERG.toText(at(44)), /Tolkning: Under 45 poeng/);
  assert.doesNotMatch(BERG.toText(at(21)), /Skår 0–20/);
  assert.match(BERG.toText(at(20)), /Skår 0–20 indikerer høy fallrisk/);
});

test("eksempel: 4,4,4,3,3,4,3,2,3,3,2,2,1,1 med forrige 35", () => {
  const st = s([4, 4, 4, 3, 3, 4, 3, 2, 3, 3, 2, 2, 1, 1], "35");
  assert.equal(scoreBerg(st), 39);
  assert.equal(BERG.result(st).sub, "39/56 · grense <45 · MDC 5 poeng");
  assert.equal(BERG.toText(st), [
    "Berg balanseskala: 39/56.",
    "Ledd: 1:4, 2:4, 3:4, 4:3, 5:3, 6:4, 7:3, 8:2, 9:3, 10:3, 11:2, 12:2, 13:1, 14:1.",
    "Tolkning: Under 45 poeng, forbundet med økt fallrisk hos eldre (Berg 1992).",
    "Endring fra forrige: 35 → 39 (+4 poeng, bedring; under MDC på 5 poeng for utgangsskår 35). MDC etter Donoghue & Stokes 2009; ingen etablert MCID for eldre."
  ].join("\n"));
});

test("endring over MDC og forverring", () => {
  assert.match(BERG.toText(s(all(3), "47")), /47 → 42 \(−5 poeng, forverring; over MDC på 4 poeng for utgangsskår 47\)/);
});
