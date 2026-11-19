/** Footer with the giant chrome wordmark. */
import { CONFIG } from '../config/site.js';
import { RITES } from '../config/products.js';
import { STAR } from '../core/dom.js';

export function footerHTML() {
  return `
  <footer class="footer">
    <div class="footer__top">
      <div class="footer__col">
        <span class="mono">[ THE ALTAR ]</span>
        <a href="/altar">All Relics</a>
        ${RITES.map((r) => `<a href="/rites/${r.slug}">${r.name}</a>`).join('')}
      </div>
      <div class="footer__col">
        <span class="mono">[ THE ORDER ]</span>
        <a href="/about">Our Creed</a>
        <a href="/chapel">The Chapel</a>
        <a href="/try-the-halo">Try the Halo</a>
        <a href="/offerings">Offerings</a>
      </div>
      <div class="footer__col">
        <span class="mono">[ CONGREGATION ]</span>
        ${CONFIG.socials.map((s) => `<a href="${s.href}" ${s.href.startsWith('http') ? 'target="_blank" rel="noopener"' : ''}>${s.label}</a>`).join('')}
      </div>
      <div class="footer__col footer__col--motto">
        <p class="footer__motto">Blessed in Chrome.</p>
        <p class="mono footer__small">${STAR} Relics for the Modern Saint</p>
      </div>
    </div>
    <div class="footer__word" aria-hidden="true">
      <span class="chrome-text">SAINTCHROME</span>
    </div>
    <div class="footer__bottom mono">
      <span>© ${new Date().getFullYear()} SAINTCHROME</span>
      <span>FORGED IN LIQUID CHROME ✦ INDIA</span>
      <a href="#main" class="footer__up" data-scroll-top>ASCEND ↑</a>
    </div>
  </footer>`;
}
