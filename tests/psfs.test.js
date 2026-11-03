import { test } from "node:test";
import assert from "node:assert/strict";
import PSFS, { psfsVal, scorePsfs, psfsChange } from "../js/modules/psfs.js";

const s = (o = {}) => ({ ...PSFS.initState(), ...o });

test("bare hele tall 0–10 godtas", () => {
  assert.equal(psfsVal("0"), 0);
  assert.equal(psfsVal("10"), 10);
  assert.equal(psfsVal("11"), null);
  assert.equal(psfsVal("3,5"), null);
  assert.equal(psfsVal(""), null);
});

test("snitt av utfylte aktiviteter, avrundet til én desimal", () => {
  assert.deepEqual(scorePsfs(s()), { items: [], avg: null });
  const P = scorePsfs(s({ a1: " Gå i trapper ", s1: "3", s2: "2", a3: "Løpe", s3: "", s4: "8" }));
  assert.deepEqual(P.items, [{ name: "Gå i trapper", score: 3 }, { name: "aktivitet 2", score: 2 }, { name: "aktivitet 4", score: 8 }]);
  assert.equal(P.avg, 4.3);
  assert.equal(scorePsfs(s({ s1: "2", s2: "3" })).avg, 2.5);
  assert.equal(scorePsfs(s({ s1: "1", s2: "1", s3: "0" })).avg, 0.7);
});

test("MCID 2,3 (Abbott & Schmitt 2014): 2,2 under, 2,3 over", () => {
  assert.deepEqual(psfsChange(4.5, 2.3), { diff: 2.2, dir: "bedring", over: false });
  assert.deepEqual(psfsChange(4.3, 2.0), { diff: 2.3, dir: "bedring", over: true });
  assert.deepEqual(psfsChange(3.3, 1.0), { diff: 2.3, dir: "bedring", over: true });
  assert.deepEqual(psfsChange(2.0, 4.3), { diff: -2.3, dir: "forverring", over: true });
  assert.deepEqual(psfsChange(5, 5), { diff: 0, dir: "uendret", over: false });
});

test("resultat og tekst uten forrige", () => {
  assert.equal(PSFS.result(s()), null);
  assert.equal(PSFS.toText(s({ a1: "Løpe" })), null);
  const r = PSFS.result(s({ a1: "Løpe", s1: "6" }));
  assert.deepEqual(r, { tone: "none", big: "6,0", main: "Snitt 6,0 av 10", sub: "1 aktivitet · 0 = kan ikke, 10 = som før" });
  assert.doesNotMatch(PSFS.toText(s({ s1: "6" })), /Endring/);
});

test("ugyldig forrige snitt gir ingen endring", () => {
  assert.doesNotMatch(PSFS.toText(s({ s1: "6", prev: "12" })), /Endring/);
  assert.match(PSFS.result(s({ s1: "6", prev: "4" })).sub, /endring \+2,0 \(under MCID 2,3\)/);
});

test("eksempel: full DIPS-tekst", () => {
  const t = PSFS.toText(s({ a1: "gå i trapper", s1: "3", a2: "løpe", s2: "2", a3: "bære handleposer", s3: "8", prev: "2" }));
  assert.equal(t, [
    "Pasientspesifikk funksjonsskala (PSFS, 0 = kan ikke utføre, 10 = som før plagene): snitt 4,3 (3 aktiviteter).",
    "Aktiviteter: gå i trapper 3, løpe 2, bære handleposer 8.",
    "Tolkning: Ingen etablert grenseverdi; skåren er pasientspesifikk og brukes til å følge endring.",
    "Endring fra forrige: 2,0 → 4,3 (+2,3 poeng, bedring; over MCID). MCID: 2,3 poeng for middels endring (1,3 liten, 2,7 stor; muskel-skjelettlidelser, Abbott & Schmitt 2014)."
  ].join("\n"));
});
