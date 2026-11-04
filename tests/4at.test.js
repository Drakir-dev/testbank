import { test } from "node:test";
import assert from "node:assert/strict";
import FOURAT, { FOURAT_ITEMS, fouratPoints, score4at, interpret4at } from "../js/modules/4at.js";
import { FOURAT_TEXT } from "../js/data/ledd-tekst.js";
import { CATEGORIES, TESTS } from "../js/registry.js";

const s = (o = {}) => Object.assign(FOURAT.initState(), o);
/* Valgt alternativ (indeks) per ledd */
const pick = (a1, a2, a3, a4) => s({ a1: String(a1), a2: String(a2), a3: String(a3), a4: String(a4) });

test("kategorien Kognisjon kommer rett etter Skrøpelighet, og 4AT ligger der", () => {
  assert.equal(CATEGORIES[1], "Kognisjon");
  assert.equal(TESTS.find(t => t.id === "4at").category, "Kognisjon");
});

test("teksten har ett svaralternativ per poengverdi i hvert ledd", () => {
  assert.deepEqual(Object.keys(FOURAT_TEXT), ["1", "2", "3", "4"]);
  for (const it of FOURAT_ITEMS) {
    const e = FOURAT_TEXT[it.code];
    assert.ok(e.q && e.help, it.code);
    assert.equal(e.opts.length, it.points.length, it.code);
  }
});

test("skjemaet viser norsk tekst med poeng, og ledd 1 har to alternativer med 0 poeng", () => {
  const html = FOURAT.form(FOURAT.initState());
  assert.equal((html.match(/type="radio"/g) || []).length, 11);
  assert.match(html, /id="q4at-1-1" data-k="a1" value="1"><span><b>0<\/b> Lett søvnig &lt; 10 sekunder/);
  assert.match(html, /id="q4at-1-2" data-k="a1" value="2"><span><b>4<\/b> Tydelig unormal\(t\)/);
  assert.match(html, /<b class="kno">\[3\]<\/b> OPPMERKSOMHET/);
});

test("poeng per alternativ", () => {
  const [a1, a2, , a4] = FOURAT_ITEMS;
  assert.equal(fouratPoints(a1, "0"), 0);
  assert.equal(fouratPoints(a1, "1"), 0);
  assert.equal(fouratPoints(a1, "2"), 4);
  assert.equal(fouratPoints(a1, "3"), null);
  assert.equal(fouratPoints(a2, "2"), 2);
  assert.equal(fouratPoints(a4, "1"), 4);
  assert.equal(fouratPoints(a4, ""), null);
});

test("totalskår 0–12, og alle ledd må være besvart", () => {
  assert.equal(score4at(pick(0, 0, 0, 0)).total, 0);
  assert.equal(score4at(pick(2, 2, 2, 1)).total, 12);
  assert.equal(score4at(pick(1, 1, 0, 0)).total, 1);
  assert.deepEqual(score4at(s({ a1: "2", a2: "1" })), { total: null, points: [4, 1, null, null], answered: 2 });
});

test("grenser: 0 usannsynlig, 1–3 mulig kognitiv svikt, ≥4 mulig delirium", () => {
  assert.equal(interpret4at(0).tone, "ok");
  assert.equal(interpret4at(1).main, "Mulig kognitiv svikt");
  assert.equal(interpret4at(3).main, "Mulig kognitiv svikt");
  assert.equal(interpret4at(4).main, "Mulig delirium og/eller kognitiv svikt");
  assert.equal(interpret4at(4).tone, "crit");
});

test("tomt og delvis utfylt skjema", () => {
  assert.equal(FOURAT.result(s()), null);
  assert.equal(FOURAT.toText(s()), null);
  assert.equal(FOURAT.result(s({ a1: "0" })).main, "1 av 4 ledd besvart");
  assert.equal(FOURAT.toText(s({ a1: "0" })), null);
});

test("eksempel: full DIPS-tekst ved mulig delirium, med endring", () => {
  assert.equal(FOURAT.toText({ ...pick(0, 1, 0, 1), prev: "7" }), [
    "4AT: 5 av 12 (årvåkenhet 0, AMT4 1, oppmerksomhet 0, akutt endring 4).",
    "Tolkning: Mulig delirium og/eller kognitiv svikt (≥4; 4AT v1.2, Bellelli 2014). Ikke diagnostisk.",
    "Endring fra forrige: 4AT 7 → 5 (−2 poeng, bedring). Ingen etablert MCID for 4AT."
  ].join("\n"));
});

test("DIPS-tekst ved 0 og ved 1–3", () => {
  assert.equal(FOURAT.toText(pick(1, 0, 0, 0)), [
    "4AT: 0 av 12 (årvåkenhet 0, AMT4 0, oppmerksomhet 0, akutt endring 0).",
    "Tolkning: Delirium eller alvorlig kognitiv svikt usannsynlig (0; 4AT v1.2). Delirium er fortsatt mulig hvis informasjonen om akutt endring er ufullstendig. Ikke diagnostisk."
  ].join("\n"));
  assert.equal(FOURAT.toText(pick(0, 2, 1, 0)).split("\n")[1], "Tolkning: Mulig kognitiv svikt (1–3; 4AT v1.2). Ikke diagnostisk.");
});
