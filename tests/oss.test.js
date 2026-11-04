import { test } from "node:test";
import assert from "node:assert/strict";
import OSS, { OSS_N, scoreOss, ossChange } from "../js/modules/oss.js";

const s = (o = {}) => Object.assign(OSS.initState(), o);
const all = v => Object.fromEntries(Array.from({ length: OSS_N }, (_, i) => ["o" + (i + 1), String(v)]));

test("12 ledd med knapper 0–4", () => {
  assert.equal((OSS.form(OSS.initState()).match(/role="radiogroup"/g) || []).length, 12);
});

test("alle 0 gir 0, alle 4 gir 48", () => {
  assert.deepEqual(scoreOss(s(all(0))), { score: 0, answered: 12 });
  assert.deepEqual(scoreOss(s(all(4))), { score: 48, answered: 12 });
});

test("alle 12 ledd må være besvart", () => {
  const st = s({ ...all(3), o12: "" });
  assert.deepEqual(scoreOss(st), { score: null, answered: 11 });
  assert.equal(OSS.toText(st), null);
  assert.equal(OSS.result(st).main, "11 av 12 ledd besvart");
  assert.equal(scoreOss(s({ ...all(3), o1: "5" })).score, null);
});

test("MCID 6 poeng (Christiansen 2015): 5 under, 6 over", () => {
  assert.deepEqual(ossChange(30, 25), { diff: 5, dir: "bedring", over: false });
  assert.deepEqual(ossChange(31, 25), { diff: 6, dir: "bedring", over: true });
  assert.deepEqual(ossChange(19, 25), { diff: -6, dir: "forverring", over: true });
  assert.deepEqual(ossChange(25, 25), { diff: 0, dir: "uendret", over: false });
});

test("forrige skår må være heltall 0–48", () => {
  const st = s({ ...all(2), prev: "49" });
  assert.equal(OSS.toText(st).split("\n").length, 2);
});

test("tomt skjema gir ingen tekst", () => {
  assert.equal(OSS.result(s()), null);
  assert.equal(OSS.toText(s()), null);
});

test("eksempel: full DIPS-tekst", () => {
  const st = s({ o1: "2", o2: "3", o3: "2", o4: "3", o5: "2", o6: "2", o7: "3", o8: "2", o9: "3", o10: "2", o11: "3", o12: "4", prev: "24" });
  assert.equal(OSS.toText(st), [
    "Oxford Shoulder Score: 31 av 48 (0 = verst, 48 = best).",
    "Tolkning: Ingen etablert grenseverdi.",
    "Endring fra forrige: 24 → 31 (+7 poeng, bedring; over MCID). MCID: 6 poeng (etter artroskopisk subakromial dekompresjon, Christiansen 2015)."
  ].join("\n"));
});
