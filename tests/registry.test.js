/* Status per testkort (brukes i hurtignavigasjonen) */
import { test } from "node:test";
import assert from "node:assert/strict";
import { byId, testStatus } from "../js/registry.js";

test("status: tom, delvis og ferdig", () => {
  const t = byId("4at"), s = t.initState();
  assert.equal(testStatus(t, s, {}).status, "tom");
  s.a1 = "0";
  const d = testStatus(t, s, {});
  assert.equal(d.status, "delvis");
  assert.equal(d.r.main, "1 av 4 ledd besvart");
  Object.assign(s, { a2: "0", a3: "0", a4: "1" });
  const f = testStatus(t, s, {});
  assert.equal(f.status, "ferdig");
  assert.equal(f.r.big, "4");
});

test("MMSE-NR3 er ferdig også uten alder, men uten normtolkning", () => {
  const t = byId("mmsenr3"), s = Object.assign(t.initState(), { score: "27" });
  assert.equal(testStatus(t, s, { age: "" }).status, "ferdig");
  assert.equal(testStatus(t, s, { age: "" }).r.tone, "none");
  s.edu = "hoyere";
  assert.equal(testStatus(t, s, { age: "80" }).r.tone, "ok");
});
