/* 4AT: screening for delirium og kognitiv svikt, norsk versjon 1.2.
   © 2011–2014 MacLullich, Ryan og Cash, CC BY 4.0 (the4AT.com). Teksten ligger i js/data/ledd-tekst.js.
   Skåring og grenser etter skjemaet (v1.2) og Bellelli 2014. Rene funksjoner, ingen DOM. */
import { num, fs } from "../lib/format.js";
import { inputF, esc } from "../lib/form.js";
import { itemEntry } from "../lib/koos-hoos.js";
import { FOURAT_TEXT } from "../data/ledd-tekst.js";

/* Poeng per svaralternativ i skjemaets rekkefølge. Ledd 1 har to alternativer som gir 0 poeng,
   så feltet lagrer valgt alternativ (0, 1, 2 …) og poengene slås opp her. */
export const FOURAT_ITEMS = [
  { code: "1", k: "a1", label: "årvåkenhet", points: [0, 0, 4] },
  { code: "2", k: "a2", label: "AMT4", points: [0, 1, 2] },
  { code: "3", k: "a3", label: "oppmerksomhet", points: [0, 1, 2] },
  { code: "4", k: "a4", label: "akutt endring", points: [0, 4] }
];

/* Poeng for ett ledd ut fra valgt alternativ, ellers null */
export function fouratPoints(item, v) {
  const i = num(v);
  return Number.isInteger(i) && i >= 0 && i < item.points.length ? item.points[i] : null;
}

/* Totalskår 0–12. Alle fire ledd må være besvart. */
export function score4at(s) {
  const p = FOURAT_ITEMS.map(it => fouratPoints(it, s[it.k]));
  const answered = p.filter(x => x != null).length;
  return { total: answered === 4 ? p.reduce((a, b) => a + b, 0) : null, points: p, answered };
}

/* Tolkning etter 4AT v1.2 (≥4 også Bellelli 2014) */
export function interpret4at(total) {
  if (total >= 4) return { main: "Mulig delirium og/eller kognitiv svikt", range: "≥4", src: "4AT v1.2, Bellelli 2014", tone: "crit" };
  if (total >= 1) return { main: "Mulig kognitiv svikt", range: "1–3", src: "4AT v1.2", tone: "warn" };
  return { main: "Delirium eller alvorlig kognitiv svikt usannsynlig", range: "0", src: "4AT v1.2", tone: "ok" };
}

const prevTotal = s => { const x = num(s.prev); return Number.isInteger(x) && x >= 0 && x <= 12 ? x : null; };

function row(it) {
  const e = itemEntry(FOURAT_TEXT, it.code);
  const opts = it.points.map((p, i) => [i, p, (e.opts || [])[i] || ""]);
  const radio = ([i, p, t]) => `<label><input type="radio" name="q4at-${it.code}" id="q4at-${it.code}-${i}" data-k="${it.k}" value="${i}"><span><b>${p}</b> ${esc(t)}</span></label>`;
  return `
      <div class="kitem" role="radiogroup" aria-label="${it.code}: ${esc(e.q || it.label)}"><span class="ktext"><b class="kno">[${it.code}]</b> ${esc(e.q || it.label)}</span>
        ${e.help ? `<span class="hint khelp">${esc(e.help)}</span>` : ""}
        <div class="scores opts">${opts.map(radio).join("")}</div></div>`;
}

export default {
  id: "4at", name: "4AT", category: "Kognisjon", status: "aktiv",
  title: "4AT – screening for delirium og kognitiv svikt", meta: "Norsk versjon 1.2 · 4 ledd · 0–12",
  initState: () => ({ a1: "", a2: "", a3: "", a4: "", prev: "" }),
  form: () => `
    <div class="kitems">${FOURAT_ITEMS.map(row).join("")}</div>
    <div class="grid">${inputF("q4at-prev", "prev", "Forrige 4AT (valgfritt)", "/12", { int: true, ph: "0–12" })}</div>`,
  result(s) {
    const P = score4at(s); if (!P.answered) return null;
    if (P.total == null) return { tone: "none", big: "…", main: `${P.answered} av 4 ledd besvart`, sub: "Alle 4 ledd må være besvart" };
    const I = interpret4at(P.total);
    let sub = `4AT ${I.range} · ≥4 mulig delirium, 1–3 mulig kognitiv svikt · ikke diagnostisk`;
    const pv = prevTotal(s); if (pv != null) sub += ` · endring ${pv} → ${P.total} (${fs(P.total - pv, 0)})`;
    return { tone: I.tone, big: String(P.total), main: I.main, sub };
  },
  toText(s) {
    const P = score4at(s); if (P.total == null) return null;
    const I = interpret4at(P.total);
    const parts = FOURAT_ITEMS.map((it, i) => `${it.label} ${P.points[i]}`).join(", ");
    let tolk = `Tolkning: ${I.main} (${I.range}; ${I.src}).`;
    if (P.total === 0) tolk += " Delirium er fortsatt mulig hvis informasjonen om akutt endring er ufullstendig.";
    const out = [`4AT: ${P.total} av 12 (${parts}).`, tolk + " Ikke diagnostisk."];
    const pv = prevTotal(s);
    if (pv != null) {
      const d = P.total - pv;
      out.push(`Endring fra forrige: 4AT ${pv} → ${P.total} (${fs(d, 0)} poeng, ${d < 0 ? "bedring" : d > 0 ? "forverring" : "uendret"}). Ingen etablert MCID for 4AT.`);
    }
    return out.join("\n");
  },
  guide: `<ul>
      <li>Rask screening for delirium og kognitiv svikt, 1–2 minutter. Krever ingen spesiell opplæring.</li>
      <li>Punkt 1–3 skåres bare ut fra observasjon ved undersøkelsen. Punkt 4 krever informasjon fra en eller flere kilder: egen kjennskap til pasienten, annet personell, fastlege, journal eller pårørende.</li>
      <li>Årvåkenhet: tydelig endret årvåkenhet ved undersøkelsen gir 4 poeng og er sannsynligvis delirium i en generell sykehussetting. AMT4 kan overføres fra AMT10 hvis den er gjort rett før.</li>
      <li>Tolkning (4AT v1.2): ≥4 mulig delirium og/eller kognitiv svikt. 1–3 mulig kognitiv svikt. 0: delirium eller alvorlig kognitiv svikt er usannsynlig, men delirium er fortsatt mulig hvis informasjonen under punkt 4 er ufullstendig. Skåren er ikke diagnostisk.</li>
      <li>Validering: ved ≥4 sensitivitet 89,7 % og spesifisitet 84,1 % for delirium (Bellelli 2014). I norsk rutinepraksis på geriatrisk sengepost: sensitivitet 0,72 og spesifisitet 0,84 (Evensen 2021).</li>
      <li>Ta hensyn til hørselsnedsettelse, dysfasi og språk når testen gjøres og tolkes.</li>
      <li>Screeningverktøy uten etablert MCID. Endring rapporteres i poeng.</li></ul>
    <p class="source">4AT © 2011–2014 Alasdair MacLullich, Tracy Ryan og Helen Cash. Norsk versjon 1.2, gjengitt ordrett fra the4AT.com under lisensen CC BY 4.0 (creativecommons.org/licenses/by/4.0). Skjemaet er satt opp for skjerm, men ordlyd, poeng og grenser er uendret. Utviklerne har ikke godkjent eller anbefalt denne appen. Ingen garanti for nøyaktighet eller egnethet. Bellelli G, Morandi A, Davis DHJ et al. Age Ageing 2014;43:496–502. Evensen S, Hylen Ranhoff A, Lydersen S, Saltvedt I. Eur Geriatr Med 2021;12:793–800.</p>`
};
