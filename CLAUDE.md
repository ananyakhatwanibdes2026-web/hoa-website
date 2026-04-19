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
- Fonts: Cormorant Garamond (display) + DM Sans (body) + Barlow 700/800 (About/Why headings, added 2026-04-07) + Bebas Neue (loaded, no longer used for section headings) + Nunito (loaded, unused)
- Store: house-of-an-2.myshopify.com
- Public Storefront API Token: 03fdb9f3527617f34324bc7c7f782330

## Architecture Decisions
- No `"use client"` directives (this is Remix/Hydrogen, not Next.js)
- All WebGL/Three.js components must be wrapped in ClientOnly to avoid SSR crashes
- @react-three/fiber causes SSR errors with scheduler: must add `ssr.optimizeDeps.include: ['scheduler']` in vite.config.ts
- @react-three/postprocessing and postprocessing must be in `ssr.external` in vite.config.ts to avoid SSR bundling
- PageLayout component (default Hydrogen header/footer) was REMOVED from root.tsx App function. We are building fully custom navigation and footer. Only Analytics.Provider wraps the Outlet now.
- Global effects (Lenis, background journey, cursor, grain, progress bar) render as siblings in Layout's body, NOT wrapping Hydrogen providers. **Body render order (updated 2026-04-14)**: RouteTransition (z-200) > GlobalEffects > Navigation > SideRail > AmbientTicker > CornerTicker > SceneCanvas (z-0) > {children}.
- Background color journey uses scroll listener (not ScrollTrigger) for reliability with async Lenis init
- All 3D models are in public/models/ as Draco-compressed .glb files (no baked materials, shaders applied in code)
- Dev server runs at http://localhost:3000 (may increment to 3001/3002/3003 if ports are in use)
- **Global 3D background**: SceneCanvas.tsx lives in `root.tsx` Layout (NOT _index.tsx), making it persist across ALL routes. Contains AN_Logo, StarField (25 star.glb), RockField (8 rock.glb shooting stars), **ParticleField (12k THREE.Points, added 2026-04-14, hero-only, outside Select)**, AtmosphericFog (scroll-synced FogExp2), AnimatedEnvironment (breathing Lightformers + sapphire #1a50c8 backlight), scroll-driven camera with intro zoom, MouseTracker, AdaptivePostFX (SelectiveBloom stars+rocks). All previous elements (blobs, orbs, deco rings/shards/spirals, BackgroundPaths, ParticleSpiral, AdaptiveSparkles) REMOVED. Fixed to viewport at z-index 0.
- SceneCanvas is lazy-loaded via `React.lazy` behind `ClientOnly` + `Suspense` in `root.tsx` Layout.
- No HDR files are used anywhere. `blackhole.hdr` was removed from `public/`. All environment lighting uses Lightformer children only.
- **Base color palette**: #000000 pure black (AT-aligned, updated 2026-04-11). Used in --bg-primary, body background, and first BackgroundJourney stop.
- **Color journey (updated 2026-04-12)**: Body background is ALWAYS pure #000000. BackgroundJourney.tsx has only 2 stops ({pos:0, bg:'#000000'} and {pos:1, bg:'#000000'}). All blue accent lighting comes exclusively from the NightSkyShader in SceneCanvas. The previous 26-stop black/#0f2050 oscillation has been removed entirely.
- **AT-aligned CSS tokens** (app/styles/global-effects.css): `--at-accent: #6080e0`, `--at-accent-bright: #9ca5ff`, `--at-blue-steel: #1a2840`, `--at-blue-silver: #8ab0d0`. **Added 2026-04-14**: `--at-glass-bg: rgba(0,0,0,0.55)`, `--at-glass-border: rgba(255,255,255,0.14)`, `--at-glass-blur: blur(12px)`, `--at-radius-pill: 500px`, `--at-text-accent: #9ca5ff`, `--at-text-glow: #00e5ff`, `--at-ease-out: cubic-bezier(0.17,0.4,0.02,0.99)`, `--at-particle-dim: rgba(140,170,240,0.18)`. Use these for any new border/glow/accent/glass colors.
- **EntrancePreloader status (PERMANENTLY REMOVED 2026-04-11)**: `EntrancePreloader.tsx` deleted. Not in _index.tsx. Do not re-add. Site loads directly into hero.
- **preloader-complete event**: REMOVED from the codebase entirely. No event is dispatched, no listener exists. `_starEntryActive = true` at module level in SceneCanvas (stars visible immediately). `ScrollCamera.introRef` initialised as `{active:true, progress:0, started:true}` so the 2.5s camera zoom fires on mount with no event trigger.
- **Camera intro**: Initialises immediately on SceneCanvas mount. Camera lerps from [0,0.2,3.5] to [0,0.5,7] over 2.5s (Hermite easing, delta/2.5 per frame). After intro completes, scroll-driven camera takes over. No jump.
- **Atmospheric fog (updated 2026-04-11)**: FogExp2 (density 0.012) continuous sinusoidal oscillation. Formula: `cycle = sin(scrollRef * 18.85) * 0.5 + 0.5` (3 full cycles per 100% scroll). Color lerps between near-black (0.000, 0.000, 0.008) and #0f2050 (0.059, 0.125, 0.314). Synced with BackgroundJourney and NightSkyShader. Initial FogExp2 color: #000000.
- **Scene phase system**: `scenePhaseState` in `sceneState.ts` holds `heroIntensity`, `aboutIntensity`, `transitionBlend`, `latePageFade`, `logoFade` (plain JS object, no React). `ScenePhaseDriver` component in SceneCanvas reads scroll progress and drives these values. Currently used by StarField (hero fade) and AdaptivePostFX. `TransitionBridge` was REMOVED. Key thresholds: `aboutIntensity` ramps at smoothstep(0.28, 0.48), `transitionBlend` enters at smoothstep(0.22, 0.30) and exits at smoothstep(0.42, 0.54).
- **Late-page fade**: `latePageFade` in scenePhaseState ramps at smoothstep(0.24, 0.30) with lerp damping 0.15. Note: the AN_Logo does not use latePageFade directly -- it uses `logoFade` instead. Stars use their own scroll-based fade (smoothstep 0.0-0.22) rather than latePageFade.
- **Logo fade**: `logoFade` driven by `aboutSectionState.sectionProgress`. Formula: `clamp01(sectionProgress / 0.04)`, floored by `Math.max(..., targetLateFade)`. Logo fades the instant About content appears (sectionProgress 0.04) and is fully gone almost immediately. Lerp factor 0.30 (was 0.12) -- snaps in ~100ms. AN_Logo reads `scenePhaseState.logoFade` for opacity (`1 - logoFade`) and rotation slowdown (`1 - logoFade * 0.97`).
- **Hero-to-About spacer**: 200vh transparent `<div>` in _index.tsx between HeroSection (270vh) and AboutSection. Total hero zone = 470vh. Background turns black (#050505) by the end of the spacer -- seamless About blend.
- **About-to-Bestsellers spacer**: 180vh section in _index.tsx containing "House of An" + "BESTSELLERS" title card. Sticky inner (100vh) keeps text centered. GSAP scrub timeline: fade in (y:48→0, 0-35%), hold (35-65%), fade out (y:→-32, 65-100%). BestSellersSection has marginTop:-5vh.
- **Bestsellers background wipe**: REMOVED (2026-04-12). wipeBgRef fixed div + its ScrollTrigger clip-path tween + display-toggle trigger all deleted. Global NightSkyShader now shows through the entire section. Bottom vignette (`#060c18`) also removed.

- **Scroll-reactive section backgrounds (2026-04-17, revised end of day)**: Categories + Why still use per-section bg components (`CategoriesWeaveCanvas`, `WhyMistCanvas`) mounted inside their sticky inner. **Campaign + Lookbook share a single `ContinuousAuroraCanvas`** mounted ONCE in `_index.tsx` as a `position:fixed` full-viewport Canvas2D (see its own description below). `CampaignMonolithBg` + `LookbookAuroraCanvas` were DELETED -- the shared canvas subsumes both. Per-section components still read their own `<section>SectionState.sectionProgress` on a self-contained RAF gated by `state.active`; alpha `smoothstep(0,0.12,sp)*(1-smoothstep(0.88,1,sp))`. **State ScrollTrigger contract**: `start:'top top', end:'bottom bottom', invalidateOnRefresh:true` -- bounds match sticky-pinned window. **Wrapper margins (updated end of day 2026-04-17)**: Why `margin:'-120vh -1rem 0'`, Campaign `margin:'0 -1rem'` (no overlap -- was pulling Campaign into Why), Lookbook `margin:'-120vh -1rem 0'`. Overlap consumes most of the preceding section's 100vh pin-release zone, overlapping ~20vh into its still-pinned tail; later wrapper's `zIndex:1` + its own sticky inner take visual priority. Canvas2D chosen over 4th WebGL context. dpr cap `[1,1.5]` desktop / `[1,1]` mobile. `prefers-reduced-motion:reduce` renders one static frame.

## Key Patterns
- ClientOnly wrapper: useState(false) + useEffect(setMounted(true)) pattern for browser-only components
- Chrome material (logo): MeshPhysicalMaterial, **color #eef0f2** (near-white silver), **metalness 1.0**, **roughness 0.16**, **envMapIntensity 1.0**, no emissive, **clearcoat 0.0** (updated 2026-04-18 -- polished studio chrome, bare metal). **envMap from `useStudioChromeEnvMap()`** hook (see below) -- overrides scene.environment so logo is isolated from the blue sapphire Lightformer / NightSkyShader aurora. No bloom (outside Select). Prior values (2026-04-14 satin silver: #c0c8d8 / 0.95 / 0.18 / 1.4 / clearcoat 0.6) were blue-washed because metal reflects env color directly.
- **`useStudioChromeEnvMap()`** hook (SceneCanvas.tsx, above LogoModel ~line 266): bakes a 256² WebGLCubeRenderTarget (HalfFloatType) ONCE on mount from an offscreen Scene of 6 MeshBasicMaterial panels (toneMapped:false, DoubleSide). Panels: overhead key 6x2.2 #ffffff×2.4, left softbox 3.8x5 #f2f4f8×1.9, right softbox 3.8x5 #f2f4f8×1.6, front fill 5x3 #e8eaf0×1.2, rim 5x3 #dcdde2×0.7, dark floor 6x6 #0a0a0c×0.2. Scene background #050507. CubeCamera(0.1, 50, rt) + `cam.update(gl, scene)`. Returns `rt.texture` assigned to logo `material.envMap`. Stars/rocks (no explicit envMap) still read the sapphire-tinted global AnimatedEnvironment -- logo isolation is automatic via `material.envMap` precedence. CLAUDE.md rule preserved: no HDR files, no external preset fetch.
- Star decoration material: MeshPhysicalMaterial + emissive (config.color, emissiveIntensity 0.12-0.18 base, +0.5 on cursor proximity). metalness 1.0, roughness 0.06, envMapIntensity 2.5 + sin*0.8 + proximity*3.5, clearcoat 0.5. **Foreground colors now blue-silver** (#b0cce8, #a0c4fc, #b8d0f0, #c8e0ff, #aacaf4). 25 instances (15 mobile) in 3 depth layers: foreground (5, z:-1.5 to -2.5, scale 0.38-0.55, parallax 0.58-0.76), midground (12, z:-3 to -5, scale 0.15-0.32), background (8, z:-6 to -9, scale 0.08-0.14). Entrance: scale 0->1 on preloader-complete, staggered by phase*0.12s. Scatter: pos * 3.5x radially + z+4, rotation 5x. Fade: smoothstep(0.0, 0.22). **Scroll lerp: 0.07** (was 0.04).
- Rock decoration material (NEW): 8 rock.glb instances. MeshPhysicalMaterial color #88acd0 (steel blue-silver), emissive #1a3870 (deep blue), metalness 0.95, roughness 0.18, envMapIntensity 2.0, clearcoat 0.3. Scale 0.36-0.52 (2x biggest star). 5 left-edge rocks sweep rightward (travelX +20-26), 3 right-edge rocks sweep leftward (travelX -21-23). Staggered sweep: starts at phase*0.018 scroll, spans 16% window. Rotation ramps 7x during sweep. Fade: smoothstep(0.0, 0.28). **Scroll lerp: 0.07**. Mobile: 4 rocks. Reuses `_starEntryActive`/`_starEntryTime` for entrance.
- Camera animations: GSAP timeline for main motion, useFrame for micro-wobble
- Lenis + GSAP sync: lenis.on('scroll', ScrollTrigger.update) + gsap.ticker.add for RAF sync
- Draco decoder: ALL useGLTF calls must pass '/draco/' as second argument -- e.g. useGLTF('/models/foo.glb', '/draco/')
- Environment maps: use drei <Environment resolution={256} background={false}> with <Lightformer> children for local cubemaps -- no external HDR fetch, no CSP issues
- Scroll-driven 3D: getScrollProgress() reads Lenis scroll position (or window.scrollY fallback) inside useFrame, lerped via scrollRef for smooth transitions. Each 3D element reads scroll progress independently.
- Mouse parallax: module-level mouseState object {x, y, lerpX, lerpY} updated via mousemove listener, smoothed in useFrame. Stars use parallax factor 0.15-0.42 so closer stars move more than distant ones.
- Logo rotation: scene.rotation.set(-Math.PI / 2 + Math.PI, 0, Math.PI + Math.PI) -- flipped from original per client request. Do NOT add Y-axis rotation (Math.PI on Y mirrors text, turning "AN" into "NA"). Logo group Y-axis is scroll-driven coin-spin only.
- Logo scroll behavior: base scale 1.4, multiplied by `Math.max(0.05, 1.0 - smoothSp * 3.0)` -- logo shrinks as user scrolls (reaches ~0.56 scale by sp=0.20, then disappears via logoFade). Previously grew (`lerp(1,2,sp)`) to compensate camera pullback. rotation.y driven by lerped rotSpeed = smoothSp * Math.PI * 32. Rotation slows to stop as logoFade rises. Idle breathing scale preserved.
- SceneCanvas Lightformer intensities (updated 2026-04-11): overhead white 3.5 breathing (+/-0.3), **left #b0ccff cool blue-white** (was #ddd4ff warm lavender), right #e8e8e8 neutral, **front fill #c0ccf0 cool periwinkle-white** (was #ccc8d8), floor #080808, **sapphire #1a50c8 intensity 3.5 at z=-10** (was 2.5 -- boosted for stronger blue reflection on chrome).
- Bloom post-processing: **SELECTIVE -- stars + rocks, logo excluded**. `Select enabled` wraps StarField + RockField. LogoModel outside Select. `SelectiveBloom` (mipmapBlur, threshold 0.55, smoothing 0.9, intensity 0.55 desktop / 0.35 mobile).
- BackgroundPaths.tsx and ParticleSpiral.tsx still exist as files but are NOT imported into SceneCanvas (removed during hero redesign 2026-04-04).
- **CSS sticky scroll pattern** (BestSellers, Campaign, Lookbook): outer `<section>` has explicit height (500vh/500vh/700vh) in CSS. Inner wrapper has `position:sticky; top:0; height:100vh`. Browser pins inner wrapper while outer section scrolls -- NO GSAP pin needed. ScrollTrigger uses `trigger:section, start:'top top', end:'bottom bottom', scrub:1, animation:tl` where `tl` is `gsap.timeline({paused:true})`. Timeline duration determines animation density. Scrub distance = section height - 100vh.
- **GSAP import pattern for sections**: always top-level `import gsap from 'gsap'` + `import {ScrollTrigger} from 'gsap/ScrollTrigger'` + `gsap.registerPlugin(ScrollTrigger)` at module level. Do NOT use dynamic Promise.all imports inside useEffect for sections (that pattern is only in _index.tsx global label animations).
- Cursor (ChromeCursor): **REWRITTEN** -- dot + lagging ring design (NOT the old SVG arrow, do not revert). Chrome dot (7px, rgba(208,208,228,0.92)) snaps to mouse. Ring (28px) follows with lerp 0.11. On hover over a/button/input: ring scales 1.65x via CSS transition (0.28s cubic-bezier), border brightens. posRef wrapper holds position (no CSS transition), inner ringVisRef holds visual (CSS transition for scale/color only -- never mix RAF transform with CSS transition on the same element). 6-dot silver trail (3px, spawn every 12px, decay 0.038/frame). No RGB keyframes, no velocity tilt.

## File Structure
app/
  components/
    global/
      SmoothScroll.tsx        -- Lenis init + GSAP sync + singleton getLenis() export
      BackgroundJourney.tsx    -- Scroll-driven body background. **Updated 2026-04-12**: Now 2 pure black stops only (pos:0 and pos:1, both #000000). Body background is always `#000000` -- NightSkyShader is the sole source of blue. Sets --text-primary CSS var.
      ChromeCursor.tsx         -- SVG arrow cursor (iridescent animated stroke, dark fill, velocity tilt ±14 deg) + 14-element glass drop trail. Injects CSS keyframes (`cursor-glow`, `chr-stroke`) into head on mount.
      GrainOverlay.tsx         -- SVG feTurbulence film grain, 4% opacity
      ScrollProgress.tsx       -- Gold gradient progress bar, fixed top
      GlobalEffects.tsx        -- Combines all 5, ClientOnly boundary
      SceneCanvas.tsx          -- Global persistent full-viewport R3F Canvas (position: fixed, z-index: 0). Current contents: **NightSkyShader** (full-screen GLSL aurora shader, renderOrder:-100, AdditiveBlending -- domain-warped FBM aurora; **updated 2026-04-12**: mouse hover/ripple REMOVED; scroll-driven Lissajous spotlight path (3:2 freq: `lx=sin(scroll*18.85)` / `ly=sin(scroll*12.57+1.57)`) traces figure-eight so every section has unique lighting angle; breathing corona halos at r=0.17 and r=0.32; wide secondary ambient; uniforms: uTime + uScroll only; alpha 0.86; colors: #041129 base -> #0f2050 peak), AN_Logo (**updated 2026-04-12**: fade threshold `clamp01(sectionProgress/0.04)` lerp 0.30 -- disappears instantly at About scroll; scale `max(0.05, 1.0-smoothSp*3.0)` shrinks on scroll; useFrame skips when logoFade>=0.99), StarField (25 star.glb, blue-silver, scatter 0-22%, fade 0-22%), RockField (8 rock.glb shooting stars, fade 0-28%), AtmosphericFog (continuous sin oscillation black<->#0f2050), AnimatedEnvironment (breathing Lightformers + sapphire #1a50c8 backlight), scroll-driven camera, MouseTracker, AdaptivePostFX (SelectiveBloom stars+rocks + **Vignette offset:0.25 darkness:0.75**). **heroGone gate (updated 2026-04-12)**: Scene component tracks scroll via useFrame; when sp>0.30 sets heroGone=true (remounts at sp<0.15). When heroGone: StarField+RockField unmounted entirely (33 useFrame callbacks eliminated), AdaptivePostFX drops to Vignette-only EffectComposer multisampling:0. Lazy-loaded in root.tsx Layout.
      BackgroundPaths.tsx      -- EXISTS but NOT used (removed from SceneCanvas 2026-04-04). 8 groups of flowing curves, NormalBlending. Available for future use.
      ParticleSpiral.tsx       -- EXISTS but NOT used (removed from SceneCanvas 2026-04-04). Infinite particle cylinder. Available for future use.
      Navigation.tsx           -- **REDESIGNED 2026-04-14**: Split glass pill nav. Left pill (Shop/Collections), center wordmark "House of An" (Cormorant Garamond 300, letterSpacing 0.38em), right pill (About/Bag). Pills: rgba(0,0,0,0.55) bg, blur(12px), 1px rgba(255,255,255,0.14) border, border-radius 500px. nav-desktop-pills class hides on mobile. Outer nav bar transparent. hide-on-scroll-down behavior preserved.
      SideRail.tsx             -- **NEW 2026-04-14**: Fixed left 24px mid-viewport, z-index 90. 4 uppercase periwinkle links (Bestsellers, Collections, Lookbook, About). DM Sans 0.52rem, letter-spacing 0.26em, color var(--at-accent-bright). Opacity 0.5 + translateX(7px) on hover. Lenis scrollTo on click. Home route only (useLocation). Hidden mobile via .at-side-rail CSS class.
      AmbientTicker.tsx        -- **NEW 2026-04-14**: Fixed bottom-left, mix-blend-mode:color-dodge, pointer-events:none. 5 brand lines cycle every 4.5s with fade. DM Sans 0.55rem, letter-spacing 0.30em, rgba(140,170,255,0.88). Hidden mobile.
      CornerTicker.tsx         -- **NEW 2026-04-14**: Fixed bottom-right, mix-blend-mode:color-dodge, pointer-events:none. Marquee 22s: "RECYCLED SILVER -- MADE IN MUMBAI -- READY TO SHIP -- EST. 2024". Hidden mobile.
      RouteTransition.tsx      -- **NEW 2026-04-14**: Fixed inset:0 z-index:200 black #000000 overlay. useNavigation() drives opacity: 0.25s ease-in on loading, 0.45s ease-out on idle. Eliminates white flash on Hydrogen route changes.
      ParticleField.tsx        -- **NEW 2026-04-14**: THREE.Points 12k desktop / 2.5k mobile. color #8ab0e8, size 0.045, AdditiveBlending, depthWrite:false. Self-contained scrollRef. Fades to 0 by 22% scroll. Mounted in SceneCanvas Scene() outside <Select> (not bloom-processed), gated by !heroGone.
    sections/
      HeroSection.tsx          -- Pure HTML overlay. "House of An" centered dead-center (top:50%, width:100%, translateY(-50%)). Cormorant Garamond weight 200, 0.65em tracking, gradient shimmer text (webkit-background-clip), drop-shadow filter for legibility. Hairline rule accent below. GSAP animates opacity only (no transform). heroFloat keyframe handles vertical float. Scroll chevron at bottom.
      AboutSection.tsx         -- Editorial about layout. **Sticky scroll pattern (updated 2026-04-11)**: outer section `height:250vh`, inner wrapper `position:sticky; top:0; height:100vh; overflow:visible`. Paused GSAP timeline driven by `ScrollTrigger start:'top top', end:'bottom bottom', scrub:1` -- gives 150vh of scroll distance. Timeline: logo + THE at 0%, REFINED at 16%, REBELLION at 28%, right column staggers in 40-64%, long dwell 64-90%, exit at 90% (was 82%). **Parallax**: leftRef words container drifts `y: -28` from 4% to 88% scroll -- creates depth as words float upward. Left: "THE / REFINED / REBELLION" Barlow 800, fontSize clamp(3rem, 5.8vw, 7rem), top:22%, left:3.5vw, white bloom textShadow glow. Center: AboutStillLogo. Right: Founded 2012 + hairline divider + 2 DM Sans body paragraphs, staggered in at 40-64%. **Updated 2026-04-12**: blackBgRef gradient overlay + floor glow div both REMOVED -- NightSkyShader shows through entire About section.
      AboutStillLogo.tsx       -- Local R3F Canvas with still Logo_element.glb for the About section center. Separate from global SceneCanvas. Key: gltfScene.clone(true) to avoid shared material mutation; scene.updateMatrixWorld(true) BEFORE Box3.setFromObject (Three.js lazy matrices -- bbox is stale without this); bbox centering via scene.position.sub(center). Camera fov=65 at z=9.0 (model is large -- needs far pullback). Scale 0.78 breathing only. Chrome: color #c8c8cc, metalness 0.9, roughness 0.15, envMapIntensity 1.2, clearcoat 0.4. Canvas: 540x540 square, alpha:true.
      BestSellersSection.tsx   -- Parent HTML for Bestsellers: "BESTSELLERS" eyebrow + Cormorant italic product name + "01/05" counter (counterRef), dot indicators, touch swipe. No arrow buttons. `goToCard(index)` rotates to any card via shortest-path GSAP (power3.inOut, 1.0s). marginTop:-5vh. **height:500vh**. CSS sticky pattern: inner wrapper `position:sticky top:0 height:100vh` with `stickyRef`. **Scrub-driven entrance**: single ScrollTrigger onUpdate drives introTl (HTML elements) + carousel rotation. ENTRANCE=0.25 -- first 125vh reveals; remaining 375vh rotates. introTl: subtitleRef opacity:1 at 0.80, dotsRef at 0.87, counterRef at 0.87. Outro: `fromTo(stickyRef, opacity:1→0)` over last 18% (OUTRO_START=0.82). **Active dot**: width 28px rgba(156,165,255,0.90); inactive 5px rgba(255,255,255,0.20).
      BestSellersDecorations.tsx -- **Updated 2026-04-14**: BSMouseTracker + BSPostFX still active. **BSPostFX now includes ChromaticAberration** (offset [0.0025,0.0008], radialModulation:true, modulationOffset:0.4) + SelectiveBloom + Vignette. **Three new immersive background components** (all AdditiveBlending, no Select, no bloom issues): `BSDriftParticles` (650/220 THREE.Points cloud, z=-1.5 to -11.5, mouse parallax + slow Y rotation, entrance smoothstep 0.20-0.55), `BSFloatingOrbs` (6 MeshBasicMaterial spheres at scene corners/edges, z=-5 to -8, staggered entrance, breathing scale, mouse parallax), `BSAtmosphericRings` (4 large ringGeometry halos z=-5 to -11, #5868a8, counter-rotation, arrive last). BSStarField + BSRockField still exist in file but NOT used.
      BestSellersCarousel.tsx  -- Self-contained R3F Canvas for 3D elliptical-orbit carousel. All 5 cards orbit in an ellipse. ORBIT_RADIUS_X=5.5, ORBIT_RADIUS_Z=2.8, ROT_PER_CARD=0.6, **MIN_SCALE=0.42**, **SCALE_STEP=0.28** (updated 2026-04-14 -- more aggressive taper: center=1.0, ±1=0.72, ±2=0.44). ANGLE_STEP=72 deg. Per-card lerp refs, lerp 0.10, snap at |offset|>=2.3, wrapFade hides teleport. Camera: fov=65, position=[0, 0.5, 11]. Cards group at `<group position={[0,0,5]}>` -- CRITICAL: keeps cards in front of spirals/particles/rings. **SpiralDecor**: useMemo returns `{scene, meshes}`, opacity:0, entrance smoothstep(0,0.4,ep)*0.45 lerp 0.06. TWO instances [0,7,-4] + [0,-7,-4]. **CarouselCard (updated 2026-04-14)**: imageMaterial opacity = entranceOpacity * offsetOpacity (max 0.18, 1-absOff*0.44 -- side cards dim to 0.18). glowMaterial: #6080e0 AdditiveBlending plane [4.6,6.5] at z=-0.02, glowTarget=(1-absOff*2.2)*0.45 -- active card gets periwinkle halo. No hover glow. **Render order back-to-front**: BSAtmosphericRings, BSDriftParticles, SpiralDecor x2, BSFloatingOrbs, cards group. **KNOWN ISSUE**: card images unusually bright -- EffectComposer + NoToneMapping interaction under investigation.
      CategoriesSection.tsx    -- 3 floating card layout (Edge, Sculpt, Elite) in a flex row. gap:4.5vw, justify-content:center. Each card: width min(27vw,340px), height 68vh, border-radius 18px. Pure HTML/CSS/GSAP -- no R3F. Image files: /images/categories/edge1.jpg, sculpt2.jpg, elite3.jpg. **3D glowing borders**: @property --cat-angle drives rotating conic-gradient sweep (rgba(96,128,224) -> rgba(156,165,255) periwinkle-blue) on .cat-card-outer::before. .cat-card-outer::after has static border rgba(140,168,255,0.14) + breathing glow rgba(80,120,220) (cat-breathe 4.5s). **Scroll-reactive background (added 2026-04-17)**: `CategoriesWeaveCanvas` mounted inside the section -- Canvas2D constellation nodes + lines, driven by `categoriesSectionState.sectionProgress`, alpha `smoothstep(0,0.12,sp)*(1-smoothstep(0.88,1,sp))`. Previous network-canvas removal (2026-04-12) is superseded. Each card staggered by animation-delay. **Hover**: glow rgba(100,150,255,0.36), border rgba(156,165,255,0.65). Floating animations: catFloat0/1/2 on inner .cat-float-X divs. GSAP scrub entrance: cards enter from x:±100 y:70 opacity:0 (scrub:0.3). No longer imports categoriesSectionState.
      WhySection.tsx           -- **UPDATED 2026-04-12**: Sticky scroll pattern matching AboutSection. Outer section `height:250vh; overflow:visible`, inner `position:sticky; top:0; height:100vh; overflow:visible`. Paused GSAP timeline driven by `ScrollTrigger start:'top top', end:'bottom bottom', scrub:1`. Words "WHY / HOUSE OF / AN" reveal at 4%/16%/28% of scroll (Barlow 800, clamp(3rem,5.8vw,7rem)). leftRef parallax: y:-28 over 84% of scroll. Right column staggers in at 40-64%. **No exit animation** (content stays visible through end). whySectionState section-awareness trigger. **Scroll-reactive background (added 2026-04-17)**: `WhyMistCanvas` mounted inside sticky inner -- Canvas2D Lissajous silver-mist gradients, driven by `whySectionState.sectionProgress`, alpha `smoothstep(0,0.12,sp)*(1-smoothstep(0.88,1,sp))`. Supersedes the 2026-04-12 removal.
      WhyStillLogo.tsx         -- Local R3F Canvas with still Logo_element.glb for the Why section. Separate from global SceneCanvas: no scroll-driven rotation, just breathing scale (sin(t*0.35)*0.015). Own Environment + Lightformers (overhead 2.8, left lavender 1.2, right neutral 1.4). Camera fov=48 at z=3.6. Chrome material: color #c4c4d4, metalness 1.0, roughness 0.14, envMapIntensity 1.35. Letters spread apart (x+-0.28) for visual openness. NOT YET WIRED IN -- exists as a component but not imported/rendered anywhere. WARNING: debug telemetry fetch calls in file (localhost:7722) -- remove before wiring in.
      CampaignSection.tsx      -- **UPDATED 2026-04-17**: 3-card large inset stack. Pure HTML/CSS/GSAP. Outer section `height:500vh`, inner .campaign-visual position:sticky top:0 height:100vh overflow:visible. Cards: min(1100px,90vw) x min(640px,72vh), border-radius:14px, backed by /images/campaign/campaign1-3.png. Refs: headingRef + stackRef start opacity:0, y:40/50. Card2 starts scale:0.97 y:25; Card3 starts scale:0.94 y:45 (depth stack). **3.2-unit paused timeline** (reworked 2026-04-17 -- card1 was exiting too early): t=0→0.4 INTRO (heading at 0 duration:0.28, stack at 0.15 duration:0.35), t=0.4→1.2 HOLD (dwell on card1 while user settles into section), t=1.2→1.8 card1 exits y:'-110%', t=1.8→2.4 card2 exits + card3 rises to focal, t=2.4→3.2 HOLD card3. ScrollTrigger `scrub:0.1`. campaignSectionState in sceneState.ts. **Background rendered by shared ContinuousAuroraCanvas** (no local bg component) -- CampaignMonolithBg + inline atmospheric glow radial-gradient removed 2026-04-17. **Envelope (updated 2026-04-17)**: `smoothstep(0,0.08,sp)*(1-smoothstep(0.85,1,sp))` -- widened exit ramp so Campaign dissolves into Lookbook over ~75vh instead of 25vh.
      LookbookSection.tsx      -- 6-image ORYZO-style focal carousel. Pure HTML/CSS/GSAP. **Updated 2026-04-18 (second pass)**: Outer section `height:800vh` (was 500vh, then briefly 600vh -- extended further because user still saw scrub advance before perceiving section arrival). **Background rendered by shared ContinuousAuroraCanvas** (LookbookAuroraCanvas removed 2026-04-17). Inner .lookbook-visual position:sticky top:0 height:100vh overflow:hidden background-color:transparent. Text ("The Collection" + "SO PORTABLE, it's wearable") position:absolute top-left (z-index 3). Gallery position:absolute inset:0 (full viewport width). Each .lookbook-img position:absolute top:50% left:50%, GSAP sets xPercent:-50 yPercent:-50. On mount: STRIDE=galleryW*0.32, FOCAL_SHIFT=galleryW*0.10. Timeline (paused:true, 5 units): per-transition, all 6 images animate to new x=FOCAL_SHIFT+endOffset*STRIDE + scale + opacity. Scale: 1.0/0.65/0.50/0.38 by |offset|. Opacity past: 1.0/0.78/0.32/0.10. Opacity future: 1.0/0.55/0.35/0.20. Fixed focal frame: .lookbook-frame blue border 4px + conic sweep + breathe glow. Image + frame size: desktop `clamp(260px,30vw,460px)` x `clamp(360px,72vh,660px)`; mobile `clamp(220px,68vw,360px)` x `clamp(300px,58vh,500px)`. **Two ScrollTriggers (updated 2026-04-18, third pass)**: (1) stateST `top top → bottom bottom` drives `lookbookSectionState.active/.sectionProgress` + visual opacity envelope **`smoothstep(0.15,0.22,sp)*(1-smoothstep(0.92,1,sp))`** -- invisible through the full 120vh Campaign overlap (120/800 = sp 0→0.15), ramps to full by sp 0.22. (2) animST **`top+=480vh top → bottom bottom`**, scrub:0.08 -- carousel waits for overlap clearance (120vh) PLUS a 360vh static pre-roll so even a fast scroll lands the user on image 1 static in the blue focal frame before any image swap fires. Scrub starts at sp 480/800 = 0.60. **Transition speed consequence**: animation range 800vh-480vh=320vh / 5 transitions = **64vh per image swap**. Suspense fallback in _index.tsx matches at 800vh. lookbookSectionState in sceneState.ts.
      CategoriesWeaveCanvas.tsx -- **NEW 2026-04-17**: Canvas2D constellation -- ~70 nodes, short lines to nearest neighbors, drift field motion. Self-contained RAF gated by `categoriesSectionState.active`. dpr cap [1,1.5] desktop / [1,1] mobile. Alpha = `smoothstep(0,0.12,sp)*(1-smoothstep(0.88,1,sp))`. `prefers-reduced-motion:reduce` renders one static frame. AT palette (`#6080e0`, `#9ca5ff`).
      WhyMistCanvas.tsx -- **NEW 2026-04-17**: Canvas2D Lissajous silver-mist gradients. Self-contained RAF gated by `whySectionState.active`. Same dpr cap + alpha math + reduced-motion behavior as CategoriesWeaveCanvas. Silver palette (`#8ab0d0`, `#1a2840`).
      ContinuousAuroraCanvas.tsx -- **NEW 2026-04-17 (replaces CampaignMonolithBg + LookbookAuroraCanvas)**: Shared `position:fixed` full-viewport Canvas2D that spans Campaign + Lookbook. Reads BOTH `campaignSectionState` and `lookbookSectionState`. 4 desktop ribbons / 2 mobile, alpha 0.28-0.36, amp 0.11-0.15 (~70% boost vs prior Lookbook-only version). `campaignAlpha = cAct ? smoothstep(0,0.10,cSp) : 0`; `lookbookEnter = cAct ? 1 : smoothstep(0,0.08,lSp)` (instant enter if campaign already feeding canvas); `lookbookExit = 1 - smoothstep(0.70,0.92,lSp)`; `alpha = max(campaignAlpha, lookbookAlpha)`. Phase driver stitches lookbook onto campaign (`lAct ? 1+lSp : cAct ? cSp : 0`) so ribbons keep evolving across the seam. Secondary `position:fixed` floor div rises to pure `#000` on lookbook exit for TestimonialsFooter handoff. RAF gated by either section active; dpr cap [1,1.5] desktop / [1,1] mobile; `prefers-reduced-motion:reduce` renders a single static frame. Mounted in _index.tsx just before CampaignSection wrapper.
      TestimonialsFooterSection.tsx -- **REDESIGNED 2026-04-08, updated 2026-04-12**: 5 dark-chrome polaroid cards scattered in a strip, footer below. **Background: `#000000`** (was blue-silver gradient -- updated to black theme). Heading "Words of / love." in Cormorant Garamond 600, **white rgba(255,255,255,0.92)**; italic "love." **AT-blue rgba(96,128,224,0.90)** (was dark navy). Subtext: **rgba(255,255,255,0.38)**. GSAP animations: per-word heading reveal (.tf-hdg-word spans, y:52->0, stagger 0.14, power3.out), subtext slides from right (x:36->0), cards stagger up (y:CARD_HEIGHT->0, stagger 0.10), footer columns stagger (y:48->0, stagger 0.09), footer bottom fades in. testimonialsSectionState in sceneState.ts.
      TestimonialCard.tsx          -- **REDESIGNED 2026-04-08**: dark chrome polaroid. Props: quote, author, stars, tapeColor, x, rotate. Outer card: #181c2e. Inner: #0c0f1e. Shadow: `0 6px 28px rgba(5,10,42,0.60), 0 0 0 1px rgba(115,142,208,0.13)`. Hover: GSAP animates boxShadow on innerRef to chrome blue glow; card lifts via elastic.out(1,0.45). Quote: Cormorant Garamond italic weight 300 (NOT Caveat -- that font is not loaded). Stars: gold rgba(198,174,88,0.92). Author: DM Sans uppercase. No washi tape. tapeColor prop kept in CARD_CONFIGS but unused (tape div removed).
      FooterBlock.tsx              -- **REDESIGNED 2026-04-08, updated 2026-04-12**: background **#000000** (was #0b0d1a dark steel). Steel-blue accent color throughout: rgba(148,175,228,...). Column headings rgba(148,175,228,0.72). Nav links: translateX(4px) hover. Social links: letter-spacing expansion on hover. Newsletter input focus: rgba(128,168,228,0.48). Newsletter button: steel-blue border/text. SVG arcs: steel-blue, animated draw-in via stroke-dashoffset (getTotalLength() in useEffect, gsap.to strokeDashoffset->0). Ghost AN: fades in on scroll + parallax y:0->-40 scrub:1.5. Uses footerRef, arcRef1, arcRef2, ghostRef + gsap.context.
  lib/
    sceneState.ts              -- Plain JS shared state objects for cross-module communication: aboutSectionState {active, sectionProgress}, bestsellersSectionState {active, sectionProgress, **entranceProgress**} (entranceProgress 0-1 written by BestSellersSection onUpdate, read by SpiralDecor + CarouselCard useFrame to drive entrance opacity sequence), scenePhaseState {heroIntensity, aboutIntensity, transitionBlend, latePageFade, logoFade}, categoriesSectionState {active, sectionProgress}, whySectionState {active, sectionProgress}, campaignSectionState {active, sectionProgress}, lookbookSectionState {active, sectionProgress}, testimonialsSectionState {active, sectionProgress}. No React dependency.
  routes/
    _index.tsx                 -- Homepage: renders scrollable HTML overlay (HeroSection + 200vh spacer + AboutSection + **180vh BESTSELLERS title spacer** + BestSellersSection + CategoriesSection). No EntrancePreloader. No preloader-complete dispatch. Separate wrapper divs for: WhySection, CampaignSection (preceded by `<ContinuousAuroraCanvas />` mount), LookbookSection, TestimonialsFooterSection. **Updated 2026-04-17 (scroll-gap compression)**: Why wrapper `margin:'-120vh -1rem 0'` and Lookbook wrapper `margin:'-120vh -1rem 0'` (were `-60vh`) -- doubles the physical overlap so ~60vh of dead scroll is removed at each transition. Campaign wrapper sits at `margin:'0 -1rem'` (no negative top) so it never bleeds into Why's final pinned frame. The 120vh overlap consumes nearly the full pin-release zone (last 100vh) of the preceding section; the later wrapper's own `position:relative; zIndex:1` + sticky inner takes visual priority during the ~20vh two-pinned-inners moment. SceneCanvas in root.tsx. Each section uses ClientOnly + React.lazy + Suspense with matching fallback height (BestSellers:500vh, Categories:500vh, Why:250vh, Campaign:500vh, Lookbook:500vh, TestimonialsFooter:120vh). **180vh title spacer (updated 2026-04-18)**: `bsTitleSectionRef` outer section, sticky inner centers `bsTitleRef`. Typography: "House of An" DM Sans eyebrow (periwinkle) + "Bestsellers" in **Cormorant Garamond weight 300** (was Barlow 800), uppercase via CSS, `clamp(3rem,7vw,8rem)`, letterSpacing `0.24em`, `paddingLeft:0.24em` to compensate tracking for optical center, color `rgba(255,255,255,0.94)`, softer periwinkle glow (`textShadow: 0 0 28px rgba(156,165,255,0.18), 0 0 64px rgba(140,170,240,0.10)`). GSAP scrub timeline: **fade-in 0.15 (y:36->0) -> hold 0.70 -> fade-out 0.15 (y:0->-24)** -- title now fully visible ~125vh of 180vh (was ~54vh under 0.35/0.30/0.35). `ScrollTrigger start:'top top', end:'bottom bottom', scrub:0.2` (was 0.3). **All wrapper backgrounds removed**: titaniumBgRef (Campaign) removed 2026-04-12; pearlBgRef (Why cream gradient) removed 2026-04-12. Both refs, GSAP ScrollTrigger blocks, and JSX divs fully deleted. Why wrapper is now a plain `position:relative; zIndex:1` div with no background layer.
  images/
    categories/
      edge1.jpg                -- Edge earring collection photo (added by client)
      sculpt2.jpg              -- Sculpt earring collection photo (added by client)
      elite3.jpg               -- Elite earring collection photo (added by client)
  styles/
    fonts.css                  -- Font CSS variables
    global-effects.css         -- Design system CSS vars (--bg-primary: #0f0f14), Lenis classes, cursor hide
  entry.server.tsx             -- CSP config (see CSP section below)
public/
  draco/                       -- Local Draco WASM decoder (copied from node_modules/three)
    draco_decoder.js
    draco_decoder.wasm
    draco_wasm_wrapper.js
  models/
    AN_Logo.glb               -- 22 KB, original logo geometry (SUPERSEDED -- kept as fallback)
    Logo_element.glb          -- client-supplied replacement logo (active -- used by SceneCanvas, AboutStillLogo, WhyStillLogo)
    entrance2.glb              -- 323 KB, tunnel/portal (unused, preloader uses procedural gates)
    Podium.glb                 -- 401 KB, pedestal (unused currently, for future hero concept)
    rock.glb                   -- 38 KB, sculptural rock (USED: RockField in SceneCanvas, 8 shooting-star instances)
    Spiral.glb                 -- 209 KB, spiral decoration -- USED in BestSellersCarousel.tsx as SpiralDecor (TWO instances: center [0,0,-4] and bottom [0,-14,-4]; scale=14 units; depthWrite:false REQUIRED and implemented)
    star.glb                   -- 16 KB, decorative star element (USED: StarField in SceneCanvas, 10 hero instances)
    surface1.glb               -- 96 KB, landscape/terrain (unused currently, for future hero concept)

## Design Direction (from Ananyaa's Canva Deck)

### Overall Aesthetic
Liquid chrome, fluid silver metal, futuristic luxury. Everything should feel like molten silver in motion. The mood board shows: chrome tunnel portals, liquid metal blobs with chrome sphere droplets, twisted chrome rings, dark environments with high-contrast metallic reflections. Think Apple Vision Pro meets high-end jewellery.

### Background Color Journey (scroll-driven, throughout page -- UPDATED 2026-04-11 to continuous oscillation)
- Continuous oscillation between pure black (#000000) and deep midnight blue (#0f2050) throughout the entire scroll (0-100%).
- Hero zone (0-12%): rapid pulses at 2% per half-cycle (~50vh per flash) -- 3 full cycles.
- Rest of page (~12-100%): slower pulses at ~5% per half-cycle (~125vh per transition) -- ~9 more cycles.
- Text always #ffffff throughout -- no late-page color flip.
- The previous staged journey (navy/blue-steel/blue-silver) has been replaced.
- Body background oscillates; most sections have their own backgrounds layered above.
- NightSkyShader in SceneCanvas provides the immersive aurora visual on top of this rhythm.
Initial page background (CSS + body): #000000. CSS var --bg-primary: #000000. Preloader tunnel still uses #0a0a0a -- do not change it.
Reference: Active Theory (activetheory.net) -- pure black base, blue/periwinkle accent aesthetic.
AT CSS tokens in :root (global-effects.css): --at-accent #6080e0, --at-accent-bright #9ca5ff, --at-blue-steel #1a2840, --at-blue-silver #8ab0d0.

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
- 10 liquid metal blobs: 4 center (2 on mobile) + 6 side-edge at x=+-9.5/10/11 (2 on mobile). Side blobs at z=-1 to -3 (close to camera for correct horizontal fov placement, scale 0.7-0.9)
- 6 floating metallic orbs with mouse parallax + heartbeat pulse (3 on mobile)
- Scroll decorative elements: 4 chrome rings, 3 glass shards, 2 chrome spirals, 3 light streaks (1/3 on mobile). Each has scrollMin/scrollMax visibility range, fade ramps, drift, slow rotation.
- BackgroundPaths: 8 groups of flowing curves spread corner-to-corner (xBias +-8 to +-16, amplitude 10-19, spanY 40-52), 40 lines desktop / 16 mobile, scroll warp + mouse magnet (mouseLerp.x * 20) + radial center mask + color inversion
- ParticleSpiral: infinite 600-particle cylinder (200 mobile), radius 5-26, center-cleared at 5.0, seamless Y-wrapping, scroll rotation + tightness, mouse repel (mouseLerp.x * 22) + color inversion. Very minimal (size 0.02, opacity 0.08).
- AtmosphericFog: FogExp2 (density 0.012) with scroll-synced color (#0a0a0a dark, #d8d8dc light)
- AnimatedEnvironment: breathing Lightformer intensities (overhead 3.5 +/- 0.3)
- Sparkles (8 desktop, 3 mobile, size 0.35, opacity 0.07 -- very minimal)
- Camera intro zoom: starts [0, 0.2, 3.5], lerps to [0, 0.5, 7] on preloader-complete, then scroll-driven pull-back to [0, 3, 14]
- Canvas: fov=75, near=0.1, far=200, alpha=true, ACES filmic tone mapping
- EffectComposer (multisampling 4) + Bloom (mipmapBlur, intensity 0 -- DISABLED). Components kept in tree for future re-enabling.

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

### 5. Bestsellers (BUILT -- 3D coverflow carousel, NON-NEGOTIABLE 3D)
- All 5 cards visible simultaneously in a coverflow/fan layout -- all facing the viewer
- Center card: face-on, full scale (1.0). Side cards (±1): 34 deg inward, scale ~0.81. Outermost (±2): ~68 deg, scale 0.62, receded 2.4 units in Z.
- NOT horizontal scroll. The 3D coverflow is still fully R3F with depth, tilt, and metallic chrome.
- Never replace with flat horizontal scroll under any circumstances.
- Metal parts floating in anti-gravity feel (Y bob per card with staggered phase offset)
- Product data from Shopify Storefront API via GraphQL (currently placeholder CanvasTextures)
- **Carousel architecture (elliptical orbit, updated 2026-04-06)**: Each card computes `activeProgress = -rotStateRef.angle / ANGLE_STEP` (0->4 as scroll advances), then `offset = index - activeProgress` wrapped to [-2.5, 2.5) via `offset - Math.round(offset/CARDS)*CARDS`. Position uses elliptical parametric form: `angle = offset * ANGLE_STEP`, `x = ORBIT_RADIUS_X * sin(angle)`, `z = -ORBIT_RADIUS_Z * (1 - cos(angle))`, `rotY = -offset * ROT_PER_CARD`. Constants: ORBIT_RADIUS_X=5.5, ORBIT_RADIUS_Z=2.8, ROT_PER_CARD=0.6rad. All 5 cards stay in front of the spiral -- ±2 cards land at world z≈-2.1 (spiral is at z=-4). Previously circular orbit (ORBIT_RADIUS=4.5) sent ±2 cards to world z≈-5.1, hiding them behind the spiral.
- **Smooth lerp + teleport prevention**: Each card has `posXRef/posZRef/rotYRef` refs initialized at the card's starting offset. In useFrame, lerp (0.10) toward target when `|offset| < 2.3`; snap directly when `|offset| >= 2.3` (card is near-invisible). `wrapFade = (2.5 - |offset|) * 2` multiplies scale down to 0 at the wrap boundary so the snap teleport is invisible.
- **Scroll-driven entrance + rotation (updated 2026-04-11)**: Section is 500vh. First 25% (125vh) = cinematic entrance phase; remaining 75% (375vh) = carousel rotation. Single ScrollTrigger scrub:1 drives both via `onUpdate`. Entrance splits into three sub-phases driven by `bestsellersSectionState.entranceProgress` (0-1): spiral fades in (smoothstep 0→0.4), cards fade in (smoothstep 0.4→0.8), HTML title/subtitle/dots reveal (paused introTl at progress 0.70-0.95). Carousel rotation only begins after ENTRANCE=0.25 threshold: `carouselP = max(0, (progress - 0.25) / 0.75) * totalAngle`. totalAngle = -(CARDS-1)*ANGLE_STEP = -288 deg. Each card transition ≈ 94vh.
- **entranceProgress shared state**: `bestsellersSectionState.entranceProgress` written in `onUpdate`, read inside R3F `useFrame` (SpiralDecor + CarouselCard). No prop threading needed.
- **Click-to-front**: `goToCard(index)` uses shortest-path ANGLE_STEP arithmetic (unchanged) then `gsap.to(rotStateRef.current, {angle: current+delta, duration:1.0, ease:'power3.inOut'})`. Dots and activeIndex update accordingly.
- **Card hover glow REMOVED (2026-04-11)**: glow RoundedBox, glowMaterial, hoveredRef, glowIntensRef, onPointerEnter/Leave all deleted. Cards respond to click only.
- **No arrow buttons**: Touch swipe (48px) + dot indicators + card click.
- **Background wipe transition**: position:fixed div `linear-gradient(to bottom, #0e1828 0%, #182240 18%, #2a4070 45%, #5878b0 72%, #8aaccc 100%)` (deep navy to cool blue-steel, AT-aligned, updated 2026-04-11) animates `clip-path: inset(100% 0 0 0)` to `inset(0% 0 0 0)` bottom-to-top. Triggers: start:`top bottom`, end:`top 20%`. Second trigger manages display:none toggling.
- **Chrome frame REMOVED (2026-04-08)**: frameMaterial RoundedBox (4.55x6.5, metalness 1, roughness 0.04) deleted -- caused black border appearance. Cards now: image PlaneGeometry 4.15x6.1 only. Pointer events on image mesh.
- Scale: `max(MIN_SCALE=0.42, 1.0 - |offset|*SCALE_STEP=0.28) * wrapFade` (updated 2026-04-14). Lerp factor 0.10.
- Opacity: `entranceOpacity * max(0.18, 1.0 - |offset| * 0.44)` -- side cards dim significantly, center stays full opacity.
- Center-card glow: `glowMaterial` plane [4.6, 6.5] behind image, #6080e0 AdditiveBlending, `(1 - |offset|*2.2)*0.45` opacity -- visible only when card is at/near front.
- Immersive background layers (2026-04-14): BSDriftParticles (particles cloud) + BSFloatingOrbs (edge glows) + BSAtmosphericRings (deep halos). All AdditiveBlending, no Select. Render order: rings → particles → spirals → orbs → cards.
- Anti-gravity Y bob + subtle Z wobble per card in useFrame. GSAP rotState.angle accumulates continuously.
- Canvas: fov=65, position=[0, 0.5, 11]. `pointerEvents: auto` required for R3F raycasting.

### 6. Categories (BUILT -- vertical stacked cards with interactive scroll transitions, 3 product lines)
- **Implemented as**: vertical stacked card layout for 3 earring lines: Edge, Sculpt, Elite
- 3 cards in normal document flow, no gap, flush edges (border-radius 0, padding 0). Pure HTML/CSS/GSAP -- no R3F.
- Each card: horizontal split (45% left text / 55% right image, 3:4 portrait)
- Scrub-based scroll entrance: text from x:-60 opacity:0, image from x:+60 opacity:0 (ScrollTrigger start:'top 85%', end:'top 25%', scrub:1)
- Image parallax: y:30 to y:-30 across full card scroll range
- Number parallax: y:20 to y:-20 for depth effect
- Chrome divider elements between cards 1-2 and 2-3 (1px gradient line, scaleX:0->1 on scroll)
- "COLLECTIONS" header at top fades in on scroll
- Real images: /public/images/categories/edge1.jpg, sculpt2.jpg, elite3.jpg
- `categoriesSectionState` exists in sceneState.ts but CategoriesSection no longer imports/uses it (decoupled)
- Background starts transitioning lighter from this section (scroll ~0.50-0.65)

### 7. The Why (BUILT -- two-column editorial, scrub animations)
- **Implemented as**: two-column editorial layout. Pure HTML/CSS/GSAP -- no R3F in the section itself.
- Left: "WHY / HOUSE OF / AN ?" as 3 stacked lines. Cormorant Garamond weight 700, clamp(3.2rem, 7vw, 7rem). "?" in italic weight 300, rgba(255,255,255,0.8). White glow textShadow (3-layer: 30px/80px/160px).
- Right: "Founded in 2024" label (DM Sans 11px, 0.4em letter-spacing, uppercase) + hairline divider + 2 body paragraphs (DM Sans 300, clamp(11px, 1.1vw, 14px), uppercase, rgba(255,255,255,0.55)).
- Scrub-based scroll entrance: left from x:-80, right from x:+80 (ScrollTrigger start:'top 85%', end:'top 25%', scrub:1, stagger 0.06).
- `whySectionState` in sceneState.ts (active + sectionProgress), updated via separate ScrollTrigger (start:'top 80%', end:'bottom 20%').
- Mobile: column layout, centered text, 6vh gap.
- `latePageFade` in scenePhaseState fades global 3D logo before this section so it reads clearly.
- **WhyStillLogo component exists** (local Canvas with still AN_Logo) but is NOT yet wired into WhySection. Intended as a local replacement for the faded global logo.
- **Not yet built (from original brief)**: SVG line draw animations, 3 stat counters (12K+ Pieces, 97% Recycled Silver, 48H Dispatch). These can be added later.

### 8. Campaign (BUILT -- 3-card large inset stack, 600vh sticky, REWORKED 2026-04-06)
- 3 large cards centered in viewport with breathing room: min(1100px, 90vw) x min(640px, 72vh), border-radius 14px
- Dark luxury placeholder colors: Card1 #1a1a24 (z-index 3), Card2 #0e1828 (z-index 2), Card3 #161220 (z-index 1)
- All 3 cards have bottom-left labels: DM Sans "-- 01/02/03" eyebrow + Cormorant Garamond weight 300 "Campaign 01/02/03" title
- Depth layering: gsap.set card2 {y:25, scale:0.97}, card3 {y:45, scale:0.94} -- cards peek visibly below the one above
- CRITICAL: Cards 2+3 do NOT animate during Card 1's exit -- only Card 1 moves at t=0->1. This prevents card going behind higher z-index card. Only the exiting card moves; the ones below stay fixed and are revealed.
- t=0->1: Card1 exits y:'-110%' (straight up, no rotation). t=1->2: Card2 exits y:'-110%', Card3 rises to scale:1.0 y:0
- ease:'none' throughout, NO +=0.5 pauses -- scrub:1 provides all smoothing
- Placeholder card backgrounds -- real campaign photos replace background CSS when received

### 9. Lookbook (BUILT -- horizontal focal gallery, 700vh sticky)
- Left column (fixed): "The Collection" eyebrow + "SO PORTABLE, it's wearable" italic heading
- Right gallery: 6 image slots on a horizontal track. Focal window in center -- active image scale:1 opacity:1, others scale:0.65 opacity:0.35
- Track X position calculated from DOM on mount (galleryW/2 - slotW/2) to centre image 0
- Scroll drives track leftward; per-transition scale/opacity tweens swap focal emphasis (ease:none throughout)
- 120vh of scroll per image transition. Section background: GSAP-driven backgroundColor on .lookbook-visual, scrubbed via same timeline -- deep blue-navy #06122a (image 1, updated 2026-04-11 from silver-grey #b8bcc4) to near-black-navy #02040f (image 6, was #04091a). No CSS background on outer section. Initial CSS background-color: #06122a.
- Fixed focal frame (.lookbook-frame): position:absolute top:50% left:calc(50%+10vw) transform:translate(-50%,-50%), same dims as .lookbook-img, z-index:4, border-radius:8px. **Border: 4px** (updated 2026-04-06, was 1px). Animated with @property --lookbook-angle conic-gradient sweep on ::before (border-only mask via mask-composite:exclude + **padding:5px, inset:-5px, border-radius:13px** -- updated 2026-04-06 for thicker sweep), lookbook-frame-breathe keyframe for outer glow pulse.
- "Scroll to continue" hint at bottom center. Placeholder warm-tone backgrounds per slot -- real celeb/lookbook photos replace when received.

### 10. Testimonials + Footer (BUILT -- redesigned 2026-04-08)
- **Implemented as**: single `TestimonialsFooterSection` + `TestimonialCard` + `FooterBlock` components
- **Testimonials zone background**: `linear-gradient(to bottom, #8ab0d0 0%, #4a6a9a 38%, #1e3460 100%)` (cool blue-silver top -> navy bottom, updated 2026-04-11 from warm silver #b8bac6). Top color (#8ab0d0) matches BackgroundJourney 82% stop -- seamless visual join. Heading "Words of / love." Cormorant Garamond 600, dark navy text (rgba(10,18,42,0.94)) readable on blue-silver top. "love." italic rgba(38,62,112,0.88).
- **TestimonialCard (redesigned 2026-04-08)**: dark chrome polaroid. Outer #181c2e, inner #0c0f1e. Shadow: dark steel + subtle silver border `0 0 0 1px rgba(115,142,208,0.13)`. Hover: GSAP animates boxShadow on innerRef to chrome blue glow (elastic lift + shadow). Quote: Cormorant Garamond italic weight 300 -- **Caveat font NOT loaded, never use it**. Stars: gold rgba(198,174,88,0.92). Author: DM Sans uppercase. **No washi tape**.
- **GSAP animations in TestimonialsFooterSection**: per-word heading reveal (`.tf-hdg-word`, y:52->0, stagger 0.14), subtext slide-in from right (x:36->0), cards stagger up (y:CARD_HEIGHT->0, stagger 0.10), footer columns stagger (y:48->0, stagger 0.09), footer bottom fade.
- 5 placeholder testimonial cards (content to be replaced with real customer quotes when received)
- **Footer zone (FooterBlock.tsx, redesigned 2026-04-08)**: background #0b0d1a (dark steel). 5-column grid: Brand+socials, Shop, Support, Explore, Newsletter. All pink accents replaced with steel blue rgba(148,175,228,...). Nav links gain translateX(4px) hover. Social links expand letter-spacing on hover. Newsletter: input focus rgba(128,168,228,0.48), button steel-blue border. SVG arc lines: steel-blue, draw-in animation via stroke-dashoffset. Ghost AN: fades in + parallax drift y:0->-40 scrub:1.5.
- `testimonialsSectionState` in sceneState.ts (active + sectionProgress)
- Rendered in _index.tsx via ClientOnly + React.lazy + Suspense (120vh fallback)

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

## Performance Optimisations (applied 2026-04-11)
- **docHeight cache in SceneCanvas** (`getScrollProgress()`): `document.documentElement.scrollHeight` was read by every `useFrame` component (25 stars + 8 rocks + shader + fog + camera = ~37 reads/frame, each causing a layout reflow). Fixed with module-level `_cachedDocHeight` + `_docHeightTs` -- recomputed at most once per 500ms via `performance.now()` check. All other reads are a cheap division from cache.
- **BackgroundJourney scroll listener**: same `scrollHeight` reflow per scroll event + Lenis fires events at high frequency. Fixed: module-level `_bgDocHeight` set on init and resize only. Scroll listener RAF-gated (`rafPending` flag + `requestAnimationFrame`) so multiple Lenis ticks in one frame collapse to one `applyColors()` call.
- **BestSellersSection `setActiveIndex` guard**: was called on every scroll tick (60fps), triggering React re-renders constantly. Fixed with `_lastCardIdx` ref -- only calls `setActiveIndex` when the active card index actually changes (at most 4 times across the carousel rotation phase).
- **BestSellersCarousel DPR**: was `[1, 2]` (retina = 4x pixel count vs 1x). Capped to `[1, 1.5]` matching global SceneCanvas. Significant GPU bandwidth saving on retina screens.

## Key Lessons Learned
- **Horizontal fov math**: Canvas fov=75 is VERTICAL. Horizontal half-width at depth = tan(atan(tan(37.5deg) * aspectRatio)) * distance. For 16:9, horizontal half-width is ~1.37x the distance. At camera z=7 looking at z=0, a blob at z=-1 (distance 8) has horizontal edge at x=+-10.9, NOT +-6.1. Always account for aspect ratio when placing objects at screen edges.
- **Side blob positioning**: To place objects at far left/right screen edges, use z=-1 to -3 (close to camera) with x=+-9.5 to +-11. Placing at z=-5 to -10 with large x values doesn't work due to perspective compression pulling them toward center.
- **Three.js world matrix lazy update**: After setting `object.rotation` (or any transform), `Box3.setFromObject(object)` uses stale cached world matrices unless you call `object.updateMatrixWorld(true)` first. Always call `updateMatrixWorld(true)` before computing bounding boxes after manual rotation/position mutations.
- **GLTF scene cloning**: `useGLTF` returns a cached object -- multiple components using the same .glb share the same scene. Use `gltfScene.clone(true)` to get an isolated copy before mutating materials or positions. Cloned meshes still share geometry (fine) but material references can be replaced independently.
- **3D canvas clipping is frustum, not CSS**: If a 3D model is clipped at canvas edges, the fix is camera distance or FOV, not container size or CSS overflow. The canvas renders exactly what the camera frustum sees. Pull camera back (increase z) or widen FOV to show more of the scene.
- **AN_Logo.glb model size**: The AN logo model is quite large in Three.js units. At scale 1.0 it overflows a z=3.8 fov=48 camera frustum. Needs camera at z=9.0+ with fov=65 and scale ~0.78 to fit comfortably in a square canvas.

## Rules
- **Loaded fonts ONLY**: Cormorant Garamond, DM Sans, Barlow 700/800, Bebas Neue, Nunito. Caveat is NOT loaded -- never reference it. Use Cormorant Garamond italic for handwritten/editorial feel.
- **GSAP stroke-dashoffset draw-in pattern**: call `path.getTotalLength()` inside useEffect after mount, set `strokeDasharray: len, strokeDashoffset: len` via gsap.set, then animate `strokeDashoffset -> 0`.
- NEVER use em dashes in any code, comments, or output
- Performance is critical. Client said "shouldn't be laggy at all"
- The 3D cylindrical bestseller carousel is SACRED. Never replace with horizontal scroll.
- Always test with `npm run dev` after changes
- Always wrap Three.js/R3F components in ClientOnly
- Check for SSR issues before considering any step done
- Cap dpr at [1, 1.5] on desktop, [1, 1] on mobile for performance
- ALL useGLTF calls need '/draco/' as the second argument (local decoder, avoids CSP block)
- Never use <Environment preset="..."> -- it fetches external HDR. Use <Environment> with <Lightformer> children
