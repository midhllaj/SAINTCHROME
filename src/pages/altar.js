/**
 * THE ALTAR — every relic. Animated rite filters (GSAP Flip) + sort, live-3D cards on hover.
 */
import { Flip } from 'gsap/Flip';
import { createPage } from './_kit.js';
import { PRODUCTS, RITES } from '../config/products.js';
import { cardHTML, enhanceCards } from '../ui/card.js';
import { gsap } from '../core/scroll.js';
import { ScrollTrigger } from '../core/scroll.js';

gsap.registerPlugin(Flip);

/** Page heading. --chars (longest word) lets the CSS shrink the title so it never clips. */
export function heroMarkup({ title, sub, label }) {
  return `
  <section class="page-hero">
    <span class="mono">${label}</span>
    <h1 class="page-hero__title chrome-text" data-reveal="lines" style="--chars:${Math.max(...title.split(/\s+/).map((w) => w.length))}">${title}</h1>
    <p class="page-hero__sub" data-reveal="fade">${sub}</p>
  </section>`;
}

export function altarMarkup({ title, sub, label, products, filters = true, active = 'all' }) {
  return `
  ${heroMarkup({ title, sub, label })}
  ${filters ? `
  <div class="filters" role="toolbar" aria-label="Filter relics by rite">
    <button class="filter" type="button" data-filter="all" aria-pressed="${active === 'all'}" data-scramble>ALL<sup>${PRODUCTS.length}</sup></button>
    ${RITES.map((r) => `<button class="filter" type="button" data-filter="${r.slug}" aria-pressed="${active === r.slug}">${r.name.toUpperCase()}<sup>${PRODUCTS.filter((p) => p.rite === r.slug).length}</sup></button>`).join('')}
    <label class="filters__sort mono">SORT
      <select aria-label="Sort relics">
        <option value="number">BY NUMBER</option>
        <option value="low">PRICE ↑</option>
        <option value="high">PRICE ↓</option>
        <option value="name">A → Z</option>
      </select>
    </label>
  </div>` : ''}
  <p class="altar-count mono" aria-live="polite"></p>
  <div class="grid">
    ${products.map((p, i) => cardHTML(p, { index: i })).join('')}
  </div>`;
}

export function wireAltar(page, products, { active = 'all' } = {}) {
  const grid = page.el.querySelector('.grid');
  const count = page.el.querySelector('.altar-count');
  let filter = active, sort = 'number';

  const apply = (animate = true) => {
    const cards = [...grid.children];
    const state = animate ? Flip.getState(cards) : null;
    const sorted = [...cards].sort((a, b) => {
      const pa = products.find((p) => p.slug === a.dataset.slug), pb = products.find((p) => p.slug === b.dataset.slug);
      if (sort === 'low') return pa.price - pb.price;
      if (sort === 'high') return pb.price - pa.price;
      if (sort === 'name') return pa.name.localeCompare(pb.name);
      return pa.number.localeCompare(pb.number);
    });
    sorted.forEach((c) => grid.appendChild(c));
    let n = 0;
    cards.forEach((c) => { const on = filter === 'all' || c.dataset.rite === filter; c.classList.toggle('is-hidden', !on); n += on; });
    count.textContent = `[ ${String(n).padStart(2, '0')} RELIC${n === 1 ? '' : 'S'} ON THE ALTAR ]`;
    if (state) {
      Flip.from(state, {
        duration: 0.8, ease: 'expo.out', stagger: 0.03, absolute: true,
        onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.85, y: 40 }, { opacity: 1, scale: 1, y: 0, duration: 0.8, ease: 'expo.out', stagger: 0.04 }),
        onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.85, duration: 0.4 }),
        onComplete: () => ScrollTrigger.refresh(),
      });
    }
  };

  page.el.querySelectorAll('[data-filter]').forEach((b) => b.addEventListener('click', () => {
    filter = b.dataset.filter;
    page.el.querySelectorAll('[data-filter]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    apply();
  }));
  page.el.querySelector('.filters__sort select')?.addEventListener('change', (e) => { sort = e.target.value; apply(); });
  apply(false);
  page.cleanup(enhanceCards(page.el, products));

  return () => {
    page.gsap(() => {
      gsap.from(grid.querySelectorAll('.card:not(.is-hidden)'), {
        y: 80, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: 0.06,
        scrollTrigger: { trigger: grid, start: 'top 90%' },
      });
    });
  };
}

export default async function altar() {
  const page = createPage('altar', `
    ${altarMarkup({
      label: '[ THE ALTAR ✦ ALL RELICS ]',
      title: 'The Altar',
      sub: 'Every relic we have forged, laid out in chrome. Hover to wake one up. Click to worship it up close.',
      products: PRODUCTS,
    })}
    <div class="altar-bottom">
      <p class="mono section-label">[ NOT SURE WHERE TO KNEEL? ]</p>
      <div class="center" style="margin-top:18px"><a class="btn btn--ghost" href="/try-the-halo" data-magnetic><span class="btn__label">TRY THE HALO — LIVE TRY-ON</span></a></div>
    </div>`);
  const intro = wireAltar(page, PRODUCTS);
  page.meta = { title: 'The Altar — All Relics | SAINTCHROME', description: 'Shop every SAINTCHROME relic: chrome bracelets, necklaces, eyewear and earphones, in live 3D.' };
  page.mount = () => { page.enhance(); intro(); };
  return page;
}
