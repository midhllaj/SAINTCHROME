/**
 * Velocity-reactive marquee: drifts constantly, speeds up and skews with scroll velocity,
 * and reverses direction when you scroll up.
 */
import { onTick, velocity } from '../core/scroll.js';
import { REDUCED_MOTION } from '../core/env.js';

export function marquee(el, { speed = 0.6 } = {}) {
  const track = el.querySelector('.marquee__track');
  // duplicate content so it loops seamlessly
  track.innerHTML += track.innerHTML;
  if (REDUCED_MOTION) return () => {};
  let x = 0, dir = -1, skew = 0;
  const off = onTick(() => {
    const v = velocity();
    if (Math.abs(v) > 0.5) dir = v > 0 ? -1 : 1;
    x += dir * (speed + Math.min(14, Math.abs(v) * 0.35));
    const half = track.scrollWidth / 2;
    if (x <= -half) x += half;
    if (x > 0) x -= half;
    skew += ((-v * 0.25) - skew) * 0.1;
    track.style.transform = `translate3d(${x}px,0,0) skewX(${Math.max(-12, Math.min(12, skew))}deg)`;
  });
  return off;
}
