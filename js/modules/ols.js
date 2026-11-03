/* Ettbensstående */
import { num, f } from "../lib/format.js";
import { inputF } from "../lib/form.js";

export const OLS_NORM = [ // Springer 2007, gjennomsnitt best av 3: [lo, hi, åpne{k,m,t}, lukket{k,m,t}]
  [18, 39, { kvinne: 45.1, mann: 44.4, t: 44.7 }, { kvinne: 13.1, mann: 16.9, t: 15.2 }],
  [40, 49, { kvinne: 42.1, mann: 41.6, t: 41.9 }, { kvinne: 13.5, mann: 12.0, t: 12.7 }],
  [50, 59, { kvinne: 40.9, mann: 41.5, t: 41.2 }, { kvinne: 7.9, mann: 8.6, t: 8.3 }],
  [60, 69, { kvinne: 30.4, mann: 33.8, t: 32.1 }, { kvinne: 3.6, mann: 5.1, t: 4.4 }],
  [70, 79, { kvinne: 16.7, mann: 25.9, t: 21.5 }, { kvinne: 3.7, mann: 2.6, t: 3.1 }],
  [80, 99, { kvinne: 10.6, mann: 8.7, t: 9.4 }, { kvinne: 2.1, mann: 1.8, t: 1.9 }]
];
export const olsNorm = p => { const a = num(p.age); if (a == null) return null; const r = OLS_NORM.find(([lo, hi]) => a >= lo && a <= hi); if (!r) return null; const k = p.sex || "t"; return { lo: r[0], hi: r[1], open: r[2][k], closed: r[3][k] }; };

/* Svakeste side med øynene åpne, eller null hvis ingen side er fylt inn */
export function olsWeakest(s) {
  const vals = [num(s.ro), num(s.lo)].filter(x => x != null);
  return vals.length ? Math.min(...vals) : null;
}

export default {
  id: "ols", name: "Ettbensstående", category: "Balanse", status: "aktiv",
  title: "Ettbensstående", meta: "Best av 3 · maks 45 s",
  initState: () => ({ ro: "", lo: "", rc: "", lc: "" }),
  form: () => `
    <div class="grid">
      ${inputF("ols-ro", "ro", "Høyre, øyne åpne", "s")}
      ${inputF("ols-lo", "lo", "Venstre, øyne åpne", "s")}
      ${inputF("ols-rc", "rc", "Høyre, øyne lukket", "s", { hint: "Valgfritt" })}
      ${inputF("ols-lc", "lc", "Venstre, øyne lukket", "s", { hint: "Valgfritt" })}
    </div>`,
  result(s, p) {
    const mn = olsWeakest(s); if (mn == null) return null;
    const nm = olsNorm(p);
    const sub = nm ? `Snitt ${nm.lo}–${nm.hi} år, øyne åpne: ${f(nm.open)} s` : "Oppgi alder for normverdi";
    if (mn < 5) return { tone: "crit", big: f(mn), main: "Under 5 s på ett ben", sub: "Økt risiko for fall med skade · " + sub };
    return { tone: nm && mn < nm.open ? "warn" : "ok", big: f(mn), main: nm && mn < nm.open ? "Under gjennomsnitt for alder" : "Svakeste side, øyne åpne", sub };
  },
  toText(s, p) {
    const v = k => num(s[k]); const t = x => x == null ? "–" : `${f(x)} s`;
    if (v("ro") == null && v("lo") == null) return null;
    const out = [`Ettbensstående (best av 3, maks 45 s): Øyne åpne – høyre ${t(v("ro"))}, venstre ${t(v("lo"))}.`];
    if (v("rc") != null || v("lc") != null) out[0] += ` Øyne lukket – høyre ${t(v("rc"))}, venstre ${t(v("lc"))}.`;
    const nm = olsNorm(p);
    if (nm) out.push(`Referanse ${nm.lo}–${nm.hi} år${p.sex ? ` (${p.sex === "mann" ? "menn" : "kvinner"})` : ""}: gjennomsnitt øyne åpne ${f(nm.open)} s, øyne lukket ${f(nm.closed)} s (Springer 2007).`);
    if (olsWeakest(s) < 5) out.push("Tolkning: Under 5 s på ett ben er forbundet med økt risiko for fall med skade hos eldre (Vellas 1997).");
    return out.join("\n");
  },
  guide: `<ul>
      <li>Barbent, armene i kryss over brystet, blikket på et punkt i øyehøyde. Løftet fot nær, men ikke i kontakt med, standbenets ankel.</li>
      <li>Stopp ved: armene løses, løftet fot berører gulvet eller standbenet, standfoten flytter seg, øynene åpnes (lukket-forsøk) eller 45 s.</li>
      <li>Tre forsøk per betingelse. Før inn beste tid.</li>
      <li>Under 5 s er forbundet med økt risiko for fall med skade. Ingen etablert MCID.</li></ul>
    <p class="source">Springer BA et al., J Geriatr Phys Ther 2007;30:8–15. Vellas BJ et al., J Am Geriatr Soc 1997;45:735–8.</p>`
};
