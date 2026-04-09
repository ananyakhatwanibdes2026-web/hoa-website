import {useEffect, useRef, useState, useMemo} from 'react';
import {Canvas, useFrame, useThree} from '@react-three/fiber';
import {
  useGLTF,
  Environment,
  Lightformer,
} from '@react-three/drei';
import {EffectComposer, SelectiveBloom, Selection, Select} from '@react-three/postprocessing';
import * as THREE from 'three';
import {getLenis} from '~/components/global/SmoothScroll';
import {aboutSectionState, scenePhaseState} from '~/lib/sceneState';

if (typeof window !== 'undefined') {
  useGLTF.preload('/models/AN_Logo.glb', '/draco/');
  useGLTF.preload('/models/star.glb', '/draco/');
  useGLTF.preload('/models/rock.glb', '/draco/');
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

// Star field entrance -- fires once on preloader-complete, staggered per-star
let _starEntryActive = false;
let _starEntryTime = 0;
if (typeof window !== 'undefined') {
  window.addEventListener('preloader-complete', () => {
    _starEntryActive = true;
    _starEntryTime = performance.now();
  }, {once: true});
  setTimeout(() => {
    if (!_starEntryActive) {
      _starEntryActive = true;
      _starEntryTime = performance.now();
    }
  }, 4000);
}

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
    scenePhaseState.latePageFade = 0;
    scenePhaseState.logoFade = 0;
    return () => {
      scenePhaseState.heroIntensity = 1;
      scenePhaseState.aboutIntensity = 0;
      scenePhaseState.transitionBlend = 0;
      scenePhaseState.latePageFade = 0;
      scenePhaseState.logoFade = 0;
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

    const targetLateFade = smoothstep(0.24, 0.30, sp);
    scenePhaseState.latePageFade = lerp(
      scenePhaseState.latePageFade,
      targetLateFade,
      0.15,
    );

    const aboutLogoTarget = clamp01((aboutSectionState.sectionProgress - 0.45) / 0.35);
    scenePhaseState.logoFade = lerp(
      scenePhaseState.logoFade,
      Math.max(aboutLogoTarget, targetLateFade),
      0.12,
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
  const logoMatsRef = useRef<THREE.MeshPhysicalMaterial[]>([]);
  const rotYRef = useRef(0);

  useEffect(() => {
    scene.rotation.set(-Math.PI / 2 + Math.PI, 0, Math.PI + Math.PI);

    const mats: THREE.MeshPhysicalMaterial[] = [];
    scene.traverse((child: any) => {
      if (!child.isMesh) return;
      const mat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#a8a8a8'),
        metalness: 1.0,
        roughness: 0.12,
        envMapIntensity: 0.5,
        emissive: new THREE.Color('#a09890'),
        emissiveIntensity: 0.12,
        clearcoat: 0.2,
        clearcoatRoughness: 0.06,
        transparent: true,
        opacity: 1,
      });
      child.material = mat;
      mats.push(mat);
    });
    logoMatsRef.current = mats;

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
    const logoFade = scenePhaseState.logoFade;

    const sp = getScrollProgress();
    scrollRef.current = lerp(scrollRef.current, sp, 0.06);
    const smoothSp = scrollRef.current;

    const rotSpeed = smoothSp * Math.PI * 32;
    rotYRef.current = lerp(rotYRef.current, rotSpeed, 1 - logoFade * 0.97);
    groupRef.current.rotation.y = rotYRef.current;

    const breathe = 1.0 + Math.sin(t * 0.4) * 0.01;
    groupRef.current.scale.setScalar(1.4 * lerp(1.0, 2.0, smoothSp) * breathe);

    const logoOpacity = 1 - logoFade;
    for (const mat of logoMatsRef.current) {
      mat.opacity = logoOpacity;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.3, 0]}>
      <primitive object={scene} />
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
    overheadRef.current.intensity = 3.5 + Math.sin(t * 0.3) * 0.3;
  });

  return (
    <Environment resolution={256} background={false}>
      <Lightformer
        ref={overheadRef}
        intensity={3.5}
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
      <Lightformer
        intensity={2.5}
        position={[0, 2, -10]}
        scale={[60, 40, 1]}
        color="#1a50c8"
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
    scene.fog = new THREE.FogExp2('#141820', 0.012);
    return () => {
      scene.fog = null;
    };
  }, [scene]);

  useFrame(() => {
    if (!scene.fog) return;
    const sp = getScrollProgress();
    scrollRef.current = lerp(scrollRef.current, sp, 0.04);
    const fog = scene.fog as THREE.FogExp2;

    if (scrollRef.current < 0.04) {
      // Silver -> blue (quick)
      const t = scrollRef.current / 0.04;
      fog.color.setRGB(
        lerp(0.078, 0.031, t),
        lerp(0.094, 0.063, t),
        lerp(0.125, 0.118, t),
      );
    } else if (scrollRef.current < 0.13) {
      // Hold blue
      fog.color.setRGB(0.031, 0.063, 0.118);
    } else if (scrollRef.current < 0.25) {
      // Blue -> black
      const t = (scrollRef.current - 0.13) / 0.12;
      fog.color.setRGB(
        lerp(0.031, 0.020, t),
        lerp(0.063, 0.020, t),
        lerp(0.118, 0.020, t),
      );
    } else if (scrollRef.current < 0.68) {
      // Black -> medium steel
      const t = Math.max(0, (scrollRef.current - 0.25) / 0.43);
      fog.color.setRGB(
        lerp(0.020, 0.220, t),
        lerp(0.020, 0.220, t),
        lerp(0.020, 0.282, t),
      );
    } else if (scrollRef.current < 0.82) {
      // Medium steel -> polished silver
      const t = (scrollRef.current - 0.68) / 0.14;
      fog.color.setRGB(
        lerp(0.220, 0.745, t),
        lerp(0.220, 0.745, t),
        lerp(0.282, 0.753, t),
      );
    } else {
      fog.color.set('#bebec0');
    }
  });

  return null;
}

function AdaptivePostFX({isMobile}: {isMobile: boolean}) {
  return (
    <EffectComposer multisampling={isMobile ? 0 : 4} autoClear={false}>
      <SelectiveBloom
        mipmapBlur
        luminanceThreshold={0.55}
        luminanceSmoothing={0.9}
        intensity={isMobile ? 0.35 : 0.55}
      />
    </EffectComposer>
  );
}

// ---------------------------------------------------------------------------
// Star decorations (hero section only, fade with scroll)
// ---------------------------------------------------------------------------

interface StarConfig {
  pos: [number, number, number];
  scale: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  floatSpeed: number;
  parallax: number;
  phase: number;
  color: string;
  maxOpacity: number;
}

const STAR_CONFIGS: StarConfig[] = [
  // --- FOREGROUND (5) z: -1.5 to -2.5 -- large, strong parallax, high opacity ---
  {pos: [-6.5,  3.8, -2.0], scale: 0.45, rotX: 0.004, rotY: 0.009, rotZ: 0.003, floatSpeed: 0.38, parallax: 0.72, phase: 0.0, color: '#b0cce8', maxOpacity: 0.95},
  {pos: [ 7.2,  2.8, -1.8], scale: 0.52, rotX: 0.007, rotY: 0.005, rotZ: 0.008, floatSpeed: 0.28, parallax: 0.68, phase: 1.5, color: '#a0c4fc', maxOpacity: 1.00},
  {pos: [-4.5, -3.5, -2.2], scale: 0.38, rotX: 0.006, rotY: 0.004, rotZ: 0.005, floatSpeed: 0.44, parallax: 0.76, phase: 2.8, color: '#b8d0f0', maxOpacity: 0.90},
  {pos: [ 5.5, -3.8, -1.5], scale: 0.42, rotX: 0.005, rotY: 0.008, rotZ: 0.004, floatSpeed: 0.32, parallax: 0.64, phase: 4.0, color: '#c8e0ff', maxOpacity: 0.95},
  {pos: [ 1.5,  5.5, -2.5], scale: 0.48, rotX: 0.003, rotY: 0.007, rotZ: 0.006, floatSpeed: 0.22, parallax: 0.58, phase: 5.5, color: '#aacaf4', maxOpacity: 0.92},
  // --- MIDGROUND (12) z: -3 to -5 ---
  {pos: [-3.5,  2.5, -3.0], scale: 0.25, rotX: 0.003, rotY: 0.007, rotZ: 0.002, floatSpeed: 0.40, parallax: 0.38, phase: 0.5, color: '#c8c8d4', maxOpacity: 0.92},
  {pos: [ 4.2,  2.2, -4.0], scale: 0.20, rotX: 0.005, rotY: 0.003, rotZ: 0.006, floatSpeed: 0.30, parallax: 0.30, phase: 1.2, color: '#aabbd8', maxOpacity: 0.88},
  {pos: [-5.0, -1.2, -3.5], scale: 0.18, rotX: 0.004, rotY: 0.006, rotZ: 0.003, floatSpeed: 0.50, parallax: 0.44, phase: 2.4, color: '#c0c0cc', maxOpacity: 0.85},
  {pos: [ 3.2, -2.5, -3.2], scale: 0.22, rotX: 0.006, rotY: 0.004, rotZ: 0.005, floatSpeed: 0.35, parallax: 0.32, phase: 3.6, color: '#b0bcd4', maxOpacity: 0.90},
  {pos: [-2.0,  4.2, -4.5], scale: 0.30, rotX: 0.002, rotY: 0.005, rotZ: 0.004, floatSpeed: 0.25, parallax: 0.22, phase: 4.8, color: '#c4c4d0', maxOpacity: 0.88},
  {pos: [ 5.8,  0.5, -3.8], scale: 0.28, rotX: 0.007, rotY: 0.002, rotZ: 0.003, floatSpeed: 0.28, parallax: 0.26, phase: 0.8, color: '#d0d0dc', maxOpacity: 0.85},
  {pos: [-6.2,  1.8, -4.2], scale: 0.15, rotX: 0.005, rotY: 0.008, rotZ: 0.002, floatSpeed: 0.45, parallax: 0.40, phase: 2.0, color: '#a8b8d0', maxOpacity: 0.82},
  {pos: [ 1.8,  4.0, -5.0], scale: 0.32, rotX: 0.003, rotY: 0.004, rotZ: 0.006, floatSpeed: 0.20, parallax: 0.18, phase: 5.2, color: '#c8d0e0', maxOpacity: 0.88},
  {pos: [-1.5, -3.5, -4.0], scale: 0.20, rotX: 0.006, rotY: 0.003, rotZ: 0.004, floatSpeed: 0.38, parallax: 0.28, phase: 3.0, color: '#c0c8d8', maxOpacity: 0.84},
  {pos: [ 6.5, -2.0, -3.5], scale: 0.16, rotX: 0.004, rotY: 0.006, rotZ: 0.005, floatSpeed: 0.42, parallax: 0.34, phase: 1.6, color: '#d4d4e0', maxOpacity: 0.80},
  {pos: [-8.5,  0.5, -4.8], scale: 0.26, rotX: 0.005, rotY: 0.003, rotZ: 0.007, floatSpeed: 0.33, parallax: 0.20, phase: 3.8, color: '#b8c4d8', maxOpacity: 0.80},
  {pos: [ 8.0,  1.8, -4.5], scale: 0.23, rotX: 0.003, rotY: 0.007, rotZ: 0.004, floatSpeed: 0.27, parallax: 0.22, phase: 6.2, color: '#ccd8e8', maxOpacity: 0.84},
  // --- BACKGROUND (8) z: -6 to -9 -- small, subtle parallax ---
  {pos: [-4.0,  1.5, -6.5], scale: 0.12, rotX: 0.006, rotY: 0.004, rotZ: 0.003, floatSpeed: 0.55, parallax: 0.10, phase: 1.0, color: '#c0c8e0', maxOpacity: 0.72},
  {pos: [ 3.5,  3.0, -7.0], scale: 0.10, rotX: 0.004, rotY: 0.008, rotZ: 0.005, floatSpeed: 0.40, parallax: 0.08, phase: 2.5, color: '#b4bcd4', maxOpacity: 0.65},
  {pos: [-2.5, -4.0, -6.0], scale: 0.13, rotX: 0.007, rotY: 0.003, rotZ: 0.006, floatSpeed: 0.48, parallax: 0.12, phase: 4.0, color: '#c8ccd8', maxOpacity: 0.70},
  {pos: [ 5.0, -1.5, -8.0], scale: 0.09, rotX: 0.005, rotY: 0.006, rotZ: 0.004, floatSpeed: 0.35, parallax: 0.06, phase: 5.8, color: '#b0b8cc', maxOpacity: 0.60},
  {pos: [-7.0,  3.5, -7.5], scale: 0.11, rotX: 0.003, rotY: 0.005, rotZ: 0.007, floatSpeed: 0.42, parallax: 0.09, phase: 0.3, color: '#c4c8dc', maxOpacity: 0.68},
  {pos: [ 2.0, -3.0, -6.8], scale: 0.14, rotX: 0.006, rotY: 0.004, rotZ: 0.003, floatSpeed: 0.58, parallax: 0.11, phase: 3.3, color: '#bcc4d8', maxOpacity: 0.64},
  {pos: [-0.5,  5.5, -7.2], scale: 0.10, rotX: 0.004, rotY: 0.007, rotZ: 0.005, floatSpeed: 0.30, parallax: 0.07, phase: 1.8, color: '#c0d0e4', maxOpacity: 0.62},
  {pos: [ 7.5,  4.5, -8.5], scale: 0.08, rotX: 0.005, rotY: 0.003, rotZ: 0.006, floatSpeed: 0.45, parallax: 0.05, phase: 4.5, color: '#b8c8dc', maxOpacity: 0.58},
];

function StarInstance({config}: {config: StarConfig}) {
  const {scene: origScene} = useGLTF('/models/star.glb', '/draco/');
  const {camera} = useThree();
  const scene = useMemo(() => origScene.clone(true), [origScene]);
  const groupRef = useRef<THREE.Group>(null!);
  const matsRef = useRef<THREE.MeshPhysicalMaterial[]>([]);
  const offsetRef = useRef({x: 0, y: 0});
  const scrollRef = useRef(0);
  const entryRef = useRef(0);
  const projVec = useRef(new THREE.Vector3());

  useEffect(() => {
    const mats: THREE.MeshPhysicalMaterial[] = [];
    scene.traverse((child: any) => {
      if (!child.isMesh) return;
      const mat = new THREE.MeshPhysicalMaterial({
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
      child.material = mat;
      mats.push(mat);
    });
    matsRef.current = mats;
  }, [scene, config.color]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime + config.phase;

    // Entrance: scale from 0 to 1, staggered by phase
    if (_starEntryActive) {
      const age = (performance.now() - _starEntryTime) / 1000 - config.phase * 0.12;
      entryRef.current = clamp01(age / 1.4);
    }
    const entranceEase = entryRef.current * entryRef.current * (3 - 2 * entryRef.current);

    const sp = getScrollProgress();
    scrollRef.current = lerp(scrollRef.current, sp, 0.07);

    // Mouse parallax (snappier lerp for foreground stars)
    const targetX = mouseState.lerpX * config.parallax;
    const targetY = mouseState.lerpY * config.parallax;
    offsetRef.current.x = lerp(offsetRef.current.x, targetX, 0.05);
    offsetRef.current.y = lerp(offsetRef.current.y, targetY, 0.05);

    // Scatter: stars fly radially outward + toward camera as user scrolls
    const scatterT = smoothstep(0.0, 0.22, scrollRef.current);
    const scatterMult = 1.0 + scatterT * 2.5;
    const zScatter = scatterT * 4.0;

    // Position: base + float + mouse parallax + scatter
    groupRef.current.position.x = (config.pos[0] + offsetRef.current.x) * scatterMult;
    groupRef.current.position.y =
      (config.pos[1] + offsetRef.current.y + Math.sin(t * config.floatSpeed) * 0.22) * scatterMult;
    groupRef.current.position.z = config.pos[2] + zScatter;

    // Scale with entrance
    groupRef.current.scale.setScalar(config.scale * entranceEase);

    // Rotation -- speeds up during scatter for kinetic energy
    const rotMult = 1 + scatterT * 4;
    groupRef.current.rotation.x += config.rotX * rotMult;
    groupRef.current.rotation.y += config.rotY * rotMult;
    groupRef.current.rotation.z += config.rotZ * rotMult;

    // Mouse proximity -- project star world pos to NDC, compare to mouse
    projVec.current.set(config.pos[0], config.pos[1], config.pos[2]);
    projVec.current.project(camera);
    const dx = mouseState.lerpX - projVec.current.x;
    const dy = mouseState.lerpY - projVec.current.y;
    const proximity = Math.max(0, 1 - (dx * dx + dy * dy) * 3);

    // Fade: fully visible in hero, gone by ~22% scroll
    const scrollFade = 1 - smoothstep(0.0, 0.22, scrollRef.current);
    const targetOpacity = scrollFade * config.maxOpacity * entranceEase;

    // Pulsing env + emissive, boosted by proximity
    const envPulse = 2.5 + Math.sin(t * 0.5 + config.phase) * 0.8 + proximity * 3.5;
    const emissivePulse = 0.12 + Math.sin(t * 0.3 + config.phase) * 0.06 + proximity * 0.5;

    for (const mat of matsRef.current) {
      mat.opacity = lerp(mat.opacity, targetOpacity, 0.06);
      mat.envMapIntensity = envPulse;
      mat.emissiveIntensity = emissivePulse;
    }
  });

  return (
    <group ref={groupRef} position={config.pos} scale={0}>
      <primitive object={scene} />
    </group>
  );
}

function StarField({isMobile}: {isMobile: boolean}) {
  // Keep all 5 foreground stars on mobile (biggest visual impact), halve mid + background
  const configs = isMobile
    ? STAR_CONFIGS.slice(0, 5).concat(STAR_CONFIGS.slice(5).filter((_, i) => i % 2 === 0))
    : STAR_CONFIGS;
  return (
    <>
      {configs.map((config, i) => (
        <StarInstance key={i} config={config} />
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Rock decorations (hero section only, shooting-star sweep on scroll)
// ---------------------------------------------------------------------------

interface RockConfig {
  pos: [number, number, number];
  scale: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  floatSpeed: number;
  parallax: number;
  phase: number;
  maxOpacity: number;
  travelX: number;
  travelY: number;
  travelZ: number;
}

const ROCK_CONFIGS: RockConfig[] = [
  // --- LEFT EDGE rocks -- travel rightward (+travelX), evenly spaced y: 4.5 to -4.5 ---
  {pos: [-7.5,  4.5, -2.0], scale: 0.45, rotX: 0.012, rotY: 0.018, rotZ: 0.008, floatSpeed: 0.28, parallax: 0.55, phase: 0.0, maxOpacity: 0.88, travelX:  24, travelY: -2.5, travelZ: 3.0},
  {pos: [-9.0,  2.2, -3.5], scale: 0.39, rotX: 0.015, rotY: 0.010, rotZ: 0.014, floatSpeed: 0.34, parallax: 0.45, phase: 1.5, maxOpacity: 0.82, travelX:  22, travelY: -1.0, travelZ: 2.5},
  {pos: [-7.2,  0.0, -2.5], scale: 0.52, rotX: 0.010, rotY: 0.016, rotZ: 0.012, floatSpeed: 0.22, parallax: 0.60, phase: 3.0, maxOpacity: 0.90, travelX:  26, travelY: -1.8, travelZ: 3.5},
  {pos: [-8.8, -2.2, -3.0], scale: 0.42, rotX: 0.014, rotY: 0.012, rotZ: 0.010, floatSpeed: 0.38, parallax: 0.42, phase: 4.5, maxOpacity: 0.80, travelX:  21, travelY:  1.0, travelZ: 2.0},
  {pos: [-7.5, -4.5, -2.2], scale: 0.36, rotX: 0.009, rotY: 0.015, rotZ: 0.011, floatSpeed: 0.30, parallax: 0.50, phase: 6.0, maxOpacity: 0.78, travelX:  20, travelY:  2.2, travelZ: 2.2},
  // --- RIGHT EDGE rocks -- travel leftward (-travelX), evenly spaced y: 3.5 to -3.5 ---
  {pos: [ 7.8,  3.5, -2.0], scale: 0.49, rotX: 0.013, rotY: 0.017, rotZ: 0.009, floatSpeed: 0.26, parallax: 0.58, phase: 0.8, maxOpacity: 0.86, travelX: -23, travelY: -2.0, travelZ: 3.0},
  {pos: [ 9.0,  0.0, -3.5], scale: 0.39, rotX: 0.011, rotY: 0.013, rotZ: 0.015, floatSpeed: 0.40, parallax: 0.46, phase: 2.5, maxOpacity: 0.82, travelX: -21, travelY: -0.8, travelZ: 2.5},
  {pos: [ 7.5, -3.5, -2.5], scale: 0.45, rotX: 0.016, rotY: 0.011, rotZ: 0.013, floatSpeed: 0.32, parallax: 0.52, phase: 5.0, maxOpacity: 0.84, travelX: -22, travelY:  1.5, travelZ: 2.8},
];

function RockInstance({config}: {config: RockConfig}) {
  const {scene: origScene} = useGLTF('/models/rock.glb', '/draco/');
  const scene = useMemo(() => origScene.clone(true), [origScene]);
  const groupRef = useRef<THREE.Group>(null!);
  const matsRef = useRef<THREE.MeshPhysicalMaterial[]>([]);
  const offsetRef = useRef({x: 0, y: 0});
  const scrollRef = useRef(0);
  const entryRef = useRef(0);

  useEffect(() => {
    const mats: THREE.MeshPhysicalMaterial[] = [];
    scene.traverse((child: any) => {
      if (!child.isMesh) return;
      const mat = new THREE.MeshPhysicalMaterial({
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
      child.material = mat;
      mats.push(mat);
    });
    matsRef.current = mats;
  }, [scene]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime + config.phase;

    // Entrance: staggered fade-in on preloader-complete (reuses star entry vars)
    if (_starEntryActive) {
      const age = (performance.now() - _starEntryTime) / 1000 - config.phase * 0.10;
      entryRef.current = clamp01(age / 1.4);
    }
    const entranceEase = entryRef.current * entryRef.current * (3 - 2 * entryRef.current);

    const sp = getScrollProgress();
    scrollRef.current = lerp(scrollRef.current, sp, 0.07);

    // Mouse parallax
    offsetRef.current.x = lerp(offsetRef.current.x, mouseState.lerpX * config.parallax, 0.05);
    offsetRef.current.y = lerp(offsetRef.current.y, mouseState.lerpY * config.parallax, 0.05);

    // Staggered shooting-star sweep -- each rock begins its arc at a different scroll position
    const sweepStart = clamp01(config.phase * 0.018);
    const sweepT = smoothstep(sweepStart, sweepStart + 0.16, scrollRef.current);

    // Directional trajectory across the viewport
    groupRef.current.position.x = config.pos[0] + offsetRef.current.x + config.travelX * sweepT;
    groupRef.current.position.y =
      config.pos[1] + offsetRef.current.y + config.travelY * sweepT +
      Math.sin(t * config.floatSpeed) * 0.12;
    groupRef.current.position.z = config.pos[2] + config.travelZ * sweepT;

    // Scale with entrance
    groupRef.current.scale.setScalar(config.scale * entranceEase);

    // Tumbling rotation -- spins up as sweep accelerates
    const rotMult = 1 + sweepT * 7;
    groupRef.current.rotation.x += config.rotX * rotMult;
    groupRef.current.rotation.y += config.rotY * rotMult;
    groupRef.current.rotation.z += config.rotZ * rotMult;

    // Fade: visible in hero, gone by ~28% scroll (slightly later than stars to let arcs complete)
    const scrollFade = 1 - smoothstep(0.0, 0.28, scrollRef.current);
    const targetOpacity = scrollFade * config.maxOpacity * entranceEase;

    const envPulse = 2.0 + Math.sin(t * 0.4 + config.phase) * 0.5;
    const emissivePulse = 0.06 + Math.sin(t * 0.25 + config.phase) * 0.03;

    for (const mat of matsRef.current) {
      mat.opacity = lerp(mat.opacity, targetOpacity, 0.06);
      mat.envMapIntensity = envPulse;
      mat.emissiveIntensity = emissivePulse;
    }
  });

  return (
    <group ref={groupRef} position={config.pos} scale={0}>
      <primitive object={scene} />
    </group>
  );
}

function RockField({isMobile}: {isMobile: boolean}) {
  // Mobile: 4 rocks (2 left, 2 right) for performance
  const configs = isMobile
    ? [ROCK_CONFIGS[0], ROCK_CONFIGS[2], ROCK_CONFIGS[5], ROCK_CONFIGS[7]]
    : ROCK_CONFIGS;
  return (
    <>
      {configs.map((config, i) => (
        <RockInstance key={i} config={config} />
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Main scene
// ---------------------------------------------------------------------------

function Scene({isMobile}: {isMobile: boolean}) {
  return (
    <Selection>
      <AnimatedEnvironment />
      <AtmosphericFog />
      <ScenePhaseDriver />

      <MouseTracker />
      <ScrollCamera />

      {/* Stars + rocks selected for bloom -- logo is outside Select so it never blooms */}
      <Select enabled>
        <StarField isMobile={isMobile} />
        <RockField isMobile={isMobile} />
      </Select>
      <LogoModel />

      <AdaptivePostFX isMobile={isMobile} />
    </Selection>
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
