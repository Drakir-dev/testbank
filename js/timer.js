/* Stoppeklokke (DOM). «Ta tid»-knappene lages av inputF() i js/lib/form.js:
     <button data-timer="up" data-for="felt-id" data-title="Feltnavn" [data-max="45"] [data-best]>
   Panelet tar tiden og setter den i feltet med en input-hendelse, så bind() i app.js oppdaterer tilstanden
   som om brukeren hadde tastet selv. Ingenting lagres: tid og forsøk ligger bare i minnet til panelet lukkes.
   Regningen ligger i js/lib/tid.js. */
import { capMs, reachedMax, secText, bestMs } from "./lib/tid.js";

const $ = id => document.getElementById(id);
const RESTART_GUARD_MS = 700;   // et dobbelttrykk på Stopp skal ikke starte klokken på nytt

export function initTimer(flash) {
  const dlg = $("timer"), main = $("timer-main"), use = $("timer-use"), foot = $("timer-foot");
  const timeEl = $("timer-time"), msg = $("timer-msg"), tries = $("timer-tries");
  let cfg = null, t0 = 0, tick = null, stoppedAt = 0, attempts = [], lock = null, audio = null;

  const elapsed = () => capMs(Date.now() - t0, cfg.max);
  const state = st => { dlg.dataset.st = st; };

  /* Skjermen holdes våken mens klokken går, der nettleseren støtter det */
  async function keepAwake(on) {
    try {
      if (on && "wakeLock" in navigator) lock = await navigator.wakeLock.request("screen");
      else if (!on && lock) { await lock.release(); lock = null; }
    } catch { lock = null; }
  }

  /* Signal når makstiden er nådd: vibrasjon (Android) og to korte pip laget i appen, uten lydfil */
  function signal() {
    try { if (navigator.vibrate) navigator.vibrate([250, 120, 250]); } catch { /* ikke støttet */ }
    if (!audio) return;
    try {
      [0, 0.3].forEach(at => {
        const osc = audio.createOscillator(), gain = audio.createGain();
        osc.frequency.value = 880; gain.gain.value = 0.25;
        osc.connect(gain); gain.connect(audio.destination);
        osc.start(audio.currentTime + at); osc.stop(audio.currentTime + at + 0.2);
      });
    } catch { /* lyd er ikke tilgjengelig */ }
  }

  function paintTries() {
    tries.hidden = !(cfg.best && attempts.length);
    const best = bestMs(attempts);
    tries.innerHTML = attempts.map((a, i) => `<li${a === best ? ' class="best"' : ""}>Forsøk ${i + 1}: ${secText(a)} s</li>`).join("");
  }

  function reset() {
    clearInterval(tick); tick = null; keepAwake(false);
    timeEl.textContent = secText(0); msg.textContent = "";
    main.textContent = "Start"; foot.hidden = true; state("idle");
  }

  function start() {
    // Lyden må opprettes i et trykk for å virke på iPhone. Trengs bare når klokken kan stoppe selv.
    if (cfg.max && !audio) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) try { audio = new AC(); } catch { audio = null; } }
    if (audio && audio.state === "suspended") audio.resume();
    t0 = Date.now(); msg.textContent = ""; foot.hidden = true;
    main.textContent = "Stopp"; state("running"); keepAwake(true);
    tick = setInterval(() => {
      timeEl.textContent = secText(elapsed());
      if (reachedMax(Date.now() - t0, cfg.max)) stop(true);
    }, 50);
  }

  function stop(atMax = false) {
    const ms = elapsed();
    clearInterval(tick); tick = null; keepAwake(false); stoppedAt = Date.now();
    attempts.push(ms);
    timeEl.textContent = secText(ms);
    if (atMax) { msg.textContent = `Makstiden på ${cfg.max} s er nådd.`; signal(); }
    paintTries();
    const val = cfg.best ? bestMs(attempts) : ms;
    use.dataset.value = secText(val);
    use.textContent = cfg.best && attempts.length > 1 ? `Bruk beste (${secText(val)} s)` : `Bruk tiden (${secText(val)} s)`;
    foot.hidden = false;
    main.textContent = cfg.best ? "Nytt forsøk" : "Start på nytt"; state("stopped");
  }

  main.addEventListener("click", () => {
    if (dlg.dataset.st === "running") stop();
    else if (Date.now() - stoppedAt > RESTART_GUARD_MS) start();
  });

  use.addEventListener("click", () => {
    const inp = $(cfg.forId), value = use.dataset.value;
    dlg.close();
    if (!inp) return;
    inp.value = value;
    inp.dispatchEvent(new Event("input", { bubbles: true }));
    flash(`${cfg.title}: ${value} s satt inn.`);
  });

  $("timer-close").addEventListener("click", () => dlg.close());
  /* Trykk utenfor lukker panelet, men ikke mens klokken går (lett å komme borti) */
  dlg.addEventListener("click", e => { if (e.target === dlg && dlg.dataset.st !== "running") dlg.close(); });
  /* Lukkes panelet mens klokken går, stoppes den uten å endre feltet */
  dlg.addEventListener("close", () => { clearInterval(tick); tick = null; keepAwake(false); });

  $("forms").addEventListener("click", e => {
    const b = e.target.closest('[data-timer="up"]'); if (!b) return;
    const card = b.closest(".card"), test = card ? card.querySelector("h3").textContent : "";
    cfg = { forId: b.dataset.for, title: b.dataset.title, max: Number(b.dataset.max) || 0, best: "best" in b.dataset };
    attempts = []; stoppedAt = 0;
    $("timer-h").textContent = test ? `${test} · ${cfg.title}` : cfg.title;
    $("timer-max").textContent = cfg.max ? ` · stopper selv på ${cfg.max} s` : "";
    paintTries(); reset();
    dlg.showModal();
    main.focus();
  });
}
