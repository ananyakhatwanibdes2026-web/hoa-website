import {useEffect, useRef} from 'react';
import {gsap} from 'gsap';

export function HeroSection() {
  const textRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = gsap.timeline({delay: 0.5});

    if (textRef.current) {
      tl.fromTo(
        textRef.current,
        {opacity: 0},
        {
          opacity: 1,
          duration: 1.8,
          ease: 'power2.out',
          onComplete: () => {
            if (textRef.current) {
              textRef.current.style.animation =
                'heroFloat 6s ease-in-out infinite';
            }
          },
        },
      );
    }
    if (scrollRef.current) {
      tl.fromTo(
        scrollRef.current,
        {opacity: 0},
        {opacity: 1, duration: 0.8},
        '-=0.5',
      );
    }

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <section
      style={{
        height: '200vh',
        position: 'relative',
        overflow: 'hidden',
        padding: 0,
        pointerEvents: 'none',
      }}
    >
      {/* Brand name -- centered, gradient shimmer, no box */}
      <div
        ref={textRef}
        style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          width: '100%',
          transform: 'translateY(-50%)',
          textAlign: 'center',
          opacity: 0,
          zIndex: 2,
          pointerEvents: 'none',
        }}
      >
        <h1
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontWeight: 200,
            fontSize: 'clamp(2.2rem, 6.5vw, 6rem)',
            letterSpacing: '0.65em',
            paddingLeft: '0.65em',
            textTransform: 'uppercase',
            margin: 0,
            lineHeight: 1,
            background:
              'linear-gradient(90deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.9) 30%, rgba(255,255,255,1.0) 50%, rgba(255,255,255,0.9) 70%, rgba(255,255,255,0.55) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter:
              'drop-shadow(0 0 24px rgba(255,255,255,0.18)) drop-shadow(0 0 2px rgba(255,255,255,0.35))',
          }}
        >
          House of An
        </h1>
        {/* Hairline rule -- editorial accent */}
        <div
          style={{
            width: '32px',
            height: '1px',
            background:
              'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)',
            margin: '2rem auto 0',
          }}
        />
      </div>

      {/* Scroll chevron */}
      <div
        ref={scrollRef}
        style={{
          position: 'absolute',
          top: 'calc(100vh - 3rem)',
          left: '50%',
          transform: 'translateX(-50%)',
          opacity: 0,
          pointerEvents: 'none',
          zIndex: 2,
          animation: 'heroChevronBounce 2s ease-in-out infinite',
        }}
      >
        <svg width="18" height="10" viewBox="0 0 20 12" fill="none">
          <path
            d="M1 1L10 10L19 1"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="1.5"
          />
        </svg>
      </div>

      <style>{`
        @keyframes heroChevronBounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50%       { transform: translateX(-50%) translateY(6px); }
        }
        @keyframes heroFloat {
          0%, 100% { transform: translateY(-50%); }
          50%       { transform: translateY(calc(-50% - 4px)); }
        }
      `}</style>
    </section>
  );
}

export default HeroSection;
