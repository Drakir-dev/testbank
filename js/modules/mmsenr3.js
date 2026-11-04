/* MMSE-NR3 (Norsk revidert Mini Mental Status Evaluering, Strobel & Engedal, Nasjonalt senter for aldring og helse).
   Bare totalskår, ingen spørsmålstekst. Norsk norm etter Engedal 2023, med formelen fra MMSE-NR3-kalkulatoren til
   Aldring og helse. Rene funksjoner, ingen DOM. */
import { num, f, fs } from "../lib/format.js";
import { inputF, radioF } from "../lib/form.js";

/* Regresjon for forventet skår (Engedal 2023, MMSE-NR3-kalkulatoren til Aldring og helse).
   TODO (Rikard): bekreft koeffisientene mot artikkelen før merge. */
export const MMSE_NORM = {
  a: 24.32693, b: 0.1585885, c: -0.0014008, sd: 2.4769, minAge: 49, maxAge: 89,
  edu: { grunnskole: -1.893211, videregaende: -0.7149681, hoyere: 0 }
};
export const EDU_LABEL = { grunnskole: "grunnskole", videregaende: "videregående skole", hoyere: "høyere utdanning" };

/* Normgrunnlaget gjelder 49–89 år; utenfor brukes nærmeste alder, som i kalkulatoren */
export const normAge = age => Math.min(MMSE_NORM.maxAge, Math.max(MMSE_NORM.minAge, Math.round(age)));

export function mmseExpected(age, edu) {
  const A = normAge(age), N = MMSE_NORM;
  return N.a + N.b * A + N.c * A * A + N.edu[edu];
}

export const mmseZ = (score, age, edu) => (score - mmseExpected(age, edu)) / MMSE_NORM.sd;

/* Standard normalfordeling (Abramowitz & Stegun 26.2.17), samme tilnærming som kalkulatoren */
export function normalCdf(z) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}

/* SD-bånd som i kalkulatoren: −1, −1,5 og −2 SD */
export function mmseBand(z) {
  if (z >= 0) return { band: "på eller over normen", tone: "ok" };
  if (z >= -1) return { band: "innenfor 1 SD under normen", tone: "ok" };
  if (z >= -1.5) return { band: "mellom 1 og 1,5 SD under normen", tone: "warn" };
  if (z >= -2) return { band: "mellom 1,5 og 2 SD under normen", tone: "crit" };
  return { band: "mer enn 2 SD under normen", tone: "crit" };
}

export const percentileText = z => {
  const p = Math.round(normalCdf(z) * 100);
  return p < 1 ? "under 1. persentil" : p > 99 ? "over 99. persentil" : `${p}. persentil`;
};

const score0to30 = v => { const x = num(v); return Number.isInteger(x) && x >= 0 && x <= 30 ? x : null; };

/* Alt som trengs for tolkning mot norm, eller null når alder eller utdanning mangler */
export function mmseNorm(score, age, edu) {
  if (score == null || age == null || !(edu in MMSE_NORM.edu)) return null;
  const z = mmseZ(score, age, edu);
  return { expected: mmseExpected(age, edu), z, ...mmseBand(z), pct: percentileText(z), clamped: normAge(age) !== Math.round(age) ? normAge(age) : null };
}

const ageOf = p => { const a = num(p && p.age); return a != null && a > 0 && a < 120 ? a : null; };

export default {
  id: "mmsenr3", name: "MMSE-NR3", category: "Kognisjon", status: "aktiv",
  title: "MMSE-NR3 – Norsk revidert Mini Mental Status Evaluering", meta: "Totalskår 0–30 · norske normer for alder og utdanning",
  initState: () => ({ score: "", edu: "", prev: "" }),
  form: () => `
    <span class="hint">Tast inn totalskåren fra MMSE-NR3-skjemaet (Aldring og helse). Alder hentes fra profilen øverst.</span>
    <div class="grid">${inputF("mmsenr3-score", "score", "Totalskår", "/30", { int: true, ph: "0–30" })}</div>
    ${radioF("mmsenr3-edu", "edu", "Høyeste fullførte utdanning", [["grunnskole", "Grunnskole"], ["videregaende", "Videregående"], ["hoyere", "Høyere utdanning"]])}
    <div class="grid">${inputF("mmsenr3-prev", "prev", "Forrige MMSE-NR3 (valgfritt)", "/30", { int: true, ph: "0–30" })}</div>`,
  result(s, p) {
    const sc = score0to30(s.score); if (sc == null) return null;
    const N = mmseNorm(sc, ageOf(p), s.edu);
    if (!N) return { tone: "none", big: String(sc), main: `MMSE-NR3 ${sc} av 30`, sub: "Oppgi alder i profilen og utdanning for sammenligning med norske normer" };
    let sub = `Forventet ${f(N.expected, 1)} · z ${fs(N.z, 2)} · ${N.pct}`;
    if (N.clamped) sub += ` · norm for ${N.clamped} år brukt`;
    const pv = score0to30(s.prev); if (pv != null) sub += ` · endring ${pv} → ${sc} (${fs(sc - pv, 0)})`;
    return { tone: N.tone, big: String(sc), main: `${N.band[0].toUpperCase()}${N.band.slice(1)}`, sub };
  },
  toText(s, p) {
    const sc = score0to30(s.score); if (sc == null) return null;
    const age = ageOf(p), N = mmseNorm(sc, age, s.edu);
    const out = [`MMSE-NR3: ${sc} av 30.`];
    if (N) {
      let t = `Tolkning: Forventet skår for ${Math.round(age)} år med ${EDU_LABEL[s.edu]} er ${f(N.expected, 1)} (norske normer, Engedal 2023). z = ${fs(N.z, 2)} (${N.pct}), ${N.band}.`;
      if (N.clamped) t += ` Alderen er utenfor normgrunnlaget (49–89 år), så normen for ${N.clamped} år er brukt.`;
      out.push(t);
    } else {
      out.push(`Tolkning: Ikke sammenlignet med norske normer fordi ${age == null && !(s.edu in MMSE_NORM.edu) ? "alder og utdanning" : age == null ? "alder" : "utdanning"} ikke er oppgitt.`);
    }
    const pv = score0to30(s.prev);
    if (pv != null) {
      const d = sc - pv;
      out.push(`Endring fra forrige: MMSE-NR3 ${pv} → ${sc} (${fs(d, 0)} poeng, ${d > 0 ? "bedring" : d < 0 ? "forverring" : "uendret"}). Ingen etablert MCID for MMSE-NR3.`);
    }
    return out.join("\n");
  },
  guide: `<ul>
      <li>Kognitiv screening ved mistanke om demens, ca. 10–15 minutter. Følg manualen fra Aldring og helse (Strobel & Engedal), og bruk skjemaet og pekearket derfra. Bare for opplært helsepersonell.</li>
      <li>Skåren påvirkes mest av utdanning, og deretter av alder. Appen sammenligner derfor med norske normer i stedet for en fast grense: forventet skår for alder og utdanning, z-skår og persentil, med samme formel som MMSE-NR3-kalkulatoren til Aldring og helse (Engedal 2023). Normgrunnlaget er 1050 kognitivt friske personer (NorKog og HUNT), og normal skår varierer fra 25 til 29.</li>
      <li>Utdanning: grunnskole, videregående eller høyere utdanning. Normen gjelder 49–89 år. Utenfor dette brukes nærmeste alder.</li>
      <li>SD-bånd som i kalkulatoren: innenfor 1 SD, 1–1,5 SD, 1,5–2 SD og mer enn 2 SD under normen. Normene er et hjelpemiddel og gir ikke diagnose.</li>
      <li>Skal alltid omtales som MMSE-NR3, og resultatene skal ikke sidestilles med PARs MMSE (Aldring og helse). Ingen etablert MCID for MMSE-NR3. Endring rapporteres i poeng.</li></ul>
    <p class="source">MMSE-NR3 © Nasjonalt senter for aldring og helse (Strobel C, Engedal K. Norsk revidert Mini Mental Status Evaluering (MMSE-NR3), 2021). Aldring og helse regner MMSE-NR3 som et uavhengig verk, og brukeren har selv ansvar for å avklare rettigheter (aldringoghelse.no). Engedal K, Šaltytė Benth J, Gjøra L, Skjellegrind HK, Nåvik M, Selbæk G. J Alzheimers Dis 2023;92:831–42.</p>`
};
