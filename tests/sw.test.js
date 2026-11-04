/* Sjekker at service workeren cacher alle appens filer, og bare dem. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const sw = readFileSync(join(root, "sw.js"), "utf8");
const ASSETS = JSON.parse(sw.match(/const ASSETS = (\[[\s\S]*?\]);/)[1]);
const walk = dir => readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]);
const files = ["js", "css", "fonts", "icons"].flatMap(d => walk(join(root, d)))
  .map(f => relative(root, f).split(sep).join("/"))
  .filter(f => !/\.txt$/.test(f)); // lisensfiler trengs ikke offline

test("alle filer i js/, css/, fonts/ og icons/ står i precache-listen", () => {
  for (const f of files) assert.ok(ASSETS.includes(f), `${f} mangler i ASSETS i sw.js`);
});

test("alle filer i precache-listen finnes", () => {
  for (const a of ASSETS) if (a !== "./") assert.ok(existsSync(join(root, a)), `${a} finnes ikke`);
  for (const a of ["./", "index.html", "manifest.webmanifest"]) assert.ok(ASSETS.includes(a), a);
});

test("cachenavnet er versjonert", () => {
  assert.match(sw, /const CACHE = "testbank-v\d+";/);
});

test("manifestet peker på eksisterende ikoner og har norsk navn", () => {
  const m = JSON.parse(readFileSync(join(root, "manifest.webmanifest"), "utf8"));
  assert.equal(m.name, "Testbank Fysio");
  assert.equal(m.lang, "nb");
  assert.equal(m.start_url, "./");
  for (const i of m.icons) assert.ok(ASSETS.includes(i.src), `${i.src} mangler i sw.js`);
  assert.ok(m.icons.some(i => i.sizes === "192x192") && m.icons.some(i => i.sizes === "512x512"));
});

test("versjonen i toppen er lik cacheversjonen", async () => {
  const { VERSION } = await import("../js/registry.js");
  assert.equal(`testbank-v${VERSION}`, sw.match(/const CACHE = "([^"]+)";/)[1]);
});
