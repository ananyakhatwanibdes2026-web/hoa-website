import {useEffect, useRef, useState, useMemo} from 'react';
import {Canvas, useFrame, useThree} from '@react-three/fiber';
import {
  useGLTF,
  Environment,
  Lightformer,
  Float,
  MeshDistortMaterial,
  Sparkles,
} from '@react-three/drei';
import {EffectComposer, Bloom} from '@react-three/postprocessing';
import * as THREE from 'three';
import {getLenis} from '~/components/global/SmoothScroll';
import {aboutSectionState, scenePhaseState} from '~/lib/sceneState';
import {BackgroundPaths} from './BackgroundPaths';
import {ParticleSpiral} from './ParticleSpiral';

if (typeof window !== 'undefined') {
  useGLTF.preload('/models/AN_Logo.glb', '/draco/');
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function getScrollProgress(): number {
  const docHeight =
    document.documentElement.scrollHeight - window.innerHeight;
  if (docHeight <= 0) return 0;
  const lenis = getLenis();
  const scrollTop = lenis ? (lenis as any).scroll : window.scrollY;
  return Math.max(0, Math.min(1, scrollTop / docHeight));
}

// ---------------------------------------------------------------------------
// Shared mouse tracker
// ---------------------------------------------------------------------------

const mouseState = {x: 0, y: 0, lerpX: 0, lerpY: 0};

function MouseTracker() {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      mouseState.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseState.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handler, {passive: true});
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  useFrame(() => {
    mouseState.lerpX = lerp(mouseState.lerpX, mouseState.x, 0.05);
    mouseState.lerpY = lerp(mouseState.lerpY, mouseState.y, 0.05);
  });

  return null;
}

function ScenePhaseDriver() {
  useEffect(() => {
    scenePhaseState.heroIntensity = 1;
    scenePhaseState.aboutIntensity = 0;
    scenePhaseState.transitionBlend = 0;
    return () => {
      scenePhaseState.heroIntensity = 1;
      scenePhaseState.aboutIntensity = 0;
      scenePhaseState.transitionBlend = 0;
    };
  }, []);

  useFrame(() => {
    const sp = getScrollProgress();

    const scrollAbout = smoothstep(0.28, 0.48, sp);
    const aboutProgressBoost = aboutSectionState.active
      ? 0.5 + aboutSectionState.sectionProgress * 0.5
      : 0;
    const targetAbout = clamp01(Math.max(scrollAbout, aboutProgressBoost));

    scenePhaseState.aboutIntensity = lerp(
      scenePhaseState.aboutIntensity,
      targetAbout,
      0.04,
    );
    scenePhaseState.heroIntensity = 1 - scenePhaseState.aboutIntensity;

    const enter = smoothstep(0.22, 0.30, sp);
    const exit = 1 - smoothstep(0.42, 0.54, sp);
    const scrollBridge = clamp01(enter * exit);
    const sectionBridge = aboutSectionState.active
      ? clamp01(1 - Math.abs(aboutSectionState.sectionProgress - 0.15) / 0.30)
      : 0;
    const targetBlend = Math.max(scrollBridge, sectionBridge * 0.6);

    scenePhaseState.transitionBlend = lerp(
      scenePhaseState.transitionBlend,
      targetBlend,
      0.08,
    );
  });

  return null;
}

// ---------------------------------------------------------------------------
// AN Logo (persistent, subtle idle animation)
// ---------------------------------------------------------------------------

function LogoModel() {
  const {scene} = useGLTF('/models/AN_Logo.glb', '/draco/');
  const groupRef = useRef<THREE.Group>(null!);
  const scrollRef = useRef(0);

  useEffect(() => {
    scene.rotation.set(-Math.PI / 2 + Math.PI, 0, Math.PI + Math.PI);

    scene.traverse((child: any) => {
      if (!child.isMesh) return;
      child.material = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#c8c8c8'),
        metalness: 1.0,
        roughness: 0.05,
        envMapIntensity: 2.5,
        clearcoat: 0.3,
        clearcoatRoughness: 0.1,
      });
    });

    const meshes: THREE.Mesh[] = [];
    scene.traverse((child: any) => {
      if (child.isMesh) meshes.push(child as THREE.Mesh);
    });

    if (meshes.length >= 2) {
      meshes.sort((a, b) => {
        const cA = new THREE.Vector3();
        const cB = new THREE.Vector3();
        new THREE.Box3().setFromObject(a).getCenter(cA);
        new THREE.Box3().setFromObject(b).getCenter(cB);
        return cA.x - cB.x;
      });
      meshes[0].position.x -= 0.3;
      meshes[meshes.length - 1].position.x += 0.3;
    }
  }, [scene]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;

    const sp = getScrollProgress();
    scrollRef.current = lerp(scrollRef.current, sp, 0.06);
    const smoothSp = scrollRef.current;

    // One full 360 rotation per section (8 sections = 8 rotations across full scroll)
    groupRef.current.rotation.y = smoothSp * Math.PI * 16;

    // Base scale 1.4 (bigger), compensate for camera z doubling (7->14) to maintain apparent size
    const breathe = 1.0 + Math.sin(t * 0.4) * 0.01;
    groupRef.current.scale.setScalar(1.4 * lerp(1.0, 2.0, smoothSp) * breathe);
  });

  return (
    <group ref={groupRef} position={[0, 0.3, 0]}>
      <primitive object={scene} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// Liquid Metal Blobs (scroll-reactive, with heartbeat pulse)
// ---------------------------------------------------------------------------

interface BlobConfig {
  position: [number, number, number];
  scale: number;
  distort: number;
  speed: number;
  driftY: number;
  driftX: number;
  driftZ: number;
  phaseOffset: number;
}

const BLOB_CONFIGS: BlobConfig[] = [
  {position: [-2.5, -1, -3], scale: 2.0, distort: 0.35, speed: 1.5, driftY: 3.0, driftX: -5, driftZ: 6, phaseOffset: 0},
  {position: [3, 1.5, -5], scale: 1.5, distort: 0.4, speed: 1.2, driftY: 2.5, driftX: 4, driftZ: 4, phaseOffset: 1.5},
  {position: [-1, 3, -4], scale: 1.0, distort: 0.3, speed: 1.8, driftY: 2.0, driftX: -4, driftZ: 5, phaseOffset: 3.0},
  {position: [1.5, -2, -7], scale: 1.8, distort: 0.25, speed: 1.0, driftY: 3.5, driftX: 3, driftZ: 3, phaseOffset: 4.5},
];

function LiquidBlob({config}: {config: BlobConfig}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const matRef = useRef<any>(null!);
  const scrollRef = useRef(0);

  useFrame((state) => {
    if (!meshRef.current) return;
    const sp = getScrollProgress();
    scrollRef.current = lerp(scrollRef.current, sp, 0.04);
    const heroIntensity = scenePhaseState.heroIntensity;
    const transitionBlend = scenePhaseState.transitionBlend;

    meshRef.current.position.x =
      config.position[0] + scrollRef.current * config.driftX;
    meshRef.current.position.y =
      config.position[1] + scrollRef.current * config.driftY;
    meshRef.current.position.z =
      config.position[2] - scrollRef.current * config.driftZ;

    const t = state.clock.elapsedTime;
    meshRef.current.rotation.x = t * 0.05;
    meshRef.current.rotation.z = t * 0.03;

    if (matRef.current) {
      // Fade blobs to near-invisible as user exits hero zone
      const blobFadeT = Math.max(0, Math.min(1, (scrollRef.current - 0.20) / 0.16));
      const phaseOpacity = lerp(0.06, 1.0, heroIntensity);
      matRef.current.opacity = lerp(1.0, 0.05, blobFadeT) * phaseOpacity;

      const pulse =
        1 +
        Math.sin((t + config.phaseOffset) * 0.8) * 0.15 +
        Math.sin((t + config.phaseOffset) * 1.6) * 0.05;
      matRef.current.envMapIntensity = 3.0 * pulse * lerp(0.35, 1.0, heroIntensity);
      matRef.current.distort =
        config.distort * lerp(0.35, 1.0, heroIntensity) + transitionBlend * 0.08;
      matRef.current.speed = config.speed * lerp(0.45, 1.0, heroIntensity);
    }
  });

  return (
    <Float speed={0.4} rotationIntensity={0.15} floatIntensity={0.3}>
      <mesh ref={meshRef} position={config.position} scale={config.scale}>
        <icosahedronGeometry args={[1, 8]} />
        <MeshDistortMaterial
          ref={matRef}
          color="#111111"
          metalness={1.0}
          roughness={0.05}
          envMapIntensity={3.0}
          distort={config.distort}
          speed={config.speed}
          transparent
        />
      </mesh>
    </Float>
  );
}

function LiquidBlobs({isMobile}: {isMobile: boolean}) {
  const blobs = isMobile ? BLOB_CONFIGS.slice(0, 2) : BLOB_CONFIGS;
  return (
    <>
      {blobs.map((config, i) => (
        <LiquidBlob key={i} config={config} />
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Floating orbs (mouse-reactive, with heartbeat pulse)
// ---------------------------------------------------------------------------

interface OrbConfig {
  basePos: [number, number, number];
  scale: number;
  speed: number;
  distort: number;
  parallax: number;
  color: string;
  phaseOffset: number;
}

const ORB_CONFIGS: OrbConfig[] = [
  {basePos: [-5, 2, -3], scale: 0.3, speed: 0.8, distort: 0.3, parallax: 0.4, color: '#c0c0cc', phaseOffset: 0.5},
  {basePos: [6, -1, -5], scale: 0.25, speed: 1.0, distort: 0.25, parallax: 0.3, color: '#b8b8c8', phaseOffset: 2.0},
  {basePos: [-3, -3, -6], scale: 0.2, speed: 1.2, distort: 0.35, parallax: 0.2, color: '#d0d0da', phaseOffset: 3.5},
  {basePos: [4, 3, -4], scale: 0.15, speed: 0.9, distort: 0.2, parallax: 0.35, color: '#a8a8b8', phaseOffset: 5.0},
  {basePos: [-7, 0, -7], scale: 0.35, speed: 0.7, distort: 0.4, parallax: 0.15, color: '#c8c8d0', phaseOffset: 1.0},
  {basePos: [2, -4, -8], scale: 0.18, speed: 1.1, distort: 0.3, parallax: 0.25, color: '#b0b0c0', phaseOffset: 4.0},
];

function FloatingOrb({config}: {config: OrbConfig}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const matRef = useRef<any>(null!);
  const offsetRef = useRef({x: 0, y: 0});

  useFrame((state) => {
    if (!meshRef.current) return;
    const heroIntensity = scenePhaseState.heroIntensity;
    const aboutIntensity = scenePhaseState.aboutIntensity;
    const targetX = mouseState.lerpX * config.parallax * 1.5;
    const targetY = mouseState.lerpY * config.parallax * 1.5;
    offsetRef.current.x = lerp(offsetRef.current.x, targetX, 0.03);
    offsetRef.current.y = lerp(offsetRef.current.y, targetY, 0.03);

    meshRef.current.position.x = config.basePos[0] + offsetRef.current.x;
    meshRef.current.position.y = config.basePos[1] + offsetRef.current.y;

    if (matRef.current) {
      const t = state.clock.elapsedTime;
      const pulse =
        1 +
        Math.sin((t + config.phaseOffset) * 0.8) * 0.15 +
        Math.sin((t + config.phaseOffset) * 1.6) * 0.05;
      matRef.current.envMapIntensity =
        2.0 * pulse * lerp(0.45, 1.0, heroIntensity);
      matRef.current.opacity = lerp(0.16, 0.9, heroIntensity) * lerp(1.0, 0.85, aboutIntensity);
    }
  });

  return (
    <Float speed={config.speed} rotationIntensity={0.3} floatIntensity={0.5}>
      <mesh ref={meshRef} position={config.basePos} scale={config.scale}>
        <sphereGeometry args={[1, 32, 32]} />
        <MeshDistortMaterial
          ref={matRef}
          color={config.color}
          metalness={1.0}
          roughness={0.0}
          envMapIntensity={2.0}
          distort={config.distort}
          speed={1.5}
          transparent
          opacity={0.9}
        />
      </mesh>
    </Float>
  );
}

function FloatingOrbs({isMobile}: {isMobile: boolean}) {
  const orbs = isMobile ? ORB_CONFIGS.slice(0, 3) : ORB_CONFIGS;
  return (
    <>
      {orbs.map((config, i) => (
        <FloatingOrb key={i} config={config} />
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Scroll decorative elements (chrome rings, glass shards, spirals, streaks)
// ---------------------------------------------------------------------------

interface DecoConfig {
  type: 'ring' | 'shard' | 'spiral' | 'streak';
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  scrollMin: number;
  scrollMax: number;
  rotSpeed: [number, number, number];
  driftY: number;
}

const DECO_CONFIGS: DecoConfig[] = [
  {type: 'ring', position: [-4, 2, -2], rotation: [0.3, 0.5, 0], scale: 0.8, scrollMin: 0.08, scrollMax: 0.35, rotSpeed: [0.02, 0.05, 0.01], driftY: 1.5},
  {type: 'ring', position: [5, -1, -4], rotation: [0.8, 0.2, 0.4], scale: 0.6, scrollMin: 0.25, scrollMax: 0.55, rotSpeed: [0.03, 0.02, 0.04], driftY: 2.0},
  {type: 'ring', position: [-3, 4, -6], rotation: [1.2, 0, 0.6], scale: 0.5, scrollMin: 0.45, scrollMax: 0.75, rotSpeed: [0.01, 0.04, 0.02], driftY: 1.0},
  {type: 'ring', position: [4, -3, -3], rotation: [0.5, 1.0, 0], scale: 0.7, scrollMin: 0.65, scrollMax: 0.95, rotSpeed: [0.04, 0.01, 0.03], driftY: 1.8},
  {type: 'shard', position: [6, 3, -5], rotation: [0.2, 0.8, 0.3], scale: 0.5, scrollMin: 0.1, scrollMax: 0.4, rotSpeed: [0.01, 0.02, 0.03], driftY: 1.2},
  {type: 'shard', position: [-5, -2, -3], rotation: [1.0, 0.3, 0.7], scale: 0.4, scrollMin: 0.35, scrollMax: 0.65, rotSpeed: [0.02, 0.03, 0.01], driftY: 1.5},
  {type: 'shard', position: [3, 5, -7], rotation: [0.6, 1.2, 0.1], scale: 0.35, scrollMin: 0.6, scrollMax: 0.9, rotSpeed: [0.03, 0.01, 0.02], driftY: 0.8},
  {type: 'spiral', position: [-6, 1, -5], rotation: [0, 0, 0.5], scale: 0.4, scrollMin: 0.15, scrollMax: 0.5, rotSpeed: [0, 0.03, 0], driftY: 2.0},
  {type: 'spiral', position: [5, -3, -6], rotation: [0.3, 0, 0.8], scale: 0.35, scrollMin: 0.5, scrollMax: 0.85, rotSpeed: [0, 0.025, 0], driftY: 1.5},
  {type: 'streak', position: [-3, 5, -4], rotation: [0, 0, 0.7], scale: 1.0, scrollMin: 0.05, scrollMax: 0.3, rotSpeed: [0, 0, 0.005], driftY: 0.5},
  {type: 'streak', position: [4, -4, -5], rotation: [0, 0, -0.5], scale: 0.8, scrollMin: 0.3, scrollMax: 0.6, rotSpeed: [0, 0, 0.008], driftY: 0.7},
  {type: 'streak', position: [-2, -5, -3], rotation: [0, 0, 1.0], scale: 0.9, scrollMin: 0.55, scrollMax: 0.85, rotSpeed: [0, 0, 0.004], driftY: 0.6},
];

const MOBILE_DECO_CONFIGS = DECO_CONFIGS.filter((_, i) => i % 3 === 0);

function SpiralGeometry() {
  const geometry = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const turns = 3;
    const radius = 0.5;
    const height = 2;
    for (let i = 0; i <= 80; i++) {
      const t = i / 80;
      const angle = t * turns * Math.PI * 2;
      points.push(
        new THREE.Vector3(
          Math.cos(angle) * radius,
          t * height - height / 2,
          Math.sin(angle) * radius,
        ),
      );
    }
    const curve = new THREE.CatmullRomCurve3(points);
    return new THREE.TubeGeometry(curve, 64, 0.015, 6, false);
  }, []);

  return <primitive object={geometry} attach="geometry" />;
}

const chromeMat = {
  color: '#c0c0c8',
  metalness: 1,
  roughness: 0.05,
  envMapIntensity: 2.5,
  clearcoat: 0.3,
  clearcoatRoughness: 0.1,
};

const glassMat = {
  color: '#ffffff',
  metalness: 0.1,
  roughness: 0,
  envMapIntensity: 1.5,
  transmission: 0.9,
  thickness: 0.1,
  ior: 1.5,
  transparent: true,
  opacity: 0.6,
};

function DecoElement({config}: {config: DecoConfig}) {
  const ref = useRef<THREE.Mesh>(null!);
  const scrollRef = useRef(0);

  useFrame((state) => {
    if (!ref.current) return;
    const sp = getScrollProgress();
    scrollRef.current = lerp(scrollRef.current, sp, 0.04);
    const heroIntensity = scenePhaseState.heroIntensity;
    const transitionBlend = scenePhaseState.transitionBlend;

    const t = state.clock.elapsedTime;
    ref.current.rotation.x += config.rotSpeed[0];
    ref.current.rotation.y += config.rotSpeed[1];
    ref.current.rotation.z += config.rotSpeed[2];

    ref.current.position.y =
      config.position[1] + scrollRef.current * config.driftY;

    // Fade in/out at scroll boundaries (5% ramp)
    const fadeIn = Math.min(
      1,
      Math.max(0, (scrollRef.current - config.scrollMin) / 0.05),
    );
    const fadeOut = Math.min(
      1,
      Math.max(0, (config.scrollMax - scrollRef.current) / 0.05),
    );
    const heroWindow = 1 - smoothstep(0.30, 0.46, scrollRef.current);
    const visibility =
      fadeIn * fadeOut * clamp01(heroWindow) * lerp(0.05, 1.0, heroIntensity);

    const mat = ref.current.material as THREE.MeshPhysicalMaterial;
    if (mat && mat.opacity !== undefined) {
      if (config.type === 'streak') {
        mat.opacity = 0.04 * visibility + transitionBlend * 0.02;
      } else if (config.type === 'shard') {
        mat.opacity = 0.6 * visibility;
      } else {
        mat.opacity = visibility;
      }
    }

    ref.current.scale.setScalar(
      config.scale * (0.9 + Math.sin(t * 0.3 + config.scrollMin * 10) * 0.1),
    );
  });

  return (
    <mesh
      ref={ref}
      position={config.position}
      rotation={config.rotation}
      scale={config.scale}
    >
      {config.type === 'ring' && <torusGeometry args={[0.8, 0.02, 8, 48]} />}
      {config.type === 'shard' && <planeGeometry args={[0.6, 1.2]} />}
      {config.type === 'spiral' && <SpiralGeometry />}
      {config.type === 'streak' && <planeGeometry args={[0.05, 3]} />}

      {config.type === 'streak' ? (
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.04}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      ) : config.type === 'shard' ? (
        <meshPhysicalMaterial {...glassMat} side={THREE.DoubleSide} />
      ) : (
        <meshPhysicalMaterial {...chromeMat} transparent />
      )}
    </mesh>
  );
}

function ScrollDecorations({isMobile}: {isMobile: boolean}) {
  const configs = isMobile ? MOBILE_DECO_CONFIGS : DECO_CONFIGS;
  return (
    <>
      {configs.map((config, i) => (
        <DecoElement key={i} config={config} />
      ))}
    </>
  );
}

function TransitionBridge() {
  const groupRef = useRef<THREE.Group>(null!);
  const outerRingRef = useRef<THREE.Mesh>(null!);
  const innerRingRef = useRef<THREE.Mesh>(null!);
  const veilRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    if (!groupRef.current || !outerRingRef.current || !innerRingRef.current || !veilRef.current) return;
    const t = state.clock.elapsedTime;
    const blend = scenePhaseState.transitionBlend;

    groupRef.current.rotation.z = t * 0.06;
    groupRef.current.position.y = 0.5 + Math.sin(t * 0.5) * 0.1;
    const scale = lerp(2.8, 3.6, blend);
    groupRef.current.scale.setScalar(scale);

    const outerMat = outerRingRef.current.material as THREE.MeshBasicMaterial;
    outerMat.opacity = blend * 0.55;

    const innerMat = innerRingRef.current.material as THREE.MeshBasicMaterial;
    innerMat.opacity = blend * 0.35;
    innerRingRef.current.rotation.z = -t * 0.1;

    const veilMat = veilRef.current.material as THREE.MeshBasicMaterial;
    veilMat.opacity = blend * 0.18;
  });

  return (
    <group ref={groupRef} position={[0, 0.5, 3.5]}>
      <mesh ref={veilRef}>
        <ringGeometry args={[0.6, 1.8, 64]} />
        <meshBasicMaterial
          color="#c8c8e0"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={outerRingRef} rotation={[0, 0, Math.PI * 0.12]}>
        <torusGeometry args={[1.6, 0.018, 12, 128]} />
        <meshBasicMaterial
          color="#d0d0e4"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={innerRingRef}>
        <torusGeometry args={[0.9, 0.012, 12, 96]} />
        <meshBasicMaterial
          color="#e0e0f0"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Scroll-driven camera with zoom-in intro
// ---------------------------------------------------------------------------

function ScrollCamera() {
  const {camera} = useThree();
  const scrollRef = useRef(0);
  const introRef = useRef({active: false, progress: 0, started: false});

  useEffect(() => {
    const handler = () => {
      introRef.current.active = true;
      introRef.current.progress = 0;
      introRef.current.started = true;
    };
    window.addEventListener('preloader-complete', handler);
    return () => window.removeEventListener('preloader-complete', handler);
  }, []);

  useFrame((state, delta) => {
    const intro = introRef.current;
    const t = state.clock.elapsedTime;

    if (intro.active) {
      intro.progress = Math.min(1, intro.progress + delta / 2.5);
      const ease = 1 - Math.pow(1 - intro.progress, 3);

      camera.position.x = Math.sin(t * 0.07) * 0.3;
      camera.position.y = lerp(0.2, 0.5, ease) + Math.sin(t * 0.05) * 0.15;
      camera.position.z = lerp(3.5, 7, ease);
      camera.lookAt(0, lerp(0.3, 0.3, ease), 0);

      if (intro.progress >= 1) {
        intro.active = false;
      }
      return;
    }

    // Normal scroll-driven camera (skip if intro hasn't happened yet)
    if (!intro.started) {
      camera.position.set(0, 0.2, 3.5);
      camera.lookAt(0, 0.3, 0);
      return;
    }

    const progress = getScrollProgress();
    scrollRef.current = lerp(scrollRef.current, progress, 0.06);
    const sp = scrollRef.current;

    // Station-based camera: lingers in hero, shifts noticeably between sections
    let baseZ: number;
    let baseY: number;
    if (sp < 0.20) {
      const t2 = sp / 0.20;
      baseZ = lerp(7, 8.2, t2);
      baseY = lerp(0.5, 0.75, t2);
    } else if (sp < 0.34) {
      const t2 = (sp - 0.20) / 0.14;
      baseZ = lerp(8.2, 10.2, t2);
      baseY = lerp(0.75, 1.45, t2);
    } else if (sp < 0.50) {
      const t2 = (sp - 0.34) / 0.16;
      baseZ = lerp(10.2, 12, t2);
      baseY = lerp(1.45, 2.0, t2);
    } else {
      const t2 = Math.min(1, (sp - 0.50) / 0.50);
      baseZ = lerp(12, 14, t2);
      baseY = lerp(2.0, 3.0, t2);
    }

    camera.position.x = Math.sin(t * 0.07) * 0.3;
    camera.position.y = baseY + Math.sin(t * 0.05) * 0.15;
    camera.position.z = baseZ;

    camera.lookAt(0, lerp(0.3, 0, sp), 0);
  });

  return null;
}

// ---------------------------------------------------------------------------
// Animated Lightformer environment with breathing
// ---------------------------------------------------------------------------

function AnimatedEnvironment() {
  const overheadRef = useRef<any>(null!);

  useFrame((state) => {
    if (!overheadRef.current) return;
    const t = state.clock.elapsedTime;
    overheadRef.current.intensity = 5 + Math.sin(t * 0.3) * 0.5;
  });

  return (
    <Environment resolution={256} background={false}>
      <Lightformer
        ref={overheadRef}
        intensity={5}
        position={[0, 10, 0]}
        rotation-x={-Math.PI / 2}
        scale={[40, 40, 1]}
        color="#ffffff"
      />
      <Lightformer
        intensity={2}
        position={[-10, 5, -5]}
        rotation-y={Math.PI / 4}
        scale={[5, 20, 1]}
        color="#ddd4ff"
      />
      <Lightformer
        intensity={3}
        position={[10, 3, 5]}
        rotation-y={-Math.PI / 4}
        scale={[3, 15, 1]}
        color="#e8e8e8"
      />
      <Lightformer
        intensity={1.5}
        position={[0, 0, 12]}
        scale={[30, 20, 1]}
        color="#ccc8d8"
      />
      <Lightformer
        intensity={0.3}
        position={[0, -10, 0]}
        rotation-x={Math.PI / 2}
        scale={40}
        color="#080808"
      />
    </Environment>
  );
}

// ---------------------------------------------------------------------------
// Atmospheric fog synced with BackgroundJourney
// ---------------------------------------------------------------------------

function AtmosphericFog() {
  const {scene} = useThree();
  const scrollRef = useRef(0);

  useEffect(() => {
    scene.fog = new THREE.FogExp2('#0f0a1e', 0.012);
    return () => {
      scene.fog = null;
    };
  }, [scene]);

  useFrame(() => {
    if (!scene.fog) return;
    const sp = getScrollProgress();
    scrollRef.current = lerp(scrollRef.current, sp, 0.04);
    const fog = scene.fog as THREE.FogExp2;

    if (scrollRef.current < 0.68) {
      // Deep indigo -> slate blue (matches background journey)
      const t = Math.max(0, (scrollRef.current - 0.25) / 0.43);
      fog.color.setRGB(
        lerp(0.059, 0.118, t),
        lerp(0.039, 0.161, t),
        lerp(0.118, 0.231, t),
      );
    } else if (scrollRef.current < 0.82) {
      // Slate blue -> refined silver
      const t = (scrollRef.current - 0.68) / 0.14;
      fog.color.setRGB(
        lerp(0.118, 0.753, t),
        lerp(0.161, 0.753, t),
        lerp(0.231, 0.753, t),
      );
    } else {
      fog.color.set('#c0c0c0');
    }
  });

  return null;
}

function AdaptiveSparkles({isMobile}: {isMobile: boolean}) {
  const sparklesRef = useRef<any>(null);

  useFrame(() => {
    if (!sparklesRef.current?.material) return;
    const heroIntensity = scenePhaseState.heroIntensity;
    sparklesRef.current.material.opacity = lerp(0.05, 0.3, heroIntensity);
  });

  return (
    <Sparkles
      ref={sparklesRef}
      count={isMobile ? 10 : 25}
      scale={[15, 10, 10]}
      size={1.2}
      speed={0.15}
      color="#ffffff"
      opacity={0.3}
    />
  );
}

function AdaptivePostFX({isMobile}: {isMobile: boolean}) {
  const bloomRef = useRef<any>(null);

  useFrame(() => {
    if (!bloomRef.current) return;
    const heroIntensity = scenePhaseState.heroIntensity;
    const base = isMobile ? 0.16 : 0.22;
    const heroBoost = isMobile ? 0.14 : 0.28;
    bloomRef.current.intensity = base + heroBoost * heroIntensity;
  });

  return (
    <EffectComposer>
      <Bloom
        ref={bloomRef}
        luminanceThreshold={0.4}
        luminanceSmoothing={0.9}
        intensity={isMobile ? 0.3 : 0.5}
        radius={0.8}
      />
    </EffectComposer>
  );
}

// ---------------------------------------------------------------------------
// Main scene
// ---------------------------------------------------------------------------

function Scene({isMobile}: {isMobile: boolean}) {
  return (
    <>
      <AnimatedEnvironment />
      <AtmosphericFog />
      <ScenePhaseDriver />

      <MouseTracker />
      <ScrollCamera />

      {/* Deep background layers (rendered first for correct depth) */}
      <BackgroundPaths isMobile={isMobile} />
      <ParticleSpiral isMobile={isMobile} />

      <LogoModel />
      <TransitionBridge />
      <LiquidBlobs isMobile={isMobile} />
      <FloatingOrbs isMobile={isMobile} />
      <ScrollDecorations isMobile={isMobile} />

      <AdaptiveSparkles isMobile={isMobile} />
      <AdaptivePostFX isMobile={isMobile} />
    </>
  );
}

// ---------------------------------------------------------------------------
// ClientOnly gate
// ---------------------------------------------------------------------------

function ClientOnly({children}: {children: React.ReactNode}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? <>{children}</> : null;
}

// ---------------------------------------------------------------------------
// Public export
// ---------------------------------------------------------------------------

export function SceneCanvas() {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <ClientOnly>
      <Canvas
        camera={{fov: 75, near: 0.1, far: 200, position: [0, 0.2, 3.5]}}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
        }}
        dpr={isMobile ? [1, 1] : [1, 1.5]}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
        }}
      >
        <Scene isMobile={isMobile} />
      </Canvas>
    </ClientOnly>
  );
}

export default SceneCanvas;
