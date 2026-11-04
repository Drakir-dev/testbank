/* QuickDASH (© Institute for Work & Health), poeng per ledd uten spørsmålstekst.
   Skåring etter Beaton 2005 og IWHs skåringsinstruksjon. Rene funksjoner, ingen DOM. */
import { num, f, fs } from "../lib/format.js";
import { inputF } from "../lib/form.js";
import { itemRow } from "../lib/koos-hoos.js";

export const QDASH_N = 11;
/* Valgfrie moduler: fire ledd hver */
export const QDASH_MODULES = [
  { key: "A", label: "arbeidsmodul", head: "Arbeid (valgfri modul)" },
  { key: "S", label: "sport/musikk-modul", head: "Sport/musikk (valgfri modul)" }
];
export const QDASH_MCID = 15.9;

const r1 = x => Math.round(x * 10) / 10;

/* Ledd 1–5 som heltall, ellers null */
export const qdashVal = v => { const x = num(v); return Number.isInteger(x) && x >= 1 && x <= 5 ? x : null; };

/* (gjennomsnitt − 1) × 25, med én desimal */
const toScore = v => r1((v.reduce((a, b) => a + b, 0) / v.length - 1) * 25);

/* QuickDASH-skår 0–100. Minst 10 av 11 ledd må være besvart (Beaton 2005). */
export function scoreQdash(s) {
  const v = Array.from({ length: QDASH_N }, (_, i) => qdashVal(s["q" + (i + 1)])).filter(x => x != null);
  return { score: v.length >= QDASH_N - 1 ? toScore(v) : null, answered: v.length };
}

/* Modulskår 0–100. Alle fire ledd må være besvart. */
export function scoreQdashModule(s, key) {
  const v = [1, 2, 3, 4].map(i => qdashVal(s[key + i])).filter(x => x != null);
  return { score: v.length === 4 ? toScore(v) : null, answered: v.length };
}

/* Endring mot MCID 15,9 (Franchignoni 2014). Lavere skår = bedre. */
export function qdashChange(cur, prev) {
  const diff = r1(cur - prev);
  return { diff, dir: diff === 0 ? "uendret" : diff < 0 ? "bedring" : "forverring", over: Math.abs(diff) >= QDASH_MCID };
}

const prevScore = s => { const x = num(s.prev); return x != null && x >= 0 && x <= 100 ? r1(x) : null; };
const row = (code, k) => itemRow("qdash", code, k, 5, "", ", 1–5", null, false, 1);

export default {
  id: "qdash", name: "QuickDASH", category: "PROM skulder/arm", status: "aktiv",
  title: "QuickDASH", meta: "11 ledd · 0–100 · høyere = mer funksjonsnedsettelse",
  initState: () => {
    const s = { prev: "" };
    for (let i = 1; i <= QDASH_N; i++) s["q" + i] = "";
    QDASH_MODULES.forEach(m => [1, 2, 3, 4].forEach(i => s[m.key + i] = ""));
    return s;
  },
  form: () => `
    <span class="hint">Tast inn svaret fra pasientens lisensierte skjema: 1 = ingen vansker eller plager, 5 = kan ikke eller ekstreme plager.</span>
    <div class="kitems">${Array.from({ length: QDASH_N }, (_, i) => row(String(i + 1), "q" + (i + 1))).join("")}</div>
    ${QDASH_MODULES.map(m => `
    <div class="sub-h">${m.head} (${m.key}1–${m.key}4)</div>
    <div class="kitems">${[1, 2, 3, 4].map(i => row(m.key + i, m.key + i)).join("")}</div>`).join("")}
    <div class="grid">${inputF("qdash-prev", "prev", "Forrige QuickDASH (valgfritt)", "/100", { ph: "f.eks. 40,9" })}</div>`,
  result(s) {
    const P = scoreQdash(s); if (!P.answered) return null;
    if (P.score == null) return { tone: "none", big: "…", main: `${P.answered} av 11 ledd besvart`, sub: "Minst 10 av 11 ledd må være besvart" };
    let sub = `${P.answered} av 11 ledd · 0 = ingen funksjonsnedsettelse`;
    const pv = prevScore(s);
    if (pv != null) { const c = qdashChange(P.score, pv); sub += ` · endring ${fs(c.diff)} (${c.over ? "over" : "under"} MCID 15,9)`; }
    return { tone: "none", big: f(P.score), main: `QuickDASH ${f(P.score)} av 100`, sub };
  },
  toText(s) {
    const P = scoreQdash(s); if (P.score == null) return null;
    const out = [`QuickDASH: ${f(P.score)} av 100 (${P.answered} av 11 ledd; 0 = ingen funksjonsnedsettelse, 100 = størst mulig funksjonsnedsettelse).`];
    const mods = QDASH_MODULES.map(m => ({ m, M: scoreQdashModule(s, m.key) })).filter(x => x.M.score != null);
    if (mods.length) out.push(mods.map(x => `${x.m.label[0].toUpperCase() + x.m.label.slice(1)}: ${f(x.M.score)} av 100.`).join(" "));
    out.push("Tolkning: Ingen etablert grenseverdi.");
    const pv = prevScore(s);
    if (pv != null) {
      const c = qdashChange(P.score, pv);
      out.push(`Endring fra forrige: ${f(pv)} → ${f(P.score)} (${fs(c.diff)} poeng, ${c.dir}; ${c.over ? "over" : "under"} MCID). MCID: 15,9 poeng (muskel-skjelettplager i overekstremiteten, fysioterapi, Franchignoni 2014).`);
    }
    return out.join("\n");
  },
  guide: `<ul>
      <li>Pasienten fyller ut det lisensierte QuickDASH-skjemaet (11 ledd, valgfrie moduler for arbeid og sport/musikk). Tast inn svaret per ledd: 1 = ingen vansker, 5 = kan ikke eller ekstreme plager.</li>
      <li>Skår = (gjennomsnitt av besvarte ledd − 1) × 25, fra 0 (ingen funksjonsnedsettelse) til 100. Skåren regnes ut når minst 10 av 11 ledd er besvart (Beaton 2005).</li>
      <li>Modulene skåres hver for seg på samme måte, og alle fire ledd må være besvart.</li>
      <li>Det finnes ingen etablert grenseverdi for alvorlighetsgrad.</li>
      <li>MCID: 15,9 poeng hos 255 pasienter med muskel-skjelettplager i overekstremiteten før og etter fysioterapi (Franchignoni 2014). Forfatterne regner dette som nedre grense og nevner 20 poeng som øvre. Andre populasjoner har gitt andre verdier, f.eks. 8,0 ved skuldersmerte (Mintken 2009).</li>
      <li>QuickDASH © Institute for Work & Health (IWH), Toronto. Gratis for klinikere til behandling og vurdering, men skjemaet kan ikke endres, og elektronisk bruk krever skriftlig tillatelse fra IWH. Appen viser derfor ikke spørsmålene, bare svarene som tastes inn fra papirskjemaet.</li></ul>
    <p class="source">Beaton DE, Wright JG, Katz JN, Upper Extremity Collaborative Group. J Bone Joint Surg Am 2005;87:1038–46. Franchignoni F et al. J Orthop Sports Phys Ther 2014;44:30–9. Mintken PE, Glynn P, Cleland JA. J Shoulder Elbow Surg 2009;18:920–6. IWH: The QuickDASH Outcome Measure, skåringsinstruksjon.</p>`
};
