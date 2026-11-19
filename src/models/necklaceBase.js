/**
 * Shared necklace frame: a loop around the neck that falls to a point at the front,
 * split into a right and left half with a lobster clasp + extender at the back.
 */
import * as THREE from 'three';
import { neckPoint, curveFrom } from './kit/chain.js';
import { jumpRing, lobsterClasp, extender } from './kit/parts.js';

export const NECK_DEFAULTS = { r: 6.2, drop: 10.5, sharp: 2.4, depth: 1 };

export function necklaceFrame({ neck = NECK_DEFAULTS, frontHalf = 0.05, gR = 0.12, gL = 0.08 } = {}) {
  const pt = (th, o = {}) => neckPoint(th, { ...neck, ...o });
  const halves = [
    { a: frontHalf, b: Math.PI - gR },
    { a: Math.PI + gL, b: Math.PI * 2 - frontHalf },
  ];
  const curveFor = (h, fn = () => ({})) => curveFrom((t) => pt(h.a + (h.b - h.a) * t, fn(t)), 200);
  // links lie on the body: radial around the neck, facing forward on the chest
  const up = (p) => {
    const w = THREE.MathUtils.clamp(-p.y / neck.drop, 0, 1);
    return new THREE.Vector3(p.x, 0, p.z).normalize().lerp(new THREE.Vector3(0, 0.25, 1).normalize(), w).normalize();
  };
  return { pt, halves, curveFor, up, neck, gR, gL };
}

/** Clasp, two jump rings and a dangling extender with a tag ('oval' or 'rect'), at the back of the loop. */
export function addBackClasp(root, frame, material, { tag = 'oval' } = {}) {
  const { pt, gR, gL } = frame;
  const right = pt(Math.PI - gR), left = pt(Math.PI + gL);
  const ringA = jumpRing(0.15, 0.04, material);
  ringA.position.copy(right);
  ringA.rotation.y = Math.PI / 2;
  root.add(ringA);
  const clasp = lobsterClasp({ length: 1.15, material });
  clasp.position.copy(right).add(new THREE.Vector3(-0.64, 0, 0));
  root.add(clasp);
  const ringB = jumpRing(0.17, 0.045, material);
  ringB.position.copy(left);
  root.add(ringB);
  root.add(extender({ start: left.clone().add(new THREE.Vector3(0, -0.12, 0)), length: 3.0, swing: new THREE.Vector3(-0.4, 0, -0.5), material, tag }));
  return { back: right.clone().lerp(left, 0.5) };
}
