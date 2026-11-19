/**
 * Jewellery parts shared by every relic: rings, clasp, tag, extender, star charm,
 * faceted crystal bar, molten "liquid silver" vines, spikes, beads, cross, alien head.
 * All dimensions in centimetres.
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { chrome, steel, gem, enamel, mulberry, crystal, obsidian, pave } from './materials.js';
import { linkGeometry, chainAlong, hangCurve } from './chain.js';
import { meshSDF, smin, smax } from './sdf.js';

const cache = new Map();
const memo = (key, make) => { if (!cache.has(key)) cache.set(key, make()); return cache.get(key); };

/* ---------------- rings ---------------- */

export function jumpRing(R = 0.22, r = 0.045, material = chrome()) {
  const g = memo(`ring:${R}:${r}`, () => new THREE.TorusGeometry(R, r, 12, 40));
  const m = new THREE.Mesh(g, material);
  m.name = 'jumpRing';
  return m;
}

/* ---------------- lobster clasp ---------------- */

export function lobsterClasp({ length = 1.25, material = chrome() } = {}) {
  const grp = new THREE.Group();
  grp.name = 'lobsterClasp';
  const body = memo(`clasp:${length}`, () => {
    const L = length;
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      // teardrop: fat near the hook end, narrowing to the swivel
      const r = Math.sin(Math.PI * Math.pow(t, 0.8)) * 0.27 * L * (1 - 0.35 * t);
      pts.push(new THREE.Vector2(Math.max(0.001, r), t * L));
    }
    const g = new THREE.LatheGeometry(pts, 40);
    g.scale(1, 1, 0.5);
    g.translate(0, -L / 2, 0);
    return g;
  });
  const b = new THREE.Mesh(body, material);
  b.rotation.z = -Math.PI / 2; // lie along +X
  grp.add(b);
  // spring gate (thin arc on the side)
  const gate = new THREE.Mesh(
    memo(`gate:${length}`, () => new THREE.TorusGeometry(length * 0.26, 0.025, 8, 24, Math.PI * 0.9)),
    steel(),
  );
  gate.position.set(-length * 0.08, 0, length * 0.075);
  gate.rotation.z = Math.PI * 0.05;
  grp.add(gate);
  // trigger nub
  const nub = new THREE.Mesh(memo('nub', () => new RoundedBoxGeometry(0.14, 0.1, 0.12, 2, 0.03)), material);
  nub.position.set(-length * 0.05, length * 0.2, 0);
  grp.add(nub);
  // swivel ring at the narrow end
  const ring = jumpRing(0.12, 0.035, material);
  ring.position.set(length * 0.56, 0, 0);
  grp.add(ring);
  return grp;
}

/* ---------------- oval brand tag ---------------- */

export function ovalTag({ w = 0.95, h = 0.55, t = 0.06, shape = 'oval', material = chrome() } = {}) {
  const grp = new THREE.Group();
  grp.name = 'tag';
  const g = memo(`tag:${w}:${h}:${t}:${shape}`, () => {
    const s = new THREE.Shape();
    if (shape === 'rect') { // rounded rectangle
      const x = w / 2, y = h / 2, r = Math.min(x, y) * 0.3;
      s.moveTo(-x + r, -y); s.lineTo(x - r, -y); s.quadraticCurveTo(x, -y, x, -y + r); s.lineTo(x, y - r);
      s.quadraticCurveTo(x, y, x - r, y); s.lineTo(-x + r, y); s.quadraticCurveTo(-x, y, -x, y - r); s.lineTo(-x, -y + r);
      s.quadraticCurveTo(-x, -y, -x + r, -y);
    } else s.absellipse(0, 0, w / 2, h / 2, 0, Math.PI * 2);
    const hole = new THREE.Path();
    hole.absellipse(-w / 2 + 0.12, 0, 0.055, 0.055, 0, Math.PI * 2);
    s.holes.push(hole);
    const geo = new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 3, curveSegments: 40 });
    geo.translate(0, 0, -t / 2);
    return geo;
  });
  grp.add(new THREE.Mesh(g, material));
  return grp;
}

/**
 * Extender: a short fine chain hanging from `start`, ending in an oval tag.
 */
export function extender({ start, length = 3.2, swing = new THREE.Vector3(0.6, 0, -0.4), material = chrome(), tag: tagShape = 'oval' } = {}) {
  const grp = new THREE.Group();
  grp.name = 'extender';
  const end = start.clone().add(new THREE.Vector3(swing.x, -length, swing.z));
  const curve = hangCurve(start, end, -0.4);
  const geo = linkGeometry({ length: 0.34, width: 0.24, wire: 0.035, tubular: 32, radial: 8 });
  grp.add(chainAlong(curve, { geometry: geo, material, pitch: 0.34 - 0.08, name: 'extenderLinks' }));
  const tag = tagShape === 'rect' ? ovalTag({ w: 0.8, h: 0.42, shape: 'rect', material }) : ovalTag({ material });
  tag.position.copy(end).add(new THREE.Vector3(0, -0.35, 0));
  tag.rotation.set(0.15, Math.atan2(swing.x, swing.z) + Math.PI / 2, Math.PI / 2);
  grp.add(tag);
  const ring = jumpRing(0.09, 0.025, material);
  ring.position.copy(end).add(new THREE.Vector3(0, -0.04, 0));
  ring.rotation.y = Math.PI / 2;
  grp.add(ring);
  return grp;
}

/* ---------------- star charm (4-point sparkle, from the logo) ---------------- */

/**
 * Faceted star: a raised ridge from a central apex to every arm tip, concave sides.
 * @param {number[]} arms  lengths of each arm, clockwise from the top (4 or 8 entries)
 */
export function starGeometry({ arms = [1, 1, 1, 1], valley = 0.12, height = 0.16, rim = 0.05, concave = 0.65, seg = 6 } = {}) {
  const key = `star:${arms.join(',')}:${valley}:${height}:${rim}:${concave}:${seg}`;
  return memo(key, () => {
    const n = arms.length;
    const outline = [];
    for (let k = 0; k < n; k++) {
      const a0 = Math.PI / 2 - (k / n) * Math.PI * 2;
      const am = a0 - Math.PI / n;
      const a1 = a0 - (2 * Math.PI) / n;
      const tip0 = new THREE.Vector2(Math.cos(a0) * arms[k], Math.sin(a0) * arms[k]);
      const val = new THREE.Vector2(Math.cos(am) * valley, Math.sin(am) * valley);
      const tip1 = new THREE.Vector2(Math.cos(a1) * arms[(k + 1) % n], Math.sin(a1) * arms[(k + 1) % n]);
      // concave edge: quadratic bezier with control pulled toward the centre
      const ctrlA = tip0.clone().lerp(val, 0.5).multiplyScalar(1 - concave * 0.6);
      const ctrlB = val.clone().lerp(tip1, 0.5).multiplyScalar(1 - concave * 0.6);
      const qa = new THREE.QuadraticBezierCurve(tip0, ctrlA, val);
      const qb = new THREE.QuadraticBezierCurve(val, ctrlB, tip1);
      for (let i = 0; i < seg; i++) outline.push(qa.getPoint(i / seg));
      for (let i = 0; i < seg; i++) outline.push(qb.getPoint(i / seg));
    }
    const pos = [];
    const top = new THREE.Vector3(0, 0, height + rim / 2), bot = new THREE.Vector3(0, 0, -height - rim / 2);
    const m = outline.length;
    for (let i = 0; i < m; i++) {
      const a = outline[i], b = outline[(i + 1) % m];
      const at = [a.x, a.y, rim / 2], bt = [b.x, b.y, rim / 2];
      const ab = [a.x, a.y, -rim / 2], bb = [b.x, b.y, -rim / 2];
      pos.push(top.x, top.y, top.z, ...bt, ...at);     // top facet (CCW seen from +Z)
      pos.push(bot.x, bot.y, bot.z, ...ab, ...bb);     // bottom facet
      pos.push(...at, ...bt, ...bb, ...at, ...bb, ...ab); // rim wall
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.computeVertexNormals();
    return g;
  });
}

/**
 * Star charm as worn on the bracelets: long dagger-like arm, a bezel-set stone in the
 * centre (or none), and a bail ring at the tip it hangs from.
 * @param {string|null} stone  colour of the centre stone or null
 */
export function starCharm({ arms = [0.62, 0.42, 0.62, 1.35], stone = null, material = chrome(), bailArm = 1, paveBack = null } = {}) {
  const grp = new THREE.Group();
  grp.name = 'starCharm';
  const star = new THREE.Mesh(starGeometry({ arms, valley: 0.15, height: 0.12, rim: 0.06, concave: 0.45 }), material);
  grp.add(star);
  if (stone) {
    const bezel = new THREE.Mesh(memo('bezel', () => new THREE.TorusGeometry(0.105, 0.03, 10, 28)), material);
    bezel.position.z = 0.1;
    grp.add(bezel);
    const s = new THREE.Mesh(memo('stone', () => {
      const g = new THREE.CylinderGeometry(0.1, 0.02, 0.1, 8, 1);
      g.rotateX(Math.PI / 2);
      g.translate(0, 0, 0.09);
      return g;
    }), gem(stone));
    s.name = 'charmStone';
    grp.add(s);
  }
  // optional pave down every arm on the back (the back of the real charm glitters)
  if (paveBack) {
    const H = 0.12, RIM = 0.06, n = arms.length;
    const geo = memo(`starPave:${arms.join(',')}`, () => {
      const pos = [];
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, -1));
      const place = (x, y, r, f) => {
        const g = brilliant(r);
        g.applyQuaternion(q);
        g.translate(x, y, -(RIM / 2 + H * (1 - f) * 0.9) - 0.004);
        pos.push(...g.attributes.position.array);
      };
      place(0, 0, 0.05, 0);
      for (let k = 0; k < n; k++) {
        const ang = Math.PI / 2 - (k / n) * Math.PI * 2;
        for (let d = 0.11; d < arms[k] - 0.1; d += 0.085) {
          const r = 0.038 * Math.max(0.55, 1 - d / (arms[k] * 1.4));
          place(Math.cos(ang) * d, Math.sin(ang) * d, r, d / arms[k]); // follow the arm's slope to its tip
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.computeVertexNormals();
      return g;
    });
    const p = new THREE.Mesh(geo, paveBack);
    p.name = 'charmPave';
    grp.add(p);
  }
  // bail at the chosen arm tip
  const n = arms.length;
  const a = Math.PI / 2 - (bailArm / n) * Math.PI * 2;
  const bail = jumpRing(0.11, 0.03, material);
  bail.position.set(Math.cos(a) * (arms[bailArm] + 0.06), Math.sin(a) * (arms[bailArm] + 0.06), 0);
  bail.rotation.y = Math.PI / 2;
  grp.add(bail);
  grp.userData.bailOffset = bail.position.clone();
  return grp;
}

/* ---------------- faceted crystal bar (emerald / step cut) ---------------- */

export function crystalBarGeometry({ length = 1.9, height = 0.78, depth = 0.55, chamfer = 0.2 } = {}) {
  return memo(`bar:${length}:${height}:${depth}:${chamfer}`, () => {
    const h = height / 2 - 0.1, d = depth / 2 - 0.1, c = chamfer;
    const s = new THREE.Shape();
    s.moveTo(-h + c, -d); s.lineTo(h - c, -d); s.lineTo(h, -d + c); s.lineTo(h, d - c);
    s.lineTo(h - c, d); s.lineTo(-h + c, d); s.lineTo(-h, d - c); s.lineTo(-h, -d + c); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, {
      depth: length - 0.32, bevelEnabled: true, bevelThickness: 0.16, bevelSize: 0.1, bevelSegments: 3, curveSegments: 1,
    });
    g.translate(0, 0, -(length - 0.32) / 2);
    g.rotateY(Math.PI / 2); // long axis → X
    g.computeVertexNormals();
    return g;
  });
}

/* ---------------- molten liquid-silver vine ---------------- */

/**
 * Organic tube with varying thickness that wraps around a bar along X.
 * @param {object} o
 * @param {number} o.x0,o.x1     start/end along the bar
 * @param {number} o.phi0,o.phi1 start/end angle around the bar
 * @param {number} o.a,o.b       half-height/half-depth of the bar it hugs
 */
export function liquidVine({ x0 = -0.5, x1 = 0.55, phi0 = -2.2, phi1 = 2.1, a = 0.42, b = 0.31, thick = 0.1, seed = 3, material = chrome(0.05) } = {}) {
  const rand = mulberry(seed);
  const wob = Array.from({ length: 6 }, () => rand() * 2 - 1);
  const pts = [];
  const N = 40;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const phi = phi0 + (phi1 - phi0) * t;
    const c = Math.cos(phi), s = Math.sin(phi);
    // superellipse so it hugs the rectangular section
    const p = 4;
    const k = Math.pow(Math.pow(Math.abs(c), p) + Math.pow(Math.abs(s), p), -1 / p);
    const lift = thick * 0.55;
    const x = x0 + (x1 - x0) * t + Math.sin(t * Math.PI * 2 + wob[0]) * 0.12 * wob[1];
    pts.push(new THREE.Vector3(x, s * k * (a + lift), c * k * (b + lift)));
  }
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  const tubular = 120, radial = 14;
  const geo = new THREE.TubeGeometry(curve, tubular, 1, radial, false);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3(), cpt = new THREE.Vector3();
  const radius = (t) => {
    const taper = Math.min(1, Math.sin(Math.PI * t) * 2.2);
    const blob = 0.75 + 0.35 * Math.sin(t * 9 + wob[2] * 3) + 0.2 * Math.sin(t * 23 + wob[3] * 5);
    return thick * Math.max(0.25, taper) * blob;
  };
  for (let i = 0; i <= tubular; i++) {
    const t = i / tubular;
    curve.getPointAt(t, cpt);
    const r = radius(t);
    for (let j = 0; j <= radial; j++) {
      const idx = i * (radial + 1) + j;
      v.fromBufferAttribute(pos, idx).sub(cpt);
      // flatten slightly against the crystal so it reads as molten metal poured on
      pos.setXYZ(idx, cpt.x + v.x * r, cpt.y + v.y * r * 0.85, cpt.z + v.z * r * 0.85);
    }
  }
  geo.computeVertexNormals();
  const grp = new THREE.Group();
  grp.name = 'liquidVine';
  grp.add(new THREE.Mesh(geo, material));
  // round drips at both ends
  for (const t of [0, 1]) {
    const cap = new THREE.Mesh(memo('vineCap', () => new THREE.SphereGeometry(1, 16, 12)), material);
    cap.scale.setScalar(radius(t === 0 ? 0.02 : 0.98) * 1.05);
    cap.position.copy(curve.getPointAt(t));
    grp.add(cap);
  }
  return grp;
}

/* ---------------- spike (Thorn Relic) ---------------- */

export function spike({ length = 2.0, radius = 0.32, material = chrome(0.05) } = {}) {
  const grp = new THREE.Group();
  grp.name = 'spike';
  const g = memo(`spike:${length}:${radius}`, () => {
    const pts = [
      new THREE.Vector2(0.0001, -0.08),
      new THREE.Vector2(radius * 0.55, -0.08),
      new THREE.Vector2(radius * 0.92, -0.04),
      new THREE.Vector2(radius, 0.02),
      new THREE.Vector2(radius * 0.99, 0.1),
    ];
    // slightly concave cone up to a needle tip
    for (let i = 1; i <= 24; i++) {
      const t = i / 24;
      const r = radius * 0.97 * Math.pow(1 - t, 1.15);
      pts.push(new THREE.Vector2(Math.max(0.0001, r), 0.1 + t * (length - 0.1)));
    }
    return new THREE.LatheGeometry(pts, 48);
  });
  grp.add(new THREE.Mesh(g, material));
  // screw-cap collar
  const collar = new THREE.Mesh(memo(`collar:${radius}`, () => new THREE.TorusGeometry(radius * 0.98, 0.02, 8, 48)), material);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 0.1;
  grp.add(collar);
  // bail loop below the base
  const bail = jumpRing(0.11, 0.035, material);
  bail.position.y = -0.18;
  grp.add(bail);
  grp.userData.tip = new THREE.Vector3(0, length, 0);
  return grp;
}

/* ---------------- beads & spacers (Rosary of Ash) ---------------- */

export function spacer(radius = 0.24, material = chrome()) {
  const g = memo(`spacer:${radius}`, () => {
    const t = new THREE.TorusGeometry(radius * 0.62, radius * 0.38, 12, 32);
    t.scale(1, 1, 0.55);
    t.rotateY(Math.PI / 2); // hole along X
    return t;
  });
  return new THREE.Mesh(g, material);
}

/* ---------------- alien head pendant (The Visitor) ---------------- */

/**
 * Alien head, as on the real piece: a smooth polished dome (wide round cranium) tapering below
 * the eyes to a small pointed chin, with a soft ridge down the lower face. Two large slanted
 * almond eyes are sunk into sockets with a polished rim and filled with green enamel: the
 * sockets are carved into the head mesh, and the triangles on their floor use the enamel.
 * `inline`: a loop at the crown and one under the chin, so the head sits inside the chain;
 * otherwise a single bail at the top. userData: top / chin = outer ends of the loops.
 */
export function alienHead({ size = 1.0, eye = '#0f9a48', material = chrome(0.05), inline = false } = {}) {
  const grp = new THREE.Group();
  grp.name = 'alienHead';
  const ss = (a, b, x) => { const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const R = size * 0.5;
  // head shape: a sphere pinched to a teardrop (taper below the middle, flattened front to back)
  const narrowAt = (y0) => 1 - 0.68 * Math.pow(THREE.MathUtils.clamp((0.2 * R - y0) / (1.2 * R), 0, 1), 1.9);
  const stretch = (y0) => (y0 < 0 ? 1.5 : 0.9); // a slightly low dome, a longer face
  const ridge = (x, y) => (y < 0 ? size * 0.03 * ss(0, 0.35, -y / size) * Math.max(0, 1 - Math.abs(x) / (size * 0.18)) ** 2 : 0);
  const deform = (v) => {
    const n = narrowAt(v.y);
    v.set(v.x * n, v.y * stretch(v.y), v.z * n * 0.68);
    if (v.z > 0) v.z += ridge(v.x, v.y);
    return v;
  };
  /** Front surface point at face coordinates (x, y): the inverse of deform for z > 0. */
  const front = (x, y) => {
    const y0 = y / stretch(y), n = narrowAt(y0), x0 = x / n;
    const z0 = Math.sqrt(Math.max(0, R * R - x0 * x0 - y0 * y0));
    return new THREE.Vector3(x, y, z0 * n * 0.68 + ridge(x, y));
  };
  // eyes in face coordinates (fractions of size): centre, half-length, half-height, slant, socket depth
  const EYE = { x: 0.25, y: -0.13, a: 0.215, b: 0.145, slant: 0.45, depth: 0.028 };
  const eyeLocal = (side, u, v) => {
    const c = Math.cos(side * EYE.slant), sn = Math.sin(side * EYE.slant);
    return [(side * EYE.x + u * c - v * sn) * size, (EYE.y + u * sn + v * c) * size];
  };
  const halfHeight = (u, v) => EYE.b * Math.pow(Math.max(0, 1 - (u / EYE.a) ** 2), 0.85) * (v > 0 ? 1 : 0.8); // almond, fuller on top
  const eyeMetric = (x, y) => {
    let m = 9;
    for (const side of [-1, 1]) {
      const dx = x / size - side * EYE.x, dy = y / size - EYE.y;
      const c = Math.cos(side * EYE.slant), sn = Math.sin(side * EYE.slant);
      const u = dx * c + dy * sn, v = -dx * sn + dy * c;
      if (Math.abs(u) >= EYE.a) continue;
      m = Math.min(m, Math.max(Math.abs(v) / halfHeight(u, v), (Math.abs(u) / EYE.a) ** 6));
    }
    return m;
  };
  const sinkAt = (m) => EYE.depth * size * ss(1.0, 0.72, m);

  const geo = memo(`alien6:${size}`, () => {
    const g = new THREE.SphereGeometry(R, 260, 200);
    const p = g.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      deform(v.fromBufferAttribute(p, i));
      if (v.z > 0) { const k = sinkAt(eyeMetric(v.x, v.y)); if (k > 0) v.addScaledVector(v.clone().normalize(), -k); } // eye sockets
      p.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    return g;
  });
  // the enamel inlay: a smooth almond sheet laid on each socket floor, slightly domed
  const inlay = memo(`alienEyes3:${size}`, () => {
    const pos = [], idx = [], S = 48, Q = 14, mMax = 0.84;
    for (const side of [-1, 1]) {
      const base = pos.length / 3;
      for (let i = 0; i <= S; i++) for (let j = 0; j <= Q; j++) {
        const sI = -1 + (2 * i) / S, q = -1 + (2 * j) / Q;
        const u = sI * EYE.a * Math.pow(mMax, 1 / 6) * 0.995;
        const v = q * mMax * halfHeight(u, q);
        const [x, y] = eyeLocal(side, u, v);
        const P = front(x, y);
        const dir = P.clone().normalize();
        P.addScaledVector(dir, -sinkAt(eyeMetric(x, y)) + size * (0.004 + 0.012 * (1 - q * q) * (1 - sI * sI)));
        pos.push(P.x, P.y, P.z);
      }
      for (let i = 0; i < S; i++) for (let j = 0; j < Q; j++) {
        const a0 = base + i * (Q + 1) + j, a1 = a0 + Q + 1;
        idx.push(a0, a1, a0 + 1, a1, a1 + 1, a0 + 1);
      }
    }
    // wind every triangle to face out of the head (+Z)
    const A = new THREE.Vector3(), B = new THREE.Vector3(), C = new THREE.Vector3();
    for (let k = 0; k < idx.length; k += 3) {
      A.fromArray(pos, idx[k] * 3); B.fromArray(pos, idx[k + 1] * 3); C.fromArray(pos, idx[k + 2] * 3);
      if (B.sub(A).cross(C.sub(A)).z < 0) [idx[k + 1], idx[k + 2]] = [idx[k + 2], idx[k + 1]];
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  });
  const body = new THREE.Mesh(geo, material);
  body.name = 'alienSkull';
  grp.add(body);
  const eyes = new THREE.Mesh(inlay, enamel(eye, { glow: 0.35 }));
  eyes.name = 'alienEye';
  grp.add(eyes);
  // loops (edge-on across the face plane, so the chain links thread through them)
  const loopR = size * 0.07, loopW = size * 0.028;
  const loop = (y) => {
    const l = new THREE.Mesh(memo(`alienLoop:${size}`, () => new THREE.TorusGeometry(loopR, loopW, 12, 32)), material);
    l.position.set(0, y, 0);
    l.rotation.y = Math.PI / 2;
    l.name = 'alienLoop';
    grp.add(l);
  };
  const crown = R * stretch(1), chin = -R * stretch(-1);
  loop(crown + loopR * 0.75);
  grp.userData.top = new THREE.Vector3(0, crown + loopR * 1.75, 0);
  if (inline) {
    loop(chin - loopR * 0.75);
    grp.userData.chin = new THREE.Vector3(0, chin - loopR * 1.75, 0);
  }
  grp.userData.bailTop = grp.userData.top.clone();
  grp.userData.eyes = [-1, 1].map((sd) => front(...eyeLocal(sd, 0, 0)));
  return grp;
}

/* ---------------- step-cut crystal in a pavé setting (Saint bracelets) ---------------- */

/** Octagon outline: a rectangle (half-sizes hx, hy) with its corners cut by c. */
function octagon(hx, hy, c) {
  return [[hx - c, -hy], [hx, -hy + c], [hx, hy - c], [hx - c, hy], [-hx + c, hy], [-hx, hy - c], [-hx, -hy + c], [-hx + c, -hy]];
}

/**
 * Emerald (step) cut stone, long axis along X, table facing +Z, girdle at z = 0.
 * Crown: table + two step facets; pavilion: steps down to a keel.
 * Flat-shaded triangles so every facet catches its own reflection.
 */
export function emeraldCutGeometry({ length = 1.9, height = 0.7, chamfer = 0.16, crown = 0.2, pavilion = 0.3, girdle = 0.035, table = 0.62 } = {}) {
  return memo(`emerald:${length}:${height}:${chamfer}:${crown}:${pavilion}:${girdle}:${table}`, () => {
    const hx = length / 2, hy = height / 2;
    const ring = (ins, z) => octagon(hx - ins, hy - ins, Math.max(0.01, chamfer - ins * 0.45)).map(([x, y]) => [x, y, z]);
    const tIns = hy * (1 - table);                         // inset of the table edge
    const pIns = hy - 0.012;                               // pavilion closes to a keel line
    const rings = [
      ring(tIns, girdle / 2 + crown),                      // table edge
      ring(tIns * 0.62, girdle / 2 + crown * 0.62),        // crown step 2
      ring(tIns * 0.28, girdle / 2 + crown * 0.3),         // crown step 1
      ring(0, girdle / 2),                                 // girdle top
      ring(0, -girdle / 2),                                // girdle bottom
      ring(pIns * 0.34, -girdle / 2 - pavilion * 0.36),    // pavilion steps
      ring(pIns * 0.68, -girdle / 2 - pavilion * 0.7),
      ring(pIns, -girdle / 2 - pavilion),                  // keel
    ];
    const pos = [];
    const tri = (a, b, c) => pos.push(...a, ...b, ...c);
    for (let r = 0; r < rings.length - 1; r++) {
      const A = rings[r], B = rings[r + 1];
      for (let i = 0; i < 8; i++) { const j = (i + 1) % 8; tri(A[i], B[i], B[j]); tri(A[i], B[j], A[j]); }
    }
    const fan = (R) => { const c = R.reduce((s, p) => [s[0] + p[0] / 8, s[1] + p[1] / 8, s[2] + p[2] / 8], [0, 0, 0]); for (let i = 0; i < 8; i++) tri(c, R[i], R[(i + 1) % 8]); };
    fan(rings[0]); fan(rings[rings.length - 1]);
    // wind every triangle outward (the stone is convex around a point on its axis)
    const ctr = new THREE.Vector3(0, 0, (crown - pavilion) * 0.25);
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3(), m = new THREE.Vector3();
    for (let i = 0; i < pos.length; i += 9) {
      a.fromArray(pos, i); b.fromArray(pos, i + 3); c.fromArray(pos, i + 6);
      n.subVectors(b, a).cross(m.subVectors(c, a));
      m.copy(a).add(b).add(c).divideScalar(3).sub(ctr);
      if (n.dot(m) < 0) for (let k = 0; k < 3; k++) { const t = pos[i + 3 + k]; pos[i + 3 + k] = pos[i + 6 + k]; pos[i + 6 + k] = t; }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.computeVertexNormals();
    return g;
  });
}

/** Extruded octagon slab from z0 to z1 (with an optional octagon hole), lightly bevelled. */
function octSlab(hx, hy, c, z0, z1, hole = null, bevel = 0.02) {
  const s = new THREE.Shape(octagon(hx - bevel, hy - bevel, Math.max(0.01, c - bevel * 0.4)).map(([x, y]) => new THREE.Vector2(x, y)));
  if (hole) s.holes.push(new THREE.Path(octagon(...hole).map(([x, y]) => new THREE.Vector2(x, y)).reverse()));
  const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(0.001, z1 - z0 - 2 * bevel), bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 1 });
  g.translate(0, 0, z0 + bevel);
  return g;
}

/** One small round brilliant (girdle radius r), table facing +Y. */
function brilliant(r) {
  const g = new THREE.LatheGeometry([
    new THREE.Vector2(0.001, -r * 0.85), new THREE.Vector2(r, -r * 0.05), new THREE.Vector2(r, r * 0.08),
    new THREE.Vector2(r * 0.58, r * 0.38), new THREE.Vector2(0.001, r * 0.38),
  ], 8);
  return g.toNonIndexed();
}

/**
 * Pavé: rows of tiny stones (staggered) set into a flat face. Returns one merged, flat-shaded
 * geometry, stones pointing along `normal` (±Z) from the plane z = zFace.
 */
export function paveGeometry({ cols = 14, rows = 4, pitch = 0.12, r = 0.05, zFace = 0, normal = -1, keep = null } = {}) {
  const parts = [];
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, normal));
  const rand = mulberry(rows * 131 + cols);
  for (let j = 0; j < rows; j++) {
    const n = cols - (j % 2);
    for (let i = 0; i < n; i++) {
      const x = (i - (n - 1) / 2) * pitch, y = (j - (rows - 1) / 2) * pitch * 0.88;
      if (keep && !keep(x, y)) continue;
      const g = brilliant(r * (0.92 + rand() * 0.12));
      g.rotateY(rand() * Math.PI); // each stone turned and tipped a little differently,
      g.rotateX((rand() - 0.5) * 0.5); // so across the field they flash at different angles
      g.rotateZ((rand() - 0.5) * 0.5);
      g.applyQuaternion(q);
      g.translate(x, y, zFace + normal * r * 0.12);
      parts.push(g);
    }
  }
  const pos = [];
  for (const g of parts) pos.push(...g.attributes.position.array);
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.computeVertexNormals();
  return out;
}

/** Molten drop / spike: a teardrop of liquid silver pointing along +Y from its base. */
export function moltenDropGeometry({ r = 0.07, length = 0.22, seed = 1 } = {}) {
  return memo(`drop:${r}:${length}:${seed}`, () => {
    const rand = mulberry(seed * 7919);
    const pts = [];
    const N = 18;
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      // fat rounded base narrowing to a soft point, with a slight bulge
      const w = r * Math.pow(Math.sin(Math.PI * (0.5 + 0.5 * t)), 0.8) * (1 + 0.12 * Math.sin(t * 7 + rand() * 0.5));
      pts.push(new THREE.Vector2(Math.max(0.002, w), -r * 0.6 + t * (length + r * 0.6)));
    }
    pts[0].x = 0.001;
    return new THREE.LatheGeometry(pts, 20);
  });
}

/**
 * Centrepiece of the Saint bracelets: a step-cut crystal set in a chrome tray. The back of the
 * tray is covered in pave stones with molten-silver points along its edges, as on the real
 * piece. Long axis X, crystal facing +Z, about `depth` deep, centred on z = 0.
 */
export function crystalSetting({ length = 1.9, height = 0.8, depth = 0.56, crystalMaterial, metal = chrome(0.06), stones = null } = {}) {
  const grp = new THREE.Group();
  grp.name = 'crystalSetting';
  const hx = length / 2, hy = height / 2, c = Math.min(0.2, hy * 0.42);
  const zBack = -depth / 2, zFront = zBack + depth * 0.5;          // tray body: the back half
  const crown = depth * 0.32;
  const cut = emeraldCutGeometry({ length: length - 0.1, height: height - 0.12, chamfer: c * 0.85, crown, pavilion: depth * 0.42, girdle: 0.035, table: 0.5 });
  const stone = new THREE.Mesh(cut, crystalMaterial);
  stone.name = 'crystal';
  stone.position.z = zFront + 0.02;
  grp.add(stone);
  // inner step facets: a smaller, mirror-red copy inside the stone. Seen through the table it
  // gives the "hall of mirrors" steps of a real emerald cut instead of a flat red slab.
  if (crystalMaterial.transmission > 0) {
    const coreMat = memo(`core:${crystalMaterial.attenuationColor.getHexString()}`, () => new THREE.MeshPhysicalMaterial({
      name: 'CrystalCore', color: crystalMaterial.attenuationColor.clone().multiplyScalar(1.15), metalness: 1, roughness: 0.06,
      flatShading: true, envMapIntensity: 1.6, emissive: crystalMaterial.attenuationColor, emissiveIntensity: 0.12,
    }));
    const core = new THREE.Mesh(emeraldCutGeometry({ length: length - 0.26, height: height - 0.26, chamfer: c * 0.7, crown: 0.02, pavilion: depth * 0.36, girdle: 0.02, table: 0.4 }), coreMat);
    core.name = 'crystalCore';
    core.position.z = zFront - 0.01;
    grp.add(core);
  }
  // tray body (closed back) + bezel lip holding the girdle
  const tray = new THREE.Mesh(memo(`tray:${length}:${height}:${depth}`, () => octSlab(hx, hy, c, zBack, zFront)), metal);
  tray.name = 'tray';
  grp.add(tray);
  const lip = new THREE.Mesh(memo(`lip:${length}:${height}:${depth}`, () =>
    octSlab(hx, hy, c, zFront - 0.02, zFront + 0.06, [hx - 0.055, hy - 0.055, Math.max(0.01, c * 0.85 - 0.02)], 0.012)), metal);
  lip.name = 'bezel';
  grp.add(lip);
  // pave over the back face
  const pave = new THREE.Mesh(memo(`pave:${length}:${height}:${depth}`, () => {
    const pitch = 0.084, r = 0.037;
    const inX = hx - 0.07, inY = hy - 0.06;
    return paveGeometry({
      cols: Math.floor((2 * inX) / pitch) + 1, rows: Math.max(2, Math.floor((2 * inY) / (pitch * 0.88)) + 1), pitch, r, zFace: zBack, normal: -1,
      // stay inside the cut corners of the octagon
      keep: (x, y) => Math.abs(x) <= inX && Math.abs(y) <= inY && (inX - Math.abs(x)) + (inY - Math.abs(y)) >= c * 0.7,
    });
  }), stones);
  pave.name = 'pave';
  grp.add(pave);
  // molten points along the top and bottom edges (where the front vines end on the back)
  const drops = [
    { x: -hx * 0.62, up: 1, len: 0.24, tilt: -0.5, seed: 3 }, { x: hx * 0.22, up: 1, len: 0.3, tilt: -0.4, seed: 5 },
    { x: -hx * 0.42, up: -1, len: 0.2, tilt: -0.3, seed: 7 }, { x: hx * 0.5, up: -1, len: 0.26, tilt: -0.45, seed: 9 },
  ];
  for (const d of drops) {
    const m = new THREE.Mesh(moltenDropGeometry({ r: 0.065, length: d.len, seed: d.seed }), metal);
    m.name = 'moltenPoint';
    m.position.set(d.x, d.up * (hy - 0.05), zBack + 0.08);
    m.rotation.set(d.up * d.tilt, 0, d.up > 0 ? 0 : Math.PI); // lean back over the pave
    grp.add(m);
  }
  grp.userData.bottomY = -hy;
  grp.userData.zBack = zBack;
  return grp;
}

/**
 * The full "Saint" centrepiece shared by the Saint bracelets and necklaces: the crystal setting
 * (pave back), jump rings at both ends, molten-silver bands and drips over the front, and the
 * small star charm (pave back) hanging from a ring under it. Group-local: long axis X, crystal
 * facing +Z. Returns { group, charm } (the charm is inside the group).
 * @param {object} C     { color, type: 'crystal' | 'obsidian', length, height, depth }
 * @param {object} star  { arms, stone, scale }
 */
export function saintCentrepiece({ crystal: C, star, metal = chrome(0.06), vines = 2, distance = 0.28 }) {
  const g = new THREE.Group();
  g.name = 'crystalConnector';
  const crystalMat = C.type === 'obsidian' ? obsidian() : crystal(C.color, { distance, glow: 0.1, env: 1.8 });
  g.add(crystalSetting({ length: C.length, height: C.height, depth: C.depth, crystalMaterial: crystalMat, metal, stones: pave() }));
  // jump rings at both ends, joining the chain
  for (const s of [-1, 1]) {
    const ring = jumpRing(0.17, 0.045, metal);
    ring.position.x = s * (C.length / 2 + 0.13);
    ring.rotation.y = Math.PI / 2;
    g.add(ring);
  }
  // molten bands poured up the front, over the top edge, ending in the points on the back
  const vineSets = [
    { x0: -0.66, x1: -0.52, phi0: -2.75, phi1: 1.95, seed: 11, thick: 0.095 },
    { x0: 0.38, x1: 0.54, phi0: -1.95, phi1: 2.6, seed: 23, thick: 0.09 },
    { x0: -0.1, x1: 0.1, phi0: 2.2, phi1: 4.2, seed: 31, thick: 0.06 },
  ];
  const k = C.length / 1.9;
  for (let i = 0; i < vines; i++) {
    const v = vineSets[i];
    g.add(liquidVine({ ...v, x0: v.x0 * k, x1: v.x1 * k, a: C.height / 2 + 0.02, b: C.depth / 2, material: chrome(0.04) }));
  }
  // drips running off the bands at the bottom front
  for (const d of [{ x: -0.6, len: 0.2, seed: 13 }, { x: 0.47, len: 0.27, seed: 17 }]) {
    const drip = new THREE.Mesh(moltenDropGeometry({ r: 0.055, length: d.len, seed: d.seed }), chrome(0.04));
    drip.position.set(d.x * k, -C.height / 2 + 0.02, C.depth / 2 - 0.12);
    drip.rotation.set(0.25, 0, Math.PI);
    g.add(drip);
  }
  // the star hangs from a small ring under the setting, just right of centre (as on the piece)
  const hang = new THREE.Vector3(0.12, -C.height / 2 - 0.06, 0);
  const hangRing = jumpRing(0.085, 0.024, metal);
  hangRing.position.copy(hang);
  hangRing.rotation.y = Math.PI / 2;
  g.add(hangRing);
  const CS = star.scale ?? 0.66;
  const charm = starCharm({ arms: star.arms, stone: star.stone, material: metal, bailArm: 0, paveBack: pave() });
  charm.scale.setScalar(CS);
  charm.userData.bailOffset.multiplyScalar(CS);
  charm.position.copy(hang).add(new THREE.Vector3(0, -0.06, 0)).sub(charm.userData.bailOffset).add(new THREE.Vector3(0, 0, 0.04));
  charm.rotation.set(-0.12, 0.18, 0.05);
  g.add(charm);
  return { group: g, charm, charmScale: CS };
}

/* ---------------- budded cross (Rosary of Ash) ---------------- */

/**
 * Cast Latin cross, as on the real piece: each arm ends in a rounded bud of three lobes, the
 * faces carry a raised wavy scroll, and the crossing is a round medallion with a four-petal
 * rosette and a raised boss. Sculpted as a distance field (2D outline + pillowed thickness +
 * relief height map) and meshed with surface nets. Crossing at the origin, face toward +Z,
 * hanging loop at the top. userData.loop = centre of the loop's hole.
 */
export function buddedCrossGeometry({ height = 2.6, width = 1.7, arm = 0.12, thick = 0.085, h = 0.01 } = {}) {
  return memo(`buddedCross:${height}:${width}:${arm}:${thick}:${h}`, () => {
    const Lt = width / 2, Lb = height - Lt, Ls = width / 2;
    const arms = [[0, 1, Lt], [0, -1, Lb], [1, 0, Ls], [-1, 0, Ls]];
    const loop = [0, Lt + 0.08], loopR = 0.075, loopW = 0.03;
    const bump = (u) => Math.max(0, 1 - u * u);
    const dome = (u) => Math.sqrt(Math.max(0, 1 - u * u));
    const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

    // 2D outline distance
    const outline = (x, y) => {
      let d = Math.hypot(x, y) - 0.2; // round medallion at the crossing
      for (const [dx, dy, L] of arms) {
        const ex = dx * (L - 0.2), ey = dy * (L - 0.2);
        const t = Math.min(1, Math.max(0, (x * ex + y * ey) / (ex * ex + ey * ey)));
        d = smin(d, Math.hypot(x - ex * t, y - ey * t) - arm * (0.85 + 0.25 * t), 0.08);
        // bud: a round end lobe with two smaller lobes either side of it
        const nx = -dy, ny = dx;
        d = smin(d, Math.hypot(x - dx * (L - 0.15), y - dy * (L - 0.15)) - 0.15, 0.05);
        for (const k of [-1, 1]) d = smin(d, Math.hypot(x - dx * (L - 0.31) - k * nx * 0.12, y - dy * (L - 0.31) - k * ny * 0.12) - 0.1, 0.05);
      }
      return smin(d, Math.abs(Math.hypot(x - loop[0], y - loop[1]) - loopR) - loopW, 0.02);
    };
    // raised work on the faces (height above the pillowed face)
    const relief = (x, y, front) => {
      let r = 0;
      for (const [dx, dy, L] of arms) {
        const nx = -dy, ny = dx;
        const s = x * dx + y * dy, t = x * nx + y * ny;
        // a running vine down the middle of the arm, with a leaf in every bend
        const fade = ss(0.22, 0.3, s) * (1 - ss(L - 0.46, L - 0.38, s));
        if (fade > 0) {
          const per = 0.34, w = (2 * Math.PI) / per;
          const t0 = 0.034 * Math.sin(w * (s - 0.22));
          r = Math.max(r, 0.02 * fade * bump(Math.abs(t - t0) / (0.02 / Math.sqrt(1 + (0.034 * w * Math.cos(w * (s - 0.22))) ** 2))));
          const ph = (s - 0.22) / per, c = Math.floor(ph);
          for (const [off, side] of [[0.25, -1], [0.75, 1]]) {
            const ls = s - (0.22 + (c + off) * per), lt = t - side * 0.062;
            r = Math.max(r, 0.017 * fade * dome(Math.hypot(ls / 0.05, lt / 0.021)));
          }
        }
        // a domed end lobe ringed by a fine bead, and a bead on each side lobe
        const q = Math.hypot(x - dx * (L - 0.15), y - dy * (L - 0.15));
        r = Math.max(r, 0.03 * dome(q / 0.1), 0.014 * bump(Math.abs(q - 0.115) / 0.014));
        for (const k of [-1, 1]) r = Math.max(r, 0.024 * dome(Math.hypot(x - dx * (L - 0.31) - k * nx * 0.12, y - dy * (L - 0.31) - k * ny * 0.12) / 0.045));
      }
      // ring around the medallion
      r = Math.max(r, 0.016 * bump(Math.abs(Math.hypot(x, y) - 0.178) / 0.018));
      if (front) {
        // four-petal rosette on the diagonals and the round boss
        for (let k = 0; k < 4; k++) {
          const ang = Math.PI / 4 + (k * Math.PI) / 2, ux = Math.cos(ang), uy = Math.sin(ang);
          const px = x - ux * 0.088, py = y - uy * 0.088;
          const pu = px * ux + py * uy, pv = -px * uy + py * ux;
          r = Math.max(r, 0.05 * dome(Math.hypot(pu / 0.075, pv / 0.052)));
        }
        r = Math.max(r, 0.085 * dome(Math.hypot(x, y) / 0.056));
      }
      return r;
    };
    // sample the 2D fields once on a fine grid, then the 3D field is cheap
    const g = 0.004, x0 = -Ls - 0.08, y0 = -Lb - 0.08, nx = Math.ceil((2 * Ls + 0.16) / g) + 1, ny = Math.ceil((Lb + Lt + 0.35) / g) + 1;
    const D = new Float32Array(nx * ny), RF = new Float32Array(nx * ny), RB = new Float32Array(nx * ny);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const x = x0 + i * g, y = y0 + j * g, k = i + nx * j;
      const d = outline(x, y);
      D[k] = d;
      if (d < 0) {
        const inside = ss(0, 0.03, -d), rim = 0.012 * bump((-d - 0.035) / 0.012); // fine raised border
        RF[k] = Math.max(relief(x, y, true) * inside, rim);
        RB[k] = Math.max(relief(x, y, false) * inside, rim);
      }
    }
    const sample = (A, x, y) => {
      const fx = (x - x0) / g, fy = (y - y0) / g;
      if (fx < 0 || fy < 0 || fx >= nx - 1 || fy >= ny - 1) return A === D ? 1 : 0;
      const i = Math.floor(fx), j = Math.floor(fy), u = fx - i, v = fy - j, k = i + nx * j;
      return (A[k] * (1 - u) + A[k + 1] * u) * (1 - v) + (A[k + nx] * (1 - u) + A[k + nx + 1] * u) * v;
    };
    const f = (x, y, z) => {
      const d = sample(D, x, y);
      if (d > 0.1) return d;
      const zt = thick * (0.62 + 0.38 * Math.min(1, Math.max(0, -d) / 0.09)); // pillowed: thicker towards the middle
      return smax(d, Math.abs(z) - zt - sample(z > 0 ? RF : RB, x, y), 0.04);
    };
    const geo = meshSDF(f, [x0 + 0.02, y0 + 0.02, -thick - 0.06], [Ls + 0.06, Lt + 0.25, thick + 0.15], h);
    geo.userData.loop = loop;
    return geo;
  });
}

export function buddedCross({ material = chrome(0.05), ...opts } = {}) {
  const grp = new THREE.Group();
  grp.name = 'cross';
  const geo = buddedCrossGeometry(opts);
  const body = new THREE.Mesh(geo, material);
  body.name = 'crossBody';
  grp.add(body);
  grp.userData.loop = new THREE.Vector3(geo.userData.loop[0], geo.userData.loop[1], 0);
  return grp;
}
