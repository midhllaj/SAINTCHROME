/**
 * THORN RELIC — bracelet.
 * A chunky diamond-cut cable/rolo strand carrying five polished cone spikes,
 * a fine curb strand beside it, a lobster clasp, an extender chain and an oval tag.
 */
import * as THREE from 'three';
import { chrome } from './kit/materials.js';
import { linkGeometry, chainAlong, curveFrom, wristPoint, radialUp } from './kit/chain.js';
import { jumpRing, lobsterClasp, extender, spike } from './kit/parts.js';

export const PARAMS = {
  loop: { rx: 3.25, rz: 2.75 },
  strandSeparation: 0.42,
  thick: { link: { length: 0.8, width: 0.62, wire: 0.105, squash: 0.72, cut: 0.38, twist: 0 }, pitch: 0.8 - 0.21 },
  thin: { link: { length: 0.36, width: 0.26, wire: 0.045, squash: 0.6, cut: 0.4, twist: 1.0 }, pitch: 0.2 },
  spikes: {
    count: 5,
    length: 2.0,
    radius: 0.3,
    // angles around the wrist (radians, 0 = front); spread across the front, as in the photos
    angles: [-1.15, -0.6, -0.05, 0.5, 1.05],
    droop: 0.55, // how far they tilt downward (radians)
  },
};

export function build(P = PARAMS) {
  const root = new THREE.Group();
  root.name = 'thornRelic';
  const metal = chrome(0.06);
  const { rx, rz } = P.loop;
  const gR = 0.34, gL = 0.22;
  const a = -Math.PI + gL, b = Math.PI - gR; // one continuous strand from clasp → front → clasp

  const strand = (side, inflate = 0) =>
    curveFrom((t) => wristPoint(a + (b - a) * t, { rx, rz, inflate, y: side * P.strandSeparation * Math.sin(Math.PI * t) }), 200);

  const thickCurve = strand(1);
  root.add(chainAlong(thickCurve, { geometry: linkGeometry(P.thick.link), material: metal, pitch: P.thick.pitch, alternate: Math.PI / 2, up: radialUp, name: 'cableStrand' }));
  root.add(chainAlong(strand(-1, -0.05), { geometry: linkGeometry(P.thin.link), material: metal, pitch: P.thin.pitch, alternate: 0, up: radialUp, name: 'curbStrand' }));

  /* ---- spikes ---- */
  const S = P.spikes;
  const spikeTips = [];
  for (let i = 0; i < S.count; i++) {
    const th = S.angles[i] ?? (i / S.count) * 2 - 1;
    const t = (th - a) / (b - a);
    const base = thickCurve.getPointAt(Math.min(1, Math.max(0, t)));
    const radial = new THREE.Vector3(base.x, 0, base.z).normalize();
    const dir = radial.clone().multiplyScalar(Math.cos(S.droop)).add(new THREE.Vector3(0, -Math.sin(S.droop), 0)).normalize();
    const s = spike({ length: S.length, radius: S.radius, material: chrome(0.04) });
    s.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    s.position.copy(base).addScaledVector(dir, 0.3).add(new THREE.Vector3(0, -0.05, 0));
    root.add(s);
    // jump ring linking spike bail to the chain
    const ring = jumpRing(0.13, 0.035, metal);
    ring.position.copy(base).addScaledVector(dir, 0.12);
    ring.lookAt(base.clone().add(new THREE.Vector3(0, 1, 0)));
    root.add(ring);
    spikeTips.push(s.position.clone().addScaledVector(dir, S.length * 0.75));
  }

  /* ---- clasp + extender + tag ---- */
  const back = wristPoint(Math.PI, { rx, rz });
  const clasp = lobsterClasp({ length: 1.15, material: metal });
  clasp.position.set(rx * Math.sin(gR) - 0.66, 0, back.z - 0.02);
  root.add(clasp);
  const ringA = jumpRing(0.15, 0.04, metal);
  ringA.position.set(rx * Math.sin(gR) - 0.02, 0, back.z + 0.02);
  ringA.rotation.y = Math.PI / 2;
  root.add(ringA);
  const ringBPos = new THREE.Vector3(-rx * Math.sin(gL) + 0.05, 0, back.z + 0.03);
  const ringB = jumpRing(0.17, 0.045, metal);
  ringB.position.copy(ringBPos);
  root.add(ringB);
  root.add(extender({ start: ringBPos.clone().add(new THREE.Vector3(0, -0.12, 0)), length: 2.6, swing: new THREE.Vector3(-0.5, 0, -0.6), material: metal }));

  const hotspots = [
    { id: 'spike', label: 'The Thorns', position: spikeTips[2].toArray(), normal: [0, -0.3, 1] },
    { id: 'chain', label: 'Cable Strand', position: wristPoint(1.6, { rx, rz, y: 0.4, inflate: 0.2 }).toArray(), normal: [1, 0, 0] },
    { id: 'fine', label: 'Curb Strand', position: wristPoint(-1.8, { rx, rz, y: -0.4, inflate: 0.15 }).toArray(), normal: [-1, 0, 0] },
    { id: 'clasp', label: 'Lobster Clasp', position: [0.1, 0.1, back.z - 0.3], normal: [0, 0, -1] },
  ];
  return { object: root, hotspots };
}
