/**
 * Model registry: key → lazy module loader. Built models are cached and cloned per viewer.
 * Add a new relic: create src/models/<name>.js exporting build(), then add it here
 * and reference the key from src/config/products.js.
 */
const loaders = {
  thornRelic: () => import('./thornRelic.js'),
  bloodSaint: () => import('./bloodSaint.js'),
  obsidianSaint: () => import('./obsidianSaint.js'),
  verdantSaint: () => import('./verdantSaint.js'),
  rosaryOfAsh: () => import('./rosaryOfAsh.js'),
  azureSaint: () => import('./azureSaint.js'),
  crimsonSaint: () => import('./crimsonSaint.js'),
  onyxSaint: () => import('./onyxSaint.js'),
  jadeSaint: () => import('./jadeSaint.js'),
  theVisitor: () => import('./theVisitor.js'),
  emeraldVision: () => import('./emeraldVision.js'),
  noirVision: () => import('./noirVision.js'),
  sulfurVision: () => import('./sulfurVision.js'),
  silentChoir: () => import('./silentChoir.js'),
  silentChoirLightning: () => import('./silentChoirLightning.js'),
  halo: () => import('./haloRing.js'),
};

const built = new Map();

/** Returns { object, hotspots } — object is a fresh clone safe to add to any scene. */
export async function loadModel(key) {
  if (!loaders[key]) throw new Error(`Unknown model "${key}"`);
  if (!built.has(key)) {
    built.set(key, loaders[key]().then((mod) => mod.build()));
  }
  const proto = await built.get(key);
  return { object: proto.object.clone(true), hotspots: proto.hotspots, parts: proto.parts };
}

export const modelKeys = Object.keys(loaders);
