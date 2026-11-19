/**
 * Apple-style scroll story for the eyewear (src/models/glasses.js), on the same pinned stage
 * as the earphones story (markup from sequence.js):
 *   I   the frame floats in with its temples folded
 *   II  the temples unfold on their hinges
 *   III a slow 360° turn that drags the studio highlights along the rims
 *   IV  the camera pushes in to the corner rivets and the hinge
 *   V   exploded view: front, lenses, rivets, hinges and temples part, with thin label lines
 *   VI  everything comes back together and the acetate changes finish (story.switchTo)
 */
import * as THREE from 'three';
import { gsap, ScrollTrigger } from '../core/scroll.js';
import { setFold, finishControl } from '../models/glasses.js';

const SVG = 'http://www.w3.org/2000/svg';

export function wireEyewearSequence(page, p, root) {
  const pin = root.querySelector('.seq__pin');
  const svg = root.querySelector('.seq__labels');
  const caps = [...root.querySelectorAll('.seq__cap')];
  const bar = root.querySelector('.seq__bar i');
  const story = p.story;
  const startFinish = p.finish === 'emerald' ? 1 : 0;
  const endFinish = story.switchTo ? (story.switchTo === 'emerald' ? 1 : 0) : startFinish;
  const S = { appear: 0, fold: 1, spin: -0.3, polar: 1.32, az: 0.62, focus: 0, explode: 0, labels: 0, finish: startFinish };
  let rig = null;
  const t = { v: new THREE.Vector3(), mid: new THREE.Vector3(), orbit: new THREE.Vector3(), close: new THREE.Vector3(), dir: new THREE.Vector3(), s: new THREE.Spherical() };

  function setup(v) {
    const obj = v.object;
    const lifter = new THREE.Group();
    const stageRoot = obj.parent;
    lifter.position.copy(stageRoot.position).negate();
    obj.position.add(stageRoot.position);
    stageRoot.add(lifter);
    lifter.add(obj);
    const parts = [];
    obj.traverse((o) => {
      if (o.userData.explode) parts.push({ o, base: o.position.clone(), off: new THREE.Vector3(...o.userData.explode) });
    });
    const labels = Object.entries(story.labels).map(([key, text], i) => {
      const g = document.createElementNS(SVG, 'g');
      const line = document.createElementNS(SVG, 'line');
      const dot = document.createElementNS(SVG, 'circle');
      dot.setAttribute('r', '3');
      const tx = document.createElementNS(SVG, 'text');
      tx.textContent = text;
      g.append(line, dot, tx);
      svg.appendChild(g);
      const dir = [[-1, -0.8], [1, 0.6], [1, -0.9], [-1, 0.7]][i % 4]; // acetate, lens, hinge, rivet
      return { key, line, dot, t: tx, dir, anchor: obj.getObjectByName(`label-${key}`) };
    });
    return {
      lifter, liftBase: lifter.position.clone(), parts, labels,
      focus: obj.getObjectByName('focus-hinge'),
      finish: finishControl(obj),
      shadow: v.stage.root.getObjectByName('contactShadow'),
    };
  }

  function apply(v) {
    const R = v.radius;
    const obj = v.object;
    // float in, then settle
    rig.lifter.position.y = rig.liftBase.y + (1 - S.appear) * -R * 0.35 + Math.sin(S.appear * Math.PI) * R * 0.06;
    rig.lifter.rotation.y = S.spin;
    if (rig.shadow) rig.shadow.material.opacity = 0.95 * S.appear * (1 - S.explode * 0.6) * (1 - S.fold * 0.5);
    setFold(obj, S.fold);
    for (const { o, base, off } of rig.parts) o.position.copy(base).addScaledVector(off, S.explode);
    rig.finish?.set(S.finish);
    v.pivot.updateMatrixWorld(true);

    // camera: studio orbit ↔ macro on the corner rivets + hinge
    const rect = v._rect || v.el.getBoundingClientRect();
    t.s.set(v.fitDistance * (1 + S.explode * 0.12), S.polar, S.az);
    t.orbit.setFromSpherical(t.s);
    const fp = rig.focus.getWorldPosition(t.v);
    t.dir.set(fp.x, 0, fp.z).normalize().multiplyScalar(0.75).add(new THREE.Vector3(0, 0.38, 0.55)).normalize();
    t.close.copy(fp).addScaledVector(t.dir, R * 0.42);
    v.camera.position.lerpVectors(t.orbit, t.close, S.focus);
    v.target.set(0, 0, 0).lerp(fp, S.focus);
    v.camera.lookAt(v.target);
    v.camera.updateMatrixWorld();
    v.stage.updateBackdrop(v.camera);

    // label lines
    const k = Math.min(1, rect.width / 1100);
    svg.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);
    svg.style.opacity = S.labels;
    if (S.labels > 0.001) {
      for (const L of rig.labels) {
        if (!L.anchor) continue;
        const a = L.anchor.getWorldPosition(t.v).project(v.camera);
        const ax = (a.x * 0.5 + 0.5) * rect.width, ay = (-a.y * 0.5 + 0.5) * rect.height;
        const len0 = 120 * Math.max(0.55, k) * S.labels;
        const tw = L.tw || (L.tw = L.t.getComputedTextLength()) || 120;
        let dx = L.dir[0], len = len0;
        const room = dx > 0 ? rect.width - 24 - tw - 8 - ax : ax - 24 - tw - 8;
        if (room < len) { if (room >= 36) len = room; else dx = -dx; }
        const lx = ax + dx * len, ly = ay + L.dir[1] * len0 * 0.6;
        const tx = lx + dx * 8;
        L.t.setAttribute('text-anchor', dx < 0 ? 'end' : 'start');
        L.line.setAttribute('x1', ax); L.line.setAttribute('y1', ay);
        L.line.setAttribute('x2', lx); L.line.setAttribute('y2', ly);
        L.dot.setAttribute('cx', ax); L.dot.setAttribute('cy', ay);
        L.t.setAttribute('x', tx); L.t.setAttribute('y', ly + 4);
      }
    }
  }

  page.view(root.querySelector('.seq__view'), {
    model: p.model, controls: false, autoRotate: 0, keepAlive: true, fit: 1.05, polar: S.polar, azimuth: S.az,
    onReady: (v) => { rig = setup(v); },
    onUpdate: (v) => { if (rig) apply(v); },
  });

  page.gsap(() => {
    const tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' } });
    tl.to(S, { appear: 1, spin: 0, duration: 1 }, 0)                          // I    float in, folded
      .to(S, { fold: 0, spin: 0.35, duration: 1 }, 1.05)                       // II   unfold
      .to(S, { spin: 0.35 + Math.PI * 2, polar: 1.18, duration: 1.5, ease: 'power1.inOut' }, 2.15) // III 360°
      .to(S, { spin: Math.PI * 2, focus: 1, duration: 0.9 }, 3.7)              // IV   macro
      .to(S, { focus: 0, duration: 0.7 }, 4.75)
      .to(S, { explode: 1, polar: 1.12, az: 0.45, duration: 1.0 }, 5.5)       // V    exploded
      .to(S, { labels: 1, duration: 0.35, ease: 'power1.out' }, 6.3)
      .to(S, { labels: 0, duration: 0.3, ease: 'power1.in' }, 7.15)
      .to(S, { explode: 0, polar: 1.25, az: 0.62, duration: 0.9 }, 7.3)       // VI   reassemble
      .to(S, { finish: endFinish, duration: 1.0, ease: 'power1.inOut' }, 8.0); //      and change finish
    const windows = [[0.05, 0.95], [1.1, 2.05], [2.3, 3.6], [3.85, 5.0], [5.7, 7.2], [7.5, null]];
    caps.forEach((c, i) => {
      const [a, b] = windows[i] || [i, null];
      tl.fromTo(c, { autoAlpha: 0, y: 46 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'power3.out' }, a);
      if (b != null) tl.to(c, { autoAlpha: 0, y: -46, duration: 0.25, ease: 'power2.in' }, b);
    });
    tl.to({}, { duration: 0.25 }, 9.0);
    if (import.meta.env.DEV) window.__seqState = { S, tl, get rig() { return rig; } };
    ScrollTrigger.create({
      trigger: pin, start: 'top top', end: '+=620%', pin: true, scrub: 0.9, animation: tl,
      onUpdate: (self) => { bar.style.transform = `scaleX(${self.progress})`; },
    });
  });
}
