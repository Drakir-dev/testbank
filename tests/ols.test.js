import { test } from "node:test";
import assert from "node:assert/strict";
import OLS, { olsNorm, olsWeakest } from "../js/modules/ols.js";

const s = o => ({ ...OLS.initState(), ...o });
const p74 = { age: "74", sex: "kvinne" };

test("svakeste side", () => {
  assert.equal(olsWeakest(s({})), null);
  assert.equal(olsWeakest(s({ ro: "4,1", lo: "9,0" })), 4.1);
  assert.equal(olsWeakest(s({ lo: "12" })), 12);
});

test("normverdier (Springer 2007)", () => {
  assert.deepEqual(olsNorm(p74), { lo: 70, hi: 79, open: 16.7, closed: 3.7 });
  assert.deepEqual(olsNorm({ age: "74", sex: "mann" }), { lo: 70, hi: 79, open: 25.9, closed: 2.6 });
  assert.deepEqual(olsNorm({ age: "74", sex: "" }), { lo: 70, hi: 79, open: 21.5, closed: 3.1 });
  assert.equal(olsNorm({ age: "17", sex: "" }), null);
  assert.equal(olsNorm({ age: "", sex: "kvinne" }), null);
});

test("grense 5 s (Vellas 1997)", () => {
  assert.equal(OLS.result(s({ ro: "4,9" }), p74).tone, "crit");
  assert.equal(OLS.result(s({ ro: "5" }), p74).tone, "warn");
  assert.match(OLS.toText(s({ ro: "4,9" }), p74), /Vellas 1997/);
  assert.doesNotMatch(OLS.toText(s({ ro: "5" }), p74), /Tolkning/);
});

test("under/over gjennomsnitt for alder", () => {
  assert.equal(OLS.result(s({ ro: "16,6" }), p74).main, "Under gjennomsnitt for alder");
  assert.equal(OLS.result(s({ ro: "16,7" }), p74).tone, "ok");
  assert.equal(OLS.result(s({ ro: "20" }), { age: "", sex: "" }).sub, "Oppgi alder for normverdi");
});

test("eksempel: høyre 4,1 og venstre 9,0 s, kvinne 74 år", () => {
  assert.equal(OLS.toText(s({ ro: "4,1", lo: "9,0" }), p74), [
    "Ettbensstående (best av 3, maks 45 s): Øyne åpne – høyre 4,1 s, venstre 9,0 s.",
    "Referanse 70–79 år (kvinner): gjennomsnitt øyne åpne 16,7 s, øyne lukket 3,7 s (Springer 2007).",
    "Tolkning: Under 5 s på ett ben er forbundet med økt risiko for fall med skade hos eldre (Vellas 1997)."
  ].join("\n"));
});

test("øyne lukket og manglende side", () => {
  assert.equal(OLS.toText(s({}), p74), null);
  assert.match(OLS.toText(s({ lo: "20", rc: "3" }), p74), /høyre –, venstre 20,0 s\. Øyne lukket – høyre 3,0 s, venstre –\./);
});
