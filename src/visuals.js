import { pitchT, hueForFreq } from "./scale.js";

let canvas, ctx2d;
let W = 0, H = 0, DPR = 1;
const rings = [];
const glyphs = [];
const cursor = { x: 120 };

function resize() {
  DPR = window.devicePixelRatio || 1;
  W = window.innerWidth; H = window.innerHeight;
  canvas.width = W * DPR; canvas.height = H * DPR;
  canvas.style.width = W + "px"; canvas.style.height = H + "px";
  ctx2d.setTransform(DPR, 0, 0, DPR, 0, 0);
}

export function spawnVisual(char, freq) {
  const hue = hueForFreq(freq);
  const t = pitchT(freq);
  const y = H * 0.72 - t * H * 0.44;
  const x = cursor.x;
  rings.push({ x, y, r: 4, max: 60 + t * 120, hue, age: 0, life: 90 });
  glyphs.push({ x, y, char, hue, age: 0, life: 140, vy: -0.25 - t * 0.35 });
  cursor.x += 34; if (cursor.x > W - 140) cursor.x = 120;
}

export function spawnRest() {
  cursor.x += 22; if (cursor.x > W - 140) cursor.x = 120;
}

export function newLine() {
  cursor.x = 120;
}

function frame() {
  ctx2d.clearRect(0, 0, W, H);
  ctx2d.fillStyle = "rgba(8,8,11,0.28)"; ctx2d.fillRect(0, 0, W, H);
  for (let i = rings.length - 1; i >= 0; i--) {
    const r = rings[i]; r.age++;
    const p = r.age / r.life;
    r.r = r.max * (1 - Math.pow(1 - p, 3));
    ctx2d.beginPath(); ctx2d.arc(r.x, r.y, r.r, 0, Math.PI * 2);
    ctx2d.strokeStyle = `hsla(${r.hue},80%,65%,${(1 - p) * 0.5})`; ctx2d.lineWidth = 2; ctx2d.stroke();
    if (r.age >= r.life) rings.splice(i, 1);
  }
  ctx2d.textAlign = "center"; ctx2d.textBaseline = "middle";
  ctx2d.font = "500 30px 'SF Mono', ui-monospace, monospace";
  for (let i = glyphs.length - 1; i >= 0; i--) {
    const g = glyphs[i]; g.age++; g.y += g.vy;
    const p = g.age / g.life;
    const alpha = p < 0.15 ? p / 0.15 : (1 - (p - 0.15) / 0.85);
    ctx2d.fillStyle = `hsla(${g.hue},85%,72%,${Math.max(0, alpha)})`;
    ctx2d.shadowColor = `hsla(${g.hue},85%,60%,0.8)`; ctx2d.shadowBlur = 18;
    ctx2d.fillText(g.char, g.x, g.y); ctx2d.shadowBlur = 0;
    if (g.age >= g.life) glyphs.splice(i, 1);
  }
  requestAnimationFrame(frame);
}

export function initVisuals() {
  canvas = document.getElementById("stage");
  ctx2d = canvas.getContext("2d");
  window.addEventListener("resize", resize);
  resize();
  frame();
}
