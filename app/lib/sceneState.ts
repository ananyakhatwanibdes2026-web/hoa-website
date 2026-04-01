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
};

export const scenePhaseState = {
  heroIntensity: 1,
  aboutIntensity: 0,
  transitionBlend: 0,
};

export const categoriesSectionState = {
  active: false,
  sectionProgress: 0,
};
