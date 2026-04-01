import {useEffect, useRef} from 'react';

// Dot snaps directly to the mouse.
// Ring follows with a lerp lag, expands on hover over interactive elements.
// 6-dot silver trail spawns on movement.

const RING_LERP = 0.11;
const TRAIL_COUNT = 6;

export function ChromeCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringPosRef = useRef<HTMLDivElement>(null);
  const ringVisRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Touch devices: don't run
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const mouse = {x: -300, y: -300};
    const ringPos = {x: -300, y: -300};
    let isHovering = false;
    let isVisible = false;
    let rafId = 0;

    // Trail pool
    const trail = Array.from({length: TRAIL_COUNT}, () => {
      const el = document.createElement('div');
      el.style.cssText = [
        'position:fixed',
        'top:0',
        'left:0',
        'width:3px',
        'height:3px',
        'margin:-1.5px 0 0 -1.5px',
        'border-radius:50%',
        'background:rgba(195,195,215,0.75)',
        'pointer-events:none',
        'z-index:9996',
        'opacity:0',
        'will-change:transform,opacity',
      ].join(';');
      document.body.appendChild(el);
      return {el, x: -300, y: -300, opacity: 0};
    });
    let trailIdx = 0;
    let lastSpawnX = -300;
    let lastSpawnY = -300;

    document.body.style.cursor = 'none';

    const revealCursor = () => {
      if (dotRef.current) dotRef.current.style.opacity = '1';
      if (ringPosRef.current) ringPosRef.current.style.opacity = '1';
    };

    const onMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;

      // Hover detection on every move — cheapest accurate approach
      const target = e.target as HTMLElement;
      isHovering = !!target.closest('a, button, [role="button"], input, textarea, select');

      if (!isVisible) {
        isVisible = true;
        ringPos.x = e.clientX;
        ringPos.y = e.clientY;
        lastSpawnX = e.clientX;
        lastSpawnY = e.clientY;
        revealCursor();
      }
    };

    const animate = () => {
      // Ring: lerp toward mouse
      ringPos.x += (mouse.x - ringPos.x) * RING_LERP;
      ringPos.y += (mouse.y - ringPos.y) * RING_LERP;

      // Dot: snap to mouse
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${mouse.x}px,${mouse.y}px)`;
        // Slight scale-up on hover
        dotRef.current.style.transform += isHovering ? ' scale(1.5)' : ' scale(1)';
      }

      // Ring position (no transition — set every frame)
      if (ringPosRef.current) {
        ringPosRef.current.style.transform = `translate(${ringPos.x}px,${ringPos.y}px)`;
      }

      // Ring visual: CSS transition handles scale + color changes smoothly
      if (ringVisRef.current) {
        ringVisRef.current.style.transform = isHovering ? 'scale(1.65)' : 'scale(1)';
        ringVisRef.current.style.borderColor = isHovering
          ? 'rgba(215,215,235,0.70)'
          : 'rgba(185,185,210,0.40)';
        // Subtle fill on hover
        ringVisRef.current.style.background = isHovering
          ? 'rgba(200,200,220,0.06)'
          : 'transparent';
      }

      // Trail: spawn every 12px of movement
      if (isVisible) {
        const dx = mouse.x - lastSpawnX;
        const dy = mouse.y - lastSpawnY;
        if (dx * dx + dy * dy > 144) {
          const t = trail[trailIdx % TRAIL_COUNT];
          t.x = mouse.x;
          t.y = mouse.y;
          t.opacity = 0.52;
          trailIdx++;
          lastSpawnX = mouse.x;
          lastSpawnY = mouse.y;
        }
      }

      // Trail decay
      for (const t of trail) {
        t.opacity = Math.max(0, t.opacity - 0.038);
        t.el.style.transform = `translate(${t.x}px,${t.y}px)`;
        t.el.style.opacity = t.opacity.toFixed(3);
      }

      rafId = requestAnimationFrame(animate);
    };

    document.addEventListener('mousemove', onMouseMove);
    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener('mousemove', onMouseMove);
      document.body.style.cursor = '';
      trail.forEach((t) => t.el.remove());
    };
  }, []);

  return (
    <>
      {/* Chrome dot — follows cursor exactly */}
      <div
        ref={dotRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '7px',
          height: '7px',
          marginTop: '-3.5px',
          marginLeft: '-3.5px',
          borderRadius: '50%',
          background: 'rgba(208,208,228,0.92)',
          boxShadow: '0 0 6px rgba(190,190,218,0.55)',
          pointerEvents: 'none',
          zIndex: 9999,
          opacity: 0,
          willChange: 'transform',
          transition: 'transform 0.12s ease',
        }}
      />

      {/* Ring position tracker — no CSS transition, updated every RAF frame */}
      <div
        ref={ringPosRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          zIndex: 9998,
          opacity: 0,
          willChange: 'transform',
        }}
      >
        {/* Visual ring — CSS transition only for scale, color, background */}
        <div
          ref={ringVisRef}
          style={{
            width: '28px',
            height: '28px',
            marginTop: '-14px',
            marginLeft: '-14px',
            borderRadius: '50%',
            border: '1px solid rgba(185,185,210,0.40)',
            background: 'transparent',
            transformOrigin: 'center center',
            transition:
              'transform 0.28s cubic-bezier(0.25,0.46,0.45,0.94), border-color 0.25s ease, background 0.25s ease',
          }}
        />
      </div>
    </>
  );
}
