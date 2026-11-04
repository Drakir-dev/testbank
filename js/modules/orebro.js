/* Örebro Musculoskeletal Pain Screening Questionnaire (ÖMPSQ), fullversjon, ledd for ledd (© Steven J. Linton).
   Spørsmålstekst hentes fra js/data/ledd-tekst.js når Rikard har lagt den inn. Skåring etter Lintons FAQ. */
import { num, fs } from "../lib/format.js";
import { inputF, esc } from "../lib/form.js";
import { itemRow, itemEntry } from "../lib/koos-hoos.js";
import { OREBRO_TEXT } from "../data/ledd-tekst.js";

/* Ledd 5–25 skåres. sites: antall smerteområder × 2 (maks 10). box: rute 1–10. scale: tallet som er krysset 0–10,
   snudd (10 − tallet) for ledd 12, 16, 17 og 21–25. */
const REVERSED = [12, 16, 17, 21, 22, 23, 24, 25];
export const OREBRO_ITEMS = [
  { code: "5", type: "sites" }, { code: "6", type: "box" }, { code: "7", type: "box" },
  ...Array.from({ length: 18 }, (_, i) => ({ code: String(i + 8), type: "scale", reverse: REVERSED.includes(i + 8) }))
];
export const OREBRO_MAX = 210;

/* Poeng for ett ledd, eller null ved tomt/ugyldig svar */
export function orebroPoints(item, v) {
  const x = num(v);
  if (!Number.isInteger(x)) return null;
  if (item.type === "sites") return x >= 0 && x <= 10 ? Math.min(x * 2, 10) : null;
  if (item.type === "box") return x >= 1 && x <= 10 ? x : null;
  if (x < 0 || x > 10) return null;
  return item.reverse ? 10 - x : x;
}

/* Totalskår. Alle 21 skårede ledd må være besvart. */
export function scoreOrebro(s) {
  let sum = 0, answered = 0;
  for (const it of OREBRO_ITEMS) { const p = orebroPoints(it, s["o" + it.code]); if (p != null) { sum += p; answered++; } }
  return { score: answered === OREBRO_ITEMS.length ? sum : null, answered };
}

/* Risiko: >105 høy (Linton & Boersma 2003), >90 middels (Lintons FAQ) */
export function orebroRisk(t) {
  if (t > 105) return { risk: "høy risiko", tone: "crit" };
  if (t > 90) return { risk: "middels risiko", tone: "warn" };
  return { risk: "lav risiko", tone: "ok" };
}

const prevScore = s => { const x = num(s.prev); return Number.isInteger(x) && x >= 0 && x <= OREBRO_MAX ? x : null; };
const hint = it => it.type === "sites" ? "" : it.type === "box" ? ", rute 1–10" : it.reverse ? ", kryss 0–10, snus" : ", kryss 0–10";

function row(it) {
  const e = itemEntry(OREBRO_TEXT, it.code);
  const head = (e.head ? `<div class="sub-h">${esc(e.head)}</div>` : "") + (e.note ? `<span class="hint">${esc(e.note)}</span>` : "");
  if (it.type === "sites") return head + `<div class="grid">${inputF("orebro-5", "o5", e.q ? `5. ${esc(e.q)}` : "Ledd 5: antall smerteområder", "", { int: true, ph: "antall", hint: "Poeng = antall × 2, maks 10" })}</div>`;
  return head + itemRow("orebro", it.code, "o" + it.code, 10, e.q, hint(it), e.opts, false, it.type === "box" ? 1 : 0);
}

export default {
  id: "orebro", name: "Örebro", category: "PROM rygg/nakke", status: "aktiv",
  title: "Örebro Musculoskeletal Pain Screening Questionnaire (ÖMPSQ)", meta: "21 skårede ledd · 2–210 · høyere = høyere risiko",
  initState: () => { const s = { prev: "" }; OREBRO_ITEMS.forEach(it => s["o" + it.code] = ""); return s; },
  form: () => `
    <span class="hint">Tast inn svarene fra pasientens skjema. Ledd 5: antall smerteområder som er krysset av. Ledd 6 og 7: ruten som er krysset (1 = første rute). Ledd 8–25: tallet pasienten krysset (0–10). Appen snur skalaen for ledd 12, 16, 17 og 21–25. Ledd 1–4 skåres ikke.</span>
    <div class="kitems">${OREBRO_ITEMS.map(row).join("")}</div>
    <div class="grid">${inputF("orebro-prev", "prev", "Forrige Örebro-skår (valgfritt)", "/210", { int: true, ph: "f.eks. 98" })}</div>`,
  result(s) {
    const P = scoreOrebro(s); if (!P.answered) return null;
    if (P.score == null) return { tone: "none", big: "…", main: `${P.answered} av 21 ledd besvart`, sub: "Alle 21 skårede ledd må være besvart" };
    const R = orebroRisk(P.score);
    return { tone: R.tone, big: String(P.score), main: `${R.risk[0].toUpperCase() + R.risk.slice(1)} for langvarig arbeidsuførhet`, sub: "≤90 lav, 91–105 middels, >105 høy risiko" };
  },
  toText(s) {
    const P = scoreOrebro(s); if (P.score == null) return null;
    const out = [
      `Örebro (ÖMPSQ): ${P.score} av 210 (høyere = høyere risiko).`,
      `Tolkning: ${orebroRisk(P.score).risk[0].toUpperCase() + orebroRisk(P.score).risk.slice(1)} for langvarig arbeidsuførhet (>105 høy risiko, Linton & Boersma 2003; >90 middels risiko, Linton).`
    ];
    const pv = prevScore(s);
    if (pv != null) {
      const diff = P.score - pv;
      out.push(`Endring fra forrige: ${pv} → ${P.score} (${fs(diff, 0)} poeng). Ingen etablert MCID. Skjemaet er laget for screening, ikke for å måle effekt av behandling (Linton).`);
    }
    return out.join("\n");
  },
  guide: `<ul>
      <li>Pasienten fyller ut skjemaet selv, helst ved første konsultasjon. Ledd 1–4 er bakgrunnsspørsmål og skåres ikke.</li>
      <li>Skåring (Lintons skåringsinstruksjon): ledd 5 = antall smerteområder × 2 (maks 10). Ledd 6 og 7 = ruten som er krysset, 1–10. Ledd 8–11, 13–15 og 18–20 = tallet som er krysset. Ledd 12, 16, 17 og 21–25 = 10 minus tallet. Totalskår = sum av ledd 5–25. Appen regner bare ut skåren når alle 21 ledd er besvart.</li>
      <li>Tolkning: Skåren anslår risikoen for sykefravær på grunn av smerter det neste året. Over 105 er høy risiko (Linton & Boersma 2003). Grenser fra 105 til 112 er brukt, og over 90 kan bety middels risiko (Linton). Grensen varierer mellom pasienter og settinger.</li>
      <li>Se også på svarene på hvert enkelt ledd, de sier noe om hvilke faktorer som bør følges opp.</li>
      <li>Skjemaet er ikke laget for å måle effekt av behandling, og det finnes ingen etablert MCID.</li>
      <li>Norsk versjon: Grotle, Vøllestad & Brox 2006 (akutte korsryggsmerter).</li>
      <li>ÖMPSQ © Steven J. Linton. Kan kopieres gratis til klinisk bruk og forskning (Lintons FAQ, Örebro universitet). Spørsmålsteksten vises når Rikard har lagt inn den norske versjonen i js/data/ledd-tekst.js.</li></ul>
    <p class="source">Linton SJ, Boersma K. Clin J Pain 2003;19:80–6. Linton SJ. 10 frequently asked questions about the Örebro Musculoskeletal Pain Screening Questionnaire. Örebro universitet. Grotle M, Vøllestad NK, Brox JI. Clin J Pain 2006;22:458–67.</p>`
};
