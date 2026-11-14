/* Tid for stoppeklokken. Rene funksjoner uten DOM. Tid inn er alltid millisekunder, makstid er sekunder. */
import { f } from "./format.js";

/* Tiden avkortet til makstiden. Uten makstid returneres tiden uendret. Negativ tid blir 0. */
export const capMs = (ms, maxS) => Math.max(0, maxS ? Math.min(ms, maxS * 1000) : ms);

/* Er makstiden nådd? Alltid false uten makstid. */
export const reachedMax = (ms, maxS) => !!maxS && ms >= maxS * 1000;

/* Sekunder med én desimal og desimalkomma, slik tidsfeltene skrives: 14234 → "14,2" */
export const secText = ms => f(Math.round(Math.max(0, ms) / 100) / 10, 1);

/* Lengste av forsøkene (best av flere, f.eks. ettbensstående). Tom liste gir null. */
export const bestMs = attempts => attempts.length ? Math.max(...attempts) : null;
