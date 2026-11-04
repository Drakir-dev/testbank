import { test } from "node:test";
import assert from "node:assert/strict";
import EQ5D, { EQ5D_DIMS, eq5dProfile, eq5dIndexNo, vasNorm, vasVal } from "../js/modules/eq5d.js";
import { EQ5D_NO_BETA, EQ5D_NO_LEVEL, EQ_VAS_NORM } from "../js/data/eq5d-no.js";

const s = (o = {}) => Object.assign(EQ5D.initState(), o);
const prof = code => Object.fromEntries(EQ5D_DIMS.map(([k], i) => [k, code[i]]));

test("fem dimensjoner med knapper 1–5", () => {
  const html = EQ5D.form(EQ5D.initState());
  assert.equal((html.match(/role="radiogroup"/g) || []).length, 5);
  assert.match(html, /id="eq5d-1-1" data-k="MO"/);
  assert.doesNotMatch(html, /id="eq5d-1-0"/);
});

test("koeffisienter fra Garratt 2024, Table 2 (hybridmodell uten konstantledd)", () => {
  assert.deepEqual(EQ5D_NO_BETA, { MO: 0.205, SC: 0.206, UA: 0.179, PD: 0.391, AD: 0.472 });
  assert.deepEqual(EQ5D_NO_LEVEL, [0, 0.152, 0.317, 0.775, 1]);
});

test("11111 gir 1 og 55555 gir −0,453 (laveste verdi oppgitt i Garratt 2024)", () => {
  assert.equal(eq5dIndexNo([1, 1, 1, 1, 1]), 1);
  assert.equal(eq5dIndexNo([5, 5, 5, 5, 5]), -0.453);
});

test("indeks for enkelttilstander", () => {
  assert.equal(eq5dIndexNo([2, 1, 1, 1, 1]), 0.969);   // 1 − 0,205 × 0,152
  assert.equal(eq5dIndexNo([1, 1, 1, 1, 5]), 0.528);   // 1 − 0,472
  assert.equal(eq5dIndexNo([2, 1, 2, 3, 2]), 0.746);   // 1 − 0,254059
});

test("profil krever alle fem dimensjoner 1–5", () => {
  assert.deepEqual(eq5dProfile(s(prof("21232"))), { levels: [2, 1, 2, 3, 2], code: "21232" });
  assert.equal(eq5dProfile(s({ ...prof("21232"), AD: "" })), null);
  assert.equal(eq5dProfile(s({ ...prof("21232"), AD: "6" })), null);
});

test("EQ VAS heltall 0–100", () => {
  assert.equal(vasVal("0"), 0);
  assert.equal(vasVal("100"), 100);
  assert.equal(vasVal("101"), null);
  assert.equal(vasVal("55,5"), null);
});

test("VAS-normer etter alder og kjønn (Garratt 2022, Table 6)", () => {
  assert.equal(EQ_VAS_NORM.length, 7);
  assert.deepEqual(vasNorm({ age: "74", sex: "kvinne" }), { mean: 77.6, sd: 18.4, label: "kvinner 70–79 år" });
  assert.deepEqual(vasNorm({ age: "79", sex: "mann" }), { mean: 78.4, sd: 17.8, label: "menn 70–79 år" });
  assert.deepEqual(vasNorm({ age: "80", sex: "" }), { mean: 67.8, sd: 23.9, label: "begge kjønn 80 år og eldre" });
  assert.deepEqual(vasNorm({ age: "18", sex: "mann" }), { mean: 78.4, sd: 16.4, label: "menn 18–29 år" });
  assert.equal(vasNorm({ age: "17", sex: "mann" }), null);
  assert.equal(vasNorm({ age: "", sex: "mann" }), null);
});

test("bare VAS gir tekst uten indeks", () => {
  const st = s({ vas: "70" });
  assert.equal(EQ5D.toText(st, { age: "", sex: "" }), "EQ-5D-5L: EQ VAS 70 av 100.");
  assert.equal(EQ5D.result(st, { age: "", sex: "" }).main, "EQ VAS (indeks krever alle fem dimensjoner)");
});

test("tomt skjema gir ingen tekst", () => {
  assert.equal(EQ5D.result(s(), {}), null);
  assert.equal(EQ5D.toText(s(), {}), null);
});

test("eksempel: full DIPS-tekst", () => {
  const st = s({ ...prof("21232"), vas: "60", prevIndex: "0,612", prevVas: "50" });
  assert.equal(EQ5D.toText(st, { age: "74", sex: "kvinne" }), [
    "EQ-5D-5L: helseprofil 21232 (gange 2, personlig stell 1, vanlige gjøremål 2, smerte/ubehag 3, angst/depresjon 2; 1 = ingen problemer, 5 = ekstreme problemer), indeks 0,746 (norsk verdisett, Garratt 2024). EQ VAS 60 av 100.",
    "Tolkning: EQ VAS 60 mot norm 77,6 (SD 18,4) for kvinner 70–79 år i normalbefolkningen (Garratt 2022); ingen etablert grenseverdi for indeksen.",
    "Endring fra forrige: indeks 0,612 → 0,746 (+0,134); EQ VAS 50 → 60 (+10). Ingen etablert MCID."
  ].join("\n"));
});
