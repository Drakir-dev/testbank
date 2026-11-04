/* Oxford Shoulder Score (© Oxford University Innovation), poeng per ledd uten spørsmålstekst.
   Skåring 0–48 (Dawson 2009), høyere = bedre. Rene funksjoner, ingen DOM. */
import { num, fs } from "../lib/format.js";
import { inputF } from "../lib/form.js";
import { itemRow, itemVal } from "../lib/koos-hoos.js";

export const OSS_N = 12;
export const OSS_MCID = 6;

/* Sum 0–48. Alle 12 ledd må være besvart: appen fyller ikke inn manglende ledd. */
export function scoreOss(s) {
  const v = Array.from({ length: OSS_N }, (_, i) => itemVal(s["o" + (i + 1)])).filter(x => x != null);
  return { score: v.length === OSS_N ? v.reduce((a, b) => a + b, 0) : null, answered: v.length };
}

/* Endring mot MCID 6 poeng (Christiansen 2015). Høyere skår = bedre. */
export function ossChange(cur, prev) {
  const diff = cur - prev;
  return { diff, dir: diff === 0 ? "uendret" : diff > 0 ? "bedring" : "forverring", over: Math.abs(diff) >= OSS_MCID };
}

const prevScore = s => { const x = num(s.prev); return Number.isInteger(x) && x >= 0 && x <= 48 ? x : null; };

export default {
  id: "oss", name: "Oxford Shoulder Score", category: "PROM skulder/arm", status: "aktiv",
  title: "Oxford Shoulder Score (OSS)", meta: "12 ledd · 0–48 · høyere = bedre",
  initState: () => { const s = { prev: "" }; for (let i = 1; i <= OSS_N; i++) s["o" + i] = ""; return s; },
  form: () => `
    <span class="hint">Tast inn poengene per ledd etter OUIs skåringsnøkkel: 4 = best (ingen plager), 0 = verst.</span>
    <div class="kitems">${Array.from({ length: OSS_N }, (_, i) => itemRow("oss", String(i + 1), "o" + (i + 1), 4, "", ", poeng 0–4")).join("")}</div>
    <div class="grid">${inputF("oss-prev", "prev", "Forrige OSS (valgfritt)", "/48", { int: true, ph: "0–48" })}</div>`,
  result(s) {
    const P = scoreOss(s); if (!P.answered) return null;
    if (P.score == null) return { tone: "none", big: "…", main: `${P.answered} av 12 ledd besvart`, sub: "Alle 12 ledd må være besvart" };
    let sub = "0 = verst, 48 = best";
    const pv = prevScore(s);
    if (pv != null) { const c = ossChange(P.score, pv); sub += ` · endring ${fs(c.diff, 0)} (${c.over ? "over" : "under"} MCID 6)`; }
    return { tone: "none", big: String(P.score), main: `OSS ${P.score} av 48`, sub };
  },
  toText(s) {
    const P = scoreOss(s); if (P.score == null) return null;
    const out = [`Oxford Shoulder Score: ${P.score} av 48 (0 = verst, 48 = best).`, "Tolkning: Ingen etablert grenseverdi."];
    const pv = prevScore(s);
    if (pv != null) {
      const c = ossChange(P.score, pv);
      out.push(`Endring fra forrige: ${pv} → ${P.score} (${fs(c.diff, 0)} poeng, ${c.dir}; ${c.over ? "over" : "under"} MCID). MCID: 6 poeng (etter artroskopisk subakromial dekompresjon, Christiansen 2015).`);
    }
    return out.join("\n");
  },
  guide: `<ul>
      <li>Pasienten fyller ut det lisensierte OSS-skjemaet (12 ledd om smerte og funksjon de siste 4 ukene). Tast inn poeng per ledd etter OUIs skåringsnøkkel: 0–4, der 4 er best.</li>
      <li>Skår = sum av de 12 leddene, fra 0 (verst) til 48 (best) (Dawson 2009). Appen regner bare ut skåren når alle 12 ledd er besvart, og fyller ikke inn ledd som mangler.</li>
      <li>Eldre artikler bruker skåringen 1–5 per ledd (12–60, der 12 er best). Sjekk hvilken skåring en tidligere verdi er oppgitt i før du sammenligner.</li>
      <li>Det finnes ingen etablert grenseverdi for alvorlighetsgrad. OSS passer ikke ved skulderinstabilitet, bruk WOSI.</li>
      <li>MCID: 6 poeng (ROC med PGIC som anker, øvre 95 %-grense 12), hos pasienter som 8–12 uker etter artroskopisk subakromial dekompresjon hadde vansker med å komme tilbake til vanlige aktiviteter (Christiansen 2015).</li>
      <li>Norsk versjon: Ekeberg 2008, rotatormansjettlidelse.</li>
      <li>OSS © Oxford University Innovation (OUI). All bruk krever lisens fra OUI. Appen viser derfor ikke spørsmålene, bare poengene som tastes inn fra papirskjemaet.</li></ul>
    <p class="source">Dawson J, Fitzpatrick R, Carr A. J Bone Joint Surg Br 1996;78:593–600. Dawson J, Rogers K, Fitzpatrick R, Carr A. Arch Orthop Trauma Surg 2009;129:119–23. Christiansen DH et al. J Orthop Sports Phys Ther 2015;45:620–5. Ekeberg OM et al. BMC Musculoskelet Disord 2008;9:68.</p>`
};
