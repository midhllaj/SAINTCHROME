/**
 * THE VISITOR — necklace, modelled from the real piece.
 * Wide flat curb chain (links lie face-up, tilted alternately so they interlock). The alien head
 * (smooth dome, almond eyes sunk in green enamel) sits inside the right side of the chain, along
 * its curve: links run into a loop on its crown and out of a loop under its chin, then a few
 * more links run down to the bottom, where both sides meet at a jump ring and a long-armed
 * four-point star hangs. Lobster clasp, extender and tag at the back.
 */
import * as THREE from 'three';
import { chrome } from './kit/materials.js';
import { linkGeometry, chainAlong } from './kit/chain.js';
import { jumpRing, starCharm, alienHead } from './kit/parts.js';
import { necklaceFrame, addBackClasp, NECK_DEFAULTS } from './necklaceBase.js';

export const PARAMS = {
  neck: { ...NECK_DEFAULTS, drop: 10.5, sharp: 2.6 },
  curb: { length: 0.68, width: 0.46, wire: 0.085, squash: 0.72, cut: 0.38, twist: 0.5 },
  pitch: 0.34,
  zigzag: 0.1,          // alternate tilt of the curb links
  alien: { size: 1.3, eye: '#0f9a48', links: 4.5 }, // links: chain from the chin to the bottom ring
  star: { arms: [0.42, 0.55, 1.2, 0.55], scale: 0.95 }, // top, right, bottom, left
  junction: { R: 0.2, wire: 0.05 },
};

export function build(P = PARAMS) {
  const root = new THREE.Group();
  root.name = 'theVisitor';
  const metal = chrome(0.06);
  const frame = necklaceFrame({ neck: P.neck, frontHalf: 0.035 });
  // right half: front (u = 0) → back; left half: back → front (u = 1)
  const [right, left] = frame.halves.map((h) => frame.curveFor(h));
  const geo = linkGeometry(P.curb);
  const lay = (curve, s0, s1, name) => {
    const L = curve.getLength();
    const count = Math.max(1, Math.round((s1 - s0) / P.pitch));
    root.add(chainAlong(curve, { geometry: geo, material: chrome(0.13), count, u0: s0 / L, u1: s1 / L, alternate: 0, zigzag: P.zigzag, up: frame.up, name }));
  };

  /* ---- alien head, inline on the right side ----
     Both sides keep the same natural curve: the head takes the place of a few links and lies
     along the chain line (chin toward the bottom ring, crown toward the back). */
  const alien = alienHead({ size: P.alien.size, eye: P.alien.eye, inline: true, material: chrome(0.15) });
  const { top, chin } = alien.userData;
  const span = top.y - chin.y;
  const Lr = right.getLength();
  const sChin = P.junction.R + P.alien.links * P.pitch;  // where the chin loop sits on the chain
  const pChin = right.getPointAt(sChin / Lr);
  // walk up the chain until the straight distance matches the head's length
  let sTop = sChin + span;
  for (let i = 0; i < 8; i++) sTop += span - right.getPointAt(Math.min(1, sTop / Lr)).distanceTo(pChin);
  const pTop = right.getPointAt(sTop / Lr);
  const Y = pTop.clone().sub(pChin).normalize();
  const Z = frame.up(pChin.clone().lerp(pTop, 0.5)).clone();
  Z.addScaledVector(Y, -Z.dot(Y)).normalize();
  const Xv = new THREE.Vector3().crossVectors(Y, Z);
  alien.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(Xv, Y, Z));
  alien.position.copy(pChin).addScaledVector(Y, -chin.y).addScaledVector(Z, 0.1); // sits just on top of the chain plane
  root.add(alien);

  lay(right, P.junction.R * 0.6, sChin, 'curbFront');
  lay(right, sTop, Lr, 'curbR');
  lay(left, 0, left.getLength() - P.junction.R * 0.6, 'curbL');

  /* ---- bottom: both sides meet at a jump ring, the star hangs from it ---- */
  const front = frame.pt(0);
  const ring = jumpRing(P.junction.R, P.junction.wire, metal);
  ring.position.copy(front);
  root.add(ring);
  const hang = front.clone().add(new THREE.Vector3(0, -P.junction.R - 0.06, 0.03));
  const r2 = jumpRing(0.11, 0.032, metal);
  r2.position.copy(hang);
  r2.rotation.y = Math.PI / 2;
  root.add(r2);
  const charm = starCharm({ arms: P.star.arms, stone: null, material: metal, bailArm: 0 });
  const S = P.star.scale;
  charm.scale.setScalar(S);
  charm.position.copy(hang).add(new THREE.Vector3(0, -0.1, 0.02)).sub(charm.userData.bailOffset.clone().multiplyScalar(S));
  charm.rotation.set(-0.08, 0.12, 0.04);
  root.add(charm);

  const { back } = addBackClasp(root, frame, metal, { tag: 'rect' });
  const hotspots = [
    { id: 'alien', label: 'The Visitor', position: alien.position.clone().addScaledVector(Y, P.alien.size * 0.25).addScaledVector(Z, P.alien.size * 0.3).toArray(), normal: Z.toArray() },
    { id: 'eyes', label: 'Emerald Eyes', position: alien.userData.eyes[1].clone().applyQuaternion(alien.quaternion).add(alien.position).addScaledVector(Z, 0.08).toArray(), normal: Z.toArray() },
    { id: 'star', label: 'Fallen Star', position: charm.position.clone().add(new THREE.Vector3(0, -0.45, 0.1)).toArray(), normal: [0, 0, 1] },
    { id: 'chain', label: 'Curb Chain', position: left.getPointAt(0.55).add(new THREE.Vector3(0, 0, 0.2)).toArray(), normal: [-0.3, 0, 1] },
    { id: 'clasp', label: 'Lobster Clasp', position: back.clone().add(new THREE.Vector3(0, 0.1, -0.3)).toArray(), normal: [0, 0, -1] },
  ];
  return { object: root, hotspots };
}
