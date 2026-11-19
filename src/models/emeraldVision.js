/**
 * EMERALD VISION — eyewear (original Ray-Ban collaboration; the brand appears in the product text only).
 * The shared frame (src/models/glasses.js) in transparent Emerald acetate with clear lenses:
 * the hinges and core wires show through.
 */
import { createGlasses } from './glasses.js';

export const build = () => createGlasses({ finish: 'emerald', lens: 'clear' });
