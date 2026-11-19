/**
 * SAINTCHROME material library.
 * Every material is cached by key, so all relics share GPU programs.
 * Reflections come from scene.environment: the shared lightformer studio (src/viewer/studio.js).
 */
import * as THREE from 'three';

const cache = new Map();
const memo = (key, make) => {
  if (!cache.has(key)) cache.set(key, make());
  return cache.get(key);
};

let roughTex;
/**
 * Very subtle roughness variation (multiplies `roughness`, 0.72–1.0) so polished reflections
 * aren't perfectly CG-clean — real chrome always has faint polishing marks.
 */
export function roughnessNoise() {
  if (roughTex) return roughTex;
  const size = 256;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(size, size);
  const rand = mulberry(4242);
  const grid = Array.from({ length: 33 * 33 }, rand);
  const noise = (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const g = (i, j) => grid[((yi + j) % 32) * 33 + ((xi + i) % 32)];
    const s = (t) => t * t * (3 - 2 * t);
    const a = g(0, 0) + (g(1, 0) - g(0, 0)) * s(xf);
    const b = g(0, 1) + (g(1, 1) - g(0, 1)) * s(xf);
    return a + (b - a) * s(yf);
  };
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const u = (x / size) * 32, v = (y / size) * 32;
    const n = 0.5 * noise(u * 0.25, v * 0.25) + 0.3 * noise(u * 0.5, v * 0.5) + 0.2 * noise(u, v);
    const val = Math.round((0.72 + 0.28 * n) * 255);
    const o = (y * size + x) * 4;
    img.data[o] = img.data[o + 1] = img.data[o + 2] = val;
    img.data[o + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  roughTex = new THREE.CanvasTexture(c);
  roughTex.wrapS = roughTex.wrapT = THREE.RepeatWrapping;
  roughTex.repeat.set(2, 2);
  return roughTex;
}

/** Liquid-mirror chrome / polished stainless steel. */
export const chrome = (roughness = 0.07) =>
  memo(`chrome:${roughness}`, () => new THREE.MeshPhysicalMaterial({
    name: 'Chrome',
    color: 0xe8e8ea,
    metalness: 1,
    roughness: Math.max(roughness, 0.08),
    roughnessMap: roughnessNoise(),
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    envMapIntensity: 1.2,
  }));

/** Slightly brushed steel for small hardware (clasp springs, pins). */
export const steel = () =>
  memo('steel', () => new THREE.MeshPhysicalMaterial({
    name: 'Steel', color: 0xd9dde3, metalness: 1, roughness: 0.18, roughnessMap: roughnessNoise(), clearcoat: 0.6, envMapIntensity: 1.1,
  }));

/** Black-plated fine chain (Verdant / Azure). */
export const blackSteel = () =>
  memo('blackSteel', () => new THREE.MeshPhysicalMaterial({
    name: 'BlackPlated', color: 0x101114, metalness: 0.85, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.0,
  }));

/**
 * Faceted crystal. Transmission + high IOR + attenuation gives a deep coloured core;
 * flat shading on faceted geometry makes it sparkle.
 */
export const crystal = (attenuationColor = '#B3001B', { ior = 2.0, distance = 0.35, tint = '#ffffff', glow = 0.28, env = 1.0 } = {}) =>
  memo(`crystal:${attenuationColor}:${ior}:${distance}:${tint}:${glow}:${env}`, () => {
    // On a black stage a fully transmissive gem only shows black behind it, so it is
    // tinted, slightly self-lit ("inner fire") and only partly transmissive.
    const col = new THREE.Color(attenuationColor);
    return new THREE.MeshPhysicalMaterial({
      name: 'Crystal',
      color: col.clone().multiplyScalar(0.75),
      metalness: 0,
      roughness: 0.02,
      transmission: 0.55,
      ior,
      thickness: 0.6,
      attenuationColor: col,
      attenuationDistance: distance,
      specularIntensity: 0.7,
      specularColor: new THREE.Color('#ffffff'),
      clearcoat: 0,
      dispersion: 0.25,
      emissive: col,
      emissiveIntensity: glow,
      flatShading: true,
      envMapIntensity: env,
    });
  });

/** Opaque black obsidian glass — reflective, almost no light passes through. */
export const obsidian = () =>
  memo('obsidian', () => new THREE.MeshPhysicalMaterial({
    name: 'Obsidian',
    color: 0x050507,
    metalness: 0.0,
    roughness: 0.02,
    transmission: 0.25,
    ior: 1.9,
    thickness: 0.6,
    attenuationColor: new THREE.Color('#0a0a0f'),
    attenuationDistance: 0.05,
    clearcoat: 1,
    clearcoatRoughness: 0.0,
    specularIntensity: 1,
    flatShading: true,
    envMapIntensity: 2.2,
  }));

/** Glossy enamel (alien eyes). */
export const enamel = (color, { glow = 0 } = {}) =>
  memo(`enamel:${color}:${glow}`, () => new THREE.MeshPhysicalMaterial({
    name: 'Enamel', color: new THREE.Color(color), metalness: 0.1, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.4,
    emissive: new THREE.Color(color), emissiveIntensity: glow, // a little inner colour so it still reads green on a black stage
  }));

/**
 * Pavé / cubic-zirconia stones: tiny mirror facets with a touch of rainbow, so a field of them
 * glitters as the piece turns (on a black stage a clear stone only reads by its reflections).
 */
export const pave = () =>
  memo('pave', () => new THREE.MeshPhysicalMaterial({
    name: 'Pave', color: 0xffffff, metalness: 0.72, roughness: 0.08, flatShading: true, clearcoat: 1, clearcoatRoughness: 0.0,
    iridescence: 0.7, iridescenceIOR: 1.8, envMapIntensity: 3.2,
  }));

/** Small cut stone set in a charm. */
export const gem = (color) =>
  memo(`gem:${color}`, () => new THREE.MeshPhysicalMaterial({
    name: 'Gem', color: new THREE.Color(color), metalness: 0.1, roughness: 0.0, transmission: 0.55, ior: 2.1, thickness: 0.2,
    attenuationColor: new THREE.Color(color), attenuationDistance: 0.1, clearcoat: 1, flatShading: true, envMapIntensity: 2,
    emissive: new THREE.Color(color), emissiveIntensity: 0.25,
  }));

/** Transparent acetate (eyewear frames). */
export const acetate = (color = '#0F8A3C', { opacity = 1, distance = 0.9, roughness = 0.06 } = {}) =>
  memo(`acetate:${color}:${distance}:${roughness}`, () => new THREE.MeshPhysicalMaterial({
    name: 'Acetate',
    color: new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.08),
    metalness: 0,
    roughness,
    transmission: 0.78,
    emissive: new THREE.Color(color),
    emissiveIntensity: 0.2,
    ior: 1.5,
    thickness: 0.5,
    attenuationColor: new THREE.Color(color),
    attenuationDistance: distance,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    specularIntensity: 1,
    opacity,
    envMapIntensity: 2.4,
  }));

/** Gloss-black acetate (opaque). */
export const blackAcetate = () =>
  memo('blackAcetate', () => new THREE.MeshPhysicalMaterial({
    name: 'BlackAcetate', color: 0x0b0b0d, metalness: 0, roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.0, specularIntensity: 1, envMapIntensity: 3.2,
  }));

/**
 * Optical lens; tint '#ffffff' for clear. Thin lenses use alpha glass (not transmission) so they
 * stay see-through over transparent viewers, the webcam feed and any page background.
 * `distance` controls tint strength: smaller = darker/stronger tint.
 */
export const lens = (tint = '#ffffff', distance = 4) =>
  memo(`lens:${tint}:${distance}`, () => {
    const clear = new THREE.Color(tint).getHSL({}).l > 0.95;
    return new THREE.MeshPhysicalMaterial({
      // a clear lens is a faint cool sheen of glass, so it reads against a black stage
      name: 'Lens', color: clear ? new THREE.Color('#8e9aa3') : new THREE.Color(tint), metalness: 0, roughness: 0.02,
      transparent: true, opacity: clear ? 0.12 : THREE.MathUtils.clamp(0.75 - distance * 0.4, 0.35, 0.7), depthWrite: false,
      specularIntensity: 1, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: clear ? 2.6 : 1.8, side: THREE.DoubleSide,
    });
  });

/** Matte gemstone bead with a procedural mottled texture. */
export const stone = (palette, seed = 1, { roughness = 0.45, polished = false } = {}) =>
  memo(`stone:${palette.join(',')}:${seed}:${roughness}:${polished}`, () => new THREE.MeshPhysicalMaterial({
    name: polished ? 'PolishedStone' : 'Stone', map: stoneTexture(palette, seed, polished ? 0 : 0.25), roughness, metalness: 0,
    // a polished, faceted bead: glassy coat, every facet catching its own highlight
    clearcoat: polished ? 1 : 0.35, clearcoatRoughness: polished ? 0.02 : 0.35, flatShading: polished,
    specularIntensity: polished ? 0.9 : 0.5, envMapIntensity: polished ? 1.5 : 0.9,
  }));

/* ---------- procedural stone texture (value noise, no assets) ---------- */
function stoneTexture(palette, seed, speckle = 0.25) {
  const size = 128;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(size, size);
  const rand = mulberry(seed * 9973);
  const grid = Array.from({ length: 17 * 17 }, rand);
  const noise = (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const g = (i, j) => grid[((yi + j) % 16) * 17 + ((xi + i) % 16)];
    const s = (t) => t * t * (3 - 2 * t);
    const a = g(0, 0) + (g(1, 0) - g(0, 0)) * s(xf);
    const b = g(0, 1) + (g(1, 1) - g(0, 1)) * s(xf);
    return a + (b - a) * s(yf);
  };
  const cols = palette.map((p) => new THREE.Color(p));
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const u = x / size * 16, v = y / size * 16;
    let n = 0.5 * noise(u * 0.25, v * 0.25) + 0.3 * noise(u * 0.5, v * 0.5) + 0.2 * noise(u, v);
    n = Math.min(0.999, Math.max(0, n));
    const k = n * (cols.length - 1);
    const i = Math.floor(k);
    const col = cols[i].clone().lerp(cols[Math.min(i + 1, cols.length - 1)], k - i);
    const speck = noise(u * 3.7, v * 3.7) > 0.82 ? speckle : 0;
    const o = (y * size + x) * 4;
    img.data[o] = Math.min(255, (col.r + speck) * 255);
    img.data[o + 1] = Math.min(255, (col.g + speck) * 255);
    img.data[o + 2] = Math.min(255, (col.b + speck) * 255);
    img.data[o + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function mulberry(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
