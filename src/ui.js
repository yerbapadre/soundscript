import { NOTES, SCALES, VOICES, ARP_PATTERNS, ARP_SPEEDS, settings } from "./config.js";
import { ensureAudio, setVol, setReverb } from "./audio.js";
import { setArpEnabled, setArpPattern, setArpSpeed } from "./arp.js";
import { bus } from "./bus.js";
import {
  getTracks, getArmedId, getTransportMode, hasAudio,
  audible, trackDuration,
  setArmedId, toggleMute, toggleSolo, clearTrack,
  togglePlay, toggleRec, stopTransport,
  exportMix, exportTrack,
} from "./tracks.js";

let tracksEl, clockEl, recBtn, playBtn, stopBtn, exportBtn;

function fillSelect(el, items, selected) {
  el.innerHTML = "";
  for (const it of items) {
    const o = document.createElement("option"); o.value = it; o.textContent = it;
    if (it === selected) o.selected = true;
    el.appendChild(o);
  }
}

function wireControls() {
  const root = document.getElementById("root");
  const scale = document.getElementById("scale");
  const voice = document.getElementById("voice");
  fillSelect(root, NOTES, settings.root);
  fillSelect(scale, Object.keys(SCALES), settings.scale);
  fillSelect(voice, VOICES, settings.voice);
  root.addEventListener("change", (e) => { settings.root = e.target.value; e.target.blur(); });
  scale.addEventListener("change", (e) => { settings.scale = e.target.value; e.target.blur(); });
  voice.addEventListener("change", (e) => { settings.voice = e.target.value; e.target.blur(); });
  document.getElementById("reverb").addEventListener("input", (e) => setReverb(e.target.value / 100));
  document.getElementById("vol").addEventListener("input", (e) => setVol(e.target.value / 100));

  const arp = document.getElementById("arp");
  const arpPattern = document.getElementById("arpPattern");
  const arpSpeed = document.getElementById("arpSpeed");
  fillSelect(arpPattern, ARP_PATTERNS, settings.arpPattern);
  const speedLabelForMs = Object.keys(ARP_SPEEDS).find((k) => ARP_SPEEDS[k] === settings.arpSpeed);
  fillSelect(arpSpeed, Object.keys(ARP_SPEEDS), speedLabelForMs);
  arp.checked = settings.arpOn;
  const syncArpControls = () => { arpPattern.disabled = !arp.checked; arpSpeed.disabled = !arp.checked; };
  syncArpControls();
  arp.addEventListener("change", (e) => { setArpEnabled(e.target.checked); syncArpControls(); });
  arpPattern.addEventListener("change", (e) => { setArpPattern(e.target.value); e.target.blur(); });
  arpSpeed.addEventListener("change", (e) => { setArpSpeed(ARP_SPEEDS[e.target.value]); e.target.blur(); });

  recBtn.addEventListener("click", toggleRec);
  playBtn.addEventListener("click", togglePlay);
  stopBtn.addEventListener("click", stopTransport);
  exportBtn.addEventListener("click", () => { ensureAudio(); exportMix(); });
}

function refreshTransport() {
  const mode = getTransportMode();
  recBtn.classList.toggle("armed", mode === "recording");
  recBtn.textContent = mode === "recording" ? "■ STOP REC" : "● REC";
  playBtn.textContent = mode === "playing" ? "■ STOP" : "▶ PLAY";
  stopBtn.disabled = mode === "idle";
  exportBtn.disabled = !hasAudio();
}

function trackEl(id) {
  return tracksEl.querySelector(`.trk[data-id="${id}"]`);
}

function renderTracks() {
  tracksEl.querySelectorAll(".trk").forEach((n) => n.remove());
  const armedId = getArmedId();
  getTracks().forEach((t) => {
    const row = document.createElement("div");
    row.className = "trk" + (t.id === armedId ? " armed" : "");
    row.dataset.id = t.id;
    row.title = "click to select for recording";
    row.addEventListener("click", () => setArmedId(t.id));

    const arm = document.createElement("button");
    arm.className = "arm"; arm.textContent = "●"; arm.title = "arm for recording";

    const nm = document.createElement("span"); nm.className = "nm"; nm.textContent = t.name;

    const meter = document.createElement("div"); meter.className = "meter";
    const fill = document.createElement("div"); fill.className = "fill";
    const txt = document.createElement("div"); txt.className = "txt";
    const notes = t.events.filter((e) => e.freq).length;
    txt.textContent = notes ? `${notes} notes · ${trackDuration(t).toFixed(1)}s` : "empty";
    fill.style.width = notes ? Math.min(100, notes * 4) + "%" : "0";
    const head = document.createElement("div"); head.className = "head";
    meter.append(fill, txt, head);

    const mute = document.createElement("button");
    mute.className = "mini" + (t.muted ? " on" : ""); mute.textContent = "M";
    mute.addEventListener("click", (e) => { e.stopPropagation(); toggleMute(t.id); });
    const solo = document.createElement("button");
    solo.className = "mini solo" + (t.solo ? " on" : ""); solo.textContent = "S";
    solo.addEventListener("click", (e) => { e.stopPropagation(); toggleSolo(t.id); });
    const dl = document.createElement("button");
    dl.className = "mini"; dl.textContent = "↓"; dl.title = "download this track (WAV)";
    dl.disabled = !t.events.length;
    dl.addEventListener("click", (e) => { e.stopPropagation(); ensureAudio(); exportTrack(t); });
    const clr = document.createElement("button");
    clr.className = "mini"; clr.textContent = "×"; clr.title = "clear track";
    clr.addEventListener("click", (e) => { e.stopPropagation(); clearTrack(t.id); });

    row.append(arm, nm, meter, mute, solo, dl, clr);
    tracksEl.appendChild(row);
  });
}

function updatePlayheads(elapsed, mode) {
  const armedId = getArmedId();
  getTracks().forEach((t) => {
    const el = trackEl(t.id);
    if (!el) return;
    const playing = mode !== "idle" && audible(t) && t.events.length && t.id !== (mode === "recording" ? armedId : -1);
    el.classList.toggle("playing", !!playing);
    const dur = trackDuration(t) || 1;
    const head = el.querySelector(".head");
    if (head) head.style.left = Math.min(100, Math.max(0, elapsed / dur * 100)) + "%";
  });
}

export function initUI() {
  tracksEl = document.getElementById("tracks");
  clockEl = document.getElementById("clock");
  recBtn = document.getElementById("rec");
  playBtn = document.getElementById("play");
  stopBtn = document.getElementById("stop");
  exportBtn = document.getElementById("export");

  wireControls();
  renderTracks();
  refreshTransport();

  bus.on("change", () => {
    renderTracks();
    refreshTransport();
    if (getTransportMode() === "idle") {
      clockEl.textContent = "0.0s";
      clockEl.classList.remove("live");
    }
  });

  bus.on("tick", ({ elapsed, mode }) => {
    clockEl.textContent = elapsed.toFixed(1) + "s";
    clockEl.classList.toggle("live", mode === "recording");
    updatePlayheads(elapsed, mode);
  });
}
