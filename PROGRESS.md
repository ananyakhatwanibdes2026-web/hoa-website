# HOUSE OF AN -- Progress Log

## Session: 2026-04-17 (Unified Aurora + Scroll-Gap Compression)

### Continuous Aurora Background [COMPLETE]
Goal: merge Campaign + Lookbook backgrounds so the aurora reads as one continuous atmosphere, and intensify it (user said prior version was "looking too less").

- [x] `app/components/sections/ContinuousAuroraCanvas.tsx` (NEW): shared `position:fixed` full-viewport Canvas2D that subscribes to BOTH `campaignSectionState` and `lookbookSectionState`. 4 desktop ribbons / 2 mobile, alpha 0.28-0.36, amp 0.11-0.15 (~70% boost over the old Lookbook-only aurora). `campaignAlpha = cAct ? smoothstep(0,0.10,cSp) : 0`; `lookbookEnter = cAct ? 1 : smoothstep(0,0.08,lSp)` (instant enter when campaign already feeds canvas); `lookbookExit = 1 - smoothstep(0.70,0.92,lSp)`; `alpha = max(campaignAlpha, lookbookAlpha)`. Phase driver stitches lookbook onto campaign (`lAct ? 1+lSp : cAct ? cSp : 0`) so ribbons keep evolving across the seam -- no visible reset at the boundary. Secondary `position:fixed` floor div rises to pure `#000` at lookbook exit for TestimonialsFooter handoff (peak `rgba(15,32,80,0.50)`). RAF gated by either section active; dpr cap [1,1.5]; reduced-motion renders a single static frame.
- [x] `app/components/sections/CampaignMonolithBg.tsx` + `LookbookAuroraCanvas.tsx` DELETED.
- [x] `app/components/sections/CampaignSection.tsx`: removed `CampaignMonolithBg` import + mount, removed the inline atmospheric radial-gradient glow div. Section is now purely heading + card stack over the shared aurora.
- [x] `app/components/sections/LookbookSection.tsx`: removed `LookbookAuroraCanvas` import + mount. `.lookbook-visual` `background-color:transparent`.
- [x] `app/routes/_index.tsx`: lazy import + mount `<ContinuousAuroraCanvas />` once, positioned just before the Campaign wrapper so it's in-DOM before either section activates.

### Campaign-over-Why Overlap Fix [COMPLETE]
User reported Campaign bleeding into Why's final frame.

- [x] `_index.tsx`: Campaign wrapper `margin:'-60vh -1rem 0'` → `margin:'0 -1rem'` (no negative top). Campaign no longer encroaches on Why's pin-release zone.

### Campaign Card1 Early-Exit Fix [COMPLETE]
User reported Campaign's first card scrolling up before the section was reached.

- [x] `CampaignSection.tsx`: timeline reworked from 3 units → 3.2 units. Added t=0.4→1.2 HOLD before card1 exit so user dwells on card1 after intro before motion begins. Card1 exit now at t=1.2→1.8 (~37% section scroll, was ~20%). Card2 exit + Card3 rise at t=1.8→2.4. Final HOLD t=2.4→3.2 on card3. Intro durations tightened (heading 0.28, stack 0.35).

### Scroll-Gap Compression [COMPLETE]
User: "lessen the scroll time between categories & why, campaign & lookbook".

- [x] `_index.tsx`: Why wrapper `margin:'-60vh -1rem 0'` → `'-120vh -1rem 0'`. Lookbook wrapper same change. Each transition is now ~60vh shorter. The 120vh overlap consumes nearly the full pin-release zone (last 100vh) of the preceding section; later wrapper's own `position:relative; zIndex:1` + sticky inner takes visual priority during the ~20vh two-pinned-inners moment.
- [x] Plan file: `/Users/boomshine/.claude/plans/bubbly-spinning-adleman.md`.

### Lookbook Animating Before Reached [COMPLETE]
After compression, the Lookbook carousel started scrubbing while Campaign was still pinned.

- [x] `LookbookSection.tsx`: split into two ScrollTriggers. `stateST` (state + envelope) stays at `'top top → bottom bottom'` so aurora still gets full section progress. `animST` (carousel scrub) moved to `start:'top+=120vh top', end:'bottom bottom', scrub:0.08` -- carousel motion starts only after the 120vh Campaign overlap window clears.

### Smoother Campaign↔Lookbook Transition [COMPLETE]
User: "make transition smoother between categories and lookbook section" (actual pair was Campaign↔Lookbook — confirmed via visual seam).

- [x] `CampaignSection.tsx`: envelope `smoothstep(0,0.06,sp)*(1-smoothstep(0.95,1,sp))` → `smoothstep(0,0.08,sp)*(1-smoothstep(0.85,1,sp))`. Exit ramp widened so Campaign dissolves over ~75vh instead of ~25vh.
- [x] `LookbookSection.tsx`: envelope `smoothstep(0,0.08,sp)*(1-smoothstep(0.94,1,sp))` → `smoothstep(0.20,0.34,sp)*(1-smoothstep(0.88,1,sp))`. Enter ramp delayed + broadened so Lookbook only becomes visible as Campaign finishes dissolving, and both fades overlap through the 120vh shared window.

### Docs Synced [COMPLETE]
- [x] CLAUDE.md: "Scroll-reactive section backgrounds" bullet rewritten; CampaignSection.tsx, LookbookSection.tsx, `_index.tsx` entries updated; CampaignMonolithBg + LookbookAuroraCanvas entries replaced with single ContinuousAuroraCanvas entry.
- [x] PROGRESS.md: this entry.
- [x] ROADMAP.md + TODO.md: updated.

---

## Session: 2026-04-14 (AT UI Chrome)

### Active Theory UI Chrome [COMPLETE]
Root cause of previous session failure: 6 AT components were spec'd but never created. This session built and wired all of them.

- [x] `app/styles/global-effects.css`: 8 new AT tokens added to :root (--at-glass-bg, --at-glass-border, --at-glass-blur, --at-radius-pill, --at-text-accent, --at-text-glow, --at-ease-out, --at-particle-dim). Mobile responsive CSS added for .nav-desktop-pills, .at-side-rail, .at-ambient-ticker, .at-corner-ticker.
- [x] `app/components/global/Navigation.tsx`: Redesigned as split glass pills. Left pill (Shop/Collections), center wordmark "House of An" (Cormorant Garamond 300, letterSpacing 0.38em), right pill (About/Bag). Glass treatment: rgba(0,0,0,0.55) bg + blur(12px) + 1px rgba(255,255,255,0.14) border + border-radius 500px. Outer nav bar transparent (was applying glass to entire bar). nav-desktop-pills class hides on mobile.
- [x] `app/components/global/SideRail.tsx` (NEW): Fixed left 24px, top 50%, z-index 90. 4 links: Bestsellers, Collections, Lookbook, About. DM Sans 0.52rem, letter-spacing 0.26em, uppercase, color var(--at-accent-bright). Opacity 0.5 default, 1 on hover + translateX(7px). Lenis scrollTo on click, scrollIntoView fallback. Home route only (useLocation check). Hidden on mobile via .at-side-rail CSS class.
- [x] `app/routes/_index.tsx`: Anchor IDs added -- section-about (AboutSection wrapper), section-bestsellers (BestSellers wrapper), section-categories (Categories wrapper), section-lookbook (Lookbook wrapper).
- [x] `app/components/global/AmbientTicker.tsx` (NEW): position:fixed bottom-left, mix-blend-mode:color-dodge, pointer-events:none. 5 brand lines (Contemporary Luxury / Recycled Silver / Made in India / Est. 2024 / House of An). Active line cycles every 4.5s with 0.5s fade. Inactive lines at opacity:0.18. DM Sans 0.55rem, letter-spacing 0.30em, uppercase, rgba(140,170,255,0.88). Mask gradient to top for natural fade. Hidden on mobile.
- [x] `app/components/global/CornerTicker.tsx` (NEW): position:fixed bottom-right, mix-blend-mode:color-dodge, pointer-events:none. Marquee: "RECYCLED SILVER -- MADE IN MUMBAI -- READY TO SHIP -- EST. 2024 -- HOUSE OF AN". 22s linear infinite. Text repeated twice for seamless loop. Mask gradient fades left edge. Hidden on mobile.
- [x] `app/components/global/RouteTransition.tsx` (NEW): position:fixed inset:0, z-index:200, black #000000 overlay. useNavigation() from react-router drives opacity: 0.25s ease-in on loading, 0.45s ease-out on idle. Eliminates white flash on route change. SceneCanvas stays mounted (lives in root.tsx Layout).
- [x] `app/components/global/ParticleField.tsx` (NEW): THREE.Points, 12k desktop / 2.5k mobile, positions in 42x42x32 unit box. color #8ab0e8, size 0.045, sizeAttenuation, AdditiveBlending, depthWrite:false. Self-contained scrollRef + getScrollP() (same cachedHeight pattern as SceneCanvas). Fades out as scroll passes 22% (intensity = max(0, 1 - sp*4.5)). Max opacity 0.20.
- [x] `app/components/global/SceneCanvas.tsx`: Imported ParticleField. Mounted in Scene() outside <Select> (not bloom-processed), gated by !heroGone: `{!heroGone && <ParticleField />}`.
- [x] `app/root.tsx`: All 4 new components imported (SideRail, AmbientTicker, CornerTicker, RouteTransition) and rendered in Layout body in correct order: RouteTransition (z-200) > GlobalEffects > Navigation > SideRail > AmbientTicker > CornerTicker > SceneCanvas.
- [x] Build verified: `npm run build` clean, no SSR errors, 1.92s.

---

## Session: 2026-04-11 (Active Theory Re-Theme)

### AT Visual Re-Theme [COMPLETE]
- [x] Studied activetheory.net reference (activetheory.md): black base, blue/periwinkle accents, no warm gold/silver
- [x] `app/styles/global-effects.css`: --bg-primary #484858 -> #000000; body bg -> #000000; added --at-accent, --at-accent-bright, --at-blue-steel, --at-blue-silver tokens
- [x] `app/components/global/BackgroundJourney.tsx`: COLOR_STOPS rewritten. Start: #000000 (was #484858). 50%: #080e1a (was #1c1c24). 68%: #1a2840 (was #383848). 82%+: #8ab0d0 cool-blue-silver (was #bebec0 warm silver). Text flip preserved at 82%.
- [x] `app/components/global/SceneCanvas.tsx`: Fog initial #000000 (was #141820). Fog lerp branches updated to match new stops. Logo chrome: color #9098b0 (was #a8a8a8), emissive #5870a0 (was #a09890). Left lightformer: #b0ccff (was #ddd4ff). Front fill: #c0ccf0 (was #ccc8d8). Sapphire intensity: 3.5 (was 2.5).
- [x] `app/components/sections/CategoriesSection.tsx`: Conic sweep + glow + hover all changed from warm gold (rgba(255,228,165)) to blue/periwinkle (rgba(96,128,224) / rgba(156,165,255)). Canvas network bg shifted blue-dark (#1a2038->#060c18). Network lines rgba(130,168,240).
- [x] `app/components/sections/LookbookSection.tsx`: Frame border rgba(140,168,255,0.18) (was warm white). Conic sweep blue-periwinkle (was gold). Breathe glow rgba(80,120,220) (was gold). Initial bg #06122a, GSAP tween #06122a->#02040f (was #b8bcc4->#04091a).
- [x] `app/components/sections/WhySection.tsx`: blackBgRef gradient #08101e->#5a80aa (was warm silver #1c1c22->#b0b0b8). Floor glow rgba(120,160,255) (was white).
- [x] `app/components/sections/BestSellersSection.tsx`: Wipe gradient #0e1828->#8aaccc navy-to-blue-steel (was #1c1c28->#d4d4dc silver). Eyebrow rgba(140,170,240,0.65). Active dot rgba(140,170,240,0.88).
- [x] `app/components/sections/TestimonialsFooterSection.tsx`: Section bg #8ab0d0->#1e3460 (was silver #b8bac6->#263d6a). Seamlessly joins BackgroundJourney 82% stop. Heading rgba(10,18,42,0.94).
- [x] CLAUDE.md, TODO.md, ROADMAP.md, PROGRESS.md all updated with new color values

### Image Placement [INCOMPLETE -- INTERRUPTED]
- [ ] Test images from house-of-an-1 (Desktop) need to be placed: lookbook-labeled -> LookbookSection 6 slots, campaign-labeled -> CampaignSection 3 card slots, rest -> other image slots. No repeats.

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

### Step 19: Visual Polish (Sparkles, Color, Logo Dimming) [COMPLETE]
- [x] AdaptiveSparkles: count 25->8 desktop / 10->3 mobile, size 1.2->0.35, opacity 0.3->0.07
- [x] ParticleSpiral: count 4500->600 desktop / 1500->200 mobile, size 0.06->0.02, opacity 0.55->0.08
- [x] EntrancePreloader Stars: count 1500->400 / 500->150, Sparkles: 40->12 / 20->5
- [x] Background color: #0f0a1e purple -> #0a0e1a blackish-blue (BackgroundJourney, global-effects.css, body, BestSellersCarousel palette)
- [x] Logo dimmed: color #c8c8c8->#a8a8a8, envMapIntensity 2.5->1.2, roughness 0.05->0.18, clearcoat 0.3->0.2
- [x] Lightformer overhead: intensity 5->3.5, breathing range +/-0.5 -> +/-0.3
- [x] Bloom: luminanceThreshold 0.4->0.7, luminanceSmoothing 0.9->0.6, radius 0.8->0.6, intensity 0.5->0.15 desktop / 0.3->0.10 mobile

### Step 20: About Section Redesign [COMPLETE]
- [x] Sequential word reveal: "THE", "REFINED", "REBELLION" appear one-by-one on scroll (GSAP timeline positions 0.0, 0.15, 0.30)
- [x] Tagline highlight: rgba(255,255,255,0.20) -> 0.55, added 3-layer bluish-black textShadow glow
- [x] Glass card removed: no backdrop-filter box, right-side text presented cleanly
- [x] "Founded in 2012..." text appears with first word ("THE"), not after last word

### Step 21: Bestsellers Scroll-Driven Rotation [COMPLETE]
- [x] Auto-rotation removed (AUTO_SPEED constant and useFrame auto-rotate block deleted)
- [x] ScrollTrigger added to BestSellersSection: trigger section, start:'top top', end:'bottom bottom', scrub:1
- [x] Scroll maps to rotStateRef.angle, cards rotate 1-2-3-4-5 sequentially on scroll
- [x] Section height: 100vh -> 300vh with position:sticky inner wrapper (100vh)
- [x] Card dimensions tuned: frame 2.8x4.0, glow 2.95x4.15, image 2.56x3.76, texture 440x660
- [x] _index.tsx BestSellers fallback height: 100vh -> 300vh

### Step 22: Categories Rewrite [COMPLETE]
- [x] Removed pinned horizontal-slide panels (600vh outer, sticky inner, translateX wipes, progress dots)
- [x] Replaced with vertical stacked cards in normal document flow
- [x] Scrub-based entrance: text from x:-60, image from x:+60 (ScrollTrigger scrub:1)
- [x] Image parallax: y:30 to y:-30 across card scroll range
- [x] Number parallax: y:20 to y:-20 for depth effect
- [x] Chrome divider elements between cards (gradient 1px line, scaleX:0->1 on scroll)
- [x] "COLLECTIONS" header at top with fade-in
- [x] Flush edges: gap 0, padding 0, border-radius 0

### Step 23: Background Elements Spread [COMPLETE]
- [x] BackgroundPaths: xBias widened from +-5/10 to +-8/16, amplitude 10-19, spanY 40-52 (corner-to-corner coverage)
- [x] BackgroundPaths mouse range: mouseLerp.x * 14 -> * 20
- [x] ParticleSpiral: MIN_RADIUS 3->5, MAX_RADIUS 18->26, CLEAR_RADIUS 3.5->5.0
- [x] ParticleSpiral mouse range: mouseLerp.x * 16 -> * 22

### Step 24: Side Edge Blobs [COMPLETE]
- [x] 6 new liquid metal blobs added to BLOB_CONFIGS (3 left at x=-9.5/-10/-11, 3 right at x=+9.5/+10/+11)
- [x] Side blobs at z=-1 to -3 (close to camera for correct horizontal fov placement)
- [x] Scale 0.7-0.9 (smaller than center blobs, appear ambient)
- [x] Mobile slicing: 2 center + 1 left + 1 right = 4 total
- [x] Key lesson: fov=75 is vertical, horizontal edge at 16:9 is ~1.37x distance, so x=+-9.5/11 needed (not +-6/7)

### Step 25: Cursor Redesign [COMPLETE]
- [x] ChromeCursor rewritten: dot (7px) + lagging ring (28px, lerp 0.11) design
- [x] Ring scales 1.65x on hover over interactive elements via CSS transition
- [x] 6-dot silver trail (3px, spawn every 12px, decay 0.038/frame)
- [x] No RGB keyframes, no velocity tilt (clean, minimal)

### Step 26: The Why Section [COMPLETE]
- [x] WhySection.tsx built: two-column editorial layout
  - Left: "WHY / HOUSE OF / AN ?" stacked heading (Cormorant Garamond 700, clamp 3.2-7rem, white glow textShadow 3-layer)
  - Right: "Founded in 2024" label + hairline divider + 2 body paragraphs (DM Sans 300, uppercase, 0.55 opacity)
  - GSAP scrub: left from x:-80, right from x:+80 (start:'top 85%', end:'top 25%', scrub:1, stagger 0.06)
  - Mobile: column layout, centered text, 6vh gap
- [x] whySectionState added to sceneState.ts ({active, sectionProgress}), updated via ScrollTrigger in WhySection
- [x] latePageFade added to scenePhaseState in sceneState.ts
  - ScenePhaseDriver drives latePageFade via smoothstep(0.58, 0.68) on scroll progress
  - LogoModel: material opacity lerps to 0, rotation slows to stop as latePageFade rises
  - BackgroundPaths + ParticleSpiral: opacity multiplied by (1 - latePageFade)
  - Clears global 3D spectacle before the Why section for text legibility
- [x] WhyStillLogo.tsx created (local R3F Canvas with still AN_Logo.glb)
  - Separate from global SceneCanvas: no scroll rotation, breathing scale only (sin(t*0.35)*0.015)
  - Own Environment + Lightformers (overhead 2.8, left lavender 1.2, right neutral 1.4)
  - Chrome material: color #c4c4d4, metalness 1.0, roughness 0.14, envMapIntensity 1.35
  - Letter meshes spread apart (x+-0.28) for visual openness
  - NOT YET WIRED IN: component exists but not imported/rendered in WhySection or _index.tsx
- [x] _index.tsx updated: WhySection rendered after Categories in separate wrapper div
- [x] "THE WHY" removed from PLACEHOLDER_SECTIONS (now only CAMPAIGN, LOOKBOOK, TESTIMONIALS + FOOTER)
- [x] CategoriesSection decoupled from categoriesSectionState (import removed from component)

### Step 27: Campaign Section [COMPLETE]
- [x] CampaignSection.tsx built: 3-card physical-photo stack, CSS sticky pinning (600vh outer / 100vh sticky inner)
- [x] Card 1 (top, light grey #e8e8e8, 0deg): "-- 01" eyebrow + "Campaign 01" Cormorant Garamond title bottom-left
- [x] Card 2 (middle, dark slate blue #1e2d3d): +2.5deg rotation, +10px right offset
- [x] Card 3 (bottom, cream #f5f0e8): -2deg rotation, -8px left offset
- [x] GSAP timeline (paused:true, 4 units): Card 1 flies upper-left (-130%x, -90%y, -28deg), Card 2 flies upper-right (+130%x, +22deg), Card 3 settles straight
- [x] 0.5-unit pauses between steps (+=0.5) so each card fully exits before next starts (~125vh per card peel)
- [x] ScrollTrigger: trigger section, start:'top top', end:'bottom bottom', scrub:1, animation:tl
- [x] campaignSectionState added to sceneState.ts ({active, sectionProgress})
- [x] Top-level gsap import (same pattern as BestSellersSection, NOT dynamic Promise.all)
- [x] _index.tsx: lazy import + ClientOnly + Suspense (600vh fallback), CAMPAIGN removed from PLACEHOLDER_SECTIONS

### Step 28: Lookbook Section [COMPLETE]
- [x] LookbookSection.tsx built: horizontal focal gallery, CSS sticky pinning (700vh outer / 100vh sticky inner)
- [x] Left column (flex 32%): "The Collection" eyebrow (DM Sans, 0.35em tracking) + "SO PORTABLE, it's wearable" heading (Cormorant Garamond 700, italic, clamp 2.8-5rem)
- [x] Right gallery (flex 68%): overflow:hidden clips horizontal track as it translates
- [x] 6 image slots (flex: 0 0 clamp(300px, 48vw, 640px), height clamp(360px, 68vh, 540px)) with placeholder warm-tone backgrounds
- [x] Focal effect: active image scale:1 opacity:1, inactive scale:0.65 opacity:0.35. Transitions driven by GSAP timeline.
- [x] DOM-measured initialX: galleryW/2 - slotW/2 (centres image 0 in gallery area on mount)
- [x] GSAP timeline (paused:true, 5 units): track slides left (ease:none, duration:5) + per-transition scale/opacity pairs (ease:none, duration:1, timed at i)
- [x] ScrollTrigger: scrub:1, animation:tl, start:'top top', end:'bottom bottom'. 600vh scrub / 5 units = 120vh per image.
- [x] "Scroll to continue" hint: position:absolute, bottom:32px, centered, DM Sans 10px
- [x] Section has own opaque background (linear-gradient dark brown #1a120a -> #0d0906) -- overrides global color journey
- [x] lookbookSectionState added to sceneState.ts ({active, sectionProgress})
- [x] _index.tsx: lazy import + ClientOnly + Suspense (700vh fallback), LOOKBOOK removed from PLACEHOLDER_SECTIONS

### Step 29: Testimonials + Footer Section [COMPLETE]
- [x] TestimonialsFooterSection.tsx built: combined testimonials grid + MISHO-style footer in single section
- [x] Testimonials zone: chrome radial-gradient background (#2a2a3a -> #0a0e1a), "WHAT THEY SAY" title (Cormorant Garamond 300, 0.3em tracking)
- [x] Responsive testimonial grid: 1 col mobile, 2 col md, 3 col lg
- [x] TestimonialCard.tsx: polaroid-style cards with random tilt (+-2 to +-5 deg), white border (20px sides, 24px bottom for author), subtle grain texture
- [x] Card hover: scale(1.08) translateY(-8px) 0.35s cubic-bezier(0.23,1,0.32,1), box-shadow deepens rgba(0,0,0,0.4) 0 25px 50px
- [x] Quote text: Cormorant Garamond italic. Author: DM Sans 600. Role: DM Sans 300, rgba(0,0,0,0.5)
- [x] GSAP stagger entrance: y:60 opacity:0 -> y:0 opacity:1, stagger 0.12, ScrollTrigger scrub:1
- [x] 6 placeholder testimonials (real quotes from client TBD)
- [x] FooterBlock.tsx: reusable column component (title, links array, children for custom content)
- [x] Footer: MISHO-style 5-column grid (About+socials, Shop, Support, Explore, Newsletter)
- [x] Social icons: Instagram, Twitter/X, Pinterest, LinkedIn (inline SVG paths)
- [x] Newsletter: email input + chrome gradient submit button (linear-gradient #666->#999)
- [x] Ghost AN watermark: Cormorant Garamond 15vw, opacity 0.03, centered behind footer
- [x] Two decorative SVG arc lines (200px tall, stroke rgba(255,255,255,0.06))
- [x] Footer bottom bar: copyright + "Designed by House of An" + payment icons placeholder
- [x] testimonialsSectionState added to sceneState.ts ({active, sectionProgress})
- [x] _index.tsx: lazy import + ClientOnly + Suspense (120vh fallback), PLACEHOLDER_SECTIONS removed entirely

### Step 30: Visual Tuning Pass [COMPLETE]
- [x] latePageFade thresholds shifted: smoothstep(0.55, 0.64) -> smoothstep(0.24, 0.30) in ScenePhaseDriver (SceneCanvas.tsx)
- [x] latePageFade lerp damping: 0.10 -> 0.15 for faster convergence
- [x] Purpose: global 3D elements (AN_Logo, liquid blobs, floating orbs) now fade out right after Bestsellers, before Categories section begins
- [x] Threshold derived from page structure analysis: total ~2500vh, Bestsellers ends at sp ~0.26
- [x] Bestseller carousel cards scaled 1.3x: frame 2.8x4.0 -> 3.64x5.2, image 2.56x3.76 -> 3.33x4.89, glow 2.95x4.15 -> 3.84x5.4
- [x] Carousel RADIUS: 3.8 -> 4.5 (breathing room for larger cards)
- [x] Corner radii updated: frame 0.10 -> 0.13, glow 0.12 -> 0.16
- [x] About-to-Bestsellers spacer: 125vh empty div in _index.tsx (placeholder for future transition element)
- [x] AN Logo rotation speed doubled: smoothSp * Math.PI * 16 -> smoothSp * Math.PI * 32

### Step 31: Scroll Transitions + Logo Fade Tuning [COMPLETE]
- [x] BestSellers background wipe: Active Theory-style bottom-to-top clip-path reveal. position:fixed div with dark radial gradient, driven by GSAP ScrollTrigger scrub:0.4
- [x] Wipe starts at 'top bottom+=13%', ends at 'top 20%' (headroom above "BESTSELLERS" heading)
- [x] Second ScrollTrigger manages display:none toggling for the fixed wipe div
- [x] TransitionBridge REMOVED from SceneCanvas (chrome torus/ring that pulsed mid-scroll)
- [x] logoFade added to scenePhaseState: driven by aboutSectionState.sectionProgress
- [x] Logo fade formula: clamp01((sectionProgress - 0.45) / 0.35) -- starts fading after "REBELLION" appears, fully gone before About exit
- [x] AN_Logo reads logoFade for opacity (1 - logoFade) and rotation slowdown (1 - logoFade * 0.97)
- [x] Logo rotation speed doubled again: smoothSp * Math.PI * 64 (4x from original 16)
- [x] About-to-Bestsellers spacer reduced: 125vh -> 63vh in _index.tsx
- [x] BestSellers wipe ScrollTrigger start adjusted: 'top bottom+=25%' -> 'top bottom+=13%' to match halved spacer

### Step 32: Bestsellers Visual Polish [COMPLETE]
- [x] About-to-Bestsellers spacer reduced: 63vh -> 31.5vh in _index.tsx
- [x] BestSellers wipe gradient updated: dark navy radial-gradient -> premium silver (`radial-gradient(ellipse at 50% 30%, #d4d4dc, #a8a8b4, #78788a, #3a3a48)`)
- [x] CenterSpiral component added to BestSellersCarousel.tsx
  - Loads Spiral.glb via useGLTF with '/draco/' decoder
  - Silver chrome MeshPhysicalMaterial (color #d8d8e0, metalness 0.82, roughness 0.15, envMapIntensity 5.0, clearcoat 0.8)
  - Position [0, -0.5, 0], scale [1.2, 3.5, 1.2] (slim XZ, tall Y)
  - Slow Y-axis rotation (0.002 rad/frame) + subtle sine bob around base Y (-0.5)
- [x] Two pointLights added at [5,5,5] and [-5,-5,5] (intensity 3) for studio-style highlights on chrome
- [x] Carousel Environment boosted: resolution 128 -> 256, 5 Lightformers (overhead 8 wide, left/right 4, bottom 3, front fill 5 wide)
- [x] CenterSpiral scale/position tuning: useFrame position.y bug fixed (was overwriting base position with absolute sin value oscillating around 0 instead of -0.5), non-uniform scale [1.2, 3.5, 1.2] preserves spiral shape while filling viewport

### Step 33: Bloom Removal + Chrome Material Polish [COMPLETE]
- [x] Bloom post-processing DISABLED: intensity zeroed in both useFrame (bloomRef.current.intensity = 0) and JSX (intensity={0})
- [x] EffectComposer upgraded: added multisampling={4} for smoother geometry edges
- [x] Bloom algorithm: added mipmapBlur for optically smooth blur (in case bloom is re-enabled later)
- [x] Bloom thresholds tightened: luminanceThreshold 0.7 -> 0.98, luminanceSmoothing 0.6 -> 0.02
- [x] AdaptivePostFX useFrame simplified: removed heroIntensity/latePageFade computation, just sets intensity=0
- [x] AN_Logo chrome material polished: roughness 0.18 -> 0.12, clearcoatRoughness 0.1 -> 0.06 (sharper reflections without bloom glow)

### Session 2026-04-04: UI Polish + Heading Interaction System [COMPLETE]

- [x] **Categories background color** changed from blue-tinted `#0a0e17 / #050b14` to smoked titanium `#18181b / #09090b` (sticky wrapper + each panel bg)
- [x] **Inner border overlay** added to all 3 category panels: `absolute inset-0 border-[1.5px] border-white/10 rounded-2xl z-10`, hover brightens to `border-white/50` with `shadow-[inset_0_0_40px_rgba(0,0,0,0.6)]`. Panels have `className="group"` (Tailwind group-hover pattern)
- [x] **"HOUSE OF AN COLLECTIONS" heading** added above accordion: DM Sans eyebrow "House of An" + Cormorant Garamond weight 200 "Collections" + hairline rule. Accordion height reduced 80vh -> 74vh to fit.
- [x] **"LOOKBOOK" heading** added above campaign card stack: eyebrow "The Visual" + Cormorant Garamond weight 200. CSS hover: letter-spacing 0.38em -> 0.52em, eyebrow brightens, hairline rule grows 0 -> 44px
- [x] **Unified interactive heading system** across 5 sections:
  - Tier 1 (character wave): BESTSELLERS, COLLECTIONS, LOOKBOOK -- each letter wrapped in `<span>` with staggered `transition-delay: i*35ms`, `translateY(-5px)` on hover, spring easing `cubic-bezier(0.34,1.56,0.64,1)`. Eyebrow tracking expands. Hairline rule sweeps to 44px.
  - Tier 2 (glow + tracking): WHY HOUSE OF AN, SO PORTABLE -- letter-spacing expands, text-shadow intensifies, color lifts, hairline rule reveals. GSAP refs preserved (no character splitting).
- [x] **BESTSELLERS** header: `pointerEvents: 'none'` removed so hover works. `<style>` block with `.bs-hdg-wrap` / `.bs-ch` / `.bs-rule` / `.bs-eyebrow`. Character split via `'BESTSELLERS'.split('').map(...)`.
- [x] **COLLECTIONS** heading: refactored from full inline styles to CSS classes `.cat-hdg-wrap` / `.cat-ch` / `.cat-rule`. Character split for "COLLECTIONS".
- [x] **WhySection** text colors changed from white to warm dark (`#1c1914`, `rgba(28,25,20,0.65)`) for readability on pearl light background. Hover adds tracking + glow + `.why-hdg-rule` hairline.
- [x] **SO PORTABLE** heading: `.lookbook-left:hover` triggers glow intensification, eyebrow brightens + tracking expands, `.lookbook-rule` hairline reveals.
- [x] **Background journey -- Why + Campaign split**:
  - `_index.tsx`: Why and Campaign merged into one wrapper (`lightSectionsRef`) with two absolute overlay divs (pearl + titanium). Then refactored again into two separate wrappers (`whyWrapperRef` + `campaignWrapperRef`) after bug where titanium overlay covered both sections.
  - Pearl bg (`#FCFBF8 -> #F3F1EC -> #E8E6DF`): fades in as Why enters viewport (`top 75%` -> `top 15%`, scrub 1.5)
  - Titanium bg (`#18181B -> #27272A`): fades in as Campaign enters (`top 80%` -> `top 20%`, scrub 1). Scoped to campaignWrapper so it never bleeds into Why section.

### Step 34: Categories Section Full Rebuild -- Expanding Accordion [COMPLETE]
- [x] CenterSpiral removed from BestSellersCarousel (Spiral.glb, useGLTF.preload, CenterSpiral component, <CenterSpiral /> in scene all deleted)
- [x] BestSellers pagination dots repositioned: `bottom: '4%'` -> `bottom: '20%'` (closes visual gap between spiral base and dots)
- [x] CategoriesSection.tsx completely rebuilt from vertical stacked cards to a horizontal expanding accordion
- [x] Outer section: 300vh height (same as Bestsellers sticky pattern)
- [x] Sticky wrapper: 100vh, dark gradient background (`#0a0e17 -> #050b14`), `display:flex; alignItems:center; justifyContent:center`
- [x] Inner accordion frame: `80vw`, `max-width:1200px`, `80vh`, `borderRadius:24px`, glass aesthetic: `background:rgba(255,255,255,0.05)`, `border:1px solid rgba(255,255,255,0.10)`, `backdropFilter:blur(12px)`, deep box-shadow. `gap:16px`, `padding:16px`
- [x] 3 panels: each `borderRadius:16px`, `border:1px solid rgba(255,255,255,0.15)`, `background:#0a0e17`, `overflow:hidden`. No shared border-left -- each card is a distinct floating element
- [x] Width constants: `WIDE='60%'`, `NARROW='15%'`
- [x] GSAP timeline (paused:true, 2 units): Step 1 (t=0-1) Panel 0 collapses 60->15%, Panel 1 expands 15->60%; Step 2 (t=1-2) Panel 1 collapses, Panel 2 expands. ScrollTrigger scrub:1, start:'top top', end:'bottom bottom'
- [x] Text per panel: expanded text block (num, name, tagline, CTA link) fades opacity 0->1 when panel activates, vertical rotated label fades in for collapsed panels
- [x] Panel images: absolutely positioned, `top:50%; left:50%; transform:translate(-50%,-50%) scale(0.82)`, `height:100%`, `width:45vw`, `maxWidth:800px`, `objectFit:cover`. `scale(0.82)` zooms out so full ear + product visible without letterboxing
- [x] _index.tsx fallback height: 260vh -> 300vh

### Session 2026-04-04 Part 2: About Section Restyle + Background Continuity [COMPLETE]

- [x] **About font** changed to Bebas Neue 400 (letterSpacing: 0.04em). Replaced DM Sans 800. Bebas Neue + Nunito added to Google Fonts URL in `root.tsx`.
- [x] **About text color** changed to `#ffffff` (was `rgba(255,255,255,0.55)`).
- [x] **About textShadow** changed to white bloom glow: `0 0 20px rgba(255,255,255,0.8), 0 0 40px rgba(255,255,255,0.5), 0 0 80px rgba(255,255,255,0.2)` (was blue-tinted glow).
- [x] **About black background overlay** (`blackBgRef`): `position:absolute; inset:0; z-index:-1; background:#000; opacity:0`. GSAP ScrollTrigger fades it in as section enters: `trigger=section, start='top 90%', end='top 25%', scrub:1`. Fires just before "THE" appears.
- [x] **About floor glow**: `position:absolute; bottom:0; height:300px`. 4-stop gradient `rgba(255,255,255,0.14 -> 0.07 -> 0.025 -> transparent)`. NO `filter:blur` -- removed because blur filter creates GPU compositing layer that caused dark glitch patch under REBELLION text when combined with GSAP opacity animation on adjacent div.
- [x] **31.5vh spacer** (About->Bestsellers) given `background: '#000000'`.
- [x] **BestSellersSection `<section>` element** given `background: '#000000'` (was transparent, showed `#0a0e1a` SceneCanvas through it before the fixed silver wipe covered the viewport).

**Debugging notes from this session:**
- Original trigger for black bg was `wordsRef.current[2]` (REBELLION DOM position) -- fired too late, transition started mid-section. Fixed to use `section` as trigger.
- `filter:blur(48px)` on floor glow div caused a dark artifact/glow patch under REBELLION text. Root cause: blur filter forces browser to create a separate GPU compositing layer; this interacted with the adjacent GSAP opacity animation on `blackBgRef` causing visual glitch. Fix: removed blur, used multi-stop gradient instead.

**STILL PENDING -- About->Bestsellers gap:**
- BestSellers wipe `start: 'top bottom+=13%'` was tuned for old 63vh spacer. With 31.5vh spacer, wipe only fires 18.5vh into the spacer and is 14% done when Bestsellers section enters viewport.
- Fix needed: in `BestSellersSection.tsx` useEffect ~line 180, change `start: 'top bottom+=13%'` to `start: 'top bottom+=31.5%'` to fire at spacer start. Also update visTrigger start to match. Alternatively remove the spacer entirely.

## Phase 3: Inner Pages [NOT STARTED]
## Phase 4: Polish and Launch [NOT STARTED]
