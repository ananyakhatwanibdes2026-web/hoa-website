# HOUSE OF AN -- To Do

## Recently Completed (2026-04-01)
- [x] Navigation: 3D coin logo, liquid glass SVG filter, fixed + responsive, hamburger overlay menu
- [x] About section refinements: liquid glass card, bigger body copy, logo section-awareness blend
- [x] Bestsellers: 3D circular coverflow carousel (5 cards, chrome frames, CanvasTexture placeholders, touch swipe, dot indicators)
- [x] Single-scene infinite scroll restructure (200vh hero, station camera, spectacle taper)
- [x] Hero-to-About scene phase transition (ScenePhaseDriver, TransitionBridge, element attenuation)
- [x] BestSellers refinements (fixed-ellipse, auto-rotation, outward facing cards, no dark box)
- [x] BestSellers Polish + Cursor Redesign:
  - Hover-to-stop removed; AUTO_SPEED 0.003 (faster)
  - Arrow buttons removed (touch swipe + dots + card click remain)
  - Card hover glow: additive RoundedBox behind each frame, lerp opacity 0->0.28
  - Click-to-front: goToCard(index), shortest-path GSAP power3.inOut 1.0s
  - ChromeCursor: SVG arrow pointer with iridescent animated stroke + velocity tilt ±14 deg + glass drop trail

## Immediate
- [ ] Visual QA: full scroll from entrance -> hero -> about -> bestsellers -> placeholders -> silver
- [ ] Test card click-to-front on all 5 cards at various rotation states
- [ ] Confirm hover glow visible on side/back cards, not just front
- [ ] Check cursor arrow rendering across light/dark scroll zones

## Next
- [ ] Categories: playing card deal animation (7 categories: Earrings, Rings, Necklaces, Bracelets, Ear Cuffs, Hoops, Pods)
- [ ] The Why: two-column grid, SVG line draw animations, 3 stats counter (12K+ Pieces, 97% Recycled Silver, 48H Dispatch)
- [ ] Campaign: stacked card peel/slide reveal (moblinks.fr reference)

## Upcoming
- [ ] Lookbook / As Seen On: infinite scroll marquee, slows on hover, fade edges
- [ ] Testimonials: interactive pop-up style (NOT marquee), chrome radial gradient bg
- [ ] Footer: MISHO-style 5-column (About+socials, Shop, Support, Explore, Newsletter)
- [ ] Replace BestSellers CanvasTextures with real Shopify product images + GraphQL query
- [ ] Post-processing: chromatic aberration (Bloom already done)

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
