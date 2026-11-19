/**
 * Fixed "space" background behind the whole site: a twinkling star field with a few
 * brighter round stars, drifting slowly with scroll (parallax). If images are listed in
 * CONFIG.spaceImages they are layered in as slow parallax plates.
 */
import { onTick } from '../core/scroll.js';
import { CONFIG } from '../config/site.js';
import { IS_TOUCH, REDUCED_MOTION } from '../core/env.js';

export function initSpace() {
  const wrap = document.querySelector('.space');
  const canvas = wrap.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(devicePixelRatio || 1, 1.5);
  let W, H, stars = [];
  const N = IS_TOUCH ? 110 : 240;

  CONFIG.spaceImages.forEach((src, i) => {
    const plate = document.createElement('div');
    plate.className = 'space__plate';
    plate.style.backgroundImage = `url(${src})`;
    plate.dataset.depth = String(0.04 + i * 0.03);
    wrap.prepend(plate);
  });

  const resize = () => {
    W = innerWidth; H = innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    stars = Array.from({ length: N }, () => ({
      x: Math.random() * W, y: Math.random() * H * 3,
      r: Math.random() < 0.06 ? 1.6 + Math.random() * 1.6 : Math.random() * 1.1 + 0.2,
      d: 0.05 + Math.random() * 0.25, tw: Math.random() * 6, sp: 0.5 + Math.random() * 2,
    }));
  };
  resize();
  addEventListener('resize', resize);

  onTick((time) => {
    const sy = scrollY;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    for (const s of stars) {
      const y = (((s.y - sy * s.d) % (H * 3)) + H * 3) % (H * 3);
      if (y > H) continue;
      const a = REDUCED_MOTION ? 0.6 : 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(time * s.sp + s.tw));
      if (s.r > 1.5) {
        // a few brighter stars: soft round points (no cross shapes; they read as stray glyphs next to text)
        ctx.fillStyle = `rgba(230,242,255,${a * 0.85})`;
        ctx.beginPath();
        ctx.arc(s.x, y, s.r * 0.6, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = `rgba(220,232,255,${a * 0.8})`;
        ctx.fillRect(s.x, y, s.r, s.r);
      }
    }
    wrap.querySelectorAll('.space__plate').forEach((p) => { p.style.transform = `translate3d(0, ${-sy * Number(p.dataset.depth)}px, 0) scale(1.15)`; });
  });
}

/** Mobile gyroscope tilt → window.__tilt {x, y} in -1..1 (read by 3D viewers). */
export function initTilt() {
  if (!IS_TOUCH || REDUCED_MOTION) return;
  const handler = (e) => {
    const x = Math.max(-1, Math.min(1, (e.gamma || 0) / 30));
    const y = Math.max(-1, Math.min(1, ((e.beta || 0) - 45) / 30));
    window.__tilt = { x, y };
  };
  const enable = () => addEventListener('deviceorientation', handler, { passive: true });
  const DOE = window.DeviceOrientationEvent;
  if (DOE && typeof DOE.requestPermission === 'function') {
    // iOS: needs a user gesture
    addEventListener('touchend', function ask() {
      removeEventListener('touchend', ask);
      DOE.requestPermission().then((s) => s === 'granted' && enable()).catch(() => {});
    }, { once: true });
  } else enable();
}
