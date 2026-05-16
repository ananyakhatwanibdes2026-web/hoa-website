# HOUSE OF AN -- Roadmap

## Surface Polish + Inner-Page Foundation (2026-04-25) [COMPLETE]
- Footer reduced to minimal block (brand + 3 socials + copyright + 3 policy links).
- Testimonial cards now hover-reveal text (cards read clean at idle).
- Lookbook left side asymmetric stride — two past images visible during focal window.
- Spiral material immune to sapphire env reflections (pure silver).
- **Route gating**: home-only globals (`SceneCanvas`, `GlobalEffects`, `AmbientTicker`, `CornerTicker`) now guarded by `useLocation()` in `root.tsx`. Inner pages (`/collections/*`, `/products/*`) render clean.
- `.collection` page given dedicated styling. PDP styling still pending (route gate already applies).
- Still chrome AN logos (About + Why) animated with pointer parallax + vertical bob + envMap shimmer for ambient interactivity.
- `framer-motion` added to dep tree; `EdgeScrollGallery` component scaffolded for future Edge collection scroll experience (not yet wired in).

## Visual System Pass (2026-04-22) [COMPLETE]
- Motion direction unified bottom→up across scroll reveals, route transitions, and overlays (Lookbook carousel + Aside drawers explicitly out of scope).
- Palette shifted from blue-dominant to near-black + faint slate tint; UI accent periwinkle preserved for interactive chrome.
- Shared motion tokens live in `app/lib/motion.ts` — new sections should import rather than redeclare.

## Phase 1: Foundation [COMPLETE]
Store setup, Hydrogen scaffolding, dependencies, 3D asset conversion.

## Phase 2: Homepage Animations [IN PROGRESS]

### Build Order:
1. ~~Global setup layer~~ DONE
2. ~~Entrance preloader (gate tunnel fly-through with fog bridge)~~ DONE
3. ~~Single-flow 3D scroll architecture (SceneCanvas + hero overlay)~~ DONE
4. ~~Global liquid metal background (blobs, Bloom, SceneCanvas in root.tsx)~~ DONE
5. ~~Premium brand polish (click-to-enter, god rays, glassmorphism, fluid cursor, heartbeat pulse, scroll decorations, lightformer breathing)~~ DONE
6. ~~Background paths + particle spiral (flowing curves, infinite particle cylinder)~~ DONE
7. ~~Scale & spread (2x scale, gutter spread, center mask, color inversion)~~ DONE
8. ~~Infinite spiral + atmospheric fog (50% more radius, Y-wrapping, FogExp2)~~ DONE
9. ~~AN Logo overhaul (scroll rotation, scale compensation, blob dispersal)~~ DONE
10. ~~Color journey overhaul (deep indigo -> slate blue -> refined silver)~~ DONE
11. ~~HeroSection redesign (centered gradient shimmer text, no box)~~ DONE
12. ~~About section (editorial layout, ScrollTrigger scrub, sandwich depth, liquid glass card)~~ DONE
13. ~~Navigation (3D coin logo, liquid glass SVG filter, fixed + responsive, hamburger overlay)~~ DONE
14. ~~Bestsellers (3D circular coverflow carousel, chrome frames, arrow/touch nav)~~ DONE
15. ~~Single-scene infinite scroll restructure (200vh hero, station camera, spectacle taper)~~ DONE
16. ~~Hero-to-About scene phase transition (ScenePhaseDriver, TransitionBridge, element attenuation)~~ DONE
17. ~~BestSellers refinements (fixed-ellipse positioning, auto-rotation, outward facing, no dark box)~~ DONE
18. ~~BestSellers polish + cursor redesign (hover glow, click-to-front, arrow buttons removed, iridescent arrow cursor)~~ DONE
19. ~~Visual polish: sparkles/dots minimized, background color #0a0e1a, logo dimmed, Bloom reduced~~ DONE
20. ~~About section: sequential word reveal ("THE"/"REFINED"/"REBELLION"), bluish-black glow, glass card removed~~ DONE
21. ~~Bestsellers: scroll-driven rotation (replaced auto-rotation), card sizing tuned, sticky inner wrapper~~ DONE
22. ~~Categories: rewritten as vertical stacked cards with scrub-based transitions, parallax, chrome dividers, flush edges~~ DONE
23. ~~Background spread: BackgroundPaths widened (xBias +-8 to +-16), ParticleSpiral expanded (radius 5-26)~~ DONE
24. ~~Side blobs: 6 new liquid metal blobs at screen edges (x=+-9.5/10/11, z=-1 to -3)~~ DONE
25. ~~The Why (two-column editorial layout, scrub animations, latePageFade for global logo, WhyStillLogo created)~~ DONE
26. ~~Campaign (3-card physical-photo stack, CSS sticky 600vh, scroll-driven peel, per-card fly-off animation)~~ DONE
27. ~~Lookbook (horizontal focal gallery, CSS sticky 700vh, 6-image track, DOM-measured centering, scale/opacity focal effect)~~ DONE
28. ~~Testimonials + Footer (polaroid pop-ups + MISHO-style 5-column footer, ghost watermark, SVG arcs)~~ DONE
29. ~~Visual tuning (latePageFade shifted to 0.24-0.30, carousel cards 1.3x, 125vh spacer, logo spin 2x)~~ DONE
30. ~~Scroll transitions + logo fade (BestSellers clip-path wipe, TransitionBridge removed, logoFade tied to About, spacer 125vh->63vh, logo rotation 4x)~~ DONE
31. ~~Bestsellers visual polish (premium silver wipe gradient, CenterSpiral chrome model, Environment boost, spacer 63vh->31.5vh)~~ DONE
32. ~~CenterSpiral tuning + Bloom removal + Chrome polish (spiral position/scale/useFrame fix, bloom disabled, logo roughness 0.12/clearcoatRoughness 0.06)~~ DONE
33. ~~CenterSpiral removed from Bestsellers, pagination dots repositioned, Categories rebuilt as expanding accordion (80vw glass frame, 3 floating portrait cards, WIDE=60% NARROW=15%, GSAP 2-step scrub, scale(0.82) image zoom-out)~~ DONE
35. ~~UI polish pass: Categories bg smoked titanium, inner border overlays, COLLECTIONS heading, LOOKBOOK heading above Campaign, unified Tier 1 (character wave) + Tier 2 (glow+tracking) interactive heading system across 5 sections, pearl+titanium scroll background transitions for Why+Campaign~~ DONE
36. ~~About section restyle: Bebas Neue font, white bloom glow, black bg overlay (GSAP scrub), floor ambient glow, spacer+BestSellers section black backgrounds~~ DONE
37. About->Bestsellers gap: wipe start offset needs updating (see TODO.md) -- IN PROGRESS
38. ~~Active Theory visual re-theme (2026-04-11): black base, blue/periwinkle accent, warm silver/titanium removed. 8 files changed. AT CSS tokens added.~~ DONE
39. Place test images from house-of-an-1 into site sections -- IN PROGRESS (interrupted)
40. ~~AT UI chrome (2026-04-14): split glass pill nav, SideRail left rail, AmbientTicker color-dodge, CornerTicker marquee, RouteTransition black overlay, ParticleField 12k points in hero. All wired into root.tsx.~~ DONE
41. ~~Unified Campaign+Lookbook aurora + scroll-gap compression (2026-04-17): ContinuousAuroraCanvas (shared `position:fixed` Canvas2D, 4 ribbons, ~70% boosted alpha/amp, phase stitched across section seam, floor rises to `#000` for TestimonialsFooter handoff). CampaignMonolithBg + LookbookAuroraCanvas deleted. Campaign timeline reworked 3→3.2 units with pre-exit HOLD so card1 doesn't leave early. Why + Lookbook wrappers `-60vh → -120vh` (Campaign wrapper `0`) -- ~60vh shorter at each transition. Lookbook animST delayed to `top+=120vh top` so carousel stays still during Campaign overlap. Envelopes widened/shifted for smoother crossfade (Campaign exit 0.85→1, Lookbook enter 0.20→0.34).~~ DONE
42. ~~Scroll-synced SideRail nav (2026-04-19): 4 buttons → 7 anchor-link scrollspy (Home / About / Bestsellers / Categories / The Why / Campaign / Lookbook). `<button>` → `<a>`, `<nav aria-label>` wrapper. Active item styled with 0.98rem / weight 500 / pure white / widened letter-spacing / translateX(16px) / periwinkle glow / 22px hairline indicator. Base size bumped (0.82rem / 32px left / 1.6rem gap). Single `IntersectionObserver` at `-45%` rootMargin drives the active label; Bestsellers entry spans `section-bs-title` + `section-bestsellers`. `_index.tsx` got 4 new IDs (`section-hero`, `section-bs-title`, `section-why`, `section-campaign`).~~ DONE
43. ~~Continuous-scroll bridging pass (2026-04-19 pt2): addresses client brief "pages still look separated, need one singular smooth scroll". ContinuousBackdrop envelopes widened so ≥2 motifs co-visible at every seam (constellation `0.08-0.22 / 0.50-0.66`, mist `0.32-0.50 / 0.68-0.80`, aurora `0.50-0.66 / 0.92-1.00`); base alphas trimmed ~15% to prevent 3-motif mud at sp≈0.55. New always-on ember layer (6 desktop / 3 mobile slow Lissajous radial blobs, alpha 0.05-0.075, weight 1.0) renders first each frame so backdrop is never inert. Mist phase driver switched from local remap to global `sp*6.28*1.1` so pattern doesn't snap back on back-scroll. Floor-rise start edge `0.88→0.82` for earlier Lookbook→Testimonials glue. New `PersistentParticleThread` (Tier B, 2.5k desktop / 800 mobile / 500 low-end, #6080e0, additive, cylinder `y:±30`, drifts with scroll delta, recycles at bounds) mounted OUTSIDE the `heroGone` gate — same blue particle field spans hero→footer as spatial through-line. `pageFlow.pageProgress` added to sceneState, written from a single body-scoped ScrollTrigger in _index.tsx (scrub:0). Campaign + Lookbook visual envelopes widened to `smoothstep(0,0.22)*(1-smoothstep(0.72,1))` (Lookbook keeps 0.15 floor for the 120vh Campaign overlap — so effective band is `0.15-0.37` / `0.72-1`); crossfade stretches from ~60vh to ~125vh at each join. WhySection wired with its own sticky outro — sticky-inner opacity `1 - smoothstep(0.85, 1.0, sp)` via a new `stickyRef`, creates a virtual crossfade into Campaign (Why→Campaign has no DOM margin overlap). BackgroundJourney gets two sub-perceptible mid-stops (`{0.35, #040810}`, `{0.75, #05080f}`, ΔE<2 from #000) so DOM body reads as alive during motif lulls. Typecheck clean.~~ DONE
44. ~~Hero wordmark remake (2026-04-21): HeroSection rebuilt 270vh absolute → 300vh sticky-inner. GSAP ScrollTrigger scrub:0.2 reveals "HOUSE" then "OF" via clip-path curtain + y-rise + tracking settle. AN word dropped — global 3D AN_Logo completes the wordmark. Stack anchored top (paddingTop:10vh) above the centered logo. Typography upscaled to `clamp(2.6rem, 9vw, 9rem)`. Removed heroFloat bob + 0.5s delay fade.~~ DONE
45. ~~Polish pass (2026-04-21 pt2): (a) AboutStillLogo material/env mirrors hero LogoModel (local `useStudioChromeEnvMap` + `#eef0f2` polished studio chrome, Lightformers dropped). (b) Lookbook side scales 0.65/0.50/0.38 → 0.48/0.34/0.24. (c) ContinuousBackdrop `drawAurora` removed — no more wavy background on Campaign/Lookbook. (d) Spiral swap: `/models/Spiral.glb` → `/spiral%20new.glb`, material silver chrome (was blue iridescent), two stacked instances → single instance at y=0, scale `26/size.y` for full viewport coverage.~~ DONE
45. Post-processing polish (chromatic aberration -- Bloom currently disabled, can be re-enabled)
46. Performance optimization + mobile pass

## Phase 3: Inner Pages
- PDP (stacked card image gallery, slide-up transitions, custom 3D cursor on gallery)
- PLP (filters, product grid from Shopify collections)
- Cart + Checkout (Shopify standard)

## Phase 4: Polish and Launch
- Mobile responsive pass (all sections)
- Performance audit (Lighthouse 90+ target)
- SEO + structured data
- prefers-reduced-motion support (ParticleField, tickers, AmbientTicker)
- ~~Page transitions between routes~~ DONE (RouteTransition.tsx)
- Domain connection (houseofan.com or houseofan.in)
- Deploy to Shopify Oxygen
- Client review + launch

## Current Section Architecture (scroll zones)
200vh Hero + 100vh About + 31.5vh spacer + 300vh Bestsellers (sticky) + 300vh Categories (sticky) + 100vh Why + 600vh Campaign (sticky) + 700vh Lookbook (sticky) + ~120vh Testimonials+Footer. Total: ~2451vh.
Note: 125vh Hero-to-About spacer removed in earlier session. No spacer between Hero and About in current code.

| Zone | Height | Section | Background |
|------|--------|---------|------------|
| Hero | 200vh | Full spectacle, 3D background | #000000 pure black (BackgroundJourney, AT-aligned, updated 2026-04-11) |
| About | 100vh | Editorial word reveal, logoFade, Bebas Neue font | Black (#000 overlay fades in via GSAP scrub, trigger top 90%->25%) |
| Spacer | 0vh | (removed) | -- |
| Bestsellers | 300vh (sticky 100vh) | 3D carousel, scroll-driven rotation | #000000 explicit + navy-to-blue-steel wipe overlay `#0e1828->#8aaccc` (AT palette) |
| latePageFade | -- | Global 3D elements fade (scroll 0.24-0.30) | -- |
| Categories | 300vh (sticky 100vh) | 3 floating portrait cards | Blue-dark radial `#1a2038->#060c18`, blue conic sweep borders (AT palette) |
| The Why | 100vh | Two-column editorial | Dark navy-to-blue `#08101e->#5a80aa` (AT palette, updated 2026-04-11) |
| Campaign | 600vh (sticky 100vh) | 3-card physical stack | Cards: #1a1a24, #0e1828, #161220 (already AT-aligned) |
| Lookbook | 920vh (sticky 100vh) | 6-image horizontal focal gallery. 180vh pre-roll + 5×148vh swaps (power2.inOut, scrub 0.6). No opacity fades. | Shared backdrop (ContinuousBackdrop). Blue focal frame. |
| Testimonials+Footer | ~120vh | Polaroid cards + 5-column footer | `#8ab0d0->#1e3460` blue-silver to navy (matches BackgroundJourney 82% stop, updated 2026-04-11) |

## Content Dependencies (from Ananyaa)
| Content | Status |
|---------|--------|
| Product photos | WAITING |
| Product names/descriptions/prices | WAITING |
| Campaign shoot photos | WAITING |
| Lookbook/celeb photos | WAITING |
| About section images | WAITING |
| Real testimonials | WAITING |
| Final logo SVG | WAITING |
| Favicon | WAITING |
| Canva visual direction | RECEIVED |
| Domain name | TBD |
