/* Byggeklosser for skjemaene. Felt bindes til tilstanden via data-k="nøkkel" (se bind() i app.js). */

export const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* «Ta tid»-knapp til et tidsfelt. timer = { max: makstid i sekunder, best: true for best av flere forsøk }.
   Panelet ligger i js/timer.js. */
const timerBtn = (id, label, t) => `<button type="button" class="tbtn" data-timer="up" data-for="${id}" data-title="${esc(label)}"${t.max ? ` data-max="${t.max}"` : ""}${t.best ? " data-best" : ""}><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13.5" r="7.5"/><path d="M12 13.5v-4M9.5 2.5h5M12 2.5V6"/></svg>Ta tid<span class="sr">: ${esc(label)}</span></button>`;

export function inputF(id, k, label, unit, opts = {}) {
  return `<div class="field"><label class="lbl" for="${id}">${label}</label>
    <div class="inp"><input type="text" inputmode="${opts.int ? "numeric" : "decimal"}" id="${id}" data-k="${k}" placeholder="${opts.ph || ""}" autocomplete="off">${unit ? `<span class="unit">${unit}</span>` : ""}</div>${opts.timer ? timerBtn(id, label, opts.timer) : ""}
    ${opts.hint ? `<span class="hint">${opts.hint}</span>` : ""}</div>`;
}

export function radioF(name, k, label, options) {
  return `<div class="field"><span class="lbl">${label}</span><div class="seg">${options.map(([v, t], i) =>
    `<label><input type="radio" name="${name}" id="${name}-${i}" data-k="${k}" value="${v}"> ${t}</label>`).join("")}</div></div>`;
}

export function checkF(id, k, label) {
  return `<div class="seg"><label><input type="checkbox" id="${id}" data-k="${k}"> ${label}</label></div>`;
}

export const AIDS = [["ingen", "Ingen"], ["stokk/krykke", "Stokk/krykke"], ["rullator", "Rullator"], ["annet hjelpemiddel", "Annet"]];
