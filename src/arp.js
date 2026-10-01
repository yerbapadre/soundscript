import { settings } from "./config.js";
import { ensureAudio, resume, playNote, getCtx } from "./audio.js";
import { spawnVisual } from "./visuals.js";
import { recordLive, getArmedId } from "./tracks.js";

const held = new Map();
let timer = null;
let idx = 0;

function emit(freq, char) {
  playNote(freq, getCtx().currentTime, undefined, getArmedId());
  spawnVisual(char, freq);
  recordLive(freq, char);
}

function orderedNotes() {
  return [...held.values()].sort((a, b) => a.freq - b.freq);
}

function upDownSequence(n) {
  if (n <= 1) return [0];
  const seq = [];
  for (let i = 0; i < n; i++) seq.push(i);
  for (let i = n - 2; i >= 1; i--) seq.push(i);
  return seq;
}

function step() {
  const notes = orderedNotes();
  if (notes.length < 2) return;
  let note;
  switch (settings.arpPattern) {
    case "Down":
      note = notes[(notes.length - 1) - (idx % notes.length)]; idx++; break;
    case "Up/Down": {
      const seq = upDownSequence(notes.length);
      note = notes[seq[idx % seq.length]]; idx++; break;
    }
    case "Random":
      note = notes[Math.floor(Math.random() * notes.length)]; break;
    default:
      note = notes[idx % notes.length]; idx++;
  }
  emit(note.freq, note.char);
}

function updateArp() {
  const active = settings.arpOn && held.size >= 2;
  if (active && !timer) {
    idx = 0;
    timer = setInterval(step, settings.arpSpeed);
  } else if (!active && timer) {
    clearInterval(timer);
    timer = null;
  }
}

export function noteOn(key, freq, char) {
  ensureAudio(); resume();
  if (held.has(key)) return;
  held.set(key, { freq, char });
  emit(freq, char);
  updateArp();
}

export function noteOff(key) {
  held.delete(key);
  updateArp();
}

export function clearHeld() {
  held.clear();
  updateArp();
}

export function setArpEnabled(on) {
  settings.arpOn = on;
  updateArp();
}

export function setArpPattern(pattern) {
  settings.arpPattern = pattern;
}

export function setArpSpeed(ms) {
  settings.arpSpeed = ms;
  if (timer) { clearInterval(timer); timer = setInterval(step, ms); }
}
