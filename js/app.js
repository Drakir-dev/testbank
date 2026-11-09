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
import { TESTS, CATEGORIES, VERSION, PACKAGES, byId, libraryOrder, dipsBlocks, testStatus, missingProfile, packageOn, togglePackage } from "./registry.js";
import { esc } from "./lib/form.js";
import { nextUnanswered, skipped } from "./lib/flyt.js";

/* ---------- App (kun minne) ---------- */
const app = { selected: ["cfs"], states: {}, profile: { age: "", sex: "" }, refreshers: [], folded: new Set(), libOpen: true, autoFold: true };
const $ = id => document.getElementById(id);
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const stickH = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--stick")) || 0;

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

/* ---------- Profil: én kompakt linje ---------- */
function renderProfile() {
  const el = $("profile");
  el.innerHTML = `
    <div class="prof-row">
      <span class="prof-h">Pasient</span>
      <label class="inp prof-age"><span class="sr">Alder</span>
        <input type="text" inputmode="numeric" id="p-age" data-k="age" placeholder="Alder" autocomplete="off"><span class="unit">år</span></label>
      <div class="seg prof-sex" role="radiogroup" aria-label="Kjønn">
        <label><input type="radio" name="p-sex" id="p-sex-0" data-k="sex" value="kvinne"> Kvinne</label>
        <label><input type="radio" name="p-sex" id="p-sex-1" data-k="sex" value="mann"> Mann</label>
      </div>
    </div>
    <span class="hint">Pasientens alder i år og kjønn, bare til normverdier.</span>`;
  bind(el, app.profile, () => { app.refreshers.forEach(fn => fn()); updateOutput(); });
}

const NEED_TEXT = { age: "Alder", sex: "Kjønn", both: "Alder og kjønn" };
function goToProfile(missing) {
  const target = missing[0] === "sex" ? $("p-sex-0") : $("p-age");
  $("profile").scrollIntoView({ block: "center", behavior: reduced() ? "instant" : "smooth" });
  target.focus({ preventScroll: true });
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

/* ---------- Testpakker ---------- */
function renderPkgs() {
  $("pkgs").innerHTML = PACKAGES.map(p => `<button type="button" class="pkg" id="pkg-${p.id}" data-pkg="${p.id}" aria-pressed="false"
      title="${esc(p.ids.map(id => byId(id).name).join(", "))}"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/></svg>${esc(p.name)}<small>${p.ids.length}</small></button>`).join("");
}
function paintPkgs() {
  PACKAGES.forEach(p => $("pkg-" + p.id).setAttribute("aria-pressed", packageOn(app.selected, p)));
}
/* Urørt = tilstanden er lik initState(), eller testen er ikke åpnet ennå */
const isUntouched = id => !app.states[id] || JSON.stringify(app.states[id]) === JSON.stringify(byId(id).initState());

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
/* Åpner brukeren biblioteket selv, feller det seg ikke automatisk sammen før neste testvalg */
const setLib = (open, byUser = true) => {
  app.libOpen = open; if (open && byUser) app.autoFold = false;
  paintLibToggle();
  if (open && byUser) $("lib-q").focus({ preventScroll: true });
};

/* Første utfylling etter et testvalg feller biblioteket sammen, uten at feltet du trykket på, flytter seg */
function autoFoldLib(e) {
  if (!app.autoFold || !app.libOpen) return;
  app.autoFold = false;
  const before = e.target.getBoundingClientRect().top;
  setLib(false, false);
  window.scrollBy({ top: e.target.getBoundingClientRect().top - before, behavior: "instant" });
}

/* ---------- Hurtignavigasjon ---------- */
const STATUS_LABEL = { tom: "ikke startet", delvis: "delvis utfylt", ferdig: "med i DIPS-teksten" };

function renderNav() {
  const nav = $("jump");
  nav.hidden = !app.selected.length;
  nav.innerHTML = app.selected.map(id => `<a class="jump-i" href="#card-${id}" id="jump-${id}"><i class="dot"></i><span>${esc(byId(id).name)}</span><b class="jv"></b></a>`).join("");
  paintNavFade();
}

function paintNav(t, st) {
  const a = $("jump-" + t.id); if (!a) return;
  a.dataset.st = st.status;
  const v = st.r && st.r.big !== "…" ? st.r.big : "";
  a.querySelector(".jv").textContent = v;
  a.style.setProperty("--c", st.r && st.status === "ferdig" ? toneVar(st.r) : "var(--muted)");
  a.setAttribute("aria-label", `${t.name}: ${STATUS_LABEL[st.status]}${v ? `, ${v}` : ""}`);
}

/* Fade i høyre kant når det finnes flere tester til høyre */
function paintNavFade() {
  const n = $("jump");
  n.classList.toggle("more", n.scrollLeft + n.clientWidth < n.scrollWidth - 4);
}

/* Markerer testen du står i, og ruller raden så den er synlig */
let activeId = null, cardObserver = null;
const visible = new Set();
function setActive(id) {
  if (id === activeId) return;
  activeId = id;
  document.querySelectorAll(".jump-i").forEach(a => a.toggleAttribute("aria-current", a.id === "jump-" + id));
  const a = $("jump-" + id), nav = $("jump"); if (!a) return;
  if (a.offsetLeft < nav.scrollLeft || a.offsetLeft + a.offsetWidth > nav.scrollLeft + nav.clientWidth)
    nav.scrollTo({ left: a.offsetLeft - 16, behavior: reduced() ? "instant" : "smooth" });
}
function observeCards() {
  if (cardObserver) cardObserver.disconnect();
  visible.clear(); activeId = null;
  cardObserver = new IntersectionObserver(entries => {
    entries.forEach(e => e.isIntersecting ? visible.add(e.target.id.slice(5)) : visible.delete(e.target.id.slice(5)));
    const id = app.selected.find(x => visible.has(x));
    if (id) setActive(id);
  }, { rootMargin: `-${Math.round(stickH()) + 8}px 0px -55% 0px` });
  document.querySelectorAll(".card.test").forEach(c => cardObserver.observe(c));
}

/* ---------- Kort ---------- */
/* Radiogrupper i et kort (innerste nivå), til fremdrift og «neste ubesvarte» */
const radioGroups = card => [...card.querySelectorAll('.card-body [role="radiogroup"], .card-body fieldset')]
  .filter(g => g.querySelector('input[type="radio"]') && !g.querySelector('[role="radiogroup"], fieldset'));
const answeredOf = groups => groups.map(g => !!g.querySelector("input:checked"));

/* Scroll et ledd inn rett under toppen og korthodet */
function scrollToGroup(card, g, focus = false) {
  const head = card.querySelector(".card-head").getBoundingClientRect().height;
  window.scrollTo({ top: g.getBoundingClientRect().top + scrollY - stickH() - head - 12, behavior: reduced() ? "instant" : "smooth" });
  if (focus) (g.querySelector("input:checked") || g.querySelector("input")).focus({ preventScroll: true });
}

function paintHead(card, t, st) {
  const badge = card.querySelector(".badge");
  if (st.r && st.r.big !== "…") {
    badge.hidden = false; badge.textContent = st.r.big;
    badge.style.setProperty("--c", st.status === "ferdig" ? toneVar(st.r) : "var(--muted)");
    badge.title = st.r.main;
  } else badge.hidden = true;
  const groups = radioGroups(card), prog = card.querySelector(".prog");
  if (groups.length >= 4) {
    const ans = answeredOf(groups), n = ans.filter(Boolean).length;
    prog.hidden = false;
    prog.querySelector(".prog-txt").textContent = `${n} av ${groups.length} besvart`;
    prog.querySelector("i").style.width = `${Math.round(n / groups.length * 100)}%`;
    prog.querySelector(".next-btn").hidden = !n || n === groups.length;
    const sk = skipped(ans);
    groups.forEach((g, i) => g.classList.toggle("skipped", sk[i]));
  } else prog.hidden = true;
  const miss = missingProfile(t.id, app.profile), need = card.querySelector(".need");
  need.hidden = !miss.length;
  if (miss.length) need.querySelector(".need-txt").textContent = `${NEED_TEXT[miss.length > 1 ? "both" : miss[0]]} brukes til normverdier.`;
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
        <div class="prog" hidden><span class="prog-txt"></span><span class="prog-bar"><i></i></span><button type="button" class="link next-btn" hidden>Neste ubesvarte</button></div>
      </div>
      <div class="card-body" id="body-${id}"><span class="meta">${t.category} · ${t.meta}</span>
      <div class="need" hidden><span class="need-txt"></span><button type="button" class="link need-go">Fyll inn</button></div>
      ${t.form(s)}<div class="result empty" id="res-${t.id}"></div>
      <details class="guide"><summary>Veiledning og kilder</summary>${t.guide}</details></div>`;
    box.appendChild(card);
    if (app.folded.has(id)) fold(card, id, true);
    card.querySelector(".fold").addEventListener("click", () => fold(card, id, !card.classList.contains("folded")));
    card.querySelector(".need-go").addEventListener("click", () => goToProfile(missingProfile(id, app.profile)));
    card.querySelector(".next-btn").addEventListener("click", () => {
      const groups = radioGroups(card), i = nextUnanswered(answeredOf(groups));
      if (i >= 0) scrollToGroup(card, groups[i], true);
    });
    /* Etter et svar på et ubesvart ledd: gli videre til neste ubesvarte.
       Fanges i capture på «input», som kommer før «change», altså før bind() oppdaterer tilstanden. */
    card.addEventListener("input", e => {
      if (e.target.type !== "radio") return;
      const groups = radioGroups(card); if (groups.length < 4) return;
      const idx = groups.findIndex(g => g.contains(e.target));
      if (idx < 0) return;
      const k = e.target.dataset.k;
      if (k && s[k] !== "" && s[k] != null) return;   // leddet var besvart fra før: brukeren retter, ikke hopp
      setTimeout(() => {
        const next = nextUnanswered(answeredOf(groups), idx);
        if (next > idx) scrollToGroup(card, groups[next]);
      }, 250);
    }, true);
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
  paintPkgs();
  TESTS.forEach(t => { const ch = $("chip-" + t.id); if (ch) ch.setAttribute("aria-pressed", app.selected.includes(t.id)); });
  updateOutput();
  observeCards();
}

function updateOutput() {
  const blocks = dipsBlocks(app.selected, app.states, app.profile);
  const ta = $("dips");
  ta.value = blocks.join("\n\n");
  ta.placeholder = "Fyll ut minst én test for å få tekst her.";
  $("copy").disabled = $("show").disabled = !blocks.length;
  $("show-n").textContent = blocks.length ? ` (${blocks.length})` : "";
  $("sheet-text").textContent = ta.value;
}

$("lib").addEventListener("click", e => {
  const b = e.target.closest(".chip[data-id]"); if (!b) return;
  const id = b.dataset.id;
  app.selected = app.selected.includes(id) ? app.selected.filter(x => x !== id) : [...app.selected, id];
  // behold bibliotekets rekkefølge
  app.selected = libraryOrder(app.selected);
  b.setAttribute("aria-pressed", app.selected.includes(id));
  app.autoFold = true;
  renderForms();
});
$("pkgs").addEventListener("click", e => {
  const b = e.target.closest(".pkg"); if (!b) return;
  const pkg = PACKAGES.find(p => p.id === b.dataset.pkg);
  const was = packageOn(app.selected, pkg);
  app.selected = togglePackage(app.selected, pkg, isUntouched);
  app.autoFold = true;
  renderForms();
  const kept = was ? pkg.ids.filter(id => app.selected.includes(id)).length : 0;
  const keptTxt = kept === 1 ? "1 utfylt test er beholdt" : `${kept} utfylte tester er beholdt`;
  flash(was ? (kept ? `${pkg.name} fjernet. ${keptTxt}.` : `${pkg.name} fjernet.`) : `${pkg.name} lagt til.`);
});
$("lib-q").addEventListener("input", filterLib);
$("lib-q").addEventListener("keydown", e => { if (e.key === "Escape") { e.target.value = ""; filterLib(); } });
$("lib-toggle").addEventListener("click", () => setLib(!app.libOpen));
$("lib-sum").addEventListener("click", () => setLib(true));
$("forms").addEventListener("input", autoFoldLib, true);
$("forms").addEventListener("change", autoFoldLib, true);
$("jump").addEventListener("scroll", paintNavFade, { passive: true });

/* Høyden på toppen + navigasjonen, så kortenes sticky hode og hopp-mål havner rett under */
let lastStick = 0;
new ResizeObserver(([e]) => {
  const h = Math.ceil(e.target.getBoundingClientRect().height);
  document.documentElement.style.setProperty("--stick", `${h}px`);
  if (h !== lastStick) { lastStick = h; observeCards(); paintNavFade(); }
}).observe($("sticky"));

const statusEl = $("status");
function flash(msg) { statusEl.textContent = msg; clearTimeout(flash.t); flash.t = setTimeout(() => statusEl.textContent = "", 3500); }

/* ---------- Kopier (bunnlinjen og tekstpanelet) ---------- */
function copyText(btn, selectFallback) {
  const text = $("dips").value;
  const fallback = () => { selectFallback(); flash("Teksten er markert. Kopier med Ctrl+C eller hold inne og velg Kopier."); };
  const done = () => {
    flash("Kopiert. Lim inn i DIPS-notatet.");
    if (!btn.dataset.html) btn.dataset.html = btn.innerHTML;
    btn.classList.add("done"); btn.textContent = "Kopiert ✓";
    clearTimeout(btn._t); btn._t = setTimeout(() => { btn.classList.remove("done"); btn.innerHTML = btn.dataset.html; }, 2000);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback);
  else fallback();
}
$("copy").addEventListener("click", e => copyText(e.currentTarget, () => { const ta = $("dips"); ta.focus(); ta.select(); }));
$("sheet-copy").addEventListener("click", e => copyText(e.currentTarget, () => getSelection().selectAllChildren($("sheet-text"))));

/* Tekstpanel: lukkes med Esc (innebygd), Lukk eller trykk utenfor */
const sheet = $("sheet");
$("show").addEventListener("click", () => sheet.showModal());
$("sheet-close").addEventListener("click", () => sheet.close());
sheet.addEventListener("click", e => { if (e.target === sheet) sheet.close(); });

const resetBtn = $("reset");
let armed = false;
const disarm = () => { armed = false; resetBtn.textContent = "Nullstill"; resetBtn.classList.remove("armed"); };
resetBtn.addEventListener("click", () => {
  if (!armed) {
    armed = true; resetBtn.textContent = "Bekreft?"; resetBtn.classList.add("armed");
    flash("Trykk Bekreft for å tømme alle felt."); clearTimeout(disarm.t); disarm.t = setTimeout(disarm, 4000); return;
  }
  clearTimeout(disarm.t); disarm();
  app.states = {}; app.profile = { age: "", sex: "" }; app.folded.clear(); app.autoFold = true;
  renderProfile(); renderForms(); flash("Alt er tømt.");
});

$("ver").textContent = "v" + VERSION;
renderPkgs();
renderLib();
renderProfile();
renderForms();

/* Offline: service workeren cacher bare appens egne filer (se sw.js) */
if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("sw.js"));
