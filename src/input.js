import { ensureAudio, resume, playNote, getCtx } from "./audio.js";
import { freqForKey } from "./scale.js";
import { spawnVisual, spawnRest, newLine } from "./visuals.js";
import { recordLive, recordRest } from "./tracks.js";

let hintGone = false;
function hideHint() {
  if (hintGone) return;
  hintGone = true;
  document.getElementById("hint").classList.add("gone");
}

function handleChar(char) {
  ensureAudio(); resume();
  hideHint();
  const freq = freqForKey(char);
  playNote(freq, getCtx().currentTime);
  spawnVisual(char, freq);
  recordLive(freq, char);
}

function handleRest() {
  hideHint();
  spawnRest();
  recordRest();
}

export function initInput() {
  window.addEventListener("keydown", (e) => {
    const tag = e.target.tagName;
    if (tag === "SELECT" || tag === "INPUT" || tag === "TEXTAREA") return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.code === "Space") { e.preventDefault(); handleRest(); return; }
    if (e.key === "Enter") { newLine(); return; }
    if (e.key.length === 1 && /[a-z0-9!-~]/i.test(e.key)) handleChar(e.key);
  });
}
