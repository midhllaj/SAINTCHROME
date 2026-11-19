/**
 * OFFERINGS — the full cart page (the drawer mirrors it).
 */
import { createPage } from './_kit.js';
import { cart } from '../core/cart.js';
import { esc } from '../core/dom.js';
import { formatPrice, CONFIG } from '../config/site.js';
import { checkout } from '../ui/checkout.js';
import { PRODUCTS } from '../config/products.js';
import { cardHTML, enhanceCards } from '../ui/card.js';

export default async function offerings() {
  const suggestions = PRODUCTS.filter((p) => !p.placeholder).slice(0, 4);
  const page = createPage('offerings', `
  <section class="page-hero">
    <span class="mono">[ YOUR OFFERINGS ]</span>
    <h1 class="page-hero__title chrome-text" data-reveal="lines">Offerings</h1>
    <p class="page-hero__sub offerings__count mono"></p>
  </section>
  <div class="offerings-root"></div>
  <section class="related">
    <header class="section-head">
      <span class="mono section-label">[ ONE MORE RELIC? ]</span>
      <h2 class="h2 chrome-text" data-reveal="lines">Still on the Altar.</h2>
    </header>
    <div class="grid">${suggestions.map((p, i) => cardHTML(p, { index: i })).join('')}</div>
  </section>`);

  const root = page.el.querySelector('.offerings-root');
  const countEl = page.el.querySelector('.offerings__count');
  const render = () => {
    const items = cart.items;
    countEl.textContent = items.length ? `${cart.count} RELIC${cart.count > 1 ? 'S' : ''} READY TO BE BLESSED` : 'YOUR ALTAR IS EMPTY';
    root.innerHTML = items.length ? `
      <div class="offerings">
        <div class="offerings__list">
          ${items.map(({ product: p, qty }) => `
            <article class="line">
              <a class="line__img" href="/relic/${p.slug}"><img src="/shots/${p.slug}-card.jpg" alt="${esc(p.name)}" /></a>
              <div class="line__body">
                <span class="mono">[ RELIC ${p.number} ]${p.brand !== 'SAINTCHROME' ? ' · ' + esc(p.brand).toUpperCase() : ''}</span>
                <a class="line__name" href="/relic/${p.slug}">${esc(p.name)}</a>
                <div class="line__qty">
                  <button type="button" data-slug="${p.slug}" data-qty="${qty - 1}" aria-label="Decrease quantity of ${esc(p.name)}">−</button>
                  <span>${qty}</span>
                  <button type="button" data-slug="${p.slug}" data-qty="${qty + 1}" aria-label="Increase quantity of ${esc(p.name)}">+</button>
                </div>
                <button class="line__remove mono" type="button" data-remove="${p.slug}">REMOVE</button>
              </div>
              <div class="line__price">${formatPrice(p.price * qty)}</div>
            </article>`).join('')}
        </div>
        <aside class="offerings__summary">
          <h2>Summary</h2>
          <div class="sum-row"><span>Subtotal</span><span>${formatPrice(cart.subtotal)}</span></div>
          <div class="sum-row"><span>Shipping</span><span class="mono">AT CHECKOUT</span></div>
          <div class="sum-row sum-row--total"><span>Total</span><span>${formatPrice(cart.subtotal)}</span></div>
          <p class="mono" style="color:var(--dim);font-size:10px">${esc(CONFIG.shippingNote)}</p>
          <button class="btn btn--chrome btn--block" type="button" data-checkout data-magnetic="0.15"><span class="btn__label">COMPLETE THE OFFERING ✦</span></button>
          <a class="btn btn--ghost btn--block" href="/altar"><span class="btn__label">CONTINUE WORSHIPPING</span></a>
        </aside>
      </div>` : `
      <div class="empty">
        <div class="drawer__empty-halo" aria-hidden="true"></div>
        <p>No relics on your altar yet. Every saint starts somewhere.</p>
        <a class="btn btn--chrome" href="/altar" data-magnetic><span class="btn__label">ENTER THE ALTAR</span></a>
      </div>`;
  };
  root.addEventListener('click', (e) => {
    const q = e.target.closest('[data-qty]');
    if (q) cart.set(q.dataset.slug, Number(q.dataset.qty));
    const r = e.target.closest('[data-remove]');
    if (r) cart.remove(r.dataset.remove);
    if (e.target.closest('[data-checkout]')) checkout();
  });
  render();
  page.cleanup(cart.on(render));
  page.cleanup(enhanceCards(page.el.querySelector('.related'), suggestions));

  page.meta = { title: 'Your Offerings | SAINTCHROME', description: 'Your SAINTCHROME cart.' };
  page.mount = () => page.enhance();
  return page;
}
