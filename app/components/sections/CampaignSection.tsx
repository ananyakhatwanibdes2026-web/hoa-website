import {useEffect, useRef} from 'react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {campaignSectionState} from '~/lib/sceneState';

gsap.registerPlugin(ScrollTrigger);

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export default function CampaignSection() {
  const sectionRef = useRef<HTMLElement>(null!);
  const visualRef = useRef<HTMLDivElement>(null!);
  const headingRef = useRef<HTMLDivElement>(null!);
  const stackRef = useRef<HTMLDivElement>(null!);
  const card1Ref = useRef<HTMLDivElement>(null!);
  const card2Ref = useRef<HTMLDivElement>(null!);
  const card3Ref = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const card1 = card1Ref.current;
    const card2 = card2Ref.current;
    const card3 = card3Ref.current;

    // Initial states for intro -- heading and stack start invisible
    gsap.set(headingRef.current, {opacity: 0, y: 40});
    gsap.set(stackRef.current, {opacity: 0, y: 50});

    // Depth layering: cards behind start slightly scaled down and shifted down
    gsap.set(card2, {scale: 0.97, y: 25});
    gsap.set(card3, {scale: 0.94, y: 45});

    const tl = gsap.timeline({paused: true});

    // t=0→0.4: INTRO -- heading then card stack rise in
    tl.fromTo(
      headingRef.current,
      {opacity: 0, y: 40},
      {opacity: 1, y: 0, duration: 0.28, ease: 'power2.out'},
      0,
    );
    tl.fromTo(
      stackRef.current,
      {opacity: 0, y: 50},
      {opacity: 1, y: 0, duration: 0.35, ease: 'power2.out'},
      0.15,
    );

    // t=0.4→1.2: HOLD -- card1 sits at focal so user dwells on it before it moves
    tl.to({}, {duration: 0.8}, 0.4);

    // t=1.2→1.8: card1 exits alone -- cards 2 & 3 stay put, revealed as card1 slides away
    tl.to(card1, {y: '-110%', ease: 'none', duration: 0.6}, 1.2);

    // t=1.8→2.4: card2 exits, card3 rises to focal
    tl.to(card2, {y: '-110%', ease: 'none', duration: 0.6}, 1.8);
    tl.to(card3, {scale: 1.0, y: 0, ease: 'none', duration: 0.6}, 1.8);

    // t=2.4→3.2: HOLD -- card3 sits at focal so it reads before the fade
    tl.to({}, {duration: 0.8}, 2.4);

    const stateST = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        campaignSectionState.active = self.isActive;
        campaignSectionState.sectionProgress = self.progress;
        const sp = self.progress;
        // Widened exit ramp (was 0.95→1.0) so Campaign dissolves into Lookbook over ~75vh instead of 25vh.
        const envelope = smoothstep(0, 0.08, sp) * (1 - smoothstep(0.85, 1, sp));
        if (visualRef.current) {
          visualRef.current.style.opacity = envelope.toFixed(3);
        }
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
      scrub: 0.1,
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
          height: 500vh;
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
          background: url('/images/campaign/campaign1.png') center / cover no-repeat;
          box-shadow:
            0 30px 80px rgba(0,0,0,0.55),
            0 6px 20px rgba(0,0,0,0.30);
        }

        /* Card 2: middle */
        .campaign-card-2 {
          z-index: 2;
          background: url('/images/campaign/campaign2.png') center / cover no-repeat;
          box-shadow:
            0 20px 60px rgba(0,0,0,0.45),
            0 4px 16px rgba(0,0,0,0.25);
        }

        /* Card 3: bottom */
        .campaign-card-3 {
          z-index: 1;
          background: url('/images/campaign/campaign3.png') center / cover no-repeat;
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
        <div ref={visualRef} className="campaign-visual">
          <div ref={headingRef} className="campaign-heading-wrap" style={{position: 'relative', zIndex: 1}}>
            <p className="campaign-eyebrow">The Visual</p>
            <h2 className="campaign-heading">
              {'LOOKBOOK'.split('').map((ch, i) => (
                <span key={i} className="campaign-ch">{ch}</span>
              ))}
            </h2>
            <div className="campaign-heading-rule" />
          </div>

          <div ref={stackRef} className="campaign-stack" style={{position: 'relative', zIndex: 1}}>
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
