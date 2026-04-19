# HOUSE OF AN -- To Do

## Recently Completed (2026-04-17 -- Unified Aurora + Scroll-Gap Compression)
- [x] **ContinuousAuroraCanvas.tsx** (new): one shared `position:fixed` Canvas2D spans Campaign + Lookbook. 4 desktop ribbons (was 3), alpha 0.28-0.36, amp 0.11-0.15 -- ~70% brighter than old Lookbook-only aurora.
- [x] **Deleted** CampaignMonolithBg.tsx + LookbookAuroraCanvas.tsx. Campaign's inline radial-gradient glow div also removed.
- [x] **Campaign↔Lookbook seam**: phase driver stitches `lAct ? 1+lSp : cAct ? cSp : 0` so ribbons keep evolving across the boundary; `lookbookEnter = cAct ? 1 : smoothstep(0,0.08,lSp)` avoids a second fade-in when campaign already feeds the canvas. Floor div rises to `#000` on lookbook exit for TestimonialsFooter handoff.
- [x] **Campaign-over-Why overlap fixed**: Campaign wrapper margin `-60vh → 0` (no negative top). Campaign no longer bleeds into Why's pin-release zone.
- [x] **Campaign card1 early-exit fixed**: timeline reworked 3 → 3.2 units. Added HOLD t=0.4→1.2 before card1 exit; card1 now exits at ~37% section scroll (was ~20%).
- [x] **Scroll-gap compression**: Why wrapper + Lookbook wrapper margins `-60vh → -120vh`. Each transition ~60vh shorter (uses full pin-release zone of preceding section as overlap budget).
- [x] **Lookbook carousel no longer scrubs during Campaign**: split into two ScrollTriggers -- stateST at `top top` for aurora/envelope, animST at `top+=120vh top` for carousel scrub so images stay still until the overlap clears.
- [x] **Smoother Campaign→Lookbook fades**: Campaign exit envelope widened to `smoothstep(0,0.08)*(1-smoothstep(0.85,1))` (~75vh dissolve). Lookbook enter delayed to `smoothstep(0.20,0.34)` so both fades overlap through the 120vh window.
- [x] Docs synced: CLAUDE.md, PROGRESS.md, ROADMAP.md, TODO.md.

## Immediate (2026-04-17)
- [ ] **Visual QA -- unified aurora + compressed gaps**: `npm run dev`, slow scroll through Campaign → Lookbook. Confirm: aurora feels continuous (no seam / phase reset / brightness dip), Campaign card1 holds visible for a beat after intro before exiting, Lookbook images DO NOT move until after the 120vh overlap clears, no double-pin flicker at Why↔Campaign or Campaign↔Lookbook boundaries, TestimonialsFooter handoff stays clean as aurora floor rises to black.
- [ ] If any double-pin flicker at `-120vh`, step back to `-100vh` (stays fully inside preceding section's pin-release zone).
- [ ] `npm run typecheck && npm run lint` -- confirm no new errors beyond the pre-existing Canvas2D null-safety pattern (ctx/canvas possibly null -- matches sibling files).

## Recently Completed (2026-04-14 -- AT UI Chrome)
- [x] **AT CSS tokens added**: --at-glass-bg, --at-glass-border, --at-glass-blur, --at-radius-pill, --at-text-accent, --at-text-glow, --at-ease-out, --at-particle-dim added to global-effects.css :root
- [x] **Navigation redesigned as split glass pills**: Left pill (Shop/Collections), center wordmark "House of An", right pill (About/Bag). Backdrop-blur glass treatment. No full-bar background. nav-desktop-pills hidden on mobile, hamburger unchanged.
- [x] **SideRail.tsx created**: Fixed left mid-viewport, 4 periwinkle uppercase links (Bestsellers, Collections, Lookbook, About). Home route only. Hover slides right 7px. Lenis smooth scroll to section. Hidden on mobile via CSS.
- [x] **Anchor IDs added to _index.tsx**: section-about, section-bestsellers, section-categories, section-lookbook on respective wrapper divs.
- [x] **AmbientTicker.tsx created**: Bottom-left, mix-blend-mode: color-dodge. 5 brand lines cycle every 4.5s with fade. Text glows from WebGL scene underneath.
- [x] **CornerTicker.tsx created**: Bottom-right marquee, 22s linear, mix-blend-mode: color-dodge. "RECYCLED SILVER -- MADE IN MUMBAI -- READY TO SHIP -- EST. 2024".
- [x] **RouteTransition.tsx created**: Black overlay fades in on route load, fades out on idle. No white flash. SceneCanvas stays mounted. z-index 200.
- [x] **ParticleField.tsx created**: 12k desktop / 2.5k mobile THREE.Points. Blue-silver (#8ab0e8), additive blending, sizeAttenuation. Fades out by 22% scroll. Outside <Select> (not bloomed). Mounted in SceneCanvas.
- [x] **root.tsx wired**: RouteTransition, SideRail, AmbientTicker, CornerTicker all imported and rendered in Layout body.

## Recently Completed (2026-04-11)
- [x] **Active Theory visual re-theme**: Full color system overhaul across 8 files. Warm silver/titanium palette replaced with pure black base + blue/periwinkle AT aesthetic. Files changed: global-effects.css, BackgroundJourney.tsx, SceneCanvas.tsx, CategoriesSection.tsx, LookbookSection.tsx, WhySection.tsx, BestSellersSection.tsx, TestimonialsFooterSection.tsx.
- [x] New CSS tokens added to :root: --at-accent #6080e0, --at-accent-bright #9ca5ff, --at-blue-steel #1a2840, --at-blue-silver #8ab0d0

## Immediate (2026-04-14)
- [ ] **Visual QA -- AT UI chrome**: Run `npm run dev`. Verify: glass pills visible at top, left SideRail periwinkle links, bottom-left AmbientTicker glowing, bottom-right CornerTicker marquee, black fade on route change, particle drift in hero.
- [ ] **Place test images from house-of-an-1**: Images labeled 'lookbook' -> LookbookSection (6 slots), images labeled 'campaign' -> CampaignSection (3 card slots), remaining -> BestSellers/Categories. No repeats. (INTERRUPTED -- not yet done)

## Recently Completed (2026-04-04 Part 2)
- [x] About section font: Bebas Neue 400, letterSpacing 0.04em (replaces DM Sans 800). Bebas Neue + Nunito added to Google Fonts URL in root.tsx
- [x] About section text color: #ffffff with white bloom glow textShadow (20px/40px/80px rgba(255,255,255,0.8/0.5/0.2)) -- was bluish glow on rgba(255,255,255,0.55)
- [x] About section black bg overlay (blackBgRef, position:absolute, inset:0, z:-1, #000) fades in via GSAP ScrollTrigger: trigger=section, start='top 90%', end='top 25%', scrub:1
- [x] About section floor glow: position:absolute bottom:0 height:300px, 4-stop gradient, NO filter:blur (caused GPU compositing glitch)
- [x] 31.5vh About->Bestsellers spacer: background #000000
- [x] BestSellersSection section element: background #000000 (was transparent, showed #0a0e1a through it)

## Recently Completed (2026-04-04)
- [x] Categories panel inner border overlay (Tailwind `group` + `group-hover:border-white/50` + inset box-shadow)
- [x] Categories background color: blue `#0a0e17` -> smoked titanium `#18181b / #09090b`
- [x] "HOUSE OF AN COLLECTIONS" heading above accordion (DM Sans eyebrow + Cormorant display, hairline rule)
- [x] "LOOKBOOK" heading above Campaign cards (eyebrow + display heading, hover letter-spacing + rule)
- [x] Unified interactive heading system -- Tier 1 character wave: BESTSELLERS, COLLECTIONS, LOOKBOOK
- [x] Unified interactive heading system -- Tier 2 glow+tracking: WHY HOUSE OF AN, SO PORTABLE ITS WEARABLE
- [x] WhySection text colors dark (warm `#1c1914`) for pearl light background readability
- [x] Background transitions: pearl gradient for Why section, titanium gradient for Campaign section
- [x] Pearl (`#FCFBF8 -> #E8E6DF`) fades in as Why enters, scrub 1.5
- [x] Titanium (`#18181B -> #27272A`) fades in as Campaign enters, scrub 1 -- scoped to campaignWrapper only

## Immediate
- [ ] **About->Bestsellers gap** -- BestSellers wipe `start: 'top bottom+=13%'` was tuned for old 63vh spacer; spacer is now 31.5vh. Wipe is only 14% done when Bestsellers section enters viewport. Fix: adjust wipe start offset in `BestSellersSection.tsx` useEffect (line ~180) to `bottom+=31.5%` so it fires at the very start of the spacer, OR remove the spacer entirely and let the wipe run entirely within the BestSellers section.
- [ ] **AN_Logo reflectivity** -- reduce from chrome mirror to matte silver: `metalness: 1.0 -> 0.4`, `roughness: 0.12 -> 0.45`, `envMapIntensity: 1.2 -> 0.5`, `clearcoat: 0.2 -> 0`. File: `app/components/global/SceneCanvas.tsx` ~line 149-155
- [ ] Visual QA: full scroll pass -- verify pearl/titanium bg transitions feel seamless at Campaign seam
- [ ] Verify Why text (#1c1914) reads well at mid-fade of pearl bg

## Next
- [ ] Wire in WhyStillLogo into WhySection (component exists at `app/components/sections/WhyStillLogo.tsx`, not imported)
- [ ] Add 3 stat counters to Why section (12K+ Pieces, 97% Recycled Silver, 48H Dispatch)
- [ ] Add SVG line draw animations to Why section
- [ ] Replace testimonial placeholder quotes with real customer testimonials
- [ ] Connect newsletter form in footer to Shopify

## Upcoming
- [ ] Replace BestSellers CanvasTextures with real Shopify product images + GraphQL query
- [ ] Replace Campaign placeholder card backgrounds with real shoot photos
- [ ] Replace Lookbook placeholder slot backgrounds with real celeb/event photos
- [ ] Post-processing: chromatic aberration (Bloom currently disabled, can be re-enabled via EffectComposer)
- [ ] Fine-tune bg color journey once all sections are real (placeholders gone)
- [x] Build About-to-Bestsellers scroll transition in the spacer zone (DONE -- clip-path wipe in BestSellersSection)

## Blocked (client content)
- [ ] Real product photos/data
- [ ] Campaign photos
- [ ] Celeb/event/lookbook photos
- [ ] Real testimonials
- [ ] Favicon + logo SVG
- [ ] Domain confirmation (houseofan.com or houseofan.in)

## Tech Debt / Deferred
- [ ] prefers-reduced-motion support (ParticleField, AmbientTicker, CornerTicker should respect this)
- [x] Page transitions between routes -- DONE (RouteTransition.tsx, black overlay, no white flash)
- [ ] Chromatic aberration post-processing
- [ ] entrance2.glb unused -- consider removing from public/models/
- [ ] Fine-tune bg color journey once real sections replace all placeholders
- [ ] Rock/podium/particle dissipation hero concept (models exist, deferred per original brief)
- [ ] Deployment: Shopify Oxygen (Hydrogen native -- Netlify not compatible without adapter)
- [ ] Performance audit (target Lighthouse 90+)
