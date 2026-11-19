/**
 * VERDANT SAINT — bracelet.
 * Elongated oval cable chain with a fine black-plated chain woven through it,
 * a deep emerald crystal in liquid-silver vines and a star charm with a green stone.
 */
import { createSaintBracelet, SAINT_DEFAULTS } from './saintBracelet.js';

export const PARAMS = {
  ...SAINT_DEFAULTS,
  strandSeparation: 0.0, // the black chain is woven through the cable, not a separate strand
  thick: { style: 'cable', link: { length: 1.08, width: 0.56, wire: 0.085, squash: 0.72, cut: 0.32, twist: 0 }, pitch: 1.08 - 0.2 },
  thin: { style: 'woven', link: { length: 0.22, width: 0.16, wire: 0.03, squash: 1, cut: 0, twist: 0 }, pitch: 0.13 },
  crystal: { color: '#06703A', type: 'crystal', length: 1.9, height: 0.82, depth: 0.58 },
  star: { arms: [0.42, 0.52, 1.35, 0.52], stone: '#0F8A3C' },
  vines: 2,
};

export const build = (params = PARAMS) => createSaintBracelet(params);
