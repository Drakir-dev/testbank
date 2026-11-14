/* Stoppeklokken: regning i js/lib/tid.js og «Ta tid»-knappene i skjemaene */
import { test } from "node:test";
import assert from "node:assert/strict";
import { capMs, reachedMax, secText, bestMs, remainingMs, countdownText, clockText, walkDistance, plural } from "../js/lib/tid.js";
import { TESTS } from "../js/registry.js";

test("secText: én desimal, desimalkomma, avrundet til nærmeste tidel", () => {
  assert.equal(secText(0), "0,0");
  assert.equal(secText(14234), "14,2");
  assert.equal(secText(14250), "14,3");
  assert.equal(secText(14249), "14,2");
  assert.equal(secText(45000), "45,0");
  assert.equal(secText(63400), "63,4");
  assert.equal(secText(-50), "0,0");
});

test("capMs: avkorter til makstiden, og bare når den er satt", () => {
  assert.equal(capMs(46200, 45), 45000);
  assert.equal(capMs(12300, 45), 12300);
  assert.equal(capMs(46200, 0), 46200);
  assert.equal(capMs(46200), 46200);
  assert.equal(capMs(-10, 45), 0);
});

test("reachedMax: sann fra og med makstiden, aldri uten makstid", () => {
  assert.equal(reachedMax(9999, 10), false);
  assert.equal(reachedMax(10000, 10), true);
  assert.equal(reachedMax(10400, 10), true);
  assert.equal(reachedMax(999999, 0), false);
  assert.equal(reachedMax(999999), false);
});

test("bestMs: lengste forsøk, null uten forsøk", () => {
  assert.equal(bestMs([]), null);
  assert.equal(bestMs([12300]), 12300);
  assert.equal(bestMs([12300, 15000, 9800]), 15000);
});

test("tiden fra stoppeklokken kan leses som tall av skjemaene", async () => {
  const { num } = await import("../js/lib/format.js");
  assert.equal(num(secText(14234)), 14.2);
  assert.equal(num(secText(capMs(46200, 45))), 45);
});

const forms = TESTS.filter(t => t.status === "aktiv").map(t => [t.id, t.form(t.initState())]);
const timers = html => [...html.matchAll(/<button[^>]*data-timer="up"[^>]*>/g)].map(m => m[0]);

test("hver «Ta tid»-knapp peker på et felt i samme skjema", () => {
  for (const [id, html] of forms) for (const b of timers(html)) {
    const target = b.match(/data-for="([^"]+)"/)?.[1];
    assert.ok(target, `${id}: knappen mangler data-for`);
    assert.ok(html.includes(`id="${target}"`), `${id}: feltet ${target} finnes ikke`);
    assert.match(b, /data-title="[^"]+"/, `${id}: knappen mangler data-title`);
  }
});

test("stoppeklokke i de tidtatte testene, med riktig makstid", () => {
  const count = Object.fromEntries(forms.map(([id, html]) => [id, timers(html)]).filter(([, b]) => b.length));
  assert.deepEqual(Object.keys(count).sort(), ["10mwt", "ols", "sppb", "tug"]);
  assert.equal(count.tug.length, 1);
  assert.equal(count["10mwt"].length, 1);
  // Ettbensstående: fire felt, maks 45 s (Springer 2007), best av flere forsøk
  assert.equal(count.ols.length, 4);
  for (const b of count.ols) { assert.match(b, /data-max="45"/); assert.match(b, /data-best/); }
  // SPPB: tandem maks 10 s. Gange og reise seg har ingen makstid i klokken:
  // over 60 s på fem reisinger skåres 0 med avkrysning, og 60,0 s ville gitt 1 poeng.
  assert.equal(count.sppb.length, 4);
  assert.equal(count.sppb.filter(b => /data-max=/.test(b)).length, 1);
  assert.match(count.sppb.find(b => /data-for="sppb-tandem"/.test(b)), /data-max="10"/);
});

/* ---------- Nedtelling og teller ---------- */

test("remainingMs og countdownText: runder opp, og 0:00 først når tiden er ute", () => {
  assert.equal(remainingMs(30, 0), 30000);
  assert.equal(remainingMs(30, 12400), 17600);
  assert.equal(remainingMs(30, 31000), 0);
  assert.equal(remainingMs(30, -5), 30000);
  assert.equal(countdownText(360000), "6:00");
  assert.equal(countdownText(359999), "6:00");
  assert.equal(countdownText(359000), "5:59");
  assert.equal(countdownText(30000), "0:30");
  assert.equal(countdownText(1), "0:01");
  assert.equal(countdownText(0), "0:00");
  assert.equal(countdownText(-100), "0:00");
});

test("clockText: medgått tid rundet ned", () => {
  assert.equal(clockText(0), "0:00");
  assert.equal(clockText(252900), "4:12");
  assert.equal(clockText(59999), "0:59");
  assert.equal(clockText(60000), "1:00");
});

test("walkDistance: lengder × banelengde + restmeter", () => {
  assert.equal(walkDistance(8, 30, 12), 252);
  assert.equal(walkDistance(3, 30, 12), 102);
  assert.equal(walkDistance(0, 30, 0), 0);
  assert.equal(walkDistance(8, 30, null), 240);
  assert.equal(walkDistance(8, 30, undefined), 240);
  assert.equal(walkDistance(10, 20, 20), 220);
  assert.equal(walkDistance(7, 25.5, 3.2), 182);   // 178,5 + 3,2 = 181,7 → 182
});

test("walkDistance: ugyldige verdier gir null, ikke et gjettet tall", () => {
  assert.equal(walkDistance(8, 0, 5), null);
  assert.equal(walkDistance(8, -30, 5), null);
  assert.equal(walkDistance(8, NaN, 5), null);
  assert.equal(walkDistance(8, 30, -1), null);
  assert.equal(walkDistance(8, 30, 31), null);     // restmeter kan ikke være lengre enn banen
  assert.equal(walkDistance(8, 30, NaN), null);
  assert.equal(walkDistance(-1, 30, 0), null);
  assert.equal(walkDistance(2.5, 30, 0), null);
});

test("plural", () => {
  assert.equal(plural(0, "pause", "pauser"), "0 pauser");
  assert.equal(plural(1, "pause", "pauser"), "1 pause");
  assert.equal(plural(11, "reising", "reisinger"), "11 reisinger");
});

const btn = (id, mode) => forms.find(([x]) => x === id)[1].match(new RegExp(`<button[^>]*data-timer="${mode}"[^>]*>`))?.[0];

test("sit-to-stand: nedtelling 30 s som setter antall reisinger", () => {
  const b = btn("sts30", "sts");
  assert.ok(b, "knappen mangler");
  assert.match(b, /data-for="sts-reps"/);
  assert.match(b, /data-seconds="30"/);
});

test("6MWT: nedtelling 6 min, bane 30 m, og felt for distanse og pauser finnes", () => {
  const b = btn("6mwt", "walk"), html = forms.find(([x]) => x === "6mwt")[1];
  assert.ok(b, "knappen mangler");
  assert.match(b, /data-seconds="360"/);
  assert.match(b, /data-lane="30"/);
  for (const attr of ["data-for", "data-stops"]) {
    const id = b.match(new RegExp(`${attr}="([^"]+)"`))?.[1];
    assert.ok(id && html.includes(`id="${id}"`), `${attr}: feltet finnes ikke`);
  }
});

test("distansen fra panelet godtas av 6MWT-skjemaet", async () => {
  const { read6mwt } = await import("../js/modules/6mwt.js");
  const v = read6mwt({ dist: String(walkDistance(8, 30, 12)), stops: "0", prev: "", dysp: "", fat: "", hr0: "", hr1: "", sp0: "", sp1: "" });
  assert.equal(v.dist, 252);
  assert.equal(v.stops, 0);
});

test("alle knapper med data-timer peker på et felt i samme skjema", () => {
  for (const [id, html] of forms) for (const m of html.matchAll(/<button[^>]*data-timer="[^"]+"[^>]*>/g)) {
    const target = m[0].match(/data-for="([^"]+)"/)?.[1];
    assert.ok(target && html.includes(`id="${target}"`), `${id}: ${target}`);
  }
});
