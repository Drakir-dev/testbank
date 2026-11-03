import { test } from "node:test";
import assert from "node:assert/strict";
import HOOS, { HOOS_DEF } from "../js/modules/hoos.js";
import { scoreAll } from "../js/lib/koos-hoos.js";

const fill = (key, vals) => Object.fromEntries(vals.map((v, i) => [key + (i + 1), String(v)]));
const s = (...parts) => Object.assign(HOOS.initState(), ...parts);

const EX = [
  fill("P", Array(10).fill(1)),     // 75
  fill("S", Array(5).fill(2)),      // 50
  fill("A", Array(17).fill(1)),     // 75
  fill("SP", Array(4).fill(2)),     // 50
  fill("Q", [2, 2, 1, 1])           // 62,5 → 63
];

test("40 ledd i fem delskårer", () => {
  assert.deepEqual(HOOS_DEF.subscales.map(x => [x.key, x.n]), [["S", 5], ["P", 10], ["A", 17], ["SP", 4], ["Q", 4]]);
  assert.equal(HOOS_DEF.subscales.reduce((a, x) => a + x.n, 0), 40);
  assert.equal((HOOS.form(HOOS.initState()).match(/role="radiogroup"/g) || []).length, 40);
});

test("delskårer i tekstrekkefølge", () => {
  assert.deepEqual(scoreAll(HOOS_DEF, s(...EX)).map(x => [x.label, x.score]),
    [["smerte", 75], ["symptomer", 50], ["ADL", 75], ["sport/fritid", 50], ["livskvalitet", 63]]);
});

test("MCID smerte 24: 23 under, 24 over (Paulsen 2014)", () => {
  assert.match(HOOS.toText(s(...EX, { prevP: "52" })), /smerte 52 → 75 \(\+23 poeng, bedring; under MCID 24\)/);
  assert.match(HOOS.toText(s(...EX, { prevP: "51" })), /smerte 51 → 75 \(\+24 poeng, bedring; over MCID 24\)/);
});

test("MCID livskvalitet 17: 16 under, 17 over", () => {
  assert.match(HOOS.toText(s(...EX, { prevQ: "47" })), /livskvalitet 47 → 63 \(\+16 poeng, bedring; under MCID 17\)/);
  assert.match(HOOS.toText(s(...EX, { prevQ: "46" })), /livskvalitet 46 → 63 \(\+17 poeng, bedring; over MCID 17\)/);
});

test("symptomer, ADL og sport/fritid: ingen etablert MCID", () => {
  const t = HOOS.toText(s(...EX, { prevS: "80", prevA: "75", prevSP: "20" }));
  assert.match(t, /symptomer 80 → 50 \(−30 poeng, forverring; ingen etablert MCID\)/);
  assert.match(t, /ADL 75 → 75 \(±0 poeng, uendret; ingen etablert MCID\)/);
  assert.match(t, /sport\/fritid 20 → 50 \(\+30 poeng, bedring; ingen etablert MCID\)/);
});

test("tomt skjema gir ingen tekst", () => {
  assert.equal(HOOS.result(s()), null);
  assert.equal(HOOS.toText(s()), null);
});

test("eksempel: full DIPS-tekst", () => {
  assert.equal(HOOS.toText(s(...EX, { prevP: "50", prevS: "40", prevQ: "47" })), [
    "HOOS (0 = ekstreme problemer, 100 = ingen problemer): smerte 75, symptomer 50, ADL 75, sport/fritid 50, livskvalitet 63.",
    "Tolkning: Delskårene tolkes hver for seg; ingen etablert grenseverdi.",
    "Endring fra forrige: smerte 50 → 75 (+25 poeng, bedring; over MCID 24); symptomer 40 → 50 (+10 poeng, bedring; ingen etablert MCID); livskvalitet 47 → 63 (+16 poeng, bedring; under MCID 17). MCID for smerte (24) og livskvalitet (17) gjelder 1 år etter hofteprotese (Paulsen 2014)."
  ].join("\n"));
});
