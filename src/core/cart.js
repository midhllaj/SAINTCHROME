/**
 * OFFERINGS (cart) — persisted in localStorage, with a tiny event emitter.
 */
import { bySlug } from '../config/products.js';

const KEY = 'saintchrome:offerings';
const listeners = new Set();

function read() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(v) ? v.filter((i) => bySlug(i.slug)) : [];
  } catch { return []; }
}

let items = read();

function commit() {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* private mode */ }
  listeners.forEach((fn) => fn(cart));
}

export const cart = {
  get items() { return items.map((i) => ({ ...i, product: bySlug(i.slug) })); },
  get count() { return items.reduce((n, i) => n + i.qty, 0); },
  get subtotal() { return items.reduce((n, i) => n + i.qty * (bySlug(i.slug)?.price || 0), 0); },
  add(slug, qty = 1) {
    const found = items.find((i) => i.slug === slug);
    if (found) found.qty = Math.min(9, found.qty + qty);
    else items.push({ slug, qty: Math.min(9, qty) });
    commit();
  },
  set(slug, qty) {
    if (qty <= 0) items = items.filter((i) => i.slug !== slug);
    else { const f = items.find((i) => i.slug === slug); if (f) f.qty = Math.min(9, qty); }
    commit();
  },
  remove(slug) { items = items.filter((i) => i.slug !== slug); commit(); },
  clear() { items = []; commit(); },
  on(fn) { listeners.add(fn); return () => listeners.delete(fn); },
};

addEventListener('storage', (e) => { if (e.key === KEY) { items = read(); listeners.forEach((fn) => fn(cart)); } });
