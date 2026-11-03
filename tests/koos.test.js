import { test } from "node:test";
import assert from "node:assert/strict";
import KOOS, { KOOS_DEF } from "../js/modules/koos.js";
import { scoreAll } from "../js/lib/koos-hoos.js";

/* Fyller ledd for én delskår, f.eks. fill("P", [2, 2, 1]) → P1=2, P2=2, P3=1 */
const fill = (key, vals) => Object.fromEntries(vals.map((v, i) => [key + (i + 1), String(v)]));
const s = (...parts) => Object.assign(KOOS.initState(), ...parts);

const EX = [
  fill("P", [2, 2, 2, 2, 2, 1, 1, 1, 1]),        // 14/9  → 61
  fill("S", [2, 2, 2, 2, 2, 2, 1]),              // 13/7  → 54
  fill("A", [2, 2, ...Array(15).fill(1)]),       // 19/17 → 72
  fill("SP", [3, 3, 3, 3, 2]),                   // 14/5  → 30
  fill("Q", [3, 3, 2, 2])                        // 10/4  → 38
];

test("42 ledd i fem delskårer", () => {
  assert.deepEqual(KOOS_DEF.subscales.map(x => [x.key, x.n]), [["S", 7], ["P", 9], ["A", 17], ["SP", 5], ["Q", 4]]);
  assert.equal(KOOS_DEF.subscales.reduce((a, x) => a + x.n, 0), 42);
  const st = KOOS.initState();
  assert.equal(Object.keys(st).length, 42 + 5);
  assert.ok("S7" in st && "P9" in st && "A17" in st && "SP5" in st && "Q4" in st && !("S8" in st));
});

test("skjemaet har én radiogruppe per ledd og ingen spørsmålstekst", () => {
  const html = KOOS.form(KOOS.initState());
  assert.equal((html.match(/role="radiogroup"/g) || []).length, 42);
  assert.equal((html.match(/type="radio"/g) || []).length, 42 * 5);
});

test("delskårer i tekstrekkefølge", () => {
  assert.deepEqual(scoreAll(KOOS_DEF, s(...EX)).map(x => [x.label, x.score]),
    [["smerte", 61], ["symptomer", 54], ["ADL", 72], ["sport/fritid", 30], ["livskvalitet", 38]]);
});

test("tomt skjema gir ingen tekst", () => {
  assert.equal(KOOS.result(s()), null);
  assert.equal(KOOS.toText(s()), null);
});

test("ufullstendig: ubesvart og ugyldig delskår", () => {
  const st = s(EX[0], fill("SP", [1, 1]));      // SP: 3 av 5 mangler
  const r = KOOS.result(st);
  assert.equal(r.big, "1/5");
  assert.equal(r.main, "Smerte 61 · Symptomer – · ADL – · Sport/fritid – · Livskvalitet –");
  assert.match(r.sub, /4 delskårer mangler svar/);
  assert.equal(KOOS.toText(st).split("\n")[0],
    "KOOS (0 = ekstreme problemer, 100 = ingen problemer): smerte 61, symptomer ikke besvart, ADL ikke besvart, sport/fritid ikke skåret (for mange ubesvarte ledd), livskvalitet ikke besvart.");
  assert.equal(KOOS.toText(s(fill("SP", [1, 1]))), null);
});

test("eksempel: full DIPS-tekst", () => {
  const t = KOOS.toText(s(...EX, { prevP: "50", prevA: "70", prevQ: "abc" }));
  assert.equal(t, [
    "KOOS (0 = ekstreme problemer, 100 = ingen problemer): smerte 61, symptomer 54, ADL 72, sport/fritid 30, livskvalitet 38.",
    "Tolkning: Delskårene tolkes hver for seg; ingen etablert grenseverdi eller totalskår (Roos & Lohmander 2003).",
    "Endring fra forrige: smerte 50 → 61 (+11 poeng, bedring; over MCID); ADL 70 → 72 (+2 poeng, bedring; under MCID). MCID: 8–10 poeng (kneskade og artrose, Roos & Lohmander 2003). MDC 14,3–19,6 poeng hos yngre og ≥20 hos eldre (Collins 2016)."
  ].join("\n"));
  assert.deepEqual(KOOS.result(s(...EX)), { tone: "none", big: "5/5", main: "Smerte 61 · Symptomer 54 · ADL 72 · Sport/fritid 30 · Livskvalitet 38", sub: "0 = ekstreme problemer, 100 = ingen problemer" });
});
