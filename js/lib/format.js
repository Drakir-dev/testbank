/* Tall og tekst: desimalkomma, fortegn og endring mot forrige måling. Rene funksjoner. */

/* Leser tall fra et felt. Godtar både komma og punktum. Tomt eller ugyldig gir null. */
export const num = v => { if (v == null || v === "") return null; const x = parseFloat(String(v).replace(",", ".")); return Number.isFinite(x) ? x : null; };

/* Tall med d desimaler og desimalkomma */
export const f = (x, d = 1) => x.toFixed(d).replace(".", ",");

/* Tall med fortegn (+, −, ±) */
export const fs = (x, d = 1) => (x > 0 ? "+" : x < 0 ? "−" : "±") + f(Math.abs(x), d);

export const aidText = a => a === "ingen" ? "uten ganghjelpemiddel" : `med ${a}`;

/* Endring mot forrige måling, med MCID */
export function changeText(cur, prev, { unit, d = 1, better, mcid, mcidLabel, big }) {
  if (prev == null || cur == null) return null;
  const diff = cur - prev;
  const improved = better === "lower" ? diff < 0 : diff > 0;
  const dir = diff === 0 ? "uendret" : improved ? "bedring" : "forverring";
  let cls;
  if (big != null && Math.abs(diff) >= big) cls = "betydelig endring";
  else if (Math.abs(diff) >= mcid) cls = "over MCID";
  else cls = "under MCID";
  return `Endring fra forrige: ${f(prev, d)} → ${f(cur, d)} ${unit} (${fs(diff, d)} ${unit}, ${dir}; ${cls}). MCID: ${mcidLabel}.`;
}
