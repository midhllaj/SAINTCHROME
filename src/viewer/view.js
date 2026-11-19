/**
 * A 3D viewer bound to a DOM element. It owns a scene + camera + (optional) orbit controls,
 * and is drawn by the shared engine into the element's rectangle.
 *
 *  new View(el, { model: 'bloodSaint', controls: true, zoom: true, hotspots: annotations })
 *
 * Lazy: the model is built the first time the element comes near the viewport and the
 * scene is released when it has been off-screen for a while.
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { engine, IS_MOBILE } from './engine.js';
import { loadModel } from '../models/index.js';
import { createStage, disposeStage, frameDistance, STUDIO } from './studio.js';
import { REDUCED_MOTION } from '../core/env.js';

const DEFAULTS = {
  model: 'bloodSaint',
  controls: true,       // drag to rotate
  zoom: false,          // wheel / pinch zoom (traps page scroll, so only on product pages)
  autoRotate: 0.6,      // slow idle turntable speed, 0 = off
  fit: 1.12,            // framing padding
  polar: 1.15,          // initial polar angle (radians from +Y)
  azimuth: 0.0,
  fov: STUDIO.fov,      // long product lens (see viewer/studio.js)
  accent: '#9aa7b8',
  background: '#0a0a0a',
  backgroundAlpha: 1,
  backdrop: true,       // neutral studio backdrop (false = transparent over the page)
  shadow: null,         // soft contact shadow + floor light pool (defaults to `backdrop`)
  hotspots: null,       // { id: { title, text } } → glowing ✦ annotations
  scan: false,          // wireframe → chrome "materialise" reveal
  onUpdate: null,
  onReady: null,
  keepAlive: false,
  exposure: 1,
};

export class View {
  constructor(el, options = {}) {
    this.el = el;
    this.o = { ...DEFAULTS, ...options };
    this._angleGiven = 'polar' in options || 'azimuth' in options;
    this.background = this.o.background ? new THREE.Color(this.o.background) : null;
    this.backgroundAlpha = this.o.backgroundAlpha;
    this.ready = false;
    this.onScreen = false;
    this.userActive = false;
    this.scanProgress = this.o.scan ? 0 : 1;
    this._idleTimer = null;
    this._disposeTimer = null;
    el.classList.add('view');
    if (this.o.controls) el.classList.add('view--interactive');
    if (this.o.backdrop) el.classList.add('view--studio'); // CSS vignette over the studio backdrop
    this.io = new IntersectionObserver(([e]) => this._visibility(e.isIntersecting), { rootMargin: '25% 0px 25% 0px' });
    this.io.observe(el);
    engine.add(this);
  }

  _visibility(on) {
    this.onScreen = on;
    if (on) {
      clearTimeout(this._disposeTimer);
      if (!this.ready && !this._building) this._build();
    } else if (this.ready && !this.o.keepAlive) {
      clearTimeout(this._disposeTimer);
      this._disposeTimer = setTimeout(() => this._release(), 8000);
    }
  }

  async _build() {
    this._building = true;
    const { object, hotspots, parts } = await loadModel(this.o.model);
    if (this.destroyed) return;
    this.parts = parts;
    const stage = createStage(engine.renderer, object, {
      env: engine.env,
      shadow: this.o.shadow ?? this.o.backdrop,
      backdrop: this.o.backdrop,
      lights: this.o.model === 'halo' ? 'graphic' : 'studio',
    });
    this.stage = stage;
    const scene = stage.scene;
    this.scene = scene;
    const camera = new THREE.PerspectiveCamera(this.o.fov, 1, 0.1, 500);
    this.camera = camera;
    this.target = new THREE.Vector3();
    scene.add(camera);

    // pivot holds the relic (and its shadow) centred at the origin
    this.pivot = new THREE.Group();
    this.spin = new THREE.Group(); // external rotation (scroll-driven spotlight)
    this.spin.add(this.pivot);
    scene.add(this.spin);
    this.pivot.add(stage.root);
    this.object = object;
    this.radius = stage.radius;
    this.center = stage.center;
    // a relic can name its own hero angle (e.g. earphones: slightly above, buds in front)
    if (!this._angleGiven && object.userData.heroAngle) [this.o.polar, this.o.azimuth] = object.userData.heroAngle;
    this.studioObjects = [];
    scene.traverse((o) => { if (o.userData.studio) this.studioObjects.push(o); });
    this.hotspotData = (hotspots || []).map((h) => ({ ...h, local: new THREE.Vector3(...h.position).sub(stage.center), normal: new THREE.Vector3(...(h.normal || [0, 0, 1])).normalize() }));

    // camera + controls
    this._fit(true);
    if (this.o.controls) {
      const c = new OrbitControls(camera, this.el);
      c.enableDamping = true;
      c.dampingFactor = 0.045;   // long, soft inertia after a flick
      c.enablePan = false;
      c.enableZoom = !!this.o.zoom;
      c.zoomSpeed = 0.7;
      c.rotateSpeed = 0.75;
      c.minDistance = this.radius * 0.9;
      c.maxDistance = this.fitDistance * 1.8;
      if (this.o.shadow ?? this.o.backdrop) c.maxPolarAngle = Math.PI / 2 + 0.12; // stay above the studio floor
      c.autoRotate = !!this.o.autoRotate && !REDUCED_MOTION;
      c.autoRotateSpeed = this.o.autoRotate;
      c.addEventListener('start', () => { this.userActive = true; c.autoRotate = false; clearTimeout(this._idleTimer); this.el.classList.add('is-dragging'); });
      c.addEventListener('end', () => {
        this.el.classList.remove('is-dragging');
        this._idleTimer = setTimeout(() => { this.userActive = false; c.autoRotate = !!this.o.autoRotate && !REDUCED_MOTION && !this.paused; }, 3500);
      });
      this.controls = c;
      if (!this.o.zoom) this.el.style.touchAction = 'pan-y';
    }

    if (this.o.hotspots) this._buildHotspots();
    if (this.o.scan) this._buildScan();
    this.ready = true;
    this._building = false;
    this.el.classList.add('is-ready');
    this.o.onReady?.(this);
  }

  _fit(initial = false) {
    const r = this.el.getBoundingClientRect();
    const aspect = Math.max(0.2, r.width / Math.max(1, r.height));
    this.camera.aspect = aspect;
    const vFov = THREE.MathUtils.degToRad(this.o.fov);
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
    const fov = Math.min(vFov, hFov);
    const frameRadius = this.object.userData.frameRadius;
    if (frameRadius) {
      // a relic framed on a focus point (earphones): fit a circle round it; the long cable runs out of frame
      this.fitDistance = (frameRadius / Math.sin(fov / 2)) * this.o.fit;
    } else if (this.o.backdrop) {
      // studio viewers frame the bounding box (flat relics fill the frame); take the widest of
      // four quarter turns so nothing clips while it turns
      const d = Math.max(...[0, 1, 2, 3].map((k) => frameDistance(this.stage.size, this.o.polar, this.o.azimuth + (k * Math.PI) / 2, this.o.fov, aspect)));
      this.fitDistance = d * this.o.fit;
    } else {
      this.fitDistance = (this.radius / Math.sin(fov / 2)) * this.o.fit;
    }
    if (initial) {
      const s = new THREE.Spherical(this.fitDistance, this.o.polar, this.o.azimuth);
      this.camera.position.setFromSpherical(s);
      this.camera.lookAt(0, 0, 0);
      this.home = this.camera.position.clone();
    } else if (!this.userActive) {
      this.camera.position.setLength(this.fitDistance);
    }
    this.camera.updateProjectionMatrix();
    this._aspect = aspect;
  }

  update(dt, t, rect) {
    if (Math.abs(rect.width / rect.height - this._aspect) > 0.01) this._fit();
    if (this.controls) this.controls.update(dt);
    else this.camera.lookAt(this.target);
    this.stage.updateBackdrop(this.camera);
    if (window.__tilt && IS_MOBILE) {
      this.pivot.rotation.x = THREE.MathUtils.lerp(this.pivot.rotation.x, window.__tilt.y * 0.25, 0.08);
      this.pivot.rotation.z = THREE.MathUtils.lerp(this.pivot.rotation.z, -window.__tilt.x * 0.15, 0.08);
    }
    this.o.onUpdate?.(this, dt, t);
    if (this.hotspotEls) this._placeHotspots(rect);
    if (this.scanGroup) this._updateScan();
  }

  /* ---------------- hotspots ---------------- */
  _buildHotspots() {
    const layer = document.createElement('div');
    layer.className = 'hotspots';
    this.el.appendChild(layer);
    this.hotspotLayer = layer;
    this.hotspotEls = [];
    for (const h of this.hotspotData) {
      const info = this.o.hotspots[h.id];
      if (!info) continue;
      const wrap = document.createElement('div');
      wrap.className = 'hotspot';
      wrap.innerHTML = `
        <button class="hotspot__dot" aria-expanded="false" aria-label="${info.title || h.label}">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0 L13.6 10.4 L24 12 L13.6 13.6 L12 24 L10.4 13.6 L0 12 L10.4 10.4 Z"/></svg>
        </button>
        <div class="hotspot__card" role="note">
          <span class="mono">[ ${String(this.hotspotEls.length + 1).padStart(2, '0')} ]</span>
          <strong>${info.title || h.label}</strong>
          <p>${info.text}</p>
        </div>`;
      const btn = wrap.querySelector('button');
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const open = !wrap.classList.contains('is-open');
        this.hotspotEls.forEach((o) => { o.el.classList.remove('is-open'); o.el.querySelector('button').setAttribute('aria-expanded', 'false'); });
        wrap.classList.toggle('is-open', open);
        btn.setAttribute('aria-expanded', String(open));
      });
      layer.appendChild(wrap);
      this.hotspotEls.push({ el: wrap, data: h });
    }
  }

  _placeHotspots(rect) {
    const v = new THREE.Vector3(), n = new THREE.Vector3(), toCam = new THREE.Vector3();
    this.pivot.updateWorldMatrix(true, false);
    const normalMatrix = new THREE.Matrix3().getNormalMatrix(this.pivot.matrixWorld);
    for (const { el, data } of this.hotspotEls) {
      v.copy(data.local).applyMatrix4(this.pivot.matrixWorld);
      n.copy(data.normal).applyMatrix3(normalMatrix).normalize();
      toCam.copy(this.camera.position).sub(v).normalize();
      const facing = n.dot(toCam);
      v.project(this.camera);
      const x = (v.x * 0.5 + 0.5) * rect.width, y = (-v.y * 0.5 + 0.5) * rect.height;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      const visible = facing > -0.15 && v.z < 1 && this.scanProgress >= 1;
      el.classList.toggle('is-hidden', !visible);
      el.classList.toggle('flip-x', x > rect.width * 0.6);
    }
  }

  /** Programmatically open an annotation (used by the scroll spotlight). */
  showHotspot(id, on = true) {
    const h = this.hotspotEls?.find((o) => o.data.id === id);
    if (h) h.el.classList.toggle('is-open', on);
  }

  /* ---------------- materialise (scan reveal) ---------------- */
  _buildScan() {
    this.scanPlaneSolid = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
    this.scanPlaneWire = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.wireMat = new THREE.MeshBasicMaterial({ color: 0xbfe6ff, wireframe: true, transparent: true, opacity: 0.35, toneMapped: false });
    const ringGeo = new THREE.RingGeometry(0.98, 1.0, 96);
    ringGeo.rotateX(-Math.PI / 2);
    const band = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, toneMapped: false, side: THREE.DoubleSide, depthWrite: false }));
    band.scale.setScalar(this.radius * 1.15);
    this.scanGroup = band;
    this.scene.add(band);
    this.scanBox = new THREE.Box3().setFromObject(this.pivot);
  }

  _updateScan() {
    const p = this.scanProgress;
    const y = THREE.MathUtils.lerp(this.scanBox.min.y - 0.2, this.scanBox.max.y + 0.2, p);
    this.scanPlaneSolid.constant = y;   // keep below y
    this.scanPlaneWire.constant = -y;   // keep above y
    this.scanGroup.position.y = y;
    this.scanGroup.visible = p > 0.001 && p < 0.999;
  }

  preRender(renderer) {
    if (!this.scanGroup || this.scanProgress >= 1) return false;
    // custom two-pass draw: solid below the scan line, wireframe above
    renderer.clippingPlanes = [this.scanPlaneSolid];
    renderer.render(this.scene, this.camera);
    renderer.clippingPlanes = [this.scanPlaneWire];
    this.scene.overrideMaterial = this.wireMat;
    this.studioObjects.forEach((o) => { o.visible = false; });
    renderer.render(this.scene, this.camera);
    this.scene.overrideMaterial = null;
    this.studioObjects.forEach((o) => { o.visible = true; });
    renderer.clippingPlanes = [];
    return true;
  }

  /* ---------------- controls API ---------------- */
  reset() {
    if (!this.ready) return;
    const from = this.camera.position.clone();
    const to = this.home.clone().setLength(this.fitDistance);
    const start = performance.now();
    const step = () => {
      const k = Math.min(1, (performance.now() - start) / 700);
      const e = 1 - Math.pow(1 - k, 3);
      this.camera.position.lerpVectors(from, to, e);
      if (k < 1) requestAnimationFrame(step);
    };
    step();
  }

  zoomBy(f) {
    if (!this.ready) return;
    const d = THREE.MathUtils.clamp(this.camera.position.length() * f, this.radius * 0.9, this.fitDistance * 1.8);
    this.camera.position.setLength(d);
  }

  rotateBy(a) {
    if (!this.controls) return;
    const s = new THREE.Spherical().setFromVector3(this.camera.position);
    s.theta += a;
    this.camera.position.setFromSpherical(s);
  }

  /** Glide the camera to a polar/azimuth pair (radians), e.g. from the angle thumbnails. */
  orbitTo(polar, azimuth) {
    if (!this.ready) return;
    const from = new THREE.Spherical().setFromVector3(this.camera.position);
    const to = new THREE.Spherical(this.fitDistance, polar, azimuth);
    let dTheta = ((to.theta - from.theta + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    const start = performance.now();
    const s = new THREE.Spherical();
    const step = () => {
      const k = Math.min(1, (performance.now() - start) / 900);
      const e = 1 - Math.pow(1 - k, 3);
      s.set(THREE.MathUtils.lerp(from.radius, to.radius, e), THREE.MathUtils.lerp(from.phi, to.phi, e), from.theta + dTheta * e);
      this.camera.position.setFromSpherical(s);
      if (k < 1) requestAnimationFrame(step);
    };
    step();
  }

  setAutoRotate(on) {
    this.paused = !on;
    if (this.controls) this.controls.autoRotate = on && !REDUCED_MOTION;
  }

  _release() {
    if (!this.ready || this.onScreen) return;
    this.ready = false;
    this.controls?.dispose();
    this.controls = null;
    this.hotspotLayer?.remove();
    this.hotspotEls = null;
    disposeStage(this.stage?.root);
    this.scene = null;
    this.el.classList.remove('is-ready');
  }

  destroy() {
    this.destroyed = true;
    clearTimeout(this._disposeTimer);
    clearTimeout(this._idleTimer);
    this.io.disconnect();
    engine.remove(this);
    this.controls?.dispose();
    this.hotspotLayer?.remove();
    disposeStage(this.stage?.root);
    this.scene = null;
  }
}
