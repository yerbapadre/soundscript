export const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export const SCALES = {
  "Major":            [0, 2, 4, 5, 7, 9, 11],
  "Natural Minor":    [0, 2, 3, 5, 7, 8, 10],
  "Pentatonic Major": [0, 2, 4, 7, 9],
  "Pentatonic Minor": [0, 3, 5, 7, 10],
  "Blues":            [0, 3, 5, 6, 7, 10],
  "Dorian":           [0, 2, 3, 5, 7, 9, 10],
  "Lydian":           [0, 2, 4, 6, 7, 9, 11],
  "Mixolydian":       [0, 2, 4, 5, 7, 9, 10],
  "Harmonic Minor":   [0, 2, 3, 5, 7, 8, 11],
  "Chromatic":        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
};

export const VOICES = ["Bell", "Marimba", "Bass", "Ambient", "Pad", "Pluck", "Glass"];

export const KEY_ORDER = "abcdefghijklmnopqrstuvwxyz0123456789".split("");
export const BASE_OCTAVE = 3;
export const TRACK_COUNT = 4;

export const ARP_PATTERNS = ["Up", "Down", "Up/Down", "Random"];
export const ARP_SPEEDS = { Fast: 90, Med: 150, Slow: 240 };

export const settings = {
  root: "C", scale: "Pentatonic Major", voice: "Bell", vol: 0.7,
  arpOn: false, arpPattern: "Up", arpSpeed: 150,
};

export const DEFAULT_TRACK_FX = { volume: 0.8, reverb: 0.5, delay: 0.3 };
