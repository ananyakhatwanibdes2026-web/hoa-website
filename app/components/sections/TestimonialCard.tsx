import {useRef, useEffect} from 'react';
import gsap from 'gsap';

export const CARD_HEIGHT = 240;
export const CARD_WIDTH = 170;

export type CardConfig = {
  quote: string;
  author: string;
  stars?: number;
  tapeColor?: string;
  image?: string;
  x: number;
  rotate: number;
};

export default function TestimonialCard({
  quote,
  author,
  stars = 5,
  tapeColor = 'linear-gradient(135deg, rgba(140,165,225,0.55) 0%, rgba(100,132,210,0.40) 60%, rgba(140,165,225,0.55) 100%)',
  image,
  x,
  rotate,
}: CardConfig) {
  const cardRef = useRef<HTMLDivElement>(null!);
  const innerRef = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    const card = cardRef.current;
    const inner = innerRef.current;
    if (!card || !inner) return;

    gsap.set(card, {xPercent: -50, x, rotate, y: 0, scale: 1});

    const handleEnter = () => {
      card.style.zIndex = '10';
      gsap.to(card, {
        y: -(CARD_HEIGHT / 2 + 28),
        rotate: 0,
        scale: 1.07,
        duration: 0.58,
        ease: 'elastic.out(1, 0.45)',
        overwrite: true,
      });
      gsap.to(inner, {
        boxShadow:
          '0 16px 52px rgba(5, 12, 48, 0.65), 0 0 0 1px rgba(155, 188, 248, 0.32), 0 0 32px rgba(80, 130, 245, 0.18)',
        duration: 0.4,
        ease: 'power2.out',
        overwrite: true,
      });
    };

    const handleLeave = () => {
      gsap.to(card, {
        y: 0,
        rotate,
        scale: 1,
        duration: 0.38,
        ease: 'back.in(1.2)',
        overwrite: true,
        onComplete: () => {
          card.style.zIndex = '1';
        },
      });
      gsap.to(inner, {
        boxShadow:
          '0 6px 28px rgba(5, 10, 42, 0.60), 0 0 0 1px rgba(115, 142, 208, 0.13)',
        duration: 0.35,
        ease: 'power2.out',
        overwrite: true,
      });
    };

    card.addEventListener('pointerenter', handleEnter);
    card.addEventListener('pointerleave', handleLeave);

    return () => {
      card.removeEventListener('pointerenter', handleEnter);
      card.removeEventListener('pointerleave', handleLeave);
      gsap.killTweensOf(card);
      gsap.killTweensOf(inner);
    };
  }, [rotate, x]);

  return (
    <>
      <style>{`
        .tf-card .tf-card-content {
          opacity: 0;
          transition: opacity 0.32s ease;
        }
        .tf-card:hover .tf-card-content {
          opacity: 1;
        }
      `}</style>
    <div
      ref={cardRef}
      className="tf-card"
      style={{
        position: 'absolute',
        top: 0,
        left: '50%',
        width: `${CARD_WIDTH}px`,
        height: `${CARD_HEIGHT}px`,
        zIndex: 1,
        cursor: 'pointer',
        userSelect: 'none',
        willChange: 'transform',
      }}
    >

      {/* Dark chrome polaroid body */}
      <div
        ref={innerRef}
        style={{
          width: '100%',
          height: '100%',
          background: '#181c2e',
          padding: '8px 8px 34px 8px',
          borderRadius: '3px',
          boxShadow:
            '0 6px 28px rgba(5, 10, 42, 0.60), 0 0 0 1px rgba(115, 142, 208, 0.13)',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* Inner content area */}
        <div
          style={{
            flex: 1,
            background: image ? `#0c0f1e url(${image}) center/cover no-repeat` : '#0c0f1e',
            borderRadius: '1px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '14px 10px 10px',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {image && (
            <div
              aria-hidden
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(to bottom, rgba(12,15,30,0.55) 0%, rgba(12,15,30,0.10) 35%, rgba(12,15,30,0.10) 60%, rgba(12,15,30,0.82) 100%)',
                pointerEvents: 'none',
              }}
            />
          )}
          {/* Stars */}
          <div
            className="tf-card-content"
            style={{
              fontSize: '11px',
              color: 'rgba(198, 174, 88, 0.92)',
              letterSpacing: '3px',
              marginBottom: '10px',
              position: 'relative',
              zIndex: 1,
              textShadow: image ? '0 1px 6px rgba(0,0,0,0.65)' : undefined,
            }}
          >
            {'★'.repeat(Math.max(0, Math.min(5, stars)))}
          </div>

          {/* Quote -- Cormorant Garamond italic for luxury feel */}
          <p
            className="tf-card-content"
            style={{
              fontFamily: 'var(--font-display, "Cormorant Garamond", serif)',
              fontStyle: 'italic',
              fontWeight: 300,
              fontSize: '14px',
              lineHeight: 1.48,
              color: image ? 'rgba(240, 244, 255, 0.96)' : 'rgba(200, 208, 234, 0.88)',
              textAlign: 'center',
              margin: 0,
              position: 'relative',
              zIndex: 1,
              textShadow: image ? '0 1px 8px rgba(0,0,0,0.75)' : undefined,
            }}
          >
            &ldquo;{quote}&rdquo;
          </p>
        </div>

        {/* Author -- sits in the dark polaroid bottom strip */}
        <div
          className="tf-card-content"
          style={{
            position: 'absolute',
            bottom: '9px',
            left: 0,
            right: 0,
            textAlign: 'center',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-body, "DM Sans", sans-serif)',
              fontSize: '10px',
              fontWeight: 400,
              color: 'rgba(128, 145, 192, 0.65)',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}
          >
            {author}
          </span>
        </div>
      </div>
    </div>
    </>
  );
}
