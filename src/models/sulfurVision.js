/**
 * SULFUR VISION — eyewear (original Ray-Ban collaboration; the brand appears in the product text only).
 * The shared frame (src/models/glasses.js) in glossy Obsidian acetate with sulfur-yellow lenses.
 */
import { createGlasses } from './glasses.js';

export const build = () => createGlasses({ finish: 'obsidian', lens: 'sulfur' });
