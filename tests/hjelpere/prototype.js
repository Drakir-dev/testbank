/* Laster testdefinisjonene fra prototype/testbank.html i en isolert vm-kontekst,
   slik at de nye modulene kan sammenlignes med prototypen. Bare den rene delen av
   skriptet kjøres (alt før «App (kun minne)»), så ingen DOM trengs. */
import { readFileSync } from "node:fs";
import vm from "node:vm";

const html = readFileSync(new URL("../../prototype/testbank.html", import.meta.url), "utf8");
const script = html.slice(html.indexOf("<script>") + "<script>".length, html.indexOf("</script>"));
const pure = script.slice(0, script.indexOf("/* ---------- App (kun minne)"));
if (!pure.includes("const TESTS")) throw new Error("Fant ikke testregisteret i prototypen");

export const proto = vm.runInNewContext(pure + "\n;({ CFS, TUG, STS, GAIT, OLS, BERG, SPPB, TESTS, CATEGORIES });");

/* Prototypens samlede DIPS-tekst, som updateOutput() i prototypen */
export const protoDips = (selected, states, profile) =>
  selected.map(id => proto.TESTS.find(t => t.id === id).toText(states[id], profile)).filter(Boolean).join("\n\n");
