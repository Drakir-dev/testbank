import { test } from "node:test";
import assert from "node:assert/strict";
import { num, f, fs, aidText, changeText } from "../js/lib/format.js";

test("num leser desimalkomma og punktum, tomt gir null", () => {
  assert.equal(num("13,5"), 13.5);
  assert.equal(num("13.5"), 13.5);
  assert.equal(num(7), 7);
  assert.equal(num(""), null);
  assert.equal(num(null), null);
  assert.equal(num(undefined), null);
  assert.equal(num("abc"), null);
});

test("f og fs bruker desimalkomma og riktig fortegn", () => {
  assert.equal(f(0.8, 2), "0,80");
  assert.equal(f(14.2), "14,2");
  assert.equal(fs(1, 0), "+1");
  assert.equal(fs(-1.3), "−1,3");
  assert.equal(fs(0, 0), "±0");
});

test("aidText", () => {
  assert.equal(aidText("ingen"), "uten ganghjelpemiddel");
  assert.equal(aidText("rullator"), "med rullator");
});

test("changeText: retning, MCID og betydelig endring", () => {
  const o = { unit: "s", better: "lower", mcid: 0.8, mcidLabel: "X" };
  assert.equal(changeText(14.2, null, o), null);
  assert.equal(changeText(null, 15.5, o), null);
  assert.equal(changeText(14.2, 15.5, o), "Endring fra forrige: 15,5 → 14,2 s (−1,3 s, bedring; over MCID). MCID: X.");
  assert.equal(changeText(15.0, 14.5, o), "Endring fra forrige: 14,5 → 15,0 s (+0,5 s, forverring; under MCID). MCID: X.");
  assert.equal(changeText(14.5, 14.5, o), "Endring fra forrige: 14,5 → 14,5 s (±0,0 s, uendret; under MCID). MCID: X.");
  const g = { unit: "m/s", d: 2, better: "higher", mcid: 0.05, big: 0.10, mcidLabel: "Y" };
  assert.match(changeText(0.80, 0.72, g), /\+0,08 m\/s, bedring; over MCID/);
  assert.match(changeText(0.84, 0.72, g), /betydelig endring/);
  assert.match(changeText(0.74, 0.72, g), /under MCID/);
});
