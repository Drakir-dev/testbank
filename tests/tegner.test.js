import { test } from "node:test";
import assert from "node:assert/strict";
import TEGNER, { tegnerVal, tegnerVsPre } from "../js/modules/tegner.js";

const s = (o = {}) => Object.assign(TEGNER.initState(), o);

test("nivå 0–10", () => {
  assert.equal(tegnerVal("0"), 0);
  assert.equal(tegnerVal("10"), 10);
  assert.equal(tegnerVal("11"), null);
  assert.equal(tegnerVal("4,5"), null);
});

test("sammenligning med nivået før skaden", () => {
  assert.equal(tegnerVsPre(4, 7), "3 nivåer under nivået før skaden.");
  assert.equal(tegnerVsPre(6, 7), "1 nivå under nivået før skaden.");
  assert.equal(tegnerVsPre(7, 7), "Samme nivå som før skaden.");
  assert.equal(tegnerVsPre(8, 7), "1 nivå over nivået før skaden.");
});

test("uten nivå før skaden og uten forrige", () => {
  assert.equal(TEGNER.toText(s({ now: "5" })), "Tegner aktivitetsskala: nivå 5 nå.\nTolkning: Ingen etablert grenseverdi.");
  assert.equal(TEGNER.result(s({ now: "5" })).sub, "Nivå før skaden ikke oppgitt");
});

test("tomt eller ugyldig gir ingen tekst", () => {
  assert.equal(TEGNER.result(s()), null);
  assert.equal(TEGNER.toText(s({ pre: "7" })), null);
  assert.equal(TEGNER.toText(s({ now: "12" })), null);
});

test("eksempel: full DIPS-tekst", () => {
  assert.equal(TEGNER.toText(s({ now: "4", pre: "7", prev: "3" })), [
    "Tegner aktivitetsskala: nivå 4 nå, nivå 7 før skaden.",
    "Tolkning: 3 nivåer under nivået før skaden.",
    "Endring fra forrige: nivå 3 → 4 (+1 nivå). Ingen etablert MCID."
  ].join("\n"));
  assert.match(TEGNER.toText(s({ now: "4", prev: "6" })), /nivå 6 → 4 \(−2 nivåer\)/);
  assert.deepEqual(TEGNER.result(s({ now: "4", pre: "7" })), { tone: "none", big: "4", main: "Tegner nivå 4", sub: "Før skaden: 7 · 3 nivåer under nivået før skaden" });
});
