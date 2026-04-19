import {useEffect, useRef} from 'react';
import {categoriesSectionState} from '~/lib/sceneState';

const DESKTOP_NODE_COUNT = 60;
const MOBILE_NODE_COUNT = 25;

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

type Node = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
};

export default function CategoriesWeaveCanvas() {
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
    const nodeCount = isMobile ? MOBILE_NODE_COUNT : DESKTOP_NODE_COUNT;
    const dpr = Math.min(isMobile ? 1 : 1.5, window.devicePixelRatio || 1);

    let width = 0;
    let height = 0;
    const nodes: Node[] = [];
    const mouse = {x: 0, y: 0, tx: 0, ty: 0};
    let rafId = 0;
    let running = false;

    function resize() {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function seedNodes() {
      nodes.length = 0;
      for (let i = 0; i < nodeCount; i++) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.12,
          vy: (Math.random() - 0.5) * 0.12,
          r: 0.9 + Math.random() * 1.4,
        });
      }
    }

    function onMouseMove(e: MouseEvent) {
      mouse.tx = (e.clientX / window.innerWidth - 0.5) * 20;
      mouse.ty = (e.clientY / window.innerHeight - 0.5) * 20;
    }

    function draw() {
      const sp = categoriesSectionState.sectionProgress;
      const enter = smoothstep(0, 0.12, sp);
      const exit = 1 - smoothstep(0.88, 1, sp);
      const alpha = enter * exit;

      ctx.clearRect(0, 0, width, height);

      if (alpha < 0.002) return;

      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;

      const rot = sp * 0.25;
      const cos = Math.cos(rot);
      const sin = Math.sin(rot);
      const cx = width * 0.5;
      const cy = height * 0.5;

      const baseThreshold = Math.min(width, height) * 0.18;
      const threshold = baseThreshold * (0.6 + 0.8 * sp);
      const thresholdSq = threshold * threshold;

      const drawn: {x: number; y: number; r: number}[] = [];

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < -10) n.x = width + 10;
        else if (n.x > width + 10) n.x = -10;
        if (n.y < -10) n.y = height + 10;
        else if (n.y > height + 10) n.y = -10;

        const dx = n.x - cx;
        const dy = n.y - cy;
        const rx = dx * cos - dy * sin + mouse.x;
        const ry = dx * sin + dy * cos + mouse.y;
        drawn.push({x: cx + rx, y: cy + ry, r: n.r});
      }

      ctx.globalCompositeOperation = 'lighter';

      for (let i = 0; i < drawn.length; i++) {
        for (let j = i + 1; j < drawn.length; j++) {
          const a = drawn[i];
          const b = drawn[j];
          const ddx = a.x - b.x;
          const ddy = a.y - b.y;
          const d2 = ddx * ddx + ddy * ddy;
          if (d2 < thresholdSq) {
            const t = 1 - d2 / thresholdSq;
            const lineAlpha = (0.14 + 0.16 * sp) * t * alpha;
            ctx.strokeStyle = `rgba(140,170,240,${lineAlpha.toFixed(3)})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      for (let i = 0; i < drawn.length; i++) {
        const p = drawn[i];
        const dotAlpha = (0.55 + 0.25 * sp) * alpha;
        ctx.fillStyle = `rgba(156,165,255,${dotAlpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = 'source-over';
    }

    function tick() {
      if (!categoriesSectionState.active) {
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
      if (categoriesSectionState.active && !running) start();
      if (!reducedMotion) setTimeout(watchActive, 200);
    }

    resize();
    seedNodes();
    draw();

    if (reducedMotion) {
      // single static frame only
    } else {
      window.addEventListener('mousemove', onMouseMove, {passive: true});
      window.addEventListener('resize', () => {
        resize();
        seedNodes();
      });
      watchActive();
    }

    return () => {
      cancelAnimationFrame(rafId);
      running = false;
      window.removeEventListener('mousemove', onMouseMove);
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
