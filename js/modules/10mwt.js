/* 10 meter gangtest */
import { num, f, aidText, changeText } from "../lib/format.js";
import { inputF, radioF, AIDS } from "../lib/form.js";

/* Ganghastighet i m/s: målt strekning delt på tid */
export function gaitSpeed(s) { const t = num(s.time), d = num(s.dist); return t && d ? d / t : null; }

/* Grenseverdier gjelder bare selvvalgt tempo: ≤0,8 m/s (EWGSOP2), <1,0 m/s redusert (Studenski 2011) */
export function interpretGait(v, pace) {
  if (pace !== "selvvalgt") return { tone: "none", band: "maks" };
  if (v <= 0.8) return { tone: "crit", band: "nedsatt" };
  if (v < 1.0) return { tone: "warn", band: "redusert" };
  return { tone: "ok", band: "god" };
}

export default {
  id: "10mwt", name: "10 m gangtest", category: "Funksjon og gange", status: "aktiv",
  title: "10 meter gangtest", meta: "Ganghastighet m/s",
  initState: () => ({ time: "", dist: "6", pace: "selvvalgt", aid: "ingen", prev: "" }),
  form: () => `
    <div class="grid">
      ${inputF("gait-time", "time", "Tid", "s", { ph: "f.eks. 5,8" })}
      ${inputF("gait-dist", "dist", "Målt strekning", "m", { hint: "Standard: midtre 6 m av 10 m." })}
      ${inputF("gait-prev", "prev", "Forrige hastighet (valgfritt)", "m/s")}
    </div>
    ${radioF("gait-pace", "pace", "Tempo", [["selvvalgt", "Selvvalgt"], ["maksimalt", "Maksimalt"]])}
    ${radioF("gait-aid", "aid", "Ganghjelpemiddel", AIDS)}`,
  result(s) {
    const v = gaitSpeed(s); if (v == null) return null;
    const { tone, band } = interpretGait(v, s.pace);
    if (band === "maks") return { tone, big: f(v, 2), main: `${f(v, 2)} m/s maksimal hastighet`, sub: "Grenseverdier gjelder selvvalgt tempo" };
    if (band === "nedsatt") return { tone, big: f(v, 2), main: "Nedsatt fysisk funksjon", sub: "≤0,8 m/s (EWGSOP2)" };
    if (band === "redusert") return { tone, big: f(v, 2), main: "Redusert ganghastighet", sub: "0,8–1,0 m/s" };
    return { tone, big: f(v, 2), main: "Ganghastighet ≥1,0 m/s", sub: "Forbundet med god prognose hos eldre" };
  },
  toText(s) {
    const v = gaitSpeed(s); if (v == null) return null;
    const out = [`10 m gangtest (${s.pace} tempo, ${aidText(s.aid)}): ${f(num(s.time), 2)} s over ${f(num(s.dist), 0)} m = ${f(v, 2)} m/s.`];
    const { band } = interpretGait(v, s.pace);
    if (band === "nedsatt") out.push("Tolkning: ≤0,8 m/s indikerer nedsatt fysisk funksjon (EWGSOP2, Cruz-Jentoft 2019).");
    else if (band === "redusert") out.push("Tolkning: Redusert ganghastighet (0,8–1,0 m/s). ≥1,0 m/s er forbundet med bedre prognose hos eldre (Studenski 2011).");
    else if (band === "god") out.push("Tolkning: ≥1,0 m/s, forbundet med bedre prognose hos eldre (Studenski 2011).");
    const c = changeText(v, num(s.prev), { unit: "m/s", d: 2, better: "higher", mcid: 0.05, big: 0.10, mcidLabel: "liten meningsfull endring 0,05 m/s, betydelig 0,10 m/s (Perera 2006)" });
    if (c) out.push(c);
    return out.join("\n");
  },
  guide: `<ul>
      <li>10 m strekning med 2 m akselerasjon og 2 m retardasjon. Tid tas over de midtre 6 m.</li>
      <li>Selvvalgt tempo: «gå i vanlig tempo». Eventuelt snitt av flere forsøk.</li>
      <li>≤0,8 m/s er kriterium for nedsatt fysisk funksjon ved sarkopeni (EWGSOP2).</li>
      <li>Meningsfull endring hos eldre: 0,05 m/s (liten) og 0,10 m/s (betydelig).</li></ul>
    <p class="source">Perera S et al., J Am Geriatr Soc 2006;54:743–9. Cruz-Jentoft AJ et al., Age Ageing 2019;48:16–31. Studenski S et al., JAMA 2011;305:50–8.</p>`
};
