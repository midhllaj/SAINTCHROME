/**
 * The HUD: thin mono navigation framing the screen (corner labels, live clock,
 * offerings counter) + a full-screen menu on small screens.
 */
import { el, STAR } from '../core/dom.js';
import { cart } from '../core/cart.js';
import { openDrawer } from './drawer.js';
import { onRoute } from '../core/router.js';
import { scrambleOnHover } from '../animations/scramble.js';
import { RITES } from '../config/products.js';
import { stopScroll } from '../core/scroll.js';

export function initHud() {
  const hud = document.getElementById('hud');
  hud.innerHTML = `
    <a class="hud__brand" href="/" aria-label="SAINTCHROME — home">
      <img src="/brand/icon-512.png" alt="" width="34" height="34" />
      <span class="hud__word">SAINTCHROME</span>
    </a>
    <nav class="hud__nav" aria-label="Primary">
      <a href="/altar" data-scramble>THE ALTAR</a>
      <a href="/chapel" data-scramble>THE CHAPEL</a>
      <a href="/about" data-scramble>THE ORDER</a>
    </nav>
    <div class="hud__right">
      <span class="hud__clock mono" aria-hidden="true"></span>
      <button class="hud__cart mono" type="button" aria-label="Open offerings">OFFERINGS (<span class="hud__count">0</span>)</button>
      <button class="hud__burger" type="button" aria-expanded="false" aria-controls="menu" aria-label="Open menu"><span></span><span></span></button>
    </div>
    <div class="hud__corner hud__corner--bl mono" aria-hidden="true">[ SACRED METAL ] <span class="hud__route"></span></div>
    <div class="hud__corner hud__corner--br mono" aria-hidden="true">${STAR} WEAR YOUR HALO</div>`;

  const menu = el(`
    <div class="menu" id="menu" aria-hidden="true">
      <div class="menu__halo" aria-hidden="true"></div>
      <nav class="menu__nav" aria-label="Menu">
        <a href="/" class="menu__link"><span class="mono">00</span>HOME</a>
        <a href="/altar" class="menu__link"><span class="mono">01</span>THE ALTAR</a>
        ${RITES.map((r, i) => `<a href="/rites/${r.slug}" class="menu__link menu__link--sub"><span class="mono">0${i + 2}</span>${r.name.toUpperCase()}</a>`).join('')}
        <a href="/chapel" class="menu__link"><span class="mono">06</span>THE CHAPEL</a>
        <a href="/about" class="menu__link"><span class="mono">07</span>THE ORDER</a>
        <a href="/offerings" class="menu__link"><span class="mono">08</span>OFFERINGS</a>
      </nav>
      <p class="menu__foot mono">✦ RELICS FOR THE MODERN SAINT ✦</p>
    </div>`);
  document.body.appendChild(menu);

  const burger = hud.querySelector('.hud__burger');
  const setMenu = (open) => {
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    burger.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('menu-open', open);
    stopScroll(open);
  };
  burger.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.classList.contains('is-open')) setMenu(false); });

  hud.querySelector('.hud__cart').addEventListener('click', openDrawer);
  const count = hud.querySelector('.hud__count');
  const update = () => {
    count.textContent = cart.count;
    hud.querySelector('.hud__cart').classList.toggle('has-items', cart.count > 0);
  };
  cart.on(() => {
    update();
    count.parentElement.classList.remove('bump');
    void count.offsetWidth;
    count.parentElement.classList.add('bump');
  });
  update();

  const clock = hud.querySelector('.hud__clock');
  const tick = () => {
    const d = new Date();
    clock.textContent = `${d.toLocaleTimeString('en-GB', { hour12: false })} IST`;
  };
  tick();
  setInterval(tick, 1000);

  const route = hud.querySelector('.hud__route');
  onRoute((path) => {
    route.textContent = path === '/' ? '/ SANCTUARY' : path.toUpperCase();
    hud.querySelectorAll('.hud__nav a').forEach((a) => a.classList.toggle('is-active', path.startsWith(a.getAttribute('href'))));
  });
  scrambleOnHover(hud);
}
