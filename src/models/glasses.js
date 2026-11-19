/**
 * GLASSES — the eyewear frame, modelled in millimetres from the reference video
 * (_reference/glasses, frame marking 48□23-142) and shown at cm scale like every other relic.
 *
 *  - front: one piece of glossy acetate (outline + two lens holes, extruded and bevelled so every
 *    edge is rounded), bent round a vertical curve for the wrap, tilted back for pantoscopic tilt.
 *    Wayfarer brow that lifts at the outer corners, high arched bridge, moulded nose pads.
 *  - lenses: thin glass following the lens holes, sitting in the rim groove, curved inward
 *    (concave from the front).
 *  - two chrome rivet domes stacked on each outer top corner.
 *  - temples: deep at the hinge, a slight step in the lower edge, tapering back, then bent down
 *    into the ear tip and curving gently inward. Each hangs on its own hinge pivot, so it folds.
 *  - chrome barrel hinges (front knuckles + temple knuckle), a steel core wire inside each temple
 *    (seen through transparent acetate) and the silver Ray-Ban script on the outside of each
 *    temple, just behind the hinge (kept at the owner's request: original Ray-Ban frames).
 *
 * Parts carry userData.explode (offset in their parent's mm space) for the exploded view, and
 * named anchors (label-*, focus-hinge) for the scroll story. setFold() folds the temples and
 * finishControl() animates the acetate between Obsidian and Emerald on one viewer's copy.
 */
import * as THREE from 'three';
import { chrome, steel, roughnessNoise } from './kit/materials.js';

export const GLASSES = {
  lens: { width: 48, top: 19.5, bottom: -19.5, flare: 1 }, // mm, measured off the front reference frame (frame_05)
  bridge: 23,              // gap between the lenses
  endpiece: 11.5,           // acetate beyond the lens at the outer corners
  brow: 4,                 // brow above the lens middle (it dips to the bridge and lifts to the corners)
  rim: 3.8,                // lower rim
  depth: 4.0,              // acetate before the bevel: 6.6 mm with it
  bevel: 1.3,              // big round acetate edges
  wrapRadius: 300,         // the front bends round a vertical curve of this radius
  tilt: 8,                 // pantoscopic tilt, degrees
  lens3d: { radius: 130, center: -2.2, thickness: 1.5, grow: 0.7 }, // concave: centre sits back, edges in the groove
  temple: { length: 142, straight: 105, thickness: 3.6, bevel: 0.7, hinge: 11, step: 11.4, end: 5.2, bendRadius: 40, inward: 5, splay: 3 },
  hingeY: 17.5,            // hinge height on the front (between the rivets)
  rivet: { radius: 1.0, x: 6.2, y: [20.2, 13.9] }, // x: in from the outer edge of the lens; y: heights
  nosePad: { r: [1.5, 4.6, 2.6], y: -4.5 },
  logo: { height: 8.6, at: 24, y: 0.2 },            // Ray-Ban script plate on the outer temple; at: mm behind the hinge
};

/* ---------------- materials ---------------- */

const mats = new Map();
const memo = (k, make) => mats.get(k) ?? mats.set(k, make()).get(k);

/** Finishes the acetate animates between (see finishControl). */
export const FINISHES = {
  obsidian: { color: '#050505', roughness: 0.15, transmission: 0, attenuationColor: '#000000', attenuationDistance: 1, emissive: '#000000', envMapIntensity: 2.6 },
  emerald: { color: '#5fe39a', roughness: 0.06, transmission: 0.9, attenuationColor: '#0F8A3C', attenuationDistance: 2.4, emissive: '#05361c', envMapIntensity: 2.2 },
};

/** Glossy acetate in a finish: clearcoat over a faintly uneven polish, so reflections aren't CG-perfect. */
export const frameAcetate = (finish = 'obsidian') => memo(`acetate:${finish}`, () => {
  const f = FINISHES[finish];
  return new THREE.MeshPhysicalMaterial({
    name: 'FrameAcetate', color: new THREE.Color(f.color), metalness: 0, roughness: f.roughness, roughnessMap: roughnessNoise(),
    clearcoat: 1, clearcoatRoughness: 0.03, ior: 1.5, specularIntensity: 1, envMapIntensity: f.envMapIntensity,
    transmission: f.transmission, thickness: 4, attenuationColor: new THREE.Color(f.attenuationColor), attenuationDistance: f.attenuationDistance,
    emissive: new THREE.Color(f.emissive),
  });
});

let logoTex, logoMat;
/** The Ray-Ban script (public/models/rayban-logo.png, white on transparent) as polished silver. */
const logoMaterial = () => logoMat ??= new THREE.MeshPhysicalMaterial({
  name: 'RayBanLogo', color: 0xeef1f5, metalness: 1, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.05, emissive: 0x1e2024,
  envMapIntensity: 2.2, alphaTest: 0.4, polygonOffset: true, polygonOffsetFactor: -2,
  alphaMap: (logoTex ??= new THREE.TextureLoader().load('/models/rayban-logo.png', (t) => { t.anisotropy = 8; })),
});
const LOGO_ASPECT = 1024 / 320;

/**
 * Lens glass. Clear lenses are additive: no body colour, only the studio reflections, the rim
 * highlights and an anti-reflective sheen laid over whatever is behind, so the floor glow and
 * contact shadow read through them like the clear lenses on the reference. (Transmission can't
 * do that: three.js leaves transparent things like the floor glow out of the transmission
 * buffer, so transmissive lenses went pitch black on the dark stage, and cost a full extra pass.)
 * A tinted lens is see-through coloured glass.
 */
export const glassLens = (tint = 'clear') => memo(`lens:${tint}`, () => {
  const common = {
    name: 'GlassesLens', metalness: 0, roughness: 0.03, ior: 1.5, specularIntensity: 1,
    transparent: true, depthWrite: false,
    iridescence: 0.3, iridescenceIOR: 1.3, iridescenceThicknessRange: [240, 420], // AR coating
  };
  if (tint === 'sulfur') {
    return new THREE.MeshPhysicalMaterial({
      ...common, color: new THREE.Color('#ffc21a'), emissive: new THREE.Color('#4a3000'), opacity: 0.5, envMapIntensity: 2.2,
    });
  }
  return new THREE.MeshPhysicalMaterial({
    ...common, color: new THREE.Color('#000000'), blending: THREE.AdditiveBlending, envMapIntensity: 3,
  });
});

/* ---------------- shapes ---------------- */

/** Rounded polygon: each point is [x, y, radius]. */
function roundedPath(points, path = new THREE.Shape()) {
  const n = points.length;
  const v = points.map(([x, y]) => new THREE.Vector2(x, y));
  for (let i = 0; i < n; i++) {
    const p = v[(i - 1 + n) % n], c = v[i], nx = v[(i + 1) % n];
    const r = Math.min(points[i][2] || 0, p.distanceTo(c) / 2, nx.distanceTo(c) / 2);
    const a = c.clone().add(p.clone().sub(c).normalize().multiplyScalar(r));
    const b = c.clone().add(nx.clone().sub(c).normalize().multiplyScalar(r));
    if (i === 0) path.moveTo(a.x, a.y); else path.lineTo(a.x, a.y);
    path.quadraticCurveTo(c.x, c.y, b.x, b.y);
  }
  path.closePath();
  return path;
}

/**
 * Lens opening, right side (x > 0), as measured on the reference: near-straight top, the inner
 * edge drops straight down by the nose then slants out to a soft lower corner, the outer edge
 * stays upright and rolls into a big round lower corner.
 */
function lensPoints(P, grow = 0) {
  const L = P.lens, bI = P.bridge / 2, O = bI + L.width, g = grow;
  return [
    [bI - 0.2 - g, L.top - 0.3 + g, 10],
    [O + 0.3 + g, L.top + L.flare + g, 8],
    [O + 0.7 + g, L.bottom - g, 24],
    [bI + 13.8 - g, L.bottom + 0.1 - g, 13],
    [bI + 0.1 - g, 2.5, 12],
  ];
}

/**
 * Front outline, right half from the top of the bridge round to the top of the nose arch.
 * Measured on the reference: the brow dips to the bridge and lifts over the lens to the corner;
 * the endpiece block carries the hinge and rivets, then the outer rim follows the lens (~5 mm)
 * into a round lower corner; the bridge rims slant out from a narrow, high nose arch.
 */
function frontHalf(P) {
  const L = P.lens, bI = P.bridge / 2, O = bI + L.width, E = P.endpiece;
  return [
    [0, L.top - 1.3, 9],                          // the brow dips over the bridge
    [bI + 3, L.top + 1.9, 14],
    [bI + L.width * 0.55, L.top + P.brow, 30],    // highest over the lens
    [O + E - 0.6, L.top + P.brow + 0.2, 3],       // squared outer corner
    [O + E + 0.4, L.top - 1, 3],
    [O + E - 0.6, 9.6, 3],                        // foot of the endpiece block
    [O + 7.8, 7.2, 6],
    [O - 3.6, L.bottom - P.rim, 18],              // outer rim rolls into the bottom
    [bI + 8, L.bottom - P.rim, 8],
    [3.6, 9.3, 3],                                // bridge rims slant up into the arch
    [0, 9.9, 3],
  ];
}

const mirror = (pts) => pts.map(([x, y, r]) => [-x, y, r]);

/* ---------------- geometry helpers ---------------- */

/**
 * Smooth shading for extrusions: normals averaged across the bevel and walls (faces within the
 * crease angle), while the flat caps stay exactly flat. Non-indexed in, non-indexed out.
 */
function polish(geo, crease = 50) {
  geo = geo.index ? geo.toNonIndexed() : geo;
  const p = geo.attributes.position;
  const nFaces = p.count / 3;
  const fn = [], ang = [];
  const key = (i) => `${Math.round(p.getX(i) * 1000)},${Math.round(p.getY(i) * 1000)},${Math.round(p.getZ(i) * 1000)}`;
  const at = new Map();
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), e1 = new THREE.Vector3(), e2 = new THREE.Vector3();
  for (let f = 0; f < nFaces; f++) {
    a.fromBufferAttribute(p, 3 * f); b.fromBufferAttribute(p, 3 * f + 1); c.fromBufferAttribute(p, 3 * f + 2);
    const n = e1.subVectors(b, a).clone().cross(e2.subVectors(c, a));
    const len = n.length();
    fn[f] = len > 1e-12 ? n.divideScalar(len) : null;
    // corner angles (weights)
    const angle = (o, x, y) => e1.subVectors(x, o).angleTo(e2.subVectors(y, o));
    ang[f] = [angle(a, b, c), angle(b, c, a), angle(c, a, b)];
    for (let k = 0; k < 3; k++) {
      const id = key(3 * f + k);
      (at.get(id) ?? at.set(id, []).get(id)).push([f, k]);
    }
  }
  const cos = Math.cos(THREE.MathUtils.degToRad(crease));
  const out = new Float32Array(p.count * 3);
  const sum = new THREE.Vector3();
  for (let f = 0; f < nFaces; f++) {
    const n = fn[f];
    for (let k = 0; k < 3; k++) {
      const i = 3 * f + k;
      if (!n) { out.set([0, 0, 1], 3 * i); continue; }
      if (Math.abs(n.z) > 0.9995) { out.set([n.x, n.y, n.z], 3 * i); continue; } // flat cap
      sum.set(0, 0, 0);
      for (const [g, m] of at.get(key(i))) {
        const ng = fn[g];
        if (ng && Math.abs(ng.z) <= 0.9995 && ng.dot(n) > cos) sum.addScaledVector(ng, ang[g][m]);
      }
      if (sum.lengthSq() < 1e-12) sum.copy(n);
      sum.normalize();
      out.set([sum.x, sum.y, sum.z], 3 * i);
    }
  }
  geo.setAttribute('normal', new THREE.BufferAttribute(out, 3));
  return geo;
}

/** Planar UVs (for the polish noise): u, v from two position axes, mm → tiles. */
function planarUV(geo, ax = 'x', ay = 'y', k = 0.025) {
  const p = geo.attributes.position;
  const uv = new Float32Array(p.count * 2);
  const get = { x: (i) => p.getX(i), y: (i) => p.getY(i), z: (i) => p.getZ(i) };
  for (let i = 0; i < p.count; i++) { uv[2 * i] = get[ax](i) * k; uv[2 * i + 1] = get[ay](i) * k; }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return geo;
}

/** The wrap: bend round a vertical axis R mm behind the front (positions and normals). */
function bender(R) {
  const Y = new THREE.Vector3(0, 1, 0);
  const point = (v) => {
    const th = v.x / R, r = R + v.z;
    return v.set(r * Math.sin(th), v.y, r * Math.cos(th) - R);
  };
  const geometry = (g) => {
    const p = g.attributes.position, n = g.attributes.normal;
    const v = new THREE.Vector3(), nn = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const th = v.x / R;
      point(v);
      p.setXYZ(i, v.x, v.y, v.z);
      if (n) { nn.fromBufferAttribute(n, i).applyAxisAngle(Y, th); n.setXYZ(i, nn.x, nn.y, nn.z); }
    }
    g.computeBoundingSphere();
    return g;
  };
  return { point, geometry, angle: (x) => x / R };
}

/**
 * Lens: a ring-triangulated slab (dense, so the curve is smooth), front surface z = zOf(d) where
 * d is the distance from the lens centre; back surface `thick` behind it; and an edge wall.
 */
function lensGeometry(boundary, cx, cy, zOf, thick, rings = 16) {
  // CCW boundary
  let area = 0;
  for (let i = 0; i < boundary.length; i++) { const p = boundary[i], q = boundary[(i + 1) % boundary.length]; area += p.x * q.y - q.x * p.y; }
  if (area < 0) boundary = boundary.slice().reverse();
  const N = boundary.length;
  const pos = [], idx = [];
  const surface = (front) => {
    const base = pos.length / 3;
    const dz = front ? 0 : -thick;
    pos.push(cx, cy, zOf(0) + dz);
    for (let r = 1; r <= rings; r++) {
      const t = r / rings;
      for (const q of boundary) {
        const x = cx + (q.x - cx) * t, y = cy + (q.y - cy) * t;
        pos.push(x, y, zOf(Math.hypot(x - cx, y - cy)) + dz);
      }
    }
    const ring = (r, i) => base + 1 + (r - 1) * N + ((i + N) % N);
    const tri = (a, b, c) => (front ? idx.push(a, b, c) : idx.push(a, c, b));
    for (let i = 0; i < N; i++) tri(base, ring(1, i), ring(1, i + 1));
    for (let r = 1; r < rings; r++) for (let i = 0; i < N; i++) {
      tri(ring(r, i), ring(r + 1, i), ring(r + 1, i + 1));
      tri(ring(r, i), ring(r + 1, i + 1), ring(r, i + 1));
    }
  };
  surface(true);
  surface(false);
  // edge wall (its own vertices, so its normals point outward)
  const base = pos.length / 3;
  for (const q of boundary) {
    const z = zOf(Math.hypot(q.x - cx, q.y - cy));
    pos.push(q.x, q.y, z, q.x, q.y, z - thick);
  }
  for (let i = 0; i < N; i++) {
    const f0 = base + 2 * i, b0 = f0 + 1, f1 = base + 2 * ((i + 1) % N), b1 = f1 + 1;
    idx.push(f0, b0, b1, f0, b1, f1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Temple side profile in (s along the temple, y up), already bent down at the ear. */
function templeOutline(P) {
  const T = P.temple, top = T.hinge / 2;
  const L = T.length, s0 = T.straight, Rb = T.bendRadius;
  const smooth = (t) => t * t * (3 - 2 * t);
  // depth along the temple: deep at the hinge, a slight step ~40 mm back, tapering to the bend, then to the tip
  const depth = (s) => {
    // full depth past the logo, an angled step up in the lower edge, then a long taper
    if (s < 45) return THREE.MathUtils.lerp(T.hinge, T.step, smooth(s / 45));
    if (s < 64) return THREE.MathUtils.lerp(T.step, 8, smooth((s - 45) / 19));
    if (s < s0) return THREE.MathUtils.lerp(8, T.end + 0.6, (s - 64) / (s0 - 64));
    return THREE.MathUtils.lerp(T.end + 0.6, T.end, (s - s0) / (L - s0));
  };
  const topY = (s) => top - 0.9 * smooth(Math.min(1, s / s0)); // top edge: nearly straight
  const ym = topY(s0) - depth(s0) / 2;                            // bend about the centreline at s0
  const C = new THREE.Vector2(s0, ym - Rb);
  const bend = (s, y) => {
    if (s <= s0) return new THREE.Vector2(s, y);
    const phi = (s - s0) / Rb, r = y - C.y;
    return new THREE.Vector2(C.x + r * Math.sin(phi), C.y + r * Math.cos(phi));
  };
  const pts = [];
  const step = 1.5;
  // top edge, hinge → tip
  for (let s = 0.8; s <= L - depth(L) / 2; s += step) pts.push(bend(s, topY(s)));
  // rounded tip
  const sEnd = L - depth(L) / 2, cy = topY(sEnd) - depth(sEnd) / 2, rr = depth(sEnd) / 2;
  for (let k = 0; k <= 12; k++) {
    const a = Math.PI / 2 - (k / 12) * Math.PI;
    pts.push(bend(sEnd + rr * Math.cos(a), cy + rr * Math.sin(a)));
  }
  // lower edge, tip → hinge
  for (let s = sEnd; s >= 0.8; s -= step) pts.push(bend(s, topY(s) - depth(s)));
  // hinge end: small rounded corners
  const yb = topY(0) - depth(0);
  pts.push(new THREE.Vector2(0.15, yb + 0.35), new THREE.Vector2(0, yb + 1), new THREE.Vector2(0, top - 1), new THREE.Vector2(0.15, top - 0.35));
  return { shape: new THREE.Shape(pts), sOf: (x, y) => (x <= s0 ? x : s0 + Rb * Math.atan2(x - C.x, y - C.y)) };
}

/* ---------------- build ---------------- */

export function createGlasses({ finish = 'obsidian', lens = 'clear', params = GLASSES } = {}) {
  const P = { ...GLASSES, ...params };
  const frameMat = frameAcetate(finish);
  const lensMat = glassLens(lens);
  const metal = chrome(0.08);
  // rivet domes: a touch of satin and extra reflection so the tiny domes spread the softboxes
  // across their surface and read silver (mirror chrome only shows the black studio on them)
  const rivetMetal = metal.clone();
  rivetMetal.name = 'RivetChrome';
  rivetMetal.roughness = 0.27;
  rivetMetal.envMapIntensity = 3.4;
  const W = bender(P.wrapRadius);
  const L = P.lens, bI = P.bridge / 2, O = bI + L.width;
  const half = P.depth / 2 + P.bevel;            // front face z (before the wrap)

  const root = new THREE.Group();                // cm
  root.name = 'glasses';
  const mm = new THREE.Group();                  // everything below is in millimetres
  mm.scale.setScalar(0.1);
  root.add(mm);

  /* ---- hinge pivots (temple inner face, on the back of the endpiece) ---- */
  const T = P.temple, Tw = T.thickness + 2 * T.bevel;
  const outerAtHinge = O + P.endpiece - 0.9;      // the outline's outer edge at hinge height
  const pivotR = W.point(new THREE.Vector3(outerAtHinge - Tw, P.hingeY, -half));
  pivotR.z -= 0.15;

  /* ---- front (tilted about the hinge line) ---- */
  const tilt = new THREE.Group();
  tilt.name = 'frontTilt';
  tilt.position.set(0, P.hingeY, pivotR.z);
  tilt.rotation.x = THREE.MathUtils.degToRad(P.tilt);
  mm.add(tilt);
  const front = new THREE.Group();
  front.name = 'front';
  front.position.set(0, -P.hingeY, -pivotR.z);
  tilt.add(front);

  const right = frontHalf(P);
  const outline = [...right, ...mirror(right.slice(1, -1)).reverse()];
  const shape = roundedPath(outline);
  shape.holes.push(roundedPath(lensPoints(P), new THREE.Path()));
  shape.holes.push(roundedPath(mirror(lensPoints(P)).reverse(), new THREE.Path()));
  let fg = new THREE.ExtrudeGeometry(shape, {
    depth: P.depth, bevelEnabled: true, bevelThickness: P.bevel, bevelSize: P.bevel, bevelSegments: 8, curveSegments: 40,
  });
  fg.translate(0, 0, -P.depth / 2);
  fg = planarUV(polish(fg));
  W.geometry(fg);
  const frontMesh = new THREE.Mesh(fg, frameMat);
  frontMesh.name = 'frameFront';
  front.add(frontMesh);

  // moulded nose pads on the back of the bridge rims
  const padGeo = new THREE.SphereGeometry(1, 40, 28);
  for (const s of [1, -1]) {
    const pad = new THREE.Mesh(padGeo, frameMat);
    pad.name = 'nosePad';
    pad.scale.set(...P.nosePad.r);
    const at = W.point(new THREE.Vector3(s * (bI + 2.2), P.nosePad.y, -half - 1.3));
    pad.position.copy(at);
    pad.rotation.set(0.12, s * 0.55, s * 0.18);
    front.add(pad);
  }

  // lenses: concave glass in the rim groove
  const C = P.lens3d;
  const zOf = (d) => C.center + (d * d) / (2 * C.radius) + C.thickness / 2;
  for (const s of [1, -1]) {
    const pts = lensPoints(P, C.grow).map(([x, y, r]) => [s * x, y, r]);
    const path = roundedPath(s < 0 ? pts.reverse() : pts);
    const boundary = path.getSpacedPoints(180).slice(0, -1);
    const cx = s * (bI + L.width / 2 - 1), cy = 0.5;
    const lg = lensGeometry(boundary, cx, cy, zOf, C.thickness);
    W.geometry(lg);
    const lensMesh = new THREE.Mesh(lg, lensMat);
    lensMesh.name = s > 0 ? 'lensR' : 'lensL';
    lensMesh.userData.explode = [s * 6, 0, 34];
    front.add(lensMesh);
    if (s > 0) {
      const a = new THREE.Object3D();
      a.name = 'label-lens';
      a.position.copy(W.point(new THREE.Vector3(cx + 10, -8, zOf(12))));
      lensMesh.add(a);
    }
  }

  // chrome rivet domes on the outer top corners
  const dome = new THREE.SphereGeometry(P.rivet.radius, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2);
  dome.rotateX(Math.PI / 2);
  for (const s of [1, -1]) {
    const g = new THREE.Group();
    g.name = s > 0 ? 'rivetsR' : 'rivetsL';
    g.userData.explode = [s * 4, 4, 16];
    for (const y of P.rivet.y) {
      const m = new THREE.Mesh(dome, rivetMetal);
      const x = s * (O + P.rivet.x);
      m.position.copy(W.point(new THREE.Vector3(x, y, half - 0.18)));
      m.rotation.y = W.angle(x);
      m.scale.z = 0.55;
      g.add(m);
    }
    if (s > 0) {
      const a = new THREE.Object3D();
      a.name = 'label-rivet';
      a.position.copy(W.point(new THREE.Vector3(O + P.rivet.x, P.rivet.y[0] + 1, half)));
      g.add(a);
    }
    front.add(g);
  }

  // front hinge knuckles + plate on the back of each endpiece
  const knuckle = new THREE.CylinderGeometry(1.15, 1.15, 2.5, 28);
  const plate = new THREE.BoxGeometry(0.6, 7.5, 6);
  for (const s of [1, -1]) {
    const h = new THREE.Group();
    h.name = s > 0 ? 'hingeR' : 'hingeL';
    h.userData.explode = [s * 8, 0, -10];
    const px = s * (pivotR.x - 0.9);
    for (const dy of [-2.75, 2.75]) {
      const k = new THREE.Mesh(knuckle, metal);
      k.position.set(px, P.hingeY + dy, pivotR.z - 0.6);
      h.add(k);
    }
    const pl = new THREE.Mesh(plate, steel());
    pl.position.set(px - s * 0.6, P.hingeY, pivotR.z + 1.2);
    pl.rotation.y = s * W.angle(Math.abs(px));
    h.add(pl);
    if (s > 0) {
      const a = new THREE.Object3D();
      a.name = 'label-hinge';
      a.position.set(px, P.hingeY + 4.2, pivotR.z - 0.6);
      h.add(a);
      const f = new THREE.Object3D();
      f.name = 'focus-hinge';
      f.position.copy(W.point(new THREE.Vector3(O + P.endpiece - 2, P.hingeY, half)));
      front.add(f);
    }
    front.add(h);
  }

  const brow = new THREE.Object3D();
  brow.name = 'label-acetate';
  brow.position.copy(W.point(new THREE.Vector3(-(bI + L.width * 0.62), L.top + P.brow - 0.8, half)));
  front.add(brow);

  /* ---- temples ---- */
  const { shape: tShape, sOf } = templeOutline(P);
  let tg = new THREE.ExtrudeGeometry(tShape, {
    depth: T.thickness, bevelEnabled: true, bevelThickness: T.bevel, bevelSize: T.bevel, bevelSegments: 6, curveSegments: 12,
  });
  tg.translate(0, 0, -T.thickness / 2);
  tg = polish(tg);
  // shape (s, y, z) → temple space: s runs back along -Z, the thickness along X; the ear tip
  // curves gently inward (toward -X: the head, for the right temple)
  {
    const p = tg.attributes.position, n = tg.attributes.normal;
    const v = new THREE.Vector3(), nn = new THREE.Vector3();
    const s1 = T.straight - 25, span = T.length - s1;
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      nn.fromBufferAttribute(n, i);
      const s = sOf(v.x, v.y);
      const t = Math.max(0, (s - s1) / span);
      const inward = T.inward * t * t, slope = (2 * T.inward * t) / span;
      p.setXYZ(i, v.z + Tw / 2 - inward, v.y, -v.x);
      // normal: rotate the same way (x,y,z) → (z, y, -x), then lean with the inward curve
      const nx = nn.z, nz = -nn.x;
      n.setXYZ(i, nx, nn.y, nz - nx * slope);
    }
    tg.computeBoundingSphere();
    tg.normalizeNormals();
  }
  planarUV(tg, 'z', 'y');

  const wire = new THREE.BoxGeometry(0.8, 2.2, T.straight - 12);
  // the core wire catches a little light of its own, so it reads through transparent acetate
  const wireMat = memo('coreWire', () => new THREE.MeshStandardMaterial({ name: 'CoreWire', color: 0xdfe4ea, metalness: 0.9, roughness: 0.25, emissive: 0x2a2c30 }));
  const logoGeo = new THREE.PlaneGeometry(P.logo.height * LOGO_ASPECT, P.logo.height);
  const tKnuckle = new THREE.CylinderGeometry(1.15, 1.15, 2.6, 28);

  const temples = [];
  for (const s of [1, -1]) {
    const pivot = new THREE.Group();
    pivot.name = s > 0 ? 'templePivotR' : 'templePivotL';
    pivot.position.set(s * pivotR.x, P.hingeY, pivotR.z);
    const open = -s * THREE.MathUtils.degToRad(T.splay);
    // folded: the right temple lies against the lenses, the left one folds over it
    const folded = s * THREE.MathUtils.degToRad(s > 0 ? 88 : 82);
    pivot.userData = { open, folded, explode: [s * 26, 0, -14] };
    pivot.rotation.y = open;
    mm.add(pivot);

    const side = new THREE.Group();
    side.name = s > 0 ? 'templeR' : 'templeL';
    side.scale.x = s;                       // the left temple is the right one mirrored
    pivot.add(side);
    const mesh = new THREE.Mesh(tg, frameMat);
    mesh.name = 'temple';
    side.add(mesh);
    const w = new THREE.Mesh(wire, wireMat);
    w.name = 'coreWire';
    w.position.set(Tw / 2, 0.8, -(6 + (T.straight - 12) / 2));
    side.add(w);
    const logo = new THREE.Mesh(logoGeo, logoMaterial());
    logo.name = 'logo';
    logo.position.set(Tw + 0.03, P.logo.y, -P.logo.at);
    logo.rotation.y = Math.PI / 2;
    logo.scale.x = s;                       // undo the mirror so the script reads on both sides
    side.add(logo);
    const tk = new THREE.Mesh(tKnuckle, metal);
    tk.position.set(-0.9, 0, -0.6);
    side.add(tk);
    if (s > 0) {
      const a = new THREE.Object3D();
      a.name = 'label-logo';
      a.position.set(Tw + 0.4, 3.4, -P.logo.at);
      side.add(a);
    }
    temples.push(pivot);
  }

  /* ---- hotspots (cm, in the root's space) ---- */
  root.updateMatrixWorld(true);
  const wp = (name, add = [0, 0, 0]) => root.worldToLocal(root.getObjectByName(name).getWorldPosition(new THREE.Vector3())).add(new THREE.Vector3(...add)).toArray();
  const hotspots = [
    { id: 'frame', label: 'The Frame', position: wp('label-acetate', [0, 0.15, 0.1]), normal: [0, 0.3, 1] },
    { id: 'lens', label: 'The Lens', position: wp('label-lens', [0, 0, 0.15]), normal: [0, 0, 1] },
    { id: 'rivets', label: 'Corner Rivets', position: wp('label-rivet', [0, 0.1, 0.12]), normal: [0.2, 0.1, 1] },
    { id: 'hinge', label: 'Barrel Hinge', position: wp('label-hinge', [-0.1, 0.05, -0.15]), normal: [-0.4, 0.3, -1] },
    { id: 'logo', label: 'Ray-Ban Signature', position: wp('label-logo', [0.15, 0, 0]), normal: [1, 0, 0] },
    { id: 'temple', label: 'The Temple', position: wp('label-logo', [0.15, -0.3, -6]), normal: [1, 0, 0] },
  ];
  root.userData.heroAngle = [1.22, 0.62];
  root.userData.rimBoost = 1;                    // extra kickers behind (viewer/studio.js)
  return { object: root, hotspots };
}

/** Fold the temples: 0 = open, 1 = folded (on one viewer's copy). */
export function setFold(object, f) {
  for (const name of ['templePivotR', 'templePivotL']) {
    const p = object.getObjectByName(name);
    if (p) p.rotation.y = THREE.MathUtils.lerp(p.userData.open, p.userData.folded, f);
  }
}

/**
 * Give one viewer's copy its own acetate material and return a setter that blends the finish:
 * set(0) = Obsidian, set(1) = Emerald.
 */
export function finishControl(object) {
  let mat = null;
  object.traverse((o) => {
    if (o.isMesh && o.material?.name === 'FrameAcetate') {
      mat ??= o.material.clone();
      o.material = mat;
    }
  });
  if (!mat) return null;
  const A = FINISHES.obsidian, B = FINISHES.emerald;
  const ca = new THREE.Color(), cb = new THREE.Color();
  const lerpColor = (key, k) => mat[key].copy(ca.set(A[key])).lerp(cb.set(B[key]), k);
  return {
    material: mat,
    set(k) {
      lerpColor('color', k);
      lerpColor('attenuationColor', k);
      lerpColor('emissive', k);
      mat.roughness = THREE.MathUtils.lerp(A.roughness, B.roughness, k);
      mat.transmission = THREE.MathUtils.lerp(A.transmission, B.transmission, k);
      mat.attenuationDistance = THREE.MathUtils.lerp(4, B.attenuationDistance, k);
      mat.envMapIntensity = THREE.MathUtils.lerp(A.envMapIntensity, B.envMapIntensity, k);
    },
  };
}
