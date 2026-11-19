/**
 * Global site configuration. Change currency, contact links, checkout and render quality here.
 */
export const CONFIG = {
  brand: 'SAINTCHROME',
  url: 'https://saintchrome.vercel.app', // TODO: your real domain (used for Open Graph tags)

  // Currency — every price on the site is formatted with these
  currency: { symbol: '₹', code: 'INR', locale: 'en-IN' },

  // Shipping note shown in the Offerings (cart)
  shippingNote: 'Shipping calculated at checkout', // TODO

  // Checkout: there is no payment provider yet.
  // Set whatsapp to a number like '919876543210' to send orders as a WhatsApp message,
  // or set checkoutUrl to a hosted checkout (Shopify, Razorpay link, etc.).
  checkout: {
    whatsapp: '', // TODO
    checkoutUrl: '', // TODO
  },

  // Newsletter: POST endpoint (e.g. Formspree / Mailchimp form action). Empty = stored locally only.
  newsletterEndpoint: '', // TODO

  socials: [
    { label: 'Instagram', href: '#' }, // TODO
    { label: 'WhatsApp', href: '#' },  // TODO
    { label: 'Email', href: '#' },     // TODO
  ],

  // Optional slow parallax backgrounds. Drop images into /public/space/ and list them here.
  // While empty, a procedural star field is used instead.
  spaceImages: [],

  render: {
    maxPixelRatio: 2,
    mobilePixelRatio: 1.25,
    bloom: { enabled: true }, // strength / threshold live with the studio look in src/viewer/studio.js
  },
};

export function formatPrice(n) {
  const { symbol, locale } = CONFIG.currency;
  return `${symbol}${Math.round(n).toLocaleString(locale)}`;
}
