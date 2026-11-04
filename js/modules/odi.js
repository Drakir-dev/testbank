/* Oswestry Disability Index (© Jeremy Fairbank, lisens via Mapi), poeng per seksjon uten spørsmålstekst.
   Skåring og grader etter Fairbank & Pynsent 2000. Rene funksjoner, ingen DOM. */
import { fs } from "../lib/format.js";
import { inputF } from "../lib/form.js";
import { itemRow } from "../lib/koos-hoos.js";
import { SECTIONS, sectionScore, sectionValues, prevPct } from "../lib/seksjoner.js";

/* Høyst én seksjon kan mangle (Fairbank & Pynsent 2000) */
export const scoreOdi = s => sectionScore(sectionValues(s, "d"), 1);

/* Grader etter Fairbank & Pynsent 2000 */
export function odiGrade(p) {
  if (p <= 20) return { grade: "minimal funksjonsnedsettelse", tone: "ok" };
  if (p <= 40) return { grade: "moderat funksjonsnedsettelse", tone: "warn" };
  if (p <= 60) return { grade: "alvorlig funksjonsnedsettelse", tone: "crit" };
  if (p <= 80) return { grade: "svært alvorlig funksjonsnedsettelse", tone: "crit" };
  return { grade: "sengeliggende eller overrapportering av symptomer", tone: "crit" };
}

/* MCID: 10 poeng eller 30 % (Ostelo 2008). pct er null når forrige er 0. Lavere = bedre. */
export function odiChange(cur, prev) {
  const diff = cur - prev;
  const pct = prev > 0 ? Math.round(diff / prev * 100) : null;
  const over = Math.abs(diff) >= 10 || (pct != null && Math.abs(pct) >= 30);
  return { diff, pct, dir: diff === 0 ? "uendret" : diff < 0 ? "bedring" : "forverring", over };
}

const BANDS = "0–20 minimal, 21–40 moderat, 41–60 alvorlig, 61–80 svært alvorlig, 81–100 sengeliggende eller overrapportering";

export default {
  id: "odi", name: "ODI", category: "PROM rygg/nakke", status: "aktiv",
  title: "Oswestry Disability Index (ODI)", meta: "10 seksjoner · 0–100 % · høyere = mer funksjonsnedsettelse",
  initState: () => { const s = { prev: "" }; for (let i = 1; i <= SECTIONS; i++) s["d" + i] = ""; return s; },
  form: () => `
    <span class="hint">Tast inn poeng per seksjon fra pasientens lisensierte skjema: 0 = første utsagn (minst plager), 5 = siste utsagn. Har pasienten krysset to utsagn, velg det høyeste.</span>
    <div class="kitems">${Array.from({ length: SECTIONS }, (_, i) => itemRow("odi", String(i + 1), "d" + (i + 1), 5, "", ", poeng 0–5")).join("")}</div>
    <div class="grid">${inputF("odi-prev", "prev", "Forrige ODI (valgfritt)", "%", { int: true, ph: "0–100" })}</div>`,
  result(s) {
    const P = scoreOdi(s); if (!P.answered) return null;
    if (P.pct == null) return { tone: "none", big: "…", main: `${P.answered} av 10 seksjoner besvart`, sub: "Høyst én seksjon kan mangle" };
    const G = odiGrade(P.pct);
    let sub = `${P.answered} av 10 seksjoner · ${BANDS}`;
    const pv = prevPct(s.prev);
    if (pv != null) { const c = odiChange(P.pct, pv); sub += ` · endring ${fs(c.diff, 0)} (${c.over ? "over" : "under"} MCID)`; }
    return { tone: G.tone, big: String(P.pct), main: `ODI ${P.pct} %: ${G.grade}`, sub };
  },
  toText(s) {
    const P = scoreOdi(s); if (P.pct == null) return null;
    const out = [
      `Oswestry Disability Index: ${P.pct} % (${P.answered} av 10 seksjoner; 0 = ingen, 100 = størst mulig funksjonsnedsettelse).`,
      `Tolkning: ${odiGrade(P.pct).grade[0].toUpperCase() + odiGrade(P.pct).grade.slice(1)} (${BANDS}; Fairbank & Pynsent 2000).`
    ];
    const pv = prevPct(s.prev);
    if (pv != null) {
      const c = odiChange(P.pct, pv);
      const pct = c.pct != null ? `, ${fs(c.pct, 0)} %` : "";
      out.push(`Endring fra forrige: ${pv} → ${P.pct} % (${fs(c.diff, 0)} poeng${pct}, ${c.dir}; ${c.over ? "over" : "under"} MCID). MCID: 10 poeng eller 30 % (korsryggsmerte, Ostelo 2008). Repeterbarhet 11 poeng (korsryggsmerte, norsk versjon, Grotle 2003).`);
    }
    return out.join("\n");
  },
  guide: `<ul>
      <li>Pasienten fyller ut det lisensierte ODI-skjemaet (10 seksjoner). Tast inn poeng per seksjon: første utsagn = 0, siste = 5. Har pasienten krysset flere utsagn, velg det høyeste.</li>
      <li>Skår = sum ÷ (5 × besvarte seksjoner) × 100, avrundet til hele prosent. Mangler én seksjon (eller den ikke er relevant), regnes skåren av de ni andre. Mangler flere, regnes ingen skår (Fairbank & Pynsent 2000).</li>
      <li>Grader: 0–20 % minimal, 21–40 % moderat, 41–60 % alvorlig, 61–80 % svært alvorlig funksjonsnedsettelse, 81–100 % sengeliggende eller overrapportering av symptomer (Fairbank & Pynsent 2000).</li>
      <li>MCID: 10 poeng eller 30 % bedring, internasjonal konsensus for korsryggsmerte (Ostelo 2008). Appen regner endringen som over MCID når én av grensene er nådd.</li>
      <li>Repeterbarhet (minste endring som skiller seg fra målefeil) 11 poeng for den norske versjonen (Grotle 2003).</li>
      <li>ODI © Jeremy Fairbank 1980, distribueres av Mapi Research Trust (ePROVIDE). Gratis for klinisk praksis, men helseforetak og elektroniske versjoner krever lisensavtale. Appen viser derfor ikke spørsmålene, bare poengene.</li></ul>
    <p class="source">Fairbank JCT, Pynsent PB. Spine 2000;25:2940–52. Ostelo RWJG et al. Spine 2008;33:90–4. Grotle M, Brox JI, Vøllestad NK. J Rehabil Med 2003;35:241–7.</p>`
};
