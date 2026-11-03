/* ACL Return to Sport after Injury (ACL-RSI), 12 ledd uten spørsmålstekst.
   Rettighetene er uavklart (Webster, Feller & Lambros), så spørsmålene gjengis ikke. */
import { num, f, fs } from "../lib/format.js";
import { inputF } from "../lib/form.js";

export const ACLRSI_N = 12;
const r1 = x => Math.round(x * 10) / 10;

/* Ledd 0–100 i trinn på 10, ellers null */
export const aclrsiVal = v => { const x = num(v); return Number.isInteger(x) && x >= 0 && x <= 100 && x % 10 === 0 ? x : null; };

/* Skår = gjennomsnittet av de 12 leddene (Webster 2008). null til alle er besvart. */
export function scoreAclrsi(s) {
  const v = Array.from({ length: ACLRSI_N }, (_, i) => aclrsiVal(s["r" + (i + 1)])).filter(x => x != null);
  return { score: v.length === ACLRSI_N ? r1(v.reduce((a, b) => a + b, 0) / ACLRSI_N) : null, answered: v.length };
}

/* Endring mot MIC 13,4 (Webster & Feller 2021). Differansen rundes til én desimal før sammenligning. */
export function aclrsiChange(cur, prev) {
  const diff = r1(cur - prev);
  return { diff, dir: diff === 0 ? "uendret" : diff > 0 ? "bedring" : "forverring", over: Math.abs(diff) >= 13.4 };
}

const prevScore = s => { const x = num(s.prev); return x != null && x >= 0 && x <= 100 ? r1(x) : null; };

export default {
  id: "aclrsi", name: "ACL-RSI", category: "PROM kne/hofte", status: "aktiv",
  title: "ACL Return to Sport after Injury (ACL-RSI)", meta: "12 ledd · 0–100",
  initState: () => { const s = { prev: "" }; for (let i = 1; i <= ACLRSI_N; i++) s["r" + i] = ""; return s; },
  form: () => `
    <span class="hint">Tast inn svaret for hvert ledd fra pasientens skjema: 0–100 i trinn på 10, der høyere er mer positivt.</span>
    <div class="grid">${Array.from({ length: ACLRSI_N }, (_, i) => inputF(`aclrsi-r${i + 1}`, `r${i + 1}`, `Ledd ${i + 1}`, "", { int: true, ph: "0–100" })).join("")}</div>
    <div class="grid">${inputF("aclrsi-prev", "prev", "Forrige ACL-RSI (valgfritt)", "/100", { ph: "f.eks. 45,8" })}</div>`,
  result(s) {
    const P = scoreAclrsi(s); if (!P.answered) return null;
    if (P.score == null) return { tone: "none", big: "…", main: `${P.answered} av 12 ledd besvart`, sub: "Alle 12 ledd må besvares (0–100 i trinn på 10)" };
    let sub = "Høyere = mer psykologisk klar for retur til idrett";
    const pv = prevScore(s);
    if (pv != null) { const c = aclrsiChange(P.score, pv); sub += ` · endring ${fs(c.diff)} (${c.over ? "over" : "under"} MIC 13,4)`; }
    return { tone: "none", big: f(P.score), main: `ACL-RSI ${f(P.score)} av 100`, sub };
  },
  toText(s) {
    const P = scoreAclrsi(s); if (P.score == null) return null;
    const out = [`ACL-RSI: ${f(P.score)} av 100 (høyere = mer psykologisk klar for retur til idrett).`, "Tolkning: Ingen etablert grenseverdi."];
    const pv = prevScore(s);
    if (pv != null) {
      const c = aclrsiChange(P.score, pv);
      out.push(`Endring fra forrige: ${f(pv)} → ${f(P.score)} (${fs(c.diff)} poeng, ${c.dir}; ${c.over ? "over" : "under"} MIC). MIC: 13,4 poeng (6–12 mnd etter ACL-rekonstruksjon, Webster & Feller 2021).`);
    }
    return out.join("\n");
  },
  guide: `<ul>
      <li>Pasienten fyller ut ACL-RSI-skjemaet. Hvert av de 12 leddene besvares 0–100 i trinn på 10, der høyere er mer positivt.</li>
      <li>Skår = gjennomsnittet av de 12 leddene (0–100). Kilden beskriver ikke regler for ubesvarte ledd, så alle må besvares.</li>
      <li>Ingen etablert grenseverdi.</li>
      <li>MIC 13,4 poeng, målt 6–12 mnd etter ACL-rekonstruksjon (Webster & Feller 2021). Responsiviteten er god på gruppenivå, men mer usikker for enkeltpasienter.</li>
      <li>Utviklet av Webster, Feller og Lambros. Rettighetene er uavklart (ePROVIDE har ingen opplysning), så appen gjengir ikke spørsmålene.</li></ul>
    <p class="source">Webster KE, Feller JA, Lambros C. Phys Ther Sport 2008;9:9–15. Webster KE, Feller JA. Orthop J Sports Med 2018;6:2325967118763763. Webster KE, Feller JA. Orthop J Sports Med 2021;9:23259671211031240.</p>`
};
