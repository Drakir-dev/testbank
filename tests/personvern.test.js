/* Vakt for personvernreglene i CLAUDE.md: ingen lagring i nettleseren, ingen sporing og ingen eksterne kall. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const walk = dir => readdirSync(join(root, dir), { withFileTypes: true })
  .flatMap(e => e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]);

const code = [...walk("js"), "sw.js"].filter(f => /\.js$/.test(f) && existsSync(join(root, f)));
const pages = ["index.html", "manifest.webmanifest", ...walk("css")].filter(f => existsSync(join(root, f)));
const read = f => readFileSync(join(root, f), "utf8");

const FORBIDDEN = [
  [/localStorage|sessionStorage/, "nettleserlagring"],
  [/indexedDB/, "IndexedDB"],
  [/document\.cookie|cookieStore/, "cookies"],
  [/sendBeacon|XMLHttpRequest|WebSocket|EventSource/, "nettverkskall"],
  [/https?:\/\//, "ekstern adresse"]
];

test("koden lagrer ingenting og kaller ingen eksterne tjenester", () => {
  assert.ok(code.length > 5);
  for (const f of code) for (const [re, what] of FORBIDDEN)
    assert.doesNotMatch(read(f), re, `${f}: ${what}`);
});

test("fetch brukes bare i service workeren", () => {
  for (const f of code.filter(f => f !== "sw.js")) assert.doesNotMatch(read(f), /\bfetch\s*\(/, f);
});

test("ingen spørsmål om navn, fødselsdato eller fødselsnummer", () => {
  for (const f of code) assert.doesNotMatch(read(f), /fødselsdato"|fødselsnummer"|data-k="(navn|fnr|fodselsnummer)"/i, f);
});

test("HTML, CSS og manifest laster ingenting fra andre domener", () => {
  for (const f of pages) {
    const ext = read(f).match(/(?:src|href)\s*=\s*["']https?:\/\/[^"']+|url\(\s*["']?https?:\/\/[^)]+/g);
    assert.equal(ext, null, `${f}: ${ext}`);
  }
});
