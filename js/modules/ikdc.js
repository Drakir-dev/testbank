/* IKDC Subjective Knee Form (2000), ledd for ledd (© AOSSM).
   Spørsmålstekst hentes fra js/data/ledd-tekst.js når den er lagt inn. Skåring etter AOSSMs skåringsinstruksjon. */
import { num, f, fs } from "../lib/format.js";
import { inputF, esc } from "../lib/form.js";
import { itemRow, itemEntry } from "../lib/koos-hoos.js";
import { IKDC_TEXT } from "../data/ledd-tekst.js";

/* 18 skårede ledd: kode, maks poeng og om tallet pasienten krysset må snus (poeng = 10 − kryss).
   Ledd 10 «før skaden» skåres ikke. Sum maks = 87. */
export const IKDC_ITEMS = [
  { code: "1", max: 4 }, { code: "2", max: 10, reverse: true }, { code: "3", max: 10, reverse: true },
  { code: "4", max: 4 }, { code: "5", max: 4 }, { code: "6", max: 1 }, { code: "7", max: 4 }, { code: "8", max: 4 },
  ..."abcdefghi".split("").map(l => ({ code: "9" + l, max: 4 })),
  { code: "10", max: 10 }
];
export const IKDC_MAX = IKDC_ITEMS.reduce((a, x) => a + x.max, 0);

const r1 = x => Math.round(x * 10) / 10;

/* Poeng for ett ledd, eller null ved tomt/ugyldig svar */
export function ikdcPoints(item, v) {
  const x = num(v);
  if (!Number.isInteger(x) || x < 0 || x > item.max) return null;
  return item.reverse ? item.max - x : x;
}

/* Skår = sum ÷ maks mulig for besvarte ledd × 100. Minst 16 av 18 ledd må være besvart. */
export function scoreIkdc(s) {
  let sum = 0, max = 0, answered = 0;
  for (const it of IKDC_ITEMS) {
    const p = ikdcPoints(it, s["i" + it.code]);
    if (p != null) { sum += p; max += it.max; answered++; }
  }
  return { score: answered >= IKDC_ITEMS.length - 2 ? r1(sum / max * 100) : null, answered };
}

/* Endring mot MCID 11,5 (Irrgang 2006). Differansen rundes til én desimal før sammenligning. */
export function ikdcChange(cur, prev) {
  const diff = r1(cur - prev);
  return { diff, dir: diff === 0 ? "uendret" : diff > 0 ? "bedring" : "forverring", over: Math.abs(diff) >= 11.5 };
}

const prevScore = s => { const x = num(s.prev); return x != null && x >= 0 && x <= 100 ? r1(x) : null; };
const hint = it => it.reverse ? "kryss 0–10, snus" : it.code === "10" ? "kryss 0–10" : `poeng 0–${it.max}`;

export default {
  id: "ikdc", name: "IKDC", category: "PROM kne/hofte", status: "aktiv",
  title: "IKDC Subjective Knee Form", meta: "18 ledd · 0–100",
  initState: () => { const s = { prev: "" }; IKDC_ITEMS.forEach(it => s["i" + it.code] = ""); return s; },
  form: () => `
    <span class="hint">Velg svaret pasienten krysset. Tallene er poengene på skjemaet. På ledd 2 og 3 velger du tallet pasienten krysset, og appen snur skalaen så poengene blir riktige. Funksjon før skaden skåres ikke.</span>
    <div class="kitems">${IKDC_ITEMS.map(it => {
      const e = itemEntry(IKDC_TEXT, it.code);
      return (e.head ? `<div class="sub-h">${esc(e.head)}</div>` : "") + (e.note ? `<span class="hint">${esc(e.note)}</span>` : "")
        + itemRow("ikdc", it.code, "i" + it.code, it.max, e.q, `, ${hint(it)}`, e.opts);
    }).join("")}</div>
    <div class="grid">${inputF("ikdc-prev", "prev", "Forrige IKDC-skår (valgfritt)", "/100", { ph: "f.eks. 50,6" })}</div>`,
  result(s) {
    const P = scoreIkdc(s); if (!P.answered) return null;
    if (P.score == null) return { tone: "none", big: "…", main: `${P.answered} av 18 ledd besvart`, sub: "Minst 16 ledd må være besvart" };
    let sub = `${P.answered} av 18 ledd · høyere = bedre funksjon`;
    const pv = prevScore(s);
    if (pv != null) { const c = ikdcChange(P.score, pv); sub += ` · endring ${fs(c.diff)} (${c.over ? "over" : "under"} MCID 11,5)`; }
    return { tone: "none", big: f(P.score), main: `IKDC ${f(P.score)} av 100`, sub };
  },
  toText(s) {
    const P = scoreIkdc(s); if (P.score == null) return null;
    const out = [
      `IKDC Subjective Knee Form: ${f(P.score)} av 100 (${P.answered} av 18 ledd; høyere = bedre funksjon og færre symptomer).`,
      "Tolkning: Ingen etablert grenseverdi."
    ];
    const pv = prevScore(s);
    if (pv != null) {
      const c = ikdcChange(P.score, pv);
      out.push(`Endring fra forrige: ${f(pv)} → ${f(P.score)} (${fs(c.diff)} poeng, ${c.dir}; ${c.over ? "over" : "under"} MCID). MCID: 11,5 poeng (mest sensitive grense; 20,5 mest spesifikke; ulike knelidelser, Irrgang 2006). MDC 9,0 poeng (Irrgang 2001).`);
    }
    return out.join("\n");
  },
  guide: `<ul>
      <li>Pasienten fyller ut det lisensierte IKDC-skjemaet (2000-versjonen). Tast inn ett svar per ledd.</li>
      <li>Ledd 1 og 4–9: poeng etter AOSSMs skåringsnøkkel, der 0 = lavest funksjon eller mest symptomer.</li>
      <li>Ledd 2 og 3: tallet pasienten krysset (0–10). Appen snur skalaen (poeng = 10 − kryss). Ledd 10: tallet for nåværende funksjon (0–10). Funksjon før skaden skåres ikke.</li>
      <li>Skår = sum av poeng ÷ maks mulig for besvarte ledd × 100 (maks 87 når alle er besvart). Skåren regnes ut når minst 16 av 18 ledd er besvart.</li>
      <li>MCID: 11,5 poeng er mest sensitive og 20,5 mest spesifikke grense for bedring, hos pasienter med ulike knelidelser (Irrgang 2006). Appen klassifiserer mot 11,5. MDC 9,0 poeng (Irrgang 2001).</li>
      <li>IKDC © American Orthopaedic Society for Sports Medicine (AOSSM). Helseforetak må ha lisens fra AOSSM. Spørsmålsteksten vises bare når den er lagt inn fra Ahus' lisensierte norske versjon (js/data/ledd-tekst.js).</li></ul>
    <p class="source">Irrgang JJ et al. Am J Sports Med 2001;29:600–13. Irrgang JJ et al. Am J Sports Med 2006;34:1567–73. AOSSM: 2000 IKDC Knee Forms, skåringsinstruksjon.</p>`
};
