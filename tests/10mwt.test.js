import { test } from "node:test";
import assert from "node:assert/strict";
import GAIT, { gaitSpeed, interpretGait } from "../js/modules/10mwt.js";

const s = o => ({ ...GAIT.initState(), ...o });

test("hastighet = strekning / tid", () => {
  assert.equal(gaitSpeed(s({ time: "7,5" })), 0.8);
  assert.equal(gaitSpeed(s({ time: "10", dist: "10" })), 1);
  assert.equal(gaitSpeed(s({ time: "" })), null);
  assert.equal(gaitSpeed(s({ time: "0" })), null);
  assert.equal(gaitSpeed(s({ time: "5", dist: "" })), null);
});

test("grenser i selvvalgt tempo: ≤0,8, <1,0 og ≥1,0 m/s", () => {
  assert.equal(interpretGait(0.8, "selvvalgt").band, "nedsatt");
  assert.equal(interpretGait(0.81, "selvvalgt").band, "redusert");
  assert.equal(interpretGait(0.99, "selvvalgt").band, "redusert");
  assert.equal(interpretGait(1.0, "selvvalgt").band, "god");
  assert.equal(GAIT.result(s({ time: "7,5" })).main, "Nedsatt fysisk funksjon");
  assert.equal(GAIT.result(s({ time: "6,5" })).main, "Redusert ganghastighet");
  assert.equal(GAIT.result(s({ time: "6" })).main, "Ganghastighet ≥1,0 m/s");
  assert.match(GAIT.toText(s({ time: "6,5" })), /Tolkning: Redusert ganghastighet \(0,8–1,0 m\/s\)/);
  assert.match(GAIT.toText(s({ time: "6" })), /Tolkning: ≥1,0 m\/s, forbundet med bedre prognose/);
});

test("maksimalt tempo: ingen tolkning", () => {
  const st = s({ time: "4", pace: "maksimalt" });
  assert.deepEqual(GAIT.result(st), { tone: "none", big: "1,50", main: "1,50 m/s maksimal hastighet", sub: "Grenseverdier gjelder selvvalgt tempo" });
  assert.equal(GAIT.toText(st), "10 m gangtest (maksimalt tempo, uten ganghjelpemiddel): 4,00 s over 6 m = 1,50 m/s.");
});

test("eksempel: 7,5 s over 6 m, forrige 0,72", () => {
  assert.equal(GAIT.toText(s({ time: "7,5", prev: "0,72" })), [
    "10 m gangtest (selvvalgt tempo, uten ganghjelpemiddel): 7,50 s over 6 m = 0,80 m/s.",
    "Tolkning: ≤0,8 m/s indikerer nedsatt fysisk funksjon (EWGSOP2, Cruz-Jentoft 2019).",
    "Endring fra forrige: 0,72 → 0,80 m/s (+0,08 m/s, bedring; over MCID). MCID: liten meningsfull endring 0,05 m/s, betydelig 0,10 m/s (Perera 2006)."
  ].join("\n"));
});

test("betydelig endring fra 0,10 m/s", () => {
  assert.match(GAIT.toText(s({ time: "6", prev: "0,85" })), /betydelig endring/);
});
