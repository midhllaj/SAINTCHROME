/** Environment flags shared by every module. */
export const REDUCED_MOTION = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const IS_TOUCH = matchMedia('(pointer: coarse)').matches;
export const IS_SMALL = innerWidth < 760;
