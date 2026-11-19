/**
 * BLOOD SAINT — bracelet.
 * Flat diamond-cut Cuban strand + fine curb strand, joined by a faceted blood-red crystal
 * wrapped in molten silver vines, with a 4-point star charm set with a red stone.
 * Tweak anything below; see saintBracelet.js for every option.
 */
import { createSaintBracelet, SAINT_DEFAULTS } from './saintBracelet.js';

export const PARAMS = {
  ...SAINT_DEFAULTS,
  thick: { style: 'cuban', link: { length: 0.9, width: 0.68, wire: 0.15, squash: 0.48, cut: 0.5, twist: 1.1 }, pitch: 0.39 },
  thin: { style: 'curb', link: { length: 0.34, width: 0.25, wire: 0.042, squash: 0.6, cut: 0.4, twist: 1.0 }, pitch: 0.19 },
  crystal: { color: '#B3001B', type: 'crystal', length: 1.9, height: 0.8, depth: 0.56 },
  star: { arms: [0.42, 0.52, 1.35, 0.52], stone: '#C3001F' },
  vines: 2,
};

export const build = (params = PARAMS) => createSaintBracelet(params);
