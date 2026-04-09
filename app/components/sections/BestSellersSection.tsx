import {useState, useEffect, useRef, Suspense, lazy} from 'react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {bestsellersSectionState} from '~/lib/sceneState';
import {createRotationHandlers, CARDS, CARD_TITLES} from './BestSellersCarousel';

gsap.registerPlugin(ScrollTrigger);

const BestSellersCarousel = lazy(() => import('./BestSellersCarousel'));

const ANGLE_STEP = (2 * Math.PI) / CARDS;

function ClientOnly({children}: {children: React.ReactNode}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? <>{children}</> : null;
}

// ---------------------------------------------------------------------------
// Section
// ---------------------------------------------------------------------------
export default function BestSellersSection() {
  const sectionRef = useRef<HTMLElement>(null!);
  const [isMobile, setIsMobile] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Rotation state lives here so arrows AND touch both share it
  const rotStateRef = useRef({angle: 0});

  // Hover and animating refs shared with R3F to control auto-rotation
  const hoverRef = useRef(false);
  const animatingRef = useRef(false);

  // Per-card scale refs (passed down to R3F for smooth lerp)
  const cardScaleRefs = useRef(
    Array.from({length: CARDS}, () => ({current: 0.62})),
  );

  const {goNext, goPrev} = createRotationHandlers(rotStateRef);

  function handleNext() {
    if (isAnimating) return;
    setIsAnimating(true);
    animatingRef.current = true;
    goNext();
    setActiveIndex((prev) => (prev + 1) % CARDS);
    setTimeout(() => {
      setIsAnimating(false);
      animatingRef.current = false;
    }, 900);
  }

  function handlePrev() {
    if (isAnimating) return;
    setIsAnimating(true);
    animatingRef.current = true;
    goPrev();
    setActiveIndex((prev) => (prev - 1 + CARDS) % CARDS);
    setTimeout(() => {
      setIsAnimating(false);
      animatingRef.current = false;
    }, 900);
  }

  function goToCard(targetIndex: number) {
    if (isAnimating) return;
    const FULL = 2 * Math.PI;
    const current = rotStateRef.current.angle;
    // Find shortest rotation so card targetIndex lands at front (worldAngle = 0 mod 2π)
    const base = -(targetIndex * ANGLE_STEP + current);
    const normalized = ((base % FULL) + FULL) % FULL;
    const delta = normalized > Math.PI ? normalized - FULL : normalized;
    if (Math.abs(delta) < 0.05) return; // already at front
    setIsAnimating(true);
    animatingRef.current = true;
    setActiveIndex(targetIndex);
    gsap.to(rotStateRef.current, {
      angle: current + delta,
      duration: 1.0,
      ease: 'power3.inOut',
      onComplete: () => {
        setIsAnimating(false);
        animatingRef.current = false;
      },
    });
  }

  // Mobile detection
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // ScrollTrigger for section awareness
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top center',
      end: 'bottom center',
      onToggle: (self) => {
        bestsellersSectionState.active = self.isActive;
      },
      onUpdate: (self) => {
        bestsellersSectionState.sectionProgress = self.progress;
      },
    });
    return () => trigger.kill();
  }, []);

  // Scroll-driven carousel rotation
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const totalAngle = -(CARDS - 1) * ANGLE_STEP;
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1,
      onUpdate: (self) => {
        rotStateRef.current.angle = self.progress * totalAngle;
        const cardIdx = Math.round(self.progress * (CARDS - 1));
        setActiveIndex(Math.min(cardIdx, CARDS - 1));
      },
    });
    return () => st.kill();
  }, []);

  // Section entrance animation
  const headerRef = useRef<HTMLDivElement>(null!);
  const subtitleRef = useRef<HTMLDivElement>(null!);
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start: 'top 75%',
        toggleActions: 'play none none none',
      },
    });
    tl.fromTo(
      headerRef.current,
      {opacity: 0, y: -20},
      {opacity: 1, y: 0, duration: 0.9, ease: 'power2.out'},
    ).fromTo(
      subtitleRef.current,
      {opacity: 0, y: 10},
      {opacity: 0.55, y: 0, duration: 0.7, ease: 'power2.out'},
      '-=0.5',
    );
    return () => {
      tl.kill();
    };
  }, []);

  // Background wipe layer (Active Theory-style bottom-to-top reveal)
  const wipeBgRef = useRef<HTMLDivElement>(null!);
  useEffect(() => {
    const el = sectionRef.current;
    const bg = wipeBgRef.current;
    if (!el || !bg) return;

    // Reveal: clip-path wipes bottom-to-top during the spacer scroll.
    // start 'top bottom+=44.5%' fires when section top is 144.5vh below viewport top
    // (44.5vh below viewport bottom), aligning with the start of the 31.5vh spacer.
    // end 'top top' completes the wipe exactly when section hits viewport top --
    // so clip-path is locked at inset(0%) for the entire 300vh sticky scroll (no jiggle).
    const tween = gsap.fromTo(
      bg,
      {clipPath: 'inset(100% 0 0 0)'},
      {
        clipPath: 'inset(0% 0 0 0)',
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top bottom',
          end: 'top top',
          scrub: true,
        },
      },
    );

    // Hide the fixed wipe once the section fully exits the viewport
    const visTrigger = ScrollTrigger.create({
      trigger: el,
      start: 'top bottom',
      end: 'bottom top',
      onLeave: () => { bg.style.display = 'none'; },
      onEnterBack: () => { bg.style.display = ''; },
      onLeaveBack: () => { bg.style.display = 'none'; },
      onEnter: () => { bg.style.display = ''; },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      visTrigger.kill();
    };
  }, []);

  // Touch handling
  const touchStartX = useRef(0);

  return (
    <section
      ref={sectionRef}
      style={{
        position: 'relative',
        height: '300vh',
        marginTop: '-5vh',
        zIndex: 1,
        userSelect: 'none',
      }}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        const delta = touchStartX.current - e.changedTouches[0].clientX;
        if (Math.abs(delta) > 48) {
          delta > 0 ? handleNext() : handlePrev();
        }
      }}
    >
      {/* Wipe background -- viewport-fixed, reveals bottom-to-top via clip-path */}
      <div
        ref={wipeBgRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100vh',
          zIndex: 0,
          pointerEvents: 'none',
          clipPath: 'inset(100% 0 0 0)',
          willChange: 'clip-path',
          display: 'none',
          background:
            'linear-gradient(to bottom, #1c1c28 0%, #2e2e3a 18%, #78788a 45%, #a8a8b4 72%, #d4d4dc 100%)',
        }}
      />

      {/* Sticky inner viewport -- stays pinned while outer 300vh scrolls */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflow: 'hidden',
          zIndex: 1,
        }}
      >
        {/* Section header */}
        <style>{`
          .bs-hdg-wrap {
            cursor: default;
            user-select: none;
            text-align: center;
            display: inline-block;
          }
          .bs-eyebrow {
            font-family: var(--font-display, 'Cormorant Garamond', serif);
            font-size: clamp(0.65rem, 1vw, 0.85rem);
            font-weight: 400;
            letter-spacing: 0.38em;
            text-transform: uppercase;
            color: rgba(192,192,220,0.6);
            display: block;
            transition: color 0.45s ease, letter-spacing 0.55s cubic-bezier(0.25,0,0,1);
          }
          .bs-hdg-wrap:hover .bs-eyebrow {
            color: rgba(192,192,220,0.95);
            letter-spacing: 0.48em;
          }
          .bs-hdg {
            font-family: var(--font-display, 'Cormorant Garamond', serif);
            font-size: clamp(1.8rem, 4vw, 3rem);
            font-weight: 300;
            letter-spacing: 0.22em;
            text-transform: uppercase;
            color: var(--text-primary, #ffffff);
            margin: 0.15em 0 0;
            line-height: 1;
            display: block;
          }
          .bs-ch {
            display: inline-block;
            transition: transform 0.38s cubic-bezier(0.34,1.56,0.64,1);
          }
          .bs-ch:nth-child(1)  { transition-delay:   0ms; }
          .bs-ch:nth-child(2)  { transition-delay:  35ms; }
          .bs-ch:nth-child(3)  { transition-delay:  70ms; }
          .bs-ch:nth-child(4)  { transition-delay: 105ms; }
          .bs-ch:nth-child(5)  { transition-delay: 140ms; }
          .bs-ch:nth-child(6)  { transition-delay: 175ms; }
          .bs-ch:nth-child(7)  { transition-delay: 210ms; }
          .bs-ch:nth-child(8)  { transition-delay: 245ms; }
          .bs-ch:nth-child(9)  { transition-delay: 280ms; }
          .bs-ch:nth-child(10) { transition-delay: 315ms; }
          .bs-ch:nth-child(11) { transition-delay: 350ms; }
          .bs-hdg-wrap:hover .bs-ch { transform: translateY(-5px); }
          .bs-rule {
            width: 0;
            height: 1px;
            background: rgba(255,255,255,0.30);
            margin: 11px auto 0;
            transition: width 0.6s cubic-bezier(0.25,0,0,1);
          }
          .bs-hdg-wrap:hover .bs-rule { width: 44px; }
        `}</style>
        <div
          ref={headerRef}
          style={{
            position: 'absolute',
            top: '7%',
            left: 0,
            right: 0,
            textAlign: 'center',
            zIndex: 5,
            opacity: 0,
          }}
        >
          <div className="bs-hdg-wrap">
            <span className="bs-eyebrow">House of An</span>
            <h2 className="bs-hdg">
              {'BESTSELLERS'.split('').map((ch, i) => (
                <span key={i} className="bs-ch">{ch}</span>
              ))}
            </h2>
            <div className="bs-rule" />
          </div>
        </div>

        {/* Active product label (below header) */}
        <div
          ref={subtitleRef}
          style={{
            position: 'absolute',
            top: 'calc(7% + 88px)',
            left: 0,
            right: 0,
            textAlign: 'center',
            zIndex: 5,
            opacity: 0,
            pointerEvents: 'none',
            transition: 'opacity 0.3s',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-body, "DM Sans", sans-serif)',
              fontSize: 'clamp(0.7rem, 1.1vw, 0.9rem)',
              fontWeight: 300,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.55)',
            }}
          >
            {CARD_TITLES[activeIndex]}
          </span>
        </div>

        {/* R3F Canvas */}
        <ClientOnly>
          <Suspense fallback={null}>
            <BestSellersCarousel
              isMobile={isMobile}
              rotStateRef={rotStateRef}
              cardScaleRefs={cardScaleRefs.current}
              hoverRef={hoverRef}
              animatingRef={animatingRef}
              onCardClick={goToCard}
            />
          </Suspense>
        </ClientOnly>

        {/* Dot indicators */}
        <div
          style={{
            position: 'absolute',
            bottom: '20%',
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            gap: 10,
            zIndex: 5,
          }}
        >
          {Array.from({length: CARDS}).map((_, i) => (
            <div
              key={i}
              style={{
                width: i === activeIndex ? 22 : 6,
                height: 6,
                borderRadius: 3,
                background:
                  i === activeIndex
                    ? 'rgba(192,192,220,0.85)'
                    : 'rgba(192,192,192,0.3)',
                transition: 'width 0.35s ease, background 0.35s ease',
              }}
            />
          ))}
        </div>
        {/* Bottom vignette -- masks silver gradient at section edge */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '12vh',
            background: 'linear-gradient(to bottom, transparent, #0c0c16)',
            zIndex: 6,
            pointerEvents: 'none',
          }}
        />
      </div>
    </section>
  );
}
