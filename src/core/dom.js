/** Tiny DOM helpers. */
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/** html`<div>${x}</div>` → DocumentFragment-less single element (first child). */
export function el(markup) {
  const t = document.createElement('template');
  t.innerHTML = markup.trim();
  return t.content.firstElementChild;
}

export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** The four-point star used everywhere (logo motif). */
export const STAR = '<svg class="star-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0 L13.4 10.6 L24 12 L13.4 13.4 L12 24 L10.6 13.4 L0 12 L10.6 10.6 Z"/></svg>';

let toastTimer;
export function toast(msg) {
  const t = $('.toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('is-on'), 2600);
}

export function setMeta({ title, description, image }) {
  document.title = title ? (title.includes("SAINTCHROME") ? title : `${title} — SAINTCHROME`) : "SAINTCHROME — Wear Your Halo.";
  const set = (sel, attr, v) => { const m = document.querySelector(sel); if (m && v) m.setAttribute(attr, v); };
  set('meta[name="description"]', 'content', description);
  set('meta[property="og:title"]', 'content', document.title);
  set('meta[name="twitter:title"]', 'content', document.title);
  set('meta[property="og:description"]', 'content', description);
  set('meta[name="twitter:description"]', 'content', description);
  set('meta[property="og:image"]', 'content', image);
  set('meta[name="twitter:image"]', 'content', image);
  set('link[rel="canonical"]', 'href', location.origin + location.pathname);
}
