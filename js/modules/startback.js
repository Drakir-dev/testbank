/* Keele STarT Back Screening Tool, ledd for ledd (© Keele University 2007).
   Spørsmålstekst hentes fra js/data/ledd-tekst.js når Rikard har lagt inn den norske versjonen. Skåring etter Hill 2008. */
import { num, fs } from "../lib/format.js";
import { inputF, esc } from "../lib/form.js";
import { itemRow, itemEntry } from "../lib/koos-hoos.js";
import { STARTBACK_TEXT } from "../data/ledd-tekst.js";

/* Ledd 1–8: 0 = uenig, 1 = enig. Ledd 9: svaralternativ 1–5, der 4 og 5 gir 1 poeng. Psykososial delskår = ledd 5–9. */
export function sbPoints(code, v) {
  const x = num(v);
  if (!Number.isInteger(x)) return null;
  if (code === 9) return x >= 1 && x <= 5 ? (x >= 4 ? 1 : 0) : null;
  return x === 0 || x === 1 ? x : null;
}

export function scoreStartBack(s) {
  const p = Array.from({ length: 9 }, (_, i) => sbPoints(i + 1, s["b" + (i + 1)]));
  const answered = p.filter(x => x != null).length;
  if (answered < 9) return { total: null, psych: null, answered };
  return { total: p.reduce((a, b) => a + b, 0), psych: p.slice(4).reduce((a, b) => a + b, 0), answered };
}

/* Risikogruppe (Hill 2008): lav ved total ≤3, høy ved psykososial ≥4, ellers middels */
export function sbRisk(total, psych) {
  if (total <= 3) return { risk: "lav risiko", tone: "ok" };
  if (psych >= 4) return { risk: "høy risiko", tone: "crit" };
  return { risk: "middels risiko", tone: "warn" };
}

/* SDC for totalskår 1,6 poeng (Robinson & Dagfinrud 2017) */
export const SB_SDC = 1.6;

const prevTotal = s => { const x = num(s.prev); return Number.isInteger(x) && x >= 0 && x <= 9 ? x : null; };
const cap = t => t[0].toUpperCase() + t.slice(1);
const RULE = "lav: total 0–3; middels: total ≥4 og psykososial ≤3; høy: psykososial ≥4";

function row(i) {
  const code = String(i), e = itemEntry(STARTBACK_TEXT, code);
  if (i === 9) return itemRow("startback", code, "b9", 5, e.q, ", svaralternativ 1–5", e.opts, false, 1);
  return itemRow("startback", code, "b" + i, 1, e.q, ", 0 = uenig, 1 = enig", e.opts || [[0, "Uenig"], [1, "Enig"]]);
}

export default {
  id: "startback", name: "STarT Back", category: "PROM rygg/nakke", status: "aktiv",
  title: "Keele STarT Back Screening Tool", meta: "9 ledd · lav, middels eller høy risiko",
  initState: () => { const s = { prev: "" }; for (let i = 1; i <= 9; i++) s["b" + i] = ""; return s; },
  form: () => `
    <span class="hint">Tast inn svarene fra pasientens skjema. Ledd 1–8: enig eller uenig. Ledd 9: svaralternativet som er krysset, der 1 er det første (minst plagsomt) og 5 det siste.</span>
    <div class="kitems">${Array.from({ length: 9 }, (_, i) => row(i + 1)).join("")}</div>
    <div class="grid">${inputF("startback-prev", "prev", "Forrige totalskår (valgfritt)", "/9", { int: true, ph: "0–9" })}</div>`,
  result(s) {
    const P = scoreStartBack(s); if (!P.answered) return null;
    if (P.total == null) return { tone: "none", big: "…", main: `${P.answered} av 9 ledd besvart`, sub: "Alle 9 ledd må være besvart" };
    const R = sbRisk(P.total, P.psych);
    return { tone: R.tone, big: String(P.total), main: cap(R.risk), sub: `Totalskår ${P.total} av 9 · psykososial ${P.psych} av 5 · ${RULE}` };
  },
  toText(s) {
    const P = scoreStartBack(s); if (P.total == null) return null;
    const out = [
      `STarT Back: totalskår ${P.total} av 9, psykososial delskår ${P.psych} av 5.`,
      `Tolkning: ${cap(sbRisk(P.total, P.psych).risk)} for langvarige plager (${RULE}; Hill 2008).`
    ];
    const pv = prevTotal(s);
    if (pv != null) {
      const diff = P.total - pv;
      out.push(`Endring fra forrige: totalskår ${pv} → ${P.total} (${fs(diff, 0)} poeng; ${Math.abs(diff) >= SB_SDC ? "over" : "under"} SDC). Ingen etablert MCID. SDC 1,6 poeng (korsryggsmerte i fysioterapi, norsk versjon, Robinson & Dagfinrud 2017).`);
    }
    return out.join("\n");
  },
  guide: `<ul>
      <li>For pasienter med korsryggsmerter, til å velge behandlingsnivå. Pasienten fyller ut skjemaet selv.</li>
      <li>Skåring (Hill 2008): ledd 1–8 gir 1 poeng ved enig og 0 ved uenig. Ledd 9 gir 1 poeng for de to siste svaralternativene og 0 for de tre første. Totalskår 0–9, og psykososial delskår (ledd 5–9) 0–5. Alle 9 ledd må være besvart.</li>
      <li>Risikogrupper (Hill 2008): lav risiko ved totalskår 0–3. Middels risiko ved totalskår 4 eller mer og psykososial delskår 3 eller lavere. Høy risiko ved psykososial delskår 4–5.</li>
      <li>Skjemaet er et screeningverktøy og har ingen etablert MCID. Minste påviselige endring (SDC) er 1,6 poeng for totalskåren og 1,35 for den psykososiale delskåren, i den norske versjonen hos pasienter med korsryggsmerte i fysioterapi (Robinson & Dagfinrud 2017).</li>
      <li>STarT Back © Keele University 2007. Ingen lisens trengs for ikke-kommersiell bruk. Keele anbefaler ikke endrede versjoner, eller bruk ved andre tilstander enn korsryggsmerte. Spørsmålsteksten vises når Rikard har lagt inn Keeles norske versjon i js/data/ledd-tekst.js.</li></ul>
    <p class="source">Hill JC, Dunn KM, Lewis M et al. Arthritis Rheum 2008;59:632–41. Robinson HS, Dagfinrud H. BMC Musculoskelet Disord 2017;18:232. Keele University: STarT Back Implementation Manual.</p>`
};
