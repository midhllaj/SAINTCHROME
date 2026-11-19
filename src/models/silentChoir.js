/**
 * SILENT CHOIR — wired chrome earphones (USB-C), modelled at real scale in millimetres
 * from public/reference/earphones/chrome-wired-usbc.png (EarPods-style form).
 *
 *  - head: one sculpted surface (signed-distance shape meshed with surface nets): a smooth chrome
 *    dome with a small pill vent on its outer face, an oval speaker nozzle out of the side with a
 *    perforated graphite grille in its recessed end, and the stem rising up the back as a spine;
 *    a hidden driver comes out of the nozzle in the exploded view
 *  - stem: long, nearly straight, seam line, mic slot, bevelled end and the narrower chrome collar
 *    the cable leaves from (as in the reference photo)
 *  - cables at real EarPods lengths: ~33 cm from each bud to the chrome Y-splitter (the inline
 *    remote sits on the right bud's lead, ~16 cm below the bud) and ~75 cm from the splitter to
 *    the USB-C plug. They lie on the table in loose curves; wherever a cable crosses another
 *    one it drapes over it (heights are solved, so nothing intersects)
 *  - remote: chrome + / − ends around a darker centre button, chrome collars, side mic hole
 *  - USB-C plug: bevelled moulded housing, hollow chrome shell, recessed insulator
 * * Everything lies on a table at y = 0 (the studio's contact shadow sits there).
 * Units: mm, scaled to the site's cm at the end. Tweak PARAMS; /lab.html?m=silentChoir hot-reloads.
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { roughnessNoise } from './kit/materials.js';
import { meshSDF } from './kit/sdf.js';

export const PARAMS = {
  // head (bud space, see earbud()): an ellipsoid dome, an oval speaker nozzle out of its side and
  // the stem's spine running up its back; mesh = sculpt resolution in mm
  head: {
    rx: 9.0, ry: 9.0, rz: 7.4, mesh: 0.2,
    nozzle: { dir: [1, -0.04, 0.42], length: 11.2, tall: 4.6, wide: 3.5, round: 1.3, blend: 2.6, lip: 0.9, recess: 0.8 },
    spine: { x: 1.6, points: [[1.6, -12.5, -4.4], [1.6, -6.2, -4.6], [1.15, 0, -7.0], [0.6, 6.0, -5.6]], radii: [2.12, 2.3, 2.0, 1.25], blend: 2.4 },
    vent: { at: [-5.6, 0.4, 5.6], length: 4.0, width: 1.8 },
  },
  stem: { at: [1.6, -9, -4.4], axis: [0, -1, 0], length: 28, radius: 2.2, radiusEnd: 2.08, collar: { radius: 1.72, length: 4.7 } },
  cable: { radius: 1.0, color: '#9a9ea5', remoteAt: 160 }, // remote: ~mm along the right lead from the bud (±2 cm)
  remote: { length: 34, thick: 4.6, width: 7.0 },
  plug: { type: 'usb-c', width: 8.8, thick: 5.0 },   // type: 'usb-c' | 'lightning'
  // where things lie on the table (x, z in mm; the camera looks from +z). Each cable follows a
  // rough route that gets a soft lateral wave whose size is solved so the cable comes out at its
  // real length (EarPods: ~330 mm bud → splitter, ~750 mm splitter → plug).
  layout: {
    budA: { x: -12, z: 66, yaw: 1.05, roll: 0.35 },    // outer face up: dome, pill vent, side nozzle
    budB: { x: 30, z: 50, yaw: -1.0, roll: 2.7 },     // turned over: the spine up the back shows; carries the remote
    focus: [18, 22], frameRadius: 85,                // viewers aim here (x, z) and frame this radius round it
    splitter: { at: [0, -205], yaw: 0 },
    plug: { at: [95, 45], yaw: -0.93 },               // tip toward the front-left
    leadA: { route: [[-66, 22], [-62, -50], [-38, -120], [-25, -170]], length: 330, waves: 1.6, phase: 0.4 },
    leadB: { route: [[45, -20], [38, -80], [16, -125], [14, -165]], length: 330, waves: 1.2, phase: 3.4 },
    main: { route: [[-20, -240], [10, -290], [100, -305], [190, -265], [235, -170], [230, -70], [195, 10], [150, 45]], length: 750, waves: 2.2, phase: 1.1 },
  },
};
/* ---------------- materials ---------------- */
const M = {};
function mats() {
  if (M.chrome) return M;
  const rough = roughnessNoise();
  M.chrome = new THREE.MeshPhysicalMaterial({
    name: 'MirrorChrome', color: 0xe8e8ea, metalness: 1, roughness: 0.1, roughnessMap: rough,
    clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.2,
  });
  M.moulded = new THREE.MeshPhysicalMaterial({
    name: 'MouldedChrome', color: 0xdedfe2, metalness: 1, roughness: 0.2, roughnessMap: rough,
    clearcoat: 0.8, clearcoatRoughness: 0.12, envMapIntensity: 1.1,
  });
  const perf = perforation();
  M.grille = new THREE.MeshPhysicalMaterial({
    name: 'GraphiteMesh', color: 0x34363b, map: perf.color, normalMap: perf.normal, normalScale: new THREE.Vector2(1.1, 1.1),
    metalness: 0.9, roughness: 0.4, envMapIntensity: 0.9,
  });
  M.graphite = new THREE.MeshPhysicalMaterial({ name: 'Graphite', color: 0x1b1c1f, metalness: 0.6, roughness: 0.4, envMapIntensity: 0.8 });
  M.hole = new THREE.MeshStandardMaterial({ name: 'Hole', color: 0x050506, roughness: 0.8, polygonOffset: true, polygonOffsetFactor: -2 });
  M.rubber = new THREE.MeshPhysicalMaterial({
    name: 'SatinRubber', color: new THREE.Color(PARAMS.cable.color), metalness: 0.2, roughness: 0.45, roughnessMap: rough,
    sheen: 0.6, sheenRoughness: 0.5, sheenColor: new THREE.Color(0xffffff), envMapIntensity: 0.85,
  });
  M.insulator = new THREE.MeshPhysicalMaterial({ name: 'Insulator', color: 0x141416, roughness: 0.5, metalness: 0 });
  M.cone = new THREE.MeshPhysicalMaterial({ name: 'DriverCone', color: 0x232428, roughness: 0.62, metalness: 0.1, sheen: 0.4, sheenColor: new THREE.Color(0x888888) });
  return M;
}

/** Fine hex-staggered perforations: colour map (dark holes) + normal map (hole rims). */
function perforation() {
  const N = 512, cols = 32, rows = 36, pitchX = N / cols, pitchY = N / rows, hole = 5.2;
  const h = new Float32Array(N * N).fill(1);
  for (let j = 0; j < rows; j++) for (let i = 0; i <= cols; i++) {
    const cx = i * pitchX + (j % 2 ? pitchX / 2 : 0), cy = j * pitchY + pitchY / 2;
    for (let y = Math.floor(cy - hole - 2); y <= cy + hole + 2; y++) for (let x = Math.floor(cx - hole - 2); x <= cx + hole + 2; x++) {
      const d = Math.hypot(x - cx, y - cy);
      const v = THREE.MathUtils.smoothstep(d, hole - 1.4, hole + 0.6);
      const k = (((y % N) + N) % N) * N + (((x % N) + N) % N);
      h[k] = Math.min(h[k], v);
    }
  }
  const mk = () => { const c = document.createElement('canvas'); c.width = c.height = N; return c; };
  const cc = mk(), nc = mk();
  const ci = cc.getContext('2d').createImageData(N, N), ni = nc.getContext('2d').createImageData(N, N);
  const at = (x, y) => h[((y + N) % N) * N + ((x + N) % N)];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const o = (y * N + x) * 4, v = h[y * N + x];
    const g = Math.round(18 + v * 190);
    ci.data[o] = ci.data[o + 1] = ci.data[o + 2] = g; ci.data[o + 3] = 255;
    const dx = (at(x + 1, y) - at(x - 1, y)) * 2.5, dy = (at(x, y + 1) - at(x, y - 1)) * 2.5;
    const len = Math.hypot(dx, dy, 1);
    ni.data[o] = Math.round((-dx / len * 0.5 + 0.5) * 255);
    ni.data[o + 1] = Math.round((dy / len * 0.5 + 0.5) * 255);
    ni.data[o + 2] = Math.round((1 / len * 0.5 + 0.5) * 255);
    ni.data[o + 3] = 255;
  }
  cc.getContext('2d').putImageData(ci, 0, 0);
  nc.getContext('2d').putImageData(ni, 0, 0);
  const color = new THREE.CanvasTexture(cc); color.colorSpace = THREE.SRGBColorSpace; color.anisotropy = 8;
  const normal = new THREE.CanvasTexture(nc); normal.anisotropy = 8;
  return { color, normal };
}

/* ---------------- helpers ---------------- */
const V = (x, y) => new THREE.Vector2(x, y);
const mesh = (geo, mat, name) => { const m = new THREE.Mesh(geo, mat); if (name) m.name = name; return m; };
/** Lathe from a profile listed top → bottom (reversed so normals face outwards). */
const lathe = (topToBottom, seg = 96) => new THREE.LatheGeometry(topToBottom.slice().reverse(), seg);
/** Mark a part for the exploded view: it slides by `offset` (parent-local) as the view opens. */
const explode = (obj, offset) => { obj.userData.base = obj.position.toArray(); obj.userData.explode = offset; return obj; };
const anchor = (parent, name, pos) => { const o = new THREE.Object3D(); o.name = name; o.position.set(...pos); parent.add(o); return o; };

/* ---------------- earbud ----------------
 * EarPods form, from public/reference/earphones/chrome-wired-usbc.png. Bud space (mm):
 * head centre at the origin, +Z = outer face (the smooth dome with the small pill vent),
 * ±X = the side the oval speaker nozzle points to (side = +1 / −1 mirrors left / right bud),
 * −Y = down the stem. The stem sits behind the head and runs up its back as a raised spine.
 * The head is one smooth signed-distance shape (dome ∪ nozzle ∪ stem spine, blended, minus the
 * speaker recess) meshed with surface nets, so the joins flow like a moulded part.
 */
const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
const smax = (a, b, k) => -smin(-a, -b, k);
const norm3 = (v) => { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; };
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

function sdEllipsoid(x, y, z, rx, ry, rz) {
  const k0 = Math.hypot(x / rx, y / ry, z / rz), k1 = Math.hypot(x / (rx * rx), y / (ry * ry), z / (rz * rz));
  return k1 < 1e-9 ? -Math.min(rx, ry, rz) : (k0 * (k0 - 1)) / k1;
}
/** Round cone (capsule with different end radii) from a (radius r1) to b (radius r2). */
function roundCone(a, b, r1, r2) {
  const ba = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], l2 = dot3(ba, ba), rr = r1 - r2, a2 = l2 - rr * rr, il2 = 1 / l2;
  return (x, y, z) => {
    const px = x - a[0], py = y - a[1], pz = z - a[2];
    const yy = px * ba[0] + py * ba[1] + pz * ba[2], zz = yy - l2;
    const qx = px * l2 - ba[0] * yy, qy = py * l2 - ba[1] * yy, qz = pz * l2 - ba[2] * yy;
    const x2 = qx * qx + qy * qy + qz * qz, y2 = yy * yy * l2, z2 = zz * zz * l2, k = Math.sign(rr) * rr * rr * x2;
    if (Math.sign(zz) * a2 * z2 > k) return Math.sqrt(x2 + z2) * il2 - r2;
    if (Math.sign(yy) * a2 * y2 < k) return Math.sqrt(x2 + y2) * il2 - r1;
    return (Math.sqrt(x2 * a2 * il2) + yy * rr) * il2 - r1;
  };
}

/** Frame of the speaker nozzle: n = axis, v = tall axis of its oval, w = short axis. */
function nozzleFrame(H, side) {
  const N = H.nozzle, n = norm3([side * N.dir[0], N.dir[1], N.dir[2]]);
  const up = [0, 1, 0], d = dot3(up, n);
  const v = norm3([up[0] - n[0] * d, up[1] - n[1] * d, up[2] - n[2] * d]);
  return { n, v, w: cross3(n, v) };
}

/** Signed distance to the head (+ the top of the stem), in bud space. */
function headSDF(P, side) {
  const H = P.head, N = H.nozzle, S = H.spine;
  const { n, v, w } = nozzleFrame(H, side);
  const a1 = N.tall - N.round, b1 = N.wide - N.round, mn = Math.min(a1, b1);
  const ar = N.tall - N.lip, br = N.wide - N.lip, mr = Math.min(ar, br);
  const sx = side * S.x;
  const pts = S.points.map(([px, py, pz]) => [side * px, py, pz]);
  const cones = [];
  for (let i = 0; i < pts.length - 1; i++) cones.push(roundCone(pts[i], pts[i + 1], S.radii[i], S.radii[i + 1]));
  return (x, y, z) => {
    let d = sdEllipsoid(x, y, z, H.rx, H.ry, H.rz);
    // speaker nozzle: an oval post from the centre out along n, with rounded edges
    const u = x * n[0] + y * n[1] + z * n[2], pv = x * v[0] + y * v[1] + z * v[2], pw = x * w[0] + y * w[1] + z * w[2];
    const de = (Math.hypot(pv / a1, pw / b1) - 1) * mn;
    const du = Math.max(u - (N.length - N.round), -u);
    const nz = Math.hypot(Math.max(de, 0), Math.max(du, 0)) + Math.min(Math.max(de, du), 0) - N.round;
    d = smin(d, nz, N.blend);
    // stem rising up the back as a spine
    let s = cones[0](x, y, z);
    for (let i = 1; i < cones.length; i++) s = smin(s, cones[i](x, y, z), 0.9);
    d = smin(d, s, S.blend);
    // shallow oval recess in the nozzle end, where the grille sits
    const dr = Math.max((Math.hypot(pv / ar, pw / br) - 1) * mr, N.length - N.recess - u);
    return smax(d, -dr, 0.35);
  };
}

/** Project a point onto the head surface (a few Newton steps along the field gradient). */
function onSurface(f, p) {
  const e = 0.01;
  let [x, y, z] = p;
  let g = [0, 0, 1];
  for (let it = 0; it < 8; it++) {
    g = [f(x + e, y, z) - f(x - e, y, z), f(x, y + e, z) - f(x, y - e, z), f(x, y, z + e) - f(x, y, z - e)].map((c) => c / (2 * e));
    const g2 = dot3(g, g), s = f(x, y, z) / g2;
    x -= s * g[0]; y -= s * g[1]; z -= s * g[2];
  }
  return { p: new THREE.Vector3(x, y, z), n: new THREE.Vector3(...norm3(g)) };
}

/** Pill-shaped vent decal draped over the dome (a ribbon grid, each vertex snapped to the surface). */
function ventGeometry(f, centre, along, len, width) {
  const c = onSurface(f, centre);
  const t = new THREE.Vector3(...along).projectOnPlane(c.n).normalize();
  const b = new THREE.Vector3().crossVectors(c.n, t);
  const r = width / 2, NX = 24, NY = 6, pos = [], nrm = [], idx = [];
  for (let i = 0; i <= NX; i++) {
    const s = (i / NX - 0.5) * len, ax = Math.abs(s), end = len / 2 - r;
    const half = ax <= end ? r : r * Math.sqrt(Math.max(0, 1 - ((ax - end) / r) ** 2));
    for (let j = 0; j <= NY; j++) {
      const q = c.p.clone().addScaledVector(t, s).addScaledVector(b, (j / NY - 0.5) * 2 * half);
      const sp = onSurface(f, q.toArray());
      sp.p.addScaledVector(sp.n, 0.03);
      pos.push(...sp.p.toArray()); nrm.push(...sp.n.toArray());
    }
  }
  for (let i = 0; i < NX; i++) for (let j = 0; j < NY; j++) {
    const a = i * (NY + 1) + j, bb = a + NY + 1;
    idx.push(a, bb, a + 1, a + 1, bb, bb + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  g.setIndex(idx);
  // make sure the decal faces outward
  const tri = new THREE.Triangle(new THREE.Vector3(...pos.slice(0, 3)), new THREE.Vector3(...pos.slice((NY + 1) * 3, (NY + 1) * 3 + 3)), new THREE.Vector3(...pos.slice(3, 6)));
  if (tri.getNormal(new THREE.Vector3()).dot(c.n) < 0) { for (let i = 0; i < idx.length; i += 3) [idx[i + 1], idx[i + 2]] = [idx[i + 2], idx[i + 1]]; g.setIndex(idx); }
  return g;
}

const headCache = new Map();
/** Head mesh for the +X bud (mirrored for the other one). Cached: meshing takes a moment. */
function headGeometry(P, side) {
  const key = JSON.stringify(P.head) + side;
  if (headCache.has(key)) return headCache.get(key);
  let geo;
  if (side < 0) {
    geo = headGeometry(P, 1).clone();
    geo.scale(-1, 1, 1); // mirror (normals follow); flip the winding back
    const ix = geo.index.array;
    for (let i = 0; i < ix.length; i += 3) { const t = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = t; }
    geo.index.needsUpdate = true;
  } else {
    const H = P.head, m = 1.2;
    const bottom = Math.min(...H.spine.points.map((p) => p[1])) - Math.max(...H.spine.radii) - m;
    geo = meshSDF(headSDF(P, 1), [-H.rx - m, bottom, -H.rz - 3], [H.nozzle.length + m + 1, H.ry + m, H.rz + m], H.mesh);
  }
  headCache.set(key, geo);
  return geo;
}

function earbud(P, name, side = 1) {
  const m = mats();
  const H = P.head, N = H.nozzle;
  const f = headSDF(P, side);
  const bud = new THREE.Group();
  bud.name = name;

  const head = new THREE.Group();
  head.name = 'headAssembly';
  head.add(mesh(headGeometry(P, side), m.chrome, 'head'));

  // speaker: a frame whose +Y is the nozzle axis (the exploded view slides parts along it)
  const { n, v, w } = nozzleFrame(H, side);
  const spk = new THREE.Group();
  spk.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(...w), new THREE.Vector3(...n), new THREE.Vector3(...v)));
  head.add(spk);
  const floor = N.length - N.recess;
  const oval = (tall, wide, seg = 72) => {
    const g = new THREE.CircleGeometry(1, seg);
    g.rotateX(-Math.PI / 2);
    g.scale(wide, 1, tall);
    const p = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / 9 + 0.5, p.getZ(i) / 9 + 0.5); // round holes
    return g;
  };
  const cavity = mesh(oval(N.tall - N.lip - 0.05, N.wide - N.lip - 0.05), m.graphite);
  cavity.position.y = floor + 0.01;
  spk.add(cavity);
  const grille = mesh(oval(N.tall - N.lip - 0.06, N.wide - N.lip - 0.06), m.grille, 'grille');
  grille.position.y = floor + 0.04;
  spk.add(explode(grille, [0, 10, 0]));
  grille.userData.explodeFace = 0.7; // turns 70% of the way toward the camera as it flies out
  anchor(grille, 'focus-grille', [0, 0.05, 0]);

  // driver: hidden in the head until the exploded view pulls it out of the nozzle
  const driver = new THREE.Group();
  driver.name = 'driver';
  driver.position.y = floor - 2.6;
  driver.scale.setScalar(0.66);
  const basket = mesh(new THREE.CylinderGeometry(4.55, 4.3, 1.1, 96), m.graphite);
  const surround = mesh(new THREE.TorusGeometry(4.1, 0.28, 16, 96), m.cone);
  surround.rotation.x = Math.PI / 2;
  surround.position.y = 0.6;
  const cone = mesh(lathe([V(0.001, 0.95), V(1.6, 0.85), V(3.9, 0.55)], 96), m.cone);
  const dome = mesh(new THREE.SphereGeometry(1.7, 48, 16, 0, Math.PI * 2, 0, 0.9), m.chrome);
  dome.position.y = -0.2;
  driver.add(basket, surround, cone, dome);
  anchor(driver, 'label-driver', [3.9, 0.6, 0]);
  spk.add(explode(driver, [0, 5.5, 0]));
  driver.userData.explodeFace = 0.7;

  // small pill vent on the outer dome, on the side away from the nozzle
  const vent = mesh(ventGeometry(f, [side * H.vent.at[0], H.vent.at[1], H.vent.at[2]], [1, 0, 0], H.vent.length, H.vent.width), m.hole, 'vent');
  head.add(vent);
  anchor(head, 'label-shell', [-side * 7.5, -2.5, 3]);
  bud.add(explode(head, [0, 4.5, 3]));

  // stem: continues the spine down from behind the head; long, very slightly tapered, seam line,
  // bevelled end and the narrower chrome collar the cable leaves from (as in the photo)
  const L = P.stem.length, r0 = P.stem.radius, r1 = P.stem.radiusEnd;
  const stemPts = [
    V(0.001, 0), V(r0, 0), V(r0, -8), V(r1 + 0.04, -L + 4.0), V(r1 - 0.08, -L + 3.9), V(r1 - 0.08, -L + 3.7), V(r1 + 0.02, -L + 3.6), // seam
    V(r1, -L + 0.5), V(r1 - 0.08, -L + 0.18), V(r1 - 0.2, -L + 0.03), V(r1 - 0.36, -L), V(0.001, -L),                            // bevelled end
  ];
  const stem = new THREE.Group();
  stem.name = 'stem';
  stem.position.set(side * P.stem.at[0], P.stem.at[1], P.stem.at[2]);
  stem.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), new THREE.Vector3(...P.stem.axis).normalize());
  stem.add(mesh(lathe(stemPts, 96), m.chrome, 'stemBody'));
  const mic = mesh(new THREE.CircleGeometry(0.38, 24), m.hole);
  mic.scale.set(1, 2.4, 1);
  mic.position.set(0, -L + 2.2, r1 + 0.03);
  stem.add(mic);
  const C = P.stem.collar;
  stem.add(mesh(lathe([
    V(C.radius, -L + 0.4), V(C.radius, -L - C.length + 0.3), V(C.radius - 0.06, -L - C.length + 0.1), V(C.radius - 0.2, -L - C.length),
    V(1.05, -L - C.length - 0.05), V(0.001, -L - C.length - 0.05),
  ], 48), m.chrome, 'relief'));
  anchor(stem, 'cableOut', [0, -L - C.length + 0.4, 0]);
  anchor(stem, 'cableDir', [0, -L - C.length - 6, 0]);
  bud.add(stem);
  return bud;
}

/** Lay a bud on the table: find the tilt where head and strain relief both touch y = 0. */
function layDown(bud, P, { x, z, yaw, roll }) {
  const sL = new THREE.Vector3(...P.stem.axis).normalize();
  const fL = new THREE.Vector3(0, 0, 1).addScaledVector(sL, -sL.z).normalize();
  const Ml = new THREE.Matrix4().makeBasis(sL, fL, new THREE.Vector3().crossVectors(sL, fL));
  const Mw = new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0));
  const q0 = new THREE.Quaternion().setFromRotationMatrix(Mw.multiply(Ml.transpose()));
  const qRoll = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), roll);
  const qYaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
  const head = bud.getObjectByName('head'), end = bud.getObjectByName('relief');
  const box = new THREE.Box3();
  const lows = (pitch) => {
    bud.position.set(0, 0, 0);
    bud.quaternion.copy(qYaw).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), pitch)).multiply(qRoll).multiply(q0);
    bud.updateMatrixWorld(true);
    return [box.setFromObject(head, true).min.y, box.setFromObject(end, true).min.y];
  };
  let lo = -0.8, hi = 0.8;
  for (let i = 0; i < 26; i++) {
    const mid = (lo + hi) / 2, [hY, eY] = lows(mid);
    if (hY - eY > 0) lo = mid; else hi = mid;
  }
  const [hY, eY] = lows((lo + hi) / 2);
  bud.position.set(x, -Math.min(hY, eY), z);
  bud.updateMatrixWorld(true);
}

/* ---------------- splitter, remote, plug ---------------- */
function splitter() {
  const geo = lathe([
    V(0.001, 3.6), V(1.6, 3.6), V(1.95, 3.45), V(2.2, 3.1), V(2.38, 2.4), V(2.45, 1.0),
    V(2.45, -1.0), V(2.38, -2.4), V(2.2, -3.1), V(1.95, -3.45), V(1.6, -3.6), V(0.001, -3.6),
  ], 64);
  geo.scale(1.45, 1, 1);         // moulded oval: wide enough for the two cables going in
  geo.rotateX(-Math.PI / 2);     // axis → −Z (the cable runs away from the buds)
  const s = mesh(geo, mats().chrome, 'splitter');
  s.position.y = 2.45;
  return s;
}

function remote(P) {
  const m = mats();
  const g = new THREE.Group();
  g.name = 'remote';
  const { length: L, thick: T, width: W } = P;
  g.add(mesh(new RoundedBoxGeometry(L, T, W, 8, 1.7), m.chrome, 'remoteBody'));
  // darker centre button with + and − marks toward the chrome ends; lifts away in the exploded view
  if (!M.gunmetal) {
    M.gunmetal = new THREE.MeshPhysicalMaterial({
      name: 'Gunmetal', color: 0x9a9da4, metalness: 1, roughness: 0.22, clearcoat: 0.6, clearcoatRoughness: 0.1,
    });
  }
  const cap = new THREE.Group();
  cap.name = 'remoteButtons';
  cap.position.y = T / 2 - 0.12;
  cap.add(mesh(new RoundedBoxGeometry(L * 0.4, 0.5, W * 0.84, 4, 0.22), M.gunmetal));
  const bar = (w, d) => mesh(new RoundedBoxGeometry(w, 0.2, d, 2, 0.08), m.graphite);
  const ph = bar(2.2, 0.32), pv = bar(0.32, 2.2), mi = bar(2.2, 0.32);
  ph.position.set(L * 0.33, 0.14, 0); pv.position.set(L * 0.33, 0.14, 0); mi.position.set(-L * 0.33, 0.14, 0);
  cap.add(ph, pv, mi);
  anchor(cap, 'label-control', [0, 0.4, 0]);
  g.add(explode(cap, [0, 4.5, 0]));
  // mic hole on the side
  const mic = mesh(new THREE.CircleGeometry(0.42, 24), m.hole);
  mic.position.set(-L * 0.36, 0, W / 2 + 0.03);
  g.add(mic);
  // narrow chrome collars at both ends
  const col = lathe([V(0.001, 3.0), V(1.25, 3.0), V(1.32, 2.85), V(1.32, 0.3), V(1.5, 0.05), V(1.5, 0), V(0.001, 0)], 48);
  for (const s of [1, -1]) {
    const c = mesh(col, m.chrome);
    c.rotation.z = s > 0 ? -Math.PI / 2 : Math.PI / 2;
    c.position.x = s * (L / 2 - 0.3);
    g.add(c);
  }
  g.position.y = T / 2;
  return g;
}
function stadium(w, h) {
  const r = h / 2, s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -r);
  s.lineTo(w / 2 - r, -r);
  s.absarc(w / 2 - r, 0, r, -Math.PI / 2, Math.PI / 2, false);
  s.lineTo(-w / 2 + r, r);
  s.absarc(-w / 2 + r, 0, r, Math.PI / 2, Math.PI * 1.5, false);
  return s;
}
function roundRect(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function usbC(P) {
  const m = mats();
  const g = new THREE.Group();
  g.name = 'plug';
  // moulded housing with a generous bevel (local +Z points to the tip)
  const bev = 0.75;
  const housing = mesh(new THREE.ExtrudeGeometry(roundRect(P.width - 2 * bev, P.thick - 2 * bev, 1.0), {
    depth: 14.6, bevelEnabled: true, bevelThickness: 0.8, bevelSize: bev, bevelSegments: 6, curveSegments: 16,
  }), m.moulded, 'housing');
  housing.position.z = -7.3;
  g.add(housing);
  // hollow chrome shell (8.34 × 2.56 mm, like a real connector) with a fine bevel
  const outer = stadium(8.34 - 0.2, 2.56 - 0.2);
  outer.holes.push(stadium(7.7, 1.92));
  const tip = mesh(new THREE.ExtrudeGeometry(outer, {
    depth: 6.6, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.1, bevelSegments: 3, curveSegments: 24,
  }), m.chrome, 'tip');
  tip.position.z = 7.6;
  g.add(tip);
  // recessed insulator with the dark slot
  const ins = mesh(new THREE.ExtrudeGeometry(stadium(7.7, 1.92), { depth: 5.8, bevelEnabled: false, curveSegments: 24 }), m.insulator);
  ins.position.z = 7.6;
  g.add(ins);
  const slot = mesh(new THREE.PlaneGeometry(6.4, 0.7), m.hole);
  slot.position.z = 13.41;
  g.add(slot);
  // strain relief trailing out of the back
  const relief = mesh(lathe([
    V(2.0, 0), V(2.05, -0.8), V(1.9, -2.0), V(1.96, -2.4), V(1.72, -3.4), V(1.6, -4.6), V(1.66, -5.0), V(1.42, -6.0), V(1.26, -7.2), V(0.001, -7.22),
  ], 48), m.rubber);
  relief.rotation.x = Math.PI / 2; // lathe −Y → −Z
  relief.position.z = -8.0;
  g.add(relief);
  anchor(g, 'cableOut', [0, 0, -14.6]);
  anchor(g, 'cableDir', [0, 0, -20]);
  g.position.y = P.thick / 2;
  return g;
}

/**
 * Lightning plug: the same moulded chrome housing, then the flat reversible blade
 * (7.7 × 1.5 mm, 6.7 mm long, rounded tip, a retention notch in each side) with eight gold
 * contacts on a white panel on both faces.
 */
function lightning(P) {
  const m = mats();
  if (!M.gold) {
    M.gold = new THREE.MeshPhysicalMaterial({ name: 'ContactGold', color: 0xe2bd6a, metalness: 1, roughness: 0.22, envMapIntensity: 1.1, polygonOffset: true, polygonOffsetFactor: -2 });
    M.panel = new THREE.MeshPhysicalMaterial({ name: 'ContactPanel', color: 0xe6e7ea, metalness: 0, roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.2, polygonOffset: true, polygonOffsetFactor: -1 });
  }
  const g = new THREE.Group();
  g.name = 'plug';
  const bev = 0.75;
  const housing = mesh(new THREE.ExtrudeGeometry(roundRect(P.width - 2 * bev, P.thick - 2 * bev, 1.0), {
    depth: 14.6, bevelEnabled: true, bevelThickness: 0.8, bevelSize: bev, bevelSegments: 6, curveSegments: 16,
  }), m.moulded, 'housing');
  housing.position.z = -7.3;
  g.add(housing);

  // blade outline in (x = width, y = length), extruded through its thickness
  const W = 7.7, L = 6.7, T = 1.5, rc = 1.3, yn = L - 1.9, rn = 0.42;
  const sh = new THREE.Shape();
  sh.moveTo(-W / 2, 0);
  sh.lineTo(W / 2, 0);
  sh.lineTo(W / 2, yn - rn);
  sh.absarc(W / 2, yn, rn, -Math.PI / 2, Math.PI / 2, true);
  sh.lineTo(W / 2, L - rc);
  sh.quadraticCurveTo(W / 2, L, W / 2 - rc, L);
  sh.lineTo(-W / 2 + rc, L);
  sh.quadraticCurveTo(-W / 2, L, -W / 2, L - rc);
  sh.lineTo(-W / 2, yn + rn);
  sh.absarc(-W / 2, yn, rn, Math.PI / 2, -Math.PI / 2, true);
  sh.lineTo(-W / 2, 0);
  const bladeGeo = new THREE.ExtrudeGeometry(sh, { depth: T - 0.16, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 3, curveSegments: 20 });
  bladeGeo.translate(0, 0, -(T - 0.16) / 2);
  bladeGeo.rotateX(Math.PI / 2); // length → +Z, thickness → Y
  const z0 = 7.9;
  const blade = mesh(bladeGeo, m.chrome, 'tip');
  blade.position.z = z0;
  g.add(blade);
  // contacts: white panel + eight gold pads on each face
  const pitch = 0.78, padW = 0.52, padL = 2.5, zc = z0 + L - 0.7 - padL / 2;
  for (const side of [1, -1]) {
    const face = new THREE.Group();
    face.position.set(0, side * (T / 2 + 0.09), zc);
    face.rotation.x = -side * Math.PI / 2;
    const panel = mesh(new THREE.PlaneGeometry(8 * pitch + 0.3, padL + 0.7), M.panel);
    face.add(panel);
    for (let i = 0; i < 8; i++) {
      const pad = mesh(new THREE.PlaneGeometry(padW, padL), M.gold);
      pad.position.set((i - 3.5) * pitch, 0, 0.002);
      face.add(pad);
    }
    if (side < 0) face.rotation.z = Math.PI;
    g.add(face);
  }
  const relief = mesh(lathe([
    V(2.0, 0), V(2.05, -0.8), V(1.9, -2.0), V(1.96, -2.4), V(1.72, -3.4), V(1.6, -4.6), V(1.66, -5.0), V(1.42, -6.0), V(1.26, -7.2), V(0.001, -7.22),
  ], 48), m.rubber);
  relief.rotation.x = Math.PI / 2;
  relief.position.z = -8.0;
  g.add(relief);
  anchor(g, 'cableOut', [0, 0, -14.6]);
  anchor(g, 'cableDir', [0, 0, -20]);
  g.position.y = P.thick / 2;
  return g;
}

/* ---------------- cable ---------------- */
const STEP = 1.5; // sample spacing along a cable, mm

/** Smooth a table route (x, z waypoints) and resample it every STEP mm (y = 0). */
function route(pts) {
  const c = new THREE.CatmullRomCurve3(pts.map((p) => (p.isVector3 ? new THREE.Vector3(p.x, 0, p.z) : new THREE.Vector3(p[0], 0, p[1]))), false, 'centripetal');
  return c.getSpacedPoints(Math.max(2, Math.ceil(c.getLength() / STEP)));
}
/**
 * Route + a soft lateral wave (zero at both ends, so the ends keep their direction). The wave's
 * size is solved by bisection so the cable is `length` mm long.
 */
function meander(pts, { length, waves = 2, phase = 0 }) {
  const base = route(pts), n = base.length;
  if (arcLength(base) >= length) return base;
  // side direction, averaged over ~4 cm so tight turns in the route never fold the wave into a cusp
  const W = 14;
  const nrm = base.map((p, i) => {
    const t = base[Math.min(i + W, n - 1)].clone().sub(base[Math.max(i - W, 0)]);
    return new THREE.Vector3(-t.z, 0, t.x).normalize();
  });
  const make = (amp) => route(base.map((p, i) => {
    const t = i / (n - 1);
    const env = Math.sin(Math.PI * t) ** 1.2;
    // two detuned waves so the bends are irregular, like a cable dropped on a table
    const wv = Math.sin(2 * Math.PI * waves * t + phase) + 0.45 * Math.sin(2 * Math.PI * waves * 1.7 * t + phase * 1.9 + 1);
    return p.clone().addScaledVector(nrm[i], amp * env * wv);
  }));
  let lo = 0, hi = 120;
  for (let k = 0; k < 22; k++) { const mid = (lo + hi) / 2; if (arcLength(make(mid)) < length) lo = mid; else hi = mid; }
  return make((lo + hi) / 2);
}
const arcLength = (pts) => pts.reduce((L, p, i) => (i ? L + p.distanceTo(pts[i - 1]) : 0), 0);
/** Sample index at arc length s. */
function atLength(pts, s) {
  let L = 0;
  for (let i = 1; i < pts.length; i++) { L += pts[i].distanceTo(pts[i - 1]); if (L >= s) return i; }
  return pts.length - 1;
}

/**
 * Lay a cable on the table. Heights: it rests with its centre-line at R, eases to the given end
 * heights, and drapes over every cable laid before it (and over itself) with a soft ~10 mm ramp
 * either side of a crossing. Pushes its samples into `laid` for the cables that come after.
 */
function drape(samples, laid, R, { startY = R, endY = R, ease = 9 } = {}) {
  const n = samples.length;
  const base = samples.map((_, i) => {
    const a = i * STEP, b = (n - 1 - i) * STEP;
    let y = R;
    if (a < ease) y += (startY - R) * (1 - THREE.MathUtils.smoothstep(a, 0, ease));
    if (b < ease) y += (endY - R) * (1 - THREE.MathUtils.smoothstep(b, 0, ease));
    return y;
  });
  const out = samples.map((p, i) => new THREE.Vector3(p.x, base[i], p.z));
  const near = 2 * R + 0.15, reach = near + 10, skip = Math.ceil(28 / STEP);
  for (let i = 0; i < n; i++) {
    const p = out[i];
    let h = base[i];
    const over = (q) => {
      const d = Math.hypot(q.x - p.x, q.z - p.z);
      if (d >= reach) return;
      const k = 1 - THREE.MathUtils.smoothstep(d, near, reach);
      h = Math.max(h, base[i] + (q.y + near - base[i]) * k);
    };
    for (const q of laid) over(q);
    for (let j = 0; j < i - skip; j++) over(out[j]);
    p.y = h;
  }
  // relax the heights so a drape reads as a soft cable, never a kink
  for (let k = 0; k < 3; k++) for (let i = 1; i < n - 1; i++) out[i].y = Math.max(base[i], (out[i - 1].y + 2 * out[i].y + out[i + 1].y) / 4);
  laid.push(...out);
  return out;
}

function tube(points, R, name) {
  const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
  const segs = Math.round(curve.getLength() / 1.1);
  return mesh(new THREE.TubeGeometry(curve, segs, R, 14, false), mats().rubber, name);
}

export function build(P = PARAMS, name = 'silentChoir') {
  const root = new THREE.Group();
  root.name = name;
  const mm = new THREE.Group();
  root.add(mm);
  const Lo = P.layout, R = P.cable.radius;
  const w = (obj, name) => obj.getObjectByName(name).getWorldPosition(new THREE.Vector3());
  const xz = (v) => new THREE.Vector3(v.x, 0, v.z);

  // buds, settled on the table
  const budA = earbud(P, 'budA', 1);
  const budB = earbud(P, 'budB', -1);
  mm.add(budA, budB);
  layDown(budA, P, Lo.budA);
  layDown(budB, P, Lo.budB);

  // splitter: the main cable leaves its back (local −Z), the two leads enter its front
  const sp = splitter();
  sp.position.x = Lo.splitter.at[0];
  sp.position.z = Lo.splitter.at[1];
  sp.rotation.y = Lo.splitter.yaw;
  mm.add(sp);
  const plug = P.plug.type === 'lightning' ? lightning(P.plug) : usbC(P.plug);
  plug.position.x = Lo.plug.at[0]; plug.position.z = Lo.plug.at[1];
  plug.rotation.y = Lo.plug.yaw;
  mm.add(plug);
  mm.updateMatrixWorld(true);
  const SY = sp.position.y;
  const spAt = (x, z) => sp.localToWorld(new THREE.Vector3(x, 0, z));
  const laid = [];

  // 1. main cable: splitter back → loose loop → USB-C plug
  const pA = w(plug, 'cableOut'), pDir = w(plug, 'cableDir').sub(pA).normalize();
  const mainS = meander([spAt(0, -9), ...Lo.main.route, pA.clone().addScaledVector(pDir, 22), pA.clone().addScaledVector(pDir, 7)], Lo.main);
  const main = drape(mainS, laid, R, { startY: SY, endY: P.plug.thick / 2 });
  mm.add(tube([spAt(0, -1.5), spAt(0, -3.4), ...main, pA, pA.clone().addScaledVector(pDir, -1.5)], R, 'cableMain'));

  // 2. leads: bud → (remote on the right lead) → splitter front
  const lead = (bud, pts, side) => {
    const a = w(bud, 'cableOut'), d = w(bud, 'cableDir').sub(a).normalize();
    const p2 = a.clone().addScaledVector(d, 9);
    return {
      head: [a.clone().addScaledVector(d, -1.2), a, a.clone().addScaledVector(d, 4)],
      startY: Math.max(R, p2.y),
      samples: meander([xz(p2), ...pts.route, spAt(side * 2.4, 22), spAt(side * 2.0, 10)], pts),
      entry: [spAt(side * 1.2, 3.4), spAt(side * 0.9, 1.5)],
    };
  };
  const A = lead(budA, Lo.leadA, -1);
  const B = lead(budB, Lo.leadB, 1);

  const a = drape(A.samples, laid, R, { startY: A.startY, endY: SY });
  mm.add(tube([...A.head, ...a, ...A.entry], R, 'cableBud'));

  // the inline remote sits on the right lead, lying along the cable
  // it settles on the straightest stretch 14–18 cm below the bud (a stiff remote can't sit on a bend)
  const sB = B.samples;
  const dirAt = (i) => sB[Math.min(i + 3, sB.length - 1)].clone().sub(sB[Math.max(i - 3, 0)]).normalize();
  let iR = atLength(sB, P.cable.remoteAt), best = Infinity;
  for (let sAt = P.cable.remoteAt - 20; sAt <= P.cable.remoteAt + 20; sAt += 2) {
    const i = atLength(sB, sAt), k = Math.ceil((P.remote.length / 2 + 18) / STEP);
    const bend = dirAt(Math.max(i - k, 0)).angleTo(dirAt(i)) + dirAt(i).angleTo(dirAt(Math.min(i + k, sB.length - 1)));
    if (bend < best) { best = bend; iR = i; }
  }
  const tR = sB[Math.min(iR + 16, sB.length - 1)].clone().sub(sB[Math.max(iR - 16, 0)]).normalize(); // average direction over ~5 cm
  const rm = remote(P.remote);
  rm.position.x = sB[iR].x; rm.position.z = sB[iR].z;
  rm.rotation.y = Math.atan2(-tR.z, tR.x); // local +X runs down the cable toward the splitter
  mm.add(rm);
  rm.updateMatrixWorld(true);
  const half = P.remote.length / 2, RY = rm.position.y;
  const rAt = (x) => rm.localToWorld(new THREE.Vector3(x, 0, 0));
  const cut = Math.ceil((half + 18) / STEP); // leave ~1 cm of free cable to ease into the remote's collars
  const b1 = drape([...sB.slice(0, Math.max(2, iR - cut)), xz(rAt(-half - 8))], laid, R, { startY: B.startY, endY: RY });
  mm.add(tube([...B.head, ...b1, rAt(-half - 2.6), rAt(-half + 0.5)], R, 'cableBud'));
  const b2 = drape([xz(rAt(half + 8)), ...sB.slice(Math.min(sB.length - 2, iR + cut))], laid, R, { startY: RY, endY: SY });
  mm.add(tube([rAt(half - 0.5), rAt(half + 2.6), ...b2, ...B.entry], R, 'cableBud'));

  root.userData.cableLengths = { main: Math.round(arcLength(mainS)), leadA: Math.round(arcLength(A.samples)), leadB: Math.round(arcLength(sB)) };

  mm.scale.setScalar(0.1); // mm → cm (site units)
  root.userData.heroAngle = [1.02, 0.0];     // slightly above, buds in front, cable flowing behind
  root.userData.sequence = 'earphones';      // product page scroll story (src/pages/sequence.js)
  // frame the buds and the first part of the leads; the long cable runs out of frame, as in a
  // product photo (see createStage in viewer/studio.js)
  root.userData.focus = [P.layout.focus[0] * 0.1, 0, P.layout.focus[1] * 0.1];
  root.userData.frameRadius = P.layout.frameRadius * 0.1;
  root.updateMatrixWorld(true);

  const at = (obj, v) => obj.localToWorld(new THREE.Vector3(...v)).toArray();
  const hotspots = [
    { id: 'bud', label: 'Chrome Earbud', position: at(budA.getObjectByName('head'), [0, 3, 7.6]), normal: [0, 0.8, 0.6] },
    { id: 'stem', label: 'Chrome Stem', position: at(budA.getObjectByName('stem'), [0, -12, 2.4]), normal: [0, 0.8, 0.6] },
    { id: 'remote', label: 'Inline Remote', position: at(rm, [0, P.remote.thick / 2 + 0.6, 0]), normal: [0, 1, 0.3] },
    { id: 'plug', label: P.plug.type === 'lightning' ? 'Lightning' : 'USB-C', position: at(plug, [0, P.plug.thick / 2, 2]), normal: [0, 1, 0.3] },
  ];
  return { object: root, hotspots };
}
