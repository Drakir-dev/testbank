import { test } from "node:test";
import assert from "node:assert/strict";
import MB, { MB_ITEMS, MB_SECTIONS, mbItemScore, scoreMiniBest, mbFallCutoff, interpretMiniBest } from "../js/modules/minibest.js";

const s = (o = {}) => Object.assign(MB.initState(), o);
const EX = { m1: "2", m2: "1", m3V: "1", m3H: "2", m4: "1", m5: "1", m6V: "2", m6H: "1", m7: "2", m8: "1", m9: "2",
  m10: "2", m11: "1", m12: "2", m13: "1", m14: "1" };                     // 4 + 3 + 5 + 7 = 19
const all = v => { const o = {}; Object.keys(MB.initState()).filter(k => k !== "prev").forEach(k => o[k] = String(v)); return o; };
const p74 = { age: "74", sex: "kvinne" };

test("14 oppgaver, 16 skårefelt og fire seksjoner som summerer til 28", () => {
  assert.equal(Object.keys(MB_ITEMS).length, 14);
  assert.equal(Object.keys(MB.initState()).length, 16 + 1);
  assert.equal(MB_SECTIONS.reduce((a, x) => a + x.max, 0), 28);
  assert.deepEqual(MB_SECTIONS.flatMap(x => x.items), Array.from({ length: 14 }, (_, i) => i + 1));
  for (const [n, it] of Object.entries(MB_ITEMS)) assert.deepEqual(it.opts.map(([v]) => v), [2, 1, 0], `oppgave ${n}`);
  const html = MB.form(MB.initState());
  assert.equal((html.match(/role="radiogroup"/g) || []).length, 16);
  assert.match(html, /Stå på ett ben – venstre/);
  assert.match(html, /<b>2<\/b> Normal: Reiser seg opp uten å bruke hendene/);
});

test("oppgave 3 og 6: laveste side teller, begge sider må skåres", () => {
  assert.equal(mbItemScore(s({ m3V: "1", m3H: "2" }), 3), 1);
  assert.equal(mbItemScore(s({ m6V: "0", m6H: "2" }), 6), 0);
  assert.equal(mbItemScore(s({ m3V: "2" }), 3), null);
  assert.equal(mbItemScore(s({ m1: "3" }), 1), null);
});

test("sum, delskårer og maks/min", () => {
  const P = scoreMiniBest(s(EX));
  assert.equal(P.total, 19);
  assert.deepEqual(P.sub, [4, 3, 5, 7]);
  assert.equal(scoreMiniBest(s(all(2))).total, 28);
  assert.equal(scoreMiniBest(s(all(0))).total, 0);
});

test("ufullstendig skjema gir foreløpig sum og ingen tekst", () => {
  const st = s({ ...EX, m14: "" });
  const P = scoreMiniBest(st);
  assert.equal(P.total, null);
  assert.equal(P.done, 13);
  assert.equal(MB.result(st, p74).main, "13 av 14 oppgaver skåret");
  assert.equal(MB.toText(st, p74), null);
  assert.equal(MB.result(s(), p74), null);
});

test("aldersgrenser (Magnani 2020): under grensen gir økt fallrisk", () => {
  for (const [age, cut, band] of [[60, 25, "60–69 år"], [69, 25, "60–69 år"], [70, 23, "70–79 år"], [80, 22, "80–89 år"], [89, 22, "80–89 år"], [90, 17, "≥90 år"], [101, 17, "≥90 år"]]) {
    assert.deepEqual(mbFallCutoff(age), { band, cut }, String(age));
    assert.equal(interpretMiniBest(cut - 1, age).risk, true, `${age}: ${cut - 1}`);
    assert.equal(interpretMiniBest(cut, age).risk, false, `${age}: ${cut}`);
  }
  assert.equal(mbFallCutoff(59), null);
  assert.equal(mbFallCutoff(null), null);
  assert.deepEqual(interpretMiniBest(10, 59), { tone: "none", risk: null, c: null });
});

test("uten alder eller under 60 år: ingen fallgrense", () => {
  const t = MB.toText(s(EX), { age: "", sex: "" });
  assert.match(t, /Tolkning: Ingen fallgrense brukt \(aldersspesifikke grenser gjelder hjemmeboende eldre ≥60 år, Magnani 2020\)\./);
  assert.equal(MB.result(s(EX), { age: "45", sex: "" }).tone, "none");
});

test("MCID 4 (Godi 2013): 3 under, 4 over", () => {
  assert.match(MB.toText(s({ ...EX, prev: "16" }), p74), /16 → 19 poeng \(\+3 poeng, bedring; under MCID\)/);
  assert.match(MB.toText(s({ ...EX, prev: "15" }), p74), /15 → 19 poeng \(\+4 poeng, bedring; over MCID\)/);
});

test("eksempel: full DIPS-tekst, 74 år", () => {
  assert.equal(MB.toText(s({ ...EX, prev: "15" }), p74), [
    "Mini-BESTest: 19/28 (antisipatorisk 4/6, reaktiv 3/6, sensorisk 5/6, dynamisk gange 7/10).",
    "Ledd: 1:2, 2:1, 3:1 (V1/H2), 4:1, 5:1, 6:1 (V2/H1), 7:2, 8:1, 9:2, 10:2, 11:1, 12:2, 13:1, 14:1.",
    "Tolkning: Under grensen for økt fallrisk for 70–79 år (<23 poeng; hjemmeboende eldre, Magnani 2020).",
    "Endring fra forrige: 15 → 19 poeng (+4 poeng, bedring; over MCID). MCID: 4 poeng, MDC 3,5 poeng (pasienter med balanseproblemer i rehabilitering, Godi 2013)."
  ].join("\n"));
  assert.deepEqual(MB.result(s(EX), p74), { tone: "warn", big: "19", main: "Økt fallrisk", sub: "19/28 · 4/6 · 3/6 · 5/6 · 7/10 · grense <23 (70–79 år)" });
});
