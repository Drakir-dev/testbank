/* MoCA (Montreal Cognitive Assessment, © MoCA Test Inc., Nasreddine). Elektroniske versjoner er forbudt og
   testen krever sertifisering, så appen tar bare imot totalskåren fra det sertifiserte papirskjemaet.
   Grense og utdanningstillegg etter Nasreddine 2005. Rene funksjoner, ingen DOM. */
import { num, fs } from "../lib/format.js";
import { inputF, checkF } from "../lib/form.js";

export const MOCA_CUTOFF = 26;

/* Råskår 0–30, +1 ved ≤12 års utdanning, høyst 30 (Nasreddine 2005) */
export function scoreMoca(s) {
  const r = num(s.raw);
  const raw = Number.isInteger(r) && r >= 0 && r <= 30 ? r : null;
  if (raw == null) return { raw: null, bonus: 0, total: null };
  const bonus = s.lowEdu && raw < 30 ? 1 : 0;
  return { raw, bonus, total: raw + bonus };
}

export function interpretMoca(total) {
  return total >= MOCA_CUTOFF
    ? { main: "Innenfor normalområdet", range: "≥26", tone: "ok" }
    : { main: "Under grensen for normal kognisjon", range: "<26", tone: "warn" };
}

const prevTotal = s => { const x = num(s.prev); return Number.isInteger(x) && x >= 0 && x <= 30 ? x : null; };
const NORM_NO = "Norske normer for 70 år og eldre ligger lavere (gjennomsnitt 22–27 etter alder, kjønn og utdanning; Engedal 2022), så skåren tolkes med forsiktighet.";

export default {
  id: "moca", name: "MoCA", category: "Kognisjon", status: "aktiv",
  title: "Montreal Cognitive Assessment (MoCA)", meta: "Totalskår 0–30 · grense 26",
  initState: () => ({ raw: "", lowEdu: false, prev: "" }),
  form: () => `
    <span class="hint">Gjennomføres på det offisielle skjemaet fra mocacognition.com og krever sertifisering. Tast bare inn totalskåren her.</span>
    <div class="grid">${inputF("moca-raw", "raw", "Totalskår fra skjemaet", "/30", { int: true, ph: "0–30", hint: "Uten utdanningstillegg." })}</div>
    ${checkF("moca-edu", "lowEdu", "12 års utdanning eller mindre (+1 poeng)")}
    <div class="grid">${inputF("moca-prev", "prev", "Forrige MoCA (valgfritt)", "/30", { int: true, ph: "0–30" })}</div>`,
  result(s, p) {
    const M = scoreMoca(s); if (M.total == null) return null;
    const I = interpretMoca(M.total);
    let sub = `${M.bonus ? `${M.raw} + 1 for utdanning · ` : ""}grense 26 (Nasreddine 2005)`;
    const pv = prevTotal(s); if (pv != null) sub += ` · endring ${pv} → ${M.total} (${fs(M.total - pv, 0)})`;
    return { tone: I.tone, big: String(M.total), main: I.main, sub };
  },
  toText(s, p) {
    const M = scoreMoca(s); if (M.total == null) return null;
    const I = interpretMoca(M.total);
    const out = [`MoCA: ${M.total} av 30${M.bonus ? ` (${M.raw} + 1 for ≤12 års utdanning)` : ""}.`];
    let t = `Tolkning: ${I.main} (${I.range}; Nasreddine 2005).`;
    const age = num(p && p.age);
    if (M.total < MOCA_CUTOFF && age != null && age >= 70) t += " " + NORM_NO;
    out.push(t);
    const pv = prevTotal(s);
    if (pv != null) {
      const d = M.total - pv;
      out.push(`Endring fra forrige: MoCA ${pv} → ${M.total} (${fs(d, 0)} poeng, ${d > 0 ? "bedring" : d < 0 ? "forverring" : "uendret"}). Ingen etablert MCID for MoCA.`);
    }
    return out.join("\n");
  },
  guide: `<ul>
      <li>Kognitiv screening for mild kognitiv svikt, ca. 10 minutter. Opplæring og sertifisering kreves (gratis for ansatte i offentlig helsetjeneste), og skjema og instruksjon hentes bare fra mocacognition.com. Elektroniske versjoner er ikke tillatt, så appen tar bare imot totalskåren.</li>
      <li>Utdanningstillegg: +1 poeng ved 12 års utdanning eller mindre, høyst 30 (Nasreddine 2005).</li>
      <li>Grense: 26 eller mer regnes som normalt (Nasreddine 2005).</li>
      <li>Norske normer (HUNT, 4780 kognitivt friske personer 70 år og eldre): gjennomsnittet varierer fra 22 til 27 etter alder, kjønn og utdanning (Engedal 2022). Grensen 26 gir derfor mange falskt positive hos eldre med kort utdanning. Normtabellen er ikke lagt inn i appen ennå (TODO).</li>
      <li>MoCA er ikke diagnostisk. Ingen etablert MCID. Endring rapporteres i poeng.</li></ul>
    <p class="source">MoCA © MoCA Test Inc. (Ziad Nasreddine), mocacognition.com. Nasreddine ZS, Phillips NA, Bédirian V et al. J Am Geriatr Soc 2005;53:695–9. Engedal K, Gjøra L, Benth JŠ, Wagle J, Rønqvist TK, Selbæk G. J Alzheimers Dis 2022;86:589–99.</p>`
};
