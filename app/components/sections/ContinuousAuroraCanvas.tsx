import {useEffect, useRef} from 'react';
import {
  campaignSectionState,
  lookbookSectionState,
} from '~/lib/sceneState';

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

type Ribbon = {
  yFrac: number;
  freq: number;
  phase: number;
  amp: number;
  alpha: number;
  color: string;
  speed: number;
};

const DESKTOP_RIBBONS: Ribbon[] = [
  {yFrac: 0.26, freq: 2.3, phase: 0.0, amp: 0.13, alpha: 0.36, color: '96,128,224', speed: 0.7},
  {yFrac: 0.44, freq: 1.7, phase: 1.4, amp: 0.15, alpha: 0.30, color: '138,176,208', speed: 1.0},
  {yFrac: 0.62, freq: 2.9, phase: 2.6, amp: 0.11, alpha: 0.34, color: '156,165,255', speed: 0.85},
  {yFrac: 0.78, freq: 2.1, phase: 3.9, amp: 0.12, alpha: 0.28, color: '108,148,232', speed: 0.9},
];

const MOBILE_RIBBONS: Ribbon[] = [
  {yFrac: 0.32, freq: 2.0, phase: 0.0, amp: 0.13, alpha: 0.36, color: '96,128,224', speed: 0.8},
  {yFrac: 0.58, freq: 2.4, phase: 1.7, amp: 0.12, alpha: 0.32, color: '156,165,255', speed: 0.9},
];

export default function ContinuousAuroraCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const floorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', {alpha: true});
    if (!ctx) return;

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const isMobile = window.innerWidth < 768;
    const ribbons = isMobile ? MOBILE_RIBBONS : DESKTOP_RIBBONS;
    const dpr = Math.min(isMobile ? 1 : 1.5, window.devicePixelRatio || 1);

    let width = 0;
    let height = 0;
    let rafId = 0;
    let running = false;

    function resize() {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function drawRibbon(r: Ribbon, phaseDriver: number, alpha: number) {
      const baseY = height * r.yFrac;
      const amp = height * r.amp;
      const phase = r.phase + phaseDriver * r.speed * 6.28;
      const a = r.alpha * alpha;

      if (a < 0.004) return;

      const g = ctx.createLinearGradient(0, baseY - amp, 0, baseY + amp);
      g.addColorStop(0, `rgba(${r.color},0)`);
      g.addColorStop(0.5, `rgba(${r.color},${a.toFixed(3)})`);
      g.addColorStop(1, `rgba(${r.color},0)`);
      ctx.fillStyle = g;

      ctx.beginPath();
      const steps = 56;
      for (let i = 0; i <= steps; i++) {
        const x = (i / steps) * width;
        const y =
          baseY +
          Math.sin(phase + (i / steps) * r.freq * Math.PI * 2) * amp * 0.95;
        if (i === 0) ctx.moveTo(x, y - amp);
        else ctx.lineTo(x, y - amp);
      }
      for (let i = steps; i >= 0; i--) {
        const x = (i / steps) * width;
        const y =
          baseY +
          Math.sin(phase + (i / steps) * r.freq * Math.PI * 2) * amp * 0.95;
        ctx.lineTo(x, y + amp);
      }
      ctx.closePath();
      ctx.fill();
    }

    function computeAlphaAndPhase() {
      const cAct = campaignSectionState.active;
      const lAct = lookbookSectionState.active;
      const cSp = campaignSectionState.sectionProgress;
      const lSp = lookbookSectionState.sectionProgress;

      // Campaign contribution: enter fade at its start, holds if lookbook active, otherwise holds to end.
      const campaignAlpha = cAct
        ? smoothstep(0, 0.10, cSp) * (lAct ? 1 : 1)
        : 0;

      // Lookbook contribution: enter is immediate if campaign was already feeding the canvas,
      // otherwise a soft fade-in. Exit fades to black for TestimonialsFooter handoff.
      const lookbookEnter = cAct ? 1 : smoothstep(0, 0.08, lSp);
      const lookbookExit = 1 - smoothstep(0.70, 0.92, lSp);
      const lookbookAlpha = lAct ? lookbookEnter * lookbookExit : 0;

      const alpha = Math.max(campaignAlpha, lookbookAlpha);

      // Phase driver: use whichever section is active for continuous motion.
      // Stitch lookbook scroll onto campaign so ribbons keep evolving across the seam.
      const phaseDriver = lAct ? 1 + lSp : cAct ? cSp : 0;

      return {alpha, phaseDriver, lSp, lAct};
    }

    function draw() {
      const {alpha, phaseDriver, lSp, lAct} = computeAlphaAndPhase();

      ctx.clearRect(0, 0, width, height);

      if (floorRef.current) {
        const floorRise = lAct ? smoothstep(0.55, 1, lSp) : 0;
        const op = lAct ? 0.55 + 0.45 * floorRise : 0;
        floorRef.current.style.opacity = op.toFixed(3);
        floorRef.current.style.backgroundPosition = `0% ${(100 - floorRise * 60).toFixed(1)}%`;
      }

      if (alpha < 0.003) return;

      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < ribbons.length; i++) drawRibbon(ribbons[i], phaseDriver, alpha);
      ctx.globalCompositeOperation = 'source-over';

      // Subtle inner glow pass for extra presence
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = `rgba(96,128,224,${(0.04 * alpha).toFixed(3)})`;
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'source-over';
    }

    function tick() {
      const anyActive =
        campaignSectionState.active || lookbookSectionState.active;
      if (!anyActive) {
        running = false;
        return;
      }
      draw();
      rafId = requestAnimationFrame(tick);
    }

    function start() {
      if (running || reducedMotion) return;
      running = true;
      rafId = requestAnimationFrame(tick);
    }

    function watchActive() {
      const anyActive =
        campaignSectionState.active || lookbookSectionState.active;
      if (anyActive && !running) start();
      if (!reducedMotion) setTimeout(watchActive, 200);
    }

    resize();
    draw();

    if (!reducedMotion) {
      window.addEventListener('resize', resize);
      watchActive();
    }

    return () => {
      cancelAnimationFrame(rafId);
      running = false;
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        ref={floorRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          background:
            'linear-gradient(180deg, transparent 0%, rgba(15,32,80,0.50) 55%, #000000 100%)',
          backgroundSize: '100% 200%',
          backgroundPosition: '0% 100%',
          opacity: 0,
          transition: 'none',
        }}
      />
    </>
  );
}
