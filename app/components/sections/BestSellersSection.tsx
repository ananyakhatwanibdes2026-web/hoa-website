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

  // Touch handling
  const touchStartX = useRef(0);

  return (
    <section
      ref={sectionRef}
      style={{
        position: 'relative',
        height: '100vh',
        overflow: 'hidden',
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
      {/* Section header */}
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
          pointerEvents: 'none',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-display, "Cormorant Garamond", serif)',
            fontSize: 'clamp(0.65rem, 1vw, 0.85rem)',
            fontWeight: 400,
            letterSpacing: '0.38em',
            textTransform: 'uppercase',
            color: 'rgba(192,192,220,0.6)',
          }}
        >
          House of An
        </span>
        <h2
          style={{
            fontFamily: 'var(--font-display, "Cormorant Garamond", serif)',
            fontSize: 'clamp(1.8rem, 4vw, 3rem)',
            fontWeight: 300,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--text-primary, #ffffff)',
            margin: '0.15em 0 0',
            lineHeight: 1,
          }}
        >
          Bestsellers
        </h2>
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
          bottom: '4%',
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
    </section>
  );
}
