/* EQ-5D-5L (© EuroQol Research Foundation): nivå 1–5 per dimensjon og EQ VAS, uten spørsmåls- eller nivåtekst.
   Indeks med norsk verdisett (Garratt 2024) og VAS mot norske normer (Garratt 2022). Rene funksjoner, ingen DOM. */
import { num, f, fs } from "../lib/format.js";
import { inputF } from "../lib/form.js";
import { itemRow } from "../lib/koos-hoos.js";
import { EQ5D_NO_BETA, EQ5D_NO_LEVEL, EQ_VAS_NORM } from "../data/eq5d-no.js";

/* [nøkkel, navn] i skjemaets rekkefølge, som gir profilen (f.eks. 21232) */
export const EQ5D_DIMS = [["MO", "gange"], ["SC", "personlig stell"], ["UA", "vanlige gjøremål"], ["PD", "smerte/ubehag"], ["AD", "angst/depresjon"]];

const r3 = x => Math.round(x * 1000) / 1000;
const level = v => { const x = num(v); return Number.isInteger(x) && x >= 1 && x <= 5 ? x : null; };
export const vasVal = v => { const x = num(v); return Number.isInteger(x) && x >= 0 && x <= 100 ? x : null; };

/* Profil og nivåer, eller null til alle fem dimensjoner er fylt inn */
export function eq5dProfile(s) {
  const L = EQ5D_DIMS.map(([k]) => level(s[k]));
  return L.every(x => x != null) ? { levels: L, code: L.join("") } : null;
}

/* Indeks med norsk verdisett: 1 − Σ β × nivåvekt, tre desimaler (Garratt 2024) */
export function eq5dIndexNo(levels) {
  return r3(1 - EQ5D_DIMS.reduce((a, [k], i) => a + EQ5D_NO_BETA[k] * EQ5D_NO_LEVEL[levels[i] - 1], 0));
}

/* Norm for EQ VAS etter alder og kjønn (Garratt 2022). Uten kjønn brukes begge kjønn samlet. */
export function vasNorm(p) {
  const a = num(p && p.age);
  if (a == null || a < 18) return null;
  const row = EQ_VAS_NORM.find(([lo, hi]) => a >= lo && a <= hi);
  if (!row) return null;
  const col = p.sex === "kvinne" ? 3 : p.sex === "mann" ? 4 : 2;
  const who = p.sex === "kvinne" ? "kvinner" : p.sex === "mann" ? "menn" : "begge kjønn";
  return { mean: row[col][0], sd: row[col][1], label: `${who} ${row[1] >= 200 ? "80 år og eldre" : `${row[0]}–${row[1]} år`}` };
}

const prevIndex = s => { const x = num(s.prevIndex); return x != null && x >= -0.453 && x <= 1 ? r3(x) : null; };

export default {
  id: "eq5d", name: "EQ-5D", category: "Generiske", status: "aktiv",
  title: "EQ-5D-5L", meta: "5 dimensjoner · indeks (norsk verdisett) · EQ VAS 0–100",
  initState: () => ({ MO: "", SC: "", UA: "", PD: "", AD: "", vas: "", prevIndex: "", prevVas: "" }),
  form: () => `
    <span class="hint">Tast inn nivået pasienten krysset på det lisensierte skjemaet: 1 = ingen problemer, 5 = ekstreme problemer eller kan ikke.</span>
    <div class="kitems">${EQ5D_DIMS.map(([k, name], i) => itemRow("eq5d", String(i + 1), k, 5, name[0].toUpperCase() + name.slice(1), "", null, false, 1)).join("")}</div>
    <div class="grid">${inputF("eq5d-vas", "vas", "EQ VAS", "/100", { int: true, ph: "0–100", hint: "100 = best tenkelige helse" })}</div>
    <div class="sub-h">Forrige måling (valgfritt)</div>
    <div class="grid">
      ${inputF("eq5d-prevIndex", "prevIndex", "Indeks", "", { ph: "f.eks. 0,612" })}
      ${inputF("eq5d-prevVas", "prevVas", "EQ VAS", "/100", { int: true, ph: "0–100" })}
    </div>`,
  result(s, p) {
    const P = eq5dProfile(s), vas = vasVal(s.vas);
    if (!P && vas == null) return null;
    const nm = vasNorm(p);
    const sub = [P ? `Profil ${P.code}` : "Profil ikke komplett", vas != null ? `EQ VAS ${vas}` : null,
      vas != null && nm ? `norm ${f(nm.mean)} for ${nm.label}` : null].filter(Boolean).join(" · ");
    if (!P) return { tone: "none", big: String(vas), main: "EQ VAS (indeks krever alle fem dimensjoner)", sub };
    const idx = eq5dIndexNo(P.levels);
    return { tone: "none", big: f(idx, 3), main: "Indeks, norsk verdisett (1 = full helse)", sub };
  },
  toText(s, p) {
    const P = eq5dProfile(s), vas = vasVal(s.vas);
    if (!P && vas == null) return null;
    const parts = [];
    if (P) parts.push(`helseprofil ${P.code} (${EQ5D_DIMS.map(([, n], i) => `${n} ${P.levels[i]}`).join(", ")}; 1 = ingen problemer, 5 = ekstreme problemer), indeks ${f(eq5dIndexNo(P.levels), 3)} (norsk verdisett, Garratt 2024)`);
    if (vas != null) parts.push(`EQ VAS ${vas} av 100`);
    const out = [`EQ-5D-5L: ${parts.join(". ")}.`];
    const nm = vasNorm(p);
    const tolk = [];
    if (vas != null && nm) tolk.push(`EQ VAS ${vas} mot norm ${f(nm.mean)} (SD ${f(nm.sd)}) for ${nm.label} i normalbefolkningen (Garratt 2022)`);
    if (P) tolk.push("ingen etablert grenseverdi for indeksen");
    if (tolk.length) out.push(`Tolkning: ${tolk.join("; ").replace(/^./, c => c.toUpperCase())}.`);
    const ch = [];
    const pi = prevIndex(s), pv = vasVal(s.prevVas);
    if (P && pi != null) { const c = r3(eq5dIndexNo(P.levels) - pi); ch.push(`indeks ${f(pi, 3)} → ${f(eq5dIndexNo(P.levels), 3)} (${fs(c, 3)})`); }
    if (vas != null && pv != null) ch.push(`EQ VAS ${pv} → ${vas} (${fs(vas - pv, 0)})`);
    if (ch.length) out.push(`Endring fra forrige: ${ch.join("; ")}. Ingen etablert MCID.`);
    return out.join("\n");
  },
  guide: `<ul>
      <li>Pasienten fyller ut det lisensierte EQ-5D-5L-skjemaet: fem dimensjoner (gange, personlig stell, vanlige gjøremål, smerte/ubehag og angst/depresjon) med fem nivåer, og EQ VAS for helsen i dag (0 = verst, 100 = best tenkelige helse).</li>
      <li>Profilen er fem siffer i rekkefølgen over, f.eks. 21232.</li>
      <li>Indeksen regnes ut med det norske verdisettet: 1 − sum av dimensjonsvekt × nivåvekt. Dimensjonsvekter er 0,205 for gange, 0,206 for personlig stell, 0,179 for vanlige gjøremål, 0,391 for smerte/ubehag og 0,472 for angst/depresjon. Nivåvekter er 0, 0,152, 0,317, 0,775 og 1. Indeksen går fra −0,453 til 1, der 1 er full helse og 0 er like ille som død (Garratt 2024). Indekser regnet med det tidligere anbefalte crosswalk-verdisettet kan ikke sammenlignes direkte.</li>
      <li>EQ VAS sammenlignes med norske befolkningsnormer for alder og kjønn (Garratt 2022). Fyll inn alder og kjønn øverst. Normene for indeks i samme studie bruker crosswalk-verdisettet og vises derfor ikke.</li>
      <li>Det finnes ingen etablert grenseverdi eller MCID for EQ-5D-5L generelt. Verdiene varierer mellom diagnoser.</li>
      <li>EQ-5D © EuroQol Research Foundation. All bruk krever registrering hos EuroQol, også ikke-kommersiell. Papirversjonen kan ikke legges inn i en app, så appen viser verken spørsmål eller svartekster, bare nivåene som tastes inn.</li></ul>
    <p class="source">Herdman M et al. Qual Life Res 2011;20:1727–36. Garratt AM, Stavem K, Shaw JW, Rand K. EQ-5D-5L value set for Norway: a hybrid model using cTTO and DCE data. Qual Life Res 2025;34:417– (publisert digitalt 2024, doi 10.1007/s11136-024-03837-3). Garratt AM, Hansen TM, Augestad LA, Rand K, Stavem K. Qual Life Res 2022;31:517–26.</p>`
};
