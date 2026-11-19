/**
 * 404 — "This relic has been lost ✦". A lone halo drifts behind the message.
 */
import { createPage } from './_kit.js';
import { scramble } from '../animations/scramble.js';

export default async function notFound() {
  const page = createPage('lost', `
  <section class="lost">
    <div class="lost__view" aria-hidden="true"></div>
    <div class="lost__inner">
      <span class="mono" style="color:var(--ice)">[ ERROR 404 ✦ RELIC NOT FOUND ]</span>
      <h1 class="lost__code chrome-text">404</h1>
      <p class="lost__msg">This relic has been lost ✦</p>
      <div class="hero__cta">
        <a class="btn btn--chrome" href="/altar" data-magnetic><span class="btn__label">RETURN TO THE ALTAR</span></a>
        <a class="btn btn--ghost" href="/" data-magnetic><span class="btn__label">THE SANCTUARY</span></a>
      </div>
    </div>
  </section>`, { footer: false });

  page.view(page.el.querySelector('.lost__view'), {
    model: 'halo', controls: false, autoRotate: 0, background: null, backdrop: false, fit: 0.72, polar: Math.PI / 2, fov: 30,
    onUpdate: (v, dt, t) => {
      v.spin.rotation.z += dt * 0.12;                 // the broken halo turns in its own plane
      v.pivot.rotation.x = Math.sin(t * 0.4) * 0.35;  // and sways like it lost its saint
      v.pivot.rotation.y = Math.cos(t * 0.3) * 0.25;
    },
  });
  page.meta = { title: 'Lost Relic — 404 | SAINTCHROME', description: 'This relic has been lost.' };
  page.mount = () => { page.enhance(); scramble(page.el.querySelector('.lost__msg'), undefined, { duration: 1.4 }); };
  return page;
}
