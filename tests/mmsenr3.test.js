import { test } from "node:test";
import assert from "node:assert/strict";
import MMSE, { mmseExpected, mmseZ, normalCdf, mmseBand, normAge, percentileText, mmseNorm } from "../js/modules/mmsenr3.js";

const s = (o = {}) => Object.assign(MMSE.initState(), o);
const near = (a, b, eps = 1e-3) => assert.ok(Math.abs(a - b) < eps, `${a} ≠ ${b}`);

test("forventet skår etter alder og utdanning (Engedal 2023, kalkulatoren til Aldring og helse)", () => {
  near(mmseExpected(78, "grunnskole"), 26.2812);
  near(mmseExpected(49, "hoyere"), 28.7344);
  near(mmseExpected(89, "hoyere"), 27.3456);
  near(mmseExpected(89, "videregaende"), 26.6306);
  near(mmseExpected(70, "videregaende"), 27.8492);
  /* Utdanningsleddene */
  near(mmseExpected(70, "hoyere") - mmseExpected(70, "grunnskole"), 1.893211, 1e-6);
  near(mmseExpected(70, "hoyere") - mmseExpected(70, "videregaende"), 0.7149681, 1e-6);
});

test("alder utenfor 49–89 år bruker nærmeste alder", () => {
  assert.equal(normAge(45), 49);
  assert.equal(normAge(92), 89);
  assert.equal(normAge(70), 70);
  near(mmseExpected(92, "hoyere"), mmseExpected(89, "hoyere"), 1e-9);
  assert.equal(mmseNorm(25, 92, "hoyere").clamped, 89);
  assert.equal(mmseNorm(25, 45, "hoyere").clamped, 49);
  assert.equal(mmseNorm(25, 70, "hoyere").clamped, null);
});

test("z-skår og persentil", () => {
  near(mmseZ(24, 78, "grunnskole"), -0.9210);
  near(normalCdf(0), 0.5, 1e-6);
  near(normalCdf(-1), 0.1587, 1e-4);
  near(normalCdf(-2), 0.0228, 1e-4);
  near(normalCdf(1.5), 0.9332, 1e-4);
  assert.equal(percentileText(-0.921), "18. persentil");
  assert.equal(percentileText(-2.677), "under 1. persentil");
  assert.equal(percentileText(3), "over 99. persentil");
});

test("SD-bånd ved −1, −1,5 og −2", () => {
  assert.equal(mmseBand(0.2).band, "på eller over normen");
  assert.equal(mmseBand(-1).band, "innenfor 1 SD under normen");
  assert.equal(mmseBand(-1.01).band, "mellom 1 og 1,5 SD under normen");
  assert.equal(mmseBand(-1.5).band, "mellom 1 og 1,5 SD under normen");
  assert.equal(mmseBand(-1.51).band, "mellom 1,5 og 2 SD under normen");
  assert.equal(mmseBand(-2).band, "mellom 1,5 og 2 SD under normen");
  assert.equal(mmseBand(-2.01).band, "mer enn 2 SD under normen");
  assert.deepEqual([-0.5, -1.2, -1.8, -3].map(z => mmseBand(z).tone), ["ok", "warn", "crit", "crit"]);
});

test("tomt eller ugyldig gir ingen tekst", () => {
  assert.equal(MMSE.result(s(), {}), null);
  assert.equal(MMSE.toText(s(), {}), null);
  assert.equal(MMSE.toText(s({ score: "31" }), { age: "70" }), null);
  assert.equal(MMSE.toText(s({ score: "24,5" }), { age: "70" }), null);
});

test("uten alder eller utdanning: bare skår", () => {
  assert.equal(MMSE.toText(s({ score: "27" }), { age: "" }), "MMSE-NR3: 27 av 30.\nTolkning: Ikke sammenlignet med norske normer fordi alder og utdanning ikke er oppgitt.");
  assert.match(MMSE.toText(s({ score: "27", edu: "hoyere" }), { age: "" }), /fordi alder ikke er oppgitt/);
  assert.match(MMSE.toText(s({ score: "27" }), { age: "80" }), /fordi utdanning ikke er oppgitt/);
  assert.equal(MMSE.result(s({ score: "27" }), { age: "" }).tone, "none");
});

test("eksempel: full DIPS-tekst med norm og endring", () => {
  assert.equal(MMSE.toText(s({ score: "24", edu: "grunnskole", prev: "26" }), { age: "78", sex: "kvinne" }), [
    "MMSE-NR3: 24 av 30.",
    "Tolkning: Forventet skår for 78 år med grunnskole er 26,3 (norske normer, Engedal 2023). z = −0,92 (18. persentil), innenfor 1 SD under normen.",
    "Endring fra forrige: MMSE-NR3 26 → 24 (−2 poeng, forverring). Ingen etablert MCID for MMSE-NR3."
  ].join("\n"));
});

test("alder over 89 og lav skår", () => {
  assert.equal(MMSE.toText(s({ score: "20", edu: "videregaende" }), { age: "92" }), [
    "MMSE-NR3: 20 av 30.",
    "Tolkning: Forventet skår for 92 år med videregående skole er 26,6 (norske normer, Engedal 2023). z = −2,68 (under 1. persentil), mer enn 2 SD under normen. Alderen er utenfor normgrunnlaget (49–89 år), så normen for 89 år er brukt."
  ].join("\n"));
  const r = MMSE.result(s({ score: "20", edu: "videregaende" }), { age: "92" });
  assert.equal(r.tone, "crit");
  assert.match(r.sub, /norm for 89 år brukt/);
});
