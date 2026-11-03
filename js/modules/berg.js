/* Berg balanseskala (BBS) */
import { num, fs } from "../lib/format.js";
import { inputF } from "../lib/form.js";

export const BERG_ITEMS = [
  ["Fra sittende til stående", ["Trenger moderat eller mye hjelp", "Trenger litt hjelp for å reise seg eller bli stabil", "Reiser seg med hendene etter flere forsøk", "Reiser seg selvstendig med hendene", "Reiser seg uten hender og står stabilt selvstendig"]],
  ["Stå uten støtte (2 min)", ["Klarer ikke stå 30 s uten støtte", "Trenger flere forsøk for å stå 30 s uten støtte", "Står 30 s uten støtte", "Står 2 min med tilsyn", "Står trygt i 2 min"]],
  ["Sitte uten ryggstøtte, føttene på gulvet (2 min)", ["Klarer ikke sitte 10 s uten støtte", "Sitter 10 s", "Sitter 30 s", "Sitter 2 min med tilsyn", "Sitter trygt og sikkert i 2 min"]],
  ["Fra stående til sittende", ["Trenger hjelp for å sette seg", "Setter seg selvstendig, men ukontrollert", "Bruker baksiden av bena mot stolen for å kontrollere", "Kontrollerer nedsettingen med hendene", "Setter seg trygt med minimal bruk av hendene"]],
  ["Forflytning", ["Trenger to personer, eller tilsyn for sikkerhet", "Trenger én person til hjelp", "Klarer med verbal veiledning og/eller tilsyn", "Klarer trygt, men bruker tydelig hendene", "Klarer trygt med minimal bruk av hendene"]],
  ["Stå med lukkede øyne (10 s)", ["Trenger hjelp for ikke å falle", "Klarer ikke holde øynene lukket i 3 s, men står stødig", "Står 3 s", "Står 10 s med tilsyn", "Står trygt i 10 s"]],
  ["Stå med samlede føtter (1 min)", ["Trenger hjelp til å innta stillingen og holder ikke 15 s", "Trenger hjelp til å innta stillingen, men står 15 s", "Inntar stillingen selv, men holder ikke 30 s", "Inntar stillingen selv og står 1 min med tilsyn", "Inntar stillingen selv og står trygt i 1 min"]],
  ["Strekke seg fremover med strak arm", ["Mister balansen eller trenger ytre støtte", "Strekker seg frem, men trenger tilsyn", "Når mer enn 5 cm", "Når mer enn 12,5 cm", "Når trygt mer enn 25 cm"]],
  ["Plukke opp gjenstand fra gulvet", ["Kan ikke forsøke, eller trenger hjelp for ikke å falle", "Klarer ikke, og trenger tilsyn under forsøket", "Klarer ikke, men når 2–5 cm fra gjenstanden og holder balansen selv", "Plukker opp gjenstanden, men trenger tilsyn", "Plukker opp gjenstanden trygt og lett"]],
  ["Snu seg og se bakover over begge skuldre", ["Trenger hjelp for ikke å falle", "Trenger tilsyn ved vending", "Snur seg bare til siden, men holder balansen", "Ser godt bakover til én side, mindre vektoverføring til den andre", "Ser bakover til begge sider med god vektoverføring"]],
  ["Snu seg 360°", ["Trenger hjelp ved vending", "Trenger tett tilsyn eller verbal veiledning", "Snur seg trygt, men langsomt", "Snur seg trygt 360° til én side på ≤4 s", "Snur seg trygt 360° på ≤4 s til hver side"]],
  ["Sette føttene vekselvis på krakk (8 ganger)", ["Trenger hjelp for ikke å falle, eller kan ikke forsøke", "Klarer mer enn 2 trinn med litt hjelp", "Klarer 4 trinn uten hjelp, med tilsyn", "Klarer 8 trinn selvstendig på mer enn 20 s", "Står selvstendig og trygt, 8 trinn på ≤20 s"]],
  ["Stå med én fot foran den andre (30 s)", ["Mister balansen når han/hun tar steget eller står", "Trenger hjelp til å ta steget, men står 15 s", "Tar et lite steg selvstendig og står 30 s", "Plasserer foten foran den andre selvstendig og står 30 s", "Plasserer foten tandem selvstendig og står 30 s"]],
  ["Stå på ett ben", ["Kan ikke forsøke, eller trenger hjelp for ikke å falle", "Forsøker å løfte benet, klarer ikke 3 s, men står selvstendig", "Løfter benet selvstendig og står ≥3 s", "Løfter benet selvstendig og står 5–10 s", "Løfter benet selvstendig og står >10 s"]]
];

/* MDC for eldre etter utgangsskår (Donoghue & Stokes 2009) */
export function bergMDC(total) { return total >= 45 ? 4 : total >= 35 ? 5 : total >= 25 ? 7 : 5; }

/* Skårene for leddene som er fylt inn */
export function bergScored(s) { return BERG_ITEMS.map((_, i) => num(s["b" + i])).filter(x => x != null); }

/* Totalskår 0–56, eller null til alle 14 ledd er skåret */
export function scoreBerg(s) { const v = bergScored(s); return v.length === 14 ? v.reduce((a, b) => a + b, 0) : null; }

export default {
  id: "berg", name: "Berg balanseskala", category: "Balanse", status: "aktiv",
  title: "Berg balanseskala (BBS)", meta: "14 ledd · 0–56",
  initState: () => { const s = { prev: "" }; BERG_ITEMS.forEach((_, i) => s["b" + i] = ""); return s; },
  form: () => `<div class="berg">${BERG_ITEMS.map(([name, crit], i) => `
      <fieldset class="bitem">
        <legend><span class="bno">${i + 1}</span> ${name}</legend>
        <div class="scores">${[0, 1, 2, 3, 4].map(v =>
          `<label title="${v}: ${crit[v]}"><input type="radio" name="berg-${i}" id="berg-${i}-${v}" data-k="b${i}" value="${v}"><span>${v}</span></label>`).join("")}</div>
        <div class="crit" id="berg-crit-${i}">${crit.map((c, v) => `<span data-v="${v}">${v} – ${c}</span>`).join("")}</div>
      </fieldset>`).join("")}</div>
    <div class="grid">${inputF("berg-prev", "prev", "Forrige totalskår (valgfritt)", "/56", { int: true })}</div>`,
  paint(card, s) {
    BERG_ITEMS.forEach((_, i) => {
      const sel = s["b" + i];
      card.querySelectorAll(`#berg-crit-${i} span`).forEach(sp => sp.classList.toggle("sel", sp.dataset.v === sel));
      card.querySelector(`#berg-crit-${i}`).classList.toggle("picked", sel !== "");
    });
  },
  result(s) {
    const v = bergScored(s); if (!v.length) return null;
    const sum = v.reduce((a, b) => a + b, 0);
    if (v.length < 14) return { tone: "none", big: String(sum), main: `${v.length} av 14 ledd skåret`, sub: `Foreløpig sum ${sum}` };
    const risk = sum < 45;
    return { tone: sum <= 20 ? "crit" : risk ? "warn" : "ok", big: String(sum), main: risk ? "Økt fallrisk" : "Ikke økt fallrisk etter grenseverdi",
      sub: `${sum}/56 · grense <45 · MDC ${bergMDC(sum)} poeng` };
  },
  toText(s) {
    const t = scoreBerg(s); if (t == null) return null;
    const items = BERG_ITEMS.map((_, i) => `${i + 1}:${s["b" + i]}`).join(", ");
    const out = [`Berg balanseskala: ${t}/56.`, `Ledd: ${items}.`];
    if (t < 45) out.push(`Tolkning: Under 45 poeng, forbundet med økt fallrisk hos eldre (Berg 1992).${t <= 20 ? " Skår 0–20 indikerer høy fallrisk og stort behov for hjelp/hjelpemiddel." : ""}`);
    else out.push("Tolkning: 45 poeng eller mer, ikke økt fallrisk etter grenseverdien <45 (Berg 1992).");
    const pv = num(s.prev);
    if (pv != null) {
      const d = t - pv, mdc = bergMDC(pv);
      out.push(`Endring fra forrige: ${pv} → ${t} (${fs(d, 0)} poeng, ${d > 0 ? "bedring" : d < 0 ? "forverring" : "uendret"}; ${Math.abs(d) >= mdc ? "over" : "under"} MDC på ${mdc} poeng for utgangsskår ${pv}). MDC etter Donoghue & Stokes 2009; ingen etablert MCID for eldre.`);
    }
    return out.join("\n");
  },
  guide: `<ul>
      <li>14 ledd skåret 0–4. Gi laveste skår som passer prestasjonen. Utstyr: stol med og uten armlener, stoppeklokke, linjal, krakk/trinn.</li>
      <li>Ledd 2: står pasienten trygt i 2 min, gis full skår på ledd 3.</li>
      <li>Grenseverdi <45 for økt fallrisk. Grovinndeling: 0–20 høy, 21–40 middels, 41–56 lav fallrisk.</li>
      <li>MDC (eldre) avhenger av utgangsskår: 45–56: 4 poeng, 35–44: 5, 25–34: 7, 0–24: 5. MCID er ikke etablert for eldre, så appen bruker MDC.</li></ul>
    <p class="source">Kriteriene er forkortet. Bruk den norske versjonen av Berg balanseskala som referanse. Berg KO et al., Can J Public Health 1992;83 Suppl 2:S7–11. Donoghue D & Stokes EK, J Rehabil Med 2009;41:343–6.</p>`
};
