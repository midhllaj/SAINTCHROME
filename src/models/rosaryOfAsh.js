/**
 * ROSARY OF ASH — necklace, modelled from the real piece.
 * Long paperclip links joined by pairs of small round rings, and on each side a run of six
 * faceted agate beads with a mirror heishi rondelle between every bead and at both ends: on one
 * side the run starts at the cross, on the other after three paperclip links. Both sides meet
 * at a jump ring at the front, and from it hangs a cast Latin cross with budded ends, a wavy
 * scroll relief and a four-petal rosette. Lobster clasp, extender and a rectangular tag at the back.
 */
import * as THREE from 'three';
import { chrome, stone } from './kit/materials.js';
import { linkGeometry, chainAlong } from './kit/chain.js';
import { jumpRing, spacer, buddedCross } from './kit/parts.js';
import { necklaceFrame, addBackClasp, NECK_DEFAULTS } from './necklaceBase.js';

export const PARAMS = {
  neck: { ...NECK_DEFAULTS, drop: 11 },
  paperclip: { length: 1.05, width: 0.32, wire: 0.048, squash: 0.85, cut: 0.2, twist: 0 },
  ring: { R: 0.095, wire: 0.03 },
  beads: {
    radius: 0.3,          // 6 mm faceted rounds
    rondelle: 0.21,       // heishi spacer radius
    rondelleT: 0.11,      // heishi spacer thickness
    // one run on each side of the cross: the right one starts at the front ring, the left one
    // after three paperclip links (as on the piece)
    runs: [{ side: 'right', clipsBefore: 0, count: 6 }, { side: 'left', clipsBefore: 3, count: 6 }],
    // mixed moss / Indian agate, in the order they sit on the piece (from the cross outwards)
    palettes: [
      ['#6f7475', '#a3a9a9', '#d9dcda'], // grey agate
      ['#24706c', '#3f9690', '#86c4ba'], // teal
      ['#9fb6b8', '#c6d6d6', '#eef3f1'], // pale aqua, rutilated
      ['#26332e', '#3f5149', '#6f8478'], // dark green
      ['#5d6c50', '#879573', '#bcc6a8'], // moss
      ['#cbb0ab', '#e3cfca', '#f6ece8'], // pale pink
      ['#4b6668', '#73979a', '#b0cbcb'], // grey-blue
      ['#56634f', '#8d9b88', '#cdd5c8'], // speckled moss
    ],
  },
  cross: { height: 2.6, width: 1.7 },
  frontRing: { R: 0.17, wire: 0.042 },
};

const torus = new Map();
const ringGeometry = (R, w) => {
  const k = `${R}:${w}`;
  if (!torus.has(k)) torus.set(k, new THREE.TorusGeometry(R, w, 10, 28)); // in the XY plane, like a link
  return torus.get(k);
};
const facetCache = new Map();
/** Faceted round bead: flat-shaded lat-long facets, drill hole along X. */
const facetedBead = () => {
  if (!facetCache.has('b')) facetCache.set('b', new THREE.SphereGeometry(1, 16, 10).rotateZ(Math.PI / 2));
  return facetCache.get('b');
};

export function build(P = PARAMS) {
  const root = new THREE.Group();
  root.name = 'rosaryOfAsh';
  const metal = chrome(0.07);
  const frame = necklaceFrame({ neck: P.neck, frontHalf: 0.035 });
  // right half runs front (u = 0) → back; left half runs back → front (u = 1)
  const [right, left] = frame.halves.map((h) => frame.curveFor(h));

  const clipGeo = linkGeometry(P.paperclip);
  const ringGeo = ringGeometry(P.ring.R, P.ring.wire);
  const { R, wire: wr } = P.ring;
  const a = P.paperclip.length / 2, wp = P.paperclip.wire;
  const dc = a + R - (wp + wr) * 1.1;  // paperclip centre → ring centre
  const dr = 2 * (R - wr) * 0.95;      // ring → ring
  const unit = dr + 2 * dc;

  /** Ring pair, paperclip, ring pair, … ring pair, filling arc length [sA, sB] of `curve`. */
  const chainSeg = (curve, sA, sB, tag, clips = null) => {
    const L = curve.getLength(), m = 0.07;
    const avail = Math.max(dr, sB - sA - 2 * m);
    const n = clips ?? Math.max(0, Math.round((avail - dr) / unit));
    const k = avail / (n * unit + dr);
    const ringsA = [], ringsB = [], links = [];
    for (let i = 0; i <= n; i++) {
      const s = sA + m + k * i * unit;
      ringsA.push(s / L);
      ringsB.push((s + k * dr) / L);
      if (i < n) links.push((s + k * (dr + dc)) / L);
    }
    const common = { material: metal, alternate: 0, up: frame.up };
    if (links.length) root.add(chainAlong(curve, { ...common, geometry: clipGeo, at: links, name: `paperclip${tag}` }));
    root.add(chainAlong(curve, { ...common, geometry: ringGeo, at: ringsA, roll: Math.PI / 2, name: `rings${tag}a` }));
    root.add(chainAlong(curve, { ...common, geometry: ringGeo, at: ringsB, roll: 0.25, name: `rings${tag}b` }));
  };
  // nominal length of a segment with n paperclips
  const segLength = (n) => n * unit + dr + 0.14;

  /* ---- each side: [paperclips], a bead run, paperclips to the back ----
     positions are arc length measured from the front ring along that side */
  const B = P.beads;
  const X = new THREE.Vector3(1, 0, 0);
  const sides = {
    right: { curve: right, flip: false },
    left: { curve: left, flip: true }, // the left half runs back → front
  };
  const beads = [];
  let paletteIndex = 0;
  for (const R0 of B.runs) {
    const { curve, flip } = sides[R0.side];
    const L = curve.getLength();
    const arc = (sf) => (flip ? L - sf : sf);
    const seg = (fa, fb, tag, clips) => (flip ? chainSeg(curve, L - fb, L - fa, tag, clips) : chainSeg(curve, fa, fb, tag, clips));
    const place = (obj, sf) => {
      const u = arc(sf) / L;
      obj.position.copy(curve.getPointAt(u));
      obj.quaternion.setFromUnitVectors(X, curve.getTangentAt(u));
      root.add(obj);
    };
    const tag = R0.side[0].toUpperCase();
    // chain from the front ring to the run (a single ring pair when there are no links)
    const start = R0.clipsBefore ? segLength(R0.clipsBefore) : 0.3;
    seg(0, start, `${tag}0`, R0.clipsBefore);
    let s = start;
    const rondelle = () => { place(spacer(B.rondelle, metal), s + B.rondelleT / 2); s += B.rondelleT; };
    rondelle();
    for (let i = 0; i < R0.count; i++) {
      const j = paletteIndex++;
      const r = B.radius * (0.95 + ((j * 37) % 10) / 120);
      const b = new THREE.Mesh(facetedBead(), stone(B.palettes[j % B.palettes.length], j + 5, { roughness: 0.18, polished: true }));
      b.name = 'bead';
      b.scale.setScalar(r);
      place(b, s + r);
      b.rotateX(j * 1.3); // each bead turned on its wire
      beads.push(b);
      s += 2 * r;
      rondelle();
    }
    seg(s, L, `${tag}1`);
  }

  /* ---- front: both sides meet at a jump ring, the cross hangs from it ---- */
  const front = frame.pt(0);
  const ring = jumpRing(P.frontRing.R, P.frontRing.wire, metal);
  ring.position.copy(front);
  ring.rotation.y = Math.PI / 2; // edge-on, threaded through the cross's loop
  root.add(ring);
  const cross = buddedCross({ height: P.cross.height, width: P.cross.width, material: chrome(0.05) });
  const loop = cross.userData.loop;
  cross.position.copy(front).add(new THREE.Vector3(0, -P.frontRing.R + 0.02, 0.05)).sub(loop);
  cross.rotation.x = -0.1;
  root.add(cross);

  const { back } = addBackClasp(root, frame, metal, { tag: 'rect' });

  const mid = (arr) => arr[Math.floor(arr.length / 2)].position.clone();
  const hotspots = [
    { id: 'cross', label: 'The Budded Cross', position: cross.position.clone().add(new THREE.Vector3(0, 0, 0.25)).toArray(), normal: [0, 0, 1] },
    { id: 'beads', label: 'Agate Stones', position: mid(beads.slice(0, B.runs[0].count)).add(new THREE.Vector3(0, 0, 0.35)).toArray(), normal: [0.3, 0, 1] },
    { id: 'chain', label: 'Paperclip Chain', position: left.getPointAt(0.6).add(new THREE.Vector3(0, 0, 0.2)).toArray(), normal: [-0.3, 0, 1] },
    { id: 'clasp', label: 'Lobster Clasp', position: back.clone().add(new THREE.Vector3(0, 0.1, -0.3)).toArray(), normal: [0, 0, -1] },
  ];
  return { object: root, hotspots };
}
