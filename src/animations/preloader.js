/**
 * Preloader: the halo ring draws itself round the SAINTCHROME emblem, eight star sparkles pop in, the counter climbs
 * 000 → 100 (tied to real loading), a white camera flash, and the halo zooms through
 * the screen into the hero.
 */
import { gsap } from 'gsap';
import { REDUCED_MOTION } from '../core/env.js';

const STAR = 'M0 -14 L2 -2 L14 0 L2 2 L0 14 L-2 2 L-14 0 L-2 -2 Z';

export async function runPreloader(tasks = []) {
  const root = document.getElementById('preloader');
  const num = root.querySelector('.pre-num');
  const stars = root.querySelector('.pre-stars');
  const flash = root.querySelector('.pre-flash');
  const halo = root.querySelector('.pre-halo');
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', STAR);
    p.setAttribute('transform', `translate(${Math.cos(a) * 78} ${Math.sin(a) * 78}) scale(${i % 2 ? 0.55 : 0.9})`);
    stars.appendChild(p);
  }

  let done = 0;
  const total = Math.max(1, tasks.length);
  tasks.forEach((t) => Promise.resolve(t).catch(() => {}).finally(() => { done++; }));
  const all = Promise.allSettled(tasks);

  if (REDUCED_MOTION) {
    await all;
    root.remove();
    document.body.classList.remove('is-loading');
    return;
  }

  const rings = root.querySelectorAll('.pre-ring');
  rings.forEach((r) => { const L = 2 * Math.PI * Number(r.getAttribute('r')); r.style.strokeDasharray = L; r.style.strokeDashoffset = L; });
  gsap.to(rings, { strokeDashoffset: 0, duration: 1.6, ease: 'power3.inOut', stagger: 0.15 });
  gsap.fromTo(stars.children, { scale: 0, opacity: 0, transformOrigin: '50% 50%' }, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(3)', stagger: 0.09, delay: 0.5 });
  gsap.to(root.querySelector('.pre-spin'), { rotation: 45, svgOrigin: '0 0', duration: 4, ease: 'none' });
  gsap.fromTo(root.querySelector('.pre-logo'), { opacity: 0, scale: 0.86, svgOrigin: '0 0' }, { opacity: 1, scale: 1, svgOrigin: '0 0', duration: 1.4, ease: 'power3.out', delay: 0.35 });

  // counter: never faster than real progress, never slower than ~2s
  const state = { v: 0 };
  const start = performance.now();
  await new Promise((resolve) => {
    const tick = () => {
      const timeP = Math.min(1, (performance.now() - start) / 2200);
      const realP = done / total;
      const target = Math.min(timeP, realP < 1 ? Math.min(0.92, realP + 0.25) : 1) * 100;
      state.v += (target - state.v) * 0.12;
      if (target >= 100 && state.v > 99.4) state.v = 100;
      num.textContent = String(Math.floor(state.v)).padStart(3, '0');
      if (state.v >= 100) resolve(); else requestAnimationFrame(tick);
    };
    tick();
  });
  await all;

  const tl = gsap.timeline();
  tl.to(flash, { opacity: 1, duration: 0.12, ease: 'power2.in' })
    .add(() => { document.body.classList.remove('is-loading'); root.classList.add('is-through'); })
    .to(halo, { scale: 14, opacity: 0, duration: 1.1, ease: 'expo.in' }, 0.05)
    .to([root.querySelector('.pre-counter'), root.querySelector('.pre-label')], { opacity: 0, duration: 0.2 }, 0)
    .to(flash, { opacity: 0, duration: 0.9, ease: 'power2.out' }, 0.5)
    .to(root, { backgroundColor: 'rgba(0,0,0,0)', duration: 0.6 }, 0.5);
  await tl.then();
  root.remove();
}
