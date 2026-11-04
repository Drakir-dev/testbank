/* WORC og WOSI (© A. Kirkley m.fl.), delskårer per domene uten spørsmålstekst.
   Hvert ledd er en 100 mm VAS (0 = ingen plager). Domenesummene tastes inn i mm.
   Skår i % = (2100 − sum) / 2100 × 100, høyere = bedre (Kirkley 1998, 2003). Rene funksjoner, ingen DOM.
   Begge variantene har egne felt (worc_…, wosi_…), og paint() viser bare den valgte. */
import { num, f, fs } from "../lib/format.js";
import { inputF, radioF } from "../lib/form.js";

/* [nøkkel, navn i DIPS, antall ledd]. Maks per domene = ledd × 100 mm. Begge summerer til 2100. */
export const WORC_VARIANTS = {
  worc: {
    name: "WORC", title: "Western Ontario Rotator Cuff Index",
    domains: [["fys", "fysiske symptomer", 6], ["sport", "sport/fritid", 4], ["arb", "arbeid", 4], ["liv", "livsstil", 4], ["fol", "følelser", 3]],
    mcidPct: 275 / 21, mcidText: "MCID: 275 av 2100 poeng ≈ 13,1 % (rotatormansjettlidelse, norsk versjon, Ekeberg 2010)."
  },
  wosi: {
    name: "WOSI", title: "Western Ontario Shoulder Instability Index",
    domains: [["fys", "fysiske symptomer", 10], ["sport", "sport/fritid/arbeid", 4], ["liv", "livsstil", 4], ["fol", "følelser", 3]],
    mcidPct: 10, mcidText: "MCID: 10 % (skulderinstabilitet, Kirkley 1998). MDC 9,2 % (operert fremre skulderinstabilitet, Elamo 2022)."
  }
};
export const WORC_MAX = 2100;

const r1 = x => Math.round(x * 10) / 10;
const pct = (sum, max) => r1((max - sum) / max * 100);
const variantOf = s => s.variant === "wosi" ? "wosi" : "worc";

/* Domenesum i mm: heltall 0 til maks, ellers null */
export const domainVal = (v, n) => { const x = num(v); return Number.isInteger(x) && x >= 0 && x <= n * 100 ? x : null; };

/* {V, total (mm), pct, domains: [{key, label, sum, pct}], filled}. pct er null til alle domener er fylt inn. */
export function scoreWorc(s) {
  const v = variantOf(s), V = WORC_VARIANTS[v];
  const domains = V.domains.map(([key, label, n]) => {
    const sum = domainVal(s[`${v}_${key}`], n);
    return { key, label, sum, pct: sum == null ? null : pct(sum, n * 100) };
  });
  const done = domains.filter(d => d.sum != null);
  const total = done.length === domains.length ? done.reduce((a, d) => a + d.sum, 0) : null;
  return { V, total, pct: total == null ? null : pct(total, WORC_MAX), domains, filled: done.length };
}

/* Endring i prosentpoeng, høyere = bedre. Over MCID når |endring| ≥ MCID i % med én desimal (WORC: 275 poeng = 13,1 %). */
export function worcChange(cur, prev, mcidPct) {
  const diff = r1(cur - prev);
  return { diff, dir: diff === 0 ? "uendret" : diff > 0 ? "bedring" : "forverring", over: Math.abs(diff) >= r1(mcidPct) };
}

const prevScore = s => { const x = num(s["prev_" + variantOf(s)]); return x != null && x >= 0 && x <= 100 ? r1(x) : null; };
const cap = t => t[0].toUpperCase() + t.slice(1);

export default {
  id: "worc", name: "WORC/WOSI", category: "PROM skulder/arm", status: "aktiv",
  title: "WORC / WOSI", meta: "21 ledd · domenesummer i mm · 0–100 %",
  initState: () => {
    const s = { variant: "worc" };
    for (const [v, V] of Object.entries(WORC_VARIANTS)) { V.domains.forEach(([k]) => s[`${v}_${k}`] = ""); s["prev_" + v] = ""; }
    return s;
  },
  form: () => `
    ${radioF("worc-variant", "variant", "Skjema", [["worc", "WORC (rotatormansjett)"], ["wosi", "WOSI (instabilitet)"]])}
    ${Object.entries(WORC_VARIANTS).map(([v, V]) => `
    <div data-variant="${v}">
      <span class="hint">Tast inn summen av VAS-svarene (mm) for hvert domene, fra pasientens lisensierte ${V.name}-skjema. 0 = ingen plager.</span>
      <div class="grid">${V.domains.map(([k, label, n]) => inputF(`worc-${v}-${k}`, `${v}_${k}`, `${cap(label)} (${n} ledd)`, `/${n * 100}`, { int: true, ph: `0–${n * 100}` })).join("")}</div>
      <div class="grid">${inputF(`worc-prev-${v}`, "prev_" + v, `Forrige ${V.name} (valgfritt)`, "%", { ph: "f.eks. 52,4" })}</div>
    </div>`).join("")}`,
  paint(card, s) {
    card.querySelectorAll("[data-variant]").forEach(el => el.hidden = el.dataset.variant !== variantOf(s));
  },
  result(s) {
    const P = scoreWorc(s); if (!P.filled) return null;
    if (P.pct == null) return { tone: "none", big: "…", main: `${P.filled} av ${P.domains.length} domener fylt inn`, sub: "Alle domener må fylles inn" };
    let sub = `Sum ${P.total} av 2100 mm · 100 % = ingen plager`;
    const pv = prevScore(s);
    if (pv != null) { const c = worcChange(P.pct, pv, P.V.mcidPct); sub += ` · endring ${fs(c.diff)} (${c.over ? "over" : "under"} MCID)`; }
    return { tone: "none", big: f(P.pct), main: `${P.V.name} ${f(P.pct)} %`, sub };
  },
  toText(s) {
    const P = scoreWorc(s); if (P.pct == null) return null;
    const out = [
      `${P.V.name} (${P.V.title}): ${f(P.pct)} % (sum ${P.total} av 2100 mm; 0 % = verst, 100 % = ingen plager). Domener: ${P.domains.map(d => `${d.label} ${f(d.pct)} %`).join(", ")}.`,
      "Tolkning: Ingen etablert grenseverdi."
    ];
    const pv = prevScore(s);
    if (pv != null) {
      const c = worcChange(P.pct, pv, P.V.mcidPct);
      out.push(`Endring fra forrige: ${f(pv)} → ${f(P.pct)} % (${fs(c.diff)} prosentpoeng, ${c.dir}; ${c.over ? "over" : "under"} MCID). ${P.V.mcidText}`);
    }
    return out.join("\n");
  },
  guide: `<ul>
      <li>Velg WORC ved rotatormansjettlidelse og WOSI ved skulderinstabilitet. Begge har 21 ledd med 100 mm VAS, der 0 mm er ingen plager.</li>
      <li>WORC har 5 domener: fysiske symptomer (6 ledd), sport/fritid (4), arbeid (4), livsstil (4) og følelser (3). WOSI har 4 domener: fysiske symptomer (10), sport/fritid/arbeid (4), livsstil (4) og følelser (3).</li>
      <li>Mål hvert svar i mm og summer per domene. Appen regner ut total (0–2100) og prosent: (2100 − sum) / 2100 × 100, der 100 % er ingen plager. Domenene vises i prosent på samme måte. Alle domener må fylles inn.</li>
      <li>Det finnes ingen etablert grenseverdi for alvorlighetsgrad.</li>
      <li>WORC: MCID 275 poeng (≈ 13,1 %) hos pasienter med rotatormansjettlidelse som fikk kortisoninjeksjon, målt med den norske versjonen (Ekeberg 2010). Norsk oversettelse og validering: Ekeberg 2008.</li>
      <li>WOSI: MCID 10 % ved skulderinstabilitet (Kirkley 1998, slik den er gjengitt i Elamo 2022). MDC 9,2 % hos unge menn operert for fremre instabilitet (Elamo 2022). Ingen norsk validering av WOSI er funnet.</li>
      <li>WORC © 1998 A. Kirkley, S. Griffin og C. Alvarez. WOSI © 1998 A. Kirkley og S. Griffin. Bruk krever tillatelse fra rettighetshaverne. Appen viser derfor ikke spørsmålene, bare domenesummene.</li></ul>
    <p class="source">Kirkley A, Griffin S, McLintock H, Ng L. Am J Sports Med 1998;26:764–72. Kirkley A, Alvarez C, Griffin S. Clin J Sport Med 2003;13:84–92. Ekeberg OM et al. BMC Musculoskelet Disord 2008;9:68. Ekeberg OM et al. J Clin Epidemiol 2010;63:575–84. Elamo SP et al. BMC Musculoskelet Disord 2022;23:1127.</p>`
};
