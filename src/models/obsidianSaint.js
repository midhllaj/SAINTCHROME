/**
 * OBSIDIAN SAINT — bracelet.
 * Same architecture as Blood Saint, with a black crystal and a plain silver star.
 */
import { createSaintBracelet } from './saintBracelet.js';
import { PARAMS as BLOOD } from './bloodSaint.js';

export const PARAMS = {
  ...BLOOD,
  crystal: { ...BLOOD.crystal, color: '#050507', type: 'obsidian' },
  star: { arms: [0.42, 0.52, 1.35, 0.52], stone: null },
};

export const build = (params = PARAMS) => createSaintBracelet(params);
