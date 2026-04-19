import {useEffect} from 'react';

interface ColorStop {
  pos: number;
  bg: string;
  text: string;
}

const COLOR_STOPS: ColorStop[] = [
  // Pure black throughout — shader handles all blue accent lighting
  {pos: 0.000, bg: '#000000', text: '#ffffff'},
  {pos: 1.000, bg: '#000000', text: '#ffffff'},
];

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : [0, 0, 0];
}

function lerpColor(from: string, to: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(from);
  const [r2, g2, b2] = hexToRgb(to);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

function getColorAtProgress(
  progress: number,
  stops: ColorStop[],
  key: 'bg' | 'text',
): string {
  const p = Math.max(0, Math.min(1, progress));
  if (p <= stops[0].pos) return stops[0][key];
  if (p >= stops[stops.length - 1].pos) return stops[stops.length - 1][key];

  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i];
    const b = stops[i + 1];
    if (p >= a.pos && p <= b.pos) {
      const t = (p - a.pos) / (b.pos - a.pos);
      return lerpColor(a[key], b[key], t);
    }
  }
  return stops[stops.length - 1][key];
}

function applyColors(progress: number) {
  const bg = getColorAtProgress(progress, COLOR_STOPS, 'bg');
  const text = getColorAtProgress(progress, COLOR_STOPS, 'text');
  document.body.style.backgroundColor = bg;
  document.documentElement.style.setProperty('--bg-primary', bg);
  document.documentElement.style.setProperty('--text-primary', text);
}

// Cache scrollHeight so it is never read inside the hot scroll path.
let _bgDocHeight = 0;

function updateBgDocHeight() {
  _bgDocHeight = document.documentElement.scrollHeight - window.innerHeight;
}

function getScrollProgress(): number {
  if (_bgDocHeight <= 0) return 0;
  return Math.min(1, window.scrollY / _bgDocHeight);
}

export function BackgroundJourney() {
  useEffect(() => {
    updateBgDocHeight();
    applyColors(getScrollProgress());

    // RAF gate: collapse multiple scroll events in the same frame into one
    let rafPending = false;
    const onScroll = () => {
      if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(() => {
          applyColors(getScrollProgress());
          rafPending = false;
        });
      }
    };

    const onResize = () => {
      updateBgDocHeight();
      applyColors(getScrollProgress());
    };

    window.addEventListener('scroll', onScroll, {passive: true});
    window.addEventListener('resize', onResize, {passive: true});

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return null;
}
