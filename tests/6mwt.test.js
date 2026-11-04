import { test } from "node:test";
import assert from "node:assert/strict";
import W6, { read6mwt, extras6mwt } from "../js/modules/6mwt.js";

const s = (o = {}) => Object.assign(W6.initState(), o);

test("validering av feltene", () => {
  const v = read6mwt(s({ dist: "340", stops: "2", dysp: "4", fat: "5,5", hr0: "78", hr1: "112", sp0: "96", sp1: "93" }));
  assert.deepEqual(v, { dist: 340, prev: null, stops: 2, dysp: 4, fat: 5.5, hr0: 78, hr1: 112, sp0: 96, sp1: 93 });
  const bad = read6mwt(s({ dist: "1200", stops: "1,5", dysp: "11", hr0: "20", sp1: "101" }));
  assert.equal(bad.dist, null); assert.equal(bad.stops, null); assert.equal(bad.dysp, null); assert.equal(bad.hr0, null); assert.equal(bad.sp1, null);
});

test("tom distanse gir ingen tekst", () => {
  assert.equal(W6.result(s({ stops: "2" })), null);
  assert.equal(W6.toText(s({ stops: "2" })), null);
});

test("pauser, hjelpemiddel og ekstra målinger i teksten", () => {
  assert.equal(W6.toText(s({ dist: "400" })).split("\n")[0], "6-minutters gangtest: 400 m, uten ganghjelpemiddel.");
  assert.match(W6.toText(s({ dist: "400", stops: "0" })), /400 m, uten ganghjelpemiddel, uten pauser\./);
  assert.match(W6.toText(s({ dist: "400", stops: "1", aid: "rullator" })), /400 m, med rullator, 1 pause\./);
  assert.equal(extras6mwt(read6mwt(s({ hr1: "110" }))), "Puls ved slutt 110 /min.");
  assert.equal(extras6mwt(read6mwt(s({ sp0: "97" }))), "SpO₂ ved start 97 %.");
  assert.equal(extras6mwt(read6mwt(s({ fat: "3" }))), "Borg CR10 ved slutt: slitenhet 3.");
  assert.equal(extras6mwt(read6mwt(s())), null);
});

test("MCID 20 m og betydelig endring 50 m (Perera 2006)", () => {
  const ch = (d, p) => W6.toText(s({ dist: d, prev: p })).split("\n").pop();
  assert.match(ch("319", "300"), /\(\+19 m, bedring; under MCID\)/);
  assert.match(ch("320", "300"), /\(\+20 m, bedring; over MCID\)/);
  assert.match(ch("349", "300"), /\(\+49 m, bedring; over MCID\)/);
  assert.match(ch("350", "300"), /\(\+50 m, bedring; betydelig endring\)/);
  assert.match(ch("250", "300"), /\(−50 m, forverring; betydelig endring\)/);
});

test("eksempel: full DIPS-tekst", () => {
  assert.equal(W6.toText(s({ dist: "340", stops: "2", dysp: "4", fat: "5", hr0: "78", hr1: "112", sp0: "96", sp1: "93", prev: "300" })), [
    "6-minutters gangtest: 340 m, uten ganghjelpemiddel, 2 pauser.",
    "Borg CR10 ved slutt: dyspné 4, slitenhet 5. Puls 78 → 112 /min. SpO₂ 96 → 93 %.",
    "Tolkning: Ingen normverdier brukt; sammenlignes med pasientens tidligere målinger.",
    "Endring fra forrige: 300 → 340 m (+40 m, bedring; over MCID). MCID: 20 m (liten) og 50 m (betydelig endring; eldre og personer etter hjerneslag, Perera 2006)."
  ].join("\n"));
  assert.deepEqual(W6.result(s({ dist: "340", stops: "2", prev: "300" })), { tone: "none", big: "340", main: "340 m på 6 minutter", sub: "uten ganghjelpemiddel, 2 pauser · endring +40 m" });
});
