/* Flyt i lange skjemaer: finn neste ubesvarte ledd og ledd som er hoppet over. Rene funksjoner, ingen DOM.
   answered er en liste med true/false per ledd, i skjemaets rekkefølge. */

/* Første ubesvarte ledd etter indeks from. Finnes ingen etter, startes det fra begynnelsen. -1 når alt er besvart. */
export function nextUnanswered(answered, from = -1) {
  for (let i = from + 1; i < answered.length; i++) if (!answered[i]) return i;
  for (let i = 0; i <= Math.min(from, answered.length - 1); i++) if (!answered[i]) return i;
  return -1;
}

/* Ubesvarte ledd som ligger før det siste besvarte, altså hoppet over */
export function skipped(answered) {
  const last = answered.lastIndexOf(true);
  return answered.map((a, i) => !a && i < last);
}
