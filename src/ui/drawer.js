/**
 * Offerings drawer (slide-in cart). Mirrors the /offerings page.
 */
import { el, esc } from '../core/dom.js';
import { cart } from '../core/cart.js';
import { formatPrice, CONFIG } from '../config/site.js';
import { stopScroll } from '../core/scroll.js';
import { checkout } from './checkout.js';

let drawer;
let lastFocus;

export function initDrawer() {
  drawer = el(`
    <aside class="drawer" aria-hidden="true" aria-label="Your offerings" role="dialog" aria-modal="true">
      <div class="drawer__scrim" data-close></div>
      <div class="drawer__panel">
        <header class="drawer__head">
          <span class="mono">[ YOUR OFFERINGS ]</span>
          <button class="drawer__close mono" type="button" data-close aria-label="Close offerings">CLOSE ✕</button>
        </header>
        <div class="drawer__list" data-lenis-prevent></div>
        <footer class="drawer__foot">
          <div class="drawer__row"><span class="mono">SUBTOTAL</span><strong class="drawer__subtotal"></strong></div>
          <p class="drawer__note mono">${esc(CONFIG.shippingNote)}</p>
          <button class="btn btn--chrome btn--block drawer__checkout" type="button" data-magnetic="0.15"><span class="btn__label">COMPLETE THE OFFERING</span></button>
          <a class="btn btn--ghost btn--block" href="/offerings"><span class="btn__label">VIEW ALL OFFERINGS</span></a>
        </footer>
      </div>
    </aside>`);
  document.getElementById('drawer-root').appendChild(drawer);
  drawer.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]') || e.target.closest('a')) closeDrawer();
    const btn = e.target.closest('[data-qty]');
    if (btn) cart.set(btn.dataset.slug, Number(btn.dataset.qty));
  });
  drawer.querySelector('.drawer__checkout').addEventListener('click', () => checkout());
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && drawer.classList.contains('is-open')) closeDrawer(); });
  cart.on(render);
  render();
}

function render() {
  const list = drawer.querySelector('.drawer__list');
  const items = cart.items;
  list.innerHTML = items.length ? items.map(({ product: p, qty }) => `
    <article class="line">
      <a class="line__img" href="/relic/${p.slug}"><img src="/shots/${p.slug}-card.jpg" alt="${esc(p.name)}" loading="lazy" /></a>
      <div class="line__body">
        <span class="mono">[ RELIC ${p.number} ]</span>
        <a class="line__name" href="/relic/${p.slug}">${esc(p.name)}</a>
        <div class="line__qty">
          <button type="button" data-slug="${p.slug}" data-qty="${qty - 1}" aria-label="Decrease quantity">−</button>
          <span aria-live="polite">${qty}</span>
          <button type="button" data-slug="${p.slug}" data-qty="${qty + 1}" aria-label="Increase quantity">+</button>
        </div>
      </div>
      <div class="line__price">${formatPrice(p.price * qty)}</div>
    </article>`).join('') : `
    <div class="drawer__empty">
      <div class="drawer__empty-halo" aria-hidden="true"></div>
      <p>No offerings yet.</p>
      <a class="btn btn--ghost" href="/altar"><span class="btn__label">ENTER THE ALTAR</span></a>
    </div>`;
  drawer.querySelector('.drawer__subtotal').textContent = formatPrice(cart.subtotal);
  drawer.querySelector('.drawer__foot').hidden = !items.length;
}

export function openDrawer() {
  lastFocus = document.activeElement;
  drawer.classList.add('is-open');
  drawer.setAttribute('aria-hidden', 'false');
  stopScroll(true);
  setTimeout(() => drawer.querySelector('.drawer__close').focus(), 50);
}

export function closeDrawer() {
  drawer.classList.remove('is-open');
  drawer.setAttribute('aria-hidden', 'true');
  stopScroll(false);
  lastFocus?.focus?.();
}
