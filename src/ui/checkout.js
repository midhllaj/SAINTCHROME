/**
 * Checkout hand-off. No payment provider is connected yet:
 *  - CONFIG.checkout.checkoutUrl → open your hosted checkout
 *  - CONFIG.checkout.whatsapp    → send the order as a WhatsApp message
 *  - neither                     → friendly "opening soon" notice
 */
import { CONFIG, formatPrice } from '../config/site.js';
import { cart } from '../core/cart.js';
import { toast } from '../core/dom.js';

export function checkout() {
  if (!cart.count) return;
  const { checkoutUrl, whatsapp } = CONFIG.checkout;
  if (checkoutUrl) { location.href = checkoutUrl; return; }
  if (whatsapp) {
    const lines = cart.items.map(({ product: p, qty }) => `✦ ${p.name} (Relic ${p.number}) × ${qty} — ${formatPrice(p.price * qty)}`);
    const msg = `Blessings, SAINTCHROME. I'd like to make an offering:\n\n${lines.join('\n')}\n\nSubtotal: ${formatPrice(cart.subtotal)}`;
    window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
    return;
  }
  toast('✦ Checkout opens soon. Your offerings are saved.');
}
