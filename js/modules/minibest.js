/* Mini-BESTest, norsk versjon (Hamre, Tangen, Botolfsen og Helbostad; godkjent av Horak 2011, revidert 2014).
   Fri til klinisk bruk ifølge bestest.us («no longer under copyright control»). */
import { num, changeText } from "../lib/format.js";
import { inputF, esc } from "../lib/form.js";
import { itemRow } from "../lib/koos-hoos.js";

const C = (n, m, a) => [[2, `Normal: ${n}`], [1, `Moderat: ${m}`], [0, `Alvorlig: ${a}`]];
const SKRITT0 = "Tar ingen skritt ELLER ville falt hvis ikke tatt imot ELLER faller umiddelbart.";

/* 14 oppgaver i fire seksjoner. sides = venstre/høyre skåres hver for seg, laveste side teller. */
export const MB_SECTIONS = [
  { name: "Antisipatorisk stillingsendring", max: 6, items: [1, 2, 3] },
  { name: "Reaktiv postural kontroll", max: 6, items: [4, 5, 6] },
  { name: "Sensorisk orientering", max: 6, items: [7, 8, 9] },
  { name: "Dynamisk gange", max: 10, items: [10, 11, 12, 13, 14] }
];
export const MB_ITEMS = {
  1: { name: "Sittende til stående", instr: "«Legg armene i kors over brystet. Ikke bruk hendene hvis du ikke må. Bena skal ikke berøre stolen når du reiser deg opp. Reis deg opp nå.»",
    opts: C("Reiser seg opp uten å bruke hendene og finner balansen selvstendig.", "Reiser seg opp på første forsøk MED bruk av hendene.", "Kan ikke reise seg opp uten støtte ELLER trenger flere forsøk ved bruk av hendene.") },
  2: { name: "Reise seg opp på tå", instr: "«Plasser føttene dine med skulderbreddes avstand. Sett hendene på hoftene. Prøv å reise deg så høyt opp på tå som du kan. Prøv å holde denne stillingen i minst 3 sek. mens jeg teller høyt. Se rett frem. Reis deg opp på tå nå.» To forsøk, skår det beste.",
    opts: C("Stabil i 3 sek. med full høyde.", "Reiser seg opp på tå, men ikke full høyde (kommer høyere opp hvis pasienten får støtte) ELLER kan stå med lett instabilitet i 3 sek.", "< 3 sek.") },
  3: { name: "Stå på ett ben", sides: true, instr: "«Se rett frem. Hold hendene på hoftene. Bøy det ene kneet med foten bakover. Bena må ikke berøre hverandre. Stå på et ben så lenge du kan. Se rett frem og bøy kneet nå.» To forsøk per side, bruk forsøket med lengst tid. Den dårligste siden teller i delskår og totalskår.",
    opts: C("20 sek.", "< 20 sek.", "Kan ikke.") },
  4: { name: "Kompensatorisk skritt – fremover", instr: "«Stå med skulderbreddes avstand mellom føttene og armene langs siden. Len deg forover mot mine hender og forbi din balansegrense. Når jeg slipper skal du gjøre alt som er nødvendig, inkludert å ta et skritt, for å unngå å falle.» Vær forberedt på å ta imot pasienten.",
    opts: C("Gjenvinner balansen selvstendig med et enkelt, langt skritt (et andre justeringsskritt er tillatt).", "Bruker mer enn ett skritt for å gjenvinne balansen.", SKRITT0) },
  5: { name: "Kompensatorisk skritt – bakover", instr: "«Stå med skulderbreddes avstand mellom føttene og armene langs siden. Len deg bakover mot mine hender og forbi din balansegrense. Når jeg slipper skal du gjøre alt som er nødvendig, inkludert å ta et skritt, for å unngå å falle.» Vær forberedt på å ta imot pasienten.",
    opts: C("Gjenvinner balansen selvstendig med et enkelt, langt skritt.", "Bruker mer enn et skritt for å gjenvinne balansen.", SKRITT0) },
  6: { name: "Kompensatorisk skritt – til siden", sides: true, instr: "«Stå med samlede føtter og armene langs siden. Len deg sideveis mot mine hender og forbi din balansegrense. Når jeg slipper skal du gjøre alt som er nødvendig, inkludert å ta et skritt, for å unngå å falle.» Siden med det laveste resultatet teller i delskår og totalskår.",
    opts: C("Gjenvinner balansen selvstendig med 1 skritt (i kryss eller til siden er OK).", "Bruker flere skritt for å gjenvinne balansen.", "Faller, eller kan ikke ta et skritt.") },
  7: { name: "Samlede føtter, åpne øyne, fast underlag", instr: "«Sett hendene på hoftene. Sett føttene samlet til de nesten berører hverandre. Se rett frem. Stå så stabilt og stille som mulig til jeg sier stopp.» Maks 30 sek.",
    opts: C("30 sek.", "< 30 sek.", "Kan ikke.") },
  8: { name: "Samlede føtter, lukkede øyne, balansepute", instr: "«Gå opp på balanseputen. Sett hendene på hoftene. Sett føttene samlet til de nesten berører hverandre. Stå så stabilt som mulig til jeg sier stopp. Jeg starter tidtakingen når du lukker øynene.» Tempur balansepute, medium tetthet, 10 cm. Maks 30 sek.",
    opts: C("30 sek.", "< 30 sek.", "Kan ikke.") },
  9: { name: "Skråbrett, lukkede øyne", instr: "«Gå opp på skråbrettet. Stå på skråbrettet med tærne oppover. Plasser føttene med en skulderbreddes avstand og armene langs siden. Jeg starter tidtakingen når du lukker øynene.»",
    opts: C("Står selvstendig i 30 sek. og justerer seg i forhold til loddlinjen.", "Står selvstendig < 30 sek. ELLER justerer seg i forhold til underlaget.", "Kan ikke.") },
  10: { name: "Endring i ganghastighet", instr: "«Begynn å gå i ditt normale tempo. Når jeg sier ”fort” går du så fort du kan. Når jeg sier ”sakte”, går du veldig sakte.» 3–5 skritt i hvert tempo.",
    opts: C("Betydelig endring i ganghastighet uten at det påvirker balansen.", "Kan ikke endre ganghastighet eller nedsatt balanse.", "Kan ikke oppnå betydelig endring i ganghastighet OG nedsatt balanse.") },
  11: { name: "Gange med horisontale hodebevegelser", instr: "«Begynn å gå i ditt normale tempo. Når jeg sier ”høyre”, snu på hodet og se mot høyre. Når jeg sier ”venstre”, snu på hodet og se mot venstre. Forsøk å gå i en rett linje.» Skår lavere hvis problem i én retning.",
    opts: C("Utfører hodebevegelsene uten endring i ganghastighet og med god balanse.", "Utfører hodebevegelser med reduksjon i ganghastighet.", "Utfører hodebevegelsene med nedsatt balanse.") },
  12: { name: "Gange med 180 graders vending", instr: "«Begynn å gå i ditt normale tempo. Når jeg sier ”snu og stopp” skal du snu deg så raskt du kan i motsatt retning og stoppe. Etter at du har snudd skal føttene dine være tett samlet.»",
    opts: C("Snur og har føttene samlet, RASKT (≤ 3 skritt) og med god balanse.", "Snur og har føttene samlet, SAKTE (≥ 4 skritt) og med god balanse.", "Kan ikke snu og ha føttene samlet, uansett hastighet, uten at balansen blir nedsatt.") },
  13: { name: "Gå over hindring", instr: "«Begynn å gå i ditt normale tempo. Når du kommer til hindringen, gå over den, ikke rundt den, og fortsett å gå.» Hindring 23 cm høy, 3 m fra start.",
    opts: C("Kan gå over hindring med minimal endring i ganghastighet og med god balanse.", "Går over hindringen men berører ELLER fremviser forsiktig atferd gjennom å redusere ganghastigheten.", "Kan ikke gå over hindringen ELLER går rundt hindringen.") },
  14: { name: "Timed Up & Go med dual task", instr: "TUG: «Når jeg sier ”Gå” reiser du deg fra stolen og går i ditt normale tempo forbi tapen på gulvet, snur, går tilbake til stolen og setter deg ned.» Dual task: pasienten trekker 3 fra et tall mellom 90 og 100 hele veien. Reduseres ganghastigheten mer enn 10 % med dual task, reduseres skåren med ett poeng.",
    opts: C("Ingen tydelig endring mellom sittende, stående eller gående i å telle bakover sammenlignet med TUG uten Dual Task.", "Dual Task påvirker enten tellingen ELLER gangen (>10%) sammenlignet med TUG uten Dual Task.", "Stopper å telle mens de går ELLER stopper å gå mens de teller.") }
};

/* Svar 0–2, ellers null */
const v02 = v => { const x = num(v); return Number.isInteger(x) && x >= 0 && x <= 2 ? x : null; };

/* Skår for én oppgave. For oppgave 3 og 6 teller laveste side, og begge sider må være skåret. */
export function mbItemScore(s, n) {
  if (!MB_ITEMS[n].sides) return v02(s["m" + n]);
  const l = v02(s[`m${n}V`]), r = v02(s[`m${n}H`]);
  return l == null || r == null ? null : Math.min(l, r);
}

/* Skår per oppgave, delskårer og total (null til alle 14 oppgaver er skåret) */
export function scoreMiniBest(s) {
  const items = {};
  for (let n = 1; n <= 14; n++) items[n] = mbItemScore(s, n);
  const done = Object.values(items).filter(x => x != null);
  const sub = MB_SECTIONS.map(sec => { const v = sec.items.map(n => items[n]); return v.every(x => x != null) ? v.reduce((a, b) => a + b, 0) : null; });
  return { items, sub, done: done.length, sum: done.reduce((a, b) => a + b, 0), total: done.length === 14 ? done.reduce((a, b) => a + b, 0) : null };
}

/* Aldersspesifikk fallgrense: økt fallrisk ved skår under grensen (hjemmeboende eldre, Magnani 2020) */
export const MB_CUTOFFS = [[60, 69, 25], [70, 79, 23], [80, 89, 22], [90, 150, 17]];
export function mbFallCutoff(age) {
  if (age == null) return null;
  const c = MB_CUTOFFS.find(([lo, hi]) => age >= lo && age <= hi);
  return c ? { band: c[0] === 90 ? "≥90 år" : `${c[0]}–${c[1]} år`, cut: c[2] } : null;
}
export function interpretMiniBest(total, age) {
  const c = mbFallCutoff(age);
  if (!c) return { tone: "none", risk: null, c };
  const risk = total < c.cut;
  return { tone: risk ? "warn" : "ok", risk, c };
}

const SRC = "hjemmeboende eldre, Magnani 2020";
const sideTxt = (s, n) => `${mbItemScore(s, n)} (V${s[`m${n}V`]}/H${s[`m${n}H`]})`;

export default {
  id: "minibest", name: "Mini-BESTest", category: "Balanse", status: "aktiv",
  title: "Mini-BESTest", meta: "14 oppgaver · 0–28",
  initState: () => {
    const s = { prev: "" };
    for (let n = 1; n <= 14; n++) { if (MB_ITEMS[n].sides) { s[`m${n}V`] = ""; s[`m${n}H`] = ""; } else s["m" + n] = ""; }
    return s;
  },
  form: () => `
    <span class="hint">0 = lavest og 2 = høyest funksjonsnivå. Bruker pasienten hjelpemiddel på en oppgave, skåres den ett poeng lavere. Trenger pasienten fysisk støtte, gis 0. Lave sko eller barbent.</span>
    ${MB_SECTIONS.map(sec => `
    <div class="sub-h">${sec.name} (/${sec.max})</div>
    <div class="kitems">${sec.items.map(n => {
      const it = MB_ITEMS[n];
      const rows = it.sides
        ? itemRow("mb", `${n}V`, `m${n}V`, 2, `${it.name} – venstre`, "", it.opts) + itemRow("mb", `${n}H`, `m${n}H`, 2, `${it.name} – høyre`, "", it.opts)
        : itemRow("mb", String(n), `m${n}`, 2, it.name, "", it.opts);
      return rows + `<details class="instr"><summary>Instruksjon</summary><p>${esc(it.instr)}</p></details>`;
    }).join("")}</div>`).join("")}
    <div class="grid">${inputF("mb-prev", "prev", "Forrige totalskår (valgfritt)", "/28", { int: true })}</div>`,
  result(s, p) {
    const P = scoreMiniBest(s); if (!P.done) return null;
    if (P.total == null) return { tone: "none", big: String(P.sum), main: `${P.done} av 14 oppgaver skåret`, sub: `Foreløpig sum ${P.sum}` };
    const I = interpretMiniBest(P.total, num(p.age));
    const main = I.risk == null ? `${P.total}/28` : I.risk ? "Økt fallrisk" : "Ikke under fallgrensen";
    const sub = `${P.total}/28 · ${MB_SECTIONS.map((sec, i) => `${P.sub[i]}/${sec.max}`).join(" · ")}${I.c ? ` · grense <${I.c.cut} (${I.c.band})` : ""}`;
    return { tone: I.tone, big: String(P.total), main, sub };
  },
  toText(s, p) {
    const P = scoreMiniBest(s); if (P.total == null) return null;
    const short = ["antisipatorisk", "reaktiv", "sensorisk", "dynamisk gange"];
    const out = [`Mini-BESTest: ${P.total}/28 (${MB_SECTIONS.map((sec, i) => `${short[i]} ${P.sub[i]}/${sec.max}`).join(", ")}).`];
    out.push(`Ledd: ${Array.from({ length: 14 }, (_, i) => i + 1).map(n => `${n}:${MB_ITEMS[n].sides ? sideTxt(s, n) : P.items[n]}`).join(", ")}.`);
    const I = interpretMiniBest(P.total, num(p.age));
    if (I.risk == null) out.push(`Tolkning: Ingen fallgrense brukt (aldersspesifikke grenser gjelder ${SRC.replace("eldre", "eldre ≥60 år")}).`);
    else out.push(`Tolkning: ${I.risk ? "Under" : "Ikke under"} grensen for økt fallrisk for ${I.c.band} (<${I.c.cut} poeng; ${SRC}).`);
    const c = changeText(P.total, num(s.prev), { unit: "poeng", d: 0, better: "higher", mcid: 4, mcidLabel: "4 poeng, MDC 3,5 poeng (pasienter med balanseproblemer i rehabilitering, Godi 2013)" });
    if (c) out.push(c);
    return out.join("\n");
  },
  guide: `<ul>
      <li>14 oppgaver skåret 0–2, maks 28 poeng. Fire delskårer: antisipatorisk (1–3), reaktiv (4–6), sensorisk (7–9) og dynamisk gange (10–14).</li>
      <li>Oppgave 3 og 6 skåres for hver side, og den dårligste siden teller. Oppgave 3: bruk det beste av to forsøk per side.</li>
      <li>Hjelpemiddel: ett poeng lavere. Fysisk støtte: 0 poeng. Oppgave 14: reduseres ganghastigheten mer enn 10 % med dual task, ett poeng lavere.</li>
      <li>Utstyr: Tempur balansepute (medium, 10 cm), stol uten armlener og hjul, skråbrett, stoppeklokke, hindring 23 cm og 3 m oppmålt med tape.</li>
      <li>Fallrisiko hos hjemmeboende eldre (fall i 6 mnd): skår under 25 (60–69 år), 23 (70–79 år), 22 (80–89 år) og 17 (≥90 år) (Magnani 2020). Under 60 år brukes ingen grense.</li>
      <li>MCID 4 poeng og MDC95 3,5 poeng hos pasienter med balanseproblemer i rehabilitering (Godi 2013).</li>
      <li>Norsk versjon ved Hamre, Tangen, Botolfsen og Helbostad, godkjent av Fay Horak 2011, revidert 2014. © 2005–2013 Oregon Health &amp; Science University. Fri til klinisk bruk ifølge bestest.us.</li></ul>
    <p class="source">Franchignoni F et al. J Rehabil Med 2010;42:323–31. Magnani PE et al. J Geriatr Phys Ther 2020;43:179–84. Godi M et al. Phys Ther 2013;93:158–67.</p>`
};
