/* Hip disability and Osteoarthritis Outcome Score (HOOS), ledd for ledd uten spørsmålstekst */
import { makeModule } from "../lib/koos-hoos.js";

/* Delskårer i skjemaets rekkefølge (Nilsdotter 2003) */
export const HOOS_DEF = {
  id: "hoos", name: "HOOS",
  title: "Hip disability and Osteoarthritis Outcome Score (HOOS)", meta: "40 ledd · 5 delskårer 0–100",
  subscales: [
    { key: "S", n: 5, label: "symptomer", head: "Symptomer og stivhet" },
    { key: "P", n: 10, label: "smerte", head: "Smerte" },
    { key: "A", n: 17, label: "ADL", head: "Dagliglivets aktiviteter (ADL)" },
    { key: "SP", n: 4, label: "sport/fritid", head: "Sport og fritid" },
    { key: "Q", n: 4, label: "livskvalitet", head: "Hofterelatert livskvalitet" }
  ],
  textOrder: ["P", "S", "A", "SP", "Q"],
  mcid: { P: 24, Q: 17 },   // Paulsen 2014, 1 år etter hofteprotese
  interpretation: "Tolkning: Delskårene tolkes hver for seg; ingen etablert grenseverdi.",
  mcidNote: "MCID for smerte (24) og livskvalitet (17) gjelder 1 år etter hofteprotese (Paulsen 2014).",
  guide: `<ul>
      <li>Pasienten fyller ut det lisensierte HOOS-skjemaet. Tast inn svaret for hvert ledd: 0 = svaret lengst til venstre (ingen problemer), 4 = lengst til høyre (ekstreme problemer).</li>
      <li>Hver delskår regnes om til 0–100, der 100 = ingen problemer: 100 − (gjennomsnitt × 25).</li>
      <li>1–2 ubesvarte ledd i en delskår erstattes med gjennomsnittet av de andre. Ved 3 eller flere ubesvarte er delskåren ugyldig (Nilsdotter 2003).</li>
      <li>Delskårene tolkes hver for seg. Det regnes ingen totalskår.</li>
      <li>MCID: smerte 24 og livskvalitet 17 poeng, 1 år etter hofteprotese (Paulsen 2014). Symptomer, ADL og sport/fritid har ingen etablert MCID i appen.</li>
      <li>HOOS © Ewa M. Roos. Lisens via Mapi Research Trust (ePROVIDE). Appen gjengir ikke spørsmålsteksten.</li></ul>
    <p class="source">Nilsdotter AK, Lohmander LS, Klässbo M, Roos EM. BMC Musculoskelet Disord 2003;4:10. Paulsen A, Roos EM, Pedersen AB, Overgaard S. Acta Orthop 2014;85:39–48.</p>`
};

export default makeModule(HOOS_DEF);
