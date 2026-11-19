/**
 * Page kit: collects everything a page creates (3D views, GSAP animations and
 * ScrollTriggers, listeners) so it can all be torn down on navigation.
 */
import { gsap } from '../core/scroll.js';
import { el } from '../core/dom.js';
import { View } from '../viewer/view.js';
import { initReveals } from '../animations/reveal.js';
import { initMagnetic } from '../animations/magnetic.js';
import { scrambleOnHover } from '../animations/scramble.js';
import { footerHTML } from '../ui/footer.js';

export function createPage(name, markup, { footer = true } = {}) {
  const root = el(`<div class="page page--${name}">${markup}${footer ? footerHTML() : ''}</div>`);
  const views = [];
  const cleanups = [];
  const ctx = gsap.context(() => {}, root);
  return {
    name,
    el: root,
    view(target, opts) { const v = new View(target, opts); views.push(v); return v; },
    gsap(fn) { ctx.add(fn); },
    cleanup(fn) { cleanups.push(fn); },
    /** Common enhancements after the page is in the DOM. */
    enhance() {
      ctx.add(() => initReveals(root));
      initMagnetic(root);
      scrambleOnHover(root);
    },
    destroy() {
      cleanups.forEach((fn) => { try { fn(); } catch (e) { console.error(e); } });
      views.forEach((v) => v.destroy());
      ctx.revert();
    },
  };
}
