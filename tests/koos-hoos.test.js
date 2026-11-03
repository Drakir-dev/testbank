import { test } from "node:test";
import assert from "node:assert/strict";
import { itemVal, subscaleScore, subChange, prevVal } from "../js/lib/koos-hoos.js";

test("ledd godtas bare som heltall 0–4", () => {
  assert.equal(itemVal("0"), 0);
  assert.equal(itemVal("4"), 4);
  assert.equal(itemVal("5"), null);
  assert.equal(itemVal("1,5"), null);
  assert.equal(itemVal(""), null);
});

test("delskår: 100 − gjennomsnitt × 25, avrundet", () => {
  assert.equal(subscaleScore(["0", "0", "0", "0"]), 100);
  assert.equal(subscaleScore(["4", "4", "4", "4"]), 0);
  assert.equal(subscaleScore(["2", "2", "2", "2"]), 50);
  assert.equal(subscaleScore(["3", "3", "2", "2"]), 38);       // 37,5 rundes opp
  assert.equal(subscaleScore(["1", "0", "0", "0", "0", "0", "0", "0", "0"]), 97); // 97,2
});

test("1–2 ubesvarte ledd erstattes med gjennomsnittet, 3 gir ugyldig", () => {
  assert.equal(subscaleScore(["2", "", "2", "2", "2"]), 50);
  assert.equal(subscaleScore(["4", "", "", "0", "0"]), 67);    // snitt 1,33
  assert.equal(subscaleScore(["4", "", "", "", "0"]), null);
  assert.equal(subscaleScore(["", "", "", ""]), null);
  assert.equal(subscaleScore(["1", "", ""]), 75);
});

test("endring: MCID-grense og ingen etablert MCID", () => {
  assert.deepEqual(subChange(59, 50, 10), { diff: 9, dir: "bedring", over: false });
  assert.deepEqual(subChange(60, 50, 10), { diff: 10, dir: "bedring", over: true });
  assert.deepEqual(subChange(40, 50, 10), { diff: -10, dir: "forverring", over: true });
  assert.deepEqual(subChange(50, 50, 10), { diff: 0, dir: "uendret", over: false });
  assert.deepEqual(subChange(60, 50, null), { diff: 10, dir: "bedring", over: null });
});

test("forrige delskår: heltall 0–100", () => {
  assert.equal(prevVal("0"), 0);
  assert.equal(prevVal("100"), 100);
  assert.equal(prevVal("101"), null);
  assert.equal(prevVal("55,5"), null);
});
