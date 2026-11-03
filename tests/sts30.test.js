import { test } from "node:test";
import assert from "node:assert/strict";
import STS, { STS_NORM, stsNorm, scoreSts } from "../js/modules/sts30.js";

const s = o => ({ ...STS.initState(), ...o });

test("skår: armene brukt gir 0", () => {
  assert.equal(scoreSts(s({ reps: "11" })), 11);
  assert.equal(scoreSts(s({ reps: "11", arms: true })), 0);
  assert.equal(scoreSts(s({ arms: true })), 0);
  assert.equal(scoreSts(s({})), null);
});

test("normtabell: krever alder 60–94 og kjønn", () => {
  assert.equal(stsNorm({ age: "74", sex: "" }), null);
  assert.equal(stsNorm({ age: "", sex: "kvinne" }), null);
  assert.equal(stsNorm({ age: "59", sex: "kvinne" }), null);
  assert.equal(stsNorm({ age: "95", sex: "mann" }), null);
  assert.deepEqual(stsNorm({ age: "74", sex: "kvinne" }), [70, 74, 10]);
  assert.deepEqual(stsNorm({ age: "75", sex: "kvinne" }), [75, 79, 10]);
  assert.deepEqual(stsNorm({ age: "60", sex: "mann" }), [60, 64, 14]);
});

test("grense per aldersgruppe og kjønn: under grensen er < verdien", () => {
  for (const sex of ["kvinne", "mann"]) for (const [lo, hi, g] of STS_NORM[sex]) for (const age of [lo, hi]) {
    const p = { age: String(age), sex };
    assert.equal(STS.result(s({ reps: String(g - 1) }), p).tone, "warn", `${sex} ${age} år, ${g - 1}`);
    assert.equal(STS.result(s({ reps: String(g) }), p).tone, "ok", `${sex} ${age} år, ${g}`);
  }
});

test("uten normverdi: tone none", () => {
  assert.deepEqual(STS.result(s({ reps: "9" }), { age: "50", sex: "mann" }), { tone: "none", big: "9", main: "9 reisinger", sub: "Oppgi alder (60–94) og kjønn for normverdi" });
  assert.equal(STS.toText(s({ reps: "9" }), { age: "", sex: "" }), "30 s sit-to-stand: 9 reisinger.");
});

test("eksempel: 8 reisinger, forrige 6, kvinne 74 år", () => {
  const p = { age: "74", sex: "kvinne" };
  assert.equal(STS.result(s({ reps: "8", prev: "6" }), p).sub, "Grense kvinner 70–74 år: <10");
  assert.equal(STS.toText(s({ reps: "8", prev: "6" }), p), [
    "30 s sit-to-stand: 8 reisinger.",
    "Tolkning: Under gjennomsnitt for kvinner 70–74 år (<10), forbundet med økt fallrisk (Rikli & Jones 1999; CDC STEADI).",
    "Endring fra forrige: 6 → 8 reisinger (+2 reisinger, bedring; over MCID). MCID: 2 reisinger (hofteartrose, Wright 2011)."
  ].join("\n"));
});

test("innenfor gjennomsnitt og armer i teksten", () => {
  assert.match(STS.toText(s({ reps: "13" }), { age: "70", sex: "mann" }), /Innenfor gjennomsnitt for menn 70–74 år \(grense <12; Rikli & Jones 1999\)/);
  assert.match(STS.toText(s({ reps: "5", arms: true }), { age: "70", sex: "mann" }), /^30 s sit-to-stand: 0 reisinger \(måtte bruke armene, skåret 0\)\./);
});
