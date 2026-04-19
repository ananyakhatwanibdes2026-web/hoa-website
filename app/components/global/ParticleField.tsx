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
        color="#8ab0e8"
        transparent
        opacity={0.18}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
