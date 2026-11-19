/**
 * Glitch / scramble text: characters cycle through sacred glyphs before settling.
 *   scramble(el, 'SAINTCHROME', { duration: 1.4 })
 */
import { REDUCED_MOTION } from '../core/env.js';

const GLYPHS = '✦✧†‡/\\|—_<>[]{}#%&*+=ΛΞΣΩ01';

export function scramble(el, text = el.dataset.text || el.textContent, { duration = 1.2, delay = 0, keepSpaces = true } = {}) {
  el.dataset.text = text;
  el.setAttribute('aria-label', text);
  if (REDUCED_MOTION) { el.textContent = text; return Promise.resolve(); }
  return new Promise((resolve) => {
    const start = performance.now() + delay * 1000;
    const len = text.length;
    const order = Array.from({ length: len }, (_, i) => i / len * 0.65 + Math.random() * 0.35);
    const frame = (now) => {
      const p = Math.max(0, (now - start) / (duration * 1000));
      let out = '';
      for (let i = 0; i < len; i++) {
        const c = text[i];
        if (keepSpaces && c === ' ') { out += ' '; continue; }
        out += p >= order[i] ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      el.textContent = out;
      if (p < 1) requestAnimationFrame(frame);
      else { el.textContent = text; resolve(); }
    };
    requestAnimationFrame(frame);
  });
}

/** Scramble on hover (nav links, mono labels). */
export function scrambleOnHover(root = document) {
  root.querySelectorAll('[data-scramble]').forEach((el) => {
    if (el.__scr) return;
    el.__scr = true;
    const text = el.textContent;
    el.addEventListener('mouseenter', () => scramble(el, text, { duration: 0.5 }));
  });
}
