/**
 * Lenis smooth scroll wired into GSAP's ticker + ScrollTrigger.
 * The same ticker drives the shared WebGL engine, so scroll position and
 * 3D rendering are always in sync (no 1-frame lag on pinned viewers).
 */
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { engine } from '../viewer/engine.js';
import { REDUCED_MOTION } from './env.js';

gsap.registerPlugin(ScrollTrigger);

export let lenis = null;
const tickers = new Set();

export function initScroll() {
  if (!REDUCED_MOTION) {
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.95, smoothWheel: true, syncTouch: false });
    lenis.on('scroll', ScrollTrigger.update);
  }
  gsap.ticker.add((time, delta) => {
    lenis?.raf(time * 1000);
    for (const fn of tickers) fn(time, delta);
    engine.render();
  });
  gsap.ticker.lagSmoothing(0);
}

/** Per-frame callbacks (marquee, cursor…). Returns an unsubscribe function. */
export function onTick(fn) {
  tickers.add(fn);
  return () => tickers.delete(fn);
}

export const velocity = () => (lenis ? lenis.velocity : 0);

export function scrollTo(target, opts = {}) {
  if (lenis) lenis.scrollTo(target, { immediate: true, force: true, ...opts });
  else if (typeof target === 'number') window.scrollTo(0, target);
  else document.querySelector(target)?.scrollIntoView();
}

export function stopScroll(on) {
  if (!lenis) { document.documentElement.style.overflow = on ? 'hidden' : ''; return; }
  on ? lenis.stop() : lenis.start();
}

export { gsap, ScrollTrigger };
