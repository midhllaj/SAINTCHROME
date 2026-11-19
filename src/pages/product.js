/**
 * RELIC (product page): big interactive 3D viewer with ✦ hotspots, a "materialise" scan
 * reveal, [ROTATE] [ZOOM] [RESET] [FULLSCREEN] controls, buy box and "You may also worship".
 */
import { createPage } from './_kit.js';
import { bySlug, PRODUCTS, riteBySlug } from '../config/products.js';
import { formatPrice, CONFIG } from '../config/site.js';
import { esc, STAR, toast } from '../core/dom.js';
import { gsap } from '../core/scroll.js';
import { cart } from '../core/cart.js';
import { burst } from '../animations/fx.js';
import { scramble } from '../animations/scramble.js';
import { cardHTML, enhanceCards } from '../ui/card.js';
import { openDrawer } from '../ui/drawer.js';
import { REDUCED_MOTION } from '../core/env.js';
import notFound from './notFound.js';
import { sequenceMarkup, wireSequence } from './sequence.js';
import { finishControl } from '../models/glasses.js';

const SWATCH = { obsidian: '#0b0b0d', emerald: '#13a04a' };

// polar / azimuth of the four rendered angle shots (must match src/lab-export.js)
const ANGLES = [[1.12, 0.6], [0.55, 0.0], [1.35, -1.2], [1.0, 2.6]];

function barcode(seed) {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const bars = [];
  for (let i = 0; i < 42; i++) { h = (h * 1103515245 + 12345) >>> 0; bars.push(`<i style="width:${1 + (h % 3)}px"></i>`); }
  return `<span class="barcode" aria-hidden="true">${bars.join('')}</span>`;
}

function related(p) {
  const same = PRODUCTS.filter((x) => x.rite === p.rite && x.slug !== p.slug);
  const other = PRODUCTS.filter((x) => x.rite !== p.rite && !x.placeholder);
  return [...same, ...other].slice(0, 4);
}

export default async function product({ slug }) {
  const p = bySlug(slug);
  if (!p) return notFound();
  const rite = riteBySlug(p.rite);
  const isResale = p.brand !== 'SAINTCHROME';
  const rel = related(p);

  const page = createPage('product', `
  <section class="product" style="--accent:${p.accent}">
    <div class="product__stage">
      <div class="product__view" data-lenis-prevent data-cursor="DRAG ⟲" role="img" aria-label="${esc(p.name)} — interactive 3D model. Drag to rotate, scroll to zoom."></div>
      <span class="product__scan mono" aria-hidden="true">[ MATERIALISING… <span class="scan-pct">000</span>% ]</span>
      <div class="product__barcode mono" aria-hidden="true">${barcode(p.slug)}<span>SC-${p.number}-${p.rite.slice(0, 3).toUpperCase()}</span></div>
      <div class="viewer-controls mono" role="toolbar" aria-label="3D viewer controls">
        <button type="button" data-ctl="rotate" aria-pressed="true">[ROTATE]</button>
        <button type="button" data-ctl="zoom" aria-pressed="false">[ZOOM]</button>
        <button type="button" data-ctl="reset">[RESET]</button>
        <button type="button" data-ctl="fs" aria-pressed="false">[FULLSCREEN]</button>
      </div>
    </div>

    <div class="product__info">
      <a class="product__num mono" href="/rites/${rite.slug}">[ RELIC ${p.number} ] ✦ ${rite.name.toUpperCase()} / ${rite.latin.toUpperCase()}</a>
      <h1 class="product__name chrome-text" data-text="${esc(p.name)}">${esc(p.name)}</h1>
      <p class="product__tagline">${esc(p.tagline)}</p>
      ${isResale ? `<div class="product__brand mono">${STAR} BRAND: ${esc(p.brand).toUpperCase()} · ORIGINAL ${esc(p.brand).toUpperCase()}</div>` : ''}
      ${p.variants ? `<div class="finish" role="radiogroup" aria-label="Acetate finish">${p.variants.map((f) => `<button type="button" role="radio" aria-checked="${f.slug === p.slug}" data-finish="${f.finish}" data-slug="${f.slug}"><i style="--sw:${SWATCH[f.finish]}"></i>${f.label}</button>`).join('')}</div>` : ''}
      ${p.placeholder ? `<p class="notice mono">PLACEHOLDER RELIC — this design is still being forged. The 3D model is a concept, not the final product.</p>` : ''}
      <div class="product__price"><span>${formatPrice(p.price)}</span><span class="mono">INCL. OF ALL TAXES</span></div>
      <p class="product__desc">${esc(p.description)}</p>

      <div class="buy">
        <div class="qty" role="group" aria-label="Quantity">
          <button type="button" data-q="-1" aria-label="Decrease quantity">−</button>
          <output aria-live="polite">1</output>
          <button type="button" data-q="1" aria-label="Increase quantity">+</button>
        </div>
        <button class="btn btn--chrome buy__add" type="button" data-magnetic="0.2" ${p.placeholder ? 'disabled' : ''}>
          <span class="btn__label">${p.placeholder ? 'BEING FORGED' : 'ADD TO OFFERINGS ✦'}</span>
        </button>
      </div>

      <details class="acc" open>
        <summary class="mono">MATERIALS</summary>
        <ul>${p.materials.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>
      </details>
      <details class="acc">
        <summary class="mono">DETAILS</summary>
        <ul>${p.details.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>
      </details>
      <details class="acc">
        <summary class="mono">SHIPPING & CARE</summary>
        <p>${esc(CONFIG.shippingNote)} Keep your relic dry, store it apart from other metals, and polish with a soft cloth to keep the chrome holy.</p>
      </details>
      ${isResale ? `<details class="acc"><summary class="mono">ABOUT THE BRAND</summary><p>${esc(p.name)} is an authentic ${esc(p.brand)} frame curated and resold by SAINTCHROME. It is not a SAINTCHROME design, and SAINTCHROME is not affiliated with ${esc(p.brand)}.</p></details>` : ''}

      <p class="mono" style="color:var(--dim);margin-top:30px">[ FOUR ANGLES — CLICK TO TURN THE RELIC ]</p>
      <div class="angles">
        ${ANGLES.map((_, i) => `<button type="button" data-angle="${i}" aria-label="View angle ${i + 1}"><img src="/shots/${p.slug}-a${i + 1}.jpg" alt="${esc(p.name)} — angle ${i + 1}" loading="lazy" width="800" height="800" /></button>`).join('')}
      </div>
      ${p.rite === 'eyewear' ? `<a class="btn btn--ghost btn--block" href="/try-the-halo?frame=${p.slug}" data-magnetic="0.15"><span class="btn__label">TRY THE HALO — LIVE ON YOUR FACE</span></a>` : ''}
    </div>
  </section>
  ${sequenceMarkup(p)}

  <section class="related">
    <header class="section-head">
      <span class="mono section-label">[ YOU MAY ALSO WORSHIP ]</span>
      <h2 class="h2 chrome-text" data-reveal="lines">More relics.</h2>
    </header>
    <div class="grid">${rel.map((x, i) => cardHTML(x, { index: i + 4 })).join('')}</div>
  </section>`);

  const viewEl = page.el.querySelector('.product__view');
  const pct = page.el.querySelector('.scan-pct');
  const scanLabel = page.el.querySelector('.product__scan');
  let resolveReady;
  const ready = new Promise((r) => (resolveReady = r));
  const view = page.view(viewEl, {
    model: p.model, controls: true, zoom: true, autoRotate: 0.8, accent: p.glow || p.accent,
    hotspots: p.hotspots, scan: !REDUCED_MOTION, keepAlive: true, fit: 1.08,
    onReady: () => resolveReady(),
  });
  setTimeout(() => resolveReady(), 4000);

  // controls
  const ctl = (k) => page.el.querySelector(`[data-ctl="${k}"]`);
  let zoomed = false;
  ctl('rotate').addEventListener('click', (e) => {
    const on = e.currentTarget.getAttribute('aria-pressed') !== 'true';
    e.currentTarget.setAttribute('aria-pressed', String(on));
    view.setAutoRotate(on);
  });
  ctl('zoom').addEventListener('click', (e) => {
    zoomed = !zoomed;
    e.currentTarget.setAttribute('aria-pressed', String(zoomed));
    view.zoomBy(zoomed ? 0.62 : 1 / 0.62);
  });
  ctl('reset').addEventListener('click', () => { zoomed = false; ctl('zoom').setAttribute('aria-pressed', 'false'); view.reset(); });
  const setFs = (on) => {
    viewEl.classList.toggle('is-fs', on);
    document.body.classList.toggle('viewer-fs', on);
    ctl('fs').setAttribute('aria-pressed', String(on));
    ctl('fs').textContent = on ? '[EXIT ✕]' : '[FULLSCREEN]';
    if (on && document.documentElement.requestFullscreen && !document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
    if (!on && document.fullscreenElement) document.exitFullscreen().catch(() => {});
  };
  ctl('fs').addEventListener('click', () => setFs(!viewEl.classList.contains('is-fs')));
  const onFsChange = () => { if (!document.fullscreenElement && viewEl.classList.contains('is-fs')) setFs(false); };
  const onKey = (e) => { if (e.key === 'Escape' && viewEl.classList.contains('is-fs')) setFs(false); };
  document.addEventListener('fullscreenchange', onFsChange);
  addEventListener('keydown', onKey);
  page.cleanup(() => { document.removeEventListener('fullscreenchange', onFsChange); removeEventListener('keydown', onKey); setFs(false); });

  page.el.querySelectorAll('[data-angle]').forEach((b) => b.addEventListener('click', () => {
    const [polar, az] = ANGLES[Number(b.dataset.angle)];
    ctl('rotate').setAttribute('aria-pressed', 'false');
    view.setAutoRotate(false);
    view.orbitTo(polar, az);
    if (innerWidth < 1100) viewEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }));

  // finish switcher (eyewear): the frame changes acetate in place, and the page becomes that relic
  let cur = p;
  if (p.variants) {
    const fs = { k: p.finish === 'emerald' ? 1 : 0 };
    let fc = null; // this viewer's own acetate (made on first use, once the model is in)
    const control = () => (fc ??= view.ready ? finishControl(view.object) : null);
    const q = (sel) => page.el.querySelector(sel);
    const swap = (n) => {
      cur = n;
      const name = q('.product__name');
      name.textContent = n.name; name.dataset.text = n.name;
      q('.product__tagline').textContent = n.tagline;
      q('.product__barcode span').textContent = `SC-${n.number}-${n.rite.slice(0, 3).toUpperCase()}`;
      q('.product__num').innerHTML = `[ RELIC ${n.number} ] ✦ ${rite.name.toUpperCase()} / ${rite.latin.toUpperCase()}`;
      q('.product__price span').textContent = formatPrice(n.price);
      q('.product__desc').textContent = n.description;
      const lists = page.el.querySelectorAll('.product__info details.acc ul');
      lists[0].innerHTML = n.materials.map((m) => `<li>${esc(m)}</li>`).join('');
      lists[1].innerHTML = n.details.map((m) => `<li>${esc(m)}</li>`).join('');
      page.el.querySelectorAll('[data-angle] img').forEach((img, i) => { img.src = `/shots/${n.slug}-a${i + 1}.jpg`; img.alt = `${n.name} — angle ${i + 1}`; });
      const tryon = page.el.querySelector('a[href^="/try-the-halo"]');
      if (tryon) tryon.href = `/try-the-halo?frame=${n.slug}`;
      page.el.querySelectorAll('.product__info details.acc p').forEach((el) => { el.innerHTML = el.innerHTML.split(esc(p.name)).join(esc(n.name)); });
      page.el.querySelector('.product').style.setProperty('--accent', n.accent);
      for (const h of view.hotspotEls || []) {
        const info = n.hotspots[h.data.id];
        if (!info) continue;
        h.el.querySelector('strong').textContent = info.title;
        h.el.querySelector('p').textContent = info.text;
      }
      history.replaceState(history.state, '', `/relic/${n.slug}`);
      document.title = `${n.name} — Relic ${n.number} | SAINTCHROME`;
    };
    page.el.querySelectorAll('.finish button').forEach((b) => b.addEventListener('click', () => {
      if (b.getAttribute('aria-checked') === 'true') return;
      page.el.querySelectorAll('.finish button').forEach((o) => o.setAttribute('aria-checked', String(o === b)));
      const n = bySlug(b.dataset.slug);
      gsap.to(fs, { k: b.dataset.finish === 'emerald' ? 1 : 0, duration: REDUCED_MOTION ? 0 : 1.1, ease: 'power2.inOut', overwrite: true, onUpdate: () => control()?.set(fs.k) });
      swap(n);
    }));
  }

  // quantity + add
  let qty = 1;
  const out = page.el.querySelector('.qty output');
  page.el.querySelectorAll('[data-q]').forEach((b) => b.addEventListener('click', () => {
    qty = Math.max(1, Math.min(9, qty + Number(b.dataset.q)));
    out.textContent = qty;
  }));
  page.el.querySelector('.buy__add').addEventListener('click', (e) => {
    const p = cur;
    cart.add(p.slug, qty);
    const r = e.currentTarget.getBoundingClientRect();
    const col = p.accent.match(/[\da-f]{2}/gi).map((h) => parseInt(h, 16)).join(',');
    burst(r.left + r.width / 2, r.top + r.height / 2, { count: 40, power: 10 });
    burst(r.left + r.width / 2, r.top + r.height / 2, { count: 18, power: 6, color: col });
    toast(`✦ ${p.name} added to your offerings`);
    setTimeout(openDrawer, 650);
  });

  page.cleanup(enhanceCards(page.el.querySelector('.related'), rel));

  page.meta = {
    title: `${p.name} — Relic ${p.number} | SAINTCHROME`,
    description: `${p.tagline} ${formatPrice(p.price)}. Explore ${p.name} in live 3D.`,
    image: `/shots/${p.slug}.png`,
  };
  page.ready = ready;
  page.mount = () => {
    page.enhance();
    wireSequence(page, p);
    scramble(page.el.querySelector('.product__name'), p.name, { duration: 1.1 });
    page.gsap(() => {
      gsap.from(page.el.querySelectorAll('.product__info > *'), { y: 40, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.05, delay: 0.1 });
      if (view.o.scan) {
        const s = { v: 0 };
        gsap.to(s, {
          v: 1, duration: 2.4, ease: 'power2.inOut', delay: 0.15,
          onUpdate: () => { view.scanProgress = s.v; pct.textContent = String(Math.round(s.v * 100)).padStart(3, '0'); },
          onComplete: () => { scanLabel.innerHTML = '[ RELIC MATERIALISED ✦ TAP THE STARS ]'; },
        });
      } else {
        scanLabel.innerHTML = '[ TAP THE STARS ✦ ]';
      }
    });
  };
  return page;
}
