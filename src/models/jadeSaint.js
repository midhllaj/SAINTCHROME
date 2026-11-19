/**
 * JADE SAINT — necklace.
 * Azure Saint's build with an emerald crystal and a green stone in the star.
 */
import { build as buildAzure, PARAMS as AZURE } from './azureSaint.js';

export const PARAMS = {
  ...AZURE,
  crystal: { ...AZURE.crystal, color: '#06703A' },
  star: { ...AZURE.star, stone: '#0F8A3C' },
};

export const build = (params = PARAMS) => buildAzure(params, 'jadeSaint');
