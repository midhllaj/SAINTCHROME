/**
 * AZURE SAINT — necklace.
 * Oval cable chain with a fine black chain woven through it and, at the front, the Saint
 * centrepiece: a cobalt step-cut crystal in a chrome setting (pave back) wrapped in molten
 * silver, with a small star (blue stone, pave back) hanging under it.
 * Crimson / Onyx / Jade Saint reuse this build with a different crystal and star stone.
 */
import * as THREE from 'three';
import { chrome, blackSteel } from './kit/materials.js';
import { linkGeometry, chainAlong, helixAround } from './kit/chain.js';
import { saintCentrepiece } from './kit/parts.js';
import { necklaceFrame, addBackClasp, NECK_DEFAULTS } from './necklaceBase.js';

export const PARAMS = {
  neck: { ...NECK_DEFAULTS, drop: 9.5, sharp: 3.2 },
  cable: { length: 1.0, width: 0.54, wire: 0.08, squash: 0.72, cut: 0.32, twist: 0 },
  woven: { length: 0.22, width: 0.16, wire: 0.03, squash: 1, cut: 0, twist: 0 },
  crystal: { color: '#0b2a9e', type: 'crystal', length: 1.9, height: 0.8, depth: 0.56 }, // type 'obsidian' = opaque black
  star: { arms: [0.42, 0.52, 1.35, 0.52], stone: '#1f4fff' },
};

export function build(P = PARAMS, name = 'azureSaint') {
  const root = new THREE.Group();
  root.name = name;
  const metal = chrome(0.06);
  const C = P.crystal;
  const frontHalf = (C.length / 2 + 0.3) / (P.neck.r * 0.88);
  const frame = necklaceFrame({ neck: P.neck, frontHalf });
  const halves = frame.halves.map((h) => frame.curveFor(h));
  const cableGeo = linkGeometry(P.cable);
  const wovenGeo = linkGeometry(P.woven);
  halves.forEach((c, i) => {
    root.add(chainAlong(c, { geometry: cableGeo, material: metal, pitch: P.cable.length - 0.19, up: frame.up, name: `cable${i}` }));
    const helix = helixAround(c, { radius: 0.12, turns: c.getLength() / 1.0, phase: i * 2 });
    root.add(chainAlong(helix, { geometry: wovenGeo, material: blackSteel(), pitch: 0.13, up: frame.up, name: `woven${i}` }));
  });

  /* ---- crystal at the front, between the two chain ends ---- */
  const a = frame.pt(frontHalf), b = frame.pt(-frontHalf);
  // the same centrepiece as the Saint bracelets: step-cut crystal in a chrome setting with a
  // pave back, molten-silver bands, and the small star (pave back) hanging under it
  const { group: g, charm } = saintCentrepiece({ crystal: C, star: P.star, metal, distance: 0.22 });
  g.position.copy(a.clone().lerp(b, 0.5)).add(new THREE.Vector3(0, 0, 0.1));
  root.add(g);
  const charmAt = g.position.clone().add(charm.position);

  const { back } = addBackClasp(root, frame, metal);
  const hotspots = [
    { id: 'crystal', label: 'Crystal', position: g.position.clone().add(new THREE.Vector3(0, C.height / 2, 0.35)).toArray(), normal: [0, 0.2, 1] },
    { id: 'pave', label: 'The Pavé Back', position: g.position.clone().add(new THREE.Vector3(0.3, 0, -C.depth / 2 - 0.06)).toArray(), normal: [0, 0, -1] },
    { id: 'star', label: 'Star of the Saint', position: charmAt.clone().add(new THREE.Vector3(0, -0.45, 0.1)).toArray(), normal: [0, 0, 1] },
    { id: 'chain', label: 'Woven Shadow', position: halves[0].getPointAt(0.18).add(new THREE.Vector3(0, 0, 0.2)).toArray(), normal: [0.4, 0, 1] },
    { id: 'clasp', label: 'Lobster Clasp', position: back.clone().add(new THREE.Vector3(0, 0.1, -0.3)).toArray(), normal: [0, 0, -1] },
  ];
  return { object: root, hotspots };
}
