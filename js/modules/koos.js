/* Knee injury and Osteoarthritis Outcome Score (KOOS), ledd for ledd. Spørsmålstekst hentes fra js/data/ledd-tekst.js når den er lagt inn. */
import { makeModule } from "../lib/koos-hoos.js";
import { KOOS_TEXT } from "../data/ledd-tekst.js";

/* Delskårer i skjemaets rekkefølge (Roos 1998) */
export const KOOS_DEF = {
  id: "koos", name: "KOOS", texts: KOOS_TEXT,
  title: "Knee injury and Osteoarthritis Outcome Score (KOOS)", meta: "42 ledd · 5 delskårer 0–100",
  subscales: [
    { key: "S", n: 7, label: "symptomer", head: "Symptomer og stivhet" },
    { key: "P", n: 9, label: "smerte", head: "Smerte" },
    { key: "A", n: 17, label: "ADL", head: "Dagliglivets aktiviteter (ADL)" },
    { key: "SP", n: 5, label: "sport/fritid", head: "Sport og fritid" },
    { key: "Q", n: 4, label: "livskvalitet", head: "Knerelatert livskvalitet" }
  ],
  textOrder: ["P", "S", "A", "SP", "Q"],
  mcid: { all: 10 },
  interpretation: "Tolkning: Delskårene tolkes hver for seg; ingen etablert grenseverdi eller totalskår (Roos & Lohmander 2003).",
  mcidNote: "MCID: 8–10 poeng (kneskade og artrose, Roos & Lohmander 2003). MDC 14,3–19,6 poeng hos yngre og ≥20 hos eldre (Collins 2016).",
  guide: `<ul>
      <li>Pasienten fyller ut det lisensierte KOOS-skjemaet. Tast inn svaret for hvert ledd: 0 = svaret lengst til venstre (ingen problemer), 4 = lengst til høyre (ekstreme problemer).</li>
      <li>Hver delskår regnes om til 0–100, der 100 = ingen problemer: 100 − (gjennomsnitt × 25).</li>
      <li>1–2 ubesvarte ledd i en delskår erstattes med gjennomsnittet av de andre. Ved 3 eller flere ubesvarte er delskåren ugyldig.</li>
      <li>Delskårene tolkes hver for seg. Det regnes ingen totalskår. ADL har best innholdsvaliditet hos eldre, sport/fritid hos yngre med kneskade (Collins 2016).</li>
      <li>MCID 8–10 poeng (Roos & Lohmander 2003). Appen klassifiserer mot 10. MDC 14,3–19,6 poeng hos yngre og ≥20 hos eldre (Collins 2016).</li>
      <li>KOOS © Ewa M. Roos. Lisens via Mapi Research Trust (ePROVIDE). Spørsmålsteksten vises bare når den er lagt inn fra Ahus' lisensierte norske versjon (js/data/ledd-tekst.js).</li></ul>
    <p class="source">Roos EM, Roos HP, Lohmander LS, Ekdahl C, Beynnon BD. JOSPT 1998;28:88–96. Roos EM, Lohmander LS. Health Qual Life Outcomes 2003;1:64. Collins NJ et al. Osteoarthritis Cartilage 2016;24:1317–29.</p>`
};

export default makeModule(KOOS_DEF);
