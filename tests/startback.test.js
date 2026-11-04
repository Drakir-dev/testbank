import { test } from "node:test";
import assert from "node:assert/strict";
import SB, { sbPoints, scoreStartBack, sbRisk } from "../js/modules/startback.js";
import { STARTBACK_TEXT } from "../js/data/ledd-tekst.js";

const s = (o = {}) => Object.assign(SB.initState(), o);
/* a = ledd 1–4 (0/1), p = ledd 5–8 (0/1), q9 = svaralternativ 1–5 */
const ans = (a, p, q9) => ({ b1: a[0], b2: a[1], b3: a[2], b4: a[3], b5: p[0], b6: p[1], b7: p[2], b8: p[3], b9: q9 });

test("9 ledd, tekstnøkkel per ledd, enig/uenig på 1–8 og 1–5 på ledd 9", () => {
  assert.deepEqual(Object.keys(STARTBACK_TEXT), ["1", "2", "3", "4", "5", "6", "7", "8", "9"]);
  const html = SB.form(SB.initState());
  assert.equal((html.match(/role="radiogroup"/g) || []).length, 9);
  assert.match(html, /id="startback-1-1" data-k="b1" value="1"><span><b>1<\/b> Enig/);
  assert.match(html, /id="startback-9-5"/);
  assert.doesNotMatch(html, /id="startback-9-0"/);
});

test("ledd 9: svaralternativ 4 og 5 gir 1 poeng (Hill 2008)", () => {
  assert.equal(sbPoints(9, "3"), 0);
  assert.equal(sbPoints(9, "4"), 1);
  assert.equal(sbPoints(9, "5"), 1);
  assert.equal(sbPoints(9, "6"), null);
  assert.equal(sbPoints(1, "1"), 1);
  assert.equal(sbPoints(1, "2"), null);
});

test("totalskår og psykososial delskår (ledd 5–9)", () => {
  assert.deepEqual(scoreStartBack(s(ans("1111", "1111", "5"))), { total: 9, psych: 5, answered: 9 });
  assert.deepEqual(scoreStartBack(s(ans("0000", "0000", "1"))), { total: 0, psych: 0, answered: 9 });
  assert.deepEqual(scoreStartBack(s({ ...ans("1111", "1111", "5"), b9: "" })), { total: null, psych: null, answered: 8 });
});

test("risikogrupper: total 3 lav, total 4 med psykososial 3 middels, psykososial 4 høy", () => {
  assert.equal(sbRisk(3, 3).risk, "lav risiko");
  assert.equal(sbRisk(4, 3).risk, "middels risiko");
  assert.equal(sbRisk(9, 3).risk, "middels risiko");
  assert.equal(sbRisk(4, 4).risk, "høy risiko");
  const st = s(ans("1100", "1110", "4")); // total 6, psykososial 4
  assert.equal(SB.result(st).main, "Høy risiko");
});

test("tomt skjema gir ingen tekst", () => {
  assert.equal(SB.result(s()), null);
  assert.equal(SB.toText(s()), null);
});

test("eksempel: full DIPS-tekst", () => {
  const st = s({ ...ans("1110", "1010", "3"), prev: "7" }); // total 5, psykososial 2
  assert.equal(SB.toText(st), [
    "STarT Back: totalskår 5 av 9, psykososial delskår 2 av 5.",
    "Tolkning: Middels risiko for langvarige plager (lav: total 0–3; middels: total ≥4 og psykososial ≤3; høy: psykososial ≥4; Hill 2008).",
    "Endring fra forrige: totalskår 7 → 5 (−2 poeng; over SDC). Ingen etablert MCID. SDC 1,6 poeng (korsryggsmerte i fysioterapi, norsk versjon, Robinson & Dagfinrud 2017)."
  ].join("\n"));
});
