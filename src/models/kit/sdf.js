/**
 * Signed-distance-field helpers: smooth min/max and a surface-nets mesher, used for organic
 * cast shapes (the Silent Choir earbud heads, the Rosary of Ash cross).
 */
import * as THREE from 'three';

const norm3 = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };

/** Polynomial smooth minimum (union with a fillet of size k). */
export const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
/** Smooth maximum (intersection / subtraction with a fillet). */
export const smax = (a, b, k) => -smin(-a, -b, k);

/** Naive surface nets over a box, vertices projected onto the surface, normals from the gradient. */
export function meshSDF(f, min, max, h) {
  const nx = Math.ceil((max[0] - min[0]) / h) + 1, ny = Math.ceil((max[1] - min[1]) / h) + 1, nz = Math.ceil((max[2] - min[2]) / h) + 1;
  const val = new Float32Array(nx * ny * nz);
  const id = (i, j, k) => i + nx * (j + ny * k);
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) val[id(i, j, k)] = f(min[0] + i * h, min[1] + j * h, min[2] + k * h);
  const cx = nx - 1, cy = ny - 1, cz = nz - 1;
  const cell = new Int32Array(cx * cy * cz).fill(-1);
  const cid = (i, j, k) => i + cx * (j + cy * k);
  const pos = [];
  const E = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
  const cv = new Float32Array(8);
  for (let k = 0; k < cz; k++) for (let j = 0; j < cy; j++) for (let i = 0; i < cx; i++) {
    let mask = 0;
    for (let c = 0; c < 8; c++) { cv[c] = val[id(i + (c & 1), j + ((c >> 1) & 1), k + ((c >> 2) & 1))]; if (cv[c] < 0) mask |= 1 << c; }
    if (mask === 0 || mask === 255) continue;
    let sx = 0, sy = 0, sz = 0, m = 0;
    for (const [a, b] of E) {
      if ((cv[a] < 0) === (cv[b] < 0)) continue;
      const t = cv[a] / (cv[a] - cv[b]);
      sx += (a & 1) + t * ((b & 1) - (a & 1)); sy += ((a >> 1) & 1) + t * (((b >> 1) & 1) - ((a >> 1) & 1)); sz += ((a >> 2) & 1) + t * (((b >> 2) & 1) - ((a >> 2) & 1));
      m++;
    }
    cell[cid(i, j, k)] = pos.length / 3;
    pos.push(min[0] + (i + sx / m) * h, min[1] + (j + sy / m) * h, min[2] + (k + sz / m) * h);
  }
  const idx = [];
  const quad = (a, b, c, d, flip) => { if (a < 0 || b < 0 || c < 0 || d < 0) return; if (flip) idx.push(a, c, b, a, d, c); else idx.push(a, b, c, a, c, d); };
  for (let k = 1; k < cz; k++) for (let j = 1; j < cy; j++) for (let i = 0; i < cx; i++) { // x edges
    const a = val[id(i, j, k)], b = val[id(i + 1, j, k)]; if ((a < 0) === (b < 0)) continue;
    quad(cell[cid(i, j - 1, k - 1)], cell[cid(i, j, k - 1)], cell[cid(i, j, k)], cell[cid(i, j - 1, k)], b < 0);
  }
  for (let k = 1; k < cz; k++) for (let j = 0; j < cy; j++) for (let i = 1; i < cx; i++) { // y edges
    const a = val[id(i, j, k)], b = val[id(i, j + 1, k)]; if ((a < 0) === (b < 0)) continue;
    quad(cell[cid(i - 1, j, k - 1)], cell[cid(i - 1, j, k)], cell[cid(i, j, k)], cell[cid(i, j, k - 1)], b < 0);
  }
  for (let k = 0; k < cz; k++) for (let j = 1; j < cy; j++) for (let i = 1; i < cx; i++) { // z edges
    const a = val[id(i, j, k)], b = val[id(i, j, k + 1)]; if ((a < 0) === (b < 0)) continue;
    quad(cell[cid(i - 1, j - 1, k)], cell[cid(i, j - 1, k)], cell[cid(i, j, k)], cell[cid(i - 1, j, k)], b < 0);
  }
  // snap each vertex onto the surface and take its normal from the field
  const e = h * 0.2, nrm = new Float32Array(pos.length);
  const grad = (x, y, z) => [f(x + e, y, z) - f(x - e, y, z), f(x, y + e, z) - f(x, y - e, z), f(x, y, z + e) - f(x, y, z - e)];
  for (let p = 0; p < pos.length; p += 3) {
    let x = pos[p], y = pos[p + 1], z = pos[p + 2];
    for (let it = 0; it < 3; it++) {
      const g = grad(x, y, z), g2 = (g[0] * g[0] + g[1] * g[1] + g[2] * g[2]) / (4 * e * e);
      if (g2 < 1e-8) break;
      const s = f(x, y, z) / g2 / (2 * e);
      x -= s * g[0]; y -= s * g[1]; z -= s * g[2];
    }
    pos[p] = x; pos[p + 1] = y; pos[p + 2] = z;
    const g = norm3(grad(x, y, z));
    nrm[p] = g[0]; nrm[p + 1] = g[1]; nrm[p + 2] = g[2];
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  geo.setIndex(idx);
  return geo;
}
