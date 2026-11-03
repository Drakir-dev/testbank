import { test } from "node:test";
import assert from "node:assert/strict";
import SPPB, { sppbBalance, sppbGaitPoints, sppbChairPoints, scoreSppb, sppbClass } from "../js/modules/sppb.js";

const s = o => ({ ...SPPB.initState(), ...o });
const full = { sbs: "ja", semi: "ja", tandem: "10", g1: "4", chair: "10" };

test("gange 4 m: grensene 4,82, 6,20 og 8,70 s", () => {
  assert.equal(sppbGaitPoints(4.81), 4);
  assert.equal(sppbGaitPoints(4.82), 3);
  assert.equal(sppbGaitPoints(6.20), 3);
  assert.equal(sppbGaitPoints(6.21), 2);
  assert.equal(sppbGaitPoints(8.70), 2);
  assert.equal(sppbGaitPoints(8.71), 1);
  assert.equal(sppbGaitPoints(59.99), 1);
  assert.equal(sppbGaitPoints(60), 0);
});

test("reise seg 5 ganger: grensene 11,19/11,20, 13,69/13,70, 16,69/16,70 og 60 s", () => {
  assert.equal(sppbChairPoints(11.19), 4);
  assert.equal(sppbChairPoints(11.20), 3);
  assert.equal(sppbChairPoints(13.69), 3);
  assert.equal(sppbChairPoints(13.70), 2);
  assert.equal(sppbChairPoints(16.69), 2);
  assert.equal(sppbChairPoints(16.70), 1);
  assert.equal(sppbChairPoints(60), 1);
  assert.equal(sppbChairPoints(60.01), 0);
});

test("grensene fungerer også fra tekstfelt med desimalkomma", () => {
  assert.equal(scoreSppb(s({ g1: "4,82" })).gait, 3);
  assert.equal(scoreSppb(s({ g1: "6,20" })).gait, 3);
  assert.equal(scoreSppb(s({ g1: "8,70" })).gait, 2);
  for (const [t, p] of [["11,19", 4], ["11,20", 3], ["13,69", 3], ["13,70", 2], ["16,69", 2], ["16,70", 1]])
    assert.equal(scoreSppb(s({ chair: t })).chair, p, `stol ${t}`);
});

test("balanse", () => {
  assert.equal(sppbBalance(s({})), null);
  assert.equal(sppbBalance(s({ sbs: "nei" })), 0);
  assert.equal(sppbBalance(s({ sbs: "ja" })), null);
  assert.equal(sppbBalance(s({ sbs: "ja", semi: "nei" })), 1);
  assert.equal(sppbBalance(s({ sbs: "ja", semi: "ja" })), null);
  assert.equal(sppbBalance(s({ sbs: "ja", semi: "ja", tandemNo: true })), 2);
  assert.equal(sppbBalance(s({ sbs: "ja", semi: "ja", tandem: "2,99" })), 2);
  assert.equal(sppbBalance(s({ sbs: "ja", semi: "ja", tandem: "3" })), 3);
  assert.equal(sppbBalance(s({ sbs: "ja", semi: "ja", tandem: "9,99" })), 3);
  assert.equal(sppbBalance(s({ sbs: "ja", semi: "ja", tandem: "10" })), 4);
});

test("gange: raskeste av to forsøk, 0 og tomme ignoreres, klarte ikke = 0", () => {
  assert.deepEqual(scoreSppb(s({ g1: "5,9", g2: "5,4" })).gt, 5.4);
  assert.equal(scoreSppb(s({ g1: "0", g2: "5" })).gt, 5);
  assert.equal(scoreSppb(s({ g1: "", g2: "" })).gait, null);
  const no = scoreSppb(s({ g1: "5", gaitNo: true }));
  assert.equal(no.gait, 0);
  assert.equal(no.gt, null);
});

test("stol: klarte ikke = 0", () => {
  assert.equal(scoreSppb(s({ chairNo: true })).chair, 0);
});

test("totalskår og klassifisering (Guralnik 1994)", () => {
  assert.equal(scoreSppb(s({ sbs: "ja", semi: "ja", tandem: "10", g1: "4" })).total, null);
  assert.equal(scoreSppb(s(full)).total, 12);
  assert.equal(sppbClass(0), "alvorlig begrenset funksjon");
  assert.equal(sppbClass(3), "alvorlig begrenset funksjon");
  assert.equal(sppbClass(4), "moderat begrenset funksjon");
  assert.equal(sppbClass(6), "moderat begrenset funksjon");
  assert.equal(sppbClass(7), "lett begrenset funksjon");
  assert.equal(sppbClass(9), "lett begrenset funksjon");
  assert.equal(sppbClass(10), "minimal begrensning");
  assert.equal(sppbClass(12), "minimal begrensning");
});

test("result: tone og ufullstendig skjema", () => {
  assert.equal(SPPB.result(s({})), null);
  assert.deepEqual(SPPB.result(s({ sbs: "nei" })), { tone: "none", big: "…", main: "Ikke komplett", sub: "Balanse 0 · gange – · reise seg –" });
  assert.equal(SPPB.result(s({ sbs: "nei", gaitNo: true, chairNo: true })).tone, "crit");
  assert.equal(SPPB.result(s({ ...full, tandem: "", tandemNo: true, chair: "", chairNo: true })).tone, "crit"); // 2+4+0 = 6
  assert.equal(SPPB.result(s({ ...full, chair: "14,1" })).tone, "ok"); // 4+4+2 = 10
  assert.equal(SPPB.result(s({ ...full, chair: "17" })).tone, "warn"); // 4+4+1 = 9
  assert.match(SPPB.result(s({ ...full, tandem: "5", chair: "17" })).sub, /≤8: nedsatt fysisk funksjon/); // 8
});

test("toText: klarte ikke-tekster og ingen EWGSOP2 over 8", () => {
  const t = SPPB.toText(s({ sbs: "nei", gaitNo: true, chairNo: true }));
  assert.equal(t.split("\n")[0], "SPPB: 0/12. Balanse 0/4, ganghastighet 0/4 (klarte ikke), reise seg 5 ganger 0/4 (klarte ikke).");
  assert.doesNotMatch(SPPB.toText(s(full)), /EWGSOP2/);
});

test("eksempel: tandem 5,2, gange 5,9/5,4, stol 14,1, forrige 6", () => {
  const st = s({ sbs: "ja", semi: "ja", tandem: "5,2", g1: "5,9", g2: "5,4", chair: "14,1", prev: "6" });
  const P = scoreSppb(st);
  assert.equal(P.bal, 3);
  assert.equal(P.gait, 3);
  assert.equal(P.chair, 2);
  assert.equal(P.total, 8);
  const t = SPPB.toText(st);
  assert.match(t, /4 m på 5,40 s = 0,74 m\/s/);
  assert.match(t, /6 → 8 poeng \(\+2 poeng, bedring; betydelig endring\)/);
});
