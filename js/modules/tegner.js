/* Tegner aktivitetsskala, nivå 0–10 (Tegner & Lysholm 1985).
   Nivåbeskrivelsene står i js/data/ledd-tekst.js (appens egen norske oversettelse, lagt inn etter Rikards beslutning). */
import { num, fs } from "../lib/format.js";
import { inputF, esc } from "../lib/form.js";
import { itemText } from "../lib/koos-hoos.js";
import { TEGNER_TEXT } from "../data/ledd-tekst.js";

/* Nivå 0–10, ellers null */
export const tegnerVal = v => { const x = num(v); return Number.isInteger(x) && x >= 0 && x <= 10 ? x : null; };
const lv = n => `${Math.abs(n)} ${Math.abs(n) === 1 ? "nivå" : "nivåer"}`;

/* Nivå nå sammenlignet med nivået før skaden */
export function tegnerVsPre(now, pre) {
  const d = now - pre;
  return d === 0 ? "Samme nivå som før skaden." : `${lv(d)} ${d < 0 ? "under" : "over"} nivået før skaden.`;
}

/* Liste over nivåene 10–0 med beskrivelse. Tom hvis ingen tekst er lagt inn. */
export function tegnerLevels(texts) {
  const items = Array.from({ length: 11 }, (_, i) => 10 - i).map(n => [n, itemText(texts, String(n))]).filter(([, t]) => t);
  return items.length ? `<ol class="tegner-levels">${items.map(([n, t]) =>
    `<li data-v="${n}"><span class="tnum">${n}</span><span class="ttxt">${esc(t)}</span><span class="ttag"></span></li>`).join("")}</ol>` : "";
}

const row = (k, label) => `
      <div class="kitem tegner-row" role="radiogroup" aria-label="${label}"><span class="kcode">${label}</span>
        <div class="scores" style="grid-template-columns:repeat(6,1fr)">${Array.from({ length: 11 }, (_, v) =>
          `<label><input type="radio" name="tegner-${k}" id="tegner-${k}-${v}" data-k="${k}" value="${v}"><span>${v}</span></label>`).join("")}</div></div>`;

export default {
  id: "tegner", name: "Tegner", category: "PROM kne/hofte", status: "aktiv",
  title: "Tegner aktivitetsskala", meta: "Nivå 0–10",
  initState: () => ({ now: "", pre: "", prev: "" }),
  form: () => `
    <span class="hint">Velg nivået pasienten krysset på skjemaet (0–10), nå og før skaden.</span>
    ${tegnerLevels(TEGNER_TEXT)}
    <div class="kitems">${row("now", "Nå")}${row("pre", "Før skade")}</div>
    <div class="grid">${inputF("tegner-prev", "prev", "Forrige nivå (valgfritt)", "", { int: true, ph: "0–10" })}</div>`,
  paint(card, s) {
    card.querySelectorAll(".tegner-levels li").forEach(li => {
      const now = li.dataset.v === s.now, pre = li.dataset.v === s.pre;
      li.classList.toggle("on", now || pre);
      li.querySelector(".ttag").textContent = [now && "Nå", pre && "Før skade"].filter(Boolean).join(" · ");
    });
  },
  result(s) {
    const now = tegnerVal(s.now); if (now == null) return null;
    const pre = tegnerVal(s.pre);
    return { tone: "none", big: String(now), main: `Tegner nivå ${now}`, sub: pre != null ? `Før skaden: ${pre} · ${tegnerVsPre(now, pre).replace(/\.$/, "")}` : "Nivå før skaden ikke oppgitt" };
  },
  toText(s) {
    const now = tegnerVal(s.now); if (now == null) return null;
    const pre = tegnerVal(s.pre);
    const out = [`Tegner aktivitetsskala: nivå ${now} nå${pre != null ? `, nivå ${pre} før skaden` : ""}.`];
    out.push(`Tolkning: ${pre != null ? tegnerVsPre(now, pre) : "Ingen etablert grenseverdi."}`);
    const pv = tegnerVal(s.prev);
    if (pv != null) out.push(`Endring fra forrige: nivå ${pv} → ${now} (${fs(now - pv, 0)} ${Math.abs(now - pv) === 1 ? "nivå" : "nivåer"}). Ingen etablert MCID.`);
    return out.join("\n");
  },
  guide: `<ul>
      <li>Pasienten velger det høyeste aktivitetsnivået i arbeid og idrett, nå og før skaden. Nivåene går fra 0 (lavest) til 10 (høyest) på skjemaet.</li>
      <li>Ingen grenseverdi. Nivået sammenlignes med nivået før skaden.</li>
      <li>Ingen etablert MCID. Endring rapporteres i antall nivåer. Skalaen har akseptabel reliabilitet og responsivitet ved meniskskade (Briggs 2006).</li>
      <li>Utviklet av Tegner og Lysholm. Rettighetene er uavklart (ePROVIDE har ingen opplysning). Nivåbeskrivelsene er appens egen norske oversettelse av den engelske originalen, ikke en validert norsk versjon.</li></ul>
    <p class="source">Tegner Y, Lysholm J. Clin Orthop Relat Res 1985;(198):43–9. Briggs KK et al. J Bone Joint Surg Am 2006;88:698–705.</p>`
};
