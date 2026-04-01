import {useEffect, useRef} from 'react';
import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {aboutSectionState} from '~/lib/sceneState';

gsap.registerPlugin(ScrollTrigger);

// Glass card styles -- dark defaults; future light override via data-theme
const GLASS = {
  background: 'rgba(255, 255, 255, 0.03)',
  border: '1px solid rgba(160, 160, 160, 0.25)',
  boxShadow:
    '0 0 28px rgba(200, 200, 220, 0.07), inset 0 1px 0 rgba(255,255,255,0.06)',
  borderRadius: '12px',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
} as const;

export function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const glassCardRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top 78%',
          end: 'bottom 5%',
          scrub: 1,
        },
      });

      // Left tagline: slide in from left + fade
      tl.fromTo(
        leftRef.current,
        {x: -80, opacity: 0},
        {x: 0, opacity: 1, duration: 0.3, ease: 'power2.out'},
        0,
      );

      // Glass card: fade + slight x slide
      tl.fromTo(
        glassCardRef.current,
        {x: 20, opacity: 0},
        {x: 0, opacity: 1, duration: 0.25, ease: 'power2.out'},
        0.05,
      );

      // Right items: staggered fade + lift inside the glass card
      itemsRef.current.forEach((el, i) => {
        if (!el) return;
        tl.fromTo(
          el,
          {y: 20, opacity: 0},
          {y: 0, opacity: 1, duration: 0.22, ease: 'power2.out'},
          0.12 + i * 0.07,
        );
      });

      // Exit: fade + slide up together (late so content stays readable)
      tl.to(
        [leftRef.current, glassCardRef.current],
        {opacity: 0, y: -32, duration: 0.12, ease: 'power2.in'},
        0.88,
      );

      // Logo section-awareness: update shared state for SceneCanvas
      ScrollTrigger.create({
        trigger: section,
        start: 'top 70%',
        end: 'bottom 30%',
        onToggle: (self) => {
          aboutSectionState.active = self.isActive;
        },
        onUpdate: (self) => {
          aboutSectionState.sectionProgress = self.progress;
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
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {/* Dark radial mask -- depth backdrop behind glass card */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          width: '55%',
          height: '100%',
          background:
            'radial-gradient(ellipse at 80% 50%, rgba(15,10,30,0.72) 0%, rgba(15,10,30,0.35) 45%, transparent 75%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* LEFT: large background tagline -- sits *behind* the glass card */}
      <div
        ref={leftRef}
        style={{
          position: 'absolute',
          left: isMobile ? '3vw' : '4vw',
          top: isMobile ? '18%' : '50%',
          transform: isMobile ? 'none' : 'translateY(-50%)',
          opacity: 0,
          zIndex: 1,
          pointerEvents: 'none',
          lineHeight: 0.88,
          userSelect: 'none',
        }}
      >
        {['THE', 'REFINED', 'REBELLION'].map((word) => (
          <div
            key={word}
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 800,
              fontSize: isMobile
                ? 'clamp(2.8rem, 14vw, 4.5rem)'
                : 'clamp(4rem, 10.5vw, 9.5rem)',
              letterSpacing: '-0.025em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.20)',
              display: 'block',
              whiteSpace: 'nowrap',
            }}
          >
            {word}
          </div>
        ))}
      </div>

      {/* RIGHT: liquid glass card -- z-index 2, in front of the tagline */}
      <div
        ref={glassCardRef}
        style={{
          position: 'absolute',
          right: isMobile ? '4vw' : '6vw',
          top: isMobile ? 'auto' : '50%',
          bottom: isMobile ? '10%' : 'auto',
          transform: isMobile ? 'none' : 'translateY(-50%)',
          width: isMobile
            ? 'clamp(200px, 72vw, 300px)'
            : 'clamp(240px, 28vw, 400px)',
          zIndex: 2,
          opacity: 0,
          padding: 'clamp(1.5rem, 3vw, 2.5rem)',
          pointerEvents: 'none',
          ...GLASS,
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
          Founded in 2012
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

        {/* Primary paragraph -- 25% larger */}
        <div
          ref={(el) => {
            itemsRef.current[2] = el;
          }}
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 300,
            fontSize: 'clamp(0.975rem, 1.31vw, 1.16rem)',
            lineHeight: 1.75,
            letterSpacing: '0.01em',
            color: '#ffffff',
            marginBottom: '1.6rem',
            opacity: 0,
          }}
        >
          We blend story, art &amp; technology as an in-house team of passionate
          makers.
        </div>

        {/* Secondary paragraph -- 25% larger */}
        <div
          ref={(el) => {
            itemsRef.current[3] = el;
          }}
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 300,
            fontSize: 'clamp(0.975rem, 1.31vw, 1.16rem)',
            lineHeight: 1.75,
            letterSpacing: '0.01em',
            color: 'rgba(255,255,255,0.55)',
            opacity: 0,
          }}
        >
          Our industry-leading web toolset consistently delivers award-winning
          work through quality and performance.
        </div>
      </div>
    </section>
  );
}

export default AboutSection;
