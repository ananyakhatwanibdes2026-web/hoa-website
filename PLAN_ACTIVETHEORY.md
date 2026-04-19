# PLAN_ACTIVETHEORY.md

Hydrogen-friendly blueprint to port Active Theory (activetheory.net) components into House of An (han1). Written to be consumed by Claude Code in plan mode. Do not implement anything yet.

## 0. Context snapshot (what already exists in han1)

Stack: Shopify Hydrogen (React 18 + Remix), Oxygen. R3F v8 + drei v9, @react-three/postprocessing, GSAP + ScrollTrigger, Lenis (smooth scroll singleton via `getLenis()`), Tailwind v4, TypeScript.

Already in place and reusable for AT parity:
- Global persistent R3F Canvas: `app/components/global/SceneCanvas.tsx` (lazy, ClientOnly, z-index 0, fixed). Contains NightSkyShader, AN_Logo, StarField, RockField, AtmosphericFog, AnimatedEnvironment, AdaptivePostFX (SelectiveBloom + Vignette), scroll-driven camera.
- Smooth scroll: `SmoothScroll.tsx` (Lenis) + `lib/sceneState.ts` plain-JS shared state for cross-module reads.
- HTML overlay sections already using sticky + paused GSAP timeline + scrub pattern (About, Bestsellers, Why, Campaign, Lookbook, Testimonials).
- CSS tokens in `styles/global-effects.css`: `--at-accent #6080e0`, `--at-accent-bright #9ca5ff`, `--at-blue-steel #1a2840`, `--at-blue-silver #8ab0d0`.
- `ChromeCursor.tsx` dot+ring cursor with trail.
- CSP in `entry.server.tsx` already allows blob workers, wasm-unsafe-eval, Shopify CDN, Google Fonts.

What this means: we do NOT rebuild the engine. AT uses a custom WebGL renderer + FXScroll. In Hydrogen we stay with R3F + Lenis. We port AT's ideas, not AT's code.

## 1. Hydrogen constraints that shape every decision

1. SSR. Any WebGL, DOM-measurement, or `window` reference must live inside `ClientOnly` + `React.lazy` or behind a `useEffect`. Mirror the pattern already used for `SceneCanvas` and every section.
2. No `"use client"`. This is Remix, not Next.
3. Scroll model. AT uses `FXScroll` (fixed full-screen div, `overflow:hidden scroll`, page body locked). Hydrogen routing, prefetch, restoration, and Lenis assume the real document scrolls. Do NOT introduce FXScroll. Instead, keep the current Lenis-driven real scroll and treat `getLenis().scroll` (or `window.scrollY`) as the progress signal already feeding `useFrame`.
4. CSP. Keep using the local `/draco/` decoder, `<Environment>` with `<Lightformer>` children only, and never fetch remote HDR.
5. Route transitions. AT is a single page. Hydrogen has many (PDP, PLP, cart, account). Any AT-style "camera moves you between zones" must be scoped to `_index.tsx` and not break route navigation. Cross-route transitions use Remix view transitions or a GSAP-flip overlay, not the scroll engine.
6. Fonts. Only loaded fonts may be used: Cormorant Garamond, DM Sans, Barlow 700/800, Bebas Neue, Nunito. NBArchitekt is not loaded. Substitute with DM Sans / Barlow for AT's monospace tech vibe, or add NBArchitekt via `fonts.css` + `@font-face` from `/public/fonts/` if licensed. Default plan: do not add NBArchitekt. Use DM Sans uppercase wide-tracked as the "tech terminal" voice.
7. Performance budget. Existing dpr cap `[1, 1.5]` desktop, `[1, 1]` mobile. Retain. Any new particle/shader work must respect `heroGone` unmount pattern (see `SceneCanvas.tsx`).
8. No em dashes anywhere.

## 2. AT components to port, mapped to han1 files

Each item lists: AT source behavior, han1 target file (new or existing), Hydrogen caveats, and a minimal acceptance check. Nothing below is to be implemented in this planning pass.

### A. FXScroll-style scroll-driven scene  [already effectively present]
- AT: virtual scroll div drives camera, page is locked.
- han1: Lenis-driven real scroll already feeds `useFrame` via `getScrollProgress()` (see `SceneCanvas.tsx`). Low-lerp smoothing (0.07) matches AT's 0.08.
- Action: none. Document parity. Keep lerp 0.05 to 0.10 on any new scroll-reactive component to match the AT "never quite catches up" feel.
- Accept: scroll feels inertial, no layout jank, route nav still works.

### B. Particle field (volumetric drift)  [NEW]
- AT: thousands of GPU-instanced billboarded points, color shifts by scroll, larger when camera-near.
- han1 target: `app/components/global/ParticleField.tsx`. Mount inside `SceneCanvas` next to `StarField`, gated by `heroGone` the same way.
- Implementation sketch: `THREE.Points` with `BufferGeometry`, 15k desktop / 3k mobile, `sizeAttenuation`, custom `ShaderMaterial` that lerps color between `#556600`, `#88aa00`, `#aaccff` using `uScroll`. Use `additive blending` where it stays on top of the NightSkyShader without blowing out bloom (keep outside `<Select>` so it is not bloomed).
- Hydrogen: ClientOnly via parent. No SSR reads.
- Accept: first paint unchanged FPS-wise; scrubbing scroll shifts particle tint.

### C. Iridescent/chrome Fresnel shader on AN_Logo  [ENHANCE existing]
- AT: logo pendant uses view-angle color shift (fresnel), color palette breathes with scroll.
- han1 target: extend the chrome material in `SceneCanvas.tsx` `LogoModel`. Add a thin `onBeforeCompile` patch that injects a fresnel term into `emissive` based on `vViewPosition` and `vNormal`, driven by a `uScroll` uniform synced to the existing scroll ref.
- Hydrogen: keep it on `MeshPhysicalMaterial` (not a custom `ShaderMaterial`) so drei `<Environment>` still works.
- Accept: logo shifts blue -> teal -> gold subtly with scroll; no material flash on route mount.

### D. Navigation pill (top-right, glass, monospace)  [REFACTOR existing Navigation.tsx]
- AT: fixed pill top-right with backdrop-blur, thin border, wide-tracked uppercase label pair.
- han1 target: `Navigation.tsx` already fixed + blur on scroll. Add a second "pill" variant for desktop so Shop/Collections live in a left pill and About/Bag live in a right pill, matching AT's split. Retain Hydrogen `<Link prefetch="intent">` for instant routing.
- Tokens: `background: rgba(0,0,0,0.6)`, `border: 1px solid rgba(255,255,255,0.2)`, `backdrop-filter: blur(8px)`, `border-radius: 500px`, `padding: 8px 24px`, letter-spacing `0.15em`, uppercase, font DM Sans 0.65rem (NBArchitekt substitute).
- Accept: pill visible on every route, does not collide with `ChromeCursor`, remains keyboard-navigable.

### E. Chat / AI overlay with mix-blend-mode color-dodge  [NEW, non-AI]
- AT: bottom-left chat pane with `mix-blend-mode: color-dodge` and masked fade.
- han1 target: `app/components/global/AmbientTicker.tsx`. Reuse the visual treatment as a passive ambient text feed (brand headlines, shipping note, press quote). No LLM, no input field. This preserves the visual technique without committing to an AI chat product.
- CSS: wrapper `position:fixed; bottom:0; left:0; width:min(420px,100%); padding:3rem; mix-blend-mode:color-dodge; pointer-events:none;`. Mask `linear-gradient(to top, white 0%, white 75%, transparent 90%)`.
- Hydrogen: purely CSS + React state, SSR safe.
- Accept: text visibly "glows from" the WebGL scene on dark backgrounds; invisible on white sections (expected).
- Optional later: wire to Shopify "notices" metaobject.

### F. Left-rail category links  [NEW]
- AT: vertical stack of lavender/periwinkle uppercase links that slide right on hover/active.
- han1 target: `app/components/global/SideRail.tsx`, fixed left, mid-viewport. Links: BESTSELLERS, COLLECTIONS, LOOKBOOK, ABOUT, CONTACT. Wire to anchor IDs on `_index.tsx` and hide on non-home routes with `useLocation()`.
- Tokens: color `var(--at-accent-bright)`, hover `#fff` + `text-shadow: #fff 1px 0 5px` + `transform: translateX(10px)`.
- Hydrogen: scroll-to uses `getLenis().scrollTo(anchorEl)`; fall back to `el.scrollIntoView({behavior:'smooth'})` if Lenis not ready.
- Accept: clicks scroll smoothly, active state tracks `sectionState.active` flags already in `sceneState.ts`.

### G. Music player ticker (bottom-right)  [OPTIONAL, NEW]
- AT: 80x30 ticker, 10px monospace, `mix-blend-mode: color-dodge`, 9s linear infinite.
- han1 target: `app/components/global/CornerTicker.tsx` running an inventory/ethos line such as "RECYCLED SILVER  -  MADE IN MUMBAI  -  READY TO SHIP". No audio. Same blend-mode trick.
- Accept: low-weight, no layout shift, off on mobile under 400px.

### H. Cookie banner  [NEW, pragmatic]
- AT: dark glass pill.
- han1 target: `app/components/global/CookieBanner.tsx`, rendered from `root.tsx` after hydration. Store consent in `localStorage` (Hydrogen SSR-safe via `useEffect`). Integrate with Shopify Customer Privacy API later.
- Accept: shows once, respects consent, does not block content.

### I. Scroll spacer sectioning (sceneLengths)  [MAP to existing]
- AT uses 6 invisible scrollElements that define scene phases.
- han1 already has section-height budgets (Bestsellers 500vh, Categories 500vh, Why 250vh, Campaign 500vh, Lookbook 500vh, Testimonials 120vh). Add a single source of truth: `app/lib/sceneLengths.ts` exporting phase thresholds in page-progress (0 to 1). `SceneCanvas` camera keyframes and new camera-move work (item J) read from this file. Prevents magic numbers drift.

### J. Scroll-driven camera keyframes (scene flythrough feel)  [ENHANCE existing camera]
- AT: camera traverses a spline through scenes (hero, portfolio, about, contact).
- han1 target: replace or extend current scroll-driven camera inside `SceneCanvas.tsx` with a `CameraRig` that reads `sceneLengths.ts` and interpolates `position` + `lookAt` across 6 keyframes using Catmull-Rom via `THREE.CatmullRomCurve3` + Hermite easing. Keep intro zoom (2.5s) unchanged.
- Hydrogen: route change unmounts `_index.tsx` but not `SceneCanvas`. CameraRig must expose a "home" reset when `useLocation().pathname !== '/'`.
- Accept: on home, scroll moves camera through 6 distinct spatial beats mirroring section transitions, with no visible cut at route changes.

### K. Video-texture product card in 3D  [NEW, uses Shopify video]
- AT: video textures mapped on plane meshes.
- han1 target: extend `BestSellersCarousel.tsx` cards to optionally accept a Shopify media `video.sources[].url` and render a `VideoTexture`. Keep still image path as fallback. Preload videos off-screen in a hidden `<video muted playsInline loop preload="auto">` mounted inside the carousel via `React.createElement('video', ...)` and passed to `new THREE.VideoTexture()`.
- Hydrogen: use Hydrogen's `Video` or raw `<video>`. Respect CSP `media-src` (add `self cdn.shopify.com` to `entry.server.tsx`).
- Accept: first BestSellers card plays Shopify mp4 on plane; CLS=0; bandwidth capped via `preload="metadata"` until in-focus, then `preload="auto"`.

### L. Iridescent "pendant" accent objects  [NEW, optional]
- AT: chrome ring + wire curves behind logo.
- han1 target: procedural `TorusGeometry` + `TubeGeometry(CatmullRomCurve3)` in `SceneCanvas` under a new `<LogoPendant>` component. Reuse the fresnel material from item C.
- Accept: renders behind `AN_Logo`; does not interfere with `BestSellersCarousel` Z budget.

### M. Custom cursor parity  [already present]
- AT: implied custom cursor (touch-action:none).
- han1 already has `ChromeCursor`. Action: audit to ensure it hides on mobile (pointer coarse), on inputs, and over the nav pill. No new component.

### N. Page transitions between Hydrogen routes  [NEW]
- AT: single page, irrelevant.
- Hydrogen specific: add `app/components/global/RouteTransition.tsx` that wraps `<Outlet />`. Uses Remix's `useNavigation()` to detect `state === 'loading'`, fades a fixed black overlay with a fresnel ring sweep, then fades out on `state === 'idle'`. Avoid React view transitions API for broader browser support.
- Accept: navigating Shop -> PDP has a 400ms blackout, no white flash, `SceneCanvas` stays mounted the whole time.

## 3. Design tokens to merge into `styles/global-effects.css`

Add these, do not remove existing ones:

```
--at-glass-bg: rgba(0,0,0,0.6);
--at-glass-border: rgba(255,255,255,0.2);
--at-glass-blur: blur(8px);
--at-radius-pill: 500px;
--at-text-accent: #9ca5ff;
--at-text-glow: #00ffff;
--at-ease-chat: cubic-bezier(.17,.4,.02,.99);
--at-ease-fade: cubic-bezier(0.39, 0.575, 0.565, 1);
--at-particle-1: #556600;
--at-particle-2: #88aa00;
--at-particle-3: #aaccff;
```

## 4. Phased rollout (for Claude Code plan mode to sequence)

Phase 1 (visual, zero risk):
- D. Navigation pill split
- F. SideRail left-rail category links
- G. CornerTicker (optional)
- E. AmbientTicker (color-dodge block), no chat
- Tokens merge (section 3)

Phase 2 (scene enhancement):
- B. ParticleField inside SceneCanvas (gated by heroGone)
- C. Fresnel enhancement on AN_Logo
- I. sceneLengths.ts single-source-of-truth
- J. CameraRig with keyframes

Phase 3 (product + route):
- K. VideoTexture card in BestSellersCarousel
- L. LogoPendant accent
- N. RouteTransition overlay
- H. CookieBanner

Phase 4 (polish):
- M. ChromeCursor audit
- Prefers-reduced-motion fallback on B, C, J
- Lighthouse + FPS pass on low-end mobile

## 5. Risks and mitigations

- SSR crash on any WebGL/DOM access. Mitigate: every new component in `ClientOnly` + `React.lazy` with matching-height fallback.
- CSP block on new video texture. Mitigate: update `mediaSrc` in `entry.server.tsx`.
- Scroll ownership conflict if someone later adds FXScroll. Mitigate: document in CLAUDE.md "do not add FXScroll".
- Bloom blowing out particles. Mitigate: mount ParticleField outside `<Select>` so `SelectiveBloom` ignores it.
- Route-change flash of `SceneCanvas` reinit. Mitigate: SceneCanvas already lives in `root.tsx` Layout; keep it there.
- NBArchitekt licensing. Mitigate: substitute DM Sans unless client purchases.

## 6. Out of scope (explicit)

- FXScroll virtual scroll driver.
- AI chat with LLM. AmbientTicker is passive text only.
- Bespoke WebGL engine. R3F remains.
- Removing `SceneCanvas` or migrating to Next.js.

## 7. Acceptance summary

When Phases 1 to 3 are done the home route should read as AT-grade: black canvas, drifting particles, a chrome pendant logo that shifts color on scroll, a split nav pill, a left rail of periwinkle uppercase links that slide on hover, a color-dodge ambient text block bottom-left, a corner ticker bottom-right, video-textured product cards, and route transitions that never show a white flash. All of it must remain Hydrogen-friendly: SSR-safe, CSP-compliant, and route-portable.

End of plan.
