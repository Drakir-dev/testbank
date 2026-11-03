/* Patient-Specific Functional Scale (PSFS), original retning: 0 = kan ikke utføre, 10 = som før plagene */
import { num, f, fs } from "../lib/format.js";
import { inputF } from "../lib/form.js";

export const PSFS_MAX = 5;
const r1 = x => Math.round(x * 10) / 10;

/* Heltall 0–10, ellers null */
export const psfsVal = v => { const x = num(v); return Number.isInteger(x) && x >= 0 && x <= 10 ? x : null; };

/* Utfylte aktiviteter og snitt med én desimal. avg er null til minst én aktivitet er skåret. */
export function scorePsfs(s) {
  const items = [];
  for (let i = 1; i <= PSFS_MAX; i++) {
    const score = psfsVal(s["s" + i]);
    if (score != null) items.push({ name: s["a" + i].trim() || `aktivitet ${i}`, score });
  }
  const avg = items.length ? r1(items.reduce((a, x) => a + x.score, 0) / items.length) : null;
  return { items, avg };
}

/* Endring i snittskår. Differansen rundes til én desimal før den sammenlignes med MCID 2,3 (Abbott & Schmitt 2014). */
export function psfsChange(avg, prev) {
  const diff = r1(avg - prev);
  return { diff, dir: diff === 0 ? "uendret" : diff > 0 ? "bedring" : "forverring", over: Math.abs(diff) >= 2.3 };
}

/* Forrige snitt 0–10 med én desimal, ellers null */
const prevAvg = s => { const x = num(s.prev); return x != null && x >= 0 && x <= 10 ? r1(x) : null; };
const count = n => `${n} ${n === 1 ? "aktivitet" : "aktiviteter"}`;

const row = i => `
    <div class="grid psfs-row"${i > 3 ? ` data-show="psfs-${i}"` : ""}>
      <div class="field"><label class="lbl" for="psfs-a${i}">Aktivitet ${i}</label>
        <div class="inp"><input type="text" id="psfs-a${i}" data-k="a${i}" placeholder="F.eks. gå i trapper" autocomplete="off"></div></div>
      ${inputF(`psfs-s${i}`, `s${i}`, "Skår", "/10", { int: true, ph: "0–10" })}
    </div>`;

export default {
  id: "psfs", name: "PSFS", category: "Generiske", status: "aktiv",
  title: "Pasientspesifikk funksjonsskala (PSFS)", meta: "3–5 aktiviteter · 0 = kan ikke, 10 = som før",
  initState: () => { const s = { prev: "" }; for (let i = 1; i <= PSFS_MAX; i++) { s["a" + i] = ""; s["s" + i] = ""; } return s; },
  form: () => `
    <span class="hint">0 = kan ikke utføre aktiviteten · 10 = kan utføre aktiviteten som før plagene. Beskriv aktiviteten kort, uten personopplysninger.</span>
    ${[1, 2, 3, 4, 5].map(row).join("")}
    <div class="grid">${inputF("psfs-prev", "prev", "Forrige snittskår (valgfritt)", "/10", { ph: "f.eks. 3,7" })}</div>`,
  paint(card, s) {
    const used = i => s["a" + i].trim() !== "" || s["s" + i] !== "";
    for (let i = 4; i <= PSFS_MAX; i++) card.querySelector(`[data-show="psfs-${i}"]`).hidden = !(used(i - 1) || used(i));
  },
  result(s) {
    const P = scorePsfs(s); if (P.avg == null) return null;
    let sub = `${count(P.items.length)} · 0 = kan ikke, 10 = som før`;
    const pv = prevAvg(s);
    if (pv != null) { const c = psfsChange(P.avg, pv); sub += ` · endring ${fs(c.diff)} (${c.over ? "over" : "under"} MCID 2,3)`; }
    return { tone: "none", big: f(P.avg), main: `Snitt ${f(P.avg)} av 10`, sub };
  },
  toText(s) {
    const P = scorePsfs(s); if (P.avg == null) return null;
    const out = [
      `Pasientspesifikk funksjonsskala (PSFS, 0 = kan ikke utføre, 10 = som før plagene): snitt ${f(P.avg)} (${count(P.items.length)}).`,
      `Aktiviteter: ${P.items.map(x => `${x.name} ${x.score}`).join(", ")}.`,
      "Tolkning: Ingen etablert grenseverdi; skåren er pasientspesifikk og brukes til å følge endring."
    ];
    const pv = prevAvg(s);
    if (pv != null) {
      const c = psfsChange(P.avg, pv);
      out.push(`Endring fra forrige: ${f(pv)} → ${f(P.avg)} (${fs(c.diff)} poeng, ${c.dir}; ${c.over ? "over" : "under"} MCID). MCID: 2,3 poeng for middels endring (1,3 liten, 2,7 stor; muskel-skjelettlidelser, Abbott & Schmitt 2014).`);
    }
    return out.join("\n");
  },
  guide: `<ul>
      <li>Pasienten nevner 3–5 viktige aktiviteter som er vanskelige eller umulige å utføre på grunn av plagene, og skårer hver fra 0 (kan ikke utføre) til 10 (kan utføre som før plagene).</li>
      <li>Ved re-test skåres de samme aktivitetene. Les opp aktivitetene fra forrige gang (de står i forrige DIPS-notat).</li>
      <li>Snittskåren er gjennomsnittet av de utfylte aktivitetene.</li>
      <li>Ingen etablert grenseverdi. Skåren er pasientspesifikk og sammenlignes bare med pasientens egne tidligere skårer.</li>
      <li>MCID for snittskår: 1,3 (liten), 2,3 (middels) og 2,7 (stor endring) hos pasienter med muskel-skjelettlidelser i fysioterapi (Abbott & Schmitt 2014). Appen klassifiserer mot 2,3.</li>
      <li>MDC og MCID varierer mellom populasjoner, f.eks. MDC 1,4 og MCID 2,0 ved kronisk korsryggsmerte (Horn 2012).</li>
      <li>Merk: Den norske versjonen (Moseng 2013) bruker motsatt retning (0 = ingen vansker, 10 = kan ikke utføre). Sjekk retningen før du sammenligner med tidligere skårer.</li>
      <li>Skriv ikke navn, steder eller andre personopplysninger i aktivitetsfeltene.</li>
      <li>PSFS © P. Stratford 1995.</li></ul>
    <p class="source">Stratford P, Gill C, Westaway M, Binkley J. Physiother Can 1995;47:258–63. Abbott JH, Schmitt J. JOSPT 2014;44:560–4. Horn KK et al. JOSPT 2012;42:30–42. Moseng T, Tveter AT, Holm I, Dagfinrud H. Fysioterapeuten 2013;(2).</p>`
};
