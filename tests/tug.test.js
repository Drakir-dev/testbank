import { test } from "node:test";
import assert from "node:assert/strict";
import TUG, { interpretTug, tugNorm } from "../js/modules/tug.js";

const s = (time, prev = "", aid = "ingen") => ({ ...TUG.initState(), time, prev, aid });
const p74 = { age: "74", sex: "kvinne" };

test("grenseverdi 13,5 s: 13,4 under, 13,5 over", () => {
  assert.deepEqual(interpretTug(13.4), { risk: false, tone: "warn" });
  assert.deepEqual(interpretTug(13.5), { risk: true, tone: "crit" });
  assert.equal(TUG.result(s("13,4"), p74).main, "Under grense for økt fallrisk");
  assert.equal(TUG.result(s("13,5"), p74).main, "Økt fallrisk");
  assert.match(TUG.toText(s("13,4"), p74), /Tolkning: Under grenseverdi/);
  assert.match(TUG.toText(s("13,5"), p74), /Tolkning: Over grenseverdi/);
});

test("gul markering fra 12 s (CDC STEADI)", () => {
  assert.equal(interpretTug(11.9).tone, "ok");
  assert.equal(interpretTug(12).tone, "warn");
});

test("normverdier etter alder (Bohannon 2006)", () => {
  assert.equal(tugNorm(null), null);
  assert.equal(tugNorm(59), undefined);
  assert.deepEqual(tugNorm(60), [60, 69, 8.1]);
  assert.deepEqual(tugNorm(79), [70, 79, 9.2]);
  assert.deepEqual(tugNorm(80), [80, 99, 11.3]);
  assert.equal(TUG.result(s("10"), { age: "", sex: "" }).sub, "Grenseverdi for økt fallrisk: ≥13,5 s");
});

test("tomt felt gir ingen tekst", () => {
  assert.equal(TUG.result(s(""), p74), null);
  assert.equal(TUG.toText(s(""), p74), null);
});

test("eksempel: 14,2 s, forrige 15,5", () => {
  const t = TUG.toText(s("14,2", "15,5"), p74);
  assert.match(t, /^Timed Up and Go \(TUG\): 14,2 s, uten ganghjelpemiddel\./);
  assert.match(t, /Over grenseverdi .*≥13,5 s; Shumway-Cook 2000/);
  assert.match(t, /15,5 → 14,2 s \(−1,3 s, bedring; over MCID\)/);
  assert.match(t, /hofteartrose, Wright 2011/);
});

test("ganghjelpemiddel i teksten", () => {
  assert.match(TUG.toText(s("10", "", "rullator"), p74), /10,0 s, med rullator\./);
});
