import {useEffect, useRef} from 'react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const PANELS = [
  {
    num: '01',
    name: 'Edge',
    tagline: 'Minimal Aggression',
    imgSrc: '/images/categories/edge1.jpg',
    href: '/collections/edge',
    cta: 'Shop Edge',
  },
  {
    num: '02',
    name: 'Sculpt',
    tagline: 'Form Meets the Ear',
    imgSrc: '/images/categories/sculpt2.jpg',
    href: '/collections/sculpt',
    cta: 'Shop Sculpt',
  },
  {
    num: '03',
    name: 'Elite',
    tagline: 'Sculpted in Gold',
    imgSrc: '/images/categories/elite3.jpg',
    href: '/collections/elite',
    cta: 'Shop Elite',
  },
];

// ---------------------------------------------------------------------------
// Canvas background -- metallic geometric network
// ---------------------------------------------------------------------------

interface NetNode {
  nx: number; // normalized 0-1
  ny: number;
  vx: number; // px/frame (will be /w per frame)
  vy: number;
  r: number;
  sparkle: boolean;
  sparklePhase: number;
  sparklePeriod: number;
}

function startCanvasNetwork(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  const DPR = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 1.5);
  const NODE_COUNT = 28;
  const SPARKLE_RATIO = 0.28;

  let raf = 0;
  let nodes: NetNode[] = [];

  function buildNodes() {
    nodes = Array.from({length: NODE_COUNT}, () => ({
      nx: Math.random(),
      ny: Math.random(),
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
      r: 1.8 + Math.random() * 1.4,
      sparkle: Math.random() < SPARKLE_RATIO,
      sparklePhase: Math.random() * Math.PI * 2,
      sparklePeriod: 2600 + Math.random() * 2200,
    }));
  }

  function resize() {
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    canvas.width = w * DPR;
    canvas.height = h * DPR;
    ctx.scale(DPR, DPR);
  }

  resize();
  buildNodes();

  const resizeHandler = () => {
    resize();
  };
  window.addEventListener('resize', resizeHandler);

  function drawStar(
    x: number,
    y: number,
    size: number,
    opacity: number,
    w: number,
    h: number,
  ) {
    ctx.save();
    // Main cross (horizontal + vertical)
    for (let arm = 0; arm < 2; arm++) {
      const angle = arm * (Math.PI / 2);
      const len = size * 4.2;
      const x0 = x - Math.cos(angle) * len;
      const y0 = y - Math.sin(angle) * len;
      const x1 = x + Math.cos(angle) * len;
      const y1 = y + Math.sin(angle) * len;
      const grad = ctx.createLinearGradient(x0, y0, x1, y1);
      grad.addColorStop(0, 'rgba(255,255,255,0)');
      grad.addColorStop(0.45, `rgba(255,255,255,${opacity * 0.82})`);
      grad.addColorStop(0.5, `rgba(255,255,255,${opacity})`);
      grad.addColorStop(0.55, `rgba(255,255,255,${opacity * 0.82})`);
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }
    // Diagonal arms (thinner, shorter)
    for (let arm = 0; arm < 2; arm++) {
      const angle = arm * (Math.PI / 2) + Math.PI / 4;
      const len = size * 2.2;
      const x0 = x - Math.cos(angle) * len;
      const y0 = y - Math.sin(angle) * len;
      const x1 = x + Math.cos(angle) * len;
      const y1 = y + Math.sin(angle) * len;
      ctx.strokeStyle = `rgba(255,255,255,${opacity * 0.45})`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }
    // Center glow dot
    const glowGrad = ctx.createRadialGradient(x, y, 0, x, y, size * 2.5);
    glowGrad.addColorStop(0, `rgba(255,255,255,${opacity * 0.9})`);
    glowGrad.addColorStop(0.4, `rgba(210,215,235,${opacity * 0.35})`);
    glowGrad.addColorStop(1, 'rgba(210,215,235,0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(x, y, size * 2.5, 0, Math.PI * 2);
    ctx.fill();
    // Crisp center dot
    ctx.beginPath();
    ctx.arc(x, y, size * 0.75, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${opacity})`;
    ctx.fill();
    ctx.restore();
    // suppress unused param warning
    void w; void h;
  }

  function draw(timestamp: number) {
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;

    ctx.clearRect(0, 0, w, h);

    // -- Background: dark charcoal radial gradient, metallic mid-tone --
    const bg = ctx.createRadialGradient(w * 0.5, h * 0.38, 0, w * 0.5, h * 0.5, Math.max(w, h) * 0.82);
    bg.addColorStop(0, '#252532');
    bg.addColorStop(0.38, '#1a1a26');
    bg.addColorStop(0.72, '#131320');
    bg.addColorStop(1, '#0c0c16');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // -- Update node positions --
    const DIST = Math.max(w, h) * 0.21;

    for (const n of nodes) {
      n.nx += n.vx / w;
      n.ny += n.vy / h;
      if (n.nx < 0 || n.nx > 1) { n.vx *= -1; n.nx = Math.max(0, Math.min(1, n.nx)); }
      if (n.ny < 0 || n.ny > 1) { n.vy *= -1; n.ny = Math.max(0, Math.min(1, n.ny)); }
    }

    // -- Draw connections --
    for (let i = 0; i < nodes.length; i++) {
      const ax = nodes[i].nx * w;
      const ay = nodes[i].ny * h;
      for (let j = i + 1; j < nodes.length; j++) {
        const bx = nodes[j].nx * w;
        const by = nodes[j].ny * h;
        const dx = ax - bx;
        const dy = ay - by;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d >= DIST) continue;

        const t = 1 - d / DIST;
        const opacity = t * 0.26;

        ctx.strokeStyle = `rgba(185,190,218,${opacity})`;
        ctx.lineWidth = 0.65;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();

        // Triangle fill for close pairs
        if (d < DIST * 0.52) {
          for (let k = j + 1; k < nodes.length; k++) {
            const cx = nodes[k].nx * w;
            const cy = nodes[k].ny * h;
            const dac = Math.sqrt((ax - cx) ** 2 + (ay - cy) ** 2);
            const dbc = Math.sqrt((bx - cx) ** 2 + (by - cy) ** 2);
            if (dac < DIST * 0.52 && dbc < DIST * 0.52) {
              ctx.beginPath();
              ctx.moveTo(ax, ay);
              ctx.lineTo(bx, by);
              ctx.lineTo(cx, cy);
              ctx.closePath();
              ctx.fillStyle = 'rgba(160,165,200,0.038)';
              ctx.fill();
            }
          }
        }
      }
    }

    // -- Draw nodes --
    for (const n of nodes) {
      const x = n.nx * w;
      const y = n.ny * h;

      if (n.sparkle) {
        const pulse =
          0.45 + 0.55 * (0.5 + 0.5 * Math.sin((timestamp / n.sparklePeriod) * Math.PI * 2 + n.sparklePhase));
        drawStar(x, y, n.r * 1.3 * pulse, 0.5 + 0.5 * pulse, w, h);
      } else {
        ctx.beginPath();
        ctx.arc(x, y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(185,190,218,0.48)';
        ctx.fill();
      }
    }

    // -- Edge vignette: fade to near-black at top/bottom to blend with page --
    const vTop = ctx.createLinearGradient(0, 0, 0, h * 0.22);
    vTop.addColorStop(0, 'rgba(10,10,20,0.85)');
    vTop.addColorStop(1, 'rgba(10,10,20,0)');
    ctx.fillStyle = vTop;
    ctx.fillRect(0, 0, w, h * 0.22);

    const vBot = ctx.createLinearGradient(0, h * 0.78, 0, h);
    vBot.addColorStop(0, 'rgba(10,10,20,0)');
    vBot.addColorStop(1, 'rgba(10,10,20,0.85)');
    ctx.fillStyle = vBot;
    ctx.fillRect(0, h * 0.78, w, h * 0.22);

    raf = requestAnimationFrame(draw);
  }

  raf = requestAnimationFrame(draw);

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resizeHandler);
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CategoriesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Canvas background animation
  useEffect(() => {
    if (!canvasRef.current) return;
    const stop = startCanvasNetwork(canvasRef.current);
    return stop;
  }, []);

  // GSAP scroll animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(cardRefs.current[0], {x: -100, y: 70, opacity: 0});
      gsap.set(cardRefs.current[1], {x: 0, y: 90, opacity: 0});
      gsap.set(cardRefs.current[2], {x: 100, y: 70, opacity: 0});

      const tl = gsap.timeline({paused: true});

      // Phase 1 (0 -> 0.55): Cards enter from sides/below with stagger
      tl.to(cardRefs.current[0], {x: 0, y: 0, opacity: 1, ease: 'power3.out', duration: 0.55}, 0)
        .to(cardRefs.current[1], {x: 0, y: 0, opacity: 1, ease: 'power3.out', duration: 0.55}, 0.12)
        .to(cardRefs.current[2], {x: 0, y: 0, opacity: 1, ease: 'power3.out', duration: 0.55}, 0.24);

      // Phase 2 (0.55 -> 2.0): Subtle parallax -- different rates create depth layering
      tl.to(cardRefs.current[0], {y: -28, ease: 'none', duration: 1.45}, 0.55)
        .to(cardRefs.current[1], {y: -14, ease: 'none', duration: 1.45}, 0.55)
        .to(cardRefs.current[2], {y: -28, ease: 'none', duration: 1.45}, 0.55);

      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.2,
        animation: tl,
      });
    }, sectionRef.current!);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      data-section="categories"
      style={{height: '300vh', position: 'relative', zIndex: 1}}
    >
      <style>{`
        .cat-hdg-wrap {
          text-align: center;
          cursor: default;
          user-select: none;
          display: inline-block;
          position: relative;
          z-index: 2;
        }
        .cat-eyebrow {
          font-family: var(--font-body, 'DM Sans', sans-serif);
          font-size: 10px;
          font-weight: 400;
          letter-spacing: 0.52em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.38);
          display: block;
          margin-bottom: 10px;
          transition: color 0.45s ease, letter-spacing 0.55s cubic-bezier(0.25,0,0,1);
        }
        .cat-hdg-wrap:hover .cat-eyebrow {
          color: rgba(255,255,255,0.75);
          letter-spacing: 0.62em;
        }
        .cat-hdg {
          font-family: var(--font-display, 'Cormorant Garamond', serif);
          font-size: clamp(2.4rem, 4vw, 3.6rem);
          font-weight: 200;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #ffffff;
          line-height: 1;
          display: block;
          margin: 0;
        }
        .cat-ch {
          display: inline-block;
          transition: transform 0.38s cubic-bezier(0.34,1.56,0.64,1);
        }
        .cat-ch:nth-child(1)  { transition-delay:   0ms; }
        .cat-ch:nth-child(2)  { transition-delay:  35ms; }
        .cat-ch:nth-child(3)  { transition-delay:  70ms; }
        .cat-ch:nth-child(4)  { transition-delay: 105ms; }
        .cat-ch:nth-child(5)  { transition-delay: 140ms; }
        .cat-ch:nth-child(6)  { transition-delay: 175ms; }
        .cat-ch:nth-child(7)  { transition-delay: 210ms; }
        .cat-ch:nth-child(8)  { transition-delay: 245ms; }
        .cat-ch:nth-child(9)  { transition-delay: 280ms; }
        .cat-ch:nth-child(10) { transition-delay: 315ms; }
        .cat-ch:nth-child(11) { transition-delay: 350ms; }
        .cat-hdg-wrap:hover .cat-ch { transform: translateY(-5px); }
        .cat-rule {
          width: 0;
          height: 1px;
          background: rgba(255,255,255,0.25);
          margin: 12px auto 0;
          transition: width 0.6s cubic-bezier(0.25,0,0,1);
        }
        .cat-hdg-wrap:hover .cat-rule { width: 44px; }

        .cat-grid {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          gap: 4.5vw;
          position: relative;
          z-index: 2;
        }

        .cat-card-outer {
          flex-shrink: 0;
          width: min(27vw, 340px);
          height: 68vh;
          position: relative;
          transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
          will-change: transform;
        }
        .cat-card-outer:hover {
          transform: translateY(-14px);
        }
        .cat-card-outer:hover::after {
          box-shadow:
            0 0 40px 10px rgba(235, 190, 90, 0.32),
            0 0 90px 28px rgba(235, 190, 90, 0.16);
          border-color: rgba(255, 245, 220, 0.60);
          transition: box-shadow 0.5s ease, border-color 0.5s ease;
        }

        @keyframes catFloat0 {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-7px); }
        }
        @keyframes catFloat1 {
          0%, 100% { transform: translateY(-4px); }
          50%       { transform: translateY(3px); }
        }
        @keyframes catFloat2 {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-5px); }
        }
        .cat-float-0 { animation: catFloat0 5s   ease-in-out infinite both; }
        .cat-float-1 { animation: catFloat1 6.5s ease-in-out infinite both; }
        .cat-float-2 { animation: catFloat2 5.8s ease-in-out infinite both; }

        .cat-card {
          width: 100%;
          height: 100%;
          position: relative;
          overflow: hidden;
          border-radius: 18px;
          box-shadow: 0 24px 64px rgba(0,0,0,0.50);
          cursor: pointer;
          transition: transform 0.45s cubic-bezier(0.34,1.56,0.64,1),
                      box-shadow 0.45s ease;
          will-change: transform;
        }
        .cat-card:hover {
          box-shadow: 0 40px 90px rgba(0,0,0,0.65);
          filter: brightness(1.06);
        }

        .cat-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          pointer-events: none;
          user-select: none;
        }

        .cat-vignette {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top,
            rgba(0,0,0,0.58) 0%,
            rgba(0,0,0,0.20) 38%,
            rgba(0,0,0,0)    60%
          );
          pointer-events: none;
          z-index: 1;
        }

        .cat-label {
          position: absolute;
          top: 22px;
          left: 22px;
          z-index: 2;
          background: #ffffff;
          border-radius: 8px;
          padding: 11px 28px;
          box-shadow: 0 4px 18px rgba(0,0,0,0.18);
          font-family: var(--font-display, 'Cormorant Garamond', serif);
          font-style: italic;
          font-weight: 700;
          font-size: clamp(1.2rem, 2vw, 1.55rem);
          color: #111111;
          line-height: 1;
          pointer-events: none;
          user-select: none;
        }

        .cat-cta {
          position: absolute;
          bottom: 28px;
          left: 50%;
          transform: translateX(-50%) translateY(8px);
          z-index: 2;
          font-family: var(--font-body, 'DM Sans', sans-serif);
          font-size: 10px;
          letter-spacing: 0.4em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.88);
          text-decoration: none;
          border-bottom: 1px solid rgba(255,255,255,0.38);
          padding-bottom: 3px;
          white-space: nowrap;
          opacity: 0;
          transition: opacity 0.3s ease, transform 0.3s ease;
        }
        .cat-card:hover .cat-cta {
          opacity: 1;
          transform: translateX(-50%) translateY(0px);
        }

        @property --cat-angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }

        @keyframes cat-sweep {
          to { --cat-angle: 360deg; }
        }

        @keyframes cat-breathe {
          0%, 100% {
            box-shadow:
              0 0 20px 3px rgba(210, 165, 75, 0.08),
              0 0 55px 12px rgba(210, 165, 75, 0.03);
            border-color: rgba(255, 245, 220, 0.14);
          }
          50% {
            box-shadow:
              0 0 32px 8px rgba(235, 190, 90, 0.22),
              0 0 75px 22px rgba(235, 190, 90, 0.10);
            border-color: rgba(255, 245, 220, 0.42);
          }
        }

        /* Rotating conic sweep border */
        .cat-card-outer::before {
          content: '';
          position: absolute;
          inset: -3px;
          border-radius: 21px;
          padding: 3px;
          --cat-angle: 0deg;
          background: conic-gradient(
            from var(--cat-angle) at 50% 50%,
            transparent 0%,
            rgba(255, 228, 165, 0.0) 8%,
            rgba(255, 228, 165, 0.9) 18%,
            rgba(255, 248, 210, 1.0) 22%,
            rgba(255, 228, 165, 0.9) 28%,
            rgba(255, 228, 165, 0.0) 38%,
            transparent 100%
          );
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: exclude;
          -webkit-mask-composite: xor;
          animation: cat-sweep 5s linear infinite;
          z-index: 5;
          pointer-events: none;
        }

        /* Static border + breathing ambient glow */
        .cat-card-outer::after {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: 20px;
          border: 2px solid rgba(255, 245, 220, 0.14);
          animation: cat-breathe 4.5s ease-in-out infinite;
          z-index: 4;
          pointer-events: none;
        }

        /* Stagger sweep and glow per card for organic feel */
        .cat-grid .cat-card-outer:nth-child(2)::before { animation-delay: -1.7s; }
        .cat-grid .cat-card-outer:nth-child(3)::before { animation-delay: -3.3s; }
        .cat-grid .cat-card-outer:nth-child(2)::after  { animation-delay: -2.2s; }
        .cat-grid .cat-card-outer:nth-child(3)::after  { animation-delay: -1.1s; }

        @media (max-width: 768px) {
          .cat-grid { flex-direction: column; gap: 5vw; }
          .cat-card-outer { width: min(80vw, 320px); height: 52vw; min-height: 240px; }
        }
      `}</style>

      {/* Sticky viewport-pinned wrapper */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '36px',
          overflow: 'hidden',
        }}
      >
        {/* Animated metallic geometric canvas background */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            zIndex: 0,
            display: 'block',
          }}
        />

        {/* Section heading */}
        <div className="cat-hdg-wrap">
          <span className="cat-eyebrow">House of An</span>
          <h2 className="cat-hdg">
            {'COLLECTIONS'.split('').map((ch, i) => (
              <span key={i} className="cat-ch">
                {ch}
              </span>
            ))}
          </h2>
          <div className="cat-rule" />
        </div>

        {/* Cards grid */}
        <div className="cat-grid">
          {PANELS.map((panel, i) => (
            <div
              key={panel.num}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className="cat-card-outer"
            >
              <div className={`cat-float-${i}`} style={{width: '100%', height: '100%'}}>
                <div className="cat-card">
                  <img
                    src={panel.imgSrc}
                    alt={panel.tagline}
                    className="cat-img"
                    loading="eager"
                    draggable={false}
                  />
                  <div className="cat-vignette" />
                  <div className="cat-label">{panel.name}</div>
                  <a href={panel.href} className="cat-cta">
                    {panel.cta}
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
