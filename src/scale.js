import { SCALES, NOTES, KEY_ORDER, BASE_OCTAVE, settings } from "./config.js";

function midiToFreq(m) {
  return 440 * Math.pow(2, (m - 69) / 12);
}

export function freqForIndex(i) {
  const intervals = SCALES[settings.scale];
  const deg = intervals.length;
  const octaveOffset = Math.floor(i / deg);
  const step = ((i % deg) + deg) % deg;
  const rootSemi = NOTES.indexOf(settings.root);
  const midi = 12 * (BASE_OCTAVE + 1) + rootSemi + intervals[step] + 12 * octaveOffset;
  return midiToFreq(midi);
}

export function freqForKey(char) {
  const c = char.toLowerCase();
  const idx = KEY_ORDER.indexOf(c);
  if (idx !== -1) return freqForIndex(idx);
  return freqForIndex(char.charCodeAt(0) % KEY_ORDER.length);
}

export function pitchT(f) {
  const lo = Math.log2(freqForIndex(0));
  const hi = Math.log2(freqForIndex(KEY_ORDER.length - 1));
  return Math.max(0, Math.min(1, (Math.log2(f) - lo) / (hi - lo)));
}

export function hueForFreq(f) {
  return 200 + pitchT(f) * 140;
}
