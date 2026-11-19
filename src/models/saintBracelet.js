/**
 * Shared design of the "Saint" bracelets (Blood Saint, Obsidian Saint, Verdant Saint):
 * two strands meeting at a step-cut crystal set in a chrome tray (pave on the back, molten
 * points on its edges) wrapped in molten liquid-silver bands, a small 4-point star charm
 * (pave back) hanging under it, a lobster clasp, an extender chain and an oval tag.
 *
 * Each relic file (bloodSaint.js, obsidianSaint.js, verdantSaint.js) only sets parameters.
 */
import * as THREE from 'three';
import { chrome, blackSteel } from './kit/materials.js';
import { linkGeometry, chainAlong, curveFrom, wristPoint, radialUp, helixAround } from './kit/chain.js';
import { jumpRing, lobsterClasp, extender, saintCentrepiece } from './kit/parts.js';

export const SAINT_DEFAULTS = {
  loop: { rx: 3.25, rz: 2.75 },          // wrist loop half-axes (cm)
  strandSeparation: 0.42,                 // how far the two strands drift apart (cm)
  thick: {                                 // main strand
    style: 'cuban',                        // 'cuban' (flat diamond-cut curb) | 'cable' (oval links)
    link: { length: 0.9, width: 0.68, wire: 0.15, squash: 0.48, cut: 0.5, twist: 1.1 },
    pitch: 0.39,
  },
  thin: {                                  // second strand
    style: 'curb',                         // 'curb' (fine silver curb) | 'woven' (black chain woven through the main strand)
    link: { length: 0.34, width: 0.25, wire: 0.042, squash: 0.6, cut: 0.4, twist: 1.0 },
    pitch: 0.19,
  },
  crystal: { color: '#B3001B', type: 'crystal', length: 1.9, height: 0.8, depth: 0.56 },
  vines: 2,
  star: { arms: [0.42, 0.52, 1.35, 0.52], stone: '#B3001B' },
};

export function createSaintBracelet(params = SAINT_DEFAULTS) {
  const P = { ...SAINT_DEFAULTS, ...params };
  const root = new THREE.Group();
  const metal = chrome(0.06);
  const { rx, rz } = P.loop;

  /* ---- crystal connector at the front ---- */
  const C = P.crystal;
  const half = C.length / 2 + 0.22;
  const cAng = Math.asin(Math.min(0.95, half / rx));
  const zc = rz * Math.cos(cAng);
  // crystal setting, molten bands and the star charm (shared with the Saint necklaces)
  const { group: crystalGroup, charm, charmScale: CS } = saintCentrepiece({ crystal: C, star: P.star, metal, vines: P.vines });
  crystalGroup.position.set(0, 0, zc + 0.05);
  root.add(crystalGroup);
  const charmAt = crystalGroup.position.clone().add(charm.position);

  /* ---- strands: right half (front → clasp) and left half (clasp → front) ---- */
  const gR = 0.34, gL = 0.22; // clasp gaps at the back
  const sep = P.strandSeparation;
  const halves = [
    { a: cAng + 0.05, b: Math.PI - gR },
    { a: Math.PI + gL, b: Math.PI * 2 - cAng - 0.05 },
  ];
  const strandCurve = (h, side, inflate = 0) =>
    curveFrom((t) => {
      const th = h.a + (h.b - h.a) * t;
      return wristPoint(th, { rx, rz, inflate, y: side * sep * Math.sin(Math.PI * t) });
    }, 120);

  const thickGeo = linkGeometry(P.thick.link);
  const thinGeo = linkGeometry(P.thin.link);
  const thickCurves = halves.map((h) => strandCurve(h, 1));
  const thickAlt = P.thick.style === 'cable' ? Math.PI / 2 : 0;
  thickCurves.forEach((c, i) =>
    root.add(chainAlong(c, { geometry: thickGeo, material: metal, pitch: P.thick.pitch, alternate: thickAlt, up: radialUp, name: `mainStrand${i}` })));

  if (P.thin.style === 'woven') {
    // fine black chain spiralling through the oval cable links
    thickCurves.forEach((c, i) => {
      const len = c.getLength();
      const helix = helixAround(c, { radius: 0.13, turns: len / 1.0, phase: i });
      root.add(chainAlong(helix, { geometry: thinGeo, material: blackSteel(), pitch: P.thin.pitch, up: radialUp, name: `wovenStrand${i}` }));
    });
  } else {
    halves.forEach((h, i) => {
      const c = strandCurve(h, -1, -0.05);
      root.add(chainAlong(c, { geometry: thinGeo, material: metal, pitch: P.thin.pitch, alternate: 0, up: radialUp, name: `fineStrand${i}` }));
    });
  }

  /* ---- clasp + extender + tag at the back ---- */
  const back = wristPoint(Math.PI, { rx, rz });
  const clasp = lobsterClasp({ length: 1.15, material: metal });
  clasp.position.set(rx * Math.sin(gR) - 0.66, 0, back.z - 0.02);
  root.add(clasp);
  const ringA = jumpRing(0.15, 0.04, metal);
  ringA.position.set(rx * Math.sin(gR) - 0.02, 0, back.z + 0.02);
  ringA.rotation.y = Math.PI / 2;
  root.add(ringA);
  const ringB = jumpRing(0.17, 0.045, metal);
  const ringBPos = new THREE.Vector3(-rx * Math.sin(gL) + 0.05, 0, back.z + 0.03);
  ringB.position.copy(ringBPos);
  root.add(ringB);
  root.add(extender({ start: ringBPos.clone().add(new THREE.Vector3(0, -0.12, 0)), length: 2.6, swing: new THREE.Vector3(-0.5, 0, -0.6), material: metal }));

  /* ---- hotspots (local coordinates) ---- */
  const hotspots = [
    { id: 'crystal', label: 'The Crystal', position: [0, C.height / 2 + 0.05, zc + 0.35], normal: [0, 0.3, 1] },
    { id: 'vines', label: 'Liquid Vines', position: [-0.58, -0.1, zc + 0.38], normal: [0, 0, 1] },
    { id: 'pave', label: 'The Pavé Back', position: [0.3, 0, zc + 0.05 - C.depth / 2 - 0.06], normal: [0, 0, -1] },
    { id: 'star', label: 'Star of the Saint', position: charmAt.clone().add(new THREE.Vector3(0, -0.45 * CS / 0.66, 0.1)).toArray(), normal: [0.3, 0, 1] },
    { id: 'chain', label: P.thick.style === 'cable' ? 'Cable & Shadow' : 'Twin Strands', position: wristPoint(1.35, { rx, rz, y: sep * 0.9, inflate: 0.2 }).toArray(), normal: [1, 0, 0.3] },
    { id: 'clasp', label: 'Lobster Clasp', position: [0.1, 0.1, back.z - 0.3], normal: [0, 0, -1] },
  ];

  root.name = 'saintBracelet';
  return { object: root, hotspots };
}
