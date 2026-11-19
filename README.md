# SAINTCHROME — Wear Your Halo.

An immersive 3D storefront for SAINTCHROME. Every relic is a real procedural Three.js model:
no photos are shown on the site. Built with Vite, vanilla JS, three.js, GSAP and Lenis.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:5173. To make the production build, run `npm run build`; the output goes to `dist/`. Preview it with `npm run preview`.

## Where things live

| What | Where |
|---|---|
| Products: names, prices, copy, hotspots | `src/config/products.js` |
| Currency, checkout, newsletter, socials, render quality | `src/config/site.js` |
| 3D models (one file per relic) | `src/models/*.js` |
| Shared model parts: chains, clasps, stars, crystals, vines | `src/models/kit/` |
| The 3D engine and viewer (one shared WebGL renderer) | `src/viewer/` |
| Studio look shared by every relic: lights, environment, contact shadow, exposure, bloom | `src/viewer/studio.js` |
| Scroll story on a product page (rise, grille close-up, exploded view, reassembly) | `src/pages/sequence.js`, captions in each product's `story` |
| Pages | `src/pages/` |
| Animations: preloader, cursor, transitions, reveals | `src/animations/` |
| Styles | `src/styles/main.css` |
| Rendered shots, chapel renders and GLB exports | `public/shots`, `public/chapel`, `public/models` |
| Your original photos (not shown on the site) | `public/reference` |

## Change prices and products

- **Prices.** Edit `price` on each product in `src/config/products.js`. Every price is marked `// TODO`.
- **Currency.** Change `CONFIG.currency` in `src/config/site.js`. Every price on the site is formatted from it.
- **Add a product.**
  1. Copy an entry in `PRODUCTS`.
  2. Give it a new `slug` and `number`.
  3. Point `model` at a key from `src/models/index.js`.
  4. Pick the `rite`: bracelets, necklaces, eyewear or earphones.
- **Product page annotations.** The `hotspots` text is keyed by the hotspot ids each model file returns.
- **Checkout.** There is no payment provider yet. Choose one:
  - Set `CONFIG.checkout.whatsapp` (for example `919876543210`) and orders are sent as a WhatsApp message.
  - Set `checkoutUrl` to a hosted checkout such as a Razorpay or Shopify link.
- **Newsletter.** Set `CONFIG.newsletterEndpoint`, for example a Formspree URL. While it's empty, sign-ups are only kept in the visitor's browser.

## Tweak a 3D model

Each model file exports `PARAMS`. Change a number and the dev server hot-reloads it. For example:

- `src/models/bloodSaint.js`: the crystal colour, link sizes, chain `pitch`, and the star charm.
- `src/models/thornRelic.js`: spike angles and size.
- `src/models/wayfarer.js`: the lens shape and frame outline for all three frames.
- `src/models/silentChoir.js`: built in millimetres at real EarPods size: 33 cm leads with the remote on the right one, and a 75 cm main cable. `layout` sets where each part lies, each cable's rough route and length, and where the viewers aim (`focus`, `frameRadius`).

The **model lab** is a dev-only page that is not part of the built site. Open http://localhost:5173/lab.html while `npm run dev` is running.

- `?m=bloodSaint&hs` shows one model with its hotspots.
- **Export all** regenerates `public/models/*.glb`, the product shots (`public/shots/`) and the Chapel renders (`public/chapel/`).

Re-run **Export all** after changing a model so the cards and the lookbook match. Do the same after changing `src/viewer/studio.js`, so the saved shots use the same lighting as the live viewers.

## Deploy for free

**Vercel**
1. Push the folder to a GitHub repository.
2. On vercel.com, choose New Project, then import the repository. Vite is detected automatically.
3. Deploy. `vercel.json` already rewrites every route to `index.html`, so URLs like `/relic/blood-saint` work.

**Netlify**
1. On app.netlify.com, choose Add new site, then import from Git. Pick the repository.
2. The build command is `npm run build` and the publish directory is `dist`. Both are already set in `netlify.toml`.
3. `public/_redirects` handles the client-side routes.

After deploying, put your real domain in `CONFIG.url` and in the `og:url` / `og:image` tags in `index.html`.

## Placeholders to replace before launch

- All prices (`// TODO` in `products.js`).
- Materials: confirm them with your supplier.
- "Confessions" testimonials on the home page. They are clearly marked PLACEHOLDER; replace them with real reviews only.
- Social links, WhatsApp number, checkout URL and newsletter endpoint (`site.js`).
- **Silent Choir earphones.** Modelled from `public/reference/earphones/chrome-wired-usbc.png` (wired chrome buds, inline remote). Two products share one model: Silent Choir USB-C (`silentChoir`, slug `silent-choir`) and Silent Choir Lightning (`silentChoirLightning`, `PARAMS.plug.type = 'lightning'`). Confirm prices, cable length and specs in `products.js`.
- Eyewear is authentic Ray-Ban, labelled as resale. No Ray-Ban logo is modelled or shown.
