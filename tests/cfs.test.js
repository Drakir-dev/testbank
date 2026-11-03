import { test } from "node:test";
import assert from "node:assert/strict";
import CFS, { CFS_LEVELS, interpretCfs } from "../js/modules/cfs.js";

const s = o => ({ ...CFS.initState(), ...o });
const p74 = { age: "74", sex: "kvinne" };

test("ni nivåer", () => {
  assert.equal(CFS_LEVELS.length, 9);
  CFS_LEVELS.forEach((l, i) => assert.equal(l.n, i + 1));
});

test("tolkning per nivå", () => {
  for (const n of [1, 2, 3]) assert.deepEqual(interpretCfs(n), { main: "Ikke skrøpelig", range: "CFS 1–3", tone: "ok" });
  assert.deepEqual(interpretCfs(4), { main: "Svært lett skrøpelighet (økt sårbarhet)", range: "CFS 4", tone: "warn" });
  assert.equal(interpretCfs(5).main, "Skrøpelig, mild grad");
  assert.equal(interpretCfs(6).main, "Skrøpelig, moderat grad");
  assert.equal(interpretCfs(7).main, "Skrøpelig, alvorlig grad");
  assert.equal(interpretCfs(8).main, "Skrøpelig, svært alvorlig grad");
  for (const n of [5, 6, 7, 8]) assert.equal(interpretCfs(n).range, "CFS ≥5");
  assert.deepEqual(interpretCfs(9), { main: "Terminalt syk", range: "CFS 9", tone: "crit" });
});

test("uten valgt nivå: ingen tekst", () => {
  assert.equal(CFS.result(s({}), p74), null);
  assert.equal(CFS.toText(s({}), p74), null);
});

test("eksempel: CFS 5, forrige 4", () => {
  const st = s({ level: "5", prev: "4" });
  assert.deepEqual(CFS.result(st, p74), { tone: "lvl", lvl: 5, big: "5", main: "Skrøpelig, mild grad", sub: "Lever med mild skrøpelighet · CFS ≥5 · endring 4 → 5 (+1)" });
  assert.equal(CFS.toText(st, p74), [
    "Clinical Frailty Scale (CFS v2.0): 5 – Lever med mild skrøpelighet.",
    "Vurdert ut fra habituell funksjon ca. 2 uker før aktuell sykdom/forverring.",
    "Tolkning: Skrøpelig, mild grad (CFS ≥5).",
    "Endring fra forrige vurdering: CFS 4 → 5 (+1 nivå, forverring). Ingen etablert MCID for CFS."
  ].join("\n"));
});

test("forrige utenfor 1–9 ignoreres, bedring og uendret", () => {
  assert.doesNotMatch(CFS.toText(s({ level: "5", prev: "0" }), p74), /Endring/);
  assert.doesNotMatch(CFS.toText(s({ level: "5", prev: "10" }), p74), /Endring/);
  assert.match(CFS.toText(s({ level: "4", prev: "6" }), p74), /CFS 6 → 4 \(−2 nivå, bedring\)/);
  assert.match(CFS.toText(s({ level: "4", prev: "4" }), p74), /CFS 4 → 4 \(±0 nivå, uendret\)/);
});

test("aktuell funksjon, kilder og kommentar", () => {
  const t = CFS.toText(s({ level: "3", basis: "aktuell", sources: ["Pasient", "Klinisk observasjon"], note: "  Lett kognitiv svikt.  " }), p74);
  assert.match(t, /Vurdert ut fra aktuell funksjon ved undersøkelsen\. Kilde: pasient, klinisk observasjon\./);
  assert.match(t, /\nKommentar: Lett kognitiv svikt\.$/);
});

test("merknad under 65 år", () => {
  assert.match(CFS.toText(s({ level: "3" }), { age: "64", sex: "" }), /validert for personer ≥65 år/);
  assert.doesNotMatch(CFS.toText(s({ level: "3" }), { age: "65", sex: "" }), /validert/);
  assert.doesNotMatch(CFS.toText(s({ level: "3" }), { age: "", sex: "" }), /validert/);
});
