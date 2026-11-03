/* Clinical Frailty Scale (CFS) v2.0 (NO) */
import { num, fs } from "../lib/format.js";
import { radioF, inputF } from "../lib/form.js";

export const CFS_LEVELS = [
  { n: 1, name: "Veldig sprek", desc: "Robust, aktiv, energisk og motivert. Trener regelmessig. Blant de sprekeste for alderen." },
  { n: 2, name: "Sprek", desc: "Ingen aktive sykdomssymptomer, men mindre sprek enn nivå 1. Trener eller er svært aktiv i perioder." },
  { n: 3, name: "Klarer seg bra", desc: "Medisinske problemer er godt kontrollert, selv om symptomer kan forekomme. Ikke regelmessig aktiv utover vanlig gange." },
  { n: 4, name: "Lever med svært lett skrøpelighet", desc: "Ikke avhengig av daglig hjelp, men symptomer begrenser aktivitet. Beskriver ofte å være «langsommere» og/eller trett i løpet av dagen." },
  { n: 5, name: "Lever med mild skrøpelighet", desc: "Tydelig redusert tempo. Trenger hjelp med krevende IADL (økonomi, transport, tungt husarbeid). Begynnende svikt i handling, matlaging og medisinhåndtering." },
  { n: 6, name: "Lever med moderat skrøpelighet", desc: "Trenger hjelp med alle aktiviteter ute og med husarbeid. Problemer med trapper, trenger hjelp ved dusj/bad, kan trenge litt hjelp ved påkledning." },
  { n: 7, name: "Lever med alvorlig skrøpelighet", desc: "Helt avhengig av hjelp til personlig stell (fysisk eller kognitivt). Ellers stabil og ikke høy risiko for å dø innen ca. 6 måneder." },
  { n: 8, name: "Lever med svært alvorlig skrøpelighet", desc: "Helt avhengig av hjelp og nærmer seg livets slutt. Kommer seg typisk ikke etter selv lettere sykdom." },
  { n: 9, name: "Terminalt syk", desc: "Nærmer seg livets slutt, forventet levetid under 6 måneder, men er ellers ikke tydelig skrøpelig." }
];

/* Tolkning av CFS-nivå 1–9 */
export function interpretCfs(n) {
  if (n <= 3) return { main: "Ikke skrøpelig", range: "CFS 1–3", tone: "ok" };
  if (n === 4) return { main: "Svært lett skrøpelighet (økt sårbarhet)", range: "CFS 4", tone: "warn" };
  const g = { 5: "mild", 6: "moderat", 7: "alvorlig", 8: "svært alvorlig" }[n];
  if (g) return { main: `Skrøpelig, ${g} grad`, range: "CFS ≥5", tone: "crit" };
  return { main: "Terminalt syk", range: "CFS 9", tone: "crit" };
}

const CFS_BASIS = { habituell: "habituell funksjon ca. 2 uker før aktuell sykdom/forverring", aktuell: "aktuell funksjon ved undersøkelsen" };
const SOURCES = ["Pasient", "Pårørende", "Journal", "Klinisk observasjon"];

export default {
  id: "cfs", name: "CFS", category: "Skrøpelighet", status: "aktiv",
  title: "Clinical Frailty Scale (CFS)", meta: "Versjon 2.0 (NO) · nivå 1–9",
  initState: () => ({ level: "", basis: "habituell", sources: [], prev: "", note: "" }),
  form: () => `
    <div class="field" role="radiogroup" aria-labelledby="cfs-lvl-lbl">
      <span class="lbl" id="cfs-lvl-lbl">Velg nivå</span>
      <div class="levels">${CFS_LEVELS.map(l => `
        <label class="lvl" style="--c:var(--l${l.n})">
          <input type="radio" name="cfs-level" id="cfs-level-${l.n}" data-k="level" value="${l.n}">
          <span class="num">${l.n}</span>
          <span class="lvl-txt"><span class="lvl-name">${l.name}</span><br><span class="lvl-desc">${l.desc}</span></span>
        </label>`).join("")}</div>
    </div>
    ${radioF("cfs-basis", "basis", "Vurderingen bygger på", [["habituell", "Habituell funksjon (ca. 2 uker før aktuell sykdom)"], ["aktuell", "Aktuell funksjon ved undersøkelsen"]])}
    <div class="field"><span class="lbl">Informasjonskilde</span><div class="seg">${SOURCES.map((x, i) =>
      `<label><input type="checkbox" id="cfs-src-${i}" data-k="sources" data-multi="1" value="${x}"> ${x}</label>`).join("")}</div></div>
    <div class="grid">${inputF("cfs-prev", "prev", "Forrige CFS (valgfritt)", "", { int: true, ph: "1–9", hint: "Gir endring ved re-test." })}</div>
    <div class="field"><label class="lbl" for="cfs-note">Kommentar (valgfritt)</label>
      <textarea class="note" id="cfs-note" data-k="note" placeholder="F.eks. kognitiv svikt påvirker vurderingen. Ingen personopplysninger."></textarea></div>`,
  result(s, p) {
    const n = num(s.level); if (!n) return null;
    const I = interpretCfs(n); let sub = `${CFS_LEVELS[n - 1].name} · ${I.range}`;
    const pv = num(s.prev); if (pv >= 1 && pv <= 9) sub += ` · endring ${pv} → ${n} (${fs(n - pv, 0)})`;
    return { tone: "lvl", lvl: n, big: String(n), main: I.main, sub };
  },
  toText(s, p) {
    const n = num(s.level); if (!n) return null;
    const I = interpretCfs(n);
    const out = [`Clinical Frailty Scale (CFS v2.0): ${n} – ${CFS_LEVELS[n - 1].name}.`];
    let g = `Vurdert ut fra ${CFS_BASIS[s.basis]}`;
    if (s.sources.length) g += `. Kilde: ${s.sources.join(", ").toLowerCase()}`;
    out.push(g + ".");
    out.push(`Tolkning: ${I.main} (${I.range}).`);
    const pv = num(s.prev);
    if (pv >= 1 && pv <= 9) {
      const d = n - pv;
      out.push(`Endring fra forrige vurdering: CFS ${pv} → ${n} (${fs(d, 0)} nivå, ${d > 0 ? "forverring" : d < 0 ? "bedring" : "uendret"}). Ingen etablert MCID for CFS.`);
    }
    const age = num(p.age);
    if (age != null && age < 65) out.push("Merk: CFS er validert for personer ≥65 år og tolkes med forsiktighet.");
    if (s.note.trim()) out.push(`Kommentar: ${s.note.trim()}`);
    return out.join("\n");
  },
  guide: `<ul>
      <li>Skår habituell funksjon. Ved akutt sykdom: slik pasienten var ca. 2 uker før, ikke på det dårligste.</li>
      <li>Ved demens tilsvarer skrøpelighetsgraden vanligvis demensgraden for nivå 5–8 (mild ≈ 5, moderat ≈ 6, alvorlig ≈ 7, svært alvorlig ≈ 8).</li>
      <li>CFS 9 brukes ved forventet levetid under 6 måneder hos personer som ellers ikke er tydelig skrøpelige.</li>
      <li>Validert for personer ≥65 år. Brukes ikke under 65 år eller ved stabil, isolert funksjonsnedsettelse (f.eks. CP).</li>
      <li>CFS bør ikke brukes alene, og skåren skal være datert og vise hvem som skåret (ivaretas av DIPS-notatet).</li>
      <li>Ingen etablert MCID. Endring rapporteres i antall nivåer.</li></ul>
    <p class="source">Beskrivelsene er forkortet. Referanse: Clinical Frailty Scale v2.0 (NO), © 2005–2020 Rockwood, oversatt av Rostoft, Engstad, Sjøbø og Flaatten (Helsedirektoratet). Rockwood K et al. CMAJ 2005;173:489–95.</p>`
};
