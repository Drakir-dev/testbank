/* Sammenligner de nye modulene med prototypen (prototype/testbank.html) for et stort sett input:
   alle grenseverdier, tomme og ugyldige felt og alle profiler. result() og toText() skal være identiske. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { TESTS, CATEGORIES } from "../js/registry.js";
import { proto } from "./hjelpere/prototype.js";

const ages = ["", "17", "18", "39", "40", "59", "60", "64", "65", "69", "70", "74", "75", "79", "80", "84", "85", "89", "90", "94", "95", "99", "100"];
const PROFILES = ages.flatMap(age => ["", "kvinne", "mann"].map(sex => ({ age, sex })));
const P74 = [{ age: "74", sex: "kvinne" }];

/* Alle kombinasjoner av verdiene i et objekt med lister */
function* combos(spec) {
  const keys = Object.keys(spec);
  function* rec(i, acc) {
    if (i === keys.length) { yield { ...acc }; return; }
    for (const v of spec[keys[i]]) { acc[keys[i]] = v; yield* rec(i + 1, acc); }
  }
  yield* rec(0, {});
}

/* Objekter fra vm-konteksten har andre prototyper, så vi sammenligner som JSON */
function same(id, states, profiles) {
  const mine = TESTS.find(t => t.id === id), theirs = proto.TESTS.find(t => t.id === id);
  let n = 0;
  for (const s of states) for (const p of profiles) {
    const a = JSON.stringify([theirs.result({ ...s }, p), theirs.toText({ ...s }, p)]);
    const b = JSON.stringify([mine.result({ ...s }, p), mine.toText({ ...s }, p)]);
    assert.equal(b, a, `${id} ${JSON.stringify(s)} ${JSON.stringify(p)}`);
    n++;
  }
  assert.ok(n > 0);
}

/* Testene som var ferdige i prototypen. Tester bygget senere sammenlignes ikke. */
const PROTO_ACTIVE = proto.TESTS.filter(t => t.status === "aktiv").map(t => t.id);

test("registeret: samme tester, rekkefølge og kategorier", () => {
  assert.equal(JSON.stringify(TESTS.map(t => [t.id, t.name, t.category])), JSON.stringify(proto.TESTS.map(t => [t.id, t.name, t.category])));
  for (const id of PROTO_ACTIVE) assert.equal(TESTS.find(t => t.id === id).status, "aktiv", id);
  assert.equal(JSON.stringify(CATEGORIES), JSON.stringify(proto.CATEGORIES));
});

test("skjema, veiledning og grunntilstand er uendret", () => {
  for (const t of TESTS.filter(t => PROTO_ACTIVE.includes(t.id))) {
    const p = proto.TESTS.find(x => x.id === t.id);
    for (const k of ["title", "meta", "guide"]) assert.equal(t[k], p[k], `${t.id}.${k}`);
    assert.equal(t.form(t.initState()), p.form(p.initState()), `${t.id}.form`);
    assert.equal(JSON.stringify(t.initState()), JSON.stringify(p.initState()), `${t.id}.initState`);
  }
});

test("CFS", () => {
  same("cfs", combos({
    level: ["", "1", "2", "3", "4", "5", "6", "7", "8", "9"], basis: ["habituell", "aktuell"],
    sources: [[], ["Pasient", "Journal"]], prev: ["", "0", "1", "4", "9", "10"], note: ["", "  Kognitiv svikt.  "]
  }), PROFILES);
});

test("TUG", () => {
  same("tug", combos({
    time: ["", "0", "5", "11,9", "12", "13,4", "13,49", "13,5", "20", "abc"], aid: ["ingen", "stokk/krykke", "rullator", "annet hjelpemiddel"], prev: ["", "13", "14,2", "15,5"]
  }), PROFILES);
});

test("30 s sit-to-stand", () => {
  same("sts30", combos({
    reps: ["", "0", "3", "4", "7", "8", "9", "10", "11", "12", "13", "14", "15", "20"], arms: [false, true], prev: ["", "6", "9"]
  }), PROFILES);
});

test("10 m gangtest", () => {
  same("10mwt", combos({
    time: ["", "0", "4", "6", "6,5", "7,49", "7,5", "7,51", "10", "12"], dist: ["6", "10", ""], pace: ["selvvalgt", "maksimalt"],
    aid: ["ingen", "rullator"], prev: ["", "0,72", "0,75", "0,9"]
  }), P74);
});

test("Ettbensstående", () => {
  const v = ["", "0", "4,9", "5", "16,6", "16,7", "45"];
  same("ols", combos({ ro: v, lo: v, rc: ["", "3"], lc: ["", "2,5"] }), PROFILES);
});

test("Berg balanseskala", () => {
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const states = [];
  for (let k = 0; k < 400; k++) {
    const s = { prev: ["", "0", "24", "25", "34", "35", "44", "45", "56"][k % 9] };
    const filled = k % 10 === 0 ? Math.floor(rnd() * 14) : 14; // noen ufullstendige skjema
    for (let i = 0; i < 14; i++) s["b" + i] = i < filled ? String(Math.floor(rnd() * 5)) : "";
    states.push(s);
  }
  for (const t of [0, 20, 21, 44, 45, 56]) { // eksakte grenser
    const s = { prev: "" }; let r = t;
    for (let i = 0; i < 14; i++) { const x = Math.min(4, r); s["b" + i] = String(x); r -= x; }
    states.push(s);
  }
  same("berg", states, P74);
});

test("SPPB", () => {
  const states = [...combos({
    sbs: ["", "ja", "nei"], semi: ["", "ja", "nei"], tandem: ["", "2,99", "3", "9,99", "10"], tandemNo: [false, true],
    g1: ["", "0", "4,81", "4,82", "6,2", "6,21", "8,7", "8,71", "60"], g2: ["", "5,4"], gaitNo: [false, true],
    chair: ["", "11,19", "11,2", "13,69", "13,7", "16,69", "16,7", "60", "60,01"], chairNo: [false, true], prev: [""]
  })];
  for (const prev of ["6", "7", "7,5", "8", "12"]) for (const chair of ["11", "14,1", "17"])
    states.push({ sbs: "ja", semi: "ja", tandem: "5,2", tandemNo: false, g1: "5,9", g2: "5,4", gaitNo: false, chair, chairNo: false, prev });
  same("sppb", states, P74);
});
