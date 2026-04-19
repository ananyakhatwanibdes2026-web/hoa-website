import {useEffect, useRef} from 'react';
import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {whySectionState} from '~/lib/sceneState';
import {AboutStillLogo} from './AboutStillLogo';
import WhyMistCanvas from './WhyMistCanvas';

gsap.registerPlugin(ScrollTrigger);

export default function WhySection() {
  const sectionRef = useRef<HTMLElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const wordsRef = useRef<(HTMLDivElement | null)[]>([]);
  const itemsRef = useRef<(HTMLElement | null)[]>([]);
  const logoContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      // Paused timeline driven by ScrollTrigger scrub (sticky scroll pattern)
      const tl = gsap.timeline({paused: true});

      // Logo fades in first
      if (logoContainerRef.current) {
        tl.fromTo(
          logoContainerRef.current,
          {opacity: 0},
          {opacity: 1, duration: 0.18, ease: 'power2.out'},
          0.0,
        );
      }

      // Sequential word reveal: WHY -> HOUSE OF -> AN
      // Spread across first 40% of scroll so each word has breathing room
      const wordPositions = [0.04, 0.16, 0.28];
      wordsRef.current.forEach((el, i) => {
        if (!el) return;
        tl.fromTo(
          el,
          {y: 50, opacity: 0},
          {y: 0, opacity: 1, duration: 0.14, ease: 'power2.out'},
          wordPositions[i],
        );
      });

      // Subtle upward parallax on the words container
      if (leftRef.current) {
        tl.to(
          leftRef.current,
          {y: -28, ease: 'none', duration: 0.84},
          0.04,
        );
      }

      // Right column: stagger in after AN appears
      itemsRef.current.forEach((el, i) => {
        if (!el) return;
        tl.fromTo(
          el,
          {y: 20, opacity: 0},
          {y: 0, opacity: 1, duration: 0.16, ease: 'power2.out'},
          0.40 + i * 0.06,
        );
      });

      // Wire timeline to scroll — outer section 250vh, sticky inner 100vh = 150vh scrub distance
      ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
        animation: tl,
      });

      // Section awareness for SceneCanvas logo fade
      ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: 'bottom bottom',
        invalidateOnRefresh: true,
        onToggle: (self) => {
          whySectionState.active = self.isActive;
        },
        onUpdate: (self) => {
          whySectionState.sectionProgress = self.progress;
        },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <section
      ref={sectionRef}
      style={{
        height: '250vh',
        position: 'relative',
        overflow: 'visible',
        pointerEvents: 'none',
      }}
    >
      {/* Sticky inner viewport -- stays pinned while outer 250vh scrolls */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflow: 'visible',
        }}
      >
      <WhyMistCanvas />
      {/* LEFT: large background tagline */}
      <div
        ref={leftRef}
        style={{
          position: 'absolute',
          left: isMobile ? '3vw' : '3.5vw',
          top: isMobile ? '18%' : '22%',
          transform: 'none',
          zIndex: 1,
          pointerEvents: 'none',
          lineHeight: 1.05,
          userSelect: 'none',
        }}
      >
        {['WHY', 'HOUSE OF', 'AN'].map((word, i) => (
          <div
            key={word}
            ref={(el) => {
              wordsRef.current[i] = el;
            }}
            style={{
              fontFamily: "'Barlow', sans-serif",
              fontWeight: 800,
              fontSize: isMobile
                ? 'clamp(2rem, 9vw, 3rem)'
                : 'clamp(3rem, 5.8vw, 7rem)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#ffffff',
              textShadow:
                '0 0 20px rgba(255,255,255,0.8), 0 0 40px rgba(255,255,255,0.5), 0 0 80px rgba(255,255,255,0.2)',
              display: 'block',
              whiteSpace: 'nowrap',
              opacity: 0,
            }}
          >
            {word}
          </div>
        ))}
      </div>

      {/* CENTER: static AN logo */}
      <div
        ref={logoContainerRef}
        style={{
          position: 'absolute',
          left: '50%',
          top: '43%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1,
          pointerEvents: 'none',
          opacity: 0,
        }}
      >
        <AboutStillLogo />
      </div>

      {/* RIGHT: clean text block */}
      <div
        ref={rightRef}
        style={{
          position: 'absolute',
          right: isMobile ? '4vw' : '6vw',
          top: isMobile ? 'auto' : '43%',
          bottom: isMobile ? '10%' : 'auto',
          transform: isMobile ? 'none' : 'translateY(-50%)',
          width: isMobile
            ? 'clamp(200px, 72vw, 300px)'
            : 'clamp(240px, 28vw, 400px)',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      >
        {/* Founded label */}
        <div
          ref={(el) => {
            itemsRef.current[0] = el;
          }}
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 400,
            fontSize: '0.6rem',
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.42)',
            marginBottom: '1.5rem',
            opacity: 0,
          }}
        >
          Founded in 2024
        </div>

        {/* Thin divider */}
        <div
          ref={(el) => {
            itemsRef.current[1] = el;
          }}
          style={{
            width: '28px',
            height: '1px',
            background: 'rgba(255,255,255,0.25)',
            marginBottom: '1.5rem',
            opacity: 0,
          }}
        />

        {/* Primary paragraph */}
        <div
          ref={(el) => {
            itemsRef.current[2] = el;
          }}
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 400,
            fontSize: 'clamp(0.72rem, 0.9vw, 0.88rem)',
            lineHeight: 1.45,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: '#ffffff',
            marginBottom: '1.6rem',
            opacity: 0,
          }}
        >
          We blend story, craft &amp; contemporary design
          as an in-house atelier of passionate makers.
        </div>

        {/* Secondary paragraph */}
        <div
          ref={(el) => {
            itemsRef.current[3] = el;
          }}
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 400,
            fontSize: 'clamp(0.72rem, 0.9vw, 0.88rem)',
            lineHeight: 1.45,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.55)',
            opacity: 0,
          }}
        >
          Our commitment to 97% recycled silver consistently
          delivers award-worthy jewellery through quality,
          sustainability and performance.
        </div>
      </div>

      </div>
    </section>
  );
}
