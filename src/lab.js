/**
 * DEV ONLY — Model Lab (/lab.html).
 *  - ?m=<modelKey>        show one relic large, next to its reference photos
 *  - "Export all" button  writes /public/models/*.glb, /public/shots/*.png, /public/chapel/*.jpg
 */
import * as THREE from 'three';
import { View } from './viewer/view.js';
import { engine } from './viewer/engine.js';
import { PRODUCTS } from './config/products.js';
import { modelKeys } from './models/index.js';
import { exportAll, snap } from './lab-export.js';
window.__snap = snap;

const params = new URLSearchParams(location.search);
const key = params.get('m') || 'bloodSaint';
const product = PRODUCTS.find((p) => p.model === key);

const nav = document.getElementById('nav');
for (const k of modelKeys) {
  const a = document.createElement('a');
  a.href = `?m=${k}`;
  a.textContent = k;
  if (k === key) a.style.borderColor = '#bfe6ff';
  nav.appendChild(a);
}
const exp = document.createElement('button');
exp.textContent = 'Export all (GLB + shots + chapel)';
exp.onclick = () => exportAll((m) => (document.getElementById('log').textContent += m + '\n'));
nav.appendChild(exp);

const stage = document.getElementById('stage');
const view = new View(stage, {
  model: key,
  zoom: true,
  accent: product?.accent || '#9aa7b8',
  hotspots: params.has('hs') ? product?.hotspots : null,
  autoRotate: params.has('spin') ? 1.2 : 0,
  polar: Number(params.get('polar') || 1.15),
  azimuth: Number(params.get('az') || 0),
  fit: Number(params.get('fit') || 1.05),
});
window.__view = view;
window.THREE = THREE;

const refs = document.getElementById('refs');
for (const r of product?.reference || []) {
  const img = document.createElement('img');
  img.src = `/reference/${r}`;
  refs.appendChild(img);
}

const loop = () => { engine.render(); requestAnimationFrame(loop); };
loop();
