import { test } from "node:test";
import assert from "node:assert/strict";
import IKDC, { IKDC_ITEMS, IKDC_MAX, ikdcPoints, scoreIkdc, ikdcChange } from "../js/modules/ikdc.js";

const s = (o = {}) => Object.assign(IKDC.initState(), o);
/* Alle 18 ledd med samme brøkdel av maks: kryss på ledd 2 og 3 snus */
const allBest = () => Object.fromEntries(IKDC_ITEMS.map(it => ["i" + it.code, String(it.reverse ? 0 : it.max)]));
const allWorst = () => Object.fromEntries(IKDC_ITEMS.map(it => ["i" + it.code, String(it.reverse ? it.max : 0)]));

test("18 skårede ledd med maks 87", () => {
  assert.equal(IKDC_ITEMS.length, 18);
  assert.equal(IKDC_MAX, 87);
  assert.deepEqual(IKDC_ITEMS.filter(x => x.reverse).map(x => x.code), ["2", "3"]);
  assert.equal((IKDC.form(IKDC.initState()).match(/role="radiogroup"/g) || []).length, 18);
});

test("poeng per ledd, med snudd skala på ledd 2 og 3", () => {
  const [i1, i2] = IKDC_ITEMS;
  assert.equal(ikdcPoints(i1, "3"), 3);
  assert.equal(ikdcPoints(i1, "5"), null);
  assert.equal(ikdcPoints(i2, "0"), 10);
  assert.equal(ikdcPoints(i2, "7"), 3);
  assert.equal(ikdcPoints(i2, "11"), null);
  assert.equal(ikdcPoints(i1, ""), null);
});

test("beste og dårligste svar gir 100 og 0", () => {
  assert.deepEqual(scoreIkdc(s(allBest())), { score: 100, answered: 18 });
  assert.deepEqual(scoreIkdc(s(allWorst())), { score: 0, answered: 18 });
});

test("16 av 18 ledd gir skår av besvarte ledd, 15 gir ingen", () => {
  const st = s({ ...allBest(), i1: "", i10: "" });          // maks 87 − 4 − 10 = 73
  assert.deepEqual(scoreIkdc(st), { score: 100, answered: 16 });
  const half = s({ ...allWorst(), i1: "", i2: "" , i9a: "4" }); // 4 av 73
  assert.deepEqual(scoreIkdc(half), { score: 5.5, answered: 16 });
  const few = s({ ...allBest(), i1: "", i2: "", i3: "" });
  assert.deepEqual(scoreIkdc(few), { score: null, answered: 15 });
  assert.equal(IKDC.toText(few), null);
  assert.equal(IKDC.result(few).main, "15 av 18 ledd besvart");
});

test("MCID 11,5 (Irrgang 2006): 11,4 under, 11,5 over", () => {
  assert.deepEqual(ikdcChange(61.4, 50), { diff: 11.4, dir: "bedring", over: false });
  assert.deepEqual(ikdcChange(62.1, 50.6), { diff: 11.5, dir: "bedring", over: true });
  assert.deepEqual(ikdcChange(40, 51.5), { diff: -11.5, dir: "forverring", over: true });
  assert.deepEqual(ikdcChange(50, 50), { diff: 0, dir: "uendret", over: false });
});

test("tomt skjema gir ingen tekst", () => {
  assert.equal(IKDC.result(s()), null);
  assert.equal(IKDC.toText(s()), null);
});

test("eksempel: full DIPS-tekst", () => {
  // 54 av 87 poeng = 62,1
  const st = s({ i1: "2", i2: "4", i3: "5", i4: "2", i5: "3", i6: "1", i7: "2", i8: "3",
    i9a: "3", i9b: "3", i9c: "2", i9d: "2", i9e: "3", i9f: "2", i9g: "2", i9h: "3", i9i: "2", i10: "8", prev: "50" });
  assert.equal(scoreIkdc(st).score, 62.1);
  assert.equal(IKDC.toText(st), [
    "IKDC Subjective Knee Form: 62,1 av 100 (18 av 18 ledd; høyere = bedre funksjon og færre symptomer).",
    "Tolkning: Ingen etablert grenseverdi.",
    "Endring fra forrige: 50,0 → 62,1 (+12,1 poeng, bedring; over MCID). MCID: 11,5 poeng (mest sensitive grense; 20,5 mest spesifikke; ulike knelidelser, Irrgang 2006). MDC 9,0 poeng (Irrgang 2001)."
  ].join("\n"));
});
