/**
 * CRIMSON SAINT — necklace.
 * Azure Saint's build with a blood-red crystal and a red stone in the star.
 */
import { build as buildAzure, PARAMS as AZURE } from './azureSaint.js';

export const PARAMS = {
  ...AZURE,
  crystal: { ...AZURE.crystal, color: '#B3001B' },
  star: { ...AZURE.star, stone: '#d0102a' },
};

export const build = (params = PARAMS) => buildAzure(params, 'crimsonSaint');
