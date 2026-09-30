import { settings, TRACK_COUNT } from "./config.js";
import { getCtx, ensureAudio, resume, playNote, renderToWav } from "./audio.js";
import { spawnVisual } from "./visuals.js";
import { bus } from "./bus.js";

const tracks = [];
for (let i = 0; i < TRACK_COUNT; i++) {
  tracks.push({ id: i, name: "Track " + (i + 1), events: [], muted: false, solo: false });
}
let armedId = 0;
const transport = { mode: "idle", base: 0, timers: [], rafId: 0 };

export function getTracks() { return tracks; }
export function getArmedId() { return armedId; }
export function getTransportMode() { return transport.mode; }
export function hasAudio() { return tracks.some((t) => t.events.length); }

export function anySolo() { return tracks.some((t) => t.solo); }
export function audible(t) { return !t.muted && (!anySolo() || t.solo); }
function tail(voice) { return voice === "Ambient" ? 3.5 : voice === "Pad" ? 2.0 : 1.0; }
export function trackDuration(t) {
  let max = 0;
  for (const e of t.events) if (e.freq) max = Math.max(max, e.t + tail(e.voice));
  return max;
}

export function setArmedId(id) { armedId = id; bus.emit("change"); }
export function toggleMute(id) { tracks[id].muted = !tracks[id].muted; bus.emit("change"); }
export function toggleSolo(id) { tracks[id].solo = !tracks[id].solo; bus.emit("change"); }
export function clearTrack(id) { tracks[id].events = []; bus.emit("change"); }

function clearTimers() {
  transport.timers.forEach(clearTimeout);
  transport.timers = [];
  cancelAnimationFrame(transport.rafId);
}

function scheduleTrackPlayback(t, base, excludeId) {
  if (t.id === excludeId || !audible(t) || !t.events.length) return;
  const ac = getCtx();
  for (const e of t.events) {
    if (!e.freq) continue;
    playNote(e.freq, base + e.t, e.voice);
    transport.timers.push(setTimeout(() => spawnVisual(e.char, e.freq), Math.max(0, (base + e.t - ac.currentTime) * 1000)));
  }
}

function tickLoop() {
  if (transport.mode === "idle") return;
  const elapsed = Math.max(0, getCtx().currentTime - transport.base);
  bus.emit("tick", { elapsed, mode: transport.mode });
  transport.rafId = requestAnimationFrame(tickLoop);
}

export function startPlaying() {
  if (transport.mode !== "idle") stopTransport();
  ensureAudio(); resume();
  const list = tracks.filter((t) => audible(t) && t.events.length);
  if (!list.length) return;
  transport.mode = "playing";
  transport.base = getCtx().currentTime + 0.1;
  list.forEach((t) => scheduleTrackPlayback(t, transport.base, null));
  const dur = Math.max(...list.map(trackDuration));
  transport.timers.push(setTimeout(stopTransport, (dur + 0.3) * 1000 + 100));
  transport.rafId = requestAnimationFrame(tickLoop);
  bus.emit("change");
}

export function startRecording() {
  if (transport.mode !== "idle") stopTransport();
  ensureAudio(); resume();
  tracks[armedId].events = [];
  transport.mode = "recording";
  transport.base = getCtx().currentTime + 0.1;
  tracks.forEach((t) => scheduleTrackPlayback(t, transport.base, armedId));
  transport.rafId = requestAnimationFrame(tickLoop);
  bus.emit("change");
}

export function stopTransport() {
  clearTimers();
  transport.mode = "idle";
  bus.emit("change");
}

export function togglePlay() { transport.mode === "playing" ? stopTransport() : startPlaying(); }
export function toggleRec() { transport.mode === "recording" ? stopTransport() : startRecording(); }

export function recordLive(freq, char) {
  if (transport.mode !== "recording") return;
  tracks[armedId].events.push({ t: Math.max(0, getCtx().currentTime - transport.base), freq, char, voice: settings.voice });
}

export function recordRest() {
  if (transport.mode !== "recording") return;
  tracks[armedId].events.push({ t: Math.max(0, getCtx().currentTime - transport.base), freq: null, char: " ", voice: settings.voice });
}

export function exportMix() {
  const list = tracks.filter((t) => audible(t) && t.events.length);
  if (!list.length) return;
  const dur = Math.max(...list.map(trackDuration)) + 0.5;
  return renderToWav(list, dur, "soundscript-mix.wav");
}

export function exportTrack(t) {
  if (!t.events.length) return;
  return renderToWav([t], trackDuration(t) + 0.5, `soundscript-${t.name.toLowerCase().replace(/\s+/g, "-")}.wav`);
}
