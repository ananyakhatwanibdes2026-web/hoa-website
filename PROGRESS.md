# HOUSE OF AN -- Progress Log

## Phase 1: Foundation [COMPLETE]
- [x] Shopify store set up (house-of-an-2.myshopify.com)
- [x] Headless + Hydrogen sales channels installed
- [x] Storefront API access configured
- [x] Test product added (Test Ring, Rs.1,999)
- [x] Hydrogen project scaffolded at ~/Desktop/house-of-an-copy
- [x] Store connection verified (GraphiQL working at localhost/graphiql)
- [x] Dependencies installed (three, @react-three/fiber@8, @react-three/drei@9, gsap, lenis)
- [x] All 7 OBJ files converted to Draco-compressed GLB (28 MB down to 1.1 MB)

## Phase 2: Homepage Animations [IN PROGRESS]

### Step 1: Global Setup Layer [COMPLETE]
- [x] Lenis smooth scroll with GSAP ticker sync
- [x] Background color journey (scroll-driven, black to silver-white via RGB lerp)
- [x] Chrome metallic cursor with trailing ring + velocity-based fluid distortion
- [x] Film grain overlay (SVG feTurbulence, 4% opacity)
- [x] Gold scroll progress bar (fixed top)
- [x] Fonts loaded (Cormorant Garamond + DM Sans via Google Fonts)
- [x] CSS custom properties (--font-display, --font-body, --bg-primary, --text-primary)
- [x] GlobalEffects integrated into root.tsx Layout as sibling
- [x] PageLayout removed from App function

### Step 2: Entrance Preloader [COMPLETE]
- [x] Click-to-enter flow (idle + active phases)
- [x] 8 chrome torus gate rings (procedural, not from model)
- [x] Camera GSAP timeline: z=40 to z=-115 over ~5.8s
- [x] God rays: 6 PlaneGeometry spokes + CircleGeometry glow, AdditiveBlending
- [x] Fog bridge transition (radial-gradient overlay, no white flash)
- [x] "ENTER THE LUXURY" button: DM Sans, glowing border pulse
- [x] Deep space environment: Stars, Sparkles, FogExp2 #0a0a0a
- [x] Dispatches 'preloader-complete' window event
- [x] Scroll locked during animation (Lenis.stop + body overflow hidden)
- [x] Mobile: dpr [1,1], spotLight skipped

### Step 3: Single-Flow 3D Scroll Architecture [COMPLETE]
- [x] SceneCanvas.tsx -- persistent fixed Canvas (z-index 0, alpha: true)
- [x] SceneCanvas in root.tsx Layout (persists across all routes)
- [x] Scroll camera: getScrollProgress() + getLenis() + lerp smoothing
- [x] Logo + blobs + orbs + scroll decorations
- [x] HTML overlay (z-index 1) scrolls over fixed 3D canvas

### Step 4: Global Liquid Metal Background [COMPLETE]
- [x] @react-three/postprocessing@2.19.1 (--legacy-peer-deps for three@0.182)
- [x] 4 liquid metal blobs (IcosahedronGeometry + MeshDistortMaterial)
- [x] EffectComposer + Bloom (luminanceThreshold 0.4, intensity 0.5/0.3, radius 0.8)
- [x] 6 floating metallic orbs with mouse parallax + heartbeat pulse

### Step 5: Premium Brand Polish [COMPLETE]
- [x] Camera zoom-in intro: [0,0.2,3.5] -> [0,0.5,7] on preloader-complete
- [x] Heartbeat pulse on blobs + orbs (envMapIntensity modulated with per-element phase offset)
- [x] Scroll decorative elements: 4 chrome rings, 3 glass shards, 2 spirals, 3 streaks
- [x] Lightformer breathing: overhead intensity oscillates 5 +/- 0.5

### Step 6: Background Paths + Particle Spiral [COMPLETE]
- [x] BackgroundPaths.tsx: 8 path groups, 40 lines desktop / 16 mobile
- [x] Scroll warp, mouse magnet deflection (radius 4.0), radial center mask (3.0 units)
- [x] ParticleSpiral.tsx: 4500 particles desktop / 1500 mobile, infinite Y-wrapping
- [x] Color sync at 0.68-0.82: white -> #222222 charcoal (NormalBlending)

### Step 7-10: Visual Refinements [COMPLETE]
- [x] 2x scale gutter spread (xBias +-5 to +-10)
- [x] MAX_RADIUS 18, Y_EXTENT 20, seamless Y-wrapping
- [x] Logo coin-spin + scale compensation (lerp(1,2,sp) as camera doubles z)
- [x] Blob driftX + driftZ dispersal to clear logo space
- [x] Color journey: #0f0a1e -> #1e293b -> #3a4a5c -> #c0c0c0
- [x] FogExp2 scroll-synced (density 0.012, #0f0a1e to #c0c0c0)
- [x] Lightformers: left #ddd4ff lavender for chrome logo purple highlights

### Step 11: HeroSection Redesign [COMPLETE]
- [x] Gradient shimmer text (webkit-background-clip, 55% edges -> 100% center)
- [x] filter: drop-shadow for legibility over 3D (2px halo + 24px soft glow)
- [x] GSAP opacity-only animation (no transform conflict with heroFloat keyframe)
- [x] Hairline rule 32px editorial accent

### Step 12: About Section [COMPLETE]
- [x] "THE / REFINED / REBELLION" DM Sans 800, ~10.5vw, rgba(255,255,255,0.20)
- [x] Liquid glass card (backdrop-filter blur 20px, rgba(255,255,255,0.03), 1px border)
- [x] ScrollTrigger scrub:1 (x:-80->0 left, y:20->0 stagger right, exit y:-32)
- [x] Dark radial mask on right (72% -> transparent) for legibility
- [x] aboutSectionState in sceneState.ts (active + sectionProgress)
- [x] Logo section-awareness blend (snaps to face-forward on About entry, slow drift)

### Step 13: Navigation [COMPLETE]
- [x] Fixed top bar, z-index 100, auto-hide on scroll-down / reveal on scroll-up
- [x] "House of An" center logo: CSS perspective rotateY coin-spin (2 full rotations across scroll)
- [x] SVG feTurbulence liquid glass distortion + chromatic aberration at oblique angles
- [x] Desktop: Shop/Collections left, About/Bag right
- [x] Mobile: center logo + bag icon + hamburger only
- [x] Full-screen overlay menu: staggered Cormorant link reveal + hairline underline draw-in + footer social line

### Step 14: Bestsellers Section [COMPLETE]
- [x] BestSellersCarousel.tsx: self-contained R3F Canvas (alpha:true, global bg shows through)
- [x] 5 cards on fixed camera-aligned ellipse (RADIUS 3.8, Z_FLATTEN 0.42 for coverflow depth)
- [x] Fixed-ellipse architecture: each card computes worldAngle = baseAngle + rotStateRef.angle per frame and positions itself (parent group does NOT rotate). Symmetrical spacing at all rotation angles.
- [x] Chrome RoundedBox frame (metalness 1, roughness 0.04, clearcoat 0.6) + inset PlaneGeometry image panel
- [x] CanvasTexture per card (400x600 luxury gradient + product number, no external URLs)
- [x] Per-card scale via cos(worldAngle): front=1.0, sides=~0.62, 0.08 lerp smoothing
- [x] Cards face outward (rotation.y = worldAngle, textured front faces camera)
- [x] Anti-gravity bob + subtle tilt per card in useFrame
- [x] Auto-rotation: AUTO_SPEED 0.0018 rad/frame, pauses on hover (hoverRef) and during GSAP tween (animatingRef)
- [x] GSAP rotState.angle accumulates continuously (sin/cos periodic -- no modulo jump)
- [x] BestSellersSection.tsx: no background overlay (transparent), circular chrome arrow buttons, dot indicators
- [x] Touch swipe (48px threshold), mobile detection, ScrollTrigger section awareness
- [x] bestsellersSectionState in sceneState.ts

### Step 15: Single-Scene Infinite Scroll Restructure [COMPLETE]
- [x] HeroSection height: 100vh -> 200vh (logo/spectacle on screen 2x longer)
- [x] Scroll chevron repositioned to `top: calc(100vh - 3rem)` (stays in first viewport)
- [x] Station-based scroll camera in SceneCanvas (piecewise, not linear):
  - Hero (sp 0-0.25): z 7->8.5, y 0.5->0.8
  - About (sp 0.25-0.38): z 8.5->10.5, y 0.8->1.6
  - Bestsellers (sp 0.38-0.50): z 10.5->12, y 1.6->2.0
  - Rest (sp 0.50-1.0): z 12->14, y 2.0->3.0
- [x] LiquidBlob opacity fade: transparent prop + opacity lerp(1.0, 0.05) at scroll 0.20->0.36
- [x] ParticleSpiral intensity taper: 1.0 at hero, 0.13 mist at content, restore 1.0 at 0.68
- [x] BackgroundPaths intensity taper: 1.0 at hero, 0.10 mist at content, restore 1.0 at 0.68
- [x] Placeholder sections: border lines removed, labels start opacity:0, ScrollTrigger slide-up entrance

### Step 16: Hero-to-About Scene Phase Transition [COMPLETE]
- [x] scenePhaseState added to sceneState.ts (heroIntensity, aboutIntensity, transitionBlend)
- [x] ScenePhaseDriver component in SceneCanvas: reads scroll progress, drives phase values
- [x] LiquidBlob/FloatingOrb/DecoElement attenuation via heroIntensity + transitionBlend
- [x] TransitionBridge: chrome torus + ring geometry, opacity pulsed by transitionBlend (positioned at z=3.5 between camera and logo)
- [x] AdaptiveSparkles + AdaptivePostFX: sparkle opacity and Bloom intensity modulated by heroIntensity
- [x] BackgroundPaths + ParticleSpiral opacity factor in heroIntensity
- [x] Phase thresholds tuned: aboutIntensity smoothstep(0.28, 0.48), bridge enter smoothstep(0.22, 0.30), exit smoothstep(0.42, 0.54)
- [x] AboutSection ScrollTrigger end extended to 'bottom 5%', exit animation pushed to timeline 0.88

### Step 17: BestSellers Refinements [COMPLETE]
- [x] Dark vignette/box div removed (no background overlay, global scene shows through)
- [x] Card facing fixed: rotation.y = baseAngle (outward, toward camera) instead of -baseAngle (inward)
- [x] Auto-rotation added: AUTO_SPEED 0.0018 rad/frame continuous drift
- [x] Hover-pause: hoverRef + animatingRef from BestSellersSection stop auto-rotation on hover or during GSAP tween
- [x] Fixed-ellipse card positioning: cards individually compute worldAngle and position themselves on a camera-aligned ellipse each frame (parent group does NOT rotate). Ensures symmetrical card spacing at all rotation angles.

### Step 18: BestSellers Polish + Cursor Redesign [COMPLETE]
- [x] Hover-to-stop rotation removed (onMouseEnter/onMouseLeave on section deleted)
- [x] AUTO_SPEED bumped 0.0018 -> 0.003 (faster continuous drift)
- [x] Arrow navigation buttons removed (ChevronLeft/ChevronRight SVGs + both <button> elements deleted)
- [x] Card hover glow: additive RoundedBox (2.75x3.85x0.01) behind each frame, opacity lerps 0->0.28 via glowIntensRef, AdditiveBlending, color #b0b0e0
- [x] Canvas pointerEvents set to 'auto' (enables R3F raycasting for hover + click)
- [x] Click-to-front: goToCard(index) in BestSellersSection -- shortest-path modular delta, gsap power3.inOut 1.0s, updates activeIndex + dots
- [x] onCardClick prop chain: BestSellersCarouselProps -> SceneProps -> CardProps -> onClick on frame RoundedBox
- [x] ChromeCursor redesigned: replaced circle cursor (inner dot + outer ring) with SVG arrow pointer
  - Dark #06060e fill + iridescent animated stroke (CSS keyframes: purple->red->amber->teal->blue, 4s loop)
  - cursor-glow drop-shadow keyframe on wrapper div pulses in sync
  - Velocity-based tilt: atan2(vy,vx)*0.14, clamped ±14 deg, lerp 0.08
  - 14-element glass drop trail: 9px backdrop-filter blur circles, spawn every 8px, fade ~0.025/frame
  - Keyframes injected as <style id="chrome-cursor-kf"> on mount, removed on unmount

### Steps 19-23: Not started
See ROADMAP.md -- Categories is next.

## Phase 3: Inner Pages [NOT STARTED]
## Phase 4: Polish and Launch [NOT STARTED]
