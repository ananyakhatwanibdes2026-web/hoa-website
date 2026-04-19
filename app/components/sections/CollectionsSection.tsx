import { useState, useEffect, useRef, Suspense, lazy } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { collectionsSectionState } from '~/lib/sceneState';

gsap.registerPlugin(ScrollTrigger);

const CollectionsCanvas = lazy(() => import('./CollectionsCanvas'));

function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? <>{children}</> : null;
}

function clamp01(v: number) { return Math.max(0, Math.min(1, v)); }
function smoothstep(e0: number, e1: number, x: number) {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
}

const ENTRANCE_END   = 0.15;
const SHATTER_START  = 0.85;

export default function CollectionsSection() {
  const sectionRef = useRef<HTMLElement>(null!);
  const labelRef   = useRef<HTMLDivElement>(null!);
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // ScrollTrigger — drives collectionsSectionState + HTML label
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    // Section awareness
    const awareness = ScrollTrigger.create({
      trigger: el,
      start: 'top 80%',
      end: 'bottom 20%',
      onToggle: (self) => {
        collectionsSectionState.active = self.isActive;
      },
    });

    // Main scrub animation
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1,
      onUpdate: (self) => {
        const sp = self.progress;
        collectionsSectionState.sectionProgress = sp;
        collectionsSectionState.entranceProgress = Math.min(1, sp / ENTRANCE_END);
        collectionsSectionState.shatterProgress  = Math.max(0, (sp - SHATTER_START) / (1 - SHATTER_START));

        // HTML label fade: appears at end of entrance, disappears before shatter completes
        const labelIn  = smoothstep(0.85, 1.0, collectionsSectionState.entranceProgress);
        const labelOut = Math.max(0, 1.0 - collectionsSectionState.shatterProgress / 0.5);
        if (labelRef.current) {
          labelRef.current.style.opacity = String(labelIn * labelOut);
        }
      },
    });

    return () => {
      awareness.kill();
      st.kill();
      // Reset state on unmount
      collectionsSectionState.active = false;
      collectionsSectionState.sectionProgress = 0;
      collectionsSectionState.entranceProgress = 0;
      collectionsSectionState.shatterProgress = 0;
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      style={{
        height: '400vh',
        position: 'relative',
        zIndex: 2,
        marginTop: '-80vh',
      }}
    >
      {/* Sticky viewport — pinned while 400vh scrolls past */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        {/* R3F Canvas — fills the sticky viewport */}
        <div style={{ position: 'absolute', inset: 0 }}>
          <ClientOnly>
            <Suspense fallback={null}>
              <CollectionsCanvas isMobile={isMobile} />
            </Suspense>
          </ClientOnly>
        </div>

        {/* HTML overlay — "THE COLLECTIONS" label */}
        <div
          ref={labelRef}
          style={{
            position: 'absolute',
            top: '6%',
            left: 0,
            right: 0,
            textAlign: 'center',
            opacity: 0,
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          <div
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 400,
              fontSize: '0.68rem',
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.75)',
              lineHeight: 1,
            }}
          >
            THE COLLECTIONS
          </div>
          <div
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 300,
              fontSize: '0.55rem',
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.40)',
              marginTop: '0.5rem',
            }}
          >
            EXPLORE THE EDIT
          </div>
        </div>
      </div>
    </section>
  );
}
