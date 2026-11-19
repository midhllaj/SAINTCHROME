/**
 * DEV ONLY — renders and exports every relic:
 *   public/models/<key>.glb          (GLTFExporter, binary)
 *   public/shots/<slug>.png          (1400² product shot on black)
 *   public/shots/<slug>-card.jpg     (720² card image)
 *   public/shots/<slug>-a1..a4.jpg   (four angles for the product page grid)
 *   public/chapel/<slug>-1..2.jpg    (dramatic portrait renders for The Chapel)
 * Files are written by the dev-server endpoint in vite.config.js.
 */
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { createStudioEnvironment, createStage, disposeStage, frameDistance, STUDIO } from './viewer/studio.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { loadModel } from './models/index.js';
import { PRODUCTS } from './config/products.js';

const save = async (path, blob) => {
  const r = await fetch(`/__save?path=${encodeURIComponent(path)}`, { method: 'POST', body: blob });
  if (!r.ok) throw new Error(`save failed ${path}`);
};

let R;
function getRenderer() {
  if (R) return R;
  const canvas = document.createElement('canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, alpha: false });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = STUDIO.exposure;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const env = createStudioEnvironment(renderer);
  R = { renderer, env, canvas };
  return R;
}

/**
 * Render one relic in the shared studio (viewer/studio.js): same lightformer reflections, area
 * lights, contact shadow, neutral backdrop, lens and exposure as the live viewers, plus the
 * soft vignette the viewers get from CSS.
 */
async function shoot({ object, w, h, polar, az, fit = 1.1, fov = STUDIO.fov, offsetY = 0, lights = 'studio', vignette = 0.42 }) {
  const { renderer, env, canvas } = getRenderer();
  renderer.setPixelRatio(1);
  renderer.setSize(w, h, false);
  const stage = createStage(renderer, object, { env, lights, shadow: lights === 'studio' });
  stage.scene.add(stage.root);
  const camera = new THREE.PerspectiveCamera(fov, w / h, 0.1, 500);
  const fr = object.userData.frameRadius; // focus-framed relic (earphones): fit a circle round the focus
  const vF = THREE.MathUtils.degToRad(fov), minF = Math.min(vF, 2 * Math.atan(Math.tan(vF / 2) * (w / h)));
  const d = (fr ? fr / Math.sin(minF / 2) : frameDistance(stage.size, polar, az, fov, w / h)) * fit;
  camera.position.setFromSpherical(new THREE.Spherical(d, polar, az));
  camera.lookAt(0, offsetY, 0);
  stage.scene.add(camera);
  stage.updateBackdrop(camera);

  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples: 4 }));
  composer.setSize(w, h);
  composer.addPass(new RenderPass(stage.scene, camera));
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(w, h), STUDIO.bloom.strength, STUDIO.bloom.radius, STUDIO.bloom.threshold));
  composer.addPass(new OutputPass());
  composer.render();
  composer.dispose();
  disposeStage(stage.root);
  stage.root.remove(object);

  const out = document.createElement('canvas');
  out.width = w; out.height = h;
  const ctx = out.getContext('2d');
  ctx.drawImage(canvas, 0, 0, w, h);
  if (vignette) {
    const g = ctx.createRadialGradient(w / 2, h * 0.46, Math.min(w, h) * 0.3, w / 2, h / 2, Math.hypot(w, h) * 0.56);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, `rgba(0,0,0,${vignette})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
  return out;
}

const toBlob = (canvas, type, q) => new Promise((res) => canvas.toBlob(res, type, q));

/** Wait for any image textures a model loads (e.g. a baked logo) before exporting or shooting it. */
async function texturesLoaded(object) {
  const waits = [];
  object.traverse((o) => [o.material].flat().forEach((m) => m && Object.values(m).forEach((v) => {
    const img = v?.isTexture && v.image;
    if (v?.isTexture && (!img || (img instanceof HTMLImageElement && !img.complete))) {
      waits.push(new Promise((r) => { const t0 = performance.now(); const tick = () => (v.image?.complete || performance.now() - t0 > 5000 ? r() : setTimeout(tick, 30)); tick(); }));
    }
  })));
  await Promise.all(waits);
}

export async function exportAll(log = console.log, { only = null } = {}) {
  const exporter = new GLTFExporter();
  for (const p of PRODUCTS.filter((x) => !only || only.includes(x.slug))) {
    const { object } = await loadModel(p.model);
    await texturesLoaded(object);
    // 1) GLB
    const glb = await exporter.parseAsync(object, { binary: true });
    await save(`models/${p.model}.glb`, new Blob([glb], { type: 'model/gltf-binary' }));
    log(`✓ models/${p.model}.glb`);
    // 2) hero product shot + card
    const eyewear = p.rite === 'eyewear';
    // a model can name its own hero angle (userData.heroAngle = [polar, azimuth])
    const [hp, ha] = object.userData.heroAngle || (eyewear ? [1.4, 0.55] : [1.12, 0.0]);
    const base = { object, polar: hp, az: ha };
    let c = await shoot({ ...base, w: 1400, h: 1400, fit: 1.0 });
    await save(`shots/${p.slug}.png`, await toBlob(c, 'image/png'));
    c = await shoot({ ...base, w: 720, h: 720, fit: 1.0 });
    await save(`shots/${p.slug}-card.jpg`, await toBlob(c, 'image/jpeg', 0.88));
    log(`✓ shots/${p.slug}.png + card`);
    // 3) four angles
    const angles = [[1.12, 0.6], [0.55, 0.0], [1.35, -1.2], [1.0, 2.6]];
    for (let i = 0; i < angles.length; i++) {
      c = await shoot({ ...base, polar: angles[i][0], az: angles[i][1], w: 800, h: 800, fit: 1.0 });
      await save(`shots/${p.slug}-a${i + 1}.jpg`, await toBlob(c, 'image/jpeg', 0.86));
    }
    log(`✓ shots/${p.slug}-a1..a4`);
    // 4) chapel: dramatic portrait renders
    c = await shoot({ ...base, w: 1000, h: 1400, polar: 1.42, az: -0.5, fit: 0.78 });
    await save(`chapel/${p.slug}-1.jpg`, await toBlob(c, 'image/jpeg', 0.88));
    c = await shoot({ ...base, w: 1000, h: 1400, polar: 0.7, az: 2.3, fit: 0.9 });
    await save(`chapel/${p.slug}-2.jpg`, await toBlob(c, 'image/jpeg', 0.88));
    log(`✓ chapel/${p.slug}-1,2`);
  }
  if (only) return log('✓ done');
  // halo (brand centrepiece) for socials
  const { object } = await loadModel('halo');
  const glb = await exporter.parseAsync(object, { binary: true });
  await save('models/halo.glb', new Blob([glb]));
  const c = await shoot({ object, w: 1400, h: 1400, polar: 1.45, az: 0.0, fit: 0.8, lights: 'graphic' });
  await save('shots/halo.png', await toBlob(c, 'image/png'));
  log('✓ halo — ALL DONE');
}

/** Dev: render one model large and save to public/lab/<name>.png for close inspection. */
export async function snap(key, { name = key, w = 1600, h = 1100, polar = 1.12, az = 0, fit = 1.0, part = null, upright = false, edit = null } = {}) {
  let { object } = await loadModel(key);
  await texturesLoaded(object);
  edit?.(object); // dev: tweak this copy before the shot (e.g. hide parts)
  if (part) { // close-up of one named part (e.g. 'earbud', 'remote', 'plug')
    const sub = object.getObjectByName(part).clone();
    if (upright) { sub.position.set(0, 0, 0); sub.quaternion.identity(); sub.scale.setScalar(0.1); } // as built: standing, face to +z
    object = sub;
  }
  const c = await shoot({ object, w, h, polar, az, fit, lights: key === 'halo' ? 'graphic' : 'studio' });
  await save(`lab/${name}.png`, await toBlob(c, 'image/png'));
  return `lab/${name}.png`;
}
