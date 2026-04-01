import {useEffect, useRef, useState} from 'react';
import {categoriesSectionState} from '~/lib/sceneState';

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const CATEGORIES = [
  {
    num: '01',
    name: 'EDGE',
    tagline: 'Minimal Aggression',
    cta: 'Shop Edge',
    href: '/collections/edge',
    imgSrc: '/images/categories/edge1.jpg',
    gradient:
      'linear-gradient(160deg, #080810 0%, #0e0e1e 30%, #181830 60%, #252548 85%, #c0c0d8 100%)',
    // placeholder shown inside the image frame when no real photo exists
    frameBg:
      'radial-gradient(ellipse at 50% 35%, #2e2e50 0%, #14142a 45%, #080810 100%)',
    frameAccent: 'rgba(180,180,220,0.25)',
    frameBorder: '1px solid rgba(200,200,238,0.50)',
    frameGlow:
      '0 0 0 1px rgba(200,200,238,0.50), 0 0 16px 3px rgba(180,180,225,0.28), 0 0 48px 10px rgba(150,150,215,0.14), 0 0 90px 22px rgba(120,120,195,0.07), 0 24px 64px rgba(0,0,0,0.65)',
  },
  {
    num: '02',
    name: 'SCULPT',
    tagline: 'Form Meets the Ear',
    cta: 'Shop Sculpt',
    href: '/collections/sculpt',
    imgSrc: '/images/categories/sculpt2.jpg',
    gradient:
      'linear-gradient(145deg, #050508 0%, #0a0a14 30%, #141425 60%, #202035 85%, #a0a0b8 100%)',
    frameBg:
      'radial-gradient(ellipse at 50% 35%, #1e1e38 0%, #0e0e1c 45%, #050508 100%)',
    frameAccent: 'rgba(160,160,200,0.22)',
    frameBorder: '1px solid rgba(185,185,222,0.45)',
    frameGlow:
      '0 0 0 1px rgba(185,185,222,0.45), 0 0 16px 3px rgba(165,165,210,0.26), 0 0 48px 10px rgba(135,135,200,0.12), 0 0 90px 22px rgba(115,115,188,0.06), 0 24px 64px rgba(0,0,0,0.65)',
  },
  {
    num: '03',
    name: 'ELITE',
    tagline: 'Sculpted in Gold',
    cta: 'Shop Elite',
    href: '/collections/elite',
    imgSrc: '/images/categories/elite3.jpg',
    gradient:
      'linear-gradient(155deg, #080608 0%, #100e08 25%, #1a1810 50%, #2e2410 75%, #c8a040 100%)',
    frameBg:
      'radial-gradient(ellipse at 50% 35%, #2e2208 0%, #161008 45%, #080604 100%)',
    frameAccent: 'rgba(200,160,60,0.28)',
    frameBorder: '1px solid rgba(215,172,62,0.68)',
    frameGlow:
      '0 0 0 1px rgba(215,172,62,0.68), 0 0 18px 4px rgba(205,158,45,0.40), 0 0 52px 12px rgba(195,142,28,0.20), 0 0 95px 26px rgba(165,112,10,0.10), 0 24px 64px rgba(0,0,0,0.65)',
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CategoriesSection() {
  const outerRef = useRef<HTMLDivElement>(null);
  const panel2Ref = useRef<HTMLDivElement>(null);
  const panel3Ref = useRef<HTMLDivElement>(null);

  // Per-panel content refs — indices 0-4: num, rule, name, tagline, cta
  const content1Refs = useRef<(HTMLElement | null)[]>([]);
  const content2Refs = useRef<(HTMLElement | null)[]>([]);
  const content3Refs = useRef<(HTMLElement | null)[]>([]);

  // Right-side image frame refs (animated slightly after content)
  const frame1Ref = useRef<HTMLDivElement>(null);
  const frame2Ref = useRef<HTMLDivElement>(null);
  const frame3Ref = useRef<HTMLDivElement>(null);

  const [activePanel, setActivePanel] = useState(0);

  useEffect(() => {
    const outer = outerRef.current;
    const panel2 = panel2Ref.current;
    const panel3 = panel3Ref.current;
    if (!outer || !panel2 || !panel3) return;

    let ctx: any;

    Promise.all([
      import('gsap').then((m) => m.gsap),
      import('gsap/ScrollTrigger').then((m) => m.ScrollTrigger),
    ]).then(([gsap, ScrollTrigger]) => {
      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        const c1 = content1Refs.current.filter(Boolean);
        const c2 = content2Refs.current.filter(Boolean);
        const c3 = content3Refs.current.filter(Boolean);

        // -- Entrance: Panel 1 content + frame fade in before sticking --
        const entranceTargets = [...c1, frame1Ref.current].filter(Boolean);
        if (entranceTargets.length) {
          gsap.timeline({
            scrollTrigger: {
              trigger: outer,
              start: 'top 80%',
              end: 'top 0%',
              scrub: 1,
            },
          }).fromTo(
            entranceTargets,
            {opacity: 0, y: 32},
            {opacity: 1, y: 0, stagger: 0.03, duration: 0.6},
          );
        }

        // -- Main sticky timeline --
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: outer,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 2,                  // more damping = feels slower & smoother
            onUpdate(self) {
              const p = self.progress;
              // thresholds match where each panel's slide starts
              setActivePanel(p < 0.36 ? 0 : p < 0.68 ? 1 : 2);
              categoriesSectionState.sectionProgress = p;
            },
            onToggle(self) {
              categoriesSectionState.active = self.isActive;
            },
          },
        });

        // Panel 1 text exit (frame stays — panel 2 will cover it)
        tl.to(c1, {opacity: 0, y: -18, duration: 0.04}, 0.30);

        // Panel 2 slides in
        tl.fromTo(panel2,
          {x: '100%'},
          {x: '0%', duration: 0.13, ease: 'power2.inOut'},
          0.36,
        );
        // Panel 2 frame: own tween, appears as panel finishes sliding in
        if (frame2Ref.current) {
          tl.fromTo(
            frame2Ref.current,
            {opacity: 0},
            {opacity: 1, duration: 0.08},
            0.50,
          );
        }
        // Panel 2 text: tight stagger so all 5 items finish before exit at 0.62
        // Last item: 0.51 + 4×0.010 = 0.55, ends at 0.55+0.07 = 0.62 ✓
        if (c2.length) {
          tl.fromTo(
            c2,
            {opacity: 0, y: 22},
            {opacity: 1, y: 0, stagger: 0.01, duration: 0.07},
            0.51,
          );
        }
        // Panel 2 text-only exit (frame stays — panel 3 will cover it)
        tl.to(c2, {opacity: 0, y: -18, duration: 0.04}, 0.62);

        // Panel 3 slides in
        tl.fromTo(panel3,
          {x: '100%'},
          {x: '0%', duration: 0.13, ease: 'power2.inOut'},
          0.68,
        );
        // Panel 3 content + frame entrance
        tl.fromTo(
          [...c3, frame3Ref.current].filter(Boolean),
          {opacity: 0, y: 24},
          {opacity: 1, y: 0, stagger: 0.025, duration: 0.09},
          0.83,
        );
      }, outer);
    });

    return () => ctx?.revert();
  }, []);

  const isMobile =
    typeof window !== 'undefined' && window.innerWidth < 768;
  const outerHeight = isMobile ? '480vh' : '600vh';

  return (
    <>
      <style>{`
        .cat-cta-link {
          display: inline-block;
          position: relative;
          pointer-events: auto;
          text-decoration: none;
          color: #ffffff;
          font-family: var(--font-body, 'DM Sans', sans-serif);
          font-size: 11px;
          font-weight: 400;
          letter-spacing: 0.35em;
          text-transform: uppercase;
          cursor: pointer;
        }
        .cat-cta-link::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 1px;
          background: rgba(255,255,255,0.7);
          transition: width 0.35s ease;
        }
        .cat-cta-link:hover::after { width: 100%; }

        /* Split layout responsive */
        .cat-panel-inner {
          position: absolute;
          inset: 0;
          overflow: hidden;
          display: flex;
          flex-direction: row;
        }
        .cat-left {
          flex: 0 0 45%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: clamp(32px, 8vw, 100px);
          position: relative;
          z-index: 2;
          pointer-events: none;
        }
        .cat-right {
          flex: 0 0 55%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 5vh clamp(20px, 5vw, 60px) 5vh clamp(16px, 2vw, 32px);
          position: relative;
          z-index: 2;
        }
        .cat-frame {
          position: relative;
          width: 100%;
          max-width: 400px;
          aspect-ratio: 3 / 4;
          border-radius: 3px;
          overflow: hidden;
        }
        @media (max-width: 768px) {
          .cat-panel-inner { flex-direction: column; }
          .cat-left {
            flex: 0 0 auto;
            padding: 10vw 8vw 4vw;
            justify-content: flex-end;
          }
          .cat-right {
            flex: 1;
            padding: 4vw 8vw 8vw;
          }
          .cat-frame { max-width: 280px; }
        }
      `}</style>

      <section data-section="categories" style={{position: 'relative', padding: 0}}>
        <div ref={outerRef} style={{position: 'relative', height: outerHeight}}>
          <div
            style={{
              position: 'sticky',
              top: 0,
              height: '100vh',
              overflow: 'hidden',
              pointerEvents: 'none',
            }}
          >
            {/* Panel 1 — Edge */}
            <div style={{position: 'absolute', inset: 0, zIndex: 1}}>
              <PanelInner
                data={CATEGORIES[0]}
                contentRefs={content1Refs}
                frameRef={frame1Ref}
                showChromeEdge={false}
              />
            </div>

            {/* Panel 2 — Sculpt */}
            <div
              ref={panel2Ref}
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 2,
                transform: 'translateX(100%)',
                willChange: 'transform',
              }}
            >
              <PanelInner
                data={CATEGORIES[1]}
                contentRefs={content2Refs}
                frameRef={frame2Ref}
                showChromeEdge
              />
            </div>

            {/* Panel 3 — Elite */}
            <div
              ref={panel3Ref}
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 3,
                transform: 'translateX(100%)',
                willChange: 'transform',
              }}
            >
              <PanelInner
                data={CATEGORIES[2]}
                contentRefs={content3Refs}
                frameRef={frame3Ref}
                showChromeEdge
              />
            </div>

            {/* Progress dots */}
            <div
              style={{
                position: 'absolute',
                bottom: '4vh',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 20,
                display: 'flex',
                gap: '10px',
                alignItems: 'center',
                pointerEvents: 'none',
              }}
            >
              {CATEGORIES.map((_, i) => (
                <div
                  key={i}
                  style={{
                    height: '5px',
                    borderRadius: '3px',
                    background:
                      activePanel === i
                        ? 'rgba(255,255,255,0.85)'
                        : 'rgba(255,255,255,0.25)',
                    width: activePanel === i ? '20px' : '5px',
                    transition: 'width 0.4s ease, background 0.4s ease',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

// ---------------------------------------------------------------------------
// PanelInner
// ---------------------------------------------------------------------------

interface PanelInnerProps {
  data: (typeof CATEGORIES)[number];
  contentRefs: React.MutableRefObject<(HTMLElement | null)[]>;
  frameRef: React.RefObject<HTMLDivElement | null>;
  showChromeEdge: boolean;
}

function PanelInner({data, contentRefs, frameRef, showChromeEdge}: PanelInnerProps) {
  return (
    <div className="cat-panel-inner" style={{background: data.gradient}}>

      {/* Grain overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
          backgroundRepeat: 'repeat',
          mixBlendMode: 'overlay',
          opacity: 0.5,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Left-to-right vignette: deepens left side for text legibility */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to right, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.45) 30%, rgba(0,0,0,0.1) 55%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Chrome leading edge for panels 2 + 3 */}
      {showChromeEdge && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '2px',
            height: '100%',
            background:
              'linear-gradient(to bottom, transparent, rgba(255,255,255,0.95) 25%, white 50%, rgba(255,255,255,0.95) 75%, transparent)',
            boxShadow:
              '0 0 18px rgba(255,255,255,0.55), 0 0 60px rgba(255,255,255,0.18)',
            zIndex: 15,
          }}
        />
      )}

      {/* ── LEFT COLUMN: text content ────────────────────────────────────── */}
      <div className="cat-left">
        {/* Category number */}
        <div
          ref={(el) => { contentRefs.current[0] = el; }}
          style={{
            fontFamily: 'var(--font-body, "DM Sans", sans-serif)',
            fontSize: '11px',
            fontWeight: 400,
            letterSpacing: '0.45em',
            color: 'rgba(200,200,215,0.6)',
            textTransform: 'uppercase',
            marginBottom: '14px',
          }}
        >
          {data.num}
        </div>

        {/* Hairline rule */}
        <div
          ref={(el) => { contentRefs.current[1] = el; }}
          style={{
            width: '40px',
            height: '1px',
            background: 'rgba(255,255,255,0.3)',
            marginBottom: '20px',
          }}
        />

        {/* Category name */}
        <div
          ref={(el) => { contentRefs.current[2] = el; }}
          style={{
            fontFamily: 'var(--font-display, "Cormorant Garamond", serif)',
            fontSize: 'clamp(56px, 8vw, 108px)',
            fontWeight: 200,
            letterSpacing: '0.06em',
            lineHeight: 0.88,
            textTransform: 'uppercase',
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.95) 35%, rgba(255,255,255,0.9) 55%, rgba(200,200,220,0.7) 80%, rgba(255,255,255,0.85) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '18px',
          }}
        >
          {data.name}
        </div>

        {/* Tagline */}
        <div
          ref={(el) => { contentRefs.current[3] = el; }}
          style={{
            fontFamily: 'var(--font-body, "DM Sans", sans-serif)',
            fontSize: '12px',
            fontWeight: 300,
            letterSpacing: '0.22em',
            color: 'rgba(255,255,255,0.5)',
            textTransform: 'uppercase',
            marginBottom: '32px',
          }}
        >
          {data.tagline}
        </div>

        {/* CTA */}
        <a
          ref={(el) => { contentRefs.current[4] = el as HTMLAnchorElement; }}
          href={data.href}
          className="cat-cta-link"
        >
          {data.cta}&nbsp;&nbsp;&#8594;
        </a>
      </div>

      {/* ── RIGHT COLUMN: image frame ──────────────────────────────────────── */}
      <div className="cat-right">
        <div
          ref={frameRef}
          className="cat-frame"
          style={{
            border: data.frameBorder,
            boxShadow: data.frameGlow,
          }}
        >
          {/* Placeholder gradient (always visible as base) */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: data.frameBg,
            }}
          />

          {/* Studio spotlight */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(ellipse at 50% 30%, rgba(255,255,255,0.10) 0%, transparent 65%)',
              pointerEvents: 'none',
            }}
          />

          {/* Decorative ring — suggests the jewelry piece */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -52%)',
              width: '120px',
              height: '120px',
              border: `1px solid ${data.frameAccent}`,
              borderRadius: '50%',
              boxShadow: `inset 0 0 20px ${data.frameAccent}, 0 0 30px ${data.frameAccent}`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -52%)',
              width: '70px',
              height: '70px',
              border: `1px solid ${data.frameAccent}`,
              borderRadius: '50%',
              opacity: 0.5,
            }}
          />

          {/* Category name watermark */}
          <div
            style={{
              position: 'absolute',
              bottom: '20px',
              left: 0,
              right: 0,
              textAlign: 'center',
              fontFamily: 'var(--font-display, "Cormorant Garamond", serif)',
              fontSize: '13px',
              fontWeight: 300,
              letterSpacing: '0.45em',
              textTransform: 'uppercase',
              color: `${data.frameAccent}`,
              opacity: 0.7,
            }}
          >
            {data.name}
          </div>

          {/* Real image — sits on top, hides placeholder when loaded */}
          <img
            src={data.imgSrc}
            alt={data.name}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />

          {/* Subtle inner vignette over the image */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.45) 100%)',
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>

    </div>
  );
}
