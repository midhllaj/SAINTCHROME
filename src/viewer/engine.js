/**
 * ONE shared WebGL renderer for the whole site.
 * A fixed full-screen canvas sits behind the page; every 3D viewer is just a DOM element.
 * Each frame we draw each visible viewer's scene into its element's rectangle
 * (viewport + scissor), then run one gentle highlight-only bloom pass and output
 * (ACES filmic tone mapping, exposure from viewer/studio.js). MSAA render target for clean edges.
 */
import * as THREE from 'three';
import { createStudioEnvironment, STUDIO } from './studio.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { Pass } from 'three/addons/postprocessing/Pass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { CONFIG } from '../config/site.js';

const isMobile = matchMedia('(pointer: coarse)').matches || innerWidth < 760;

class ViewsPass extends Pass {
  constructor(engine) {
    super();
    this.engine = engine;
    this.needsSwap = false;
  }
  render(renderer, writeBuffer, readBuffer) {
    const { views, pixelRatio } = this.engine;
    const H = innerHeight;
    renderer.setRenderTarget(this.renderToScreen ? null : readBuffer);
    renderer.setClearColor(0x000000, 0);
    renderer.clear();
    for (const v of views) {
      const r = v._rect;
      const x = Math.round(r.left * pixelRatio), y = Math.round((H - r.bottom) * pixelRatio);
      const w = Math.round(r.width * pixelRatio), h = Math.round(r.height * pixelRatio);
      readBuffer.viewport.set(x, y, w, h);
      readBuffer.scissor.set(x, y, w, h);
      readBuffer.scissorTest = true;
      renderer.setRenderTarget(readBuffer);
      if (v.background) {
        renderer.setClearColor(v.background, v.backgroundAlpha);
        renderer.clear();
      }
      if (!v.preRender?.(renderer)) renderer.render(v.scene, v.camera);
    }
    readBuffer.scissorTest = false;
    readBuffer.viewport.set(0, 0, readBuffer.width, readBuffer.height);
    readBuffer.scissor.set(0, 0, readBuffer.width, readBuffer.height);
  }
}

class Engine {
  constructor() {
    this.registered = new Set();
    this.views = [];
    this.ready = false;
  }

  init() {
    if (this.ready) return;
    this.ready = true;
    this.pixelRatio = Math.min(devicePixelRatio || 1, isMobile ? CONFIG.render.mobilePixelRatio : CONFIG.render.maxPixelRatio);
    // adaptive resolution: heavy shots (glass in a macro close-up) drop the pixel ratio a step
    // instead of the frame rate, and it climbs back once there is headroom again
    this.maxRatio = this.pixelRatio;
    this.minRatio = Math.max(0.8, this.pixelRatio * 0.55);
    this.perf = { sum: 0, n: 0, calm: 0, cool: 0, backoff: 1 };
    if (import.meta.env.DEV) window.__engine = this;
    const canvas = document.createElement('canvas');
    canvas.className = 'gl-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.prepend(canvas);
    this.canvas = canvas;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: false });
    renderer.setPixelRatio(this.pixelRatio);
    renderer.setSize(innerWidth, innerHeight, false);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = STUDIO.exposure;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    // glass and transparent acetate sample a half-resolution copy of the scene behind them: thin,
    // nearly clear surfaces don't show the difference, and it keeps the eyewear pages at frame rate
    renderer.transmissionResolutionScale = 0.5;
    renderer.autoClear = false;
    this.renderer = renderer;

    this.env = createStudioEnvironment(renderer); // one studio for every relic (viewer/studio.js)

    const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: isMobile ? 2 : 4 });
    this.composer = new EffectComposer(renderer, rt);
    this.composer.setPixelRatio(this.pixelRatio);
    this.composer.setSize(innerWidth, innerHeight);
    this.composer.addPass(new ViewsPass(this));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth / 2, innerHeight / 2), STUDIO.bloom.strength, STUDIO.bloom.radius, STUDIO.bloom.threshold);
    this.bloom.enabled = !isMobile && CONFIG.render.bloom.enabled;
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());

    addEventListener('resize', () => this.resize());
    this.clock = new THREE.Clock();
    this.idle = false;
  }

  resize() {
    this.renderer.setSize(innerWidth, innerHeight, false);
    this.composer.setSize(innerWidth, innerHeight);
  }

  setRatio(r) {
    this.pixelRatio = r;
    this.renderer.setPixelRatio(r);
    this.composer.setPixelRatio(r);
    this.resize();
  }

  /** Average frame time over ~40 frames: below ~50 fps step the ratio down, after a calm spell step it up. */
  adapt(dt) {
    const P = this.perf;
    if (P.cool > 0) { P.cool -= dt; return; }
    P.sum += dt; P.n++;
    if (P.n < 40) return;
    const avg = P.sum / P.n;
    P.sum = 0; P.n = 0;
    if (avg > 1 / 50 && this.pixelRatio > this.minRatio + 0.01) {
      this.setRatio(Math.max(this.minRatio, this.pixelRatio - 0.15));
      P.cool = 0.6; P.calm = 0;
      if (P.recent) P.backoff = Math.min(P.backoff * 2, 8); // went up and straight back down: wait longer next time
    } else if (avg < 1 / 57) {
      P.calm += 40 * avg;
      P.recent = false;
      if (P.calm > 2.5 * P.backoff && this.pixelRatio < this.maxRatio - 0.01) {
        this.setRatio(Math.min(this.maxRatio, this.pixelRatio + 0.1));
        P.cool = 0.6; P.calm = 0; P.recent = true;
        setTimeout(() => { P.recent = false; }, 3000);
      }
    } else P.calm = 0;
  }

  add(view) { this.init(); this.registered.add(view); }
  remove(view) { this.registered.delete(view); }

  /** Called once per frame from the global ticker. */
  render() {
    if (!this.ready) return;
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const t = this.clock.elapsedTime;
    const vw = innerWidth, vh = innerHeight;
    this.views.length = 0;
    for (const v of this.registered) {
      if (!v.onScreen || !v.ready || v.hidden) continue;
      const r = v.el.getBoundingClientRect();
      if (r.bottom <= 0 || r.top >= vh || r.right <= 0 || r.left >= vw || r.width < 2 || r.height < 2) continue;
      v._rect = r;
      v.update(dt, t, r);
      this.views.push(v);
    }
    if (!this.views.length) {
      if (!this.idle) { this.renderer.setRenderTarget(null); this.renderer.setClearColor(0, 0); this.renderer.clear(); this.idle = true; }
      return;
    }
    if (this.idle) this.perf.cool = 0.5; // first frames after idle include shader warm-up
    this.idle = false;
    this.composer.render(dt);
    this.adapt(dt);
  }
}

export const engine = new Engine();
export const IS_MOBILE = isMobile;
