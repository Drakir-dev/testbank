import { test } from "node:test";
import assert from "node:assert/strict";
import OREBRO, { OREBRO_ITEMS, orebroPoints, scoreOrebro, orebroRisk } from "../js/modules/orebro.js";
import { OREBRO_TEXT } from "../js/data/ledd-tekst.js";

const s = (o = {}) => Object.assign(OREBRO.initState(), o);
const it = code => OREBRO_ITEMS.find(x => x.code === code);
/* Laveste og høyeste poeng: ledd 5 antall områder, 6–7 rute, 8–25 kryss (snudde ledd motsatt) */
const best = () => Object.fromEntries(OREBRO_ITEMS.map(x => ["o" + x.code, String(x.type === "sites" ? 0 : x.type === "box" ? 1 : x.reverse ? 10 : 0)]));
const worst = () => Object.fromEntries(OREBRO_ITEMS.map(x => ["o" + x.code, String(x.type === "sites" ? 5 : x.type === "box" ? 10 : x.reverse ? 0 : 10)]));

test("21 skårede ledd (5–25), snudd skala på 12, 16, 17 og 21–25", () => {
  assert.equal(OREBRO_ITEMS.length, 21);
  assert.deepEqual(OREBRO_ITEMS.map(x => x.code), Array.from({ length: 21 }, (_, i) => String(i + 5)));
  assert.deepEqual(OREBRO_ITEMS.filter(x => x.reverse).map(x => x.code), ["12", "16", "17", "21", "22", "23", "24", "25"]);
  assert.deepEqual(Object.keys(OREBRO_TEXT).sort(), OREBRO_ITEMS.map(x => x.code).sort());
  const html = OREBRO.form(OREBRO.initState());
  assert.equal((html.match(/role="radiogroup"/g) || []).length, 20);
  assert.match(html, /id="orebro-6-1"/);
  assert.doesNotMatch(html, /id="orebro-6-0"/);
});

test("poeng per ledd (Lintons skåringsinstruksjon)", () => {
  assert.equal(orebroPoints(it("5"), "3"), 6);
  assert.equal(orebroPoints(it("5"), "6"), 10);   // maks 10
  assert.equal(orebroPoints(it("5"), "0"), 0);
  assert.equal(orebroPoints(it("6"), "3"), 3);
  assert.equal(orebroPoints(it("6"), "0"), null);
  assert.equal(orebroPoints(it("8"), "7"), 7);
  assert.equal(orebroPoints(it("12"), "7"), 3);
  assert.equal(orebroPoints(it("25"), "0"), 10);
  assert.equal(orebroPoints(it("8"), "11"), null);
  assert.equal(orebroPoints(it("8"), ""), null);
});

test("laveste skår 2 og høyeste 210", () => {
  assert.deepEqual(scoreOrebro(s(best())), { score: 2, answered: 21 });
  assert.deepEqual(scoreOrebro(s(worst())), { score: 210, answered: 21 });
});

test("alle 21 ledd må være besvart", () => {
  const st = s({ ...worst(), o25: "" });
  assert.deepEqual(scoreOrebro(st), { score: null, answered: 20 });
  assert.equal(OREBRO.toText(st), null);
  assert.equal(OREBRO.result(st).main, "20 av 21 ledd besvart");
});

test("risiko: 90 lav, 91 middels, 105 middels, 106 høy", () => {
  assert.equal(orebroRisk(90).risk, "lav risiko");
  assert.equal(orebroRisk(91).risk, "middels risiko");
  assert.equal(orebroRisk(105).risk, "middels risiko");
  assert.equal(orebroRisk(106).risk, "høy risiko");
});

test("tomt skjema gir ingen tekst", () => {
  assert.equal(OREBRO.result(s()), null);
  assert.equal(OREBRO.toText(s()), null);
});

test("eksempel: full DIPS-tekst", () => {
  // Ledd 5: 2 områder = 4. Ledd 6–7: 3 + 2. Ledd 8–25 kryss 5 overalt = 18 × 5 = 90. Sum 99.
  const st = s({ ...Object.fromEntries(OREBRO_ITEMS.map(x => ["o" + x.code, "5"])), o5: "2", o6: "3", o7: "2", prev: "112" });
  assert.equal(scoreOrebro(st).score, 99);
  assert.equal(OREBRO.toText(st), [
    "Örebro (ÖMPSQ): 99 av 210 (høyere = høyere risiko).",
    "Tolkning: Middels risiko for langvarig arbeidsuførhet (>105 høy risiko, Linton & Boersma 2003; >90 middels risiko, Linton).",
    "Endring fra forrige: 112 → 99 (−13 poeng). Ingen etablert MCID. Skjemaet er laget for screening, ikke for å måle effekt av behandling (Linton)."
  ].join("\n"));
});
