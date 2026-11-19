/**
 * Scroll-driven text reveals.
 *  [data-reveal="lines"]  → masked line-by-line slide up
 *  [data-reveal="words"]  → manifesto: words light up one by one as you scroll (scrubbed)
 *  [data-reveal="fade"]   → soft rise + fade
 *  [data-parallax="0.2"]  → parallax drift
 */
import { gsap, ScrollTrigger } from '../core/scroll.js';
import { REDUCED_MOTION } from '../core/env.js';

/** Wrap each word in .w > .w__in so it can slide out of a mask. */
export function splitWords(el) {
  if (el.__split) return el.__split;
  const walk = (node) => {
    const out = [];
    node.childNodes.forEach((n) => {
      if (n.nodeType === 3) {
        n.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) out.push(document.createTextNode(' '));
          else {
            const w = document.createElement('span');
            w.className = 'w';
            const i = document.createElement('span');
            i.className = 'w__in';
            i.textContent = part;
            w.appendChild(i);
            out.push(w);
          }
        });
      } else if (n.nodeType === 1) {
        const clone = n.cloneNode(false);
        walk(n).forEach((c) => clone.appendChild(c));
        out.push(clone);
      }
    });
    return out;
  };
  const parts = walk(el);
  el.innerHTML = '';
  parts.forEach((p) => el.appendChild(p));
  el.__split = [...el.querySelectorAll('.w__in')];
  return el.__split;
}

export function initReveals(root) {
  if (REDUCED_MOTION) {
    root.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-in'));
    return;
  }
  root.querySelectorAll('[data-reveal="lines"]').forEach((el) => {
    const words = splitWords(el);
    gsap.from(words, {
      yPercent: 115, rotate: 4, duration: 1.1, ease: 'expo.out', stagger: 0.035,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });
  root.querySelectorAll('[data-reveal="words"]').forEach((el) => {
    const words = splitWords(el);
    gsap.fromTo(words, { opacity: 0.1, filter: 'blur(4px)' }, {
      opacity: 1, filter: 'blur(0px)', stagger: 0.05, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: 0.6 },
    });
  });
  root.querySelectorAll('[data-reveal="fade"]').forEach((el) => {
    gsap.from(el, {
      y: 40, opacity: 0, duration: 1.2, ease: 'expo.out', delay: Number(el.dataset.delay || 0),
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  });
  root.querySelectorAll('[data-parallax]').forEach((el) => {
    const amt = Number(el.dataset.parallax);
    gsap.fromTo(el, { yPercent: -amt * 50 }, {
      yPercent: amt * 50, ease: 'none',
      scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });
}

export { ScrollTrigger };
