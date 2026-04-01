import {useRef, useMemo} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {getLenis} from '~/components/global/SmoothScroll';
import {scenePhaseState} from '~/lib/sceneState';

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function getScrollProgress(): number {
  const docHeight =
    document.documentElement.scrollHeight - window.innerHeight;
  if (docHeight <= 0) return 0;
  const lenis = getLenis();
  const scrollTop = lenis ? (lenis as any).scroll : window.scrollY;
  return Math.max(0, Math.min(1, scrollTop / docHeight));
}

const mouseRead = {x: 0, y: 0};

if (typeof window !== 'undefined') {
  window.addEventListener(
    'mousemove',
    (e: MouseEvent) => {
      mouseRead.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRead.y = -(e.clientY / window.innerHeight) * 2 + 1;
    },
    {passive: true},
  );
}

const mouseLerp = {x: 0, y: 0};

const CLEAR_RADIUS = 3.0;
const TRANSITION_START = 0.68;
const TRANSITION_END = 0.82;

// ---------------------------------------------------------------------------
// Path group configuration -- 2x scale, left/right gutter spread
// ---------------------------------------------------------------------------

interface PathGroupConfig {
  startY: number;
  spanY: number;
  amplitude: number;
  frequency: number;
  baseZ: number;
  phaseX: number;
  warpFactor: number;
  xBias: number;
  driftDir: number;
}

const PATH_CONFIGS: PathGroupConfig[] = [
  // Left-biased groups (0-3)
  {startY: -20, spanY: 40, amplitude: 12, frequency: 2.0, baseZ: -20, phaseX: 0, warpFactor: 2.0, xBias: -6, driftDir: 1},
  {startY: -18, spanY: 36, amplitude: 10, frequency: 2.5, baseZ: -22, phaseX: 1.4, warpFactor: 1.8, xBias: -8, driftDir: -1},
  {startY: -22, spanY: 42, amplitude: 14, frequency: 1.8, baseZ: -19, phaseX: 2.8, warpFactor: 2.5, xBias: -5, driftDir: 1},
  {startY: -16, spanY: 34, amplitude: 9, frequency: 3.0, baseZ: -24, phaseX: 4.0, warpFactor: 1.5, xBias: -10, driftDir: -1},
  // Right-biased groups (4-7)
  {startY: -20, spanY: 38, amplitude: 11, frequency: 2.2, baseZ: -18, phaseX: 5.2, warpFactor: 2.2, xBias: 6, driftDir: 1},
  {startY: -19, spanY: 40, amplitude: 13, frequency: 1.9, baseZ: -23, phaseX: 0.6, warpFactor: 1.6, xBias: 8, driftDir: -1},
  {startY: -15, spanY: 32, amplitude: 8, frequency: 3.2, baseZ: -25, phaseX: 3.5, warpFactor: 2.8, xBias: 10, driftDir: 1},
  {startY: -24, spanY: 44, amplitude: 16, frequency: 1.6, baseZ: -21, phaseX: 1.8, warpFactor: 1.2, xBias: 5, driftDir: -1},
];

const VERTS_PER_LINE = 100;

// ---------------------------------------------------------------------------
// Single flowing line
// ---------------------------------------------------------------------------

function FlowingLine({
  config,
  lineOffset,
}: {
  config: PathGroupConfig;
  lineOffset: number;
}) {
  const lineRef = useRef<THREE.Line>(null!);
  const scrollRef = useRef(0);

  const {geometry, material, positions} = useMemo(() => {
    const pos = new Float32Array(VERTS_PER_LINE * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    const mat = new THREE.LineBasicMaterial({
      color: new THREE.Color('#ffffff'),
      transparent: true,
      opacity: 0.12,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });

    return {geometry: geo, material: mat, positions: pos};
  }, []);

  useFrame(() => {
    const sp = getScrollProgress();
    scrollRef.current = lerp(scrollRef.current, sp, 0.04);

    mouseLerp.x = lerp(mouseLerp.x, mouseRead.x, 0.05);
    mouseLerp.y = lerp(mouseLerp.y, mouseRead.y, 0.05);

    const mouseWorldX = mouseLerp.x * 14;
    const mouseWorldY = mouseLerp.y * 10;
    const scrollPhase = scrollRef.current * config.warpFactor;
    const parallaxY = scrollRef.current * 0.8 * config.spanY * 0.15 * config.driftDir;

    for (let i = 0; i < VERTS_PER_LINE; i++) {
      const t = i / (VERTS_PER_LINE - 1);

      let x =
        config.xBias +
        config.amplitude *
          Math.sin(t * config.frequency * Math.PI + config.phaseX + scrollPhase);
      let y = config.startY + t * config.spanY + parallaxY;
      let z =
        config.baseZ +
        Math.sin(t * config.frequency * 0.5 * Math.PI + config.phaseX) * 1.0;

      x += lineOffset * 0.25;
      z += lineOffset * 0.08;

      // Mouse magnet deflection
      const dx = x - mouseWorldX;
      const dy = y - mouseWorldY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 4.0) {
        const force = ((4.0 - dist) / 4.0) * 0.8 / (dist + 0.5);
        x += dx * force;
        y += dy * force;
      }

      // Radial center mask -- push vertices away from center
      const centerDist = Math.sqrt(x * x + y * y);
      if (centerDist < CLEAR_RADIUS) {
        const push = (CLEAR_RADIUS - centerDist) / CLEAR_RADIUS;
        x += (x / (centerDist + 0.1)) * push * 2.0;
        y += (y / (centerDist + 0.1)) * push * 2.0;
      }

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }

    geometry.attributes.position.needsUpdate = true;

    // Smooth color inversion synced with BackgroundJourney -- never invisible
    const scroll = scrollRef.current;
    const heroIntensity = scenePhaseState.heroIntensity;
    if (scroll < TRANSITION_START) {
      material.color.set('#ffffff');
      // Intensity taper: full in hero, mist in content sections, restore for silver approach
      let intensityFactor: number;
      if (scroll < 0.22) {
        intensityFactor = 1.0;
      } else if (scroll < 0.50) {
        intensityFactor = lerp(1.0, 0.10, (scroll - 0.22) / 0.28);
      } else if (scroll < TRANSITION_START) {
        intensityFactor = lerp(0.10, 1.0, (scroll - 0.50) / (TRANSITION_START - 0.50));
      } else {
        intensityFactor = 1.0;
      }
      material.opacity = 0.12 * intensityFactor * lerp(0.26, 1.0, heroIntensity);
    } else if (scroll < TRANSITION_END) {
      const t = (scroll - TRANSITION_START) / (TRANSITION_END - TRANSITION_START);
      material.color.setRGB(1 - t * 0.87, 1 - t * 0.87, 1 - t * 0.87);
      material.opacity = lerp(0.08, 0.13, t) * lerp(0.45, 1.0, heroIntensity);
    } else {
      material.color.set('#222222');
      material.opacity = 0.08;
    }
  });

  return <primitive ref={lineRef} object={new THREE.Line(geometry, material)} />;
}

// ---------------------------------------------------------------------------
// Path group (bundle of parallel lines)
// ---------------------------------------------------------------------------

function PathGroup({config, lineCount}: {config: PathGroupConfig; lineCount: number}) {
  const offsets = useMemo(() => {
    const arr: number[] = [];
    const half = (lineCount - 1) / 2;
    for (let i = 0; i < lineCount; i++) {
      arr.push(i - half);
    }
    return arr;
  }, [lineCount]);

  return (
    <>
      {offsets.map((offset, i) => (
        <FlowingLine key={i} config={config} lineOffset={offset} />
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Public export
// ---------------------------------------------------------------------------

export function BackgroundPaths({isMobile}: {isMobile: boolean}) {
  const configs = isMobile ? PATH_CONFIGS.slice(0, 4) : PATH_CONFIGS;
  const lineCount = isMobile ? 4 : 5;

  return (
    <group>
      {configs.map((config, i) => (
        <PathGroup key={i} config={config} lineCount={lineCount} />
      ))}
    </group>
  );
}
