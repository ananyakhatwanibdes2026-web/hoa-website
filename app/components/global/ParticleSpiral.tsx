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

// ---------------------------------------------------------------------------
// Spiral configuration -- 3x scale, tall cylinder, seamless wrap
// ---------------------------------------------------------------------------

const TURNS = 6;
const MIN_RADIUS = 3.0;
const MAX_RADIUS = 18;
const CLEAR_RADIUS = 3.5;
const REPEL_RADIUS = 4.0;
const REPEL_STRENGTH = 0.8;
const TRANSITION_START = 0.68;
const TRANSITION_END = 0.82;

const Y_EXTENT = 20.0;

// ---------------------------------------------------------------------------
// Particle spiral component
// ---------------------------------------------------------------------------

export function ParticleSpiral({isMobile}: {isMobile: boolean}) {
  const count = isMobile ? 1500 : 4500;
  const groupRef = useRef<THREE.Group>(null!);
  const pointsRef = useRef<THREE.Points>(null!);
  const scrollRef = useRef(0);

  const {geometry, material, basePositions} = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const basePosArr = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const t = i / count;
      const angle = t * TURNS * Math.PI * 2;
      const noise = (Math.random() - 0.5) * 1.2;
      const rawRadius = MIN_RADIUS + t * (MAX_RADIUS - MIN_RADIUS) + noise;
      const radius = Math.max(CLEAR_RADIUS, rawRadius);

      const x = Math.cos(angle) * radius;
      const y = (Math.random() - 0.5) * Y_EXTENT * 2;
      const z = Math.sin(angle) * radius;

      basePosArr[i * 3] = x;
      basePosArr[i * 3 + 1] = y;
      basePosArr[i * 3 + 2] = z;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      sizes[i] = 0.03 + Math.random() * 0.05;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const mat = new THREE.PointsMaterial({
      size: 0.06,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.55,
      blending: THREE.NormalBlending,
      depthWrite: false,
      color: new THREE.Color('#ffffff'),
    });

    return {geometry: geo, material: mat, basePositions: basePosArr};
  }, [count]);

  useFrame(() => {
    if (!groupRef.current || !pointsRef.current) return;

    const sp = getScrollProgress();
    scrollRef.current = lerp(scrollRef.current, sp, 0.02);

    mouseLerp.x = lerp(mouseLerp.x, mouseRead.x, 0.05);
    mouseLerp.y = lerp(mouseLerp.y, mouseRead.y, 0.05);

    // Slower rotation for "heavy anchored" feel
    groupRef.current.rotation.y = scrollRef.current * Math.PI * 1.2;
    const tightness = 1.0 - scrollRef.current * 0.2;

    const mouseWorldX = mouseLerp.x * 16;
    const mouseWorldY = mouseLerp.y * 10;

    // Seamless Y-wrapping offset driven by scroll
    const yScrollOffset = scrollRef.current * Y_EXTENT * 0.6;

    const posAttr = geometry.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const bx = basePositions[i * 3] * tightness;
      let by = basePositions[i * 3 + 1];
      const bz = basePositions[i * 3 + 2] * tightness;

      // Seamless Y-wrap: offset by scroll, then wrap within [-Y_EXTENT, Y_EXTENT]
      by = by - yScrollOffset;
      const range = Y_EXTENT * 2;
      by = ((((by + Y_EXTENT) % range) + range) % range) - Y_EXTENT;

      let cx = bx;
      let cy = by;

      // Mouse repulsion
      const dx = cx - mouseWorldX;
      const dy = cy - mouseWorldY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < REPEL_RADIUS && dist > 0.01) {
        const force =
          ((REPEL_RADIUS - dist) / REPEL_RADIUS) * REPEL_STRENGTH;
        cx += (dx / dist) * force;
        cy += (dy / dist) * force;
      }

      arr[i * 3] = cx;
      arr[i * 3 + 1] = cy;
      arr[i * 3 + 2] = bz;
    }

    posAttr.needsUpdate = true;

    // Color inversion + intensity taper (hero=full, content=mist, silver approach=restore)
    const scroll = scrollRef.current;
    const heroIntensity = scenePhaseState.heroIntensity;

    let intensityFactor: number;
    if (scroll < 0.20) {
      intensityFactor = 1.0;
    } else if (scroll < 0.50) {
      intensityFactor = lerp(1.0, 0.13, (scroll - 0.20) / 0.30);
    } else if (scroll < TRANSITION_START) {
      intensityFactor = lerp(0.13, 1.0, (scroll - 0.50) / (TRANSITION_START - 0.50));
    } else {
      intensityFactor = 1.0;
    }

    if (scroll < TRANSITION_START) {
      material.color.set('#ffffff');
      material.opacity = 0.55 * intensityFactor * lerp(0.24, 1.0, heroIntensity);
    } else if (scroll < TRANSITION_END) {
      const t =
        (scroll - TRANSITION_START) / (TRANSITION_END - TRANSITION_START);
      material.color.setRGB(1 - t * 0.87, 1 - t * 0.87, 1 - t * 0.87);
      material.opacity = lerp(0.30, 0.22, t) * lerp(0.45, 1.0, heroIntensity);
    } else {
      material.color.set('#222222');
      material.opacity = 0.2;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, -14]} rotation={[-0.3, 0, 0]}>
      <points ref={pointsRef} geometry={geometry} material={material} />
    </group>
  );
}
