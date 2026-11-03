/* Tekstfeltene i js/data/ledd-tekst.js: én nøkkel per leddkode, og teksten vises (escapet) bare når den er fylt ut. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { KOOS_TEXT, HOOS_TEXT, IKDC_TEXT, ACLRSI_TEXT } from "../js/data/ledd-tekst.js";
import { KOOS_DEF } from "../js/modules/koos.js";
import { HOOS_DEF } from "../js/modules/hoos.js";
import { IKDC_ITEMS } from "../js/modules/ikdc.js";
import { ACLRSI_N } from "../js/modules/aclrsi.js";
import { codes, itemRow, itemText } from "../js/lib/koos-hoos.js";

/* Object.keys setter tallnøkler («10») først, så vi sammenligner sortert */
const keys = o => Object.keys(o).sort();
const sorted = a => [...a].sort();

test("én tekstnøkkel per leddkode", () => {
  assert.deepEqual(keys(KOOS_TEXT), sorted(KOOS_DEF.subscales.flatMap(codes)));
  assert.deepEqual(keys(HOOS_TEXT), sorted(HOOS_DEF.subscales.flatMap(codes)));
  assert.deepEqual(keys(IKDC_TEXT), sorted(IKDC_ITEMS.map(x => x.code)));
  assert.deepEqual(keys(ACLRSI_TEXT), sorted(Array.from({ length: ACLRSI_N }, (_, i) => String(i + 1))));
});

test("alle tekster er strenger", () => {
  for (const o of [KOOS_TEXT, HOOS_TEXT, IKDC_TEXT, ACLRSI_TEXT])
    for (const [k, v] of Object.entries(o)) assert.equal(typeof v, "string", k);
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
  assert.match(html, /<span class="ktext">Spørsmål &lt;b&gt; &amp; &quot;x&quot;<\/span>/);
  assert.match(html, /aria-label="P1: Spørsmål &lt;b&gt; &amp; &quot;x&quot;"/);
  assert.equal((html.match(/type="radio"/g) || []).length, 5);
});

test("ledd med 0–10 får seks kolonner, 0–4 bruker standard", () => {
  assert.match(itemRow("ikdc", "2", "i2", 10, ""), /repeat\(6,1fr\)/);
  assert.match(itemRow("ikdc", "6", "i6", 1, ""), /repeat\(2,1fr\)/);
  assert.doesNotMatch(itemRow("koos", "P1", "P1", 4, ""), /grid-template-columns/);
});
