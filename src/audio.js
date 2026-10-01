import { settings, TRACK_COUNT, DEFAULT_TRACK_FX } from "./config.js";
import { VOICE_SYNTH } from "./voices.js";

let ac = null;
let mixer = null;
let channels = [];

let paramsProvider = () => ({ ...DEFAULT_TRACK_FX });
export function setChannelParamsProvider(fn) {
  paramsProvider = fn;
}

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

function buildMixer(ctx, masterVol) {
  const comp = ctx.createDynamicsCompressor();
  comp.connect(ctx.destination);
  const master = ctx.createGain(); master.gain.value = masterVol; master.connect(comp);

  const convolver = ctx.createConvolver(); convolver.buffer = makeImpulse(ctx, 3.2, 2.2);
  const reverbReturn = ctx.createGain(); reverbReturn.gain.value = 0.9;
  convolver.connect(reverbReturn).connect(master);

  const delay = ctx.createDelay(1.0); delay.delayTime.value = 0.28;
  const fb = ctx.createGain(); fb.gain.value = 0.32; delay.connect(fb).connect(delay);
  const delayReturn = ctx.createGain(); delayReturn.gain.value = 0.9;
  delay.connect(delayReturn).connect(master);
  delay.connect(convolver);

  return { master, convolver, delay };
}

function makeChannel(ctx, mix, p) {
  const input = ctx.createGain(); input.gain.value = p.volume;
  input.connect(mix.master);
  const rev = ctx.createGain(); rev.gain.value = p.reverb; input.connect(rev); rev.connect(mix.convolver);
  const dly = ctx.createGain(); dly.gain.value = p.delay; input.connect(dly); dly.connect(mix.delay);
  return { input, rev, dly };
}

function startKeepAlive() {
  const src = ac.createConstantSource();
  const g = ac.createGain();
  g.gain.value = 0;
  src.connect(g).connect(ac.destination);
  src.start();
}

export function ensureAudio() {
  if (ac) return;
  ac = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: "interactive" });
  mixer = buildMixer(ac, settings.vol);
  channels = [];
  for (let i = 0; i < TRACK_COUNT; i++) channels.push(makeChannel(ac, mixer, paramsProvider(i)));
  startKeepAlive();
}

export function warmUp() {
  ensureAudio();
  resume();
}

export function playNote(freq, when, voiceName, channelIndex) {
  const ch = channels[channelIndex];
  if (!ch) return;
  VOICE_SYNTH[voiceName || settings.voice](ac, ch.input, freq, when);
}

export function setMasterVol(v) {
  settings.vol = v;
  if (mixer) mixer.master.gain.value = v;
}

export function setTrackVolume(i, v) { if (channels[i]) channels[i].input.gain.value = v; }
export function setTrackReverb(i, v) { if (channels[i]) channels[i].rev.gain.value = v; }
export function setTrackDelay(i, v) { if (channels[i]) channels[i].dly.gain.value = v; }

export async function renderToWav(list, duration, filename) {
  if (!list.length) return;
  const sr = 44100;
  const off = new OfflineAudioContext(2, Math.ceil(duration * sr), sr);
  const mix = buildMixer(off, settings.vol);
  const t0 = 0.05;
  for (const t of list) {
    const ch = makeChannel(off, mix, { volume: t.volume, reverb: t.reverb, delay: t.delay });
    for (const e of t.events) if (e.freq) VOICE_SYNTH[e.voice](off, ch.input, e.freq, t0 + e.t);
  }
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
