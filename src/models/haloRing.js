/**
 * The hero HALO: a giant chrome ring with 8 star sparkles (as on the logo)
 * and two thin orbiting ellipses. Not a product — the brand's centrepiece.
 */
import * as THREE from 'three';
import { chrome } from './kit/materials.js';
import { starGeometry } from './kit/parts.js';

export const PARAMS = {
  radius: 7.5,
  tube: 0.16,
  stars: 8,
  starSize: 2.1,
  orbits: [
    { rx: 11.5, ry: 3.2, tube: 0.035, tilt: -0.32 },
    { rx: 13.5, ry: 4.6, tube: 0.022, tilt: 0.2 },
  ],
};

export function build(P = PARAMS) {
  const root = new THREE.Group();
  root.name = 'halo';
  const ring = new THREE.Mesh(new THREE.TorusGeometry(P.radius, P.tube, 24, 240), chrome(0.04));
  ring.name = 'haloRing';
  root.add(ring);
  // inner hairline ring for a double-struck feel
  const inner = new THREE.Mesh(new THREE.TorusGeometry(P.radius * 0.965, P.tube * 0.25, 10, 240), chrome(0.1));
  root.add(inner);

  // stars carry a faint self-glow so they twinkle even against black
  const starMat = chrome(0.03).clone();
  starMat.emissive = new THREE.Color('#dfefff');
  starMat.emissiveIntensity = 0.6;
  const stars = new THREE.Group();
  stars.name = 'haloStars';
  // 8-point sparkle: long cardinal arms, short diagonals — like the logo halo
  const s = P.starSize;
  const geo = starGeometry({ arms: [s, s * 0.32, s, s * 0.32, s, s * 0.32, s, s * 0.32], valley: 0.2, height: 0.5, rim: 0.06, concave: 0.55, seg: 5 });
  for (let i = 0; i < P.stars; i++) {
    const a = (i / P.stars) * Math.PI * 2 + Math.PI / 2;
    const m = new THREE.Mesh(geo, starMat);
    m.position.set(Math.cos(a) * P.radius, Math.sin(a) * P.radius, 0);
    m.scale.setScalar(i % 2 === 0 ? 1 : 0.72);
    m.userData.phase = i * 0.7;
    stars.add(m);
  }
  root.add(stars);

  const orbits = new THREE.Group();
  orbits.name = 'orbits';
  for (const o of P.orbits) {
    const curve = new THREE.EllipseCurve(0, 0, o.rx, o.ry, 0, Math.PI * 2);
    const pts = curve.getPoints(260).map((p) => new THREE.Vector3(p.x, p.y, 0));
    const tube = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 260, o.tube, 6, true);
    const m = new THREE.Mesh(tube, chrome(0.05));
    m.rotation.z = o.tilt;
    m.rotation.x = 1.2;
    orbits.add(m);
  }
  root.add(orbits);
  return { object: root, hotspots: [], parts: { ring, stars, orbits } };
}
