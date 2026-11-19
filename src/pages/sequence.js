/**
 * Apple-style scroll story for a relic (Silent Choir here; eyewear in sequenceEyewear.js): a pinned full-screen 3D stage
 * scrubbed by ScrollTrigger.
 *   I   the earbuds rise off the table and turn to show the chrome
 *   II  the camera glides in to the perforated speaker grille
 *   III exploded view: head, driver, grille and remote buttons separate, with thin label lines
 *   IV  everything settles back onto the table
 * Captions and label text live in src/config/products.js (`story`).
 * The model marks explodable parts with userData.explode and names anchors label-* / focus-grille.
 */
import * as THREE from 'three';
import { gsap, ScrollTrigger } from '../core/scroll.js';
import { esc } from '../core/dom.js';
import { wireEyewearSequence } from './sequenceEyewear.js';

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'];
const SVG = 'http://www.w3.org/2000/svg';

export function sequenceMarkup(p) {
  if (!p.story) return '';
  return `
  <section class="seq" aria-label="${esc(p.name)}, up close">
    <div class="seq__pin">
      <div class="seq__view" aria-hidden="true"></div>
      <svg class="seq__labels" aria-hidden="true"></svg>
      <div class="seq__caps">
        ${p.story.captions.map((c, i) => `
        <div class="seq__cap">
          <span class="mono">[ ${ROMAN[i]} ]</span>
          <h2 class="seq__title chrome-text">${esc(c.title)}</h2>
          <p>${esc(c.text)}</p>
        </div>`).join('')}
      </div>
      <div class="seq__bar" aria-hidden="true"><i></i></div>
    </div>
  </section>`;
}

/** Wire the story after the page is mounted. Returns nothing; everything is cleaned up with the page. */
export function wireSequence(page, p) {
  const root = page.el.querySelector('.seq');
  if (!root) return;
  if (p.story.kind === 'eyewear') return wireEyewearSequence(page, p, root);
  const pin = root.querySelector('.seq__pin');
  const svg = root.querySelector('.seq__labels');
  const caps = [...root.querySelectorAll('.seq__cap')];
  const bar = root.querySelector('.seq__bar i');
  // the exploded view: lifter spin held from stage I, camera swing (the parts are turned toward it)
  const XV = { spin: 0.9, az: -0.6, polar: 0.7 };
  const S = { lift: 0, spin: 0, polar: 1.02, az: 0, focus: 0, explode: 0, frame: 0, labels: 0 };
  const GAIN = 1.8; // exploded offsets are authored small (true mm); open them wider for the story
  let rig = null;

  const tmp = { mid: new THREE.Vector3(), m2: new THREE.Vector3(), v: new THREE.Vector3(), n: new THREE.Vector3(), orbit: new THREE.Vector3(), close: new THREE.Vector3(), origin: new THREE.Vector3(), s: new THREE.Spherical() };

  function setup(v) {
    const obj = v.object;
    // the lifter turns the relic round the point the viewer frames (the stage shifts the
    // relic so that point is at the origin; see createStage in viewer/studio.js)
    const lifter = new THREE.Group();
    const root = obj.parent;
    lifter.position.copy(root.position).negate();
    obj.position.add(root.position);
    root.add(lifter);
    lifter.add(obj);
    const liftBase = lifter.position.clone();
    const hero = obj.getObjectByName('budA');
    const remote = obj.getObjectByName('remote');
    const within = (o, anc) => { for (let x = o; x; x = x.parent) if (x === anc) return true; return false; };
    const parts = [];
    obj.traverse((o) => {
      if (o.userData.explode && (within(o, hero) || within(o, remote))) {
        const part = { o, base: new THREE.Vector3(...o.userData.base), off: new THREE.Vector3(...o.userData.explode).multiplyScalar(GAIN) };
        if (o.userData.explodeFace) {
          // flat parts (grille, driver) turn part-way toward the exploded camera as they fly out,
          // so they read face-on instead of edge-on
          const toCam = new THREE.Vector3().setFromSphericalCoords(1, XV.polar, XV.az).applyAxisAngle(new THREE.Vector3(0, 1, 0), -XV.spin);
          const pq = o.parent.getWorldQuaternion(new THREE.Quaternion()).invert();
          const turn = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), toCam.applyQuaternion(pq).normalize());
          part.q0 = o.quaternion.clone();
          part.q1 = new THREE.Quaternion().slerp(turn, o.userData.explodeFace).multiply(o.quaternion);
        }
        parts.push(part);
      }
    });
    const anchors = {
      shell: hero.getObjectByName('label-shell'),
      driver: hero.getObjectByName('label-driver'),
      control: remote.getObjectByName('label-control'),
    };
    // label line, dot and text per anchor
    const labels = Object.entries(p.story.labels).map(([key, text], i) => {
      const g = document.createElementNS(SVG, 'g');
      const line = document.createElementNS(SVG, 'line');
      const dot = document.createElementNS(SVG, 'circle');
      dot.setAttribute('r', '3');
      const t = document.createElementNS(SVG, 'text');
      t.textContent = text;
      g.append(line, dot, t);
      svg.appendChild(g);
      const dir = [[-1, 0.55], [1, -0.7], [-1, -0.5]][i % 3]; // shell, driver, control
      t.setAttribute('text-anchor', dir[0] < 0 ? 'end' : 'start');
      return { key, g, line, dot, t, dir, anchor: anchors[key] };
    });
    return {
      lifter, liftBase, parts, labels,
      focus: hero.getObjectByName('focus-grille'),
      hero, remote,
      grille: hero.getObjectByName('grille'),
      shadow: v.stage.root.getObjectByName('contactShadow'),
    };
  }

  function apply(v) {
    const R = v.object.userData.frameRadius || v.radius; // the size of what the viewer frames
    rig.lifter.position.y = rig.liftBase.y + S.lift * R * 0.1;
    rig.lifter.rotation.y = S.spin;
    if (rig.shadow) rig.shadow.material.opacity = 0.95 * (1 - S.lift * 0.65);
    for (const { o, base, off, q0, q1 } of rig.parts) {
      o.position.copy(base).addScaledVector(off, S.explode);
      if (q0) o.quaternion.slerpQuaternions(q0, q1, S.explode);
    }
    v.pivot.updateMatrixWorld(true);

    // camera: studio orbit ↔ close-up on the grille
    // exploded framing: pull in on the space between the opened bud and the remote
    // (portrait screens: stay wider instead, there is no room to the side)
    const rect0 = v._rect || v.el.getBoundingClientRect();
    const portrait = rect0.width < rect0.height;
    rig.hero.getWorldPosition(tmp.mid);
    rig.remote.getWorldPosition(tmp.m2);
    tmp.mid.lerp(tmp.m2, portrait ? 0.3 : 0.5);
    // lean toward where the speaker parts fly out to (they leave the nozzle toward the camera)
    tmp.mid.lerp(rig.grille.getWorldPosition(tmp.v), 0.2 * S.explode).multiplyScalar(S.frame);
    tmp.s.set(v.fitDistance * (1 + S.frame * (portrait ? 0.12 : -0.2)), S.polar, S.az);
    tmp.orbit.setFromSpherical(tmp.s).add(tmp.mid);
    const gp = rig.focus.getWorldPosition(tmp.v);
    tmp.n.set(0, 1, 0).transformDirection(rig.grille.matrixWorld);
    tmp.close.copy(gp).addScaledVector(tmp.n, R * 0.4);
    tmp.close.y += R * 0.06;
    const f = S.focus;
    v.camera.position.lerpVectors(tmp.orbit, tmp.close, f);
    v.target.lerpVectors(tmp.mid, gp, f);
    v.camera.lookAt(v.target);
    // while exploded, slide the frame up-right so the parts clear the caption (bottom-left)
    const sx = portrait ? 0 : rect0.width * 0.045 * S.frame, sy = rect0.height * 0.08 * S.frame;
    if (sx > 0.5 || sy > 0.5) v.camera.setViewOffset(rect0.width, rect0.height, -sx, sy, rect0.width, rect0.height);
    else if (v.camera.view?.enabled) v.camera.clearViewOffset();
    v.camera.updateMatrixWorld();
    v.stage.updateBackdrop(v.camera);

    // labels
    const rect = v._rect || v.el.getBoundingClientRect();
    const k = Math.min(1, rect.width / 1100);
    svg.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);
    svg.style.opacity = S.labels;
    if (S.labels > 0.001) {
      const boxes = [];
      for (const L of rig.labels) {
        const a = L.anchor.getWorldPosition(tmp.v).project(v.camera);
        const ax = (a.x * 0.5 + 0.5) * rect.width, ay = (-a.y * 0.5 + 0.5) * rect.height;
        const len0 = 150 * Math.max(0.55, k) * S.labels;
        // keep the text inside the frame: shorten the leader first, flip to the other side if still clipping
        const tw = L.tw || (L.tw = L.t.getComputedTextLength()) || 120; // measured once (fonts are loaded by the preloader)
        let dx = L.dir[0], len = len0;
        const room = dx > 0 ? rect.width - 24 - tw - 8 - ax : ax - 24 - tw - 8;
        if (room < len) { if (room >= 36) len = room; else dx = -dx; }
        const lx = ax + dx * len, ly = ay + L.dir[1] * len0 * 0.6;
        const tx = lx + dx * 8;
        boxes.push({ L, ax, ay, lx, ly, tx, dx, x0: dx > 0 ? tx : tx - tw, x1: dx > 0 ? tx + tw : tx });
      }
      // no two labels on top of each other (narrow screens bunch the anchors up)
      boxes.sort((p, q) => p.ly - q.ly);
      for (let i = 1; i < boxes.length; i++) {
        for (let j = 0; j < i; j++) {
          const A = boxes[j], B = boxes[i];
          if (B.x0 < A.x1 + 12 && A.x0 < B.x1 + 12 && B.ly - A.ly < 22) B.ly = A.ly + 22;
        }
      }
      for (const { L, ax, ay, lx, ly, tx, dx } of boxes) {
        L.t.setAttribute('text-anchor', dx < 0 ? 'end' : 'start');
        L.line.setAttribute('x1', ax); L.line.setAttribute('y1', ay);
        L.line.setAttribute('x2', lx); L.line.setAttribute('y2', ly);
        L.dot.setAttribute('cx', ax); L.dot.setAttribute('cy', ay);
        L.t.setAttribute('x', tx); L.t.setAttribute('y', ly + 4);
      }
    }
  }

  page.view(root.querySelector('.seq__view'), {
    model: p.model, controls: false, autoRotate: 0, keepAlive: true, fit: 1.0,
    onReady: (v) => { rig = setup(v); },
    onUpdate: (v) => { if (rig) apply(v); },
  });

  page.gsap(() => {
    const tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' } });
    tl.to(S, { lift: 1, spin: XV.spin, polar: 0.92, duration: 1 }, 0)
      .to(S, { focus: 1, duration: 1 }, 1.05)
      .to(S, { focus: 0, duration: 0.8 }, 2.25)
      .to(S, { explode: 1, frame: 1, az: XV.az, polar: XV.polar, duration: 1.1 }, 2.4)
      .to(S, { labels: 1, duration: 0.35, ease: 'power1.out' }, 3.15)
      .to(S, { labels: 0, duration: 0.3, ease: 'power1.in' }, 3.95)
      .to(S, { explode: 0, frame: 0, az: 0, lift: 0, spin: Math.PI * 2, polar: 1.02, duration: 1.1 }, 4.05);
    // captions: in / out windows on the same timeline
    const windows = [[0.05, 0.95], [1.15, 2.15], [2.6, 3.95], [4.25, null]];
    caps.forEach((c, i) => {
      const [a, b] = windows[i] || [i, null];
      tl.fromTo(c, { autoAlpha: 0, y: 46 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'power3.out' }, a);
      if (b != null) tl.to(c, { autoAlpha: 0, y: -46, duration: 0.25, ease: 'power2.in' }, b);
    });
    tl.to({}, { duration: 0.2 }, 5.1); // a beat of stillness before the pin releases
    if (import.meta.env.DEV) window.__seqState = { S, tl, get rig() { return rig; } };
    ScrollTrigger.create({
      trigger: pin, start: 'top top', end: '+=460%', pin: true, scrub: 0.9, animation: tl,
      onUpdate: (self) => { bar.style.transform = `scaleX(${self.progress})`; },
    });
  });
}
