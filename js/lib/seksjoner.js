/* Felles skåring for ODI og NDI: 10 seksjoner som skåres 0–5.
   Prosent = sum / (5 × besvarte seksjoner) × 100. Rene funksjoner, ingen DOM. */
import { num } from "./format.js";

export const SECTIONS = 10;

/* Seksjon 0–5 som heltall, ellers null */
export const sectionVal = v => { const x = num(v); return Number.isInteger(x) && x >= 0 && x <= 5 ? x : null; };

/* {sum, answered, pct}. pct (heltall) er null når flere enn maxMissing seksjoner mangler, eller ingen er besvart. */
export function sectionScore(values, maxMissing) {
  const v = values.map(sectionVal).filter(x => x != null);
  const sum = v.reduce((a, b) => a + b, 0);
  const ok = v.length > 0 && values.length - v.length <= maxMissing;
  return { sum, answered: v.length, pct: ok ? Math.round(sum / (5 * v.length) * 100) : null };
}

/* Verdiene s.prefix1 … s.prefix10 */
export const sectionValues = (s, prefix) => Array.from({ length: SECTIONS }, (_, i) => s[prefix + (i + 1)]);

/* Forrige skår i prosent: heltall 0–100, ellers null */
export const prevPct = v => { const x = num(v); return Number.isInteger(x) && x >= 0 && x <= 100 ? x : null; };
