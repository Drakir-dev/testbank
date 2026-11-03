/* Numeric Pain Rating Scale (NPRS) 0–10 */
import { num, fs } from "../lib/format.js";
import { inputF } from "../lib/form.js";

/* Heltall 0–10, ellers null */
export const nprsVal = v => { const x = num(v); return Number.isInteger(x) && x >= 0 && x <= 10 ? x : null; };

/* Grad for gjennomsnittlig smerte siste uke: ≤5 lett, 6–7 moderat, ≥8 sterk (Boonstra 2016, kronisk muskel-skjelettsmerte) */
export function interpretNprs(avg) {
  if (avg === 0) return { grade: "ingen smerte", tone: "ok" };
  if (avg <= 5) return { grade: "lett smerte", tone: "ok" };
  if (avg <= 7) return { grade: "moderat smerte", tone: "warn" };
  return { grade: "sterk smerte", tone: "crit" };
}

/* Endring mot forrige. MCID: 2 poeng eller 30 % (Farrar 2001). pct er null når forrige er 0. */
export function nprsChange(cur, prev) {
  const diff = cur - prev;
  const pct = prev > 0 ? Math.round(diff / prev * 100) : null;
  const dir = diff === 0 ? "uendret" : diff < 0 ? "bedring" : "forverring";
  const over = Math.abs(diff) >= 2 || (pct != null && Math.abs(pct) >= 30);
  return { diff, pct, dir, over };
}

/* [nøkkel, forrige-nøkkel, tekst i DIPS, etikett i skjemaet] */
export const NPRS_FIELDS = [
  ["now", "prevNow", "nå", "Nå"],
  ["avg", "prevAvg", "gjennomsnitt siste uke", "Snitt siste uke"],
  ["worst", "prevWorst", "verst siste uke", "Verst siste uke"]
];

const filled = s => NPRS_FIELDS.map(([k, pk, txt]) => ({ k, txt, v: nprsVal(s[k]), pv: nprsVal(s[pk]) })).filter(x => x.v != null);

export default {
  id: "nprs", name: "NPRS", category: "Generiske", status: "aktiv",
  title: "Numeric Pain Rating Scale (NPRS)", meta: "0 = ingen smerte · 10 = verst tenkelige smerte",
  initState: () => ({ now: "", avg: "", worst: "", prevNow: "", prevAvg: "", prevWorst: "" }),
  form: () => `
    <div class="grid">${NPRS_FIELDS.map(([k, , , lbl]) => inputF(`nprs-${k}`, k, lbl, "/10", { int: true, ph: "0–10" })).join("")}</div>
    <div class="sub-h">Forrige måling (valgfritt)</div>
    <div class="grid">${NPRS_FIELDS.map(([, pk, , lbl]) => inputF(`nprs-${pk}`, pk, lbl, "/10", { int: true, ph: "0–10" })).join("")}</div>`,
  result(s) {
    const F = filled(s); if (!F.length) return null;
    const sub = F.map(x => `${x.txt} ${x.v}`).join(" · ");
    const avg = nprsVal(s.avg);
    if (avg == null) return { tone: "none", big: String(F[0].v), main: "Gradering krever snitt siste uke", sub };
    const I = interpretNprs(avg);
    return { tone: I.tone, big: String(avg), main: I.grade[0].toUpperCase() + I.grade.slice(1) + " (snitt siste uke)", sub: `${sub} · ≤5 lett, 6–7 moderat, ≥8 sterk` };
  },
  toText(s) {
    const F = filled(s); if (!F.length) return null;
    const out = [`Smerte (NPRS 0–10): ${F.map(x => `${x.txt} ${x.v}`).join(", ")}.`];
    const avg = nprsVal(s.avg);
    if (avg != null) out.push(`Tolkning: Gjennomsnittlig smerte siste uke tilsvarer ${interpretNprs(avg).grade} (≤5 lett, 6–7 moderat, ≥8 sterk; kronisk muskel-skjelettsmerte, Boonstra 2016).`);
    const ch = F.filter(x => x.pv != null).map(x => {
      const c = nprsChange(x.v, x.pv);
      const pct = c.pct != null ? `, ${fs(c.pct, 0)} %` : "";
      return `${x.txt} ${x.pv} → ${x.v} (${fs(c.diff, 0)} poeng${pct}, ${c.dir}; ${c.over ? "over" : "under"} MCID)`;
    });
    if (ch.length) out.push(`Endring fra forrige: ${ch.join("; ")}. MCID: 2 poeng eller 30 % (kronisk smerte, Farrar 2001).`);
    return out.join("\n");
  },
  guide: `<ul>
      <li>Spør: «På en skala fra 0 til 10, der 0 er ingen smerte og 10 er verst tenkelige smerte, hvor sterk er smerten …» nå, i gjennomsnitt siste uke og på det verste siste uke. Hele tall.</li>
      <li>Fyll inn det som er relevant. Gradering gjøres bare for gjennomsnittlig smerte siste uke.</li>
      <li>Grad: ≤5 lett, 6–7 moderat, ≥8 sterk smerte, målt som smertens påvirkning på funksjon hos pasienter med kronisk muskel-skjelettsmerte (Boonstra 2016). Grensene varierer mellom populasjoner og studier og er veiledende.</li>
      <li>MCID: reduksjon på ca. 2 poeng eller ca. 30 % ved kronisk smerte (Farrar 2001). Ved høy utgangsskår trengs større endring i poeng, mens prosentgrensen er mer stabil.</li>
      <li>MDC ca. 2 poeng ved korsryggsmerte (Childs 2005).</li>
      <li>Fri å bruke, ingen rettighetshaver.</li></ul>
    <p class="source">Jensen MP, Karoly P, Braver S. Pain 1986;27:117–26. Hawker GA et al. Arthritis Care Res 2011;63 Suppl 11:S240–52. Boonstra AM et al. Front Psychol 2016;7:1466. Farrar JT et al. Pain 2001;94:149–58. Childs JD, Piva SR, Fritz JM. Spine 2005;30:1331–4.</p>`
};
