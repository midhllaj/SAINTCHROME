/**
 * HOME — the sanctuary.
 * hero halo → manifesto → the Rites → featured relics (pinned horizontal 3D) → marquee →
 * spotlight (Blood Saint rotates with scroll) → Chapel preview → Confessions → Congregation.
 */
import * as THREE from 'three';
import { createPage } from './_kit.js';
import { PRODUCTS, RITES, bySlug, byRite } from '../config/products.js';
import { formatPrice, CONFIG } from '../config/site.js';
import { esc, STAR, toast } from '../core/dom.js';
import { gsap, ScrollTrigger, onTick } from '../core/scroll.js';
import { loadModel } from '../models/index.js';
import { scramble } from '../animations/scramble.js';
import { marquee } from '../animations/marquee.js';
import { IS_TOUCH, IS_SMALL, REDUCED_MOTION } from '../core/env.js';

const RITE_COVER = { bracelets: 'blood-saint', necklaces: 'rosary-of-ash', eyewear: 'emerald-vision', earphones: 'silent-choir' };

export default async function home() {
  const blood = bySlug('blood-saint');
  const page = createPage('home', `
  <!-- HERO -->
  <section class="hero" aria-label="SAINTCHROME">
    <div class="hero__view" aria-hidden="true"></div>
    <div class="hero__hud mono" aria-hidden="true">
      <span class="hud-tl">[ RELIC 002 ] — BLOOD SAINT</span>
      <span class="hud-tr">LAT 19.0760° N ✦ LON 72.8777° E</span>
      <span class="hud-ml">SACRED<br/>METAL<br/>/ 01</span>
      <span class="hud-mr">[ + ]</span>
    </div>
    <div class="hero__content">
      <p class="hero__kicker mono">[ RELICS FOR THE MODERN SAINT ]</p>
      <h1 class="hero__title chrome-text" data-text="SAINTCHROME">SAINTCHROME</h1>
      <p class="hero__tag">Wear Your Halo.</p>
      <div class="hero__cta">
        <a class="btn btn--chrome" href="/altar" data-magnetic><span class="btn__label">ENTER THE ALTAR</span></a>
        <a class="btn btn--ghost" href="/chapel" data-magnetic><span class="btn__label">THE CHAPEL</span></a>
      </div>
    </div>
    <div class="hero__scroll mono" aria-hidden="true"><span>SCROLL TO ASCEND</span><i></i></div>
  </section>

  <!-- MANIFESTO -->
  <section class="manifesto">
    <span class="mono section-label">[ 01 — THE CREED ]</span>
    <p class="manifesto__text" data-reveal="words">
      We don't make jewellery. We forge <em>relics</em>, sacred metal for the ones who never asked permission to shine.
      Every link is a vow. Every crystal, a confession. Every star, a promise kept in chrome.
      Gothic cathedral, liquid future. <em>Wear your halo.</em>
    </p>
    <div class="manifesto__sig mono">${STAR} SAINTCHROME / EST. IN CHROME</div>
  </section>

  <!-- THE RITES -->
  <section class="rites">
    <header class="section-head">
      <span class="mono section-label">[ 02 — THE RITES ]</span>
      <h2 class="h2 chrome-text" data-reveal="lines">Choose your rite.</h2>
    </header>
    <div class="rites__grid">
      ${RITES.map((r, i) => {
        const cover = bySlug(RITE_COVER[r.slug]);
        return `
        <a class="rite-panel" href="/rites/${r.slug}" style="--accent:${cover.accent}" data-cursor="ENTER ✦">
          <img src="/shots/${cover.slug}-a1.jpg" alt="${r.name} — ${esc(cover.name)} render" loading="lazy" />
          <span class="rite-panel__shine" aria-hidden="true"></span>
          <span class="rite-panel__num mono">0${i + 1}</span>
          <span class="rite-panel__latin mono">${r.latin.toUpperCase()}</span>
          <div class="rite-panel__body">
            <h3>${r.name}</h3>
            <p>${esc(r.blurb)}</p>
            <span class="mono">${byRite(r.slug).length} RELIC${byRite(r.slug).length > 1 ? 'S' : ''} →</span>
          </div>
        </a>`;
      }).join('')}
    </div>
  </section>

  <!-- FEATURED: pinned horizontal live 3D -->
  <section class="showcase" aria-label="Featured relics">
    <div class="showcase__head">
      <span class="mono section-label">[ 03 — THE RELICS ]</span>
      <h2 class="h2 chrome-text">Every relic, alive.</h2>
      <p class="mono showcase__hint">${IS_TOUCH ? 'SWIPE ⟷' : 'SCROLL ⟶ / DRAG TO ROTATE ⟲'}</p>
    </div>
    <div class="showcase__track">
      ${PRODUCTS.map((p) => `
      <article class="slide" style="--accent:${p.accent}">
        <div class="slide__ghost" aria-hidden="true">${esc(p.name)}</div>
        <div class="slide__view" data-model="${p.model}" data-accent="${p.accent}" role="img" aria-label="${esc(p.name)} — interactive 3D model"></div>
        <div class="slide__meta">
          <span class="mono">[ RELIC ${p.number} ] ${p.brand !== 'SAINTCHROME' ? '· ' + esc(p.brand) : ''}</span>
          <h3>${esc(p.name)}</h3>
          <p>${esc(p.tagline)}</p>
          <div class="slide__row">
            <span class="mono">${formatPrice(p.price)}</span>
            <a class="link-arrow mono" href="/relic/${p.slug}">WORSHIP →</a>
          </div>
        </div>
      </article>`).join('')}
    </div>
    <div class="showcase__progress" aria-hidden="true"><i></i></div>
  </section>

  <!-- MARQUEE -->
  <div class="marquee" aria-hidden="true">
    <div class="marquee__track">
      <span>✦ WEAR YOUR HALO ✦ BLESSED IN CHROME ✦ RELICS FOR THE MODERN SAINT </span>
      <span class="outline">✦ WEAR YOUR HALO ✦ BLESSED IN CHROME ✦ RELICS FOR THE MODERN SAINT </span>
    </div>
  </div>

  <!-- SPOTLIGHT -->
  <section class="spotlight" style="--accent:${blood.accent}">
    <div class="spotlight__pin">
      <div class="spotlight__ghost chrome-text" aria-hidden="true">BLOOD SAINT</div>
      <div class="spotlight__view" role="img" aria-label="Blood Saint bracelet — rotating 3D model"></div>
      <div class="spotlight__side">
        <span class="mono section-label">[ 04 — SPOTLIGHT / RELIC ${blood.number} ]</span>
        <h2 class="h2 chrome-text">Blood Saint</h2>
        <p class="spotlight__copy">${esc(blood.tagline)}</p>
        <ol class="spotlight__chapters mono">
          ${['crystal', 'vines', 'star', 'chain'].map((id, i) => `<li data-hs="${id}"><span>0${i + 1}</span>${esc(blood.hotspots[id].title)}</li>`).join('')}
        </ol>
        <div class="spotlight__deg mono"><span class="spotlight__deg-num">000</span>° / 360°</div>
        <a class="btn btn--chrome" href="/relic/${blood.slug}" data-magnetic><span class="btn__label">WORSHIP · ${formatPrice(blood.price)}</span></a>
      </div>
    </div>
  </section>

  <!-- CHAPEL PREVIEW -->
  <section class="chapel-preview">
    <header class="section-head">
      <span class="mono section-label">[ 05 — THE CHAPEL ]</span>
      <h2 class="h2 chrome-text" data-reveal="lines">Visions from the chapel.</h2>
    </header>
    <div class="chapel-preview__grid">
      ${['blood-saint', 'thorn-relic', 'emerald-vision', 'the-visitor'].map((s, i) => `
      <a class="chapel-tile chapel-tile--${i}" href="/chapel" data-cursor="ENTER ✦">
        <div class="chapel-tile__img" data-parallax="${[0.15, -0.1, 0.2, -0.15][i]}"><img src="/chapel/${s}-${(i % 2) + 1}.jpg" alt="${esc(bySlug(s).name)}, dramatic render" loading="lazy" /></div>
        <span class="mono">${esc(bySlug(s).name.toUpperCase())}</span>
      </a>`).join('')}
    </div>
    <div class="center"><a class="btn btn--ghost" href="/chapel" data-magnetic><span class="btn__label">ENTER THE CHAPEL</span></a></div>
  </section>

  <!-- CONFESSIONS (placeholders — never present invented reviews as real) -->
  <section class="confessions">
    <header class="section-head">
      <span class="mono section-label">[ 06 — CONFESSIONS ]</span>
      <h2 class="h2 chrome-text" data-reveal="lines">What the saints say.</h2>
    </header>
    <div class="confessions__grid">
      ${[1, 2, 3].map((n) => `
      <figure class="confession" data-reveal="fade" data-delay="${n * 0.1}">
        <span class="confession__badge mono">PLACEHOLDER ${n}/3</span>
        <blockquote>“Replace this with a real customer review. Paste their words exactly as they wrote them.”</blockquote>
        <figcaption class="mono">— CUSTOMER NAME · CITY · RELIC</figcaption>
      </figure>`).join('')}
    </div>
    <p class="confessions__note mono">// Confessions are placeholders until real reviews arrive. Edit them in src/pages/home.js</p>
  </section>

  <!-- CONGREGATION -->
  <section class="congregation">
    <div class="congregation__halo" aria-hidden="true"></div>
    <span class="mono section-label">[ 07 — JOIN THE CONGREGATION ]</span>
    <h2 class="h2 chrome-text" data-reveal="lines">Be first at the altar.</h2>
    <p>New relics, private drops and the occasional revelation. No sermons, no spam.</p>
    <form class="newsletter" novalidate>
      <label class="sr-only" for="nl-email">Email address</label>
      <input id="nl-email" type="email" name="email" placeholder="your@email.com" autocomplete="email" required />
      <button class="btn btn--chrome" type="submit" data-magnetic="0.2"><span class="btn__label">JOIN ✦</span></button>
    </form>
    <p class="newsletter__msg mono" role="status" aria-live="polite"></p>
  </section>`);

  /* ---------------- HERO 3D: giant halo + Blood Saint floating inside ---------------- */
  const heroEl = page.el.querySelector('.hero__view');
  const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
  let heroProgress = 0;
  let saint = null;
  const heroReady = new Promise((resolve) => {
    page.view(heroEl, {
      model: 'halo', controls: false, autoRotate: 0, background: null, backdrop: false,
      fit: IS_SMALL ? 1.15 : 0.82, polar: Math.PI / 2, fov: 30, keepAlive: true,
      onReady: async (v) => {
        const { object } = await loadModel('bloodSaint');
        const box = new THREE.Box3().setFromObject(object);
        object.position.sub(box.getCenter(new THREE.Vector3()));
        saint = new THREE.Group();
        saint.add(object);
        saint.scale.setScalar(1.18);
        saint.rotation.x = 0.35;
        v.pivot.add(saint);
        v.halo = v.object;
        v.stars = v.object.getObjectByName('haloStars');
        v.orbits = v.object.getObjectByName('orbits');
        resolve();
      },
      onUpdate: (v, dt, t) => {
        mouse.sx += (mouse.x - mouse.sx) * 0.05;
        mouse.sy += (mouse.y - mouse.sy) * 0.05;
        const p = heroProgress;
        if (v.halo) {
          v.halo.rotation.z += dt * 0.06;
          v.halo.rotation.x = mouse.sy * 0.25 + p * 0.9;
          v.halo.rotation.y = mouse.sx * 0.35;
          v.orbits.rotation.y += dt * 0.12;
          v.stars.children.forEach((s, i) => {
            const k = 0.75 + 0.35 * Math.max(0, Math.sin(t * 1.6 + i * 1.3)) ** 6;
            s.scale.setScalar((i % 2 ? 0.72 : 1) * k);
            s.rotation.z = Math.sin(t * 0.5 + i) * 0.2;
          });
        }
        if (saint) {
          saint.rotation.y += dt * (REDUCED_MOTION ? 0.1 : 0.45);
          saint.position.y = Math.sin(t * 0.9) * 0.35;
          saint.rotation.z = mouse.sx * 0.2;
        }
        // scroll: dolly through the halo
        v.camera.position.set(mouse.sx * 1.2, -mouse.sy * 0.8, v.fitDistance * (1 - p * 0.55));
        v.camera.lookAt(0, 0, 0);
      },
    });
  });

  const onMove = (e) => { mouse.x = (e.clientX / innerWidth) * 2 - 1; mouse.y = (e.clientY / innerHeight) * 2 - 1; };
  addEventListener('pointermove', onMove, { passive: true });
  page.cleanup(() => removeEventListener('pointermove', onMove));

  /* ---------------- showcase views ---------------- */
  const slideViews = [...page.el.querySelectorAll('.slide__view')].map((el) =>
    page.view(el, { model: el.dataset.model, controls: !IS_TOUCH, autoRotate: 1.4, accent: el.dataset.accent, background: null, backdrop: false, fit: 0.8, polar: 1.2 }));

  /* ---------------- spotlight view ---------------- */
  let spotP = 0;
  const spot = page.view(page.el.querySelector('.spotlight__view'), {
    model: 'bloodSaint', controls: false, autoRotate: 0, accent: blood.accent, background: null, backdrop: false,
    hotspots: blood.hotspots, fit: IS_SMALL ? 1.0 : 0.82, polar: 1.25,
    onUpdate: (v) => { v.spin.rotation.y = spotP * Math.PI * 2 - SPOT_OFFSET; syncChapters(v); },
  });
  // each annotation opens when its part of the relic turns to face the camera
  const SPOT_OFFSET = 0.4;
  let peaks = null, lastIdx = -2;
  function syncChapters(v) {
    const lis = [...page.el.querySelectorAll('.spotlight__chapters li')];
    if (!peaks && v.hotspotData) {
      const TAU = Math.PI * 2;
      peaks = {};
      for (const h of v.hotspotData) peaks[h.id] = ((((SPOT_OFFSET - Math.atan2(h.normal.x, h.normal.z)) / TAU) % 1) + 1) % 1;
      lis.sort((a, b) => peaks[a.dataset.hs] - peaks[b.dataset.hs]).forEach((li, i) => { li.parentNode.appendChild(li); li.querySelector('span').textContent = `0${i + 1}`; });
    }
    if (!peaks) return;
    let idx = -1, best = 0.09;
    lis.forEach((li, i) => { const d = Math.abs(spotP - peaks[li.dataset.hs]); if (d < best) { best = d; idx = i; } });
    if (idx === lastIdx) return;
    lastIdx = idx;
    lis.forEach((li, i) => { li.classList.toggle('is-on', i === idx); v.showHotspot(li.dataset.hs, i === idx); });
  }

  /* ---------------- newsletter ---------------- */
  const form = page.el.querySelector('.newsletter');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = page.el.querySelector('.newsletter__msg');
    const email = form.email.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { msg.textContent = '✦ That address is not of this world. Try again.'; form.email.focus(); return; }
    try {
      if (CONFIG.newsletterEndpoint) {
        await fetch(CONFIG.newsletterEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ email }) });
      } else {
        // TODO: connect a newsletter provider in src/config/site.js (newsletterEndpoint)
        const list = JSON.parse(localStorage.getItem('saintchrome:congregation') || '[]');
        localStorage.setItem('saintchrome:congregation', JSON.stringify([...new Set([...list, email])]));
      }
      msg.textContent = '✦ Your name is written in the book. Welcome to the congregation.';
      form.reset();
      const r = form.querySelector('button').getBoundingClientRect();
      import('../animations/fx.js').then(({ burst }) => burst(r.left + r.width / 2, r.top + r.height / 2));
    } catch {
      msg.textContent = '✦ The bells are silent. Please try again in a moment.';
    }
  });

  page.meta = {
    title: null,
    description: 'SAINTCHROME: holy relics forged from liquid chrome, worn by modern saints. Explore every bracelet, necklace and pair of eyewear in real-time 3D.',
    image: '/brand/og.jpg',
  };
  page.ready = heroReady;

  page.mount = () => {
    page.enhance();
    const title = page.el.querySelector('.hero__title');
    page.gsap(() => {
      /* hero intro */
      const tl = gsap.timeline();
      tl.from('.hero__kicker', { y: 20, opacity: 0, duration: 0.9, ease: 'expo.out' })
        .add(() => scramble(title, 'SAINTCHROME', { duration: 1.4 }), 0)
        .from('.hero__title', { opacity: 0, letterSpacing: '0.4em', duration: 1.6, ease: 'expo.out' }, 0)
        .from('.hero__tag', { y: 30, opacity: 0, duration: 1, ease: 'expo.out' }, 0.5)
        .from('.hero__cta > *', { y: 30, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.1 }, 0.65)
        .from('.hero__hud > *, .hero__scroll', { opacity: 0, duration: 1.2, stagger: 0.08 }, 0.8);

      ScrollTrigger.create({ trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true, onUpdate: (s) => { heroProgress = s.progress; } });
      gsap.to('.hero__content', { yPercent: -30, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 30%', scrub: true } });

      /* rite panels rise in */
      gsap.from('.rite-panel', { y: 80, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.1, scrollTrigger: { trigger: '.rites__grid', start: 'top 85%', once: true } });

      /* pinned horizontal showcase */
      const track = page.el.querySelector('.showcase__track');
      const section = page.el.querySelector('.showcase');
      const bar = page.el.querySelector('.showcase__progress i');
      if (!IS_TOUCH) {
        const dist = () => track.scrollWidth - innerWidth + 80;
        gsap.to(track, {
          x: () => -dist(), ease: 'none',
          scrollTrigger: {
            trigger: section, start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1,
            onUpdate: (s) => { bar.style.transform = `scaleX(${s.progress})`; },
          },
        });
      }
      // depth-of-field feel: slides away from centre shrink and dim
      const slides = [...page.el.querySelectorAll('.slide')];
      page.cleanup(onTick(() => {
        const cx = innerWidth / 2;
        for (const s of slides) {
          const r = s.getBoundingClientRect();
          if (r.right < -200 || r.left > innerWidth + 200) continue;
          const d = Math.min(1, Math.abs(r.left + r.width / 2 - cx) / (innerWidth * 0.6));
          s.style.setProperty('--d', d.toFixed(3));
        }
      }));

      /* spotlight: pinned, 360° with scroll, annotations appear in turn */
      const deg = page.el.querySelector('.spotlight__deg-num');
      ScrollTrigger.create({
        trigger: '.spotlight', start: 'top top', end: '+=260%', pin: '.spotlight__pin', scrub: true,
        onUpdate: (s) => {
          spotP = s.progress;
          deg.textContent = String(Math.round(spotP * 360)).padStart(3, '0');
        },
      });
      gsap.fromTo('.spotlight__ghost', { xPercent: 10 }, { xPercent: -25, ease: 'none', scrollTrigger: { trigger: '.spotlight', start: 'top top', end: '+=260%', scrub: true } });
    });
    page.cleanup(marquee(page.el.querySelector('.marquee')));
  };

  void slideViews;
  return page;
}
