import { test } from "node:test";
import assert from "node:assert/strict";
import PGIC, { PGIC_LEVELS, interpretPgic } from "../js/modules/pgic.js";

const s = level => ({ ...PGIC.initState(), level });

test("sju trinn i riktig rekkefølge", () => {
  assert.equal(PGIC_LEVELS.length, 7);
  assert.equal(PGIC_LEVELS[0], "Svært mye bedre");
  assert.equal(PGIC_LEVELS[3], "Ingen endring");
  assert.equal(PGIC_LEVELS[6], "Svært mye verre");
});

test("terskel for klinisk viktig bedring: 2 over, 3 under (Farrar 2001)", () => {
  assert.deepEqual(interpretPgic(1), { main: "Klinisk viktig bedring", important: true, tone: "ok" });
  assert.deepEqual(interpretPgic(2), { main: "Klinisk viktig bedring", important: true, tone: "ok" });
  assert.equal(interpretPgic(3).important, false);
  assert.equal(interpretPgic(3).tone, "none");
  assert.equal(interpretPgic(4).main, "Ingen endring");
  assert.deepEqual(interpretPgic(5), { main: "Forverring", important: false, tone: "warn" });
  assert.equal(interpretPgic(6).tone, "crit");
  assert.equal(interpretPgic(7).tone, "crit");
});

test("tomt eller ugyldig valg gir ingen tekst", () => {
  for (const v of ["", "0", "8", "abc"]) {
    assert.equal(PGIC.result(s(v)), null, v);
    assert.equal(PGIC.toText(s(v)), null, v);
  }
});

test("tolkning for litt bedre og forverring", () => {
  assert.equal(PGIC.toText(s("3")).split("\n")[1],
    "Tolkning: Under terskelen for klinisk viktig bedring («mye bedre» eller «svært mye bedre»; kronisk smerte, Farrar 2001).");
  assert.match(PGIC.toText(s("4")), /Farrar 2001\)\.$/);
  assert.match(PGIC.toText(s("6")), /Farrar 2001\)\. Pasienten opplever forverring\.$/);
});

test("eksempel: full DIPS-tekst", () => {
  assert.equal(PGIC.toText(s("2")), [
    "Pasientens globale inntrykk av endring (PGIC) siden behandlingen startet: Mye bedre (2 på skala 1–7).",
    "Tolkning: Klinisk viktig bedring («mye bedre» eller «svært mye bedre»; kronisk smerte, Farrar 2001)."
  ].join("\n"));
  assert.deepEqual(PGIC.result(s("2")), { tone: "ok", big: "2", main: "Klinisk viktig bedring", sub: "Mye bedre · 2 av 7 · terskel: mye bedre (≤2)" });
});
