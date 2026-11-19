/**
 * RITE — a single category (bracelets, necklaces, eyewear, earphones).
 * A rite with one relic gets a featured layout (big live 3D stage + buy panel) instead of a lonely grid card.
 */
import { createPage } from './_kit.js';
import { byRite, riteBySlug, RITES } from '../config/products.js';
import { formatPrice } from '../config/site.js';
import { esc, toast } from '../core/dom.js';
import { gsap } from '../core/scroll.js';
import { cart } from '../core/cart.js';
import { burst } from '../animations/fx.js';
import { openDrawer } from '../ui/drawer.js';
import { altarMarkup, heroMarkup, wireAltar } from './altar.js';
import notFound from './notFound.js';

function featuredMarkup(p) {
  return `
  <section class="feature" style="--accent:${p.accent}">
    <div class="feature__stage">
      <div class="feature__view" data-cursor="DRAG ⟲" role="img" aria-label="${esc(p.name)} — interactive 3D model. Drag to rotate."></div>
      <span class="feature__hint mono" aria-hidden="true">[ DRAG TO TURN ]</span>
    </div>
    <div class="feature__info">
      <span class="mono feature__num">[ RELIC ${p.number} ]</span>
      <h2 class="feature__name chrome-text">${esc(p.name)}</h2>
      <p class="feature__tag">${esc(p.tagline)}</p>
      <div class="product__price"><span>${formatPrice(p.price)}</span><span class="mono">INCL. OF ALL TAXES</span></div>
      <p class="product__desc">${esc(p.description)}</p>
      <div class="feature__actions">
        <button class="btn btn--chrome feature__add" type="button" data-magnetic="0.2" ${p.placeholder ? 'disabled' : ''}>
          <span class="btn__label">${p.placeholder ? 'BEING FORGED' : 'ADD TO OFFERINGS ✦'}</span>
        </button>
        <a class="link-arrow mono" href="/relic/${p.slug}">SEE IT UP CLOSE</a>
      </div>
      <div class="feature__soon">
        <span class="mono">[ RELIC ??? ]</span>
        <p>More relics arriving ✦</p>
      </div>
    </div>
  </section>`;
}

function wireFeatured(page, p) {
  const el = page.el.querySelector('.feature__view');
  page.view(el, { model: p.model, controls: true, autoRotate: 0.5, accent: p.glow || p.accent, fit: 0.94 });
  page.el.querySelector('.feature__add')?.addEventListener('click', (e) => {
    cart.add(p.slug, 1);
    const r = e.currentTarget.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, { count: 40, power: 10 });
    toast(`✦ ${p.name} added to your offerings`);
    setTimeout(openDrawer, 650);
  });
  return () => page.gsap(() => {
    gsap.from(page.el.querySelectorAll('.feature__stage, .feature__info > *'), {
      y: 60, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: 0.06,
      scrollTrigger: { trigger: page.el.querySelector('.feature'), start: 'top 85%' },
    });
  });
}

export default async function rite({ rite: slug }) {
  const r = riteBySlug(slug);
  if (!r) return notFound();
  const products = byRite(slug);
  const idx = RITES.indexOf(r);
  const next = RITES[(idx + 1) % RITES.length];
  const head = {
    label: `[ RITE 0${idx + 1} ✦ ${r.latin.toUpperCase()} ]`,
    title: r.name,
    sub: r.blurb + (slug === 'eyewear' ? ' Authentic Ray-Ban frames, curated and resold by SAINTCHROME.' : ''),
  };
  const single = products.length === 1;
  const page = createPage(`rite rite--${slug}`, `
    ${single ? heroMarkup(head) + featuredMarkup(products[0]) : altarMarkup({ ...head, products, filters: false })}
    ${slug === 'eyewear' ? `<div class="center"><a class="btn btn--chrome" href="/try-the-halo" data-magnetic><span class="btn__label">TRY THEM ON — LIVE</span></a></div>` : ''}
    <div class="altar-bottom">
      <p class="mono section-label">[ NEXT RITE ]</p>
      <a class="h2 chrome-text" href="/rites/${next.slug}" style="display:inline-block" data-cursor="ENTER ✦">${next.name} →</a>
      <div class="center" style="margin-top:28px"><a class="link-arrow mono" href="/altar">OR SEE THE WHOLE ALTAR</a></div>
    </div>`);
  const intro = single ? wireFeatured(page, products[0]) : wireAltar(page, products);
  page.meta = { title: `${r.name} — ${r.latin} | SAINTCHROME`, description: `${r.blurb} Shop SAINTCHROME ${r.name.toLowerCase()} in live 3D.` };
  page.mount = () => { page.enhance(); intro(); };
  return page;
}
