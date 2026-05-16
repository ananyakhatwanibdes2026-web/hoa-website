import {useRef, useMemo} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {getLenis} from '~/components/global/SmoothScroll';

let _cachedHeight = 0;
let _cachedHeightTs = 0;

function getScrollP(): number {
  const now = performance.now();
  if (now - _cachedHeightTs > 500) {
    _cachedHeight = document.documentElement.scrollHeight - window.innerHeight;
    _cachedHeightTs = now;
  }
  if (_cachedHeight <= 0) return 0;
  const lenis = getLenis();
  const scrollTop = lenis ? (lenis as any).scroll : window.scrollY;
  return Math.max(0, Math.min(1, scrollTop / _cachedHeight));
}

const COUNT_DESKTOP = 12000;
const COUNT_MOBILE = 2500;

export function ParticleField() {
  const COUNT =
    typeof window !== 'undefined' && window.innerWidth < 768
      ? COUNT_MOBILE
      : COUNT_DESKTOP;

  const positions = useMemo(() => {
    const arr = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      arr[i * 3 + 0] = (Math.random() - 0.5) * 42;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 42;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 32;
    }
    return arr;
  }, [COUNT]);

  const matRef = useRef<THREE.PointsMaterial>(null);
  const scrollRef = useRef(0);

  useFrame(() => {
    if (!matRef.current) return;
    const sp = getScrollP();
    scrollRef.current += (sp - scrollRef.current) * 0.07;
    // Fade out as user scrolls past hero zone (~22% scroll)
    const intensity = Math.max(0, 1 - scrollRef.current * 4.5);
    matRef.current.opacity = intensity * 0.20;
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={matRef}
        size={0.045}
        color="#a8adb8"
        transparent
        opacity={0.18}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// -----------------------------------------------------------------------------
// PersistentParticleThread (Tier B)
// Always-mounted low-density periwinkle drift spanning entire scroll. Gives the
// whole page a shared spatial anchor so sections don't read as chapters.
// -----------------------------------------------------------------------------

const TIER_B_DESKTOP = 2500;
const TIER_B_MOBILE = 800;
const TIER_B_LOW_END = 500;

// Cylindrical distribution bounds (world units).
const Y_RANGE = 30; // positions span y in [-Y_RANGE, +Y_RANGE]
const XZ_RADIUS = 18;
// Scroll-coupled drift: full page scroll moves particles this many world units down.
const DRIFT_PER_PAGE = 40;

export function PersistentParticleThread() {
  const isMobile =
    typeof window !== 'undefined' && window.innerWidth < 768;
  const isLowEnd =
    typeof navigator !== 'undefined' &&
    (navigator.hardwareConcurrency || 8) <= 4;
  const COUNT = isLowEnd
    ? TIER_B_LOW_END
    : isMobile
    ? TIER_B_MOBILE
    : TIER_B_DESKTOP;

  const positions = useMemo(() => {
    const arr = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const r = Math.sqrt(Math.random()) * XZ_RADIUS;
      const a = Math.random() * Math.PI * 2;
      arr[i * 3 + 0] = Math.cos(a) * r;
      arr[i * 3 + 1] = (Math.random() - 0.5) * Y_RANGE * 2;
      arr[i * 3 + 2] = Math.sin(a) * r - 2;
    }
    return arr;
  }, [COUNT]);

  const geomRef = useRef<THREE.BufferGeometry>(null);
  const matRef = useRef<THREE.PointsMaterial>(null);
  const lastSp = useRef(0);
  const firstFrame = useRef(true);

  useFrame(() => {
    if (!geomRef.current || !matRef.current) return;
    const sp = getScrollP();
    if (firstFrame.current) {
      lastSp.current = sp;
      firstFrame.current = false;
      return;
    }
    const dsp = sp - lastSp.current;
    lastSp.current = sp;

    // Couple drift to scroll progress (not clock time) so motion feels like
    // the page scrolling the particle field.
    if (dsp !== 0) {
      const attr = geomRef.current.getAttribute(
        'position',
      ) as THREE.BufferAttribute;
      const arr = attr.array as Float32Array;
      const shift = dsp * DRIFT_PER_PAGE;
      for (let i = 1; i < arr.length; i += 3) {
        arr[i] -= shift;
        if (arr[i] < -Y_RANGE) arr[i] += Y_RANGE * 2;
        else if (arr[i] > Y_RANGE) arr[i] -= Y_RANGE * 2;
      }
      attr.needsUpdate = true;
    }

    // Subtle breath 0.10-0.14; never 0, never unmounts.
    const breath = 0.12 + 0.02 * Math.sin(performance.now() * 0.00035);
    matRef.current.opacity = breath;
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry ref={geomRef}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={matRef}
        size={0.028}
        color="#3a3f4e"
        transparent
        opacity={0.12}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
