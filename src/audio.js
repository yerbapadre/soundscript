import { settings } from "./config.js";
import { VOICE_SYNTH } from "./voices.js";

let ac = null;
let graph = null;

export function getCtx() {
  return ac;
}

export function resume() {
  if (ac && ac.state === "suspended") ac.resume();
}

function makeImpulse(ctx, duration, decay) {
  const rate = ctx.sampleRate, len = Math.floor(rate * duration);
  const buf = ctx.createBuffer(2, len, rate);
  for (let c = 0; c < 2; c++) {
    const data = buf.getChannelData(c);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return buf;
}

function buildGraph(ctx, opts) {
  const comp = ctx.createDynamicsCompressor();
  comp.connect(ctx.destination);
  const master = ctx.createGain(); master.gain.value = opts.vol; master.connect(comp);
  const convolver = ctx.createConvolver(); convolver.buffer = makeImpulse(ctx, 3.2, 2.2);
  const wet = ctx.createGain(); wet.gain.value = opts.reverb; convolver.connect(wet).connect(master);
  const delay = ctx.createDelay(1.0); delay.delayTime.value = 0.28;
  const fb = ctx.createGain(); fb.gain.value = 0.32; delay.connect(fb).connect(delay);
  const delayWet = ctx.createGain(); delayWet.gain.value = 0.35; delay.connect(delayWet).connect(master); delay.connect(convolver);
  const dry = ctx.createGain(); dry.gain.value = 0.85; dry.connect(master);
  const input = ctx.createGain();
  input.connect(dry); input.connect(convolver); input.connect(delay);
  return { input, master, wet };
}

export function ensureAudio() {
  if (ac) return;
  ac = new (window.AudioContext || window.webkitAudioContext)();
  graph = buildGraph(ac, settings);
}

export function playNote(freq, when, voiceName) {
  VOICE_SYNTH[voiceName || settings.voice](ac, graph.input, freq, when);
}

export function setVol(v) {
  settings.vol = v;
  if (graph) graph.master.gain.value = v;
}

export function setReverb(v) {
  settings.reverb = v;
  if (graph) graph.wet.gain.value = v;
}

export async function renderToWav(list, duration, filename) {
  if (!list.length) return;
  const sr = 44100;
  const off = new OfflineAudioContext(2, Math.ceil(duration * sr), sr);
  const g = buildGraph(off, settings);
  const t0 = 0.05;
  for (const t of list) for (const e of t.events) if (e.freq) VOICE_SYNTH[e.voice](off, g.input, e.freq, t0 + e.t);
  const rendered = await off.startRendering();
  const blob = encodeWav(rendered);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function encodeWav(buffer) {
  const numCh = buffer.numberOfChannels;
  const total = buffer.length * numCh * 2 + 44;
  const ab = new ArrayBuffer(total), view = new DataView(ab);
  let offset = 0;
  const str = (s) => { for (let i = 0; i < s.length; i++) view.setUint8(offset++, s.charCodeAt(i)); };
  const u32 = (v) => { view.setUint32(offset, v, true); offset += 4; };
  const u16 = (v) => { view.setUint16(offset, v, true); offset += 2; };
  str("RIFF"); u32(total - 8); str("WAVE"); str("fmt "); u32(16); u16(1); u16(numCh);
  u32(buffer.sampleRate); u32(buffer.sampleRate * numCh * 2); u16(numCh * 2); u16(16);
  str("data"); u32(buffer.length * numCh * 2);
  const chans = [];
  for (let c = 0; c < numCh; c++) chans.push(buffer.getChannelData(c));
  for (let i = 0; i < buffer.length; i++) {
    for (let c = 0; c < numCh; c++) {
      const s = Math.max(-1, Math.min(1, chans[c][i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true); offset += 2;
    }
  }
  return new Blob([ab], { type: "audio/wav" });
}
