/* Tid for stoppeklokken og nedtellingen. Rene funksjoner uten DOM. Tid inn er alltid millisekunder, makstid og
   nedtellingstid er sekunder. */
import { f } from "./format.js";

/* Tiden avkortet til makstiden. Uten makstid returneres tiden uendret. Negativ tid blir 0. */
export const capMs = (ms, maxS) => Math.max(0, maxS ? Math.min(ms, maxS * 1000) : ms);

/* Er makstiden nådd? Alltid false uten makstid. */
export const reachedMax = (ms, maxS) => !!maxS && ms >= maxS * 1000;

/* Sekunder med én desimal og desimalkomma, slik tidsfeltene skrives: 14234 → "14,2" */
export const secText = ms => f(Math.round(Math.max(0, ms) / 100) / 10, 1);

/* Lengste av forsøkene (best av flere, f.eks. ettbensstående). Tom liste gir null. */
export const bestMs = attempts => attempts.length ? Math.max(...attempts) : null;

/* ---------- Nedtelling ---------- */

/* Gjenstående tid av en nedtelling på totalS sekunder. Aldri under 0. */
export const remainingMs = (totalS, elapsedMs) => Math.max(0, totalS * 1000 - Math.max(0, elapsedMs));

const mmss = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/* Gjenstående tid som m:ss. Runder opp til helt sekund, så 0:00 først vises når tiden er ute. */
export const countdownText = ms => mmss(Math.ceil(Math.max(0, ms) / 1000));

/* Medgått tid som m:ss, rundet ned (f.eks. når en gangtest avsluttes før tiden) */
export const clockText = ms => mmss(Math.floor(Math.max(0, ms) / 1000));

/* Gangdistanse i hele meter: hele lengder × banelengde + restmeter fra siste påbegynte lengde.
   Tomme restmeter regnes som 0. null hvis banelengden ikke er et positivt tall, eller restmeter er
   negativ eller lengre enn banen. */
export function walkDistance(lengths, laneM, restM) {
  const rest = restM == null ? 0 : restM;
  if (!Number.isInteger(lengths) || lengths < 0) return null;
  if (!Number.isFinite(laneM) || laneM <= 0) return null;
  if (!Number.isFinite(rest) || rest < 0 || rest > laneM) return null;
  return Math.round(lengths * laneM + rest);
}

/* Flertall for tellerne: plural(1, "reising", "reisinger") → "1 reising" */
export const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
