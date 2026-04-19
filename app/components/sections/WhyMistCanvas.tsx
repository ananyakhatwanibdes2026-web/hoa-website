import {useEffect, useRef} from 'react';
import {whySectionState} from '~/lib/sceneState';

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

type Blob = {
  fx: number;
  fy: number;
  ax: number;
  ay: number;
  phase: number;
  baseR: number;
  color: string;
};

const DESKTOP_BLOBS: Blob[] = [
  {fx: 0.30, fy: 0.40, ax: 0.18, ay: 0.22, phase: 0.0, baseR: 0.34, color: '140,170,240'},
  {fx: 0.70, fy: 0.55, ax: 0.22, ay: 0.18, phase: 1.7, baseR: 0.38, color: '138,176,208'},
  {fx: 0.50, fy: 0.25, ax: 0.28, ay: 0.16, phase: 3.1, baseR: 0.26, color: '156,165,255'},
];

const MOBILE_BLOBS: Blob[] = [
  {fx: 0.35, fy: 0.45, ax: 0.22, ay: 0.22, phase: 0.0, baseR: 0.42, color: '140,170,240'},
  {fx: 0.65, fy: 0.55, ax: 0.22, ay: 0.22, phase: 2.2, baseR: 0.40, color: '138,176,208'},
];

export default function WhyMistCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', {alpha: true});
    if (!ctx) return;

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const isMobile = window.innerWidth < 768;
    const blobs = isMobile ? MOBILE_BLOBS : DESKTOP_BLOBS;
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

    function draw() {
      const sp = whySectionState.sectionProgress;
      const enter = smoothstep(0, 0.12, sp);
      const exit = 1 - smoothstep(0.88, 1, sp);
      const alpha = enter * exit;

      ctx.clearRect(0, 0, width, height);
      if (alpha < 0.002) return;

      ctx.globalCompositeOperation = 'lighter';

      const t = sp * 6.28;
      const rScale = Math.min(width, height);

      for (let i = 0; i < blobs.length; i++) {
        const b = blobs[i];
        const cx = width * (b.fx + b.ax * Math.sin(t * 0.6 + b.phase));
        const cy = height * (b.fy + b.ay * Math.cos(t * 0.4 + b.phase * 1.3));
        const radius = rScale * (b.baseR + 0.08 * Math.sin(t * 0.8 + b.phase));
        const coreAlpha = (0.12 + 0.06 * Math.sin(t * 0.5 + b.phase)) * alpha;

        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        g.addColorStop(0, `rgba(${b.color},${coreAlpha.toFixed(3)})`);
        g.addColorStop(0.55, `rgba(${b.color},${(coreAlpha * 0.35).toFixed(3)})`);
        g.addColorStop(1, `rgba(${b.color},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = 'source-over';
    }

    function tick() {
      if (!whySectionState.active) {
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
      if (whySectionState.active && !running) start();
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
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
      aria-hidden="true"
    />
  );
}
