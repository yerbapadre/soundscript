import { ensureAudio, resume } from "./audio.js";
import { freqForKey } from "./scale.js";
import { spawnRest, newLine } from "./visuals.js";
import { recordRest } from "./tracks.js";
import { noteOn, noteOff, clearHeld } from "./arp.js";

let hintGone = false;
function hideHint() {
  if (hintGone) return;
  hintGone = true;
  document.getElementById("hint").classList.add("gone");
}

function isNoteKey(key) {
  return key.length === 1 && /[a-z0-9!-~]/i.test(key);
}

function handleRest() {
  hideHint();
  ensureAudio(); resume();
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
    if (e.repeat) return;
    if (isNoteKey(e.key)) {
      hideHint();
      const key = e.key.toLowerCase();
      noteOn(key, freqForKey(e.key), e.key);
    }
  });

  window.addEventListener("keyup", (e) => {
    if (isNoteKey(e.key)) noteOff(e.key.toLowerCase());
  });

  window.addEventListener("blur", clearHeld);
}
