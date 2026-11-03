/* ============================================================
   Testbank – kjerne (DOM)
   Testene ligger i js/modules/<id>.js og er registrert i js/registry.js.
   Hver modul: { id, name, category, status, title, meta, initState(),
     form(s) -> HTML, paint?(card, s), result(s, p) -> {tone, big, main, sub} | null,
     toText(s, p) -> string | null, guide -> HTML }
   p = felles profil {age, sex} (kun i minnet).
   Skjemafelt bindes automatisk via data-k="nøkkel".
   Ingen lagring av data.
   ============================================================ */
import { TESTS, CATEGORIES, byId, libraryOrder, dipsBlocks } from "./registry.js";
import { esc, inputF, radioF } from "./lib/form.js";

/* ---------- App (kun minne) ---------- */
const app = { selected: ["cfs"], states: {}, profile: { age: "", sex: "" }, refreshers: [] };

/* Generisk binding: data-k → state */
function bind(el, s, onChange) {
  el.querySelectorAll("[data-k]").forEach(i => {
    const k = i.dataset.k;
    if (i.type === "radio") i.checked = String(s[k]) === i.value;
    else if (i.type === "checkbox") i.checked = i.dataset.multi ? s[k].includes(i.value) : !!s[k];
    else i.value = s[k] ?? "";
  });
  const read = e => {
    const i = e.target, k = i.dataset && i.dataset.k; if (!k) return;
    if (i.type === "radio") { if (i.checked) s[k] = i.value; }
    else if (i.type === "checkbox") {
      if (i.dataset.multi) s[k] = [...el.querySelectorAll(`[data-k="${k}"]`)].filter(x => x.checked).map(x => x.value);
      else s[k] = i.checked;
    } else s[k] = i.value;
    onChange();
  };
  el.addEventListener("input", read);
  el.addEventListener("change", read);
}

function paintResult(box, r) {
  if (!r) { box.className = "result empty"; box.textContent = "Fyll inn resultat for å se tolkning."; return; }
  box.className = "result";
  const style = r.tone === "lvl" ? `--c:var(--l${r.lvl})` : "";
  box.innerHTML = `<span class="num ${r.tone !== "lvl" ? "t-" + r.tone : ""}" style="${style}">${esc(r.big)}</span>
    <span><span class="r-main">${esc(r.main)}</span><br><span class="r-sub">${esc(r.sub || "")}</span></span>`;
}

function renderProfile() {
  const el = document.getElementById("profile");
  el.innerHTML = `
    <div class="card-head"><h3>Alder og kjønn</h3><span class="meta">Brukes for normverdier</span></div>
    <div class="grid">
      ${inputF("p-age", "age", "Alder", "år", { int: true, ph: "f.eks. 74" })}
      ${radioF("p-sex", "sex", "Kjønn", [["kvinne", "Kvinne"], ["mann", "Mann"]])}
    </div>
    <span class="hint">Oppgi bare alder i år, ikke fødselsdato.</span>`;
  bind(el, app.profile, () => { app.refreshers.forEach(fn => fn()); updateOutput(); });
}

function renderLib() {
  document.getElementById("lib").innerHTML = CATEGORIES.map(c => `
    <div class="cat"><div class="cat-name">${c}</div><div class="chips">${
      TESTS.filter(t => t.category === c).map(t => t.status === "aktiv"
        ? `<button type="button" class="chip" id="chip-${t.id}" data-id="${t.id}" aria-pressed="${app.selected.includes(t.id)}">${t.name}</button>`
        : `<button type="button" class="chip" disabled title="Planlagt">${t.name}<small>kommer</small></button>`).join("")}</div></div>`).join("");
}

function renderForms() {
  const box = document.getElementById("forms");
  box.innerHTML = ""; app.refreshers = [];
  if (!app.selected.length) box.innerHTML = `<p class="hint">Ingen tester valgt. Trykk på en test over for å starte.</p>`;
  app.selected.forEach(id => {
    const t = byId(id);
    if (!app.states[id]) app.states[id] = t.initState();
    const s = app.states[id];
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `<div class="card-head"><h3>${t.title}</h3><span class="meta">${t.meta}</span></div>
      ${t.form(s)}<div class="result empty" id="res-${t.id}"></div>
      <details class="guide"><summary>Veiledning og kilder</summary>${t.guide}</details>`;
    box.appendChild(card);
    const refresh = () => {
      paintResult(card.querySelector(`#res-${t.id}`), t.result(s, app.profile));
      card.querySelectorAll("label.lvl").forEach(l => l.classList.toggle("on", l.querySelector("input").checked));
      if (t.paint) t.paint(card, s);
    };
    app.refreshers.push(refresh);
    bind(card, s, () => { refresh(); updateOutput(); });
    refresh();
  });
  updateOutput();
}

function updateOutput() {
  const blocks = dipsBlocks(app.selected, app.states, app.profile);
  const ta = document.getElementById("dips");
  ta.value = blocks.join("\n\n");
  ta.placeholder = "Fyll ut minst én test for å få tekst her.";
  document.getElementById("copy").disabled = !blocks.length;
}

document.getElementById("lib").addEventListener("click", e => {
  const b = e.target.closest(".chip[data-id]"); if (!b) return;
  const id = b.dataset.id;
  app.selected = app.selected.includes(id) ? app.selected.filter(x => x !== id) : [...app.selected, id];
  // behold bibliotekets rekkefølge
  app.selected = libraryOrder(app.selected);
  b.setAttribute("aria-pressed", app.selected.includes(id));
  renderForms();
});

const statusEl = document.getElementById("status");
function flash(msg) { statusEl.textContent = msg; clearTimeout(flash.t); flash.t = setTimeout(() => statusEl.textContent = "", 3500); }

document.getElementById("copy").addEventListener("click", () => {
  const ta = document.getElementById("dips");
  const fallback = () => { ta.focus(); ta.select(); flash("Teksten er markert. Kopier med Ctrl+C eller hold inne og velg Kopier."); };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ta.value).then(() => flash("Kopiert. Lim inn i DIPS-notatet."), fallback);
  else fallback();
});

const resetBtn = document.getElementById("reset");
let armed = false;
resetBtn.addEventListener("click", () => {
  if (!armed) { armed = true; resetBtn.textContent = "Bekreft"; flash("Trykk Bekreft for å tømme alle felt."); setTimeout(() => { armed = false; resetBtn.textContent = "Nullstill"; }, 4000); return; }
  armed = false; resetBtn.textContent = "Nullstill";
  app.states = {}; app.profile = { age: "", sex: "" };
  renderProfile(); renderForms(); flash("Alt er tømt.");
});

renderLib();
renderProfile();
renderForms();

/* Offline: service workeren cacher bare appens egne filer (se sw.js) */
if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("sw.js"));
