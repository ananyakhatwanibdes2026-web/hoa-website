import {useEffect, useRef} from 'react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {categoriesSectionState} from '~/lib/sceneState';

gsap.registerPlugin(ScrollTrigger);

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const PANELS = [
  {
    num: '01',
    name: 'Edge',
    tagline: 'Minimal Aggression',
    imgSrc: '/images/categories/edge1.jpg',
    href: '/collections/edge',
    cta: 'Shop Edge',
  },
  {
    num: '02',
    name: 'Sculpt',
    tagline: 'Form Meets the Ear',
    imgSrc: '/images/categories/sculpt2.jpg',
    href: '/collections/sculpt',
    cta: 'Shop Sculpt',
  },
  {
    num: '03',
    name: 'Elite',
    tagline: 'Sculpted in Gold',
    imgSrc: '/images/categories/elite3.jpg',
    href: '/collections/elite',
    cta: 'Shop Elite',
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CategoriesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const headingRef = useRef<HTMLDivElement>(null);

  // GSAP scroll animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(cardRefs.current[0], {x: -100, y: 70, opacity: 0});
      gsap.set(cardRefs.current[1], {x: 0, y: 90, opacity: 0});
      gsap.set(cardRefs.current[2], {x: 100, y: 70, opacity: 0});
      gsap.set(headingRef.current,  {opacity: 0, y: 22});

      const tl = gsap.timeline({paused: true});

      // Phase 1 (0 -> 1.0): Cards enter from sides/below -- one full viewport height of scroll
      tl.to(cardRefs.current[0], {x: 0, y: 0, opacity: 1, ease: 'power3.out', duration: 1.0},  0)
        .to(cardRefs.current[1], {x: 0, y: 0, opacity: 1, ease: 'power3.out', duration: 0.90}, 0.12)
        .to(cardRefs.current[2], {x: 0, y: 0, opacity: 1, ease: 'power3.out', duration: 0.80}, 0.24);

      // Phase 1b (0.10 -> 0.55): Heading fades in as cards enter
      tl.to(headingRef.current, {opacity: 1, y: 0, ease: 'power2.out', duration: 0.45}, 0.10);

      // Phase 2 (1.0 -> 1.4): Brief dwell with gentle parallax
      tl.to(cardRefs.current[0], {y: -12, ease: 'none', duration: 0.40}, 1.0)
        .to(cardRefs.current[1], {y: -6,  ease: 'none', duration: 0.40}, 1.0)
        .to(cardRefs.current[2], {y: -12, ease: 'none', duration: 0.40}, 1.0);

      // Phase 3a (1.4 -> 2.0): Edge (left) launches off to the left
      tl.to(cardRefs.current[0], {x: -300, y: -40, opacity: 0, ease: 'power2.in', duration: 0.6}, 1.4);

      // Phase 3b (2.0 -> 2.6): Sculpt (center) launches straight up; heading exits with it
      tl.to(cardRefs.current[1], {y: -220, opacity: 0, ease: 'power2.in', duration: 0.6}, 2.0)
        .to(headingRef.current,  {opacity: 0, y: -25, ease: 'power2.in', duration: 0.45}, 2.1);

      // Phase 3c (2.6 -> 3.2): Elite (right) launches off to the right
      tl.to(cardRefs.current[2], {x: 300, y: -40, opacity: 0, ease: 'power2.in', duration: 0.6}, 2.6);

      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.3,
        animation: tl,
      });

      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top top',
        end: 'bottom bottom',
        invalidateOnRefresh: true,
        onToggle: (self) => {
          categoriesSectionState.active = self.isActive;
        },
        onUpdate: (self) => {
          categoriesSectionState.sectionProgress = self.progress;
        },
      });
    }, sectionRef.current!);

    return () => {
      ctx.revert();
      categoriesSectionState.active = false;
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      data-section="categories"
      style={{height: '500vh', position: 'relative', zIndex: 1}}
    >
      <style>{`
        .cat-hdg-wrap {
          text-align: center;
          cursor: default;
          user-select: none;
          display: inline-block;
          position: relative;
          z-index: 2;
        }
        .cat-eyebrow {
          font-family: var(--font-body, 'DM Sans', sans-serif);
          font-size: 10px;
          font-weight: 400;
          letter-spacing: 0.52em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.38);
          display: block;
          margin-bottom: 10px;
          transition: color 0.45s ease, letter-spacing 0.55s cubic-bezier(0.25,0,0,1);
        }
        .cat-hdg-wrap:hover .cat-eyebrow {
          color: rgba(255,255,255,0.75);
          letter-spacing: 0.62em;
        }
        .cat-hdg {
          font-family: var(--font-display, 'Cormorant Garamond', serif);
          font-size: clamp(2.4rem, 4vw, 3.6rem);
          font-weight: 200;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #ffffff;
          line-height: 1;
          display: block;
          margin: 0;
        }
        .cat-ch {
          display: inline-block;
          transition: transform 0.38s cubic-bezier(0.34,1.56,0.64,1);
        }
        .cat-ch:nth-child(1)  { transition-delay:   0ms; }
        .cat-ch:nth-child(2)  { transition-delay:  35ms; }
        .cat-ch:nth-child(3)  { transition-delay:  70ms; }
        .cat-ch:nth-child(4)  { transition-delay: 105ms; }
        .cat-ch:nth-child(5)  { transition-delay: 140ms; }
        .cat-ch:nth-child(6)  { transition-delay: 175ms; }
        .cat-ch:nth-child(7)  { transition-delay: 210ms; }
        .cat-ch:nth-child(8)  { transition-delay: 245ms; }
        .cat-ch:nth-child(9)  { transition-delay: 280ms; }
        .cat-ch:nth-child(10) { transition-delay: 315ms; }
        .cat-ch:nth-child(11) { transition-delay: 350ms; }
        .cat-hdg-wrap:hover .cat-ch { transform: translateY(-5px); }
        .cat-rule {
          width: 0;
          height: 1px;
          background: rgba(255,255,255,0.25);
          margin: 12px auto 0;
          transition: width 0.6s cubic-bezier(0.25,0,0,1);
        }
        .cat-hdg-wrap:hover .cat-rule { width: 44px; }

        .cat-grid {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          gap: 4.5vw;
          position: relative;
          z-index: 2;
        }

        .cat-card-outer {
          flex-shrink: 0;
          width: min(27vw, 340px);
          height: 68vh;
          position: relative;
          transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
          will-change: transform;
        }
        .cat-card-outer:hover {
          transform: translateY(-14px);
        }
        .cat-card-outer:hover::after {
          box-shadow:
            0 0 40px 10px rgba(100, 150, 255, 0.36),
            0 0 90px 28px rgba(100, 150, 255, 0.18);
          border-color: rgba(156, 165, 255, 0.65);
          transition: box-shadow 0.5s ease, border-color 0.5s ease;
        }

        @keyframes catFloat0 {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-7px); }
        }
        @keyframes catFloat1 {
          0%, 100% { transform: translateY(-4px); }
          50%       { transform: translateY(3px); }
        }
        @keyframes catFloat2 {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-5px); }
        }
        .cat-float-0 { animation: catFloat0 5s   ease-in-out infinite both; }
        .cat-float-1 { animation: catFloat1 6.5s ease-in-out infinite both; }
        .cat-float-2 { animation: catFloat2 5.8s ease-in-out infinite both; }

        .cat-card {
          width: 100%;
          height: 100%;
          position: relative;
          overflow: hidden;
          border-radius: 18px;
          box-shadow: 0 24px 64px rgba(0,0,0,0.50);
          cursor: pointer;
          transition: transform 0.45s cubic-bezier(0.34,1.56,0.64,1),
                      box-shadow 0.45s ease;
          will-change: transform;
        }
        .cat-card:hover {
          box-shadow: 0 40px 90px rgba(0,0,0,0.65);
          filter: brightness(1.06);
        }

        .cat-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          pointer-events: none;
          user-select: none;
        }

        .cat-vignette {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top,
            rgba(0,0,0,0.72) 0%,
            rgba(0,0,0,0.38) 42%,
            rgba(0,0,0,0)    65%
          );
          pointer-events: none;
          z-index: 1;
        }

        .cat-label {
          position: absolute;
          bottom: 32px;
          left: 28px;
          z-index: 2;
          font-family: var(--font-display, 'Cormorant Garamond', serif);
          font-style: italic;
          font-weight: 600;
          font-size: clamp(1.5rem, 2.4vw, 2rem);
          color: #ffffff;
          line-height: 1;
          letter-spacing: 0.04em;
          text-shadow: 0 2px 16px rgba(0,0,0,0.65), 0 1px 4px rgba(0,0,0,0.9);
          pointer-events: none;
          user-select: none;
        }

        .cat-cta {
          position: absolute;
          bottom: 28px;
          left: 50%;
          transform: translateX(-50%) translateY(8px);
          z-index: 2;
          font-family: var(--font-body, 'DM Sans', sans-serif);
          font-size: 10px;
          letter-spacing: 0.4em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.88);
          text-decoration: none;
          border-bottom: 1px solid rgba(255,255,255,0.38);
          padding-bottom: 3px;
          white-space: nowrap;
          opacity: 0;
          transition: opacity 0.3s ease, transform 0.3s ease;
        }
        .cat-card:hover .cat-cta {
          opacity: 1;
          transform: translateX(-50%) translateY(0px);
        }

        @property --cat-angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }

        @keyframes cat-sweep {
          to { --cat-angle: 360deg; }
        }

        @keyframes cat-breathe {
          0%, 100% {
            box-shadow:
              0 0 20px 3px rgba(80, 120, 220, 0.10),
              0 0 55px 12px rgba(80, 120, 220, 0.04);
            border-color: rgba(140, 168, 255, 0.14);
          }
          50% {
            box-shadow:
              0 0 32px 8px rgba(96, 144, 255, 0.24),
              0 0 75px 22px rgba(96, 144, 255, 0.12);
            border-color: rgba(156, 165, 255, 0.44);
          }
        }

        /* Rotating conic sweep border */
        .cat-card-outer::before {
          content: '';
          position: absolute;
          inset: -3px;
          border-radius: 21px;
          padding: 3px;
          --cat-angle: 0deg;
          background: conic-gradient(
            from var(--cat-angle) at 50% 50%,
            transparent 0%,
            rgba(96, 128, 224, 0.0) 8%,
            rgba(96, 128, 224, 0.85) 18%,
            rgba(156, 165, 255, 1.0) 22%,
            rgba(96, 128, 224, 0.85) 28%,
            rgba(96, 128, 224, 0.0) 38%,
            transparent 100%
          );
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: exclude;
          -webkit-mask-composite: xor;
          animation: cat-sweep 5s linear infinite;
          z-index: 5;
          pointer-events: none;
        }

        /* Static border + breathing ambient glow */
        .cat-card-outer::after {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: 20px;
          border: 2px solid rgba(140, 168, 255, 0.14);
          animation: cat-breathe 4.5s ease-in-out infinite;
          z-index: 4;
          pointer-events: none;
        }

        /* Stagger sweep and glow per card for organic feel */
        .cat-grid .cat-card-outer:nth-child(2)::before { animation-delay: -1.7s; }
        .cat-grid .cat-card-outer:nth-child(3)::before { animation-delay: -3.3s; }
        .cat-grid .cat-card-outer:nth-child(2)::after  { animation-delay: -2.2s; }
        .cat-grid .cat-card-outer:nth-child(3)::after  { animation-delay: -1.1s; }

        @media (max-width: 768px) {
          .cat-grid { flex-direction: column; gap: 5vw; }
          .cat-card-outer { width: min(80vw, 320px); height: 52vw; min-height: 240px; }
        }
      `}</style>

      {/* Sticky viewport-pinned wrapper */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '36px',
          overflow: 'hidden',
          background: 'transparent',
        }}
      >
        {/* Section heading */}
        <div ref={headingRef} className="cat-hdg-wrap">
          <span className="cat-eyebrow">House of An</span>
          <h2 className="cat-hdg">
            {'COLLECTIONS'.split('').map((ch, i) => (
              <span key={i} className="cat-ch">
                {ch}
              </span>
            ))}
          </h2>
          <div className="cat-rule" />
        </div>

        {/* Cards grid */}
        <div className="cat-grid">
          {PANELS.map((panel, i) => (
            <div
              key={panel.num}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className="cat-card-outer"
            >
              <div className={`cat-float-${i}`} style={{width: '100%', height: '100%'}}>
                <div className="cat-card">
                  <img
                    src={panel.imgSrc}
                    alt={panel.tagline}
                    className="cat-img"
                    loading="eager"
                    draggable={false}
                  />
                  <div className="cat-vignette" />
                  <div className="cat-label">{panel.name}</div>
                  <a href={panel.href} className="cat-cta">
                    {panel.cta}
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
