import { test } from "node:test";
import assert from "node:assert/strict";
import MC, { scoreMiniCog, interpretMiniCog } from "../js/modules/minicog.js";

const s = (o = {}) => Object.assign(MC.initState(), o);

test("skjemaet: ord 0–3 og klokke normal (2) eller unormal (0), uten ordlister", () => {
  const html = MC.form(MC.initState());
  assert.equal((html.match(/type="radio"/g) || []).length, 6);
  assert.match(html, /id="minicog-2-2" data-k="clock" value="2"><span><b>2<\/b> Normal klokke/);
  assert.match(html, /id="minicog-2-0" data-k="clock" value="0">/);
  assert.doesNotMatch(html, /id="minicog-2-1"/);
});

test("skåring: ord + klokke = 0–5, begge må være fylt ut", () => {
  assert.deepEqual(scoreMiniCog(s({ words: "3", clock: "2" })), { words: 3, clock: 2, total: 5 });
  assert.deepEqual(scoreMiniCog(s({ words: "0", clock: "0" })), { words: 0, clock: 0, total: 0 });
  assert.equal(scoreMiniCog(s({ words: "2" })).total, null);
  assert.equal(scoreMiniCog(s({ words: "4", clock: "2" })).words, null);
  assert.equal(scoreMiniCog(s({ words: "1", clock: "1" })).clock, null);
});

test("grense: 0–2 positiv, 3–5 negativ (Borson 2003)", () => {
  assert.equal(interpretMiniCog(2).main, "Positiv screening");
  assert.equal(interpretMiniCog(3).main, "Negativ screening");
  assert.equal(interpretMiniCog(0).tone, "warn");
  assert.equal(interpretMiniCog(5).tone, "ok");
});

test("tomt og delvis utfylt", () => {
  assert.equal(MC.result(s()), null);
  assert.equal(MC.toText(s()), null);
  assert.equal(MC.result(s({ clock: "2" })).main, "Fyll inn både ord og klokke");
  assert.equal(MC.toText(s({ clock: "2" })), null);
});

test("eksempel: full DIPS-tekst ved positiv screening, med endring", () => {
  assert.equal(MC.toText(s({ words: "2", clock: "0", prev: "4" })), [
    "Mini-Cog: 2 av 5 (ordgjenkalling 2 av 3, klokketest unormal 0 av 2).",
    "Tolkning: Positiv screening, økt sannsynlighet for klinisk betydningsfull kognitiv svikt (0–2; Borson 2003). Ikke diagnostisk.",
    "Endring fra forrige: Mini-Cog 4 → 2 (−2 poeng, forverring). Ingen etablert MCID for Mini-Cog."
  ].join("\n"));
});

test("skår 3 nevner den mer sensitive grensen <4", () => {
  assert.equal(MC.toText(s({ words: "1", clock: "2" })), [
    "Mini-Cog: 3 av 5 (ordgjenkalling 1 av 3, klokketest normal 2 av 2).",
    "Tolkning: Negativ screening, lavere sannsynlighet for demens, men utelukker ikke kognitiv svikt (3–5; Borson 2003). Ved grensen <4, som gir høyere sensitivitet, er skåren positiv. Ikke diagnostisk."
  ].join("\n"));
  assert.match(MC.result(s({ words: "1", clock: "2" })).sub, /<4/);
  assert.doesNotMatch(MC.toText(s({ words: "3", clock: "2" })), /<4/);
});
