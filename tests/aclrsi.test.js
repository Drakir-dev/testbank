import { test } from "node:test";
import assert from "node:assert/strict";
import ACLRSI, { aclrsiVal, scoreAclrsi, aclrsiChange } from "../js/modules/aclrsi.js";

const VALS = [60, 50, 70, 40, 60, 60, 50, 70, 60, 50, 60, 70]; // sum 700 → 58,3
const fill = vals => Object.fromEntries(vals.map((v, i) => ["r" + (i + 1), String(v)]));
const s = (o = {}) => Object.assign(ACLRSI.initState(), o);

test("ledd: 0–100 i trinn på 10", () => {
  assert.equal(aclrsiVal("0"), 0);
  assert.equal(aclrsiVal("100"), 100);
  assert.equal(aclrsiVal("55"), null);
  assert.equal(aclrsiVal("110"), null);
  assert.equal(aclrsiVal(""), null);
});

test("skår = gjennomsnitt av 12 ledd", () => {
  assert.deepEqual(scoreAclrsi(s(fill(VALS))), { score: 58.3, answered: 12 });
  assert.equal(scoreAclrsi(s(fill(Array(12).fill(100)))).score, 100);
  assert.equal(scoreAclrsi(s(fill(Array(12).fill(0)))).score, 0);
});

test("alle 12 ledd må besvares", () => {
  const st = s(fill(VALS.slice(0, 11)));
  assert.deepEqual(scoreAclrsi(st), { score: null, answered: 11 });
  assert.equal(ACLRSI.toText(st), null);
  assert.equal(ACLRSI.result(st).main, "11 av 12 ledd besvart");
  assert.equal(ACLRSI.result(s()), null);
});

test("MIC 13,4 (Webster & Feller 2021): 13,3 under, 13,4 over", () => {
  assert.deepEqual(aclrsiChange(53.3, 40), { diff: 13.3, dir: "bedring", over: false });
  assert.deepEqual(aclrsiChange(53.4, 40), { diff: 13.4, dir: "bedring", over: true });
  assert.deepEqual(aclrsiChange(45, 58.4), { diff: -13.4, dir: "forverring", over: true });
});

test("eksempel: full DIPS-tekst", () => {
  assert.equal(ACLRSI.toText(s({ ...fill(VALS), prev: "40" })), [
    "ACL-RSI: 58,3 av 100 (høyere = mer psykologisk klar for retur til idrett).",
    "Tolkning: Ingen etablert grenseverdi.",
    "Endring fra forrige: 40,0 → 58,3 (+18,3 poeng, bedring; over MIC). MIC: 13,4 poeng (6–12 mnd etter ACL-rekonstruksjon, Webster & Feller 2021)."
  ].join("\n"));
});
