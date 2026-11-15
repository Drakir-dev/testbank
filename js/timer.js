/* Stoppeklokke og nedtelling (DOM). Knappene lages av inputF() i js/lib/form.js med valget timer:
     data-timer="up"    stoppeklokke. Valgfritt data-max (makstid i sekunder) og data-best (beste av flere forsøk).
     data-timer="sts"   nedtelling (data-seconds) med teller for reisinger. Antallet settes i feltet.
     data-timer="walk"  nedtelling med teller for lengder og pauser. Distansen = lengder × banelengde (data-lane,
                        kan endres før start) + restmeter. data-stops er feltet for antall pauser.
   data-for er feltet som får verdien, data-title er feltnavnet.
   Panelet setter verdien med en input-hendelse, så bind() i app.js oppdaterer tilstanden som om brukeren
   hadde tastet selv. Ingenting lagres: tid, forsøk og tellere ligger bare i minnet til panelet lukkes.
   Regningen ligger i js/lib/tid.js. */
import { capMs, reachedMax, secText, bestMs, remainingMs, countdownText, clockText, walkDistance, plural } from "./lib/tid.js";
import { num } from "./lib/format.js";

const $ = id => document.getElementById(id);
const RESTART_GUARD_MS = 700;   // et dobbelttrykk på Stopp skal ikke starte klokken på nytt
const PLUS = { sts: "+1 reising", walk: "+1 lengde" };

export function initTimer(flash) {
  const dlg = $("timer"), main = $("timer-main"), use = $("timer-use"), foot = $("timer-foot");
  const timeEl = $("timer-time"), unit = $("timer-unit"), msg = $("timer-msg"), tries = $("timer-tries");
  const setup = $("timer-setup"), laneIn = $("timer-lane"), countEl = $("timer-count"), row = $("timer-row");
  const restBox = $("timer-rest"), restIn = $("timer-restm"), sum = $("timer-sum");
  let cfg = null, t0 = 0, tick = null, stoppedAt = 0, attempts = [], lock = null, audio = null;
  let count = 0, pauses = 0, log = [], lane = 0;

  const st = () => dlg.dataset.st;
  const state = s => { dlg.dataset.st = s; };
  const down = () => cfg.mode !== "up";

  /* Skjermen holdes våken mens klokken går, der nettleseren støtter det */
  async function keepAwake(on) {
    try {
      if (on && "wakeLock" in navigator) lock = await navigator.wakeLock.request("screen");
      else if (!on && lock) { await lock.release(); lock = null; }
    } catch { lock = null; }
  }
  /* Nettleseren slipper låsen når appen legges i bakgrunnen. Ta den igjen når appen er framme og klokken går. */
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && st() === "running" && dlg.open) keepAwake(true); });

  /* Lyden må opprettes i et trykk for å virke på iPhone */
  function armAudio() {
    if (!audio) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) try { audio = new AC(); } catch { audio = null; } }
    if (audio && audio.state === "suspended") audio.resume();
  }

  /* Signal når tiden er ute: vibrasjon (Android) og to korte pip laget i appen, uten lydfil */
  async function signal() {
    try { if (navigator.vibrate) navigator.vibrate([250, 120, 250]); } catch { /* ikke støttet */ }
    if (!audio) return;
    try {
      if (audio.state !== "running") await audio.resume();
      [0, 0.3].forEach(at => {
        const osc = audio.createOscillator(), gain = audio.createGain();
        osc.frequency.value = 880; gain.gain.value = 0.25;
        osc.connect(gain); gain.connect(audio.destination);
        osc.start(audio.currentTime + at); osc.stop(audio.currentTime + at + 0.2);
      });
    } catch { /* lyd er ikke tilgjengelig */ }
  }

  const halt = () => { clearInterval(tick); tick = null; keepAwake(false); };

  function setField(id, value) {
    const inp = id && $(id); if (!inp) return false;
    inp.value = value;
    inp.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  }

  /* ---------- Stoppeklokke (teller opp) ---------- */
  const elapsed = () => capMs(Date.now() - t0, cfg.max);

  function paintTries() {
    tries.hidden = !(cfg.best && attempts.length);
    const best = bestMs(attempts);
    tries.innerHTML = attempts.map((a, i) => `<li${a === best ? ' class="best"' : ""}>Forsøk ${i + 1}: ${secText(a)} s</li>`).join("");
  }

  function startUp() {
    if (cfg.max) armAudio();   // trengs bare når klokken kan stoppe selv
    t0 = Date.now(); msg.textContent = ""; foot.hidden = true;
    main.textContent = "Stopp"; state("running"); keepAwake(true);
    tick = setInterval(() => {
      timeEl.textContent = secText(elapsed());
      if (reachedMax(Date.now() - t0, cfg.max)) stopUp(true);
    }, 50);
  }

  function stopUp(atMax = false) {
    const ms = elapsed();
    halt(); stoppedAt = Date.now();
    attempts.push(ms);
    timeEl.textContent = secText(ms);
    if (atMax) { msg.textContent = `Makstiden på ${cfg.max} s er nådd.`; signal(); }
    paintTries();
    const val = cfg.best ? bestMs(attempts) : ms;
    use.dataset.value = secText(val);
    use.textContent = cfg.best && attempts.length > 1 ? `Bruk beste (${secText(val)} s)` : `Bruk tiden (${secText(val)} s)`;
    use.disabled = false; foot.hidden = false;
    main.textContent = cfg.best ? "Nytt forsøk" : "Start på nytt"; state("stopped");
  }

  /* ---------- Nedtelling med teller ---------- */
  function paintDown() {
    countEl.textContent = cfg.mode === "sts" ? plural(count, "reising", "reisinger")
      : `${plural(count, "lengde", "lengder")} à ${lane} m · ${plural(pauses, "pause", "pauser")}`;
    $("timer-undo").disabled = !log.length;
    if (st() !== "done") return;
    if (cfg.mode === "sts") {
      foot.hidden = !count; use.disabled = false;
      use.dataset.value = String(count); use.textContent = `Bruk antall (${count})`;
      return;
    }
    const restRaw = restIn.value.trim(), rest = restRaw === "" ? 0 : num(restRaw);
    const dist = rest == null ? null : walkDistance(count, lane, rest);
    sum.textContent = dist == null ? `Restmeter må være et tall fra 0 til ${lane}.` : `${count} × ${lane} m + ${rest} m = ${dist} m`;
    sum.classList.toggle("bad", dist == null);
    foot.hidden = false; use.disabled = dist == null;
    use.dataset.value = dist == null ? "" : String(dist);
    use.textContent = dist == null ? "Bruk" : `Bruk ${dist} m og ${plural(pauses, "pause", "pauser")}`;
  }

  function startDown() {
    if (cfg.mode === "walk") {
      const l = num(laneIn.value);
      if (l == null || l <= 0) { msg.textContent = "Skriv banelengden i meter før du starter."; laneIn.focus(); return; }
      lane = l;
    }
    armAudio();
    t0 = Date.now(); msg.textContent = ""; setup.hidden = true;
    countEl.hidden = false; row.hidden = false;
    main.textContent = PLUS[cfg.mode]; state("running"); keepAwake(true);
    paintDown();
    tick = setInterval(() => {
      const left = remainingMs(cfg.seconds, Date.now() - t0);
      timeEl.textContent = countdownText(left);
      if (left <= 0) finishDown(false);
    }, 100);
  }

  function finishDown(early) {
    const ms = Date.now() - t0;
    halt(); state("done");
    $("timer-end").hidden = true;
    if (early) { timeEl.textContent = clockText(ms); unit.textContent = "medgått tid"; msg.textContent = `Avsluttet etter ${clockText(ms)}. Noter tiden hvis testen ble avbrutt.`; }
    else { timeEl.textContent = countdownText(0); msg.textContent = "Tiden er ute."; signal(); }
    if (cfg.mode === "walk") { restBox.hidden = false; restIn.value = ""; }
    paintDown();
  }

  const bump = kind => { if (kind === "c") count++; else pauses++; log.push(kind); paintDown(); };

  /* ---------- Felles ---------- */
  function reset() {
    halt();
    attempts = []; stoppedAt = 0; count = 0; pauses = 0; log = []; lane = cfg.lane;
    msg.textContent = ""; foot.hidden = true; use.disabled = false;
    setup.hidden = cfg.mode !== "walk"; laneIn.value = cfg.lane || "";
    countEl.hidden = true; row.hidden = true; restBox.hidden = true; restIn.value = ""; sum.textContent = "";
    $("timer-pause").hidden = $("timer-end").hidden = cfg.mode !== "walk";
    timeEl.textContent = down() ? countdownText(cfg.seconds * 1000) : secText(0);
    unit.textContent = down() ? "gjenstår" : cfg.max ? `sekunder · stopper selv på ${cfg.max} s` : "sekunder";
    main.textContent = "Start"; dlg.dataset.mode = down() ? "down" : "up"; state("idle");
    paintTries();
  }

  main.addEventListener("click", () => {
    if (down()) { if (st() === "idle") startDown(); else bump("c"); return; }
    if (st() === "running") stopUp();
    else if (Date.now() - stoppedAt > RESTART_GUARD_MS) startUp();
  });
  $("timer-pause").addEventListener("click", () => bump("p"));
  $("timer-undo").addEventListener("click", () => {
    const kind = log.pop(); if (!kind) return;
    if (kind === "c") count--; else pauses--;
    paintDown();
  });
  $("timer-end").addEventListener("click", () => { if (st() === "running") finishDown(true); });
  restIn.addEventListener("input", paintDown);

  use.addEventListener("click", () => {
    const value = use.dataset.value, { mode, forId, title, stopsId } = cfg, p = pauses;
    dlg.close();
    if (!setField(forId, value)) return;
    if (mode === "up") flash(`${title}: ${value} s satt inn.`);
    else if (mode === "sts") flash(`${title}: ${value} satt inn.`);
    else { setField(stopsId, String(p)); flash(`${title}: ${value} m og ${plural(p, "pause", "pauser")} satt inn.`); }
  });

  $("timer-close").addEventListener("click", () => dlg.close());
  /* Trykk utenfor lukker panelet bare før start, så et uhell ikke kaster tid eller telling */
  dlg.addEventListener("click", e => { if (e.target === dlg && st() === "idle") dlg.close(); });
  /* Lukkes panelet mens klokken går, stoppes den uten å endre feltene */
  dlg.addEventListener("close", halt);

  $("forms").addEventListener("click", e => {
    const b = e.target.closest("[data-timer]"); if (!b) return;
    const card = b.closest(".card"), test = card ? card.querySelector("h3").textContent : "";
    cfg = {
      mode: b.dataset.timer, forId: b.dataset.for, title: b.dataset.title,
      max: Number(b.dataset.max) || 0, best: "best" in b.dataset,
      seconds: Number(b.dataset.seconds) || 0, lane: Number(b.dataset.lane) || 0, stopsId: b.dataset.stops || ""
    };
    $("timer-h").textContent = cfg.mode === "up" && test ? `${test} · ${cfg.title}` : test || cfg.title;
    reset();
    dlg.showModal();
    main.focus();
  });
}
