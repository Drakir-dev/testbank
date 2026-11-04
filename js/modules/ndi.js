/* Neck Disability Index (© Howard Vernon, lisens via Mapi), poeng per seksjon uten spørsmålstekst.
   Skåring og grader etter Vernon & Mior 1991 og Vernon 2008. Rene funksjoner, ingen DOM. */
import { f, fs } from "../lib/format.js";
import { inputF } from "../lib/form.js";
import { itemRow } from "../lib/koos-hoos.js";
import { SECTIONS, sectionScore, sectionValues, prevPct } from "../lib/seksjoner.js";

/* Ved 3 eller flere manglende seksjoner regnes ingen skår (Vernon 2008) */
export const scoreNdi = s => sectionScore(sectionValues(s, "n"), 2);

/* Grader for råskår 0–50 (Vernon 2008). Med manglende seksjoner brukes omregnet råskår = prosent ÷ 2. */
export function ndiGrade(raw) {
  if (raw < 5) return { grade: "ingen funksjonsnedsettelse", tone: "ok" };
  if (raw < 15) return { grade: "lett funksjonsnedsettelse", tone: "ok" };
  if (raw < 25) return { grade: "moderat funksjonsnedsettelse", tone: "warn" };
  if (raw < 35) return { grade: "alvorlig funksjonsnedsettelse", tone: "crit" };
  return { grade: "komplett funksjonsnedsettelse", tone: "crit" };
}

/* Endring i prosentpoeng mot MCID 16,6 % (Johansen 2014). Lavere = bedre. */
export const NDI_MCID = 16.6;
export function ndiChange(cur, prev) {
  const diff = cur - prev;
  return { diff, dir: diff === 0 ? "uendret" : diff < 0 ? "bedring" : "forverring", over: Math.abs(diff) >= NDI_MCID };
}

const BANDS = "råskår 0–4 ingen, 5–14 lett, 15–24 moderat, 25–34 alvorlig, ≥35 komplett";
const cap = t => t[0].toUpperCase() + t.slice(1);
/* Råskår 0–50: summen når alle er besvart, ellers omregnet fra prosent */
const rawOf = P => P.answered === SECTIONS ? P.sum : P.pct / 2;

export default {
  id: "ndi", name: "NDI", category: "PROM rygg/nakke", status: "aktiv",
  title: "Neck Disability Index (NDI)", meta: "10 seksjoner · 0–50 (0–100 %) · høyere = mer funksjonsnedsettelse",
  initState: () => { const s = { prev: "" }; for (let i = 1; i <= SECTIONS; i++) s["n" + i] = ""; return s; },
  form: () => `
    <span class="hint">Tast inn poeng per seksjon fra pasientens lisensierte skjema: 0 = første utsagn (ingen plager), 5 = siste utsagn.</span>
    <div class="kitems">${Array.from({ length: SECTIONS }, (_, i) => itemRow("ndi", String(i + 1), "n" + (i + 1), 5, "", ", poeng 0–5")).join("")}</div>
    <div class="grid">${inputF("ndi-prev", "prev", "Forrige NDI (valgfritt)", "%", { int: true, ph: "0–100" })}</div>`,
  result(s) {
    const P = scoreNdi(s); if (!P.answered) return null;
    if (P.pct == null) return { tone: "none", big: "…", main: `${P.answered} av 10 seksjoner besvart`, sub: "Høyst to seksjoner kan mangle" };
    const raw = rawOf(P), G = ndiGrade(raw);
    let sub = `${P.answered} av 10 seksjoner · ${BANDS}`;
    const pv = prevPct(s.prev);
    if (pv != null) { const c = ndiChange(P.pct, pv); sub += ` · endring ${fs(c.diff, 0)} % (${c.over ? "over" : "under"} MCID 16,6)`; }
    return { tone: G.tone, big: String(P.pct), main: `NDI ${P.pct} %: ${G.grade}`, sub };
  },
  toText(s) {
    const P = scoreNdi(s); if (P.pct == null) return null;
    const raw = rawOf(P);
    const head = P.answered === SECTIONS
      ? `Neck Disability Index: ${P.sum} av 50 (${P.pct} %; høyere = mer funksjonsnedsettelse).`
      : `Neck Disability Index: ${P.pct} % (${P.answered} av 10 seksjoner, omregnet råskår ${f(raw)} av 50; høyere = mer funksjonsnedsettelse).`;
    const out = [head, `Tolkning: ${cap(ndiGrade(raw).grade)} (${BANDS}; Vernon 2008).`];
    const pv = prevPct(s.prev);
    if (pv != null) {
      const c = ndiChange(P.pct, pv);
      out.push(`Endring fra forrige: ${pv} → ${P.pct} % (${fs(c.diff, 0)} prosentpoeng, ${c.dir}; ${c.over ? "over" : "under"} MCID). MCID: 16,6 %, MDC 12,3 % (nakkesmerte, spesialisert poliklinikk, norsk versjon, Johansen 2014).`);
    }
    return out.join("\n");
  },
  guide: `<ul>
      <li>Pasienten fyller ut det lisensierte NDI-skjemaet (10 seksjoner). Tast inn poeng per seksjon: første utsagn = 0, siste = 5.</li>
      <li>Råskår = sum 0–50, og prosent = råskår × 2. Mangler én eller to seksjoner, regnes prosent av besvarte seksjoner: sum ÷ (5 × besvarte) × 100. Ved tre eller flere manglende seksjoner er skåren usikker, og appen regner ingen skår (Vernon 2008).</li>
      <li>Grader for råskår: 0–4 ingen, 5–14 lett, 15–24 moderat, 25–34 alvorlig, over 34 komplett funksjonsnedsettelse (Vernon 2008). Med manglende seksjoner brukes prosent ÷ 2.</li>
      <li>MCID 16,6 % og MDC 12,3 % for den norske versjonen, hos pasienter med nakkesmerte ved spesialisert poliklinikk (Johansen 2014). Oppgi forrige skår i prosent.</li>
      <li>NDI © Howard Vernon 1991, distribueres av Mapi Research Trust (ePROVIDE). Gratis for klinisk praksis, men helseforetak og elektroniske versjoner krever lisensavtale. Appen viser derfor ikke spørsmålene, bare poengene.</li></ul>
    <p class="source">Vernon H, Mior S. J Manipulative Physiol Ther 1991;14:409–15. Vernon H. J Manipulative Physiol Ther 2008;31:491–502. Johansen JB, Roe C, Bakke E, Mengshoel AM, Andelic N. Scand J Pain 2014;5:28–33.</p>`
};
