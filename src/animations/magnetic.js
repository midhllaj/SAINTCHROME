/**
 * Magnetic buttons: elements with [data-magnetic] lean toward the pointer.
 * The chrome shine sweep is pure CSS (.btn::after).
 */
import { gsap } from 'gsap';
import { IS_TOUCH } from '../core/env.js';

export function initMagnetic(root = document) {
  if (IS_TOUCH) return;
  root.querySelectorAll('[data-magnetic]').forEach((el) => {
    if (el.__mag) return;
    el.__mag = true;
    const strength = Number(el.dataset.magnetic || 0.35);
    const inner = el.querySelector('.btn__label') || el;
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    const ixTo = gsap.quickTo(inner, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    const iyTo = gsap.quickTo(inner, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      xTo(dx * strength); yTo(dy * strength);
      if (inner !== el) { ixTo(dx * strength * 0.4); iyTo(dy * strength * 0.4); }
    });
    el.addEventListener('pointerleave', () => { xTo(0); yTo(0); if (inner !== el) { ixTo(0); iyTo(0); } });
  });
}
