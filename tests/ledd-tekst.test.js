/* Tekstfeltene i js/data/ledd-tekst.js: én nøkkel per leddkode, og teksten vises (escapet) bare når den er fylt ut. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { KOOS_TEXT, HOOS_TEXT, IKDC_TEXT, ACLRSI_TEXT } from "../js/data/ledd-tekst.js";
import { KOOS_DEF } from "../js/modules/koos.js";
import { HOOS_DEF } from "../js/modules/hoos.js";
import IKDC, { IKDC_ITEMS } from "../js/modules/ikdc.js";
import { ACLRSI_N } from "../js/modules/aclrsi.js";
import { codes, itemRow, itemText, itemEntry } from "../js/lib/koos-hoos.js";

/* Object.keys setter tallnøkler («10») først, så vi sammenligner sortert */
const keys = o => Object.keys(o).sort();
const sorted = a => [...a].sort();

test("én tekstnøkkel per leddkode", () => {
  assert.deepEqual(keys(KOOS_TEXT), sorted(KOOS_DEF.subscales.flatMap(codes)));
  assert.deepEqual(keys(HOOS_TEXT), sorted(HOOS_DEF.subscales.flatMap(codes)));
  assert.deepEqual(keys(IKDC_TEXT), sorted(IKDC_ITEMS.map(x => x.code)));
  assert.deepEqual(keys(ACLRSI_TEXT), sorted(Array.from({ length: ACLRSI_N }, (_, i) => String(i + 1))));
});

test("KOOS, HOOS og ACL-RSI er tekster", () => {
  for (const o of [KOOS_TEXT, HOOS_TEXT, ACLRSI_TEXT])
    for (const [k, v] of Object.entries(o)) assert.equal(typeof v, "string", k);
});

test("IKDC: hvert ledd har spørsmål, og svaralternativene dekker nøyaktig poengene 0–maks", () => {
  for (const it of IKDC_ITEMS) {
    const e = itemEntry(IKDC_TEXT, it.code);
    assert.ok(e.q, `ledd ${it.code} mangler spørsmål`);
    if (e.opts) assert.deepEqual(e.opts.map(([v]) => v).sort((a, b) => a - b), Array.from({ length: it.max + 1 }, (_, v) => v), `ledd ${it.code}`);
  }
  assert.deepEqual(IKDC_TEXT["6"].opts, [[0, "Ja"], [1, "Nei"]]);
  assert.equal(IKDC_TEXT["1"].opts[0][0], 4);     // skjemaets rekkefølge: 4 først
  assert.match(IKDC_TEXT["2"].q, /0 = Aldri, 10 = Konstant/);
});

test("IKDC-skjemaet viser overskrifter, forklaring og svaralternativer med poeng", () => {
  const html = IKDC.form(IKDC.initState());
  for (const h of ["Symptomer", "Sportsaktiviteter", "Funksjonsevne"]) assert.match(html, new RegExp(`<div class="sub-h">${h}</div>`));
  assert.match(html, /<label><input type="radio" name="ikdc-1" id="ikdc-1-4" data-k="i1" value="4"><span><b>4<\/b> Veldig anstrengende/);
  assert.match(html, /id="ikdc-6-0" data-k="i6" value="0"><span><b>0<\/b> Ja<\/span>/);
  assert.equal((html.match(/type="radio"/g) || []).length, IKDC_ITEMS.reduce((a, x) => a + x.max + 1, 0));
  assert.match(html, /Funksjonsevne før kneskaden skåres ikke/);
});

test("itemEntry godtar både tekst og objekt", () => {
  assert.deepEqual(itemEntry({ a: " x " }, "a"), { q: "x" });
  assert.deepEqual(itemEntry({ a: { q: " y ", head: "H" } }, "a"), { q: "y", head: "H" });
  assert.deepEqual(itemEntry({}, "a"), { q: "" });
});

test("tom tekst gir bare leddkoden", () => {
  assert.equal(itemText({ P1: "  " }, "P1"), "");
  assert.equal(itemText(undefined, "P1"), "");
  const html = itemRow("koos", "P1", "P1", 4, "");
  assert.doesNotMatch(html, /ktext/);
  assert.match(html, /aria-label="P1"/);
});

test("utfylt tekst vises og escapes", () => {
  assert.equal(itemText({ P1: " Spørsmål <b> \"x\" " }, "P1"), "Spørsmål <b> \"x\"");
  const html = itemRow("koos", "P1", "P1", 4, "Spørsmål <b> & \"x\"");
  assert.match(html, /<span class="ktext"><b class="kno">P1<\/b> Spørsmål &lt;b&gt; &amp; &quot;x&quot;<\/span>/);
  assert.doesNotMatch(html, /kcode/);
  assert.match(html, /aria-label="P1: Spørsmål &lt;b&gt; &amp; &quot;x&quot;"/);
  assert.equal((html.match(/type="radio"/g) || []).length, 5);
});

test("ledd 9a–9i vises 4–0 som på skjemaet, andre ledd 0–maks", () => {
  const html = IKDC.form(IKDC.initState());
  const order = code => [...html.matchAll(new RegExp(`id="ikdc-${code}-(\\d+)"`, "g"))].map(m => Number(m[1]));
  for (const l of "abcdefghi") assert.deepEqual(order("9" + l), [4, 3, 2, 1, 0], "9" + l);
  assert.deepEqual(order("2"), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.deepEqual(order("6"), [0, 1]);
  assert.deepEqual([...itemRow("x", "P1", "P1", 4, "", "", null, true).matchAll(/value="(\d)"/g)].map(m => m[1]), ["4", "3", "2", "1", "0"]);
});

test("ledd med 0–10 får klassen s11 (seks kolonner på mobil, én rad på bred skjerm), 0–4 bruker standard", () => {
  assert.match(itemRow("ikdc", "2", "i2", 10, ""), /class="scores s11">/);
  assert.doesNotMatch(itemRow("ikdc", "2", "i2", 10, ""), /grid-template-columns/);
  assert.match(itemRow("ikdc", "6", "i6", 1, ""), /repeat\(2,1fr\)/);
  assert.doesNotMatch(itemRow("koos", "P1", "P1", 4, ""), /grid-template-columns/);
});
