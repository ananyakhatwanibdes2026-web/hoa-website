import {useEffect, useRef} from 'react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {lookbookSectionState} from '~/lib/sceneState';

gsap.registerPlugin(ScrollTrigger);

const PLACEHOLDER_COLORS = [
  '#2a1f1a',
  '#1f2a2a',
  '#2a2a1f',
  '#2a1f2a',
  '#1f1f2a',
  '#2a2218',
];

const IMAGE_COUNT = 6;

const LOOKBOOK_IMAGES = [
  '/images/lookbook/lookbook1.png',
  '/images/lookbook/lookbook2.png',
  '/images/lookbook/lookbook3.png',
  '/images/lookbook/lookbook4.png',
  '/images/lookbook/lookbook5.png',
  '/images/lookbook/lookbook6.png',
];

function offsetScale(offset: number): number {
  const abs = Math.abs(offset);
  if (abs === 0) return 1.0;
  if (abs === 1) return 0.42;
  if (abs === 2) return 0.30;
  return 0.20;
}

function offsetOpacity(offset: number): number {
  if (offset === 0) return 1.0;
  // Past (left): stay visible while in-frame, fade only as image exits left edge
  if (offset < 0) {
    if (offset === -1) return 0.85;
    if (offset === -2) return 0.70;
    return 0.10;
  }
  // Upcoming (right)
  if (offset === 1) return 0.55;
  if (offset === 2) return 0.35;
  return 0.20;
}

export default function LookbookSection() {
  const sectionRef = useRef<HTMLElement>(null!);
  const visualRef = useRef<HTMLDivElement>(null!);
  const galleryRef = useRef<HTMLDivElement>(null!);
  const imgRefs = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    const visual = visualRef.current;
    const gallery = galleryRef.current;
    const imgs = imgRefs.current;
    if (!section || !visual || !gallery || imgs.length < IMAGE_COUNT) return;

    // Gallery is now full-viewport width.
    // FOCAL_SHIFT moves the focal image to the right of center (60% from left),
    // leaving the left portion for past images to travel through.
    const galleryW = gallery.offsetWidth;
    const STRIDE = galleryW * 0.32;
    const LEFT_STRIDE = galleryW * 0.18;
    const FOCAL_SHIFT = galleryW * 0.10;
    const offsetX = (off: number) =>
      FOCAL_SHIFT + (off >= 0 ? off * STRIDE : off * LEFT_STRIDE);

    // Center all images at gallery center, then apply focal shift + offset
    gsap.set(imgs, {xPercent: -50, yPercent: -50});

    for (let i = 0; i < IMAGE_COUNT; i++) {
      gsap.set(imgs[i], {
        x: offsetX(i),
        scale: offsetScale(i),
        opacity: offsetOpacity(i),
      });
    }

    const tl = gsap.timeline({paused: true});

    for (let t = 0; t < IMAGE_COUNT - 1; t++) {
      for (let i = 0; i < IMAGE_COUNT; i++) {
        const endOffset = i - (t + 1);
        tl.to(
          imgs[i],
          {
            x: offsetX(endOffset),
            scale: offsetScale(endOffset),
            opacity: offsetOpacity(endOffset),
            ease: 'none',
            duration: 1,
          },
          t,
        );
      }
    }

    const stateST = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        lookbookSectionState.active = self.isActive;
        lookbookSectionState.sectionProgress = self.progress;
      },
      onLeave: () => {
        lookbookSectionState.active = false;
      },
      onLeaveBack: () => {
        lookbookSectionState.active = false;
      },
    });

    // Section is 920vh. 180vh pre-roll (image 1 static) then 740vh animation
    // running to the section bottom — 5 swaps × 148vh each, power2.inOut ease.
    // No post-roll: image 6 reaches focal at the section end so footer rises
    // immediately. scrub:0.6 keeps fast scrolls smooth.
    const animST = ScrollTrigger.create({
      trigger: section,
      start: 'top+=90vh top',
      end: 'bottom bottom',
      scrub: 0.25,
      animation: tl,
    });

    return () => {
      stateST.kill();
      animST.kill();
      tl.kill();
      lookbookSectionState.active = false;
      lookbookSectionState.sectionProgress = 0;
    };
  }, []);

  return (
    <>
      <style>{`
        @property --lookbook-angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }

        .lookbook-section {
          position: relative;
          height: 550vh;
        }

        /* Sticky viewport -- gallery fills it entirely, text floats above */
        .lookbook-visual {
          position: sticky;
          top: 0;
          height: 100vh;
          overflow: hidden;
          background-color: transparent;
        }

        /* Text floats top-left as an overlay */
        .lookbook-left {
          position: absolute;
          top: clamp(48px, 8vh, 96px);
          left: clamp(32px, 5vw, 80px);
          z-index: 3;
          pointer-events: none;
        }

        .lookbook-eyebrow {
          font-family: var(--font-body, 'DM Sans', sans-serif);
          font-size: clamp(10px, 1vw, 13px);
          font-weight: 300;
          letter-spacing: 0.35em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.45);
          margin-bottom: 10px;
        }

        .lookbook-heading {
          font-family: var(--font-display, 'Cormorant Garamond', serif);
          font-size: clamp(2rem, 3.5vw, 3.8rem);
          font-weight: 700;
          font-style: italic;
          line-height: 1.05;
          color: rgba(255,255,255,0.90);
          text-shadow: 0 0 40px rgba(255,255,255,0.12);
          margin: 0;
        }

        .lookbook-rule {
          width: 44px;
          height: 1px;
          background: rgba(255,255,255,0.28);
          margin-top: 18px;
        }

        /* Gallery covers full sticky viewport -- images clip at edges here */
        .lookbook-gallery {
          position: absolute;
          inset: 0;
          z-index: 2;
        }

        /* Each image: absolutely centered, GSAP drives x/scale/opacity */
        .lookbook-img {
          position: absolute;
          top: 50%;
          left: 50%;
          width: clamp(260px, 30vw, 460px);
          height: clamp(360px, 72vh, 660px);
          border-radius: 8px;
          background-size: cover;
          background-position: center;
          transform-origin: center center;
          will-change: transform, opacity;
        }

        /* Fixed focal frame -- stays at the focal image position while images scroll through it */
        .lookbook-frame {
          position: absolute;
          top: 50%;
          left: calc(50% + 10vw);
          width: clamp(260px, 30vw, 460px);
          height: clamp(360px, 72vh, 660px);
          transform: translate(-50%, -50%);
          border-radius: 8px;
          border: 4px solid rgba(140, 168, 255, 0.18);
          pointer-events: none;
          z-index: 4;
          animation: lookbook-frame-breathe 4s ease-in-out infinite;
        }

        /* Traveling conic-gradient sweep around the border */
        .lookbook-frame::before {
          content: '';
          position: absolute;
          inset: -5px;
          border-radius: 13px;
          padding: 5px;
          --lookbook-angle: 0deg;
          background: conic-gradient(
            from var(--lookbook-angle) at 50% 50%,
            transparent 0%,
            rgba(96, 128, 224, 0.0) 10%,
            rgba(96, 128, 224, 0.82) 20%,
            rgba(156, 165, 255, 1.0) 25%,
            rgba(96, 128, 224, 0.82) 30%,
            rgba(96, 128, 224, 0.0) 40%,
            transparent 100%
          );
          -webkit-mask:
            linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
          mask-composite: exclude;
          -webkit-mask-composite: xor;
          animation: lookbook-sweep 3.5s linear infinite;
        }

@keyframes lookbook-sweep {
          to { --lookbook-angle: 360deg; }
        }

        @keyframes lookbook-frame-breathe {
          0%, 100% {
            box-shadow:
              0 0 20px 2px rgba(80, 120, 220, 0.08),
              0 0 50px 10px rgba(80, 120, 220, 0.04);
            border-color: rgba(140, 168, 255, 0.15);
          }
          50% {
            box-shadow:
              0 0 28px 5px rgba(96, 144, 255, 0.20),
              0 0 65px 16px rgba(96, 144, 255, 0.10);
            border-color: rgba(156, 165, 255, 0.42);
          }
        }

        /* Scroll hint */
        .lookbook-hint {
          position: absolute;
          bottom: 32px;
          left: 50%;
          transform: translateX(-50%);
          font-family: var(--font-body, 'DM Sans', sans-serif);
          font-size: 10px;
          font-weight: 300;
          letter-spacing: 0.35em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.30);
          white-space: nowrap;
          pointer-events: none;
        }

        @media (max-width: 768px) {
          .lookbook-img {
            width: clamp(220px, 68vw, 360px);
            height: clamp(300px, 58vh, 500px);
          }
          .lookbook-frame {
            width: clamp(220px, 68vw, 360px);
            height: clamp(300px, 58vh, 500px);
          }
        }
      `}</style>

      <section
        ref={sectionRef}
        className="lookbook-section"
        data-section="lookbook"
      >
        <div ref={visualRef} className="lookbook-visual">
          {/* Text overlay -- floats top-left above the gallery */}
          <div className="lookbook-left">
            <p className="lookbook-eyebrow">The Collection</p>
            <h2 className="lookbook-heading">
              SO
              <br />
              PORTABLE,
              <br />
              it&apos;s wearable
            </h2>
            <div className="lookbook-rule" />
          </div>

          {/* Full-viewport gallery -- images travel all the way to left edge */}
          <div ref={galleryRef} className="lookbook-gallery">
            {Array.from({length: IMAGE_COUNT}, (_, i) => (
              <div
                key={i}
                ref={(el) => {
                  if (el) imgRefs.current[i] = el;
                }}
                className="lookbook-img"
                style={{
                  backgroundImage: `url('${LOOKBOOK_IMAGES[i]}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
            ))}
          </div>

          <div className="lookbook-frame" />

          <div className="lookbook-hint">Scroll to continue</div>
        </div>
      </section>
    </>
  );
}
