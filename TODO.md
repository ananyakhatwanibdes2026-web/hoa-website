# HOUSE OF AN -- To Do

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
- [ ] prefers-reduced-motion support
- [ ] Page transitions between routes (Remix view transitions or GSAP flip)
- [ ] Chromatic aberration post-processing
- [ ] entrance2.glb unused -- consider removing from public/models/
- [ ] Fine-tune bg color journey once real sections replace all placeholders
- [ ] Rock/podium/particle dissipation hero concept (models exist, deferred per original brief)
- [ ] Deployment: Shopify Oxygen (Hydrogen native -- Netlify not compatible without adapter)
- [ ] Performance audit (target Lighthouse 90+)
