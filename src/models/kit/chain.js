/**
 * Chain construction kit.
 *  - linkGeometry(): one link (rolo ring, cable/paperclip oval, flat diamond-cut curb)
 *  - chainAlong():   instances that link along any curve, so a whole chain costs 1 draw call
 *  - loop helpers:   curves for bracelets (around a wrist) and necklaces (draped on a neck)
 *
 * Units are centimetres. Y is up. For bracelets the wrist axis is Y and the front is +Z.
 */
import * as THREE from 'three';

const geoCache = new Map();

/** Closed stadium (rounded-rectangle) centre-line for a link; long axis = X, link plane = XY. */
class StadiumCurve extends THREE.Curve {
  constructor(length, width) {
    super();
    this.r = width / 2;
    this.s = Math.max(0, length - width); // straight section
  }
  getPoint(t, target = new THREE.Vector3()) {
    const { r, s } = this;
    const per = 2 * s + 2 * Math.PI * r;
    let d = t * per;
    // start at the middle of the top straight, run clockwise
    const half = s / 2;
    if (d < half) return target.set(d, r, 0);
    d -= half;
    if (d < Math.PI * r) { const a = d / r; return target.set(half + Math.sin(a) * r, Math.cos(a) * r, 0); }
    d -= Math.PI * r;
    if (d < s) return target.set(half - d, -r, 0);
    d -= s;
    if (d < Math.PI * r) { const a = d / r; return target.set(-half - Math.sin(a) * r, -Math.cos(a) * r, 0); }
    d -= Math.PI * r;
    return target.set(-half + d, r, 0);
  }
}

/**
 * One chain link.
 * @param {object} o
 * @param {number} o.length  outer centre-line length (cm)
 * @param {number} o.width   outer centre-line width (cm); length === width → round rolo ring
 * @param {number} o.wire    wire radius (cm)
 * @param {number} [o.squash=1]  scale of the wire across the link plane (<1 = flat link)
 * @param {number} [o.cut=0]     0..1 diamond-cut: shaves both faces flat (curb / cuban)
 * @param {number} [o.twist=0]   radians of twist end-to-end (curb links)
 */
export function linkGeometry({ length, width, wire, squash = 1, cut = 0, twist = 0, tubular = 64, radial = 12 }) {
  const key = JSON.stringify(arguments[0]);
  if (geoCache.has(key)) return geoCache.get(key);

  const curve = new StadiumCurve(length, width);
  const g = new THREE.TubeGeometry(curve, tubular, wire, radial, true);
  const pos = g.attributes.position;
  const nor = g.attributes.normal;
  const p = new THREE.Vector3(), n = new THREE.Vector3();
  const limit = wire * squash * (1 - cut);
  const halfLen = length / 2;

  for (let i = 0; i < pos.count; i++) {
    p.fromBufferAttribute(pos, i);
    n.fromBufferAttribute(nor, i);
    // flatten across the link plane
    p.z *= squash;
    n.z /= squash; n.normalize();
    // diamond cut: clamp to two flat faces with crisp normals
    if (cut > 0 && Math.abs(p.z) > limit) {
      p.z = Math.sign(p.z) * limit;
      n.set(0, 0, Math.sign(p.z));
    }
    // twist about the long axis
    if (twist) {
      const a = twist * (p.x / halfLen) * 0.5;
      const c = Math.cos(a), s = Math.sin(a);
      const y = p.y * c - p.z * s, z = p.y * s + p.z * c;
      p.y = y; p.z = z;
      const ny = n.y * c - n.z * s, nz = n.y * s + n.z * c;
      n.y = ny; n.z = nz;
    }
    pos.setXYZ(i, p.x, p.y, p.z);
    nor.setXYZ(i, n.x, n.y, n.z);
  }
  g.computeBoundingSphere();
  geoCache.set(key, g);
  return g;
}

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _roll = new THREE.Quaternion();
const _X = new THREE.Vector3(1, 0, 0);

/**
 * Lay a link geometry along a curve as an InstancedMesh.
 * @param {THREE.Curve} curve
 * @param {object} o
 * @param {THREE.BufferGeometry} o.geometry
 * @param {THREE.Material} o.material
 * @param {number} o.pitch       distance between link centres (cable: length - 2*wire)
 * @param {number} [o.alternate] roll added per link (cable/rolo: PI/2, curb: 0)
 * @param {number} [o.roll]      constant roll offset
 * @param {number} [o.zigzag]    roll alternating +/- per link, so flat curb links overlap and interlock
 * @param {number[]} [o.at]      explicit arc-length fractions, one per link (overrides pitch/count)
 * @param {(p:THREE.Vector3,u:number)=>THREE.Vector3} [o.up] direction the link faces (its plane normal)
 * @param {number} [o.u0=0] [o.u1=1]  portion of the curve (arc-length fraction)
 * @param {number} [o.scaleJitter=0]
 */
export function chainAlong(curve, { geometry, material, pitch, alternate = Math.PI / 2, roll = 0, up, u0 = 0, u1 = 1, offset = 0.5, count: forced, at = null, zigzag = 0, name = 'chain' }) {
  const len = curve.getLength() * (u1 - u0);
  const count = at ? at.length : forced ?? Math.max(1, Math.round(len / pitch));
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  mesh.name = name;
  const p = new THREE.Vector3(), T = new THREE.Vector3(), N = new THREE.Vector3(), B = new THREE.Vector3();
  const basis = new THREE.Matrix4();
  for (let i = 0; i < count; i++) {
    const u = at ? at[i] : u0 + ((i + offset) / count) * (u1 - u0);
    curve.getPointAt(u, p);
    curve.getTangentAt(u, T);
    const upv = up ? up(p, u) : new THREE.Vector3(0, 1, 0);
    N.copy(upv).addScaledVector(T, -upv.dot(T)).normalize();
    B.crossVectors(N, T); // local Y
    basis.makeBasis(T, B, N); // X → tangent, Y → binormal, Z → link-plane normal
    _q.setFromRotationMatrix(basis);
    _roll.setFromAxisAngle(_X, roll + i * alternate + (i % 2 ? zigzag : -zigzag)); // zigzag: curb links tilt alternately
    _q.multiply(_roll);
    _m.compose(p, _q, new THREE.Vector3(1, 1, 1));
    mesh.setMatrixAt(i, _m);
  }
  mesh.instanceMatrix.needsUpdate = true;
  mesh.computeBoundingSphere();
  return mesh;
}

/** Smooth curve from a parametric function sampled n times. */
export function curveFrom(fn, n = 160, closed = false) {
  const pts = [];
  const steps = closed ? n : n - 1;
  for (let i = 0; i < n; i++) pts.push(fn(i / steps));
  return new THREE.CatmullRomCurve3(pts, closed, 'centripetal');
}

/**
 * Point on an elliptical wrist loop. theta = 0 is the front (+Z), increasing clockwise seen from above.
 */
export function wristPoint(theta, { rx = 3.1, rz = 2.7, y = 0, inflate = 0 } = {}) {
  return new THREE.Vector3(Math.sin(theta) * (rx + inflate), y, Math.cos(theta) * (rz + inflate));
}

/** Outward radial direction for bracelet links (they lie flat on the wrist). */
export const radialUp = (p) => new THREE.Vector3(p.x, 0, p.z).normalize();

/**
 * Necklace drape: a loop around the neck (radius r) that falls into a V/U at the front.
 * theta = 0 is the front low point.
 */
export function neckPoint(theta, { r = 6.4, drop = 10.5, depth = 1, sharp = 2.2, y = 0, inflate = 0 } = {}) {
  const front = Math.pow((1 + Math.cos(theta)) / 2, sharp); // 1 at front, 0 at back
  return new THREE.Vector3(
    Math.sin(theta) * (r + inflate) * (1 - 0.12 * front),
    y - drop * front,
    Math.cos(theta) * (r + inflate) * depth * (1 - 0.55 * front) + front * 1.2,
  );
}

/** Necklace links face forward-ish (lie on the chest) with a bit of radial roll. */
export const neckUp = (p) => new THREE.Vector3(p.x * 0.6, 0.15, Math.max(0.4, p.z)).normalize();

/** A chain that hangs under gravity between two points (simple catenary-like sag). */
export function hangCurve(a, b, sag = 0.6) {
  return curveFrom((t) => {
    const p = a.clone().lerp(b, t);
    p.y -= Math.sin(Math.PI * t) * sag;
    return p;
  }, 24);
}

/** Wrap a second curve helically around a base curve (fine chain woven through a cable chain). */
export function helixAround(base, { radius = 0.18, turns = 20, u0 = 0, u1 = 1, n = 400, phase = 0 } = {}) {
  const frames = base.computeFrenetFrames(n, base.closed);
  return curveFrom((t) => {
    const u = u0 + (u1 - u0) * t;
    const i = Math.min(n, Math.round(u * n));
    const a = phase + t * turns * Math.PI * 2;
    return base.getPointAt(u)
      .addScaledVector(frames.normals[i], Math.cos(a) * radius)
      .addScaledVector(frames.binormals[i], Math.sin(a) * radius);
  }, n);
}
