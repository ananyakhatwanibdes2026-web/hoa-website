import {useEffect, useRef} from 'react';

// =============================================================================
// ContinuousBackdrop
// Single always-on Canvas2D layer that renders every 2D backdrop motif
// (constellation, mist, aurora ribbons, footer floor) across the entire scroll.
// Replaces CategoriesWeaveCanvas, WhyMistCanvas, and ContinuousAuroraCanvas.
// Runs alongside the global NightSkyShader (WebGL in SceneCanvas).
// =============================================================================

// ---------- scroll progress helper (cached, low-reflow) ----------------------
let _cachedDocHeight = 0;
let _docHeightTs = 0;
function getScrollProgress(): number {
  if (typeof window === 'undefined') return 0;
  const now = performance.now();
  if (now - _docHeightTs > 500) {
    _docHeightTs = now;
    _cachedDocHeight =
      document.documentElement.scrollHeight - window.innerHeight;
  }
  const scrollTop = window.scrollY;
  if (_cachedDocHeight <= 0) return 0;
  return Math.max(0, Math.min(1, scrollTop / _cachedDocHeight));
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// ---------- zone envelopes: which motifs are present at which scroll range ---
// Overlapping windows are intentional; they crossfade into each other.
function constellationWeight(sp: number) {
  // Hero tail through Bestsellers into Categories (sp ~0.15 - 0.64)
  return smoothstep(0.15, 0.26, sp) * (1 - smoothstep(0.55, 0.64, sp));
}
function mistWeight(sp: number) {
  // Categories tail through Why (sp ~0.38 - 0.74)
  return smoothstep(0.38, 0.50, sp) * (1 - smoothstep(0.64, 0.74, sp));
}
function auroraWeight(sp: number) {
  // Why tail through Campaign and Lookbook (sp ~0.55 - 0.98)
  return smoothstep(0.55, 0.66, sp) * (1 - smoothstep(0.90, 0.98, sp));
}

// ---------- data shapes -------------------------------------------------------
type CNode = {x: number; y: number; vx: number; vy: number; r: number};

type Ribbon = {
  yFrac: number;
  freq: number;
  phase: number;
  amp: number;
  alpha: number;
  color: string;
  speed: number;
};

type MBlob = {
  fx: number;
  fy: number;
  ax: number;
  ay: number;
  phase: number;
  baseR: number;
  color: string;
};

// ---------- motif palettes (AT blue family) -----------------------------------
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

const DESKTOP_MIST: MBlob[] = [
  {fx: 0.30, fy: 0.40, ax: 0.18, ay: 0.22, phase: 0.0, baseR: 0.34, color: '140,170,240'},
  {fx: 0.70, fy: 0.55, ax: 0.22, ay: 0.18, phase: 1.7, baseR: 0.38, color: '138,176,208'},
  {fx: 0.50, fy: 0.25, ax: 0.28, ay: 0.16, phase: 3.1, baseR: 0.26, color: '156,165,255'},
];
const MOBILE_MIST: MBlob[] = [
  {fx: 0.35, fy: 0.45, ax: 0.22, ay: 0.22, phase: 0.0, baseR: 0.42, color: '140,170,240'},
  {fx: 0.65, fy: 0.55, ax: 0.22, ay: 0.22, phase: 2.2, baseR: 0.40, color: '138,176,208'},
];

const DESKTOP_NODE_COUNT = 60;
const MOBILE_NODE_COUNT = 25;

// =============================================================================
export default function ContinuousBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const floorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', {alpha: true});
    if (!ctx) return;

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    const isMobile = window.innerWidth < 768;
    const dpr = Math.min(isMobile ? 1 : 1.5, window.devicePixelRatio || 1);

    const ribbons = isMobile ? MOBILE_RIBBONS : DESKTOP_RIBBONS;
    const mist = isMobile ? MOBILE_MIST : DESKTOP_MIST;
    const nodeCount = isMobile ? MOBILE_NODE_COUNT : DESKTOP_NODE_COUNT;

    const nodes: CNode[] = [];
    const mouse = {x: 0, y: 0, tx: 0, ty: 0};

    let width = 0;
    let height = 0;
    let rafId = 0;

    function resize() {
      if (!canvas) return;
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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

    // ---------- motif: constellation ----------
    function drawConstellation(sp: number, weight: number) {
      if (weight < 0.004 || !ctx) return;
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
            const lineAlpha = (0.14 + 0.16 * sp) * t * weight;
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
        const dotAlpha = (0.55 + 0.25 * sp) * weight;
        ctx.fillStyle = `rgba(156,165,255,${dotAlpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
    }

    // ---------- motif: mist ----------
    function drawMist(sp: number, weight: number) {
      if (weight < 0.004 || !ctx) return;
      // Local phase: remap global sp across the mist window to a 0..1 drive.
      const local = Math.max(0, Math.min(1, (sp - 0.45) / 0.23));
      const t = local * 6.28;
      const rScale = Math.min(width, height);
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < mist.length; i++) {
        const b = mist[i];
        const cx = width * (b.fx + b.ax * Math.sin(t * 0.6 + b.phase));
        const cy =
          height * (b.fy + b.ay * Math.cos(t * 0.4 + b.phase * 1.3));
        const radius =
          rScale * (b.baseR + 0.08 * Math.sin(t * 0.8 + b.phase));
        const coreAlpha =
          (0.12 + 0.06 * Math.sin(t * 0.5 + b.phase)) * weight;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        g.addColorStop(0, `rgba(${b.color},${coreAlpha.toFixed(3)})`);
        g.addColorStop(
          0.55,
          `rgba(${b.color},${(coreAlpha * 0.35).toFixed(3)})`,
        );
        g.addColorStop(1, `rgba(${b.color},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
    }

    // ---------- motif: aurora ----------
    function drawRibbon(r: Ribbon, phaseDriver: number, alpha: number) {
      if (!ctx) return;
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

    function drawAurora(sp: number, weight: number) {
      if (weight < 0.004 || !ctx) return;
      // Phase driver pulls from global sp so ribbons keep evolving continuously.
      const phaseDriver = Math.max(0, (sp - 0.55) * 4);
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < ribbons.length; i++) {
        drawRibbon(ribbons[i], phaseDriver, weight);
      }
      ctx.fillStyle = `rgba(96,128,224,${(0.04 * weight).toFixed(3)})`;
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'source-over';
    }

    // ---------- footer floor handoff (black rise at page tail) ----------
    function updateFloor(sp: number) {
      if (!floorRef.current) return;
      const rise = smoothstep(0.88, 1.0, sp);
      floorRef.current.style.opacity = rise.toFixed(3);
      floorRef.current.style.backgroundPosition = `0% ${(
        100 -
        rise * 60
      ).toFixed(1)}%`;
    }

    // ---------- main draw ----------
    function draw() {
      if (!ctx) return;
      const sp = getScrollProgress();
      ctx.clearRect(0, 0, width, height);

      drawConstellation(sp, constellationWeight(sp));
      drawMist(sp, mistWeight(sp));
      drawAurora(sp, auroraWeight(sp));
      updateFloor(sp);
    }

    function tick() {
      draw();
      rafId = requestAnimationFrame(tick);
    }

    function onResize() {
      resize();
      seedNodes();
    }

    resize();
    seedNodes();
    draw();

    if (!reducedMotion) {
      window.addEventListener('mousemove', onMouseMove, {passive: true});
      window.addEventListener('resize', onResize);
      rafId = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
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
