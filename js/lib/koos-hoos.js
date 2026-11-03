/* Felles skåring for KOOS og HOOS: fem delskårer 0–100, ledd for ledd.
   Spørsmålsteksten (© Ewa M. Roos, lisens via Mapi) hentes fra js/data/ledd-tekst.js når Rikard har lagt den inn.
   Hvert ledd skåres 0–4 (0 = ingen problemer). Rene funksjoner, ingen DOM. */
import { num, fs } from "./format.js";
import { inputF, esc } from "./form.js";

/* Ledd fra js/data/ledd-tekst.js: en tekst, eller et objekt {q, opts, head, note}. Gir alltid et objekt. */
export function itemEntry(texts, code) {
  const e = (texts || {})[code];
  if (!e) return { q: "" };
  if (typeof e === "string") return { q: e.trim() };
  return { ...e, q: (e.q || "").trim() };
}

/* Bare spørsmålsteksten, eller "" */
export const itemText = (texts, code) => itemEntry(texts, code).q;

/* Leddkode, valgfri tekst og knapper 0–max. Brukes av KOOS, HOOS og IKDC.
   opts ([poeng, svar] i skjemaets rekkefølge) gir én knapp per svar med poeng og tekst i stedet for bare tall.
   desc viser tallknappene fra max til 0, når skjemaet har høyest poeng lengst til venstre.
   0–10 står i seks kolonner på mobil og på én rad på bred skjerm (klassen s11 i css/app.css). */
export function itemRow(id, code, k, max, text, ariaExtra = "", opts = null, desc = false) {
  const values = Array.from({ length: max + 1 }, (_, i) => desc ? max - i : i);
  const layout = max === 4 ? "" : max === 10 ? " s11" : "";
  const style = max === 4 || max === 10 ? "" : ` style="grid-template-columns:repeat(${Math.min(max + 1, 6)},1fr)"`;
  const radio = (v, label) => `<label><input type="radio" name="${id}-${code}" id="${id}-${code}-${v}" data-k="${k}" value="${v}"><span>${label}</span></label>`;
  const buttons = opts
    ? `<div class="scores opts">${opts.map(([v, t]) => radio(v, `<b>${v}</b> ${esc(t)}`)).join("")}</div>`
    : `<div class="scores${layout}"${style}>${values.map(v => radio(v, v)).join("")}</div>`;
  return `
      <div class="kitem" role="radiogroup" aria-label="${code}${text ? ": " + esc(text) : ariaExtra}">${text ? `<span class="ktext"><b class="kno">${code}</b> ${esc(text)}</span>` : `<span class="kcode">${code}</span>`}
        ${buttons}</div>`;
}

/* Ledd 0–4 som heltall, ellers null */
export const itemVal = v => { const x = num(v); return Number.isInteger(x) && x >= 0 && x <= 4 ? x : null; };

/* Delskår = 100 − gjennomsnitt × 25, avrundet til heltall (100 = ingen problemer).
   1–2 ubesvarte ledd erstattes med gjennomsnittet; ved 3 eller flere er delskåren ugyldig (null). */
export function subscaleScore(values) {
  const v = values.map(itemVal).filter(x => x != null);
  if (!v.length || values.length - v.length > 2) return null;
  return Math.round(100 - v.reduce((a, b) => a + b, 0) / v.length * 25);
}

export const codes = sub => Array.from({ length: sub.n }, (_, i) => sub.key + (i + 1));

/* Delskårer i tekstrekkefølge: [{key, label, score, answered}] */
export function scoreAll(def, s) {
  return def.textOrder.map(key => {
    const sub = def.subscales.find(x => x.key === key);
    const vals = codes(sub).map(c => s[c]);
    return { key, label: sub.label, score: subscaleScore(vals), answered: vals.filter(x => itemVal(x) != null).length };
  });
}

/* Forrige delskår: heltall 0–100, ellers null */
export const prevVal = v => { const x = num(v); return Number.isInteger(x) && x >= 0 && x <= 100 ? x : null; };

/* Endring for én delskår. mcid null gir «ingen etablert MCID». */
export function subChange(cur, prev, mcid) {
  const diff = cur - prev;
  const dir = diff === 0 ? "uendret" : diff > 0 ? "bedring" : "forverring";
  return { diff, dir, over: mcid == null ? null : Math.abs(diff) >= mcid };
}

/* MCID for en delskår: def.mcid.all gjelder alle, ellers per delskår (eller ingen) */
export const mcidFor = (def, key) => def.mcid.all ?? def.mcid[key] ?? null;

export function changeText(def, s) {
  const parts = scoreAll(def, s).filter(x => x.score != null && prevVal(s["prev" + x.key]) != null).map(x => {
    const pv = prevVal(s["prev" + x.key]), m = mcidFor(def, x.key), c = subChange(x.score, pv, m);
    const cls = c.over == null ? "ingen etablert MCID" : `${c.over ? "over" : "under"} MCID${def.mcid.all ? "" : " " + m}`;
    return `${x.label} ${pv} → ${x.score} (${fs(c.diff, 0)} poeng, ${c.dir}; ${cls})`;
  });
  return parts.length ? `Endring fra forrige: ${parts.join("; ")}. ${def.mcidNote}` : null;
}

const cap = s => s[0].toUpperCase() + s.slice(1);

/* Bygger modulobjektet for KOOS eller HOOS fra en definisjon */
export function makeModule(def) {
  const allCodes = def.subscales.flatMap(codes);
  return {
    id: def.id, name: def.name, category: "PROM kne/hofte", status: "aktiv",
    title: def.title, meta: def.meta,
    initState: () => {
      const s = {};
      allCodes.forEach(c => s[c] = "");
      def.textOrder.forEach(k => s["prev" + k] = "");
      return s;
    },
    form: () => `
    <span class="hint">Tast inn svarene fra pasientens lisensierte skjema: 0 = svaret lengst til venstre (ingen problemer), 4 = lengst til høyre (ekstreme problemer).</span>
    ${def.subscales.map(sub => `
    <div class="sub-h">${sub.head} (${sub.key}1–${sub.key}${sub.n})</div>
    <div class="kitems">${codes(sub).map(c => itemRow(def.id, c, c, 4, itemText(def.texts, c))).join("")}</div>`).join("")}
    <div class="sub-h">Forrige delskårer (valgfritt)</div>
    <div class="grid">${def.textOrder.map(k => inputF(`${def.id}-prev${k}`, "prev" + k, cap(def.subscales.find(x => x.key === k).label), "/100", { int: true, ph: "0–100" })).join("")}</div>`,
    result(s) {
      const S = scoreAll(def, s); if (!S.some(x => x.answered)) return null;
      const valid = S.filter(x => x.score != null).length;
      return {
        tone: "none", big: `${valid}/5`,
        main: S.map(x => `${cap(x.label)} ${x.score ?? "–"}`).join(" · "),
        sub: `0 = ekstreme problemer, 100 = ingen problemer${valid < 5 ? ` · ${5 - valid} delskår${5 - valid > 1 ? "er" : ""} mangler svar` : ""}`
      };
    },
    toText(s) {
      const S = scoreAll(def, s); if (!S.some(x => x.score != null)) return null;
      const list = S.map(x => x.score != null ? `${x.label} ${x.score}`
        : x.answered ? `${x.label} ikke skåret (for mange ubesvarte ledd)` : `${x.label} ikke besvart`);
      const out = [`${def.name} (0 = ekstreme problemer, 100 = ingen problemer): ${list.join(", ")}.`, def.interpretation];
      const c = changeText(def, s); if (c) out.push(c);
      return out.join("\n");
    },
    guide: def.guide
  };
}
