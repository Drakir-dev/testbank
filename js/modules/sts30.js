/* 30 sekunders sit-to-stand */
import { num, changeText } from "../lib/format.js";
import { inputF, checkF } from "../lib/form.js";

export const STS_NORM = { // under gjennomsnitt hvis < verdi (Rikli & Jones 1999 / CDC STEADI)
  mann: [[60, 64, 14], [65, 69, 12], [70, 74, 12], [75, 79, 11], [80, 84, 10], [85, 89, 8], [90, 94, 7]],
  kvinne: [[60, 64, 12], [65, 69, 11], [70, 74, 10], [75, 79, 10], [80, 84, 9], [85, 89, 8], [90, 94, 4]]
};
export const stsNorm = p => { const a = num(p.age); if (a == null || !STS_NORM[p.sex]) return null; return STS_NORM[p.sex].find(([lo, hi]) => a >= lo && a <= hi) || null; };

/* Antall reisinger. Måtte pasienten bruke armene, skåres 0. */
export function scoreSts(s) { return s.arms ? 0 : num(s.reps); }

export default {
  id: "sts30", name: "30 s sit-to-stand", category: "Funksjon og gange", status: "aktiv",
  title: "30 sekunders sit-to-stand", meta: "Antall reisinger",
  initState: () => ({ reps: "", arms: false, prev: "" }),
  form: () => `
    <div class="grid">
      ${inputF("sts-reps", "reps", "Antall reisinger", "stk", { int: true, ph: "f.eks. 11" })}
      ${inputF("sts-prev", "prev", "Forrige (valgfritt)", "stk", { int: true })}
    </div>
    ${checkF("sts-arms", "arms", "Måtte bruke armene (skåres 0)")}`,
  result(s, p) {
    const r = scoreSts(s); if (r == null) return null;
    const nm = stsNorm(p);
    if (!nm) return { tone: "none", big: String(r), main: `${r} reisinger`, sub: "Oppgi alder (60–94) og kjønn for normverdi" };
    const below = r < nm[2];
    return { tone: below ? "warn" : "ok", big: String(r), main: below ? "Under gjennomsnitt for alder og kjønn" : "Innenfor gjennomsnitt for alder og kjønn",
      sub: `Grense ${p.sex === "mann" ? "menn" : "kvinner"} ${nm[0]}–${nm[1]} år: <${nm[2]}` };
  },
  toText(s, p) {
    const r = scoreSts(s); if (r == null) return null;
    const out = [`30 s sit-to-stand: ${r} reisinger${s.arms ? " (måtte bruke armene, skåret 0)" : ""}.`];
    const nm = stsNorm(p);
    if (nm) {
      const who = `${p.sex === "mann" ? "menn" : "kvinner"} ${nm[0]}–${nm[1]} år`;
      out.push(r < nm[2]
        ? `Tolkning: Under gjennomsnitt for ${who} (<${nm[2]}), forbundet med økt fallrisk (Rikli & Jones 1999; CDC STEADI).`
        : `Tolkning: Innenfor gjennomsnitt for ${who} (grense <${nm[2]}; Rikli & Jones 1999).`);
    }
    const c = changeText(r, num(s.prev), { unit: "reisinger", d: 0, better: "higher", mcid: 2, mcidLabel: "2 reisinger (hofteartrose, Wright 2011)" });
    if (c) out.push(c);
    return out.join("\n");
  },
  guide: `<ul>
      <li>Stol uten armlener (ca. 43 cm) mot vegg. Armene i kryss over brystet.</li>
      <li>Tell fulle reisinger på 30 s. Mer enn halvveis opp ved slutt teller som én.</li>
      <li>Må pasienten bruke armene for å reise seg: avbryt og skår 0.</li>
      <li>Normverdier finnes for 60–94 år. MCID 2 reisinger (hofteartrose).</li></ul>
    <p class="source">Jones CJ, Rikli RE, Beam WC. Res Q Exerc Sport 1999;70:113–9. Rikli RE & Jones CJ, J Aging Phys Act 1999. CDC STEADI. Wright AA et al., JOSPT 2011;41:319–27.</p>`
};
