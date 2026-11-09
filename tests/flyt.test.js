import { test } from "node:test";
import assert from "node:assert/strict";
import { nextUnanswered, skipped } from "../js/lib/flyt.js";

test("neste ubesvarte etter et gitt ledd, ellers fra starten", () => {
  const a = [true, false, true, false, false];
  assert.equal(nextUnanswered(a, 0), 1);
  assert.equal(nextUnanswered(a, 1), 3);
  assert.equal(nextUnanswered(a, 3), 4);
  assert.equal(nextUnanswered(a, 4), 1);      // ingen etter, tilbake til første ubesvarte
  assert.equal(nextUnanswered(a), 1);         // uten utgangspunkt: første ubesvarte
  assert.equal(nextUnanswered([true, true]), -1);
  assert.equal(nextUnanswered([], 0), -1);
});

test("hoppede ledd er ubesvarte før det siste besvarte", () => {
  assert.deepEqual(skipped([true, false, true, false]), [false, true, false, false]);
  assert.deepEqual(skipped([false, false, false]), [false, false, false]);
  assert.deepEqual(skipped([false, true]), [true, false]);
  assert.deepEqual(skipped([true, true]), [false, false]);
});
