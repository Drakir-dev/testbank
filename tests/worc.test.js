import { test } from "node:test";
import assert from "node:assert/strict";
import WORC, { WORC_VARIANTS, WORC_MAX, domainVal, scoreWorc, worcChange } from "../js/modules/worc.js";

const s = (o = {}) => Object.assign(WORC.initState(), o);
const full = (v, frac) => Object.fromEntries(WORC_VARIANTS[v].domains.map(([k, , n]) => [`${v}_${k}`, String(n * 100 * frac)]));

test("begge varianter har 21 ledd og maks 2100 mm", () => {
  for (const V of Object.values(WORC_VARIANTS)) {
    assert.equal(V.domains.reduce((a, d) => a + d[2], 0), 21);
  }
  assert.equal(WORC_MAX, 2100);
  assert.equal(WORC_VARIANTS.worc.domains.length, 5);
  assert.equal(WORC_VARIANTS.wosi.domains.length, 4);
});

test("domenesum må være heltall 0 til ledd × 100", () => {
  assert.equal(domainVal("600", 6), 600);
  assert.equal(domainVal("601", 6), null);
  assert.equal(domainVal("-1", 6), null);
  assert.equal(domainVal("12,5", 6), null);
});

test("0 mm gir 100 %, 2100 mm gir 0 %, halvparten gir 50 %", () => {
  assert.equal(scoreWorc(s(full("worc", 0))).pct, 100);
  assert.equal(scoreWorc(s(full("worc", 1))).pct, 0);
  assert.equal(scoreWorc(s({ variant: "wosi", ...full("wosi", 0.5) })).pct, 50);
  assert.equal(scoreWorc(s({ variant: "wosi", ...full("wosi", 0.5) })).total, 1050);
});

test("alle domener må fylles inn, og variantene har egne felt", () => {
  const st = s({ ...full("worc", 0.5), worc_fol: "" });
  assert.equal(scoreWorc(st).pct, null);
  assert.equal(scoreWorc(st).filled, 4);
  assert.equal(WORC.toText(st), null);
  assert.equal(WORC.result(st).main, "4 av 5 domener fylt inn");
  assert.equal(scoreWorc(s({ variant: "wosi", ...full("worc", 0.5) })).filled, 0);
});

test("WORC MCID 275 poeng ≈ 13,1 % (Ekeberg 2010): 13,0 under, 13,1 over", () => {
  const m = WORC_VARIANTS.worc.mcidPct;
  assert.deepEqual(worcChange(63, 50, m), { diff: 13, dir: "bedring", over: false });
  assert.deepEqual(worcChange(63.1, 50, m), { diff: 13.1, dir: "bedring", over: true });
});

test("WOSI MCID 10 % (Kirkley 1998): 9,9 under, 10,0 over", () => {
  const m = WORC_VARIANTS.wosi.mcidPct;
  assert.deepEqual(worcChange(59.9, 50, m), { diff: 9.9, dir: "bedring", over: false });
  assert.deepEqual(worcChange(40, 50, m), { diff: -10, dir: "forverring", over: true });
});

test("tomt skjema gir ingen tekst", () => {
  assert.equal(WORC.result(s()), null);
  assert.equal(WORC.toText(s()), null);
});

test("eksempel WORC: full DIPS-tekst", () => {
  // Sum 300 + 200 + 160 + 120 + 90 = 870 mm → (2100 − 870) / 2100 = 58,6 %
  const st = s({ worc_fys: "300", worc_sport: "200", worc_arb: "160", worc_liv: "120", worc_fol: "90", prev_worc: "42,5" });
  assert.equal(WORC.toText(st), [
    "WORC (Western Ontario Rotator Cuff Index): 58,6 % (sum 870 av 2100 mm; 0 % = verst, 100 % = ingen plager). Domener: fysiske symptomer 50,0 %, sport/fritid 50,0 %, arbeid 60,0 %, livsstil 70,0 %, følelser 70,0 %.",
    "Tolkning: Ingen etablert grenseverdi.",
    "Endring fra forrige: 42,5 → 58,6 % (+16,1 prosentpoeng, bedring; over MCID). MCID: 275 av 2100 poeng ≈ 13,1 % (rotatormansjettlidelse, norsk versjon, Ekeberg 2010)."
  ].join("\n"));
});

test("eksempel WOSI: full DIPS-tekst", () => {
  // Sum 400 + 200 + 100 + 150 = 850 mm → 59,5 %
  const st = s({ variant: "wosi", wosi_fys: "400", wosi_sport: "200", wosi_liv: "100", wosi_fol: "150", prev_wosi: "52" });
  assert.equal(WORC.toText(st), [
    "WOSI (Western Ontario Shoulder Instability Index): 59,5 % (sum 850 av 2100 mm; 0 % = verst, 100 % = ingen plager). Domener: fysiske symptomer 60,0 %, sport/fritid/arbeid 50,0 %, livsstil 75,0 %, følelser 50,0 %.",
    "Tolkning: Ingen etablert grenseverdi.",
    "Endring fra forrige: 52,0 → 59,5 % (+7,5 prosentpoeng, bedring; under MCID). MCID: 10 % (skulderinstabilitet, Kirkley 1998). MDC 9,2 % (operert fremre skulderinstabilitet, Elamo 2022)."
  ].join("\n"));
});
