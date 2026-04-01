import {useEffect, useRef} from 'react';

const VELOCITY_LERP = 0.1;
const TRAIL_COUNT = 14;
const STYLE_ID = 'chrome-cursor-kf';

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function ChromeCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return;

    // Inject shimmer keyframes once
    if (!document.getElementById(STYLE_ID)) {
      const s = document.createElement('style');
      s.id = STYLE_ID;
      s.textContent = `
        @keyframes cursor-glow {
          0%   { filter: drop-shadow(0 0 4px rgba(155,65,255,0.9)); }
          20%  { filter: drop-shadow(0 0 4px rgba(255,65,25,0.8)); }
          40%  { filter: drop-shadow(0 0 4px rgba(255,180,30,0.7)); }
          60%  { filter: drop-shadow(0 0 4px rgba(25,190,165,0.8)); }
          80%  { filter: drop-shadow(0 0 4px rgba(45,120,255,0.9)); }
          100% { filter: drop-shadow(0 0 4px rgba(155,65,255,0.9)); }
        }
        .chr-stroke {
          animation: chr-stroke 4s linear infinite;
        }
        @keyframes chr-stroke {
          0%   { stroke: #9840ef; }
          20%  { stroke: #ef4018; }
          40%  { stroke: #efaa18; }
          60%  { stroke: #18b89a; }
          80%  { stroke: #1868ef; }
          100% { stroke: #9840ef; }
        }
      `;
      document.head.appendChild(s);
    }

    const mousePos = {x: -200, y: -200};
    const prevMouse = {x: -200, y: -200};
    const velocity = {lerpAngle: 0, speed: 0};
    let tiltDeg = 0;
    let rafId = 0;
    let isVisible = false;

    // ---------------------------------------------------------------------------
    // Trail pool
    // ---------------------------------------------------------------------------
    const trail = Array.from({length: TRAIL_COUNT}, () => ({
      el: null as HTMLDivElement | null,
      x: -200,
      y: -200,
      opacity: 0,
    }));
    trail.forEach((t) => {
      const div = document.createElement('div');
      div.style.cssText = [
        'position:fixed',
        'top:0',
        'left:0',
        'width:9px',
        'height:9px',
        'margin:-4.5px 0 0 -4.5px',
        'border-radius:50%',
        'background:rgba(140,100,220,0.04)',
        'border:0.5px solid rgba(140,100,230,0.14)',
        'backdrop-filter:blur(4px)',
        '-webkit-backdrop-filter:blur(4px)',
        'pointer-events:none',
        'z-index:9997',
        'opacity:0',
        'will-change:transform,opacity',
      ].join(';');
      document.body.appendChild(div);
      t.el = div;
    });
    let trailIdx = 0;
    let lastSpawnX = -200;
    let lastSpawnY = -200;

    document.body.style.cursor = 'none';

    const onMouseMove = (e: MouseEvent) => {
      mousePos.x = e.clientX;
      mousePos.y = e.clientY;
      if (!isVisible) {
        isVisible = true;
        prevMouse.x = e.clientX;
        prevMouse.y = e.clientY;
        lastSpawnX = e.clientX;
        lastSpawnY = e.clientY;
        if (cursorRef.current) cursorRef.current.style.opacity = '1';
      }
    };

    const animate = () => {
      const dx = mousePos.x - prevMouse.x;
      const dy = mousePos.y - prevMouse.y;
      const speed = Math.sqrt(dx * dx + dy * dy);
      const rawAngle = speed > 0.5 ? Math.atan2(dy, dx) : velocity.lerpAngle;

      velocity.speed = lerp(velocity.speed, speed, VELOCITY_LERP);
      velocity.lerpAngle = lerp(velocity.lerpAngle, rawAngle, VELOCITY_LERP);

      prevMouse.x = mousePos.x;
      prevMouse.y = mousePos.y;

      // Subtle tilt in movement direction — max ±14 deg
      const targetTilt = Math.max(
        -14,
        Math.min(14, ((velocity.lerpAngle * 180) / Math.PI) * 0.14),
      );
      tiltDeg = lerp(tiltDeg, targetTilt, 0.08);

      // Tip of SVG arrow is at (2, 1) — offset translate so tip = mouse pos
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${mousePos.x - 2}px, ${mousePos.y - 1}px) rotate(${tiltDeg.toFixed(2)}deg)`;
      }

      // Spawn trail drop every 8px of movement
      if (isVisible) {
        const sdx = mousePos.x - lastSpawnX;
        const sdy = mousePos.y - lastSpawnY;
        if (sdx * sdx + sdy * sdy > 64) {
          const t = trail[trailIdx % TRAIL_COUNT];
          t.x = mousePos.x;
          t.y = mousePos.y;
          t.opacity = 0.68;
          trailIdx++;
          lastSpawnX = mousePos.x;
          lastSpawnY = mousePos.y;
        }
      }

      // Decay trail
      for (const t of trail) {
        t.opacity = Math.max(0, t.opacity - 0.025);
        if (t.el) {
          t.el.style.transform = `translate(${t.x}px,${t.y}px)`;
          t.el.style.opacity = t.opacity.toFixed(3);
        }
      }

      rafId = requestAnimationFrame(animate);
    };

    document.addEventListener('mousemove', onMouseMove);
    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener('mousemove', onMouseMove);
      document.body.style.cursor = '';
      trail.forEach((t) => t.el?.remove());
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 9999,
        opacity: 0,
        willChange: 'transform',
        transformOrigin: '2px 1px',
        animation: 'cursor-glow 4s linear infinite',
      }}
    >
      <svg
        width="22"
        height="31"
        viewBox="0 0 22 31"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Arrow body — dark liquid metal fill + iridescent animated stroke */}
        <path
          className="chr-stroke"
          d="M2,1 L2,26 L8,20 L12.5,29 L15.5,27.5 L11.5,18.5 L19.5,18.5 Z"
          fill="#06060e"
          strokeWidth="1.35"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Left-edge chrome highlight */}
        <path
          d="M3.5,4 L3.5,22 L8.5,17"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="0.7"
          strokeLinecap="round"
        />
        {/* Tip glint */}
        <path
          d="M4.5,1.5 L2.5,5"
          fill="none"
          stroke="rgba(255,255,255,0.22)"
          strokeWidth="0.9"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
