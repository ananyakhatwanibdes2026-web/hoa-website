import {useEffect, useRef} from 'react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {testimonialsSectionState} from '~/lib/sceneState';
import TestimonialCard, {CARD_HEIGHT, type CardConfig} from './TestimonialCard';
import FooterBlock from './FooterBlock';

gsap.registerPlugin(ScrollTrigger);

// ─── Card data (placeholder -- swap for real testimonials when received) ───────

const CARD_CONFIGS: CardConfig[] = [
  {
    quote: 'Got so many compliments at the party. People thought it was Tiffany!',
    author: 'Shreya M.',
    stars: 5,
    tapeColor:
      'linear-gradient(135deg, rgba(140,165,225,0.58) 0%, rgba(100,132,210,0.42) 60%, rgba(140,165,225,0.58) 100%)',
    x: -320,
    rotate: -8,
  },
  {
    quote: 'The packaging alone made me feel like royalty. The ring? Even better.',
    author: 'Priya K.',
    stars: 5,
    tapeColor:
      'linear-gradient(135deg, rgba(160,178,238,0.55) 0%, rgba(118,142,222,0.40) 60%, rgba(160,178,238,0.55) 100%)',
    x: -160,
    rotate: 5,
  },
  {
    quote: 'Wore it every day for 3 months and it still looks brand new. Obsessed.',
    author: 'Ananya R.',
    stars: 5,
    tapeColor:
      'linear-gradient(135deg, rgba(115,142,215,0.56) 0%, rgba(88,118,202,0.42) 60%, rgba(115,142,215,0.56) 100%)',
    x: 0,
    rotate: -3,
  },
  {
    quote: 'Literally the most beautiful thing I own. Worth every rupee.',
    author: 'Meera S.',
    stars: 5,
    tapeColor:
      'linear-gradient(135deg, rgba(160,178,238,0.55) 0%, rgba(118,142,222,0.40) 60%, rgba(160,178,238,0.55) 100%)',
    x: 160,
    rotate: 7,
  },
  {
    quote: 'Finally found jewellery that matches my energy. Bold, elegant, alive.',
    author: 'Divya P.',
    stars: 5,
    tapeColor:
      'linear-gradient(135deg, rgba(140,165,225,0.58) 0%, rgba(100,132,210,0.42) 60%, rgba(140,165,225,0.58) 100%)',
    x: 320,
    rotate: -6,
  },
];

const HALF_CARD = CARD_HEIGHT / 2;

export default function TestimonialsFooterSection() {
  const sectionRef = useRef<HTMLElement>(null!);
  const cardsStripRef = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    const section = sectionRef.current;
    const strip = cardsStripRef.current;
    if (!section || !strip) return;

    const ctx = gsap.context(() => {
      // ── SceneCanvas awareness ──────────────────────────────────────────────
      ScrollTrigger.create({
        trigger: section,
        start: 'top 80%',
        end: 'bottom 20%',
        onUpdate: (self) => {
          testimonialsSectionState.active = self.isActive;
          testimonialsSectionState.sectionProgress = self.progress;
        },
        onLeave: () => {
          testimonialsSectionState.active = false;
        },
        onLeaveBack: () => {
          testimonialsSectionState.active = false;
        },
      });

      // ── Heading word reveal ────────────────────────────────────────────────
      const words = section.querySelectorAll<HTMLElement>('.tf-hdg-word');
      if (words.length) {
        gsap.set(words, {y: 52, opacity: 0});
        gsap.to(words, {
          y: 0,
          opacity: 1,
          stagger: 0.14,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
        });
      }

      // ── Subtext slides in from the right ──────────────────────────────────
      const subtext = section.querySelector<HTMLElement>('.tf-subtext');
      if (subtext) {
        gsap.set(subtext, {x: 36, opacity: 0});
        gsap.to(subtext, {
          x: 0,
          opacity: 1,
          duration: 0.85,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 76%',
            toggleActions: 'play none none none',
          },
        });
      }

      // ── Cards stagger up from below ────────────────────────────────────────
      const cards = strip.querySelectorAll<HTMLElement>('.tf-card');
      if (cards.length) {
        gsap.fromTo(
          cards,
          {y: CARD_HEIGHT, opacity: 0},
          {
            y: 0,
            opacity: 1,
            stagger: 0.10,
            duration: 0.68,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 72%',
              toggleActions: 'play none none none',
            },
          },
        );
      }

      // ── Footer grid columns stagger in ────────────────────────────────────
      const footerCols = section.querySelectorAll<HTMLElement>('.tf-footer-grid > div');
      if (footerCols.length) {
        gsap.set(footerCols, {y: 48, opacity: 0});
        gsap.to(footerCols, {
          y: 0,
          opacity: 1,
          stagger: 0.09,
          duration: 0.75,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '.tf-footer',
            start: 'top 88%',
            toggleActions: 'play none none none',
          },
        });
      }

      // ── Footer bottom bar fades in ─────────────────────────────────────────
      const footerBottom = section.querySelector<HTMLElement>('.tf-footer-bottom');
      if (footerBottom) {
        gsap.set(footerBottom, {opacity: 0});
        gsap.to(footerBottom, {
          opacity: 1,
          duration: 0.9,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '.tf-footer',
            start: 'top 70%',
            toggleActions: 'play none none none',
          },
        });
      }
    }, section);

    return () => {
      ctx.revert();
      testimonialsSectionState.active = false;
      testimonialsSectionState.sectionProgress = 0;
    };
  }, []);

  return (
    <>
      <style>{`
        /* ─── Section reset ─────────────────────────────────────── */
        .tf-section {
          background: linear-gradient(to bottom, #b8bac6 0%, #68789a 38%, #263d6a 100%);
        }

        /* ─── Top content area ──────────────────────────────────── */
        .tf-top {
          padding: clamp(80px, 10vw, 120px) clamp(24px, 5vw, 80px) 0;
          padding-bottom: calc(${HALF_CARD}px + 56px);
        }

        .tf-top-inner {
          display: flex;
          flex-direction: row;
          align-items: flex-start;
          justify-content: space-between;
          gap: clamp(20px, 4vw, 60px);
          max-width: 1400px;
          margin: 0 auto;
        }

        .tf-heading {
          font-family: var(--font-display, 'Cormorant Garamond', serif);
          font-size: clamp(3rem, 7.5vw, 7.5rem);
          font-weight: 600;
          line-height: 0.92;
          letter-spacing: 0.01em;
          color: rgba(22, 28, 52, 0.92);
          margin: 0;
          flex: 0 0 auto;
        }

        /* Steel-blue italic accent for "love." */
        .tf-heading-italic {
          font-style: italic;
          font-weight: 300;
          color: rgba(38, 62, 112, 0.88);
        }

        .tf-subtext {
          font-family: var(--font-body, 'DM Sans', sans-serif);
          font-size: clamp(13px, 1.2vw, 16px);
          font-weight: 300;
          line-height: 1.75;
          color: rgba(35, 48, 82, 0.60);
          max-width: 320px;
          margin: 0;
          padding-top: 0.6em;
          flex: 0 1 360px;
          text-align: right;
        }

        /* ─── Cards strip ───────────────────────────────────────── */
        .tf-cards-strip {
          position: relative;
          height: ${CARD_HEIGHT}px;
          overflow: visible;
          margin-top: -${HALF_CARD}px;
        }

        /* Mobile */
        @media (max-width: 768px) {
          .tf-cards-strip {
            display: flex;
            align-items: center;
            justify-content: center;
            overflow-x: auto;
            overflow-y: visible;
            gap: 8px;
            padding: 0 16px;
            margin-top: 0;
            margin-bottom: 40px;
          }

          .tf-top {
            padding-bottom: clamp(24px, 4vw, 40px);
          }

          .tf-top-inner {
            flex-direction: column;
            gap: 16px;
          }

          .tf-subtext {
            text-align: left;
          }

          .tf-card {
            position: relative !important;
            left: auto !important;
            top: auto !important;
            flex-shrink: 0;
            transform: none !important;
          }
        }
      `}</style>

      <section
        ref={sectionRef}
        className="tf-section"
        data-section="testimonials-footer"
      >
        {/* ── Top content ──────────────────────────────────────── */}
        <div className="tf-top">
          <div className="tf-top-inner">
            {/* Left: heading with per-word reveal */}
            <h2 className="tf-heading">
              <span className="tf-hdg-word">Words</span>{' '}
              <span className="tf-hdg-word">of</span>
              <br />
              <span className="tf-hdg-word tf-heading-italic">love.</span>
            </h2>

            {/* Right: descriptor */}
            <p className="tf-subtext">
              Real words from real people who chose to wear something
              that says a little more. Every stone. Every curve.
              Every story.
            </p>
          </div>
        </div>

        {/* ── Scattered cards strip ────────────────────────────── */}
        <div ref={cardsStripRef} className="tf-cards-strip">
          {CARD_CONFIGS.map((cfg, i) => (
            <TestimonialCard key={i} {...cfg} />
          ))}
        </div>

        {/* ── Footer ───────────────────────────────────────────── */}
        <FooterBlock />
      </section>

      <style>{`
        .tf-section .tf-footer {
          margin-top: -${HALF_CARD}px;
        }

        @media (max-width: 768px) {
          .tf-section .tf-footer {
            margin-top: 0;
          }
        }
      `}</style>
    </>
  );
}
