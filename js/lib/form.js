/* Byggeklosser for skjemaene. Felt bindes til tilstanden via data-k="nøkkel" (se bind() i app.js). */

export const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export function inputF(id, k, label, unit, opts = {}) {
  return `<div class="field"><label class="lbl" for="${id}">${label}</label>
    <div class="inp"><input type="text" inputmode="${opts.int ? "numeric" : "decimal"}" id="${id}" data-k="${k}" placeholder="${opts.ph || ""}" autocomplete="off">${unit ? `<span class="unit">${unit}</span>` : ""}</div>
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
