/**
 * Full-screen 2D effects canvas: cursor sparkle trail and star bursts
 * (click on empty space, "ADD TO OFFERINGS"). Pooled particles, no DOM churn.
 */
import { onTick } from '../core/scroll.js';
import { REDUCED_MOTION, IS_TOUCH } from '../core/env.js';

const canvas = document.querySelector('.fx');
const ctx = canvas.getContext('2d');
let W = 0, H = 0, dpr = Math.min(devicePixelRatio || 1, 2);
const parts = [];
const MAX = IS_TOUCH ? 90 : 260;

function resize() {
  W = innerWidth; H = innerHeight;
  canvas.width = W * dpr; canvas.height = H * dpr;
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
}
resize();
addEventListener('resize', resize);

function starPath(x, y, r, rot) {
  const inner = r * 0.18;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = rot + (i * Math.PI) / 4;
    const rr = i % 2 === 0 ? r : inner;
    const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath();
}

export function spawn(x, y, { count = 1, speed = 1, size = 6, life = 0.9, color = '255,255,255', spread = Math.PI * 2, angle = 0, gravity = 0.04 } = {}) {
  if (REDUCED_MOTION) return;
  for (let i = 0; i < count; i++) {
    if (parts.length >= MAX) parts.shift();
    const a = angle + (Math.random() - 0.5) * spread;
    const v = speed * (0.4 + Math.random());
    parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: size * (0.4 + Math.random() * 0.8), life, t: 0, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.2, color, gravity });
  }
}

/** Big burst of 4-point stars + a ring shockwave. */
export function burst(x, y, { color = '255,255,255', count = 22, power = 7 } = {}) {
  spawn(x, y, { count, speed: power, size: 9, life: 1.1, color, gravity: 0.06 });
  rings.push({ x, y, t: 0, color });
}
const rings = [];

onTick((time, delta) => {
  const dt = Math.min(delta / 1000, 0.05);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'lighter';
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.t += dt;
    if (p.t >= p.life) { parts.splice(i, 1); continue; }
    p.vx *= 0.96; p.vy = p.vy * 0.96 + p.gravity;
    p.x += p.vx; p.y += p.vy; p.rot += p.vr;
    const k = 1 - p.t / p.life;
    ctx.fillStyle = `rgba(${p.color},${k})`;
    ctx.shadowColor = `rgba(${p.color},${k})`;
    ctx.shadowBlur = 8;
    starPath(p.x, p.y, p.r * (0.5 + k * 0.5), p.rot);
    ctx.fill();
  }
  for (let i = rings.length - 1; i >= 0; i--) {
    const r = rings[i];
    r.t += dt;
    const k = r.t / 0.7;
    if (k >= 1) { rings.splice(i, 1); continue; }
    ctx.strokeStyle = `rgba(${r.color},${(1 - k) * 0.8})`;
    ctx.lineWidth = 2 * (1 - k) + 0.5;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(r.x, r.y, 10 + k * 90, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
});

/** Click on empty space → star burst. */
export function initClickBursts() {
  addEventListener('click', (e) => {
    if (e.target.closest('a,button,input,textarea,select,label,.view--interactive,[role="button"],.drawer')) return;
    burst(e.clientX, e.clientY, { count: 16, power: 6 });
  });
}
