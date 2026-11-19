/**
 * Relic card used in The Altar, Rite pages and "You may also worship".
 * Shows the rendered product shot; on hover (desktop) the shot dissolves into a live,
 * draggable 3D viewer. Viewers are created on first hover and shared engine handles drawing.
 */
import { esc } from '../core/dom.js';
import { formatPrice } from '../config/site.js';
import { View } from '../viewer/view.js';
import { IS_TOUCH } from '../core/env.js';

export function cardHTML(p, { index = 0 } = {}) {
  return `
  <article class="card" data-slug="${p.slug}" data-rite="${p.rite}" style="--accent:${p.accent}" data-cursor="VIEW ✦">
    <a class="card__link" href="/relic/${p.slug}" aria-label="${esc(p.name)}, ${formatPrice(p.price)}">
      <div class="card__media">
        <img class="card__img" src="/shots/${p.slug}-card.jpg" alt="${esc(p.name)} — 3D render" loading="${index < 4 ? 'eager' : 'lazy'}" width="720" height="720" />
        <div class="card__live" aria-hidden="true"></div>
        <span class="card__shine" aria-hidden="true"></span>
        <span class="card__num mono">[ RELIC ${p.number} ]</span>
        ${p.brand !== 'SAINTCHROME' ? `<span class="card__brand mono">${esc(p.brand)}</span>` : ''}
        ${p.placeholder ? '<span class="card__brand mono">COMING SOON</span>' : ''}
      </div>
      <div class="card__meta">
        <h3 class="card__name">${esc(p.name)}</h3>
        <span class="card__price mono">${formatPrice(p.price)}</span>
      </div>
      <p class="card__tag">${esc(p.tagline)}</p>
    </a>
  </article>`;
}

/** Hover → live 3D. Returns a cleanup function. */
export function enhanceCards(root, products) {
  const views = [];
  const clearTimeouts = [];
  if (IS_TOUCH) return () => {};
  root.querySelectorAll('.card').forEach((card) => {
    const p = products.find((x) => x.slug === card.dataset.slug);
    let view = null;
    let hideTimer = 0;
    clearTimeouts.push(() => clearTimeout(hideTimer));
    card.addEventListener('pointerenter', () => {
      clearTimeout(hideTimer);
      if (view) view.hidden = false;
      if (!view) {
        view = new View(card.querySelector('.card__live'), { model: p.model, controls: false, autoRotate: 0, accent: p.accent, fit: 1.0, // same studio as the card shot underneath
          onUpdate: (v, dt) => { v.spin.rotation.y += dt * (card.matches(':hover') ? 0.9 : 0.25); } });
        views.push(view);
      }
      card.classList.add('is-live');
    });
    card.addEventListener('pointerleave', () => {
      card.classList.remove('is-live');
      // once the shot has faded back over it (.card__img transition: .6s), stop drawing the live
      // viewer: it is hidden anyway, and left running it keeps painting relics onto the shared canvas
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => { if (view && !card.classList.contains('is-live')) view.hidden = true; }, 700);
    });
    // 3D tilt toward the pointer
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      card.style.setProperty('--rx', `${-y * 6}deg`);
      card.style.setProperty('--ry', `${x * 8}deg`);
      card.style.setProperty('--mx', `${(x + 0.5) * 100}%`);
    });
  });
  return () => { clearTimeouts.forEach((fn) => fn()); views.forEach((v) => v.destroy()); };
}
