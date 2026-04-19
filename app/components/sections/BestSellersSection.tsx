import {useState, useEffect, useRef, Suspense, lazy} from 'react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {bestsellersSectionState} from '~/lib/sceneState';
import {createRotationHandlers, CARDS, CARD_TITLES} from './BestSellersCarousel';

gsap.registerPlugin(ScrollTrigger);

const BestSellersCarousel = lazy(() => import('./BestSellersCarousel'));

const ANGLE_STEP = (2 * Math.PI) / CARDS;
const CAROUSEL_END = 0.85; // 5th card arrives at 85% of main scroll

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

  // Scroll-driven carousel rotation + scrub-driven entrance
  const _lastCardIdx = useRef(-1);
  // Section entrance animation
  const subtitleRef = useRef<HTMLDivElement>(null!);
  const dotsRef = useRef<HTMLDivElement>(null!);
  const counterRef = useRef<HTMLDivElement>(null!);
  const carouselRef = useRef<HTMLDivElement>(null!);
  const stickyRef = useRef<HTMLDivElement>(null!);
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const totalAngle = -(CARDS - 1) * ANGLE_STEP;
    const ENTRANCE = 0.25; // first 25% of scroll = entrance phase (~125vh)

    // Initial states for HTML elements (spiral + card opacity driven inside R3F)
    gsap.set(subtitleRef.current, {opacity: 0, y: 20});
    gsap.set(dotsRef.current, {opacity: 0, y: 14});
    gsap.set(counterRef.current, {opacity: 0});

    // Paused intro timeline -- HTML elements appear in the final quarter of entrance phase
    // (spiral + cards are revealed earlier via R3F useFrame)
    const introTl = gsap.timeline({paused: true});
    introTl
      .to(subtitleRef.current, {opacity: 1,    y: 0, ease: 'power2.out', duration: 0.10}, 0.80)
      .to(dotsRef.current,     {opacity: 1,    y: 0, ease: 'power2.out', duration: 0.08}, 0.87)
      .to(counterRef.current,  {opacity: 1,         ease: 'power2.out', duration: 0.08}, 0.87);

    // Outro: entire sticky section fades out in the last 18% of section scroll (~90vh)
    const OUTRO_START = 0.85;
    const outroTl = gsap.timeline({paused: true});
    outroTl.fromTo(
      stickyRef.current,
      {opacity: 1},
      {opacity: 0, ease: 'power2.inOut', duration: 1.0},
    );

    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1,
      onUpdate: (self) => {
        const ep = Math.min(1, self.progress / ENTRANCE);
        // Drive entrance for HTML elements + share progress with R3F
        introTl.progress(ep);
        bestsellersSectionState.entranceProgress = ep;
        // Drive carousel rotation for the remaining 75%
        const carouselP = Math.max(0, Math.min(1, (self.progress - ENTRANCE) / (CAROUSEL_END - ENTRANCE)));
        rotStateRef.current.angle = carouselP * totalAngle;
        bestsellersSectionState.carouselProgress = carouselP;
        const cardIdx = Math.min(Math.round(carouselP * (CARDS - 1)), CARDS - 1);
        // Only trigger a React re-render when the active card actually changes
        if (cardIdx !== _lastCardIdx.current) {
          _lastCardIdx.current = cardIdx;
          setActiveIndex(cardIdx);
        }
        // Drive outro: fade out overlay elements in the last 18% of section scroll
        const outroP = Math.max(0, (self.progress - OUTRO_START) / (1 - OUTRO_START));
        outroTl.progress(outroP);
      },
    });
    return () => {
      st.kill();
      introTl.kill();
      outroTl.kill();
    };
  }, []);

  // Touch handling
  const touchStartX = useRef(0);

  return (
    <section
      ref={sectionRef}
      style={{
        position: 'relative',
        height: '500vh',
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
      {/* Sticky inner viewport -- stays pinned while outer 300vh scrolls */}
      <div
        ref={stickyRef}
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflow: 'hidden',
          zIndex: 1,
        }}
      >
        {/* Product info panel */}
        <div
          ref={subtitleRef}
          style={{
            position: 'absolute',
            top: '6%',
            left: 0,
            right: 0,
            textAlign: 'center',
            zIndex: 5,
            opacity: 0,
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-body, "DM Sans", sans-serif)',
              fontSize: 'clamp(0.55rem, 0.8vw, 0.7rem)',
              fontWeight: 400,
              letterSpacing: '0.26em',
              textTransform: 'uppercase',
              color: 'rgba(140,170,240,0.45)',
            }}
          >
            BESTSELLERS
          </span>
          <span
            style={{
              fontFamily: 'var(--font-display, "Cormorant Garamond", serif)',
              fontSize: 'clamp(1.1rem, 2vw, 1.5rem)',
              fontWeight: 300,
              fontStyle: 'italic',
              letterSpacing: '0.06em',
              color: 'rgba(255,255,255,0.88)',
            }}
          >
            {CARD_TITLES[activeIndex]}
          </span>
        </div>

        {/* Card counter — bottom right, AT-style */}
        <div
          ref={counterRef}
          style={{
            position: 'absolute',
            bottom: '14%',
            right: '6%',
            zIndex: 5,
            opacity: 0,
            pointerEvents: 'none',
            fontFamily: 'var(--font-body, "DM Sans", sans-serif)',
            fontSize: 'clamp(0.6rem, 0.85vw, 0.75rem)',
            fontWeight: 400,
            letterSpacing: '0.22em',
            color: 'rgba(255,255,255,0.28)',
          }}
        >
          {String(activeIndex + 1).padStart(2, '0')} / {String(CARDS).padStart(2, '0')}
        </div>

        {/* R3F Canvas */}
        <div ref={carouselRef} style={{position: 'absolute', inset: 0}}>
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
        </div>

        {/* Dot indicators */}
        <div
          ref={dotsRef}
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
                width: i === activeIndex ? 28 : 5,
                height: 5,
                borderRadius: 3,
                background:
                  i === activeIndex
                    ? 'rgba(156,165,255,0.90)'
                    : 'rgba(255,255,255,0.20)',
                transition: 'width 0.35s ease, background 0.35s ease',
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
