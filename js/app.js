/* ============================================================
   Testbank – kjerne (DOM)
   Testene ligger i js/modules/<id>.js og er registrert i js/registry.js.
   Hver modul: { id, name, category, status, title, meta, initState(),
     form(s) -> HTML, paint?(card, s), result(s, p) -> {tone, big, main, sub} | null,
     toText(s, p) -> string | null, guide -> HTML }
   p = felles profil {age, sex} (kun i minnet).
   Skjemafelt bindes automatisk via data-k="nøkkel".
   Ingen lagring av data: søk, sammenfelte kort og valg ligger bare i minnet.
   ============================================================ */
import { TESTS, CATEGORIES, VERSION, byId, libraryOrder, dipsBlocks, testStatus } from "./registry.js";
import { esc, inputF, radioF } from "./lib/form.js";

/* ---------- App (kun minne) ---------- */
const app = { selected: ["cfs"], states: {}, profile: { age: "", sex: "" }, refreshers: [], folded: new Set(), libOpen: true };
const $ = id => document.getElementById(id);

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

const toneVar = r => r.tone === "lvl" ? `var(--l${r.lvl})` : `var(--${{ ok: "ok", warn: "warn", crit: "crit" }[r.tone] || "muted"})`;

function paintResult(box, r) {
  if (!r) { box.className = "result empty"; box.style.removeProperty("--c"); box.textContent = "Fyll inn resultat for å se tolkning."; return; }
  box.className = "result";
  box.style.setProperty("--c", toneVar(r));
  box.innerHTML = `<span class="num">${esc(r.big)}</span>
    <span><span class="r-main">${esc(r.main)}</span><br><span class="r-sub">${esc(r.sub || "")}</span></span>`;
}

function renderProfile() {
  const el = $("profile");
  el.innerHTML = `
    <div class="card-head"><h3>Alder og kjønn</h3><span class="meta">Brukes for normverdier</span></div>
    <div class="grid">
      ${inputF("p-age", "age", "Alder", "år", { int: true, ph: "f.eks. 74" })}
      ${radioF("p-sex", "sex", "Kjønn", [["kvinne", "Kvinne"], ["mann", "Mann"]])}
    </div>
    <span class="hint">Oppgi bare alder i år, ikke fødselsdato.</span>`;
  bind(el, app.profile, () => { app.refreshers.forEach(fn => fn()); updateOutput(); });
}

/* ---------- Bibliotek: søk og sammenfelling ---------- */
function renderLib() {
  $("lib").innerHTML = CATEGORIES.map(c => `
    <div class="cat"><div class="cat-name">${c}</div><div class="chips">${
      TESTS.filter(t => t.category === c).map(t => t.status === "aktiv"
        ? `<button type="button" class="chip" id="chip-${t.id}" data-id="${t.id}" data-q="${esc(`${t.name} ${t.title} ${c}`.toLowerCase())}" aria-pressed="${app.selected.includes(t.id)}">${t.name}</button>`
        : `<button type="button" class="chip" disabled title="Planlagt" data-q="${esc(`${t.name} ${c}`.toLowerCase())}">${t.name}<small>kommer</small></button>`).join("")}</div></div>`).join("");
  filterLib();
}

function filterLib() {
  const q = $("lib-q").value.trim().toLowerCase();
  let any = false;
  $("lib").querySelectorAll(".cat").forEach(cat => {
    let n = 0;
    cat.querySelectorAll(".chip").forEach(ch => { const hit = !q || ch.dataset.q.includes(q); ch.hidden = !hit; if (hit) n++; });
    cat.hidden = !n; if (n) any = true;
  });
  $("lib-none").hidden = any;
}

function paintLibToggle() {
  $("lib-body").hidden = !app.libOpen;
  $("lib-toggle").textContent = app.libOpen ? "Skjul" : "Vis alle tester";
  $("lib-toggle").setAttribute("aria-expanded", app.libOpen);
  const names = app.selected.map(id => byId(id).name);
  const sum = $("lib-sum");
  sum.hidden = app.libOpen;
  sum.innerHTML = names.length ? `<span>Valgt: <b>${esc(names.join(", "))}</b></span><span class="link">Endre</span>` : `<span>Ingen tester valgt</span><span class="link">Velg</span>`;
}
const setLib = open => { app.libOpen = open; paintLibToggle(); if (open) $("lib-q").focus({ preventScroll: true }); };

/* ---------- Hurtignavigasjon ---------- */
/* «ferdig» betyr at testen gir DIPS-tekst. KOOS/HOOS kan gi tekst før alle delskårer er fylt ut. */
const STATUS_LABEL = { tom: "ikke startet", delvis: "delvis utfylt", ferdig: "med i DIPS-teksten" };

function renderNav() {
  const nav = $("jump");
  nav.hidden = !app.selected.length;
  nav.innerHTML = app.selected.map(id => `<a class="jump-i" href="#card-${id}" id="jump-${id}"><i class="dot"></i><span>${esc(byId(id).name)}</span><b class="jv"></b></a>`).join("");
}

function paintNav(t, st) {
  const a = $("jump-" + t.id); if (!a) return;
  a.dataset.st = st.status;
  const v = st.r && st.r.big !== "…" ? st.r.big : "";
  a.querySelector(".jv").textContent = v;
  a.style.setProperty("--c", st.r && st.status === "ferdig" ? toneVar(st.r) : "var(--muted)");
  a.setAttribute("aria-label", `${t.name}: ${STATUS_LABEL[st.status]}${v ? `, ${v}` : ""}`);
}

/* ---------- Kort ---------- */
/* Radiogrupper i et kort (innerste nivå), til fremdriften */
const radioGroups = card => [...card.querySelectorAll('.card-body [role="radiogroup"], .card-body fieldset')]
  .filter(g => g.querySelector('input[type="radio"]') && !g.querySelector('[role="radiogroup"], fieldset'));

function paintHead(card, t, st) {
  const badge = card.querySelector(".badge");
  if (st.r && st.r.big !== "…") {
    badge.hidden = false; badge.textContent = st.r.big;
    badge.style.setProperty("--c", st.status === "ferdig" ? toneVar(st.r) : "var(--muted)");
    badge.title = st.r.main;
  } else badge.hidden = true;
  const groups = radioGroups(card), prog = card.querySelector(".prog");
  if (groups.length >= 4) {
    const n = groups.filter(g => g.querySelector("input:checked")).length;
    prog.hidden = false;
    prog.querySelector(".prog-txt").textContent = `${n} av ${groups.length} besvart`;
    prog.querySelector("i").style.width = `${Math.round(n / groups.length * 100)}%`;
  } else prog.hidden = true;
}

function fold(card, id, on) {
  card.classList.toggle("folded", on);
  on ? app.folded.add(id) : app.folded.delete(id);
  const b = card.querySelector(".fold");
  b.setAttribute("aria-expanded", !on);
  b.setAttribute("aria-label", `${on ? "Vis" : "Fell sammen"} ${byId(id).name}`);
  if (on && card.getBoundingClientRect().top < 0) card.scrollIntoView({ block: "start" });
}

function renderForms() {
  const box = $("forms");
  box.innerHTML = ""; app.refreshers = [];
  if (!app.selected.length) box.innerHTML = `<p class="empty-note">Ingen tester valgt. Velg en test over for å starte.</p>`;
  app.selected.forEach(id => {
    const t = byId(id);
    if (!app.states[id]) app.states[id] = t.initState();
    const s = app.states[id];
    const card = document.createElement("article");
    card.className = "card test";
    card.id = "card-" + id;
    card.innerHTML = `<div class="card-head">
        <div class="ch-row"><h3 title="${esc(t.title)}">${t.title}</h3>
          <span class="badge num" hidden></span>
          <button type="button" class="fold" aria-expanded="true" aria-controls="body-${id}" aria-label="Fell sammen ${esc(t.name)}"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button></div>
        <div class="prog" hidden><span class="prog-txt"></span><span class="prog-bar"><i></i></span></div>
      </div>
      <div class="card-body" id="body-${id}"><span class="meta">${t.category} · ${t.meta}</span>
      ${t.form(s)}<div class="result empty" id="res-${t.id}"></div>
      <details class="guide"><summary>Veiledning og kilder</summary>${t.guide}</details></div>`;
    box.appendChild(card);
    if (app.folded.has(id)) fold(card, id, true);
    card.querySelector(".fold").addEventListener("click", () => fold(card, id, !card.classList.contains("folded")));
    const refresh = () => {
      const st = testStatus(t, s, app.profile);
      paintResult(card.querySelector(`#res-${t.id}`), st.r);
      card.querySelectorAll("label.lvl").forEach(l => l.classList.toggle("on", l.querySelector("input").checked));
      if (t.paint) t.paint(card, s);
      paintHead(card, t, st);
      paintNav(t, st);
    };
    app.refreshers.push(refresh);
    bind(card, s, () => { refresh(); updateOutput(); });
  });
  renderNav();
  app.refreshers.forEach(fn => fn());
  paintLibToggle();
  updateOutput();
}

function updateOutput() {
  const blocks = dipsBlocks(app.selected, app.states, app.profile);
  const ta = $("dips");
  ta.value = blocks.join("\n\n");
  ta.placeholder = "Fyll ut minst én test for å få tekst her.";
  $("copy").disabled = !blocks.length;
}

$("lib").addEventListener("click", e => {
  const b = e.target.closest(".chip[data-id]"); if (!b) return;
  const id = b.dataset.id;
  app.selected = app.selected.includes(id) ? app.selected.filter(x => x !== id) : [...app.selected, id];
  // behold bibliotekets rekkefølge
  app.selected = libraryOrder(app.selected);
  b.setAttribute("aria-pressed", app.selected.includes(id));
  renderForms();
});
$("lib-q").addEventListener("input", filterLib);
$("lib-q").addEventListener("keydown", e => { if (e.key === "Escape") { e.target.value = ""; filterLib(); } });
$("lib-toggle").addEventListener("click", () => setLib(!app.libOpen));
$("lib-sum").addEventListener("click", () => setLib(true));

/* Høyden på toppen + navigasjonen, så kortenes sticky hode og hopp-mål havner rett under */
new ResizeObserver(([e]) => document.documentElement.style.setProperty("--stick", `${Math.ceil(e.target.getBoundingClientRect().height)}px`)).observe($("sticky"));

const statusEl = $("status");
function flash(msg) { statusEl.textContent = msg; clearTimeout(flash.t); flash.t = setTimeout(() => statusEl.textContent = "", 3500); }

const copyBtn = $("copy");
copyBtn.addEventListener("click", () => {
  const ta = $("dips");
  const fallback = () => { ta.focus(); ta.select(); flash("Teksten er markert. Kopier med Ctrl+C eller hold inne og velg Kopier."); };
  const done = () => {
    flash("Kopiert. Lim inn i DIPS-notatet.");
    copyBtn.classList.add("done"); copyBtn.textContent = "Kopiert ✓";
    clearTimeout(done.t); done.t = setTimeout(() => { copyBtn.classList.remove("done"); copyBtn.textContent = "Kopier til DIPS"; }, 2000);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ta.value).then(done, fallback);
  else fallback();
});

const resetBtn = $("reset");
let armed = false;
const disarm = () => { armed = false; resetBtn.textContent = "Nullstill"; resetBtn.classList.remove("armed"); };
resetBtn.addEventListener("click", () => {
  if (!armed) {
    armed = true; resetBtn.textContent = "Bekreft?"; resetBtn.classList.add("armed");
    flash("Trykk Bekreft for å tømme alle felt."); clearTimeout(disarm.t); disarm.t = setTimeout(disarm, 4000); return;
  }
  clearTimeout(disarm.t); disarm();
  app.states = {}; app.profile = { age: "", sex: "" }; app.folded.clear();
  renderProfile(); renderForms(); flash("Alt er tømt.");
});

$("ver").textContent = "v" + VERSION;
renderLib();
renderProfile();
renderForms();

/* Offline: service workeren cacher bare appens egne filer (se sw.js) */
if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("sw.js"));
