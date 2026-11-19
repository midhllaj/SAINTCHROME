/**
 * TRY THE HALO — live webcam try-on for the eyewear relics.
 * MediaPipe Face Landmarker tracks the face; the 3D frames ride on a transparent viewer
 * above the mirrored video. The camera only opens when the visitor asks, and nothing leaves
 * the device. If the camera is denied or unavailable, the frames are shown in a 3D viewer instead.
 */
import * as THREE from 'three';
import { createPage } from './_kit.js';
import { byRite, bySlug } from '../config/products.js';
import { formatPrice } from '../config/site.js';
import { esc } from '../core/dom.js';
import { onTick } from '../core/scroll.js';
import { View } from '../viewer/view.js';
import { lens } from '../models/kit/materials.js';

const MP_VERSION = '1.2.3'; // keep in sync with @mediapipe/tasks-vision in package.json
const WASM = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VERSION}/wasm`;
const FACE_MODEL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
const FRAME_TO_EYES = 1.62; // frame width ÷ outer-eye-corner distance

export default async function tryon() {
  const frames = byRite('eyewear');
  const want = new URLSearchParams(location.search).get('frame');
  let current = bySlug(want)?.rite === 'eyewear' ? bySlug(want) : frames[0];

  const page = createPage('tryon', `
  <section class="tryon">
    <div>
      <div class="tryon__stage">
        <video playsinline muted aria-hidden="true"></video>
        <div class="tryon__overlay" aria-hidden="true"></div>
        <div class="tryon__msg">
          <div>
            <span class="mono" style="color:var(--ice)">[ TRY THE HALO ✦ LIVE ]</span>
            <h2 class="h2 chrome-text" style="font-size:clamp(28px,4vw,52px)">See yourself in chrome.</h2>
            <p class="tryon__text">Your camera stays on this device. Nothing is recorded or uploaded.</p>
            <button class="btn btn--chrome tryon__start" type="button" data-magnetic><span class="btn__label">OPEN THE CAMERA</span></button>
          </div>
        </div>
        <span class="tryon__corner mono" style="top:14px;left:16px">[ REC ✦ LOCAL ONLY ]</span>
        <span class="tryon__corner mono tryon__status" style="bottom:14px;right:16px"></span>
      </div>
    </div>
    <aside>
      <span class="mono" style="color:var(--dim)">[ RITE 03 ✦ OCULUS ]</span>
      <h1 class="page-hero__title chrome-text" style="font-size:clamp(40px,6vw,96px);margin-top:10px">Try the Halo</h1>
      <p class="page-hero__sub">Pick a frame and look straight into the camera. Turn your head slowly and the frames follow.</p>
      <div class="tryon__picker" role="radiogroup" aria-label="Choose frames">
        ${frames.map((p) => `
          <button class="tryon__pick" type="button" role="radio" data-slug="${p.slug}" aria-pressed="${p === current}" aria-checked="${p === current}">
            <img src="/shots/${p.slug}-card.jpg" alt="" />
            <span><strong>${esc(p.name)}</strong><span class="mono">${esc(p.brand).toUpperCase()} · ${formatPrice(p.price)}</span></span>
          </button>`).join('')}
      </div>
      <a class="btn btn--ghost btn--block tryon__link" href="/relic/${current.slug}"><span class="btn__label">VIEW ${esc(current.name).toUpperCase()} →</span></a>
      <p class="mono" style="color:var(--dim);margin-top:18px;font-size:10px">Frames are authentic Ray-Ban, curated and resold by SAINTCHROME. The try-on is a preview; real fit may vary.</p>
    </aside>
  </section>`);

  const stage = page.el.querySelector('.tryon__stage');
  const video = stage.querySelector('video');
  const overlay = stage.querySelector('.tryon__overlay');
  const status = stage.querySelector('.tryon__status');
  const msgText = stage.querySelector('.tryon__text');
  const startBtn = stage.querySelector('.tryon__start');

  let mode = 'idle'; // idle | live | fallback
  let view = null, stream = null, landmarker = null, lastVideoTime = -1;
  let face = null; // smoothed pose
  let modelWidth = 14;

  const makeView = () => {
    view?.destroy();
    const live = mode === 'live';
    view = new View(overlay, {
      model: current.model, controls: !live, autoRotate: live ? 0 : 0.8, background: null, backdrop: false,
      fit: live ? 1.0 : 1.1, polar: live ? Math.PI / 2 : 1.25, fov: 30, keepAlive: true, accent: current.accent,
      onReady: (v) => {
        const box = new THREE.Box3().setFromObject(v.object);
        modelWidth = box.max.x - box.min.x;
        // over a webcam feed or the page, the lenses are thin alpha glass (transmission would
        // only see what the 3D scene holds)
        const glass = current.slug === 'sulfur-vision' ? lens('#ffcc00', 0.35) : lens('#ffffff');
        v.object.traverse((o) => { if (o.isMesh && o.material?.name === 'GlassesLens') o.material = glass; });
        if (live) { v.pivot.visible = false; addVideoPlane(v); addHead(v); }
      },
      onUpdate: live ? placeFrames : null,
    });
  };

  // An invisible head (depth only) behind the front, so the temples disappear behind the face
  // and ears as they would on a real head instead of floating over the cheeks.
  function addHead(v) {
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(1, 40, 28),
      new THREE.MeshBasicMaterial({ colorWrite: false }),
    );
    head.scale.set(modelWidth * 0.46, modelWidth * 0.72, modelWidth * 0.68); // cm, from the frame width
    const box = new THREE.Box3().setFromObject(v.object);
    head.position.set((box.min.x + box.max.x) / 2, box.min.y + (box.max.y - box.min.y) * 0.35, box.max.z - modelWidth * 0.06 - head.scale.z);
    head.renderOrder = -0.5; // after the video, before the frame
    head.name = 'headOccluder';
    v.object.parent.add(head);
  }

  // The page's WebGL canvas sits *under* the DOM, so the camera feed is drawn inside the
  // 3D scene (as a mirrored, cover-cropped video texture) instead of as a <video> on top.
  function addVideoPlane(v) {
    const tex = new THREE.VideoTexture(video);
    tex.colorSpace = THREE.SRGBColorSpace;
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, depthWrite: false }));
    plane.renderOrder = -1;
    v.camera.add(plane);
    v.videoPlane = plane;
  }
  function fitVideoPlane(v) {
    const plane = v.videoPlane;
    if (!plane || !video.videoWidth) return;
    const rect = overlay.getBoundingClientRect();
    const depth = v.camera.position.length() * 3;
    const h = 2 * depth * Math.tan(THREE.MathUtils.degToRad(v.camera.fov) / 2);
    plane.position.set(0, 0, -depth);
    plane.scale.set(h * (rect.width / rect.height), h, 1);
    const A = rect.width / rect.height, V = video.videoWidth / video.videoHeight;
    const tex = plane.material.map;
    let rx = 1, ry = 1;
    if (V > A) rx = A / V; else ry = V / A;
    tex.repeat.set(-rx, ry);                    // negative x = mirror, like a real mirror
    tex.offset.set(1 - (1 - rx) / 2, (1 - ry) / 2);
  }

  function placeFrames(v) {
    fitVideoPlane(v);
    if (!face) { v.pivot.visible = false; return; }
    v.pivot.visible = true;
    const rect = overlay.getBoundingClientRect();
    const dist = v.camera.position.length();
    const visH = 2 * dist * Math.tan(THREE.MathUtils.degToRad(v.camera.fov) / 2);
    const visW = visH * (rect.width / rect.height);
    const wx = (face.x / rect.width - 0.5) * visW;
    const wy = -(face.y / rect.height - 0.5) * visH;
    const eyeW = (face.eye / rect.width) * visW;
    v.pivot.position.set(wx, wy, 0);
    v.pivot.scale.setScalar((eyeW * FRAME_TO_EYES) / modelWidth);
    v.pivot.quaternion.copy(face.q);
  }

  // map a landmark (normalised, un-mirrored video space) to overlay pixels (mirrored, object-fit: cover)
  const toStage = (lm, rect) => {
    const vw = video.videoWidth, vh = video.videoHeight;
    const s = Math.max(rect.width / vw, rect.height / vh);
    const dw = vw * s, dh = vh * s;
    return { x: (rect.width - dw) / 2 + (1 - lm.x) * dw, y: (rect.height - dh) / 2 + lm.y * dh };
  };

  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), pos = new THREE.Vector3(), scl = new THREE.Vector3();
  function detect() {
    if (mode !== 'live' || !landmarker || video.readyState < 2 || video.currentTime === lastVideoTime) return;
    lastVideoTime = video.currentTime;
    const res = landmarker.detectForVideo(video, performance.now());
    const lms = res.faceLandmarks?.[0];
    if (!lms) { face = null; status.textContent = '[ LOOK INTO THE LIGHT ]'; return; }
    status.textContent = '[ FACE LOCKED ✦ ]';
    const rect = overlay.getBoundingClientRect();
    const bridge = toStage(lms[168], rect), l = toStage(lms[33], rect), r = toStage(lms[263], rect);
    const eye = Math.hypot(l.x - r.x, l.y - r.y);
    const mat = res.facialTransformationMatrixes?.[0];
    if (mat) {
      m4.fromArray(mat.data).decompose(pos, q, scl);
      q.set(q.x, -q.y, -q.z, q.w); // mirror to match the flipped video
    } else {
      q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.atan2(r.y - l.y, r.x - l.x) + Math.PI);
    }
    const target = { x: bridge.x, y: bridge.y + eye * 0.08, eye, q: q.clone() };
    if (!face) face = target;
    else {
      const k = 0.5;
      face.x += (target.x - face.x) * k; face.y += (target.y - face.y) * k; face.eye += (target.eye - face.eye) * k;
      face.q.slerp(target.q, k);
    }
  }
  page.cleanup(onTick(detect));

  async function start() {
    startBtn.disabled = true;
    startBtn.querySelector('.btn__label').textContent = 'WAKING THE CAMERA…';
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('unsupported');
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      video.srcObject = stream;
      await video.play();
      startBtn.querySelector('.btn__label').textContent = 'SUMMONING THE FACE MESH…';
      const { FilesetResolver, FaceLandmarker } = await import('@mediapipe/tasks-vision');
      const fileset = await FilesetResolver.forVisionTasks(WASM);
      landmarker = await FaceLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: FACE_MODEL, delegate: 'GPU' },
        runningMode: 'VIDEO', numFaces: 1, outputFacialTransformationMatrixes: true,
      });
      if (page.destroyed) return stop();
      mode = 'live';
      stage.classList.add('is-live');
      makeView();
    } catch (err) {
      console.warn('[try-on]', err);
      stop();
      fallback(err?.name === 'NotAllowedError' ? 'Camera access was denied, so here are the frames in 3D instead. Drag to turn them. To try them on, allow camera access in your browser settings and reload.' : 'The live try-on is not available on this device, so here are the frames in 3D instead. Drag to turn them.');
    }
  }

  function fallback(text) {
    mode = 'fallback';
    stage.classList.add('is-fallback');
    msgText.textContent = text;
    startBtn.style.display = 'none';
    stage.querySelector('.tryon__msg').style.cssText = 'place-items:end start;pointer-events:none;text-align:left';
    stage.querySelector('.tryon__msg h2').remove();
    status.textContent = '[ 3D PREVIEW ]';
    makeView();
  }

  function stop() {
    stream?.getTracks().forEach((t) => t.stop());
    stream = null;
    landmarker?.close?.();
    landmarker = null;
  }

  startBtn.addEventListener('click', start);
  page.el.querySelectorAll('.tryon__pick').forEach((b) => b.addEventListener('click', () => {
    current = bySlug(b.dataset.slug);
    page.el.querySelectorAll('.tryon__pick').forEach((x) => { const on = x === b; x.setAttribute('aria-pressed', String(on)); x.setAttribute('aria-checked', String(on)); });
    const link = page.el.querySelector('.tryon__link');
    link.href = `/relic/${current.slug}`;
    link.querySelector('.btn__label').textContent = `VIEW ${current.name.toUpperCase()} →`;
    if (mode !== 'idle') makeView();
  }));

  const baseDestroy = page.destroy;
  page.destroy = () => { page.destroyed = true; stop(); view?.destroy(); baseDestroy(); };
  page.meta = { title: 'Try the Halo — Live Try-On | SAINTCHROME', description: 'Try SAINTCHROME eyewear on your own face, live in the browser. Your camera never leaves your device.' };
  page.mount = () => page.enhance();
  return page;
}
