# HOUSE OF AN -- Roadmap

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
19. **Categories (playing card deal, 7 categories)** << NEXT
19. The Why (two-column, SVG line draw, stats counters)
20. Campaign (stacked card peel reveal)
21. Lookbook (horizontal infinite scroll marquee)
22. Testimonials + Footer (interactive pop-ups + MISHO-style 5-column)
23. Post-processing polish (chromatic aberration -- Bloom already done)
24. Performance optimization + mobile pass

## Phase 3: Inner Pages
- PDP (stacked card image gallery, slide-up transitions, custom 3D cursor on gallery)
- PLP (filters, product grid from Shopify collections)
- Cart + Checkout (Shopify standard)

## Phase 4: Polish and Launch
- Mobile responsive pass (all sections)
- Performance audit (Lighthouse 90+ target)
- SEO + structured data
- prefers-reduced-motion support
- Page transitions between routes
- Domain connection (houseofan.com or houseofan.in)
- Deploy to Shopify Oxygen
- Client review + launch

## Current Section Architecture (scroll zones)
With 200vh Hero + 100vh each for remaining sections (~8 total):
| Zone | Scroll % | Section |
|------|----------|---------|
| Hero | 0-25% | 200vh -- full spectacle |
| About | 25-37.5% | 100vh -- editorial, spectacle fading |
| Bestsellers | 37.5-50% | 100vh -- product carousel |
| Content | 50-68% | placeholders -- minimal mist |
| Silver transition | 68-82% | paths/spiral restore to charcoal |
| Silver/Footer | 82-100% | light palette |

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
