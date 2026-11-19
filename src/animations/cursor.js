/**
 * Custom cursor: a glowing rotating 4-point star with a sparkle trail.
 * Over a 3D viewer it becomes "DRAG ⟲"; over cards "VIEW"; over links it swells.
 * Disabled on touch devices.
 */
import { onTick } from '../core/scroll.js';
import { spawn } from './fx.js';
import { IS_TOUCH, REDUCED_MOTION } from '../core/env.js';

export function initCursor() {
  const c = document.querySelector('.cursor');
  if (IS_TOUCH || !c) { c?.remove(); return; }
  document.documentElement.classList.add('has-cursor');
  const label = c.querySelector('.cursor__label');
  const star = c.querySelector('.cursor__star');
  let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y, rot = 0, lastEmit = 0;
  let visible = false;

  addEventListener('pointermove', (e) => {
    tx = e.clientX; ty = e.clientY;
    if (!visible) { visible = true; c.classList.add('is-visible'); x = tx; y = ty; }
  }, { passive: true });
  document.addEventListener('pointerleave', () => { visible = false; c.classList.remove('is-visible'); });
  addEventListener('pointerdown', () => c.classList.add('is-down'));
  addEventListener('pointerup', () => c.classList.remove('is-down'));

  document.addEventListener('pointerover', (e) => {
    const t = e.target;
    const view = t.closest?.('.view--interactive');
    const card = t.closest?.('[data-cursor]');
    const link = t.closest?.('a,button,[role="button"],input,select,textarea,label');
    let mode = '';
    if (view && !link) mode = 'drag';
    else if (card) mode = 'label';
    else if (link) mode = 'link';
    c.dataset.mode = mode;
    label.textContent = mode === 'drag' ? 'DRAG ⟲' : mode === 'label' ? card.dataset.cursor : '';
  });

  onTick((time) => {
    x += (tx - x) * 0.22; y += (ty - y) * 0.22;
    const speed = Math.hypot(tx - x, ty - y);
    rot += 0.8 + speed * 0.15;
    c.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    star.style.transform = `rotate(${rot}deg)`;
    if (!REDUCED_MOTION && visible && speed > 2 && time - lastEmit > 0.02) {
      lastEmit = time;
      spawn(x, y, { count: 1, speed: 0.6, size: 3.5 + Math.min(4, speed * 0.05), life: 0.7, color: '210,235,255', gravity: 0.02 });
    }
  });
}
