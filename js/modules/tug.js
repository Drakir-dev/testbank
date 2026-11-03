/* Timed Up and Go (TUG) */
import { num, f, aidText, changeText } from "../lib/format.js";
import { inputF, radioF, AIDS } from "../lib/form.js";

export const TUG_NORM = [[60, 69, 8.1], [70, 79, 9.2], [80, 99, 11.3]]; // Bohannon 2006, gjennomsnitt
export const tugNorm = a => a == null ? null : TUG_NORM.find(([lo, hi]) => a >= lo && a <= hi);

/* Grenseverdi ≥13,5 s for økt fallrisk (Shumway-Cook 2000). Gul fra 12 s (CDC STEADI). */
export function interpretTug(t) {
  const risk = t >= 13.5;
  return { risk, tone: risk ? "crit" : t >= 12 ? "warn" : "ok" };
}

export default {
  id: "tug", name: "TUG", category: "Funksjon og gange", status: "aktiv",
  title: "Timed Up and Go (TUG)", meta: "Sekunder · 3 m",
  initState: () => ({ time: "", aid: "ingen", prev: "" }),
  form: () => `
    <div class="grid">
      ${inputF("tug-time", "time", "Tid", "s", { ph: "f.eks. 11,4" })}
      ${inputF("tug-prev", "prev", "Forrige TUG (valgfritt)", "s", { ph: "s" })}
    </div>
    ${radioF("tug-aid", "aid", "Ganghjelpemiddel", AIDS)}`,
  result(s, p) {
    const t = num(s.time); if (t == null) return null;
    const { risk, tone } = interpretTug(t);
    const nm = tugNorm(num(p.age));
    let sub = risk ? "Grenseverdi ≥13,5 s" : "Grenseverdi for økt fallrisk: ≥13,5 s";
    if (nm) sub += ` · snitt ${nm[0]}–${nm[1]} år: ${f(nm[2])} s`;
    return { tone, big: f(t), main: risk ? "Økt fallrisk" : "Under grense for økt fallrisk", sub };
  },
  toText(s, p) {
    const t = num(s.time); if (t == null) return null;
    const out = [`Timed Up and Go (TUG): ${f(t)} s, ${aidText(s.aid)}.`];
    out.push(interpretTug(t).risk
      ? "Tolkning: Over grenseverdi for økt fallrisk hos hjemmeboende eldre (≥13,5 s; Shumway-Cook 2000). TUG alene har begrenset prediktiv verdi for fall og bør sees sammen med andre funn."
      : "Tolkning: Under grenseverdi for økt fallrisk hos hjemmeboende eldre (≥13,5 s; Shumway-Cook 2000).");
    const nm = tugNorm(num(p.age));
    if (nm) out.push(`Referanse ${nm[0]}–${nm[1]} år: gjennomsnitt ${f(nm[2])} s (Bohannon 2006).`);
    const c = changeText(t, num(s.prev), { unit: "s", better: "lower", mcid: 0.8, mcidLabel: "0,8–1,4 s (hofteartrose, Wright 2011)" });
    if (c) out.push(c);
    return out.join("\n");
  },
  guide: `<ul>
      <li>Stol med armlener (ca. 46 cm). Reise seg, gå 3 m i komfortabelt tempo, snu, gå tilbake og sette seg. Tid fra «gå» til ryggen er mot stolryggen.</li>
      <li>Vanlig fottøy og vanlig ganghjelpemiddel. Én prøverunde, deretter målt forsøk.</li>
      <li>Grenseverdi ≥13,5 s for økt fallrisk hos hjemmeboende eldre. CDC STEADI bruker ≥12 s (gul markering i appen fra 12 s).</li>
      <li>Systematisk oversikt viser begrenset evne til å predikere fall alene (Barry 2014).</li>
      <li>MCID 0,8–1,4 s (hofteartrose). MDC ca. 1,6–2,5 s ved hofte-/kneprotese.</li></ul>
    <p class="source">Podsiadlo & Richardson, J Am Geriatr Soc 1991. Shumway-Cook A et al., Phys Ther 2000;80:896–903. Bohannon RW, J Geriatr Phys Ther 2006;29:64–8. Barry E et al., BMC Geriatr 2014;14:14. Wright AA et al., JOSPT 2011;41:319–27.</p>`
};
