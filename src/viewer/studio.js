/**
 * THE STUDIO — one shared photographic setup for every relic, so the whole catalogue reads
 * like one product shoot (think apple.com product pages, but SAINTCHROME black).
 *
 *  - createStudioEnvironment(): reflection map baked with PMREM from "lightformers": soft-edged
 *    emissive panels (one big overhead softbox, a long strip light left and right, a rim strip
 *    behind, a faint front kicker) inside a near-black neutral dome. Polished metal then shows
 *    the long, clean highlight streaks of a real studio instead of a CG room.
 *  - createStage(): wraps one relic for display — matching RectAreaLights for the non-metal
 *    parts, a baked soft contact shadow, a faint light pool on the floor and a neutral
 *    #0A0A0A → #151517 backdrop. Used by both the live viewers (view.js) and the export lab.
 *  - STUDIO: the shared lens / exposure / bloom settings.
 */
import * as THREE from 'three';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { HorizontalBlurShader } from 'three/addons/shaders/HorizontalBlurShader.js';
import { VerticalBlurShader } from 'three/addons/shaders/VerticalBlurShader.js';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';

export const STUDIO = {
  exposure: 0.9,       // ACES filmic; nothing but small speculars should reach white
  fov: 24,             // product-photography lens: long and flat, no wide-angle bulge
  bloom: { strength: 0.12, radius: 0.3, threshold: 1.0 }, // only the hottest glints
  bgTop: '#0A0A0A',
  bgBottom: '#151517',
};

/* ---------------- reflection environment ---------------- */

let softTex;
/** White rectangle with feathered edges: makes reflected softboxes look like real diffusers. */
function softboxTexture() {
  if (softTex) return softTex;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, 128, 128);
  // a real diffuser is brightest in the middle and falls off toward a feathered edge
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 70);
  g.addColorStop(0, '#fff');
  g.addColorStop(1, '#8a8a8a');
  ctx.filter = 'blur(6px)';
  ctx.fillStyle = g;
  ctx.fillRect(12, 12, 104, 104);
  softTex = new THREE.CanvasTexture(c);
  return softTex;
}

export function createStudioEnvironment(renderer) {
  const scene = new THREE.Scene();

  // near-black neutral dome, a touch lighter overhead so chrome never goes dead flat black
  const dome = new THREE.SphereGeometry(40, 48, 24);
  const col = [], p = dome.attributes.position, c = new THREE.Color();
  const top = new THREE.Color(0.1, 0.1, 0.104), mid = new THREE.Color(0.04, 0.04, 0.043), low = new THREE.Color(0.006, 0.006, 0.007);
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i) / 40;
    if (y > 0) c.copy(mid).lerp(top, Math.min(1, y * 1.4));
    else c.copy(mid).lerp(low, Math.min(1, -y * 3));
    col.push(c.r, c.g, c.b);
  }
  dome.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  scene.add(new THREE.Mesh(dome, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));

  const light = (w, h, intensity, pos, color = 0xffffff) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ map: softboxTexture(), color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }),
    );
    m.position.set(...pos);
    m.lookAt(0, 0, 0);
    scene.add(m);
    return m;
  };
  light(13, 13, 1.15, [0, 15, 3]);         // big overhead softbox
  light(1.8, 20, 2.2, [-13, 2, 5]);        // long strip, left (the signature vertical streak)
  light(1.3, 20, 1.7, [13, 2, -1]);        // long strip, right
  light(18, 1.6, 1.9, [0, 4, -15]);        // rim strip behind
  light(9, 3.2, 0.6, [3, -1.5, 15]);       // soft front card so faces toward camera aren't dead

  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(scene, 0.015).texture;
  pmrem.dispose();
  scene.traverse((o) => { o.geometry?.dispose(); });
  return env;
}

/* ---------------- stage: lights, contact shadow, floor pool, backdrop ---------------- */

let areaInit = false;
const texCache = new Map();

function gradientTexture(key, draw) {
  if (texCache.has(key)) return texCache.get(key);
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  draw(c.getContext('2d'));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  texCache.set(key, t);
  return t;
}

const backdropTexture = () => gradientTexture('backdrop', (ctx) => {
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, STUDIO.bgTop);
  g.addColorStop(0.55, '#0f0f10');
  g.addColorStop(1, STUDIO.bgBottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
});

const poolTexture = () => gradientTexture('pool', (ctx) => {
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.4, 'rgba(255,255,255,0.45)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
});

/**
 * Soft contact shadow, baked once (like drei's <ContactShadows>): an orthographic camera on the
 * floor looks up, renders the relic's depth as darkness, and the result is blurred twice.
 */
function bakeContactShadow(renderer, object, { width, depth, far, floorY, res = 1024, blur = 2.6, darkness = 1.6 }) {
  const rtA = new THREE.WebGLRenderTarget(res, res);
  const rtB = new THREE.WebGLRenderTarget(res, res);
  rtA.texture.generateMipmaps = rtB.texture.generateMipmaps = false;

  const cam = new THREE.OrthographicCamera(-width / 2, width / 2, depth / 2, -depth / 2, 0, far);
  cam.rotation.x = Math.PI / 2; // look straight up from the floor
  cam.position.y = floorY;
  cam.updateMatrixWorld();

  const depthMat = new THREE.MeshDepthMaterial();
  depthMat.side = THREE.DoubleSide;
  depthMat.onBeforeCompile = (shader) => {
    shader.uniforms.darkness = { value: darkness };
    shader.fragmentShader = `uniform float darkness;\n${shader.fragmentShader}`.replace(
      'gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );',
      'gl_FragColor = vec4( vec3( 0.0 ), ( 1.0 - fragCoordZ ) * darkness );',
    );
  };

  const tmp = new THREE.Scene();
  const parent = object.parent;
  tmp.add(object);
  tmp.overrideMaterial = depthMat;

  const prevTarget = renderer.getRenderTarget();
  const prevColor = renderer.getClearColor(new THREE.Color());
  const prevAlpha = renderer.getClearAlpha();
  const prevAutoClear = renderer.autoClear;
  const prevTone = renderer.toneMapping;
  renderer.autoClear = false;
  renderer.setClearColor(0x000000, 0);
  renderer.setRenderTarget(rtA);
  renderer.clear();
  renderer.render(tmp, cam);

  const hBlur = new THREE.ShaderMaterial(HorizontalBlurShader);
  const vBlur = new THREE.ShaderMaterial(VerticalBlurShader);
  const quad = new FullScreenQuad(hBlur);
  const pass = (amount) => {
    quad.material = hBlur;
    hBlur.uniforms.tDiffuse.value = rtA.texture;
    hBlur.uniforms.h.value = amount / res;
    renderer.setRenderTarget(rtB);
    renderer.clear();
    quad.render(renderer);
    quad.material = vBlur;
    vBlur.uniforms.tDiffuse.value = rtB.texture;
    vBlur.uniforms.v.value = amount / res;
    renderer.setRenderTarget(rtA);
    renderer.clear();
    quad.render(renderer);
  };
  pass(blur * 2.2);   // soft penumbra
  pass(blur);
  pass(blur * 0.5);

  renderer.setRenderTarget(prevTarget);
  renderer.setClearColor(prevColor, prevAlpha);
  renderer.autoClear = prevAutoClear;
  renderer.toneMapping = prevTone;
  quad.dispose(); hBlur.dispose(); vBlur.dispose(); depthMat.dispose(); rtB.dispose();
  tmp.remove(object);
  if (parent) parent.add(object);

  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(width, depth),
    new THREE.MeshBasicMaterial({ map: rtA.texture, transparent: true, depthWrite: false, toneMapped: false, opacity: 0.95, side: THREE.DoubleSide }),
  );
  plane.rotation.x = -Math.PI / 2;
  plane.scale.y = -1;
  plane.renderOrder = -2;
  plane.name = 'contactShadow';
  plane.userData.studio = true;
  plane.userData.dispose = () => rtA.dispose();
  return plane;
}

/**
 * Wrap a relic for display. The object is centred at the origin inside `root`; the floor sits just
 * under it. A relic that is mostly cable (earphones) can set userData.focus = [x, y, z] (its own
 * coordinates): that point goes to the origin instead, so cameras orbit it, and viewers frame a
 * circle of userData.frameRadius round it (the rest may leave the frame, like a product photo).
 * Returns { scene, root, radius, center, floorY, backdrop, updateBackdrop(camera, fov) }.
 */
export function createStage(renderer, object, { env, shadow = true, backdrop = true, lights = 'studio' } = {}) {
  const scene = new THREE.Scene();
  scene.environment = env;

  const box = new THREE.Box3().setFromObject(object);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const radius = box.getBoundingSphere(new THREE.Sphere()).radius;
  object.position.sub(center);
  const root = new THREE.Group();
  root.add(object);
  // focus point in root space (the object may already carry an offset from an earlier stage)
  const focus = object.userData.focus ? new THREE.Vector3(...object.userData.focus).add(object.position).setY(0) : new THREE.Vector3();
  root.position.sub(focus);
  const floorY = -size.y / 2 - radius * 0.012;

  if (lights === 'studio') {
    // physical area lights that match the softboxes in the reflection map, for the non-metal
    // parts (rubber, enamel, stone); mirror metal is lit by its reflections
    if (!areaInit) { RectAreaLightUniformsLib.init(); areaInit = true; }
    const top = new THREE.RectAreaLight(0xffffff, 2.2, radius * 3, radius * 3);
    top.position.set(0, radius * 3, radius * 0.7);
    top.lookAt(0, 0, 0);
    const strip = new THREE.RectAreaLight(0xffffff, 2.2, radius * 0.35, radius * 3.2);
    strip.position.set(-radius * 2.6, radius * 0.5, radius * 1.0);
    strip.lookAt(0, 0, 0);
    const rim = new THREE.RectAreaLight(0xffffff, 2.4, radius * 3, radius * 0.3);
    rim.position.set(0, radius * 0.9, -radius * 2.6);
    rim.lookAt(0, 0, 0);
    scene.add(top, strip, rim, new THREE.HemisphereLight(0xffffff, 0x0a0a0c, 0.12));
    // dark glossy relics (black acetate eyewear) can ask for extra kickers behind on both sides,
    // so the silhouette separates from the black stage. Directional lights, not RectAreaLights:
    // two more area lights cost ~25% of the frame in the macro close-up (clearcoat doubles them).
    const kick = object.userData.rimBoost || 0;
    if (kick) {
      rim.intensity *= 1 + kick * 0.5;
      for (const s of [1, -1]) {
        const k = new THREE.DirectionalLight(0xffffff, 1.6 * kick);
        k.position.set(s * radius * 2.4, radius * 0.7, -radius * 1.7);
        k.name = 'rimKicker';
        scene.add(k);
      }
    }
  } else {
    // the brand halo (home hero, 404) keeps its punchier graphic lighting
    const key = new THREE.DirectionalLight(0xffffff, 1.5); key.position.set(4, 6, 5);
    const rim = new THREE.DirectionalLight(0xbfe6ff, 3.2); rim.position.set(-6, 3, -6);
    const under = new THREE.DirectionalLight(0xffffff, 0.6); under.position.set(0, -6, 3);
    scene.add(key, rim, under, new THREE.AmbientLight(0xffffff, 0.08));
  }

  if (shadow) {
    const span = Math.max(size.x, size.z) * 1.5 + radius * 0.5;
    const sh = bakeContactShadow(renderer, object, { width: span, depth: span, floorY, far: Math.max(size.y * 0.55, radius * 0.25) });
    sh.position.y = floorY + radius * 0.001;
    root.add(sh);
    const pool = new THREE.Mesh(
      new THREE.PlaneGeometry(radius * 4.2, radius * 4.2),
      new THREE.MeshBasicMaterial({ map: poolTexture(), color: new THREE.Color(0.05, 0.05, 0.053), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }),
    );
    pool.rotation.x = -Math.PI / 2;
    pool.position.y = floorY;
    pool.renderOrder = -3;
    pool.name = 'floorPool';
    pool.userData.studio = true;
    root.add(pool);
  }

  let bd = null;
  if (backdrop) {
    bd = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: backdropTexture(), toneMapped: false, depthWrite: false }));
    bd.renderOrder = -10;
    bd.userData.studio = true;
    scene.add(bd);
  }

  const dir = new THREE.Vector3();
  const updateBackdrop = (camera) => {
    if (!bd) return;
    dir.copy(camera.position).normalize();
    bd.position.copy(dir).multiplyScalar(-radius * 3);
    bd.quaternion.copy(camera.quaternion);
    const d = camera.position.distanceTo(bd.position);
    const h = 2 * d * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
    bd.scale.set(h * 1.2 * Math.max(1, camera.aspect), h * 1.2, 1);
  };

  return { scene, root, radius, center: object.userData.focus ? focus.clone().sub(object.position) : center, size, floorY, backdrop: bd, updateBackdrop };
}

/**
 * Camera distance that frames the relic's bounding box (not its bounding sphere) from a given
 * angle, with `pad` breathing room — flat products like a cable laid on a table need this.
 */
export function frameDistance(size, polar, az, fov, aspect, pad = 1.12) {
  const cam = new THREE.PerspectiveCamera(fov, aspect, 0.01, 1e4);
  const dir = new THREE.Vector3().setFromSpherical(new THREE.Spherical(1, polar, az));
  const corners = [];
  for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) corners.push(new THREE.Vector3(x * size.x / 2, y * size.y / 2, z * size.z / 2));
  const v = new THREE.Vector3();
  const fits = (d) => {
    cam.position.copy(dir).multiplyScalar(d);
    cam.lookAt(0, 0, 0);
    cam.updateMatrixWorld();
    return corners.every((c) => { v.copy(c).project(cam); return v.z < 1 && Math.abs(v.x) * pad <= 1 && Math.abs(v.y) * pad <= 1; });
  };
  let lo = 0.01, hi = size.length() * 20;
  for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (fits(mid)) hi = mid; else lo = mid; }
  return hi;
}

/** Release GPU resources owned by a stage (baked shadow targets). */
export function disposeStage(root) {
  root?.traverse((o) => o.userData?.dispose?.());
}
