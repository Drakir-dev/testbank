/* Short Physical Performance Battery (SPPB) */
import { num, f, changeText } from "../lib/format.js";
import { inputF, radioF, checkF } from "../lib/form.js";

/* Balanse 0–4: side ved side, semi-tandem og tandem. Null til nok er fylt inn. */
export function sppbBalance(s) {
  if (s.sbs === "nei") return 0;
  if (s.sbs !== "ja") return null;
  if (s.semi === "nei") return 1;
  if (s.semi !== "ja") return null;
  const t = num(s.tandem);
  if (s.tandemNo) return 2;
  if (t != null) return 2 + (t >= 10 ? 2 : t >= 3 ? 1 : 0);
  return null;
}

/* Gange 4 m, poeng for raskeste tid (Guralnik 1994) */
export const sppbGaitPoints = gt => gt >= 60 ? 0 : gt > 8.70 ? 1 : gt > 6.20 ? 2 : gt >= 4.82 ? 3 : 4;

/* Reise seg 5 ganger, poeng for tid (Guralnik 1994) */
export const sppbChairPoints = ct => ct > 60 ? 0 : ct >= 16.70 ? 1 : ct >= 13.70 ? 2 : ct >= 11.20 ? 3 : 4;

/* Delskårer og totalskår. total er null til alle tre deler er skåret. */
export function scoreSppb(s) {
  const bal = sppbBalance(s);
  // Gange 4 m (raskeste av to)
  let gait = null, gt = null;
  if (s.gaitNo) gait = 0;
  else {
    const ts = [num(s.g1), num(s.g2)].filter(x => x != null && x > 0);
    if (ts.length) { gt = Math.min(...ts); gait = sppbGaitPoints(gt); }
  }
  // 5x reise/sette seg
  let chair = null; const ct = num(s.chair);
  if (s.chairNo) chair = 0;
  else if (ct != null) chair = sppbChairPoints(ct);
  const total = bal != null && gait != null && chair != null ? bal + gait + chair : null;
  return { bal, gait, gt, chair, ct, total };
}

export function sppbClass(t) { return t <= 3 ? "alvorlig begrenset funksjon" : t <= 6 ? "moderat begrenset funksjon" : t <= 9 ? "lett begrenset funksjon" : "minimal begrensning"; }
const cap = s => s[0].toUpperCase() + s.slice(1);

export default {
  id: "sppb", name: "SPPB", category: "Funksjon og gange", status: "aktiv",
  title: "Short Physical Performance Battery (SPPB)", meta: "Balanse + gange + reise seg · 0–12",
  initState: () => ({ sbs: "", semi: "", tandem: "", tandemNo: false, g1: "", g2: "", gaitNo: false, chair: "", chairNo: false, prev: "" }),
  form: () => `
    <div class="sub-h">1 · Balanse</div>
    ${radioF("sppb-sbs", "sbs", "Føttene side ved side, 10 s", [["ja", "Holdt 10 s"], ["nei", "Holdt ikke"]])}
    <div data-show="semi">${radioF("sppb-semi", "semi", "Semi-tandem, 10 s", [["ja", "Holdt 10 s"], ["nei", "Holdt ikke"]])}</div>
    <div data-show="tandem" class="grid">
      ${inputF("sppb-tandem", "tandem", "Tandem, tid (maks 10 s)", "s")}
      <div class="field"><span class="lbl">&nbsp;</span>${checkF("sppb-tandemNo", "tandemNo", "Ikke forsøkt / klarte ikke")}</div>
    </div>
    <div class="sub-h">2 · Ganghastighet 4 m</div>
    <div class="grid">
      ${inputF("sppb-g1", "g1", "Forsøk 1", "s")}
      ${inputF("sppb-g2", "g2", "Forsøk 2", "s", { hint: "Raskeste forsøk skåres." })}
    </div>
    ${checkF("sppb-gaitNo", "gaitNo", "Klarte ikke å gå 4 m")}
    <div class="sub-h">3 · Reise seg fra stol 5 ganger</div>
    <div class="grid">${inputF("sppb-chair", "chair", "Tid for 5 reisinger", "s")}</div>
    ${checkF("sppb-chairNo", "chairNo", "Klarte ikke / måtte bruke armene / over 60 s")}
    <div class="grid">${inputF("sppb-prev", "prev", "Forrige totalskår (valgfritt)", "/12", { int: true })}</div>`,
  paint(card, s) {
    card.querySelector('[data-show="semi"]').hidden = s.sbs !== "ja";
    card.querySelector('[data-show="tandem"]').hidden = !(s.sbs === "ja" && s.semi === "ja");
  },
  result(s) {
    const P = scoreSppb(s);
    const parts = `Balanse ${P.bal ?? "–"} · gange ${P.gait ?? "–"} · reise seg ${P.chair ?? "–"}`;
    if (P.bal == null && P.gait == null && P.chair == null) return null;
    if (P.total == null) return { tone: "none", big: "…", main: "Ikke komplett", sub: parts };
    const t = P.total;
    return { tone: t <= 6 ? "crit" : t <= 8 ? "warn" : t <= 9 ? "warn" : "ok", big: String(t), main: cap(sppbClass(t)), sub: `${parts}${t <= 8 ? " · ≤8: nedsatt fysisk funksjon" : ""}` };
  },
  toText(s) {
    const P = scoreSppb(s); if (P.total == null) return null;
    const t = P.total;
    let det = `Balanse ${P.bal}/4`;
    det += `, ganghastighet ${P.gait}/4${P.gt != null ? ` (4 m på ${f(P.gt, 2)} s = ${f(4 / P.gt, 2)} m/s)` : " (klarte ikke)"}`;
    det += `, reise seg 5 ganger ${P.chair}/4${!s.chairNo && P.ct != null ? ` (${f(P.ct, 1)} s)` : " (klarte ikke)"}.`;
    const out = [`SPPB: ${t}/12. ${det}`];
    out.push(`Tolkning: ${cap(sppbClass(t))} (Guralnik 1994).${t <= 8 ? " ≤8 poeng indikerer nedsatt fysisk funksjon (EWGSOP2)." : ""}`);
    const c = changeText(t, num(s.prev), { unit: "poeng", d: 0, better: "higher", mcid: 0.5, big: 1, mcidLabel: "liten meningsfull endring 0,5 poeng, betydelig 1 poeng (Perera 2006)" });
    if (c) out.push(c);
    return out.join("\n");
  },
  guide: `<ul>
      <li>Rekkefølge: balanse, gange, reise seg. Pasienten må kunne stå uten hjelpemiddel. Ganghjelpemiddel er tillatt på gangtesten.</li>
      <li>Balanse: ett forsøk per stilling. Klarer ikke side ved side → semi-tandem og tandem skåres 0. Tandem: 10 s = 2, 3–9,99 s = 1, &lt;3 s = 0.</li>
      <li>Gange 4 m, vanlig tempo, to forsøk. &lt;4,82 s = 4 · 4,82–6,20 s = 3 · 6,21–8,70 s = 2 · &gt;8,70 s = 1 · klarer ikke = 0.</li>
      <li>Reise seg 5 ganger, armene i kryss. ≤11,19 s = 4 · 11,20–13,69 s = 3 · 13,70–16,69 s = 2 · ≥16,70 s = 1 · &gt;60 s, klarer ikke eller bruker armene = 0.</li>
      <li>Totalskår: 0–3 alvorlig, 4–6 moderat, 7–9 lett, 10–12 minimal begrensning. ≤8 brukes som grense for nedsatt fysisk funksjon (EWGSOP2).</li>
      <li>Meningsfull endring: 0,5 poeng (liten), 1 poeng (betydelig).</li></ul>
    <p class="source">Guralnik JM et al., J Gerontol 1994;49:M85–94. Cruz-Jentoft AJ et al., Age Ageing 2019;48:16–31. Perera S et al., J Am Geriatr Soc 2006;54:743–9.</p>`
};
