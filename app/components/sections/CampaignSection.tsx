import {useEffect, useRef} from 'react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {campaignSectionState} from '~/lib/sceneState';

gsap.registerPlugin(ScrollTrigger);

export default function CampaignSection() {
  const sectionRef = useRef<HTMLElement>(null!);
  const card1Ref = useRef<HTMLDivElement>(null!);
  const card2Ref = useRef<HTMLDivElement>(null!);
  const card3Ref = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const card1 = card1Ref.current;
    const card2 = card2Ref.current;
    const card3 = card3Ref.current;

    // Depth layering: cards behind start slightly scaled down and shifted down
    gsap.set(card2, {scale: 0.97, y: 25});
    gsap.set(card3, {scale: 0.94, y: 45});

    // t=0→1: card1 exits alone -- cards 2 & 3 stay put, revealed as card1 slides away
    // t=1→2: card2 exits, card3 rises to focal (card3 behind card2 = correct z-order)
    const tl = gsap.timeline({paused: true});

    // Card 1 exits straight up; cards 2 and 3 do NOT move during this phase
    tl.to(card1, {y: '-110%', ease: 'none', duration: 1}, 0);

    // Card 2 exits (from its resting y:25 position upward)
    tl.to(card2, {y: '-110%', ease: 'none', duration: 1}, 1);

    // Card 3 rises to focal as card 2 exits (z:1 behind z:2 is intentional/correct)
    tl.to(card3, {scale: 1.0, y: 0, ease: 'none', duration: 1}, 1);

    const stateST = ScrollTrigger.create({
      trigger: section,
      start: 'top 80%',
      end: 'bottom 20%',
      onUpdate: (self) => {
        campaignSectionState.active = self.isActive;
        campaignSectionState.sectionProgress = self.progress;
      },
      onLeave: () => {
        campaignSectionState.active = false;
      },
      onLeaveBack: () => {
        campaignSectionState.active = false;
      },
    });

    const animST = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1,
      animation: tl,
    });

    return () => {
      stateST.kill();
      animST.kill();
      tl.kill();
      campaignSectionState.active = false;
      campaignSectionState.sectionProgress = 0;
    };
  }, []);

  return (
    <>
      <style>{`
        .campaign-section {
          position: relative;
          height: 600vh;
        }

        .campaign-visual {
          position: sticky;
          top: 0;
          height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 28px;
          overflow: visible;
        }

        .campaign-heading-wrap {
          text-align: center;
          cursor: default;
          user-select: none;
        }

        .campaign-eyebrow {
          font-family: var(--font-body, 'DM Sans', sans-serif);
          font-size: 9px;
          font-weight: 400;
          letter-spacing: 0.55em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.30);
          margin: 0 0 10px;
          transition: color 0.5s ease;
        }

        .campaign-heading-wrap:hover .campaign-eyebrow {
          color: rgba(255,255,255,0.55);
        }

        .campaign-heading {
          font-family: var(--font-display, 'Cormorant Garamond', serif);
          font-size: clamp(3rem, 5.5vw, 5rem);
          font-weight: 200;
          letter-spacing: 0.38em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.88);
          line-height: 1;
          margin: 0;
        }

        .campaign-ch {
          display: inline-block;
          transition: transform 0.38s cubic-bezier(0.34,1.56,0.64,1);
        }
        .campaign-ch:nth-child(1) { transition-delay:   0ms; }
        .campaign-ch:nth-child(2) { transition-delay:  35ms; }
        .campaign-ch:nth-child(3) { transition-delay:  70ms; }
        .campaign-ch:nth-child(4) { transition-delay: 105ms; }
        .campaign-ch:nth-child(5) { transition-delay: 140ms; }
        .campaign-ch:nth-child(6) { transition-delay: 175ms; }
        .campaign-ch:nth-child(7) { transition-delay: 210ms; }
        .campaign-ch:nth-child(8) { transition-delay: 245ms; }
        .campaign-heading-wrap:hover .campaign-ch { transform: translateY(-5px); }

        .campaign-heading-wrap:hover .campaign-heading {
          color: #ffffff;
        }

        .campaign-heading-rule {
          width: 0;
          height: 1px;
          background: rgba(255,255,255,0.28);
          margin: 14px auto 0;
          transition: width 0.65s cubic-bezier(0.25, 0, 0, 1);
        }

        .campaign-heading-wrap:hover .campaign-heading-rule {
          width: 44px;
        }

        /* Card stack container */
        .campaign-stack {
          position: relative;
          width: min(1100px, 90vw);
          height: min(640px, 72vh);
        }

        /* Base card */
        .campaign-card {
          position: absolute;
          inset: 0;
          border-radius: 14px;
          will-change: transform;
          overflow: hidden;
        }

        /* Card 1: top */
        .campaign-card-1 {
          z-index: 3;
          background: url('/lookbooktest.jpg') center / cover no-repeat;
          box-shadow:
            0 30px 80px rgba(0,0,0,0.55),
            0 6px 20px rgba(0,0,0,0.30);
        }

        /* Card 2: middle */
        .campaign-card-2 {
          z-index: 2;
          background: url('/lookbooktest.jpg') center / cover no-repeat;
          box-shadow:
            0 20px 60px rgba(0,0,0,0.45),
            0 4px 16px rgba(0,0,0,0.25);
        }

        /* Card 3: bottom */
        .campaign-card-3 {
          z-index: 1;
          background: url('/lookbooktest.jpg') center / cover no-repeat;
          box-shadow:
            0 12px 40px rgba(0,0,0,0.35),
            0 3px 12px rgba(0,0,0,0.20);
        }

        /* Bottom-left label */
        .campaign-card-label {
          position: absolute;
          bottom: 36px;
          left: 40px;
          line-height: 1;
        }

        .campaign-card-eyebrow {
          font-family: var(--font-body, 'DM Sans', sans-serif);
          font-size: 11px;
          font-weight: 300;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.30);
          margin-bottom: 8px;
        }

        .campaign-card-title {
          font-family: var(--font-display, 'Cormorant Garamond', serif);
          font-size: clamp(2rem, 4vw, 3.2rem);
          font-weight: 300;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.82);
          line-height: 1;
        }

        @media (max-width: 768px) {
          .campaign-stack {
            height: min(520px, 62vh);
          }
          .campaign-card-label {
            bottom: 24px;
            left: 24px;
          }
        }
      `}</style>

      <section
        ref={sectionRef}
        className="campaign-section"
        data-section="campaign"
      >
        <div className="campaign-visual">
          <div className="campaign-heading-wrap">
            <p className="campaign-eyebrow">The Visual</p>
            <h2 className="campaign-heading">
              {'LOOKBOOK'.split('').map((ch, i) => (
                <span key={i} className="campaign-ch">{ch}</span>
              ))}
            </h2>
            <div className="campaign-heading-rule" />
          </div>

          <div className="campaign-stack">
            {/* Card 3 -- bottom */}
            <div ref={card3Ref} className="campaign-card campaign-card-3">
              <div className="campaign-card-label">
                <div className="campaign-card-eyebrow">-- 03</div>
                <div className="campaign-card-title">Campaign 03</div>
              </div>
            </div>

            {/* Card 2 -- middle */}
            <div ref={card2Ref} className="campaign-card campaign-card-2">
              <div className="campaign-card-label">
                <div className="campaign-card-eyebrow">-- 02</div>
                <div className="campaign-card-title">Campaign 02</div>
              </div>
            </div>

            {/* Card 1 -- top */}
            <div ref={card1Ref} className="campaign-card campaign-card-1">
              <div className="campaign-card-label">
                <div className="campaign-card-eyebrow">-- 01</div>
                <div className="campaign-card-title">Campaign 01</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
