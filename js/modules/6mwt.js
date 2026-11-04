/* 6-minutters gangtest (6MWT), protokoll etter ATS 2002 */
import { num, f, aidText, changeText } from "../lib/format.js";
import { inputF, radioF, AIDS } from "../lib/form.js";

/* Tall innenfor [lo, hi], ellers null. int krever heltall. */
const inRange = (v, lo, hi, int = false) => { const x = num(v); return x != null && x >= lo && x <= hi && (!int || Number.isInteger(x)) ? x : null; };

/* Leser og validerer alle feltene */
export function read6mwt(s) {
  return {
    dist: inRange(s.dist, 0, 1000), prev: inRange(s.prev, 0, 1000), stops: inRange(s.stops, 0, 50, true),
    dysp: inRange(s.dysp, 0, 10), fat: inRange(s.fat, 0, 10),
    hr0: inRange(s.hr0, 30, 250, true), hr1: inRange(s.hr1, 30, 250, true),
    sp0: inRange(s.sp0, 50, 100, true), sp1: inRange(s.sp1, 50, 100, true)
  };
}

const stopsText = n => n == null ? "" : n === 0 ? ", uten pauser" : n === 1 ? ", 1 pause" : `, ${n} pauser`;
const g = x => f(x, Number.isInteger(x) ? 0 : 1);
/* Start/slutt-verdi: «Puls 78 → 112 /min», eller bare den som er oppgitt */
const pair = (label, a, b, unit) => a != null && b != null ? `${label} ${a} → ${b} ${unit}` : a != null ? `${label} ved start ${a} ${unit}` : b != null ? `${label} ved slutt ${b} ${unit}` : null;

/* Linje med Borg, puls og SpO₂, eller null */
export function extras6mwt(v) {
  const parts = [];
  const borg = [v.dysp != null && `dyspné ${g(v.dysp)}`, v.fat != null && `slitenhet ${g(v.fat)}`].filter(Boolean);
  if (borg.length) parts.push(`Borg CR10 ved slutt: ${borg.join(", ")}.`);
  const hr = pair("Puls", v.hr0, v.hr1, "/min"), sp = pair("SpO₂", v.sp0, v.sp1, "%");
  if (hr) parts.push(hr + ".");
  if (sp) parts.push(sp + ".");
  return parts.length ? parts.join(" ") : null;
}

const MCID = { unit: "m", d: 0, better: "higher", mcid: 20, big: 50, mcidLabel: "20 m (liten) og 50 m (betydelig endring; eldre og personer etter hjerneslag, Perera 2006)" };

export default {
  id: "6mwt", name: "6-minutters gangtest", category: "Funksjon og gange", status: "aktiv",
  title: "6-minutters gangtest (6MWT)", meta: "Distanse m · ATS 2002",
  initState: () => ({ dist: "", aid: "ingen", stops: "", dysp: "", fat: "", hr0: "", hr1: "", sp0: "", sp1: "", prev: "" }),
  form: () => `
    <div class="grid">
      ${inputF("w6-dist", "dist", "Distanse", "m", { int: true, ph: "f.eks. 340" })}
      ${inputF("w6-prev", "prev", "Forrige distanse (valgfritt)", "m", { int: true })}
    </div>
    ${radioF("w6-aid", "aid", "Ganghjelpemiddel", AIDS)}
    <div class="grid">
      ${inputF("w6-stops", "stops", "Antall pauser", "", { int: true, ph: "0" })}
      ${inputF("w6-dysp", "dysp", "Borg dyspné ved slutt", "/10", { ph: "0–10" })}
      ${inputF("w6-fat", "fat", "Borg slitenhet ved slutt", "/10", { ph: "0–10" })}
    </div>
    <div class="sub-h">Puls og SpO₂ (valgfritt)</div>
    <div class="grid">
      ${inputF("w6-hr0", "hr0", "Puls start", "/min", { int: true })}
      ${inputF("w6-hr1", "hr1", "Puls slutt", "/min", { int: true })}
      ${inputF("w6-sp0", "sp0", "SpO₂ start", "%", { int: true })}
      ${inputF("w6-sp1", "sp1", "SpO₂ slutt", "%", { int: true })}
    </div>`,
  result(s) {
    const v = read6mwt(s); if (v.dist == null) return null;
    let sub = `${aidText(s.aid)}${stopsText(v.stops)}`;
    if (v.prev != null) { const d = v.dist - v.prev; sub += ` · endring ${d > 0 ? "+" : d < 0 ? "−" : "±"}${f(Math.abs(d), 0)} m`; }
    return { tone: "none", big: f(v.dist, 0), main: `${f(v.dist, 0)} m på 6 minutter`, sub };
  },
  toText(s) {
    const v = read6mwt(s); if (v.dist == null) return null;
    const out = [`6-minutters gangtest: ${f(v.dist, 0)} m, ${aidText(s.aid)}${stopsText(v.stops)}.`];
    const ex = extras6mwt(v); if (ex) out.push(ex);
    out.push("Tolkning: Ingen normverdier brukt; sammenlignes med pasientens tidligere målinger.");
    const c = changeText(v.dist, v.prev, MCID); if (c) out.push(c);
    return out.join("\n");
  },
  guide: `<ul>
      <li>Flat, rett korridor på 30 m med markering hver 3. m og kjegler i hver ende. Pasienten går frem og tilbake så langt som mulig på 6 minutter.</li>
      <li>Standardisert instruksjon og oppmuntring hvert minutt, uten å gå sammen med pasienten. Pasienten kan stoppe og hvile stående, men klokken går.</li>
      <li>Registrer Borg (dyspné og slitenhet) før og etter, gjerne puls og SpO₂, og antall pauser. Bruk samme ganghjelpemiddel ved re-test.</li>
      <li>Avbryt ved brystsmerter, uttalt dyspné, kramper i bena, ustøhet, svetting eller blekhet.</li>
      <li>MCID: ca. 20 m for liten meningsfull og ca. 50 m for betydelig endring hos eldre og personer etter hjerneslag (Perera 2006).</li>
      <li>Ingen normverdier i appen.</li></ul>
    <p class="source">ATS Committee on Proficiency Standards for Clinical Pulmonary Function Laboratories. Am J Respir Crit Care Med 2002;166:111–7. Perera S et al. J Am Geriatr Soc 2006;54:743–9.</p>`
};
