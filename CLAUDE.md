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
- Global effects (Lenis, background journey, cursor, grain, progress bar) render as siblings in Layout's body, NOT wrapping Hydrogen providers
- Background color journey uses scroll listener (not ScrollTrigger) for reliability with async Lenis init
- All 3D models are in public/models/ as Draco-compressed .glb files (no baked materials, shaders applied in code)
- Dev server runs at http://localhost:3000 (may increment to 3001/3002/3003 if ports are in use)
- **Global 3D background**: SceneCanvas.tsx lives in `root.tsx` Layout (NOT _index.tsx), making it persist across ALL routes. Contains AN_Logo, StarField (25 star.glb), RockField (8 rock.glb shooting stars), AtmosphericFog (scroll-synced FogExp2 silver->blue->black journey), AnimatedEnvironment (breathing Lightformers + sapphire #1a50c8 backlight), scroll-driven camera with intro zoom, MouseTracker, AdaptivePostFX (SelectiveBloom stars+rocks). All previous elements (blobs, orbs, deco rings/shards/spirals, BackgroundPaths, ParticleSpiral, AdaptiveSparkles) REMOVED. Fixed to viewport at z-index 0.
- SceneCanvas is lazy-loaded via `React.lazy` behind `ClientOnly` + `Suspense` in `root.tsx` Layout.
- No HDR files are used anywhere. `blackhole.hdr` was removed from `public/`. All environment lighting uses Lightformer children only.
- **Base color palette**: #141820 dark cool silver. Used in --bg-primary, body background, and first BackgroundJourney stop. (Preloader tunnel still uses #0a0a0a -- do not change it.)
- **Color journey**: #141820 silver (0%) -> #08101e sapphire blue (4%) -> hold blue (13%) -> #050505 black (20%) -> hold black (25%) -> #1c1c24 dark steel (50%) -> #383848 medium titanium (68%) -> #bebec0 polished silver (82-100%). Text flips #ffffff -> #111111 at 82%. Hero zone (0-20%) is the silver->blue->black arc that blends seamlessly into About section's black overlay.
- **Click-to-enter flow**: EntrancePreloader has idle phase (still motion, button visible) and active phase (camera flies through gates). Communicates completion via `window.dispatchEvent(new Event('preloader-complete'))`.
- **Camera continuity**: SceneCanvas listens for `preloader-complete` event, then lerps camera from close-up [0, 0.2, 3.5] to normal [0, 0.5, 7] over ~2.5s before handing off to scroll-driven camera.
- **Atmospheric fog**: FogExp2 (density 0.012) multi-phase: 0-4% silver(#141820)->blue(#08101e), 4-13% hold blue, 13-25% blue->black(#050505), 25-68% black->steel(#383848 RGB), 68-82% steel->silver(#bebec0), 82%+ hold silver.
- **Scene phase system**: `scenePhaseState` in `sceneState.ts` holds `heroIntensity`, `aboutIntensity`, `transitionBlend`, `latePageFade`, `logoFade` (plain JS object, no React). `ScenePhaseDriver` component in SceneCanvas reads scroll progress and drives these values. Currently used by StarField (hero fade) and AdaptivePostFX. `TransitionBridge` was REMOVED. Key thresholds: `aboutIntensity` ramps at smoothstep(0.28, 0.48), `transitionBlend` enters at smoothstep(0.22, 0.30) and exits at smoothstep(0.42, 0.54).
- **Late-page fade**: `latePageFade` in scenePhaseState ramps at smoothstep(0.24, 0.30) with lerp damping 0.15. Note: the AN_Logo does not use latePageFade directly -- it uses `logoFade` instead. Stars use their own scroll-based fade (smoothstep 0.0-0.22) rather than latePageFade.
- **Logo fade**: `logoFade` in scenePhaseState is driven by `aboutSectionState.sectionProgress`. Formula: `clamp01((sectionProgress - 0.45) / 0.35)`, floored by `Math.max(..., targetLateFade)`. Logo starts fading at sectionProgress 0.45 (after "REBELLION" appears at 0.30 in About section) and is fully gone by 0.80 (before the About exit animation at 0.88). After scrolling past About, sectionProgress stays at ~1.0 so the logo remains hidden. Scrolling back up reverses the fade. AN_Logo reads `scenePhaseState.logoFade` for both opacity (`1 - logoFade`) and rotation slowdown (`1 - logoFade * 0.97`).
- **Hero-to-About spacer**: 200vh transparent `<div>` in _index.tsx between HeroSection (350vh) and AboutSection. Total hero zone = 550vh. Background turns black (#050505) by the end of the spacer -- seamless About blend.
- **About-to-Bestsellers spacer**: 0vh (removed as of 2026-04-07, was 31.5vh). BestSellersSection has marginTop:-5vh. Wipe trigger: `'top bottom'` (both tween and visTrigger).
- **Bestsellers background wipe**: Active Theory-style bottom-to-top wipe transition in BestSellersSection.tsx. A `position: fixed; height: 100vh` div with `linear-gradient(to bottom, #1c1c28 0%, #2e2e3a 18%, #78788a 45%, #a8a8b4 72%, #d4d4dc 100%)` (dark steel top -> polished silver bottom, blends with About's dark bottom edge) is revealed via `clip-path: inset(100% 0 0 0)` animating to `inset(0% 0 0 0)`. Wipe trigger: `'top bottom'` (both tween + visTrigger). A second ScrollTrigger manages display toggling.

## Key Patterns
- ClientOnly wrapper: useState(false) + useEffect(setMounted(true)) pattern for browser-only components
- Chrome material (logo): MeshPhysicalMaterial, metalness 1.0, roughness 0.12, **envMapIntensity 0.5** (kept low to prevent sapphire Lightformer blue cast), **emissive #a09890 emissiveIntensity 0.12** (warm silver self-glow counteracts any remaining blue), clearcoat 0.2, clearcoatRoughness 0.06, color #a8a8a8. No bloom (outside Select).
- Chrome material (preloader gate rings): MeshPhysicalMaterial, metalness 1.0, roughness 0.05, envMapIntensity 2.5, clearcoat 0.3, color #c8c8c8 (same as logo). Glow ring: MeshBasicMaterial, AdditiveBlending, color #888888.
- Star decoration material: MeshPhysicalMaterial + emissive (config.color, emissiveIntensity 0.12-0.18 base, +0.5 on cursor proximity). metalness 1.0, roughness 0.06, envMapIntensity 2.5 + sin*0.8 + proximity*3.5, clearcoat 0.5. **Foreground colors now blue-silver** (#b0cce8, #a0c4fc, #b8d0f0, #c8e0ff, #aacaf4). 25 instances (15 mobile) in 3 depth layers: foreground (5, z:-1.5 to -2.5, scale 0.38-0.55, parallax 0.58-0.76), midground (12, z:-3 to -5, scale 0.15-0.32), background (8, z:-6 to -9, scale 0.08-0.14). Entrance: scale 0->1 on preloader-complete, staggered by phase*0.12s. Scatter: pos * 3.5x radially + z+4, rotation 5x. Fade: smoothstep(0.0, 0.22). **Scroll lerp: 0.07** (was 0.04).
- Rock decoration material (NEW): 8 rock.glb instances. MeshPhysicalMaterial color #88acd0 (steel blue-silver), emissive #1a3870 (deep blue), metalness 0.95, roughness 0.18, envMapIntensity 2.0, clearcoat 0.3. Scale 0.36-0.52 (2x biggest star). 5 left-edge rocks sweep rightward (travelX +20-26), 3 right-edge rocks sweep leftward (travelX -21-23). Staggered sweep: starts at phase*0.018 scroll, spans 16% window. Rotation ramps 7x during sweep. Fade: smoothstep(0.0, 0.28). **Scroll lerp: 0.07**. Mobile: 4 rocks. Reuses `_starEntryActive`/`_starEntryTime` for entrance.
- Camera animations: GSAP timeline for main motion, useFrame for micro-wobble
- Lenis + GSAP sync: lenis.on('scroll', ScrollTrigger.update) + gsap.ticker.add for RAF sync
- Draco decoder: ALL useGLTF calls must pass '/draco/' as second argument -- e.g. useGLTF('/models/foo.glb', '/draco/')
- Environment maps: use drei <Environment resolution={256} background={false}> with <Lightformer> children for local cubemaps -- no external HDR fetch, no CSP issues
- Scroll-driven 3D: getScrollProgress() reads Lenis scroll position (or window.scrollY fallback) inside useFrame, lerped via scrollRef for smooth transitions. Each 3D element reads scroll progress independently.
- Mouse parallax: module-level mouseState object {x, y, lerpX, lerpY} updated via mousemove listener, smoothed in useFrame. Stars use parallax factor 0.15-0.42 so closer stars move more than distant ones.
- Fog bridge transition (preloader): radial-gradient div overlay that fades in over 2.5s, masking the tunnel-to-hero transition. Uses #0a0a0a to match body bg. No white flash.
- Logo rotation: scene.rotation.set(-Math.PI / 2 + Math.PI, 0, Math.PI + Math.PI) -- flipped from original per client request. Do NOT add Y-axis rotation (Math.PI on Y mirrors text, turning "AN" into "NA"). Logo group Y-axis is scroll-driven coin-spin only.
- Logo scroll behavior: base scale 1.4, multiplied by lerp(1, 2, smoothSp) to compensate for camera z doubling (7->14). rotation.y driven by lerped rotSpeed = smoothSp * Math.PI * 32 (halved from 64 on 2026-04-04). Rotation slows to stop as logoFade rises. Idle breathing scale preserved.
- SceneCanvas Lightformer intensities: overhead white 3.5 breathing (+/-0.3), left #ddd4ff lavender, right #e8e8e8 neutral, front fill #ccc8d8, floor #080808, **sapphire #1a50c8 intensity 2.5 at z=-10** (adds blue reflections to all chrome; logo is isolated from blue cast via low envMapIntensity 0.5).
- Bloom post-processing: **SELECTIVE -- stars + rocks, logo excluded**. `Select enabled` wraps StarField + RockField. LogoModel outside Select. `SelectiveBloom` (mipmapBlur, threshold 0.55, smoothing 0.9, intensity 0.55 desktop / 0.35 mobile).
- BackgroundPaths.tsx and ParticleSpiral.tsx still exist as files but are NOT imported into SceneCanvas (removed during hero redesign 2026-04-04).
- **CSS sticky scroll pattern** (BestSellers, Campaign, Lookbook): outer `<section>` has explicit height (300vh/600vh/700vh) in CSS. Inner wrapper has `position:sticky; top:0; height:100vh`. Browser pins inner wrapper while outer section scrolls -- NO GSAP pin needed. ScrollTrigger uses `trigger:section, start:'top top', end:'bottom bottom', scrub:1, animation:tl` where `tl` is `gsap.timeline({paused:true})`. Timeline duration determines animation density. Scrub distance = section height - 100vh.
- **GSAP import pattern for sections**: always top-level `import gsap from 'gsap'` + `import {ScrollTrigger} from 'gsap/ScrollTrigger'` + `gsap.registerPlugin(ScrollTrigger)` at module level. Do NOT use dynamic Promise.all imports inside useEffect for sections (that pattern is only in _index.tsx global label animations).
- Cursor (ChromeCursor): **REWRITTEN** -- dot + lagging ring design (NOT the old SVG arrow, do not revert). Chrome dot (7px, rgba(208,208,228,0.92)) snaps to mouse. Ring (28px) follows with lerp 0.11. On hover over a/button/input: ring scales 1.65x via CSS transition (0.28s cubic-bezier), border brightens. posRef wrapper holds position (no CSS transition), inner ringVisRef holds visual (CSS transition for scale/color only -- never mix RAF transform with CSS transition on the same element). 6-dot silver trail (3px, spawn every 12px, decay 0.038/frame). No RGB keyframes, no velocity tilt.

## File Structure
app/
  components/
    global/
      SmoothScroll.tsx        -- Lenis init + GSAP sync + singleton getLenis() export
      BackgroundJourney.tsx    -- Scroll-driven bg color (#0f0f14 titanium-black -> #1c1c24 -> #383848 -> #bebec0 silver), sets --text-primary CSS var
      ChromeCursor.tsx         -- SVG arrow cursor (iridescent animated stroke, dark fill, velocity tilt ±14 deg) + 14-element glass drop trail. Injects CSS keyframes (`cursor-glow`, `chr-stroke`) into head on mount.
      GrainOverlay.tsx         -- SVG feTurbulence film grain, 4% opacity
      ScrollProgress.tsx       -- Gold gradient progress bar, fixed top
      GlobalEffects.tsx        -- Combines all 5, ClientOnly boundary
      SceneCanvas.tsx          -- Global persistent full-viewport R3F Canvas (position: fixed, z-index: 0). Current contents: AN_Logo (fades via logoFade, low envMapIntensity 0.5 + warm emissive to avoid blue cast), StarField (25 star.glb, blue-silver colors, scatter 0-22%, fade 0-22%), RockField (8 rock.glb shooting stars, directional sweep, staggered cascade, fade 0-28%), AtmosphericFog (silver->blue->black->steel->silver journey), AnimatedEnvironment (breathing Lightformers + sapphire #1a50c8 backlight), scroll-driven camera, MouseTracker, AdaptivePostFX (SelectiveBloom stars+rocks). Lazy-loaded in root.tsx Layout.
      BackgroundPaths.tsx      -- EXISTS but NOT used (removed from SceneCanvas 2026-04-04). 8 groups of flowing curves, NormalBlending. Available for future use.
      ParticleSpiral.tsx       -- EXISTS but NOT used (removed from SceneCanvas 2026-04-04). Infinite particle cylinder. Available for future use.
    sections/
      EntrancePreloader.tsx    -- Click-to-enter cinematic gate tunnel. Two phases: idle (still motion, "ENTER THE LUXURY" button, god rays breathing, grain overlay) and active (camera flies z=40 to z=-115, fog bridge). Dispatches 'preloader-complete' event. God rays: 6 PlaneGeometry spokes + central CircleGeometry glow at z=-95 with AdditiveBlending. Grain: inline SVG feTurbulence overlay at 5% opacity. Button: DM Sans, uppercase, 0.3em letter-spacing, glowing border pulse.
      HeroSection.tsx          -- Pure HTML overlay. "House of An" centered dead-center (top:50%, width:100%, translateY(-50%)). Cormorant Garamond weight 200, 0.65em tracking, gradient shimmer text (webkit-background-clip), drop-shadow filter for legibility. Hairline rule accent below. GSAP animates opacity only (no transform). heroFloat keyframe handles vertical float. Scroll chevron at bottom.
      AboutSection.tsx         -- Editorial about layout. Left: "THE / REFINED / REBELLION" as 3 sequential word reveals on scroll. Font: **Barlow 800**, letterSpacing:0.08em, fontSize clamp(3rem, 5.8vw, 7rem). Position: top:22%, left:3.5vw (NOT vertically centered). Color: #ffffff with white bloom textShadow glow. Center: AboutStillLogo (local R3F canvas, shared with WhySection). Right: Founded 2012 label + hairline divider + 2 DM Sans body paragraphs. ScrollTrigger scrub:1 (start:'top 78%', end:'bottom 5%'). blackBgRef overlay fades in (start:'top 90%', end:'top 25%'). Floor glow div (height:380px, NO filter:blur).
      AboutStillLogo.tsx       -- Local R3F Canvas with still AN_Logo.glb for the About section center. Separate from global SceneCanvas. Key: gltfScene.clone(true) to avoid shared material mutation; scene.updateMatrixWorld(true) BEFORE Box3.setFromObject (Three.js lazy matrices -- bbox is stale without this); bbox centering via scene.position.sub(center). Camera fov=65 at z=9.0 (model is large -- needs far pullback). Scale 0.78 breathing only. Chrome: color #c8c8cc, metalness 0.9, roughness 0.15, envMapIntensity 1.2, clearcoat 0.4. Canvas: 540x540 square, alpha:true.
      BestSellersSection.tsx   -- Parent HTML for Bestsellers: title, subtitle, product name, dot indicators, touch swipe, animating ref. No arrow buttons. `goToCard(index)` rotates to any card via shortest-path GSAP (power3.inOut, 1.0s). marginTop:-5vh. Lazy-loads BestSellersCarousel via React.lazy + ClientOnly + Suspense. Background wipe: position:fixed div with `linear-gradient(to bottom, #1c1c28 0%, #2e2e3a 18%, #78788a 45%, #a8a8b4 72%, #d4d4dc 100%)` revealed via clip-path bottom-to-top. ScrollTrigger start:`'top bottom'` (spacer is now 0vh -- if spacer changes, update this). Second ScrollTrigger manages display toggling. **Bottom vignette (added 2026-04-08)**: `position:absolute; bottom:0; height:12vh; background:linear-gradient(to bottom, transparent, #0c0c16); zIndex:6; pointerEvents:none` inside the sticky inner div -- masks silver gradient strip at the section bottom edge before CategoriesSection.
      BestSellersCarousel.tsx  -- Self-contained R3F Canvas for 3D elliptical-orbit carousel. All 5 cards orbit in an ellipse so ALL are visible at once. ORBIT_RADIUS_X=5.5, ORBIT_RADIUS_Z=2.8, ROT_PER_CARD=0.6, MIN_SCALE=0.62, SCALE_STEP=0.19, ANGLE_STEP=72 deg. Per-card lerp refs (posXRef/posZRef/rotYRef), lerp 0.10, snap at |offset|>=2.3, wrapFade hides teleport. Camera: fov=65, position=[0, 0.5, 11]. Cards group at `<group position={[0,0,5]}>` -- CRITICAL: keeps cards in front of spirals. **SpiralDecor (updated 2026-04-07)**: ALL setup (reset, center, scale, material) in useMemo -- runs before R3F attaches scene so Box3 sees no parent transforms, preventing reload orbit bug. useFrame drives `groupRef.current.rotation.y = -rotStateRef.current.angle` (Y-axis twist on scroll). TWO instances: [0,7,-4] (top, hangs from viewport edge) and [0,-7,-4] (bottom). depthWrite:false REQUIRED. Scroll-driven: ScrollTrigger scrub:1, totalAngle=-288 deg. **Chrome frame REMOVED (2026-04-08)**: frameMaterial RoundedBox (4.55x6.5, metalness 1.0) deleted -- was causing black border appearance. Cards now show image PlaneGeometry 4.15x6.1 only + glow RoundedBox 4.8x6.75 (AdditiveBlending, hover only). Pointer events (onPointerEnter/Leave/onClick) on image mesh directly.
      CategoriesSection.tsx    -- 3 floating card layout (Edge, Sculpt, Elite) in a flex row. gap:4.5vw, justify-content:center. Each card: width min(27vw,340px), height 68vh, border-radius 18px. Pure HTML/CSS/GSAP -- no R3F. Image files: /images/categories/edge1.jpg, sculpt2.jpg, elite3.jpg. **3D glowing borders (added 2026-04-06)**: @property --cat-angle drives rotating conic-gradient sweep on .cat-card-outer::before (inset:-3px, padding:3px, border-radius:21px, mask-composite:exclude -- border-only effect, 5s sweep). .cat-card-outer::after has static border (rgba(255,245,220,0.14), 2px) + breathing box-shadow glow (cat-breathe 4.5s ease-in-out). Each card staggered by animation-delay so sweeps are never in sync. **Hover (fixed 2026-04-06)**: lift is on .cat-card-outer (translateY(-14px), no scale -- scale caused card to overflow glow border). On hover: ::after glow flares (box-shadow 3x brighter, border 60% opacity). .cat-card gets filter:brightness(1.06). No scale anywhere. Floating animations: catFloat0/1/2 on inner .cat-float-X divs (independent from hover transform). GSAP scrub entrance: cards enter from x:±100 y:70 opacity:0 (ScrollTrigger scrub:1.2). No longer imports categoriesSectionState.
      WhySection.tsx           -- **REBUILT 2026-04-07**: Full layout duplicate of AboutSection. Left: "WHY / HOUSE OF / AN" in Barlow 800, top:22%, left:3.5vw, fontSize clamp(3rem, 5.8vw, 7rem), letterSpacing 0.08em. Center: AboutStillLogo (same component as About). Right: "Founded in 2024" label + hairline divider + 2 body paragraphs (Why-specific copy). Background gradient: linear-gradient(to bottom, #1c1c22 -> #2a2a32 -> #3a3a44 -> #868690 -> #b0b0b8) -- dark steel to polished silver-grey. Same GSAP scroll animations as About (word reveal at 0.0/0.15/0.30, exit at 0.88, blackBgRef, floor glow). whySectionState wired (NOT aboutSectionState).
      WhyStillLogo.tsx         -- Local R3F Canvas with still AN_Logo.glb for the Why section. Separate from global SceneCanvas: no scroll-driven rotation, just breathing scale (sin(t*0.35)*0.015). Own Environment + Lightformers (overhead 2.8, left lavender 1.2, right neutral 1.4). Camera fov=48 at z=3.6. Chrome material: color #c4c4d4, metalness 1.0, roughness 0.14, envMapIntensity 1.35. Letters spread apart (x+-0.28) for visual openness. NOT YET WIRED IN -- exists as a component but not imported/rendered anywhere.
      CampaignSection.tsx      -- 3-card large inset stack. Pure HTML/CSS/GSAP. Outer section height:600vh, inner .campaign-visual position:sticky top:0 height:100vh overflow:visible. Cards: min(1100px,90vw) x min(640px,72vh), border-radius:14px. Colors: Card1 #1a1a24 (z-index 3), Card2 #0e1828 (z-index 2), Card3 #161220 (z-index 1). All 3 cards have bottom-left labels ("-- 01/02/03" eyebrow + "Campaign 01/02/03" title, DM Sans eyebrow + Cormorant title weight 300). Depth layering via gsap.set: card2 {y:25, scale:0.97}, card3 {y:45, scale:0.94}. GSAP timeline (paused:true, 2 units, ease:'none' throughout, NO +=0.5 pauses): t=0->1 Card1 exits y:'-110%'; t=1->2 Card2 exits y:'-110%', Card3 rises scale:1.0 y:0. Cards 2+3 stay FIXED during Card1's exit (prevents card going behind higher z-index card -- the original bug). ScrollTrigger scrub:1. campaignSectionState in sceneState.ts.
      LookbookSection.tsx      -- 6-image ORYZO-style focal carousel. Pure HTML/CSS/GSAP. Outer section height:700vh NO own background (removed), inner .lookbook-visual position:sticky top:0 height:100vh overflow:hidden background-color:#b8bcc4 (initial CSS). Text ("The Collection" + "SO PORTABLE, it's wearable") is position:absolute top-left overlay (z-index 3, pointer-events:none). Gallery is position:absolute inset:0 (full viewport width). Each .lookbook-img is position:absolute top:50% left:50%, GSAP sets xPercent:-50 yPercent:-50. On mount: STRIDE=galleryW*0.22, FOCAL_SHIFT=galleryW*0.10 (shifts focal 10% right of center). gsap.set all imgs at FOCAL_SHIFT+i*STRIDE. Timeline (paused:true, 5 units): per-transition, all 6 images animate to new x=FOCAL_SHIFT+endOffset*STRIDE + scale + opacity. Scale: 1.0/0.65/0.50/0.38 by |offset|. Opacity past: 1.0/0.78/0.32/0.10. Opacity future: 1.0/0.55/0.35/0.20. Background color: tl.fromTo(visual, {backgroundColor:'#b8bcc4'}, {backgroundColor:'#04091a', ease:'none', duration:5}, 0) -- silver-grey image 1 to deep midnight blue image 6, driven by same ScrollTrigger scrub. visualRef added for this. Fixed focal frame: .lookbook-frame div at position:absolute top:50% left:calc(50%+10vw) transform:translate(-50%,-50%), same dims as .lookbook-img, z-index:4. Frame effects: @property --lookbook-angle, ::before conic-gradient sweep (border-only mask via mask-composite:exclude + padding:1.5px), lookbook-frame-breathe keyframe (box-shadow + border-color pulse). ScrollTrigger scrub:1 animation:tl. lookbookSectionState in sceneState.ts.
      TestimonialsFooterSection.tsx -- **REDESIGNED 2026-04-08**: 5 dark-chrome polaroid cards scattered in a strip, footer below. Background: `linear-gradient(to bottom, #b8bac6 0%, #68789a 38%, #263d6a 100%)` (silver top -> steel blue bottom). Heading "Words of / love." in Cormorant Garamond 600, dark navy rgba(22,28,52,0.92); italic "love." rgba(38,62,112,0.88). GSAP animations: per-word heading reveal (.tf-hdg-word spans, y:52->0, stagger 0.14, power3.out), subtext slides from right (x:36->0), cards stagger up (y:CARD_HEIGHT->0, stagger 0.10), footer columns stagger (y:48->0, stagger 0.09), footer bottom fades in. testimonialsSectionState in sceneState.ts.
      TestimonialCard.tsx          -- **REDESIGNED 2026-04-08**: dark chrome polaroid. Props: quote, author, stars, tapeColor, x, rotate. Outer card: #181c2e. Inner: #0c0f1e. Shadow: `0 6px 28px rgba(5,10,42,0.60), 0 0 0 1px rgba(115,142,208,0.13)`. Hover: GSAP animates boxShadow on innerRef to chrome blue glow; card lifts via elastic.out(1,0.45). Quote: Cormorant Garamond italic weight 300 (NOT Caveat -- that font is not loaded). Stars: gold rgba(198,174,88,0.92). Author: DM Sans uppercase. No washi tape. tapeColor prop kept in CARD_CONFIGS but unused (tape div removed).
      FooterBlock.tsx              -- **REDESIGNED 2026-04-08**: background #0b0d1a (dark steel). Steel-blue accent color throughout: rgba(148,175,228,...). Column headings rgba(148,175,228,0.72). Nav links: translateX(4px) hover. Social links: letter-spacing expansion on hover. Newsletter input focus: rgba(128,168,228,0.48). Newsletter button: steel-blue border/text. SVG arcs: steel-blue, animated draw-in via stroke-dashoffset (getTotalLength() in useEffect, gsap.to strokeDashoffset->0). Ghost AN: fades in on scroll + parallax y:0->-40 scrub:1.5. Uses footerRef, arcRef1, arcRef2, ghostRef + gsap.context.
  lib/
    sceneState.ts              -- Plain JS shared state objects for cross-module communication: aboutSectionState {active, sectionProgress}, bestsellersSectionState {active, sectionProgress}, scenePhaseState {heroIntensity, aboutIntensity, transitionBlend, latePageFade, logoFade}, categoriesSectionState {active, sectionProgress}, whySectionState {active, sectionProgress}, campaignSectionState {active, sectionProgress}, lookbookSectionState {active, sectionProgress}, testimonialsSectionState {active, sectionProgress}. No React dependency.
  routes/
    _index.tsx                 -- Homepage: renders EntrancePreloader + scrollable HTML overlay (HeroSection + 125vh spacer + AboutSection + 63vh spacer + BestSellersSection + CategoriesSection). Separate wrapper divs for: WhySection, CampaignSection, LookbookSection, TestimonialsFooterSection. No remaining placeholder sections. SceneCanvas no longer here (moved to root.tsx). Each section uses ClientOnly + React.lazy + Suspense with matching fallback height (BestSellers:300vh, Categories:260vh, Why:100vh, Campaign:600vh, Lookbook:700vh, TestimonialsFooter:120vh).
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
    AN_Logo.glb               -- 22 KB, House of an logo geometry
    entrance2.glb              -- 323 KB, tunnel/portal (unused, preloader uses procedural gates)
    Podium.glb                 -- 401 KB, pedestal (unused currently, for future hero concept)
    rock.glb                   -- 38 KB, sculptural rock (USED: RockField in SceneCanvas, 8 shooting-star instances)
    Spiral.glb                 -- 209 KB, spiral decoration -- USED in BestSellersCarousel.tsx as SpiralDecor (TWO instances: center [0,0,-4] and bottom [0,-14,-4]; scale=14 units; depthWrite:false REQUIRED and implemented)
    star.glb                   -- 16 KB, decorative star element (USED: StarField in SceneCanvas, 10 hero instances)
    surface1.glb               -- 96 KB, landscape/terrain (unused currently, for future hero concept)

## Design Direction (from Ananyaa's Canva Deck)

### Overall Aesthetic
Liquid chrome, fluid silver metal, futuristic luxury. Everything should feel like molten silver in motion. The mood board shows: chrome tunnel portals, liquid metal blobs with chrome sphere droplets, twisted chrome rings, dark environments with high-contrast metallic reflections. Think Apple Vision Pro meets high-end jewellery.

### Background Color Journey (scroll-driven, throughout page -- IMPLEMENTED, updated 2026-04-04)
- 0-25%: Dark titanium (#0f0f14) -- hero and early scroll, grey/silver/titanium palette with blue accents
- 25-50%: Hold dark titanium -> transition to dark steel (#1c1c24)
- 50-68%: Dark steel to medium titanium with blue cast (#383848)
- 68-82%: Titanium to cool polished silver (#bebec0)
- 82-100%: Hold cool silver (#bebec0)
Initial page background (CSS + body): #0f0f14 (dark titanium). Preloader tunnel still uses #0a0a0a -- do not change it.
Client direction: grey/silver/titanium primary palette with sapphire-blue accents (reference: brushed titanium surface with deep blue gemstone accents).

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
- **Scroll-driven**: BestSellersSection ScrollTrigger (scrub:1, start:'top top', end:'bottom bottom') maps progress -> `rotStateRef.angle`. totalAngle = -(CARDS-1)*ANGLE_STEP = -288 deg. Cards cycle 0->1->2->3->4 as user scrolls.
- **Click-to-front**: `goToCard(index)` uses shortest-path ANGLE_STEP arithmetic (unchanged) then `gsap.to(rotStateRef.current, {angle: current+delta, duration:1.0, ease:'power3.inOut'})`. Dots and activeIndex update accordingly.
- **Card hover glow**: glow RoundedBox (4.8x6.75x0.01, z=-0.02, AdditiveBlending). `glowIntensRef` lerps 0->1 on hover, `glowMaterial.opacity = glowIntensRef * 0.28`.
- **No arrow buttons**: Touch swipe (48px) + dot indicators + card click.
- **Background wipe transition**: position:fixed silver radial-gradient div (`radial-gradient(ellipse at 50% 30%, #d4d4dc 0%, #a8a8b4 35%, #78788a 70%, #3a3a48 100%)`) animates `clip-path: inset(100% 0 0 0)` to `inset(0% 0 0 0)` bottom-to-top. Triggers: start:`top bottom+=44.5%`, end:`top 20%`, scrub:0.4. Second trigger manages display:none toggling. Wipe offset 44.5% must match spacer height (31.5vh) -- if spacer changes, update both triggers.
- **Chrome frame REMOVED (2026-04-08)**: frameMaterial RoundedBox (4.55x6.5, metalness 1, roughness 0.04) deleted -- caused black border appearance. Cards now: image PlaneGeometry 4.15x6.1 only + glow RoundedBox 4.8x6.75 (radius 0.16, AdditiveBlending). Pointer events on image mesh.
- Scale: `max(MIN_SCALE=0.62, 1.0 - |offset|*SCALE_STEP=0.19) * wrapFade`. Lerp factor 0.10.
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
- 120vh of scroll per image transition. Section background: GSAP-driven backgroundColor on .lookbook-visual, scrubbed via same timeline -- silver-grey #b8bcc4 (image 1) to deep midnight blue #04091a (image 6). No CSS background on outer section.
- Fixed focal frame (.lookbook-frame): position:absolute top:50% left:calc(50%+10vw) transform:translate(-50%,-50%), same dims as .lookbook-img, z-index:4, border-radius:8px. **Border: 4px** (updated 2026-04-06, was 1px). Animated with @property --lookbook-angle conic-gradient sweep on ::before (border-only mask via mask-composite:exclude + **padding:5px, inset:-5px, border-radius:13px** -- updated 2026-04-06 for thicker sweep), lookbook-frame-breathe keyframe for outer glow pulse.
- "Scroll to continue" hint at bottom center. Placeholder warm-tone backgrounds per slot -- real celeb/lookbook photos replace when received.

### 10. Testimonials + Footer (BUILT -- redesigned 2026-04-08)
- **Implemented as**: single `TestimonialsFooterSection` + `TestimonialCard` + `FooterBlock` components
- **Testimonials zone background**: `linear-gradient(to bottom, #b8bac6 0%, #68789a 38%, #263d6a 100%)` -- silver top -> steel blue bottom. Heading "Words of / love." Cormorant Garamond 600, dark navy text (rgba(22,28,52,0.92)) readable on silver top. "love." italic rgba(38,62,112,0.88).
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
