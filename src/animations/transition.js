/**
 * Page transition: a halo ring rushes out from the centre, a white camera flash covers
 * the page, the new page loads behind it, then the flash burns away.
 */
import { gsap } from 'gsap';
import { REDUCED_MOTION } from '../core/env.js';

const layer = () => document.querySelector('.transition');

export function cover() {
  const l = layer();
  const ring = l.querySelector('.transition__ring');
  const flash = l.querySelector('.transition__flash');
  l.classList.add('is-active');
  if (REDUCED_MOTION) {
    return gsap.fromTo(flash, { opacity: 0 }, { opacity: 1, duration: 0.2 }).then();
  }
  const tl = gsap.timeline();
  tl.set(ring, { scale: 0.05, opacity: 1, borderWidth: 2 })
    .set(flash, { opacity: 0 })
    .to(ring, { scale: 1.1, duration: 0.5, ease: 'expo.in' })
    .to(ring, { borderWidth: 60, duration: 0.18, ease: 'power2.in' }, '-=0.12')
    .to(flash, { opacity: 1, duration: 0.14, ease: 'power2.in' }, '-=0.12');
  return tl.then();
}

export function reveal() {
  const l = layer();
  const ring = l.querySelector('.transition__ring');
  const flash = l.querySelector('.transition__flash');
  const tl = gsap.timeline({ onComplete: () => l.classList.remove('is-active') });
  if (REDUCED_MOTION) return tl.to(flash, { opacity: 0, duration: 0.2 }).then();
  tl.to(ring, { scale: 3.2, opacity: 0, duration: 0.7, ease: 'expo.out' })
    .to(flash, { opacity: 0, duration: 0.65, ease: 'power3.out' }, 0);
  return tl.then();
}
