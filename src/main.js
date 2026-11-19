/**
 * SAINTCHROME — entry point.
 */
import '@fontsource/unbounded/400.css';
import '@fontsource/unbounded/700.css';
import '@fontsource/unbounded/900.css';
import '@fontsource/michroma/400.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/700.css';
import './styles/main.css';

import { initScroll, scrollTo } from './core/scroll.js';
import { startRouter } from './core/router.js';
import { initHud } from './ui/hud.js';
import { initDrawer } from './ui/drawer.js';
import { initCursor } from './animations/cursor.js';
import { initClickBursts } from './animations/fx.js';
import { initSpace, initTilt } from './animations/space.js';
import { runPreloader } from './animations/preloader.js';
import { engine } from './viewer/engine.js';
import { REDUCED_MOTION } from './core/env.js';

if (REDUCED_MOTION) document.documentElement.classList.add('reduced-motion');
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
scrollTo(0, { immediate: true });
if (import.meta.env.DEV) import('./core/scroll.js').then((m) => { window.__gsap = m.gsap; window.__st = m.ScrollTrigger; window.__lenis = () => m.lenis; });
engine.init();
initScroll();
initSpace();
initTilt();
initCursor();
initClickBursts();
initDrawer();
initHud();

document.addEventListener('click', (e) => {
  if (e.target.closest('[data-scroll-top]')) { e.preventDefault(); scrollTo(0, { immediate: false, duration: 1.6 }); }
});

(async () => {
  const pagePromise = startRouter();
  const fonts = document.fonts?.ready ?? Promise.resolve();
  const page = await pagePromise;
  const cap = (p, ms) => Promise.race([p, new Promise((r) => setTimeout(r, ms))]); // never let the preloader hang
  await runPreloader([cap(fonts, 3000), cap(page.ready ?? Promise.resolve(), 6000), new Promise((r) => setTimeout(r, 400))]);
  page.mount?.();
})();
