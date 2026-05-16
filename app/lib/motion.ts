// Unified motion tokens — every reveal on the site moves bottom → up.
// Import these in section components instead of re-declaring y/opacity
// magic numbers so direction stays consistent across sections.

export const RISE = {
  from: {y: 48, opacity: 0},
  to: {y: 0, opacity: 1, ease: 'power2.out', duration: 0.9},
} as const;

export const RISE_MD = {
  from: {y: 32, opacity: 0},
  to: {y: 0, opacity: 1, ease: 'power2.out', duration: 0.85},
} as const;

export const RISE_SM = {
  from: {y: 20, opacity: 0},
  to: {y: 0, opacity: 1, ease: 'power2.out', duration: 0.7},
} as const;

// Exit continues upward — content leaves the frame going the same way it arrived.
export const LIFT_OUT = {
  y: -32,
  opacity: 0,
  ease: 'power2.in',
  duration: 0.45,
} as const;

export const LIFT_OUT_FAR = {
  y: -220,
  opacity: 0,
  ease: 'power2.in',
  duration: 0.6,
} as const;
