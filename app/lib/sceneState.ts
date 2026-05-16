// Shared cross-module state for SceneCanvas <-> section communication.
// Plain objects (no React) so they can be imported by both lazy-loaded chunks
// without circular dependency issues.

export const aboutSectionState = {
  active: false,
  sectionProgress: 0,
};

export const bestsellersSectionState = {
  active: false,
  sectionProgress: 0,
  entranceProgress: 0,
  carouselProgress: 0,
};

export const scenePhaseState = {
  heroIntensity: 1,
  aboutIntensity: 0,
  transitionBlend: 0,
  latePageFade: 0,
  logoFade: 0,
};

export const categoriesSectionState = {
  active: false,
  sectionProgress: 0,
};

export const whySectionState = {
  active: false,
  sectionProgress: 0,
};

export const campaignSectionState = {
  active: false,
  sectionProgress: 0,
};

export const lookbookSectionState = {
  active: false,
  sectionProgress: 0,
};

export const testimonialsSectionState = {
  active: false,
  sectionProgress: 0,
};

export const collectionsSectionState = {
  active: false,
  sectionProgress: 0,    // 0→1 across full 400vh
  entranceProgress: 0,   // 0→1 across first 15% of section
  shatterProgress: 0,    // 0→1 across last 15% of section
};

// Global page scroll progress (0→1 across full document height).
// Written once per frame by a single ScrollTrigger in _index.tsx; consumed
// by cross-section bridges to coordinate outgoing/incoming animation without
// double-owning DOM nodes.
export const pageFlow = {
  pageProgress: 0,
};
