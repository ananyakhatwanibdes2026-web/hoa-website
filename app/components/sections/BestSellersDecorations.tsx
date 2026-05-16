import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { EffectComposer, SelectiveBloom, Vignette, ChromaticAberration } from '@react-three/postprocessing';
import { bestsellersSectionState } from '~/lib/sceneState';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';

if (typeof window !== 'undefined') {
  useGLTF.preload('/models/star.glb', '/draco/');
  useGLTF.preload('/models/rock.glb', '/draco/');
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function clamp01(v: number) { return Math.max(0, Math.min(1, v)); }
function smoothstep(e0: number, e1: number, x: number) {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
}

// ---------------------------------------------------------------------------
// Module-level shared state
// ---------------------------------------------------------------------------
const bsMouseState = { x: 0, y: 0, lerpX: 0, lerpY: 0 };
// Captures the module load timestamp so entrance animations start immediately
// when the lazy-loaded BestSellers canvas first mounts.
const _bsEntryTime = typeof performance !== 'undefined' ? performance.now() : 0;

// ---------------------------------------------------------------------------
// Mouse tracker
// ---------------------------------------------------------------------------
export function BSMouseTracker() {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      bsMouseState.x = (e.clientX / window.innerWidth) * 2 - 1;
      bsMouseState.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handler, { passive: true });
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  useFrame(() => {
    bsMouseState.lerpX = lerp(bsMouseState.lerpX, bsMouseState.x, 0.05);
    bsMouseState.lerpY = lerp(bsMouseState.lerpY, bsMouseState.y, 0.05);
  });

  return null;
}

// ---------------------------------------------------------------------------
// Post-processing (SelectiveBloom + Vignette)
// Stars/rocks must be inside <Select enabled> for bloom to apply only to them.
// ---------------------------------------------------------------------------
export function BSPostFX({ isMobile }: { isMobile: boolean }) {
  return (
    <EffectComposer multisampling={isMobile ? 0 : 4}>
      <SelectiveBloom
        mipmapBlur
        luminanceThreshold={0.85}
        luminanceSmoothing={0.5}
        intensity={isMobile ? 0.12 : 0.20}
      />
      <ChromaticAberration
        blendFunction={BlendFunction.NORMAL}
        offset={new THREE.Vector2(0.003, 0.001)}
        radialModulation={true}
        modulationOffset={0.4}
      />
      <Vignette eskil={false} offset={0.25} darkness={0.72} />
    </EffectComposer>
  );
}

// ---------------------------------------------------------------------------
// Drift Particles -- AT-style volumetric particle cloud around the carousel
// THREE.Points (single draw call). No bloom -- AdditiveBlending self-illuminates.
// ---------------------------------------------------------------------------
export function BSDriftParticles({ isMobile }: { isMobile: boolean }) {
  const COUNT = isMobile ? 320 : 950;
  const pointsRef = useRef<THREE.Points>(null!);
  const opacityRef = useRef(0);
  const disperseRef = useRef(0);

  const { geometry, material } = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const col = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      // Wide spatial spread: x/y covers full scene, z behind cards
      pos[i * 3]     = (Math.random() - 0.5) * 28;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 22;
      pos[i * 3 + 2] = -1.5 - Math.random() * 10;
      // Mix: 60% cool blue-silver, 25% periwinkle, 10% ice white, 5% warm gold
      const r = Math.random();
      if (r < 0.60) {
        col[i * 3] = 0.66; col[i * 3 + 1] = 0.68; col[i * 3 + 2] = 0.73; // cool silver
      } else if (r < 0.85) {
        col[i * 3] = 0.78; col[i * 3 + 1] = 0.80; col[i * 3 + 2] = 0.88; // faint periwinkle accent
      } else if (r < 0.95) {
        col[i * 3] = 0.90; col[i * 3 + 1] = 0.92; col[i * 3 + 2] = 0.95; // off-white
      } else {
        col[i * 3] = 0.86; col[i * 3 + 1] = 0.72; col[i * 3 + 2] = 0.32; // warm gold accent
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.068,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    return { geometry: geo, material: mat };
  }, [COUNT]);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const t = clock.elapsedTime;

    // Steady slow drift — scroll-independent, always seamless
    pointsRef.current.rotation.y = t * 0.007 + bsMouseState.lerpX * 0.10;
    pointsRef.current.rotation.x = bsMouseState.lerpY * 0.05;

    // Slow zoom-in as carousel scrolls, then disperse off when last card exits
    const cp = bestsellersSectionState.carouselProgress;
    const zoomIn = smoothstep(0, 0.88, cp);
    const dispTarget = smoothstep(0.88, 1.0, cp);
    disperseRef.current = lerp(disperseRef.current, dispTarget, 0.04);
    pointsRef.current.scale.setScalar(1.0 + zoomIn * 0.40 + disperseRef.current * 4.5);

    // Opacity: entrance fade in, disperse fades out
    const ep = bestsellersSectionState.entranceProgress;
    const entranceFade = smoothstep(0.20, 0.55, ep);
    const disperseFade = Math.max(0, 1.0 - disperseRef.current * 1.6);
    const target = entranceFade * disperseFade * 0.52;
    opacityRef.current = lerp(opacityRef.current, target, 0.04);
    material.opacity = opacityRef.current;
  });

  return <points ref={pointsRef} geometry={geometry} material={material} />;
}

// ---------------------------------------------------------------------------
// Floating Orbs -- AT-style bioluminescent glowing spheres at scene edges
// AdditiveBlending so they self-glow without needing bloom Select.
// ---------------------------------------------------------------------------
const ORB_CONFIGS = [
  { pos: [-9.5,  5.5, -5.0] as [number, number, number], color: '#22262e', radius: 0.28, phase: 0.0, px: 0.35 },
  { pos: [ 9.0, -4.0, -6.5] as [number, number, number], color: '#1c2028', radius: 0.23, phase: 1.3, px: 0.28 },
  { pos: [-7.0, -7.5, -7.0] as [number, number, number], color: '#252932', radius: 0.31, phase: 2.2, px: 0.22 },
  { pos: [ 8.5,  7.0, -5.5] as [number, number, number], color: '#1e222a', radius: 0.25, phase: 3.5, px: 0.30 },
  { pos: [ 0.5, -10.5, -8.0] as [number, number, number], color: '#1a1e26', radius: 0.35, phase: 4.1, px: 0.18 },
  { pos: [-11.0,  0.5, -6.0] as [number, number, number], color: '#2a2e3a', radius: 0.20, phase: 5.0, px: 0.32 },
  { pos: [ 0.0,   0.0, -9.5] as [number, number, number], color: '#181a22', radius: 0.55, phase: 2.8, px: 0.08 },
];

function BSOrb({ config }: { config: typeof ORB_CONFIGS[0] }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const opacityRef = useRef(0);
  const disperseRef = useRef(0);

  const mat = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color(config.color),
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }), [config.color]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.elapsedTime;

    // Slow zoom-in as carousel scrolls, then disperse off when last card exits
    const cp = bestsellersSectionState.carouselProgress;
    const zoomIn = smoothstep(0, 0.88, cp);
    const dispTarget = smoothstep(0.88, 1.0, cp);
    disperseRef.current = lerp(disperseRef.current, dispTarget, 0.035);
    const flyMult = 1.0 + zoomIn * 0.20 + disperseRef.current * 3.2;

    // Steady breathing scale — scroll-independent
    const breathe = 1.0 + Math.sin(t * 0.55 + config.phase) * 0.12;
    meshRef.current.scale.setScalar(config.radius * breathe);

    // Mouse parallax + smooth fly outward on disperse
    meshRef.current.position.x = config.pos[0] * flyMult + bsMouseState.lerpX * config.px * 2.2;
    meshRef.current.position.y = config.pos[1] * flyMult + bsMouseState.lerpY * config.px * 1.4;
    meshRef.current.position.z = config.pos[2] - disperseRef.current * 4.0;

    // Entrance + disperse fade
    const ep = bestsellersSectionState.entranceProgress;
    const delay = 0.30 + (config.phase / 5.0) * 0.25;
    const disperseFade = Math.max(0, 1.0 - disperseRef.current * 1.8);
    const targetOp = smoothstep(delay, delay + 0.30, ep) * disperseFade * 0.55;
    opacityRef.current = lerp(opacityRef.current, targetOp, 0.04);
    mat.opacity = opacityRef.current;
  });

  return (
    <mesh ref={meshRef} position={config.pos} material={mat}>
      <sphereGeometry args={[1, 12, 12]} />
    </mesh>
  );
}

export function BSFloatingOrbs() {
  return (
    <>
      {ORB_CONFIGS.map((cfg, i) => <BSOrb key={i} config={cfg} />)}
    </>
  );
}

// ---------------------------------------------------------------------------
// Atmospheric Rings -- large concentric halos in the deep background
// AT-inspired geometric depth layers. Flat ring geometry, AdditiveBlending.
// ---------------------------------------------------------------------------
const RING_CONFIGS = [
  { z: -6,  inner: 7.2,  outer: 7.55,  rotZ:  0.28, speed: 0.018, phase: 0.0, maxOp: 0.20 },
  { z: -8,  inner: 10.5, outer: 10.9,  rotZ: -0.15, speed: 0.012, phase: 0.5, maxOp: 0.16 },
  { z: -11, inner: 14.0, outer: 14.5,  rotZ:  0.08, speed: 0.008, phase: 1.1, maxOp: 0.11 },
  { z: -5,  inner: 5.0,  outer: 5.22,  rotZ: -0.40, speed: 0.025, phase: 1.8, maxOp: 0.14 },
  { z: -14, inner: 19.0, outer: 19.5,  rotZ:  0.05, speed: 0.004, phase: 2.4, maxOp: 0.06 },
];

function BSRing({ config }: { config: typeof RING_CONFIGS[0] }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const opacityRef = useRef(0);
  const disperseRef = useRef(0);

  const mat = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color('#3a3f4e'),
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }), []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.elapsedTime;

    // Steady rotation — scroll-independent, always seamless
    meshRef.current.rotation.z = config.rotZ + t * config.speed;
    meshRef.current.rotation.y = bsMouseState.lerpX * 0.06;
    meshRef.current.rotation.x = Math.PI / 2 + bsMouseState.lerpY * 0.03;

    // Slow zoom-in as carousel scrolls, then disperse off when last card exits
    const cp = bestsellersSectionState.carouselProgress;
    const zoomIn = smoothstep(0, 0.88, cp);
    const dispTarget = smoothstep(0.88, 1.0, cp);
    disperseRef.current = lerp(disperseRef.current, dispTarget, 0.03);
    const expand = 1.0 + zoomIn * 0.15 + disperseRef.current * 2.8;
    meshRef.current.scale.set(expand, expand, 1.0);

    // Entrance + disperse fade
    const ep = bestsellersSectionState.entranceProgress;
    const delay = 0.50 + config.phase * 0.06;
    const disperseFade = Math.max(0, 1.0 - disperseRef.current * 2.2);
    const targetOp = smoothstep(delay, delay + 0.28, ep) * disperseFade * config.maxOp;
    opacityRef.current = lerp(opacityRef.current, targetOp, 0.03);
    mat.opacity = opacityRef.current;
  });

  return (
    <mesh ref={meshRef} position={[0, 0, config.z]} rotation={[Math.PI / 2, 0, config.rotZ]} material={mat}>
      <ringGeometry args={[config.inner, config.outer, 128]} />
    </mesh>
  );
}

export function BSAtmosphericRings() {
  return (
    <>
      {RING_CONFIGS.map((cfg, i) => <BSRing key={i} config={cfg} />)}
    </>
  );
}

// ---------------------------------------------------------------------------
// Star configs
// Camera: fov=65, position=[0,0.5,11]. Cards at world z≈2-5. Spirals at z=-4.
// Stars live at z:-5 to -11 (behind spirals, layered depth).
// ---------------------------------------------------------------------------
interface StarConfig {
  pos: [number, number, number];
  scale: number;
  rotX: number; rotY: number; rotZ: number;
  floatSpeed: number;
  parallax: number;
  phase: number;
  color: string;
  maxOpacity: number;
}

const BS_STAR_CONFIGS: StarConfig[] = [
  // Foreground (z -5 to -6) — largest, highest parallax
  { pos: [-4.5,  2.8, -5.2], scale: 0.42, rotX:  0.004, rotY:  0.007, rotZ:  0.003, floatSpeed: 0.60, parallax: 0.55, phase: 0, color: '#b0cce8', maxOpacity: 0.90 },
  { pos: [ 5.2, -2.1, -5.8], scale: 0.36, rotX: -0.005, rotY:  0.006, rotZ:  0.004, floatSpeed: 0.80, parallax: 0.48, phase: 2, color: '#a0c4fc', maxOpacity: 0.85 },
  { pos: [-7.0, -3.5, -5.5], scale: 0.30, rotX:  0.006, rotY: -0.004, rotZ:  0.005, floatSpeed: 0.55, parallax: 0.42, phase: 4, color: '#c8e0ff', maxOpacity: 0.80 },
  // Mid (z -7 to -8.5) — medium size, moderate parallax
  { pos: [ 3.5,  4.0, -7.2], scale: 0.24, rotX:  0.003, rotY:  0.008, rotZ: -0.003, floatSpeed: 0.45, parallax: 0.32, phase: 1, color: '#b8d0f0', maxOpacity: 0.75 },
  { pos: [-6.5,  1.5, -7.8], scale: 0.20, rotX: -0.004, rotY:  0.005, rotZ:  0.006, floatSpeed: 0.70, parallax: 0.28, phase: 3, color: '#aacaf4', maxOpacity: 0.70 },
  { pos: [ 7.5, -1.2, -8.0], scale: 0.18, rotX:  0.005, rotY: -0.006, rotZ:  0.003, floatSpeed: 0.60, parallax: 0.24, phase: 5, color: '#d0e4f8', maxOpacity: 0.65 },
  { pos: [-2.0, -4.8, -8.5], scale: 0.16, rotX: -0.003, rotY:  0.007, rotZ: -0.005, floatSpeed: 0.50, parallax: 0.20, phase: 7, color: '#b0cce8', maxOpacity: 0.68 },
  // Background (z -9.5 to -11) — small, barely-there, low parallax
  { pos: [ 9.0,  3.2, -9.5], scale: 0.13, rotX:  0.002, rotY:  0.004, rotZ:  0.003, floatSpeed: 0.35, parallax: 0.10, phase: 6, color: '#c8e0ff', maxOpacity: 0.55 },
  { pos: [-8.5, -2.8,-10.5], scale: 0.11, rotX: -0.003, rotY:  0.003, rotZ:  0.004, floatSpeed: 0.40, parallax: 0.07, phase: 9, color: '#aacaf4', maxOpacity: 0.50 },
  { pos: [ 2.8,  5.5,-11.0], scale: 0.10, rotX:  0.002, rotY: -0.003, rotZ:  0.002, floatSpeed: 0.30, parallax: 0.06, phase: 8, color: '#d0e4f8', maxOpacity: 0.45 },
];

function BSStarInstance({ config }: { config: StarConfig }) {
  const { scene: gltfScene } = useGLTF('/models/star.glb', '/draco/');
  const groupRef = useRef<THREE.Group>(null!);
  const offsetRef = useRef({ x: 0, y: 0 });
  const entryRef = useRef(0);

  const scene = useMemo(() => {
    const s = gltfScene.clone(true);
    s.position.set(0, 0, 0);
    s.scale.set(1, 1, 1);
    s.rotation.set(0, 0, 0);
    return s;
  }, [gltfScene]);

  useEffect(() => {
    scene.traverse((child: any) => {
      if (!child.isMesh) return;
      child.material = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(config.color),
        metalness: 1.0,
        roughness: 0.06,
        envMapIntensity: 2.5,
        emissive: new THREE.Color(config.color),
        emissiveIntensity: 0.15,
        clearcoat: 0.5,
        clearcoatRoughness: 0.05,
        transparent: true,
        opacity: 0,
      });
    });
  }, [scene, config.color]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    const { phase, parallax, floatSpeed, scale, maxOpacity, rotX, rotY, rotZ } = config;

    // Entrance — Hermite easing, staggered per-star
    const age = (performance.now() - _bsEntryTime) / 1000 - phase * 0.12;
    const rawEntry = clamp01(age / 1.4);
    entryRef.current = rawEntry * rawEntry * (3 - 2 * rawEntry);
    const entranceEase = entryRef.current;

    // Mouse parallax
    offsetRef.current.x = lerp(offsetRef.current.x, bsMouseState.lerpX * parallax, 0.05);
    offsetRef.current.y = lerp(offsetRef.current.y, bsMouseState.lerpY * parallax, 0.05);

    // Position + float
    groupRef.current.position.set(
      config.pos[0] + offsetRef.current.x,
      config.pos[1] + offsetRef.current.y + Math.sin(t * floatSpeed + phase) * 0.18,
      config.pos[2],
    );

    // Scale
    groupRef.current.scale.setScalar(scale * entranceEase);

    // Rotation
    groupRef.current.rotation.x += rotX;
    groupRef.current.rotation.y += rotY;
    groupRef.current.rotation.z += rotZ;

    // Material pulse
    scene.traverse((child: any) => {
      if (!child.isMesh || !child.material) return;
      const mat = child.material as THREE.MeshPhysicalMaterial;
      mat.envMapIntensity = 2.5 + Math.sin(t * 0.5 + phase) * 0.8;
      mat.emissiveIntensity = 0.12 + Math.sin(t * 0.3 + phase) * 0.06;
      mat.opacity = lerp(mat.opacity, maxOpacity * entranceEase, 0.06);
    });
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}

export function BSStarField({ isMobile }: { isMobile: boolean }) {
  const configs = isMobile ? BS_STAR_CONFIGS.slice(0, 5) : BS_STAR_CONFIGS;
  return (
    <>
      {configs.map((cfg, i) => (
        <BSStarInstance key={i} config={cfg} />
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Rock configs
// Floating at left/right screen edges, z: -4.5 to -6. No sweep — ambient.
// ---------------------------------------------------------------------------
interface RockConfig {
  pos: [number, number, number];
  scale: number;
  rotX: number; rotY: number; rotZ: number;
  floatSpeed: number;
  parallax: number;
  phase: number;
  maxOpacity: number;
}

const BS_ROCK_CONFIGS: RockConfig[] = [
  // Left edge
  { pos: [-7.5,  2.5, -5.0], scale: 0.44, rotX:  0.003, rotY:  0.005, rotZ:  0.002, floatSpeed: 0.40, parallax: 0.28, phase: 1, maxOpacity: 0.78 },
  { pos: [-9.0, -1.8, -5.8], scale: 0.38, rotX: -0.004, rotY:  0.003, rotZ:  0.004, floatSpeed: 0.55, parallax: 0.22, phase: 4, maxOpacity: 0.70 },
  { pos: [-8.2, -4.5, -4.5], scale: 0.42, rotX:  0.005, rotY: -0.004, rotZ:  0.003, floatSpeed: 0.35, parallax: 0.32, phase: 7, maxOpacity: 0.75 },
  // Right edge
  { pos: [ 7.8,  3.0, -5.5], scale: 0.40, rotX: -0.003, rotY:  0.006, rotZ:  0.003, floatSpeed: 0.50, parallax: 0.25, phase: 2, maxOpacity: 0.72 },
  { pos: [ 9.2, -2.2, -4.8], scale: 0.46, rotX:  0.004, rotY: -0.003, rotZ:  0.005, floatSpeed: 0.45, parallax: 0.20, phase: 6, maxOpacity: 0.80 },
];

function BSRockInstance({ config }: { config: RockConfig }) {
  const { scene: gltfScene } = useGLTF('/models/rock.glb', '/draco/');
  const groupRef = useRef<THREE.Group>(null!);
  const offsetRef = useRef({ x: 0, y: 0 });
  const entryRef = useRef(0);

  const scene = useMemo(() => {
    const s = gltfScene.clone(true);
    s.position.set(0, 0, 0);
    s.scale.set(1, 1, 1);
    s.rotation.set(0, 0, 0);
    return s;
  }, [gltfScene]);

  useEffect(() => {
    scene.traverse((child: any) => {
      if (!child.isMesh) return;
      child.material = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#88acd0'),
        metalness: 0.95,
        roughness: 0.18,
        envMapIntensity: 2.0,
        emissive: new THREE.Color('#1a3870'),
        emissiveIntensity: 0.08,
        clearcoat: 0.3,
        clearcoatRoughness: 0.12,
        transparent: true,
        opacity: 0,
      });
    });
  }, [scene]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    const { phase, parallax, floatSpeed, scale, maxOpacity, rotX, rotY, rotZ } = config;

    // Entrance
    const age = (performance.now() - _bsEntryTime) / 1000 - phase * 0.10;
    const rawEntry = clamp01(age / 1.4);
    entryRef.current = rawEntry * rawEntry * (3 - 2 * rawEntry);
    const entranceEase = entryRef.current;

    // Mouse parallax
    offsetRef.current.x = lerp(offsetRef.current.x, bsMouseState.lerpX * parallax, 0.05);
    offsetRef.current.y = lerp(offsetRef.current.y, bsMouseState.lerpY * parallax, 0.05);

    // Position + float
    groupRef.current.position.set(
      config.pos[0] + offsetRef.current.x,
      config.pos[1] + offsetRef.current.y + Math.sin(t * floatSpeed + phase) * 0.10,
      config.pos[2],
    );

    // Scale
    groupRef.current.scale.setScalar(scale * entranceEase);

    // Rotation
    groupRef.current.rotation.x += rotX;
    groupRef.current.rotation.y += rotY;
    groupRef.current.rotation.z += rotZ;

    // Material pulse
    scene.traverse((child: any) => {
      if (!child.isMesh || !child.material) return;
      const mat = child.material as THREE.MeshPhysicalMaterial;
      mat.envMapIntensity = 2.0 + Math.sin(t * 0.4 + phase) * 0.5;
      mat.emissiveIntensity = 0.06 + Math.sin(t * 0.25 + phase) * 0.03;
      mat.opacity = lerp(mat.opacity, maxOpacity * entranceEase, 0.06);
    });
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}

export function BSRockField({ isMobile }: { isMobile: boolean }) {
  const configs = isMobile ? BS_ROCK_CONFIGS.slice(0, 3) : BS_ROCK_CONFIGS;
  return (
    <>
      {configs.map((cfg, i) => (
        <BSRockInstance key={i} config={cfg} />
      ))}
    </>
  );
}
