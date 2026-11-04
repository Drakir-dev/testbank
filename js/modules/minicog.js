/* Mini-Cog© (Soo Borson): ordgjenkalling og klokketest. Bare poeng tastes inn; ordlister og instruksjon
   står på det standardiserte skjemaet (mini-cog.com), som ikke skal endres. Rene funksjoner, ingen DOM. */
import { num, fs } from "../lib/format.js";
import { inputF } from "../lib/form.js";
import { itemRow } from "../lib/koos-hoos.js";

/* Ord 0–3 og klokke 0 eller 2. Totalskår 0–5, null til begge er fylt ut. */
export function scoreMiniCog(s) {
  const w = num(s.words), c = num(s.clock);
  const words = Number.isInteger(w) && w >= 0 && w <= 3 ? w : null;
  const clock = c === 0 || c === 2 ? c : null;
  return { words, clock, total: words != null && clock != null ? words + clock : null };
}

/* 0–2 positiv screening (Borson 2003, mini-cog.com). <4 gir høyere sensitivitet (mini-cog.com). */
export function interpretMiniCog(total) {
  if (total <= 2) return { main: "Positiv screening", desc: "økt sannsynlighet for klinisk betydningsfull kognitiv svikt", range: "0–2", tone: "warn" };
  return { main: "Negativ screening", desc: "lavere sannsynlighet for demens, men utelukker ikke kognitiv svikt", range: "3–5", tone: "ok" };
}

const prevTotal = s => { const x = num(s.prev); return Number.isInteger(x) && x >= 0 && x <= 5 ? x : null; };

export default {
  id: "minicog", name: "Mini-Cog", category: "Kognisjon", status: "aktiv",
  title: "Mini-Cog©", meta: "Tre ord + klokketest · 0–5",
  initState: () => ({ words: "", clock: "", prev: "" }),
  form: () => `
    <span class="hint">Gjennomfør testen med det standardiserte norske skjemaet fra mini-cog.com, og tast inn poengene her.</span>
    <div class="kitems">
      ${itemRow("minicog", "1", "words", 3, "Ordgjenkalling: antall ord husket uten hint (1 poeng per ord)", "", [[0, "Ingen ord"], [1, "1 ord"], [2, "2 ord"], [3, "3 ord"]])}
      ${itemRow("minicog", "2", "clock", 2, "Klokketest", "", [[2, "Normal klokke"], [0, "Unormal klokke eller ikke gjennomført"]])}
    </div>
    <div class="grid">${inputF("minicog-prev", "prev", "Forrige Mini-Cog (valgfritt)", "/5", { int: true, ph: "0–5" })}</div>`,
  result(s) {
    const P = scoreMiniCog(s);
    if (P.words == null && P.clock == null) return null;
    if (P.total == null) return { tone: "none", big: "…", main: "Fyll inn både ord og klokke", sub: "" };
    const I = interpretMiniCog(P.total);
    let sub = `Ord ${P.words} av 3 · klokke ${P.clock} av 2 · 0–2 positiv`;
    if (P.total === 3) sub += " · 3 er positiv ved den mer sensitive grensen <4";
    const pv = prevTotal(s); if (pv != null) sub += ` · endring ${pv} → ${P.total} (${fs(P.total - pv, 0)})`;
    return { tone: I.tone, big: String(P.total), main: I.main, sub };
  },
  toText(s) {
    const P = scoreMiniCog(s); if (P.total == null) return null;
    const I = interpretMiniCog(P.total);
    const out = [
      `Mini-Cog: ${P.total} av 5 (ordgjenkalling ${P.words} av 3, klokketest ${P.clock === 2 ? "normal" : "unormal"} ${P.clock} av 2).`,
      `Tolkning: ${I.main}, ${I.desc} (${I.range}; Borson 2003).${P.total === 3 ? " Ved grensen <4, som gir høyere sensitivitet, er skåren positiv." : ""} Ikke diagnostisk.`
    ];
    const pv = prevTotal(s);
    if (pv != null) {
      const d = P.total - pv;
      out.push(`Endring fra forrige: Mini-Cog ${pv} → ${P.total} (${fs(d, 0)} poeng, ${d > 0 ? "bedring" : d < 0 ? "forverring" : "uendret"}). Ingen etablert MCID for Mini-Cog.`);
    }
    return out.join("\n");
  },
  guide: `<ul>
      <li>Kort screening for kognitiv svikt, ca. 3 minutter: pasienten gjentar tre ord, tegner en klokke og gjenkaller ordene. Bruk det standardiserte skjemaet med ordlister og instruksjon (norsk versjon på mini-cog.com).</li>
      <li>Ordgjenkalling: 1 poeng per ord som huskes uten hint (0–3).</li>
      <li>Klokketest: 2 poeng for normal klokke, ellers 0. Normal klokke har alle tallene 1–12, hvert én gang, i riktig rekkefølge og retning, og to visere som peker på 11 og 2. Viserlengden skåres ikke. Nekter eller klarer ikke pasienten å tegne, gir det 0.</li>
      <li>Totalskår 0–5. 0–2 gir positiv screening (økt sannsynlighet for klinisk betydningsfull kognitiv svikt). Det tilsvarer algoritmen i Borson 2003, med sensitivitet 76 % og spesifisitet 89 % for demens. Grensen <4 gir høyere sensitivitet (mini-cog.com).</li>
      <li>3–5 gjør demens mindre sannsynlig, men utelukker ikke kognitiv svikt. Ta bekymring fra pasient eller pårørende på alvor selv med normal skår.</li>
      <li>Mini-Cog er ikke et diagnostisk verktøy. Ingen etablert MCID.</li></ul>
    <p class="source">Mini-Cog© Soo Borson. Gratis til klinisk bruk og undervisning, og skal brukes etter instruksjonene uten endringer (mini-cog.com). Borson S, Scanlan J, Brush M et al. Int J Geriatr Psychiatry 2000;15:1021–7. Borson S, Scanlan JM, Chen P, Ganguli M. J Am Geriatr Soc 2003;51:1451–4.</p>`
};
