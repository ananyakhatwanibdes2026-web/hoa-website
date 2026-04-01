# HOUSE OF AN -- Project Intelligence

## Project Overview
House of an is a luxury contemporary jewellery e-commerce website built for client Ananyaa. Freelance developer: Kanav Purohit (Mumbai). This is a fully custom build with cinematic 3D animations, chrome/liquid metal aesthetic, and Shopify backend.

## Stack
- Framework: Shopify Hydrogen (React 18 + Remix), deployed on Shopify Oxygen
- 3D: React Three Fiber v8 + drei v9 (React 18 compatible, NOT v9/React 19)
- Post-processing: @react-three/postprocessing v2.19.1 (Bloom) -- installed with --legacy-peer-deps due to peer dep range mismatch with three@0.182
- Animations: GSAP + ScrollTrigger
- Smooth Scroll: Lenis (package: `lenis`, NOT `@studio-freight/lenis`)
- Styling: Tailwind v4 (CSS-based config, not tailwind.config.js)
- Language: TypeScript
- Fonts: Cormorant Garamond (display) + DM Sans (body)
- Store: house-of-an-2.myshopify.com
- Public Storefront API Token: 03fdb9f3527617f34324bc7c7f782330

## Architecture Decisions
- No `"use client"` directives (this is Remix/Hydrogen, not Next.js)
- All WebGL/Three.js components must be wrapped in ClientOnly to avoid SSR crashes
- @react-three/fiber causes SSR errors with scheduler: must add `ssr.optimizeDeps.include: ['scheduler']` in vite.config.ts
- @react-three/postprocessing and postprocessing must be in `ssr.external` in vite.config.ts to avoid SSR bundling
- PageLayout component (default Hydrogen header/footer) was REMOVED from root.tsx App function. We are building fully custom navigation and footer. Only Analytics.Provider wraps the Outlet now.
- Global effects (Lenis, background journey, cursor, grain, progress bar) render as siblings in Layout's body, NOT wrapping Hydrogen providers
- Background color journey uses scroll listener (not ScrollTrigger) for reliability with async Lenis init
- All 3D models are in public/models/ as Draco-compressed .glb files (no baked materials, shaders applied in code)
- Dev server runs at http://localhost:3000 (may increment to 3001/3002/3003 if ports are in use)
- **Global 3D liquid metal background**: SceneCanvas.tsx lives in `root.tsx` Layout (NOT _index.tsx), making it persist across ALL routes. Contains AN_Logo, 4 liquid metal blobs, 6 floating orbs, scroll decorative elements (chrome rings, glass shards, spirals, streaks), BackgroundPaths (flowing curves), ParticleSpiral (infinite particle cylinder), atmospheric fog, sparkles, Bloom post-processing, and scroll-driven camera with intro zoom. Fixed to viewport at z-index 0. HTML content scrolls on top as overlay (z-index 1).
- SceneCanvas is lazy-loaded via `React.lazy` behind `ClientOnly` + `Suspense` in `root.tsx` Layout.
- No HDR files are used anywhere. `blackhole.hdr` was removed from `public/`. All environment lighting uses Lightformer children only.
- **Base color palette**: #0f0a1e deep midnight blue. Used in --bg-primary, body background, and first two BackgroundJourney color stops. (Preloader tunnel still uses #0a0a0a -- do not change it.)
- **Color journey**: #0f0a1e (0-25%) -> #1e293b slate blue (50%) -> #3a4a5c (68%) -> #c0c0c0 refined silver (82-100%). Text flips #ffffff -> #111111 at 82%.
- **Click-to-enter flow**: EntrancePreloader has idle phase (still motion, button visible) and active phase (camera flies through gates). Communicates completion via `window.dispatchEvent(new Event('preloader-complete'))`.
- **Camera continuity**: SceneCanvas listens for `preloader-complete` event, then lerps camera from close-up [0, 0.2, 3.5] to normal [0, 0.5, 7] over ~2.5s before handing off to scroll-driven camera.
- **Atmospheric fog**: FogExp2 (density 0.012) in SceneCanvas syncs color with BackgroundJourney -- starts #0f0a1e, lerps through slate blue RGB values to #c0c0c0. Transition range: 0.68-0.82 scroll progress.
- **Scene phase system**: `scenePhaseState` in `sceneState.ts` holds `heroIntensity`, `aboutIntensity`, `transitionBlend` (plain JS object, no React). `ScenePhaseDriver` component in SceneCanvas reads scroll progress and drives these values. Used by LiquidBlob, FloatingOrb, DecoElement, BackgroundPaths, ParticleSpiral, AdaptiveSparkles, AdaptivePostFX to attenuate 3D spectacle elements after the Hero section. `TransitionBridge` renders chrome torus/ring geometry that pulses in the Hero-to-About scroll band (smoothstep 0.22-0.54). Key thresholds: `aboutIntensity` ramps at smoothstep(0.28, 0.48), `transitionBlend` enters at smoothstep(0.22, 0.30) and exits at smoothstep(0.42, 0.54).

## Key Patterns
- ClientOnly wrapper: useState(false) + useEffect(setMounted(true)) pattern for browser-only components
- Chrome material (logo): MeshPhysicalMaterial, metalness 1.0, roughness 0.05, envMapIntensity 2.5, clearcoat 0.3, clearcoatRoughness 0.1, color #c8c8c8
- Chrome material (preloader gate rings): MeshPhysicalMaterial, metalness 1.0, roughness 0.05, envMapIntensity 2.5, clearcoat 0.3, color #c8c8c8 (same as logo). Glow ring: MeshBasicMaterial, AdditiveBlending, color #888888.
- Liquid metal blobs: MeshDistortMaterial (from drei), color #111111, metalness 1.0, roughness 0.05, envMapIntensity 3.0, distort 0.25-0.4, speed 1.0-1.8. Heartbeat pulse: envMapIntensity modulated by `1 + sin(t*0.8)*0.15 + sin(t*1.6)*0.05` with per-blob phase offset.
- Camera animations: GSAP timeline for main motion, useFrame for micro-wobble
- Lenis + GSAP sync: lenis.on('scroll', ScrollTrigger.update) + gsap.ticker.add for RAF sync
- Draco decoder: ALL useGLTF calls must pass '/draco/' as second argument -- e.g. useGLTF('/models/foo.glb', '/draco/')
- Environment maps: use drei <Environment resolution={256} background={false}> with <Lightformer> children for local cubemaps -- no external HDR fetch, no CSP issues
- Scroll-driven 3D: getScrollProgress() reads Lenis scroll position (or window.scrollY fallback) inside useFrame, lerped via scrollRef for smooth transitions. Each 3D element reads scroll progress independently.
- Mouse-reactive floating orbs: module-level mouseState object {x, y, lerpX, lerpY} updated via mousemove listener, smoothed in useFrame. Each orb has a parallax factor (0.15 to 0.5) so closer orbs move more than distant ones. Heartbeat pulse on envMapIntensity with per-orb phase offset.
- Fog bridge transition (preloader): radial-gradient div overlay that fades in over 2.5s, masking the tunnel-to-hero transition. Uses #0a0a0a to match body bg. No white flash.
- Logo rotation: scene.rotation.set(-Math.PI / 2 + Math.PI, 0, Math.PI + Math.PI) -- flipped from original per client request. Do NOT add Y-axis rotation (Math.PI on Y mirrors text, turning "AN" into "NA"). Logo group Y-axis is scroll-driven coin-spin only.
- Logo scroll behavior: base scale 1.4, multiplied by lerp(1, 2, smoothSp) to compensate for camera z doubling (7->14). rotation.y = smoothSp * Math.PI * 4 (coin-spin). Idle breathing scale preserved.
- Liquid blobs: each BlobConfig now has driftX + driftZ fields. On scroll, blobs spread laterally away from logo (driftX -5 to +4) and push backward (driftZ 3-6) to prevent collision with spinning logo.
- SceneCanvas Lightformer intensities: overhead white 5 breathing (+/-0.5), left #ddd4ff (lavender tint for purple logo highlights), right #e8e8e8 neutral, front fill #ccc8d8, floor #080808.
- Bloom post-processing: luminanceThreshold 0.4, luminanceSmoothing 0.9, intensity 0.5 desktop / 0.3 mobile, radius 0.8
- BackgroundPaths color sync: white at 0.12 on dark, transition 0.68-0.82, #222222 charcoal at 0.18 on silver. NormalBlending.
- ParticleSpiral color sync: white at 0.55 on dark, transition 0.68-0.82, #222222 charcoal at 0.50 on silver. NormalBlending.
- Cursor (ChromeCursor): **REWRITTEN** -- dot + lagging ring design (NOT the old SVG arrow, do not revert). Chrome dot (7px, rgba(208,208,228,0.92)) snaps to mouse. Ring (28px) follows with lerp 0.11. On hover over a/button/input: ring scales 1.65x via CSS transition (0.28s cubic-bezier), border brightens. posRef wrapper holds position (no CSS transition), inner ringVisRef holds visual (CSS transition for scale/color only -- never mix RAF transform with CSS transition on the same element). 6-dot silver trail (3px, spawn every 12px, decay 0.038/frame). No RGB keyframes, no velocity tilt.

## File Structure
app/
  components/
    global/
      SmoothScroll.tsx        -- Lenis init + GSAP sync + singleton getLenis() export
      BackgroundJourney.tsx    -- Scroll-driven bg color (#0a0a0a greyish-black to off-white), sets --text-primary CSS var
      ChromeCursor.tsx         -- SVG arrow cursor (iridescent animated stroke, dark fill, velocity tilt ±14 deg) + 14-element glass drop trail. Injects CSS keyframes (`cursor-glow`, `chr-stroke`) into head on mount.
      GrainOverlay.tsx         -- SVG feTurbulence film grain, 4% opacity
      ScrollProgress.tsx       -- Gold gradient progress bar, fixed top
      GlobalEffects.tsx        -- Combines all 5, ClientOnly boundary
      SceneCanvas.tsx          -- Global persistent full-viewport R3F Canvas (position: fixed, z-index: 0). Contains: AN_Logo, 4 liquid metal blobs with heartbeat pulse, 6 mouse-reactive floating orbs with heartbeat pulse, scroll decorative elements (4 chrome rings, 3 glass shards, 2 chrome spirals, 3 light streaks), BackgroundPaths, ParticleSpiral, AtmosphericFog (scroll-synced FogExp2), AnimatedEnvironment (breathing Lightformers), scroll-driven camera with intro zoom, MouseTracker, EffectComposer + Bloom. Lazy-loaded in root.tsx Layout.
      BackgroundPaths.tsx      -- 8 path groups (4 left-biased, 4 right-biased) of flowing curves using THREE.Line + BufferGeometry. 5 parallel lines per group (40 total desktop, 16 mobile). Scroll warp, mouse magnet deflection, radial center mask (3.0 unit clear zone), parallax drift (0.8x factor, alternating direction). NormalBlending. Color syncs with BackgroundJourney: white on dark, #111111 at 0.15 on light.
      ParticleSpiral.tsx       -- Infinite particle cylinder using THREE.Points + BufferGeometry. 4500 desktop / 1500 mobile particles. Spiral layout (6 turns, radius 3-18, center-cleared at 3.5). 40-unit tall column (Y_EXTENT=20) with seamless Y-wrapping on scroll. Scroll-driven rotation (slower 1.2x PI) + tightness contraction. Mouse repel (radius 4.0). NormalBlending. Color syncs with BackgroundJourney. Positioned at [0,0,-14], tilted -0.3.
    sections/
      EntrancePreloader.tsx    -- Click-to-enter cinematic gate tunnel. Two phases: idle (still motion, "ENTER THE LUXURY" button, god rays breathing, grain overlay) and active (camera flies z=40 to z=-115, fog bridge). Dispatches 'preloader-complete' event. God rays: 6 PlaneGeometry spokes + central CircleGeometry glow at z=-95 with AdditiveBlending. Grain: inline SVG feTurbulence overlay at 5% opacity. Button: DM Sans, uppercase, 0.3em letter-spacing, glowing border pulse.
      HeroSection.tsx          -- Pure HTML overlay. "House of An" centered dead-center (top:50%, width:100%, translateY(-50%)). Cormorant Garamond weight 200, 0.65em tracking, gradient shimmer text (webkit-background-clip), drop-shadow filter for legibility. Hairline rule accent below. GSAP animates opacity only (no transform). heroFloat keyframe handles vertical float. Scroll chevron at bottom.
      AboutSection.tsx         -- Editorial about layout. Left: "THE REFINED REBELLION" DM Sans 800, ~10.5vw, rgba(255,255,255,0.20). Right: Founded label + hairline divider + 2 body paragraphs. Dark radial gradient mask on right for legibility. ScrollTrigger scrub:1 (start:'top 78%', end:'bottom 5%'): left slides in x:-80->0, right items stagger y:20->0, exit fade+y:-32 at 88% progress. Mobile: left anchored top 18%, right bottom 10%.
      BestSellersSection.tsx   -- Parent HTML for Bestsellers: title, subtitle, product name, dot indicators, touch swipe, animating ref. No arrow buttons. `goToCard(index)` rotates to any card via shortest-path GSAP (power3.inOut, 1.0s). Lazy-loads BestSellersCarousel via React.lazy + ClientOnly + Suspense. No background overlay div (transparent, global SceneCanvas shows through).
      BestSellersCarousel.tsx  -- Self-contained R3F Canvas for 3D carousel. 5 CarouselCards on a FIXED camera-aligned ellipse (RADIUS 3.8, Z_FLATTEN 0.42). Each card computes worldAngle = baseAngle + rotStateRef.angle per frame. Auto-rotation (AUTO_SPEED 0.003 rad/frame), pauses only during GSAP tweens (animatingRef -- NO hover-pause). Canvas pointerEvents: auto (raycasting enabled). Cards have hover glow (additive RoundedBox, opacity lerps 0->0.28) + onClick -> onCardClick(index). Exports createRotationHandlers, CARDS, CARD_TITLES.
      CategoriesSection.tsx    -- Fullscreen pinned scroll gallery for 3 earring product lines (Edge, Sculpt, Elite). Pure HTML/CSS/GSAP -- no R3F. Outer div 600vh desktop / 480vh mobile creates scroll space. Inner div position:sticky top:0 height:100vh. 3 panels (z:1/2/3), panels 2+3 start translateX(100%) and wipe in with a 2px chrome leading-edge line. Split layout: 45% left text (Cormorant name + DM Sans num/tagline/cta) / 55% right image frame (portrait 3:4, gradient placeholder + real img on top). GSAP scrub:2 timeline: frame2Ref animates as its own tween at 0.50 (NOT in stagger array with text -- stagger bug caused image to appear after text exit). Text stagger 0.01 so all 5 items land before exit at 0.62. Image files: /images/categories/edge1.jpg, sculpt2.jpg, elite3.jpg. Progress dots: 3 pills, active 20px, inactive 5px, CSS transition. categoriesSectionState added to sceneState.ts.
  lib/
    sceneState.ts              -- Plain JS shared state objects for cross-module communication: aboutSectionState {active, sectionProgress}, bestsellersSectionState {active, sectionProgress}, scenePhaseState {heroIntensity, aboutIntensity, transitionBlend}, categoriesSectionState {active, sectionProgress}. No React dependency.
  routes/
    _index.tsx                 -- Homepage: renders EntrancePreloader + scrollable HTML overlay (HeroSection + AboutSection + BestSellersSection + CategoriesSection + placeholder sections for THE WHY / CAMPAIGN / LOOKBOOK / TESTIMONIALS + FOOTER). SceneCanvas no longer here (moved to root.tsx).
  images/
    categories/
      edge1.jpg                -- Edge earring collection photo (added by client)
      sculpt2.jpg              -- Sculpt earring collection photo (added by client)
      elite3.jpg               -- Elite earring collection photo (added by client)
  styles/
    fonts.css                  -- Font CSS variables
    global-effects.css         -- Design system CSS vars (--bg-primary: #0a0a0a), Lenis classes, cursor hide
  entry.server.tsx             -- CSP config (see CSP section below)
public/
  draco/                       -- Local Draco WASM decoder (copied from node_modules/three)
    draco_decoder.js
    draco_decoder.wasm
    draco_wasm_wrapper.js
  models/
    AN_Logo.glb               -- 22 KB, House of an logo geometry
    entrance2.glb              -- 323 KB, tunnel/portal (unused, preloader uses procedural gates)
    Podium.glb                 -- 401 KB, pedestal (unused currently, for future hero concept)
    rock.glb                   -- 38 KB, sculptural rock (unused currently, for future hero concept)
    Spiral.glb                 -- 209 KB, spiral for About section
    star.glb                   -- 16 KB, decorative star element
    surface1.glb               -- 96 KB, landscape/terrain (unused currently, for future hero concept)

## Design Direction (from Ananyaa's Canva Deck)

### Overall Aesthetic
Liquid chrome, fluid silver metal, futuristic luxury. Everything should feel like molten silver in motion. The mood board shows: chrome tunnel portals, liquid metal blobs with chrome sphere droplets, twisted chrome rings, dark environments with high-contrast metallic reflections. Think Apple Vision Pro meets high-end jewellery.

### Background Color Journey (scroll-driven, throughout page -- IMPLEMENTED)
- 0-25%: Greyish-black (#0a0a0a) -- hero and early scroll, matches liquid metal aesthetic
- 25-45%: Hold greyish-black (#0a0a0a)
- 45-60%: Transition to dark navy (#0f1525 to #0d1f3c)
- 60-78%: Navy to light silver (#0d1f3c to #d8d8dc)
- 78-90%: Off-white (#d8d8dc to #f0f0f2)
- 90-100%: Final off-white (#f0f0f2 to #f5f5f7)
Initial page background (CSS + body): #0a0a0a (greyish-black, matches liquid metal blobs and tunnel).
Client words: "Start with dark then lighter & silverish. Black & dark blue accents. Then moving to light from categories page, white silverish with light accents."

### Liquid Glass Effect (key technique for logo/about/nav)
SVG feTurbulence + feDisplacementMap filter for real glass distortion:
- feTurbulence type="fractalNoise" baseFrequency="0.001 0.005" numOctaves="1"
- feGaussianBlur stdDeviation="3" for softening
- feSpecularLighting surfaceScale="5" specularConstant="1" specularExponent="100" for chrome highlights
- feDisplacementMap scale="200" for warping nearby elements
- Apply via backdropFilter: blur(3px) + filter:url(#glass-distortion)
- Animate baseFrequency via GSAP for breathing distortion effect
Used around the logo in navigation and About section to make text/elements morph like liquid glass.

### Reference Sites
- activetheory.net: Logo behavior (overlays content on scroll, reappears), liquid glass distortion around 3D elements, page transitions, About section spiral inspiration. Key takeaway: the 3D logo sits in the center, content scrolls past it, elements near the logo get distorted/warped.
- igloo.inc: Entrance tunnel fly-through, scroll-driven 3D scenes, chrome shaders. Key takeaway: the portal entrance, concentric rings, camera flying through.
- moblinks.fr: Campaign section scroll reveal. Key takeaway: stacked full-width panels that peel/slide away on scroll to reveal the next.
- MISHO: Footer layout. Key takeaway: clean multi-column luxury footer with minimal typography.

## Section-by-Section Specification

### 1. Entrance Preloader (BUILT -- click-to-enter, ~6 seconds after click)
- Two-phase flow: idle (still motion) + active (camera fly-through)
- **Idle phase**: Camera at z=40, gates rotate slowly, god rays breathe, sparkles drift, "ENTER THE LUXURY" button visible
- **Active phase**: Button click triggers GSAP timeline, camera flies z=40 to z=-115 over ~5.8s
- "ENTER THE LUXURY" button: DM Sans, uppercase, 0.3em letter-spacing, 1px glowing border with pulse animation, sharp technical feel
- God rays: 6 thin PlaneGeometry(0.3, 80) spokes at z=-95 + central CircleGeometry(3) glow, AdditiveBlending, slow rotation + sine opacity oscillation
- Background grain: inline SVG feTurbulence overlay, opacity 0.05, mix-blend-mode overlay
- 8 chrome torus gate rings (NOT entrance2.glb), each with glow ring
- Deep space background: scene bg #0a0a0a, fogExp2 (#0a0a0a, 0.012), Stars, Sparkles, PointLights
- Canvas: fov=60, near=0.1, far=200
- Neutral silver Lightformer lighting
- Micro-wobble (halved amplitude in idle, full in active)
- Fog bridge transition: radial-gradient overlay, #0a0a0a, no white flash
- Dispatches `window.dispatchEvent(new Event('preloader-complete'))` on completion
- Scroll locked during animation (body overflow hidden, Lenis paused)
- Failsafe: scene loading 15s, animation 12s after click
- Mobile: dpr [1,1], skip spotLight

### 2. Hero + Global 3D Background (BUILT -- liquid metal architecture + background elements)
SceneCanvas is a GLOBAL component in root.tsx Layout, persisting across ALL routes. It serves as the liquid metal background for the entire site.

**SceneCanvas (3D layer, global, persistent across all routes):**
- AN_Logo centered at (0, 0.3, 0) with MeshPhysicalMaterial chrome
- Logo rotation: scene.rotation.set(-Math.PI / 2 + Math.PI, 0, Math.PI + Math.PI)
- Logo has idle rotation and subtle breathing scale (no scroll-dependent fade)
- 4 liquid metal blobs (2 on mobile) with heartbeat pulse on envMapIntensity
- 6 floating metallic orbs with mouse parallax + heartbeat pulse (3 on mobile)
- Scroll decorative elements: 4 chrome rings, 3 glass shards, 2 chrome spirals, 3 light streaks (1/3 on mobile). Each has scrollMin/scrollMax visibility range, fade ramps, drift, slow rotation.
- BackgroundPaths: 8 groups of flowing curves spread across left/right gutters, 40 lines desktop / 16 mobile, scroll warp + mouse magnet + radial center mask + color inversion
- ParticleSpiral: infinite 4500-particle cylinder (1500 mobile), radius 3-18, seamless Y-wrapping, scroll rotation + tightness, mouse repel + color inversion
- AtmosphericFog: FogExp2 (density 0.012) with scroll-synced color (#0a0a0a dark, #d8d8dc light)
- AnimatedEnvironment: breathing Lightformer intensities (overhead 5 +/- 0.5)
- Sparkles (25 desktop, 10 mobile)
- Camera intro zoom: starts [0, 0.2, 3.5], lerps to [0, 0.5, 7] on preloader-complete, then scroll-driven pull-back to [0, 3, 14]
- Canvas: fov=75, near=0.1, far=200, alpha=true, ACES filmic tone mapping
- EffectComposer + Bloom: luminanceThreshold 0.4, intensity 0.5 desktop / 0.3 mobile, radius 0.8

**HeroSection (HTML overlay):**
- Glassmorphism container: backdrop-blur 12px, background rgba(255,255,255,0.03), border 1px #ffffff10, border-radius 16px
- "House of An" h1 in Cormorant Garamond, "Contemporary Luxury Jewellery" subtitle
- Floating animation: heroFloat keyframe (translateY +-4px, 6s, ease-in-out, infinite)
- Text fades in 0.5s after preloader completes
- Animated scroll chevron at bottom
- Section is pointer-events: none, text elements are pointer-events: auto

**Removed from previous version:** Satellites, chrome arches, crystal shards, logo heroFade opacity, white flash overlay.

**Original brief (DEFERRED, not built):** Rock/podium/particle dissipation/logo reformation concept. Models (rock.glb, Podium.glb, surface1.glb) exist but are unused.

### 3. Navigation (fixed, responsive)
- 3D coin-style House of an logo that rotates on scroll
- Logo gets overlaid by content on scroll, then reappears (Active Theory style)
- Liquid glass distortion (SVG filter) and chromatic aberration on logo when in motion
- Nearby text/elements warp around logo using SVG displacement filter
- Hamburger menu for mobile
- Must work well on both phone and laptop, must NOT be laggy
- Subtle clean overlays around logo
- Smooth animated page transitions between routes

### 4. About Section (the "crazy" one per Ananyaa)
- 3D chrome logo is the centerpiece, heavily animated, "crazy" per client
- Logo morphs surrounding text and elements with liquid glass effect
- Word-by-word text reveal on scroll
- 3D spiral (Spiral.glb) with product images orbiting horizontally in a continuous loop
- NOT diagonal spiral movement, horizontal circular path with images revolving around it
- Text and elements subtly morph like liquid glass around the logo

### 5. Bestsellers (BUILT -- 3D cylindrical carousel, NON-NEGOTIABLE)
- 3D cylinder with 5 product cards rotating around it
- NOT horizontal scroll. Client specifically requires cylindrical 3D effect.
- Never replace with horizontal scroll under any circumstances
- Metal parts floating in anti-gravity feel
- Product data from Shopify Storefront API via GraphQL (currently placeholder CanvasTextures)
- **Carousel architecture (fixed-ellipse)**: Cards individually position themselves on a camera-aligned ellipse each frame. The parent `<group>` does NOT rotate. Each card computes `worldAngle = baseAngle + rotStateRef.current.angle` and sets its own `position.x = sin(worldAngle) * RADIUS`, `position.z = cos(worldAngle) * RADIUS * Z_FLATTEN`, `rotation.y = worldAngle`. This ensures symmetrical card spacing regardless of which card is at the front.
- **Auto-rotation**: Continuous drift `AUTO_SPEED = 0.003` rad/frame. Pauses ONLY during GSAP tweens (`animatingRef`). No hover-pause (hoverRef is still passed but no longer affects rotation).
- **Click-to-front**: Clicking any card calls `goToCard(index)` in BestSellersSection. Uses shortest-path modular arithmetic to find `delta` then `gsap.to(rotStateRef.current, {angle: current+delta, duration:1.0, ease:'power3.inOut'})`. Updates `activeIndex` + dot indicators.
- **Card hover glow**: Each CarouselCard has a glow RoundedBox (2.75 x 3.85 x 0.01, z=-0.02, AdditiveBlending). `glowIntensRef` lerps 0->1 on `onPointerEnter`, back to 0 on `onPointerLeave`. `glowMaterial.opacity = glowIntensRef * 0.28`.
- **No arrow buttons**: Arrow buttons removed. Navigation via touch swipe (48px threshold) + dot indicators + card click.
- **No dark vignette/box**: The section has no background overlay div. The global SceneCanvas shows through the transparent carousel Canvas.
- Chrome RoundedBox frames (metalness 1, roughness 0.04, clearcoat 0.6) + inset PlaneGeometry image panel
- Per-card scale via cos(worldAngle): front=1.0, sides=~0.62, 0.08 lerp smoothing
- Anti-gravity bob + subtle tilt per card in useFrame
- GSAP rotState.angle accumulates continuously (sin/cos periodic, no modulo jump)
- Canvas `pointerEvents: auto` -- required for R3F raycasting (onPointerEnter/Leave/Click on meshes)

### 6. Categories (BUILT -- pinned scroll gallery, 3 product lines)
- **Implemented as**: fullscreen pinned scroll gallery for 3 earring lines: Edge, Sculpt, Elite (client revised scope from 7 generic categories to 3 specific product lines with real photography)
- CSS sticky pinning: 600vh outer / 100vh sticky inner. No GSAP pin. Pure HTML/CSS/GSAP.
- 3 panels reveal sequentially on scroll via translateX wipe + chrome leading-edge sweep
- Split layout: left text (Cormorant name, DM Sans number/tagline/CTA) / right image frame (3:4 portrait)
- Real images: /public/images/categories/edge1.jpg, sculpt2.jpg, elite3.jpg
- Gradient placeholders (silver for Edge/Sculpt, gold for Elite) shown until real images load
- GSAP scrub:2. Key timing lesson: frameRef must be its own tween, NOT in the text stagger array
- Progress dots at bottom center (3 pills, CSS transition on width)
- `categoriesSectionState` in sceneState.ts
- Background starts transitioning lighter from this section (scroll ~0.50-0.65)

### 7. The Why (simple section, no crazy 3D)
- Two-column grid layout
- Left: big italic heading "Why House of an?" in Cormorant Garamond
- Right: body text in DM Sans, two SVG line draw animations on scroll
- 3 stats: 12K+ Pieces Crafted, 97% Recycled Silver, 48H Dispatch
- Counter animation on scroll into view

### 8. Campaign (stacked card scroll reveal)
- Stacked full-width photo panels (moblinks.fr reference)
- On scroll, each card peels/slides away to reveal the next underneath
- "CAMPAIGN 01" style numbering in Cormorant Garamond
- Light/silver background by this point
- Real campaign photos from Ananyaa (placeholder for now)

### 9. Lookbook / As Seen On (interactive horizontal scroll)
- Celeb and event photos in horizontal infinite scroll marquee
- Fluid, moving feel, not static grid
- Infinite loop, slows on hover, fade edges with mask gradient

### 10. Testimonials + Footer (combined section)
- Testimonials: cute interactive pop-ups that expand/animate on hover
- NOT letter cards or marquee. Pop-up interactive style.
- Chrome radial gradient background for testimonials area
- Footer: MISHO-style layout
- Two decorative SVG arc lines
- Ghost logo watermark
- 5-column grid: About + socials, Shop, Support, Explore, Newsletter
- Newsletter form connected to Shopify

## Inner Pages (Phase 3)

### Product Detail Page (PDP)
- Stacked card image gallery
- Arrow press: current image slides UP smoothly, next image transitions in from below
- "Ready to Ship" badge
- Product title, SKU, price in INR
- Quantity selector with +/- buttons
- Gift packaging checkbox option
- "You may also like" recommendations
- "ADD TO BAG" and "BUY IT NOW" buttons
- Product data from Shopify Storefront API
- Custom 3D chrome paper airplane cursor on the image gallery (from Ananyaa's reference)

### Collection/Listing Page (PLP)
- Category browsing with filters
- Product grid from Shopify collections

### Cart + Checkout
- Standard Shopify checkout flow

## Client Info
- Client: Ananyaa, luxury contemporary jewellery label, India
- Domain: TBD (houseofan.com or houseofan.in)
- Shopify plan: Basic/Starter (online only, no POS)
- Content status: Most visual assets still needed (photos, testimonials, etc.)

## CSP Configuration (app/entry.server.tsx)
Hydrogen's createContentSecurityPolicy uses these top-level keys (NOT a nested `directives` object):
```ts
createContentSecurityPolicy({
  shop: { checkoutDomain: '...', storeDomain: '...' },
  scriptSrc: ["'self'", "'unsafe-inline'", "'wasm-unsafe-eval'", 'https://cdn.shopify.com'],
  scriptSrcElem: ["'self'", "'unsafe-inline'", 'https://cdn.shopify.com'],
  workerSrc: ["'self'", 'blob:'],           // REQUIRED for Three.js DRACOLoader blob worker
  styleSrc: ["'self'", "'unsafe-inline'", 'https://cdn.shopify.com', 'https://fonts.googleapis.com'],
  fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
})
```
Key lessons:
- `workerSrc: blob:` is CRITICAL -- DRACOLoader uses URL.createObjectURL(new Blob([...])) for its worker
- `wasm-unsafe-eval` needed for WebAssembly (Draco decoder)
- Hydrogen merges provided scriptSrc array with nonce automatically (appends nonce-{value})
- <Environment preset="city"> fetches HDR from raw.githack.com -- blocked by CSP. Use Lightformer children instead.

## Rules
- NEVER use em dashes in any code, comments, or output
- Performance is critical. Client said "shouldn't be laggy at all"
- The 3D cylindrical bestseller carousel is SACRED. Never replace with horizontal scroll.
- Always test with `npm run dev` after changes
- Always wrap Three.js/R3F components in ClientOnly
- Check for SSR issues before considering any step done
- Cap dpr at [1, 1.5] on desktop, [1, 1] on mobile for performance
- ALL useGLTF calls need '/draco/' as the second argument (local decoder, avoids CSP block)
- Never use <Environment preset="..."> -- it fetches external HDR. Use <Environment> with <Lightformer> children
