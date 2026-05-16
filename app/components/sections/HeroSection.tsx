import {useEffect, useRef} from 'react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {aboutSectionState} from '~/lib/sceneState';

gsap.registerPlugin(ScrollTrigger);

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const eyebrowRef = useRef<HTMLDivElement>(null);
  const topRuleRef = useRef<HTMLDivElement>(null);
  const bottomRuleRef = useRef<HTMLDivElement>(null);
  const houseRef = useRef<HTMLSpanElement>(null);
  const ofRef = useRef<HTMLSpanElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;
    const ctx = gsap.context(() => {
      const words = [houseRef.current, ofRef.current];
      gsap.set(words, {
        opacity: 0,
        y: 48,
        clipPath: 'inset(0 0 100% 0)',
        letterSpacing: '0.3em',
        paddingLeft: '0.3em',
        '--sweep-x': '-150%',
      });
      gsap.set([topRuleRef.current, bottomRuleRef.current], {
        scaleX: 0,
        opacity: 0,
      });
      gsap.set(eyebrowRef.current, {opacity: 0, y: 8});
      gsap.set(scrollRef.current, {opacity: 0});

      const tl = gsap.timeline({paused: true});

      tl.to(
        eyebrowRef.current,
        {opacity: 1, y: 0, duration: 0.18, ease: 'power2.out'},
        0.0,
      );
      tl.to(
        topRuleRef.current,
        {opacity: 1, scaleX: 1, duration: 0.32, ease: 'power3.out'},
        0.05,
      );

      const reveal = (el: Element | null, at: number) => {
        tl.to(
          el,
          {
            opacity: 1,
            y: 0,
            clipPath: 'inset(0 0 0% 0)',
            letterSpacing: '0.65em',
            paddingLeft: '0.65em',
            duration: 0.28,
            ease: 'power2.out',
          },
          at,
        );
        tl.to(
          el,
          {
            '--sweep-x': '150%',
            duration: 0.55,
            ease: 'power2.inOut',
          },
          at,
        );
      };
      reveal(houseRef.current, 0.0);
      reveal(ofRef.current, 0.45);

      tl.to(
        bottomRuleRef.current,
        {opacity: 1, scaleX: 1, duration: 0.32, ease: 'power3.out'},
        0.78,
      );
      tl.to(
        scrollRef.current,
        {opacity: 1, duration: 0.15, ease: 'power2.out'},
        0.86,
      );

      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.2,
        animation: tl,
        invalidateOnRefresh: true,
      });
    }, sectionRef);

    let raf = 0;
    let currentFade = 0;
    const tick = () => {
      const target = clamp01(aboutSectionState.sectionProgress / 0.04);
      currentFade += (target - currentFade) * 0.30;
      if (pinRef.current) {
        pinRef.current.style.opacity = (1 - currentFade).toFixed(3);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ctx.revert();
    };
  }, []);

  const wordBase: React.CSSProperties = {
    position: 'relative',
    display: 'block',
    fontFamily: "'Cormorant Garamond', serif",
    fontWeight: 200,
    fontSize: 'clamp(1.8rem, 6vw, 6rem)',
    lineHeight: 1.02,
    letterSpacing: '0.65em',
    paddingLeft: '0.65em',
    textTransform: 'uppercase',
    margin: 0,
    background:
      'linear-gradient(180deg, #f4f6fa 0%, #c8ccd4 38%, #ffffff 56%, #b8bcc4 78%, #d8dce4 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    filter:
      'drop-shadow(0 0 28px rgba(220,228,240,0.22)) drop-shadow(0 0 2px rgba(255,255,255,0.5))',
    willChange: 'transform, opacity, clip-path',
  };

  const ofStyle: React.CSSProperties = {
    ...wordBase,
    fontStyle: 'italic',
    fontWeight: 300,
  };

  const hairlineStyle: React.CSSProperties = {
    width: 'clamp(40px, 6vw, 72px)',
    height: '1px',
    background:
      'linear-gradient(90deg, transparent 0%, rgba(156,165,255,0.85) 50%, transparent 100%)',
    transformOrigin: 'center',
  };

  return (
    <section
      ref={sectionRef}
      style={{
        height: '300vh',
        position: 'relative',
        padding: 0,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 85% 65% at 50% 38%, rgba(180,205,235,0.09) 0%, rgba(100,150,220,0.05) 45%, transparent 100%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      <div
        ref={pinRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100vh',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingTop: '10vh',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      >
        <h1
          style={{
            margin: 0,
            padding: 0,
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.22em',
          }}
        >
          <div
            ref={eyebrowRef}
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 400,
              fontSize: 'clamp(0.62rem, 0.85vw, 0.78rem)',
              letterSpacing: '0.46em',
              paddingLeft: '0.46em',
              textTransform: 'uppercase',
              color: 'rgba(156,165,255,0.78)',
              marginBottom: '0.4em',
            }}
          >
            Mumbai · Est 2024
          </div>

          <div ref={topRuleRef} style={hairlineStyle} />

          <span
            ref={houseRef}
            className="hero-word"
            data-text="HOUSE"
            style={wordBase}
          >
            HOUSE
          </span>

          <span
            ref={ofRef}
            className="hero-word"
            data-text="OF"
            style={ofStyle}
          >
            OF
          </span>

          <div ref={bottomRuleRef} style={hairlineStyle} />
        </h1>

        <div
          ref={scrollRef}
          style={{
            position: 'absolute',
            bottom: '1.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
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
      </div>

      <style>{`
        @keyframes heroChevronBounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50%       { transform: translateX(-50%) translateY(6px); }
        }
        .hero-word::before {
          content: attr(data-text);
          position: absolute;
          inset: 0;
          pointer-events: none;
          font: inherit;
          font-style: inherit;
          font-weight: inherit;
          letter-spacing: inherit;
          padding-left: inherit;
          text-transform: inherit;
          background: linear-gradient(
            110deg,
            transparent 38%,
            rgba(255,255,255,0.95) 50%,
            transparent 62%
          );
          background-size: 220% 100%;
          background-position: var(--sweep-x, 150%) 0;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          mix-blend-mode: screen;
        }
      `}</style>
    </section>
  );
}

export default HeroSection;
