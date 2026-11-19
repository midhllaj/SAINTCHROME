/**
 * ONYX SAINT — necklace.
 * Azure Saint's build with an opaque black crystal and a plain silver star (like Obsidian Saint).
 */
import { build as buildAzure, PARAMS as AZURE } from './azureSaint.js';

export const PARAMS = {
  ...AZURE,
  crystal: { ...AZURE.crystal, color: '#050507', type: 'obsidian' },
  star: { ...AZURE.star, stone: null },
};

export const build = (params = PARAMS) => buildAzure(params, 'onyxSaint');
