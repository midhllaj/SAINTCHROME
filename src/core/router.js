/**
 * History-API router with halo-wipe page transitions.
 * Each page module default-exports: async (params) => ({ el, mount?, destroy?, meta? })
 */
import { cover, reveal } from '../animations/transition.js';
import { scrollTo, ScrollTrigger } from './scroll.js';
import { setMeta } from './dom.js';

const routes = [
  { path: /^\/$/, load: () => import('../pages/home.js') },
  { path: /^\/altar\/?$/, load: () => import('../pages/altar.js') },
  { path: /^\/rites\/([\w-]+)\/?$/, load: () => import('../pages/rite.js'), keys: ['rite'] },
  { path: /^\/relic\/([\w-]+)\/?$/, load: () => import('../pages/product.js'), keys: ['slug'] },
  { path: /^\/chapel\/?$/, load: () => import('../pages/chapel.js') },
  { path: /^\/about\/?$/, load: () => import('../pages/about.js') },
  { path: /^\/offerings\/?$/, load: () => import('../pages/offerings.js') },
  { path: /^\/try-the-halo\/?$/, load: () => import('../pages/tryon.js') },
];
const notFound = () => import('../pages/notFound.js');

const main = document.getElementById('main');
let current = null;
let busy = false;
const listeners = new Set();
export const onRoute = (fn) => listeners.add(fn);

function match(pathname) {
  for (const r of routes) {
    const m = pathname.match(r.path);
    if (m) return { load: r.load, params: Object.fromEntries((r.keys || []).map((k, i) => [k, m[i + 1]])) };
  }
  return { load: notFound, params: {} };
}

async function render(first = false) {
  const { load, params } = match(location.pathname);
  const mod = await load();
  if (current) {
    try { current.destroy?.(); } catch (e) { console.error(e); }
  }
  main.innerHTML = '';
  const page = await mod.default(params);
  current = page;
  main.appendChild(page.el);
  main.dataset.page = page.name || '';
  document.body.dataset.page = (page.name || '').split(' ')[0];
  setMeta(page.meta || {});
  scrollTo(0);
  listeners.forEach((fn) => fn(location.pathname, page));
  // let layout settle before measuring triggers
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  ScrollTrigger.refresh();
  if (!first) main.focus({ preventScroll: true });
  return page;
}

export async function navigate(href, { replace = false } = {}) {
  const url = new URL(href, location.origin);
  if (busy) return;
  if (url.pathname === location.pathname && !url.hash) return;
  busy = true;
  try {
    await cover();
    replace ? history.replaceState({}, '', url) : history.pushState({}, '', url);
    const page = await render();
    await reveal();
    page.mount?.();
  } finally {
    busy = false;
  }
}

export async function startRouter() {
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target === '_blank' || a.hasAttribute('download')) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || url.pathname.startsWith('/lab')) return;
    if (url.hash && url.pathname === location.pathname) return;
    e.preventDefault();
    navigate(url.pathname + url.search);
  });
  addEventListener('popstate', async () => {
    if (busy) return;
    busy = true;
    try { await cover(); const p = await render(); await reveal(); p.mount?.(); } finally { busy = false; }
  });
  const page = await render(true);
  return page;
}
