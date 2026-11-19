/**
 * SILENT CHOIR LIGHTNING — the same chrome earphones with a Lightning plug instead of USB-C.
 */
import { build as buildChoir, PARAMS as CHOIR } from './silentChoir.js';

export const PARAMS = { ...CHOIR, plug: { ...CHOIR.plug, type: 'lightning' } };

export const build = (params = PARAMS) => buildChoir(params, 'silentChoirLightning');
