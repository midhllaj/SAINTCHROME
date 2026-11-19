/**
 * ABOUT — "The Order": the creed behind SAINTCHROME.
 */
import { createPage } from './_kit.js';
import { STAR } from '../core/dom.js';
import { gsap } from '../core/scroll.js';

export default async function about() {
  const page = createPage('about', `
  <section class="page-hero" style="text-align:center">
    <span class="mono">[ THE ORDER ✦ OUR CREED ]</span>
    <h1 class="page-hero__title chrome-text" data-reveal="lines">Sacred Metal</h1>
    <p class="page-hero__sub" data-reveal="fade" style="margin:0 auto">Gothic cathedral, cyber chrome. We forge relics for saints who were never good at kneeling.</p>
  </section>

  <div class="about-logo" data-parallax="-0.08">
    <img src="/brand/logo.jpg" alt="SAINTCHROME emblem" width="1200" height="1200" />
  </div>

  <section class="story">
    <p class="story__big chrome-text" data-reveal="words">Every saint has a halo. Ours is forged in chrome, worn on the wrist and over the heart.</p>
    <div class="story__text" data-reveal="fade">
      <p>SAINTCHROME started with a single question: what would a relic look like if it were made today? Not dusty gold behind glass, but something you could wear to the club, to class, to a funeral and to your own resurrection.</p>
      <p>Our answer is sacred metal. Liquid-silver vines, faceted crystals the colour of stained glass, four-point stars and thorns that catch every light in the room. Each piece is a small cathedral you can carry.</p>
      <p>We also curate a few frames we love. Those are always labelled with their true maker, because a relic should never lie about where it came from.</p>
    </div>
  </section>

  <section class="tenets">
    ${[
      ['I', 'Wear Your Halo', 'Your relic is not decoration. It is a declaration. Wear it loud and wear it every day.'],
      ['II', 'Blessed in Chrome', 'Mirror finishes, sharp facets, real weight. If it does not flash under a streetlight, we do not ship it.'],
      ['III', 'Relics for the Modern Saint', 'Ancient symbols, rebuilt for now. Thorns, stars, rosaries and visitors from beyond the clouds.'],
    ].map(([n, t, d]) => `
      <article class="tenet">
        <svg class="tenet__star" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0 L13.4 10.6 L24 12 L13.4 13.4 L12 24 L10.6 13.4 L0 12 L10.6 10.6 Z"/></svg>
        <span class="mono">TENET ${n}</span>
        <h3>${t}</h3>
        <p>${d}</p>
      </article>`).join('')}
  </section>

  <section class="congregation">
    <div class="congregation__halo" aria-hidden="true"></div>
    <span class="mono section-label">${STAR} JOIN THE ORDER</span>
    <h2 class="h2 chrome-text" data-reveal="lines">Find your relic.</h2>
    <p>Eleven relics across four rites. One of them is already yours.</p>
    <div class="hero__cta">
      <a class="btn btn--chrome" href="/altar" data-magnetic><span class="btn__label">ENTER THE ALTAR</span></a>
      <a class="btn btn--ghost" href="/chapel" data-magnetic><span class="btn__label">THE CHAPEL</span></a>
    </div>
  </section>`);

  page.meta = { title: 'The Order — Our Creed | SAINTCHROME', description: 'SAINTCHROME forges sacred-metal relics: chrome jewellery and accessories for the modern saint.' };
  page.mount = () => {
    page.enhance();
    page.gsap(() => {
      gsap.from(page.el.querySelectorAll('.tenet'), { y: 80, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: 0.1, scrollTrigger: { trigger: page.el.querySelector('.tenets'), start: 'top 85%' } });
      gsap.fromTo(page.el.querySelector('.about-logo'), { clipPath: 'circle(0% at 50% 50%)' }, { clipPath: 'circle(75% at 50% 50%)', duration: 1.8, ease: 'expo.inOut', clearProps: 'clipPath', scrollTrigger: { trigger: page.el.querySelector('.about-logo'), start: 'top 80%' } });
    });
  };
  return page;
}
