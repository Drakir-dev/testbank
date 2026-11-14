/* Stoppeklokken: regning i js/lib/tid.js og «Ta tid»-knappene i skjemaene */
import { test } from "node:test";
import assert from "node:assert/strict";
import { capMs, reachedMax, secText, bestMs } from "../js/lib/tid.js";
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
