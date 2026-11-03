/* Patient Global Impression of Change (PGIC), 7 trinn kodet 1–7 som CGI-I (Guy 1976) */
import { num } from "../lib/format.js";
import { radioF } from "../lib/form.js";

export const PGIC_LEVELS = ["Svært mye bedre", "Mye bedre", "Litt bedre", "Ingen endring", "Litt verre", "Mye verre", "Svært mye verre"];

/* «Mye bedre» eller «svært mye bedre» regnes som klinisk viktig bedring (Farrar 2001) */
export function interpretPgic(n) {
  if (n <= 2) return { main: "Klinisk viktig bedring", important: true, tone: "ok" };
  if (n === 3) return { main: "Litt bedre, under terskel for klinisk viktig bedring", important: false, tone: "none" };
  if (n === 4) return { main: "Ingen endring", important: false, tone: "none" };
  return { main: "Forverring", important: false, tone: n === 5 ? "warn" : "crit" };
}

const THRESHOLD = "«mye bedre» eller «svært mye bedre»; kronisk smerte, Farrar 2001";
const level = s => { const n = num(s.level); return Number.isInteger(n) && n >= 1 && n <= 7 ? n : null; };

export default {
  id: "pgic", name: "PGIC", category: "Generiske", status: "aktiv",
  title: "Pasientens globale inntrykk av endring (PGIC)", meta: "7 trinn · siden behandlingen startet",
  initState: () => ({ level: "" }),
  form: () => radioF("pgic-level", "level", "«Hvordan vil du beskrive endringen i tilstanden din siden behandlingen startet?»", PGIC_LEVELS.map((t, i) => [String(i + 1), t])),
  result(s) {
    const n = level(s); if (n == null) return null;
    const I = interpretPgic(n);
    return { tone: I.tone, big: String(n), main: I.main, sub: `${PGIC_LEVELS[n - 1]} · ${n} av 7 · terskel: mye bedre (≤2)` };
  },
  toText(s) {
    const n = level(s); if (n == null) return null;
    const I = interpretPgic(n);
    const out = [`Pasientens globale inntrykk av endring (PGIC) siden behandlingen startet: ${PGIC_LEVELS[n - 1]} (${n} på skala 1–7).`];
    out.push(I.important
      ? `Tolkning: Klinisk viktig bedring (${THRESHOLD}).`
      : `Tolkning: Under terskelen for klinisk viktig bedring (${THRESHOLD}).${n >= 5 ? " Pasienten opplever forverring." : ""}`);
    return out.join("\n");
  },
  guide: `<ul>
      <li>Les spørsmålet høyt og la pasienten velge ett av de sju svarene. Pasienten vurderer selv den samlede endringen siden behandlingen startet.</li>
      <li>Koding 1–7: 1 = svært mye bedre, 4 = ingen endring, 7 = svært mye verre.</li>
      <li>«Mye bedre» eller «svært mye bedre» brukes som terskel for klinisk viktig bedring, og som anker når MCID for andre skalaer beregnes (Farrar 2001, kronisk smerte; Hurst & Bolton 2004, rygg- og nakkesmerter).</li>
      <li>PGIC måler endring i seg selv. Derfor er det ikke felt for forrige verdi, og ingen MCID.</li>
      <li>Den norske ordlyden er appens egen oversettelse. Det finnes ingen offisiell norsk versjon.</li>
      <li>Fri å bruke (public domain). Bygger på Clinical Global Impression (CGI) fra NIMH.</li></ul>
    <p class="source">Guy W. ECDEU Assessment Manual for Psychopharmacology. Rockville, MD: US Dept of Health, Education, and Welfare (NIMH); 1976. Farrar JT et al. Pain 2001;94:149–58. Hurst H, Bolton J. J Manipulative Physiol Ther 2004;27:26–35.</p>`
};
