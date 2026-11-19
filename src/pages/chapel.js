/**
 * THE CHAPEL — vertical lookbook. Portrait 3D renders joined by liquid-chrome drips that
 * stretch with scroll velocity. A fixed [CLOSE] and UPWARD / DOWNWARD direction readout.
 */
import { createPage } from './_kit.js';
import { PRODUCTS } from '../config/products.js';
import { esc } from '../core/dom.js';
import { gsap, onTick, velocity } from '../core/scroll.js';
import { REDUCED_MOTION } from '../core/env.js';

const dripPath = (neck) => {
  const a = 100 - neck, b = 100 + neck;
  return `M30,0 C30,46 ${a},48 ${a},70 C${a},92 30,94 30,140 L170,140 C170,94 ${b},92 ${b},70 C${b},48 170,46 170,0 Z`;
};

export default async function chapel() {
  const visions = PRODUCTS.flatMap((p, i) => [{ p, n: (i % 2) + 1 }]);
  const page = createPage('chapel', `
  <section class="page-hero" style="text-align:center">
    <span class="mono">[ THE CHAPEL ✦ LOOKBOOK ]</span>
    <h1 class="page-hero__title chrome-text" data-reveal="lines">The Chapel</h1>
    <p class="page-hero__sub" data-reveal="fade" style="margin:0 auto">Visions of every relic, cast in liquid chrome. Scroll slowly. Let the metal drip.</p>
  </section>
  <svg width="0" height="0" style="position:absolute" aria-hidden="true">
    <defs>
      <linearGradient id="chromeGrad" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stop-color="#6e6e6e"/><stop offset="0.22" stop-color="#ffffff"/><stop offset="0.45" stop-color="#9b9b9b"/>
        <stop offset="0.55" stop-color="#e8e8e8"/><stop offset="0.8" stop-color="#5a5a5a"/><stop offset="1" stop-color="#c0c0c0"/>
      </linearGradient>
    </defs>
  </svg>
  <div class="chapel">
    <div class="chapel__hud mono" aria-hidden="true">
      <a href="/" class="chapel__close">[ CLOSE ✕ ]</a>
      <div class="chapel__dir"><span data-dir="up">UPWARD ↑</span> / <span data-dir="down" class="is-on">DOWNWARD ↓</span></div>
    </div>
    <div class="chapel__ghost" aria-hidden="true"></div>
    <div class="chapel__col">
      ${visions.map(({ p, n }, i) => `
        ${i ? `<svg class="drip" viewBox="0 0 200 140" preserveAspectRatio="none" aria-hidden="true"><path class="blob" d="${dripPath(14)}"/></svg>` : ''}
        <figure class="vision" data-name="${esc(p.name)}" style="margin:0">
          <a class="vision__frame" href="/relic/${p.slug}" data-cursor="WORSHIP ✦" aria-label="${esc(p.name)}">
            <img src="/chapel/${p.slug}-${n}.jpg" alt="${esc(p.name)} — chrome render" loading="${i < 2 ? 'eager' : 'lazy'}" width="1000" height="1400" />
          </a>
          <figcaption class="vision__cap mono"><span>[ VISION ${String(i + 1).padStart(2, '0')} ]</span><a href="/relic/${p.slug}">${esc(p.name).toUpperCase()} →</a></figcaption>
        </figure>`).join('')}
    </div>
  </div>
  <div class="altar-bottom">
    <p class="mono section-label">[ END OF THE VISIONS ]</p>
    <div class="center" style="margin-top:18px"><a class="btn btn--chrome" href="/altar" data-magnetic><span class="btn__label">ENTER THE ALTAR</span></a></div>
  </div>`);

  page.meta = { title: 'The Chapel — Lookbook | SAINTCHROME', description: 'The SAINTCHROME lookbook: every relic rendered in liquid chrome.' };
  page.mount = () => {
    page.enhance();
    const frames = [...page.el.querySelectorAll('.vision')];
    const drips = [...page.el.querySelectorAll('.drip path')];
    const ghost = page.el.querySelector('.chapel__ghost');
    const up = page.el.querySelector('[data-dir="up"]'), down = page.el.querySelector('[data-dir="down"]');
    let neck = 14, current = '';
    page.gsap(() => {
      frames.forEach((f) => {
        const frame = f.querySelector('.vision__frame'), img = f.querySelector('img');
        gsap.fromTo(frame, { scale: 0.82, borderRadius: 120 }, { scale: 1, borderRadius: 22, ease: 'none', scrollTrigger: { trigger: f, start: 'top bottom', end: 'center center', scrub: true } });
        gsap.fromTo(img, { yPercent: -10 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: f, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
    });
    page.cleanup(onTick(() => {
      const v = velocity();
      const target = REDUCED_MOTION ? 14 : Math.max(3, 14 - Math.min(11, Math.abs(v) * 0.9));
      neck += (target - neck) * 0.12;
      const d = dripPath(Math.round(neck * 100) / 100);
      drips.forEach((p) => p.setAttribute('d', d));
      if (Math.abs(v) > 0.2) { up.classList.toggle('is-on', v < 0); down.classList.toggle('is-on', v > 0); }
      const mid = innerHeight / 2;
      const f = frames.find((x) => { const r = x.getBoundingClientRect(); return r.top < mid && r.bottom > mid; });
      const name = f ? f.dataset.name : '';
      if (name !== current) { current = name; ghost.textContent = name; }
    }));
  };
  return page;
}
