import {useEffect, useRef, useState, useMemo} from 'react';
import {Canvas, useFrame, useThree} from '@react-three/fiber';
import {
  useGLTF,
  Environment,
  Lightformer,
} from '@react-three/drei';
import {EffectComposer, SelectiveBloom, Selection, Select, Vignette} from '@react-three/postprocessing';
import * as THREE from 'three';
import {getLenis} from '~/components/global/SmoothScroll';
import {aboutSectionState, scenePhaseState} from '~/lib/sceneState';
import {ParticleField} from '~/components/global/ParticleField';

if (typeof window !== 'undefined') {
  useGLTF.preload('/models/Logo_element.glb', '/draco/');
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

// Cache scrollHeight to avoid forced layout reflow on every frame.
// It's recomputed at most once per 500ms (covers resize events naturally).
let _cachedDocHeight = 0;
let _docHeightTs = 0;

function getScrollProgress(): number {
  const now = performance.now();
  if (now - _docHeightTs > 500) {
    _cachedDocHeight = document.documentElement.scrollHeight - window.innerHeight;
    _docHeightTs = now;
  }
  if (_cachedDocHeight <= 0) return 0;
  const lenis = getLenis();
  const scrollTop = lenis ? (lenis as any).scroll : window.scrollY;
  return Math.max(0, Math.min(1, scrollTop / _cachedDocHeight));
}

// ---------------------------------------------------------------------------
// Night sky atmospheric shader
// ---------------------------------------------------------------------------

const nightSkyVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 1.0, 1.0);
  }
`;

const nightSkyFrag = /* glsl */ `
  precision mediump float;
  uniform float uTime;
  uniform float uScroll;
  varying vec2  vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i),               hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * vnoise(p);
      p  = p * 2.1 + vec2(3.4, 1.7);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;

    // ---- Scroll-driven traveling light source ----
    // Lissajous path: 3 horizontal x 2 vertical cycles across full scroll.
    // Reduced amplitude keeps light away from extreme screen corners.
    float lx = sin(uScroll * 18.85 + uTime * 0.06);
    float ly = sin(uScroll * 12.57 + uTime * 0.05 + 1.57);
    vec2 lightUV = vec2(lx * 0.42 + 0.5, ly * 0.30 + 0.5);

    vec2 toLight = (uv - lightUV) * vec2(1.78, 1.0);
    float lDist = length(toLight);

    // Wider main spotlight — covers ~2x more screen area per section
    float spotlight = exp(-lDist * lDist * 1.6) * 0.88;

    // Broad secondary ambient — keeps far-from-light areas subtly lit
    float ambient = exp(-lDist * lDist * 0.45) * 0.22;

    // Breathing corona halos — two smooth rings that slowly pulse in radius
    float r1 = 0.17 + sin(uTime * 0.38) * 0.018;
    float r2 = 0.32 + sin(uTime * 0.27 + 1.1) * 0.024;
    float halo1 = exp(-pow(lDist - r1, 2.0) * 88.0) * 0.55;
    float halo2 = exp(-pow(lDist - r2, 2.0) * 48.0) * 0.30;
    float corona = halo1 + halo2;

    // ---- Ambient FBM aurora for scene depth (follows light horizontally) ----
    float scrollCycle = sin(uScroll * 6.28 + uTime * 0.07) * 0.5 + 0.5;
    vec2 q = vec2(
      fbm(uv * vec2(2.5, 1.0) + vec2(uTime * 0.022, 0.0)),
      fbm(uv * vec2(2.0, 1.2) + vec2(0.0, uTime * 0.018) + 1.7)
    );
    float aurora = fbm(uv * vec2(1.8, 5.5) + q * 0.9 + vec2(lx * 0.35, -uScroll * 2.5));
    float band = smoothstep(0.02, 0.45, uv.y) * smoothstep(0.98, 0.55, uv.y);
    aurora = clamp(aurora * band * 1.4, 0.0, 1.0) * scrollCycle;

    // ---- Color ----
    vec3 colDark   = vec3(0.004, 0.008, 0.022);  // near-black
    vec3 colBlue   = vec3(0.08,  0.20,  0.62);   // bright blue spotlight
    vec3 colAurora = vec3(0.025, 0.065, 0.200);  // darker blue for FBM depth

    float intensity = spotlight + corona * 0.75 + ambient * 0.5 + aurora * 0.4;
    vec3  col = colDark
              + colBlue   * (spotlight + corona * 0.65 + ambient * 0.38)
              + colAurora * aurora;
    float alpha = clamp(intensity * 0.72, 0.0, 0.86);

    gl_FragColor = vec4(col, alpha);
  }
`;

function NightSkyShader() {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime:   {value: 0},
      uScroll: {value: 0},
    }),
    [],
  );

  useFrame(({clock}) => {
    if (!matRef.current) return;
    matRef.current.uniforms.uTime.value   = clock.getElapsedTime();
    matRef.current.uniforms.uScroll.value = getScrollProgress();
  });

  return (
    <mesh renderOrder={-100} frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={nightSkyVert}
        fragmentShader={nightSkyFrag}
        depthTest={false}
        depthWrite={false}
        transparent={true}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// Shared mouse tracker
// ---------------------------------------------------------------------------

const mouseState = {x: 0, y: 0, lerpX: 0, lerpY: 0};

let _starEntryActive = true;
let _starEntryTime = 0;

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

    const aboutLogoTarget = clamp01(aboutSectionState.sectionProgress / 0.04);
    scenePhaseState.logoFade = lerp(
      scenePhaseState.logoFade,
      Math.max(aboutLogoTarget, targetLateFade),
      0.30,
    );
  });

  return null;
}

// ---------------------------------------------------------------------------
// AN Logo (persistent, subtle idle animation)
// ---------------------------------------------------------------------------

// Neutral studio cubemap baked once from offscreen area-light panels.
// Assigned to the logo material so the chrome reflects a clean silver/white
// studio rig, isolated from the scene-wide sapphire + aurora env.
function useStudioChromeEnvMap() {
  const gl = useThree((s) => s.gl);
  return useMemo(() => {
    const rt = new THREE.WebGLCubeRenderTarget(256, {
      generateMipmaps: true,
      minFilter: THREE.LinearMipmapLinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.HalfFloatType,
    });

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#050507');

    const panel = (
      w: number,
      h: number,
      pos: [number, number, number],
      rot: [number, number, number],
      hex: string,
      intensity: number,
    ) => {
      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(hex).multiplyScalar(intensity),
        side: THREE.DoubleSide,
        toneMapped: false,
      });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
      m.position.set(...pos);
      m.rotation.set(...rot);
      scene.add(m);
    };

    panel(6, 2.2, [0, 3.2, 0], [Math.PI / 2, 0, 0], '#ffffff', 2.4);
    panel(3.8, 5, [-3.8, 0, 1.2], [0, Math.PI / 2, 0], '#f2f4f8', 1.9);
    panel(3.8, 5, [3.8, 0, 1.2], [0, -Math.PI / 2, 0], '#f2f4f8', 1.6);
    panel(5, 3, [0, 0.2, 4.2], [0, 0, 0], '#e8eaf0', 1.2);
    panel(5, 3, [0, 0.2, -4.2], [0, Math.PI, 0], '#dcdde2', 0.7);
    panel(6, 6, [0, -3.2, 0], [-Math.PI / 2, 0, 0], '#0a0a0c', 0.2);

    const cam = new THREE.CubeCamera(0.1, 50, rt);
    scene.add(cam);
    cam.update(gl, scene);

    return rt.texture;
  }, [gl]);
}

function LogoModel() {
  const {scene} = useGLTF('/models/Logo_element.glb', '/draco/');
  const groupRef = useRef<THREE.Group>(null!);
  const scrollRef = useRef(0);
  const logoMatsRef = useRef<THREE.MeshPhysicalMaterial[]>([]);
  const rotYRef = useRef(0);
  const envMap = useStudioChromeEnvMap();

  useEffect(() => {
    scene.rotation.set(-Math.PI / 2 + Math.PI, 0, Math.PI + Math.PI);

    const mats: THREE.MeshPhysicalMaterial[] = [];
    scene.traverse((child: any) => {
      if (!child.isMesh) return;
      const mat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#eef0f2'),
        metalness: 1.0,
        roughness: 0.16,
        envMap,
        envMapIntensity: 1.0,
        emissive: new THREE.Color('#000000'),
        emissiveIntensity: 0.0,
        clearcoat: 0.0,
        clearcoatRoughness: 0.0,
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
  }, [scene, envMap]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const logoFade = scenePhaseState.logoFade;
    // Logo is fully invisible -- skip all lerps, rotation, scale, and material writes
    if (logoFade >= 0.99) return;
    const t = state.clock.elapsedTime;

    const sp = getScrollProgress();
    scrollRef.current = lerp(scrollRef.current, sp, 0.06);
    const smoothSp = scrollRef.current;

    const rotSpeed = smoothSp * Math.PI * 32;
    rotYRef.current = lerp(rotYRef.current, rotSpeed, 1 - logoFade * 0.97);
    groupRef.current.rotation.y = rotYRef.current;

    const breathe = 1.0 + Math.sin(t * 0.4) * 0.01;
    groupRef.current.scale.setScalar(1.4 * Math.max(0.05, 1.0 - smoothSp * 3.0) * breathe);

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
  const introRef = useRef({active: true, progress: 0, started: true});

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
        color="#b0ccff"
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
        color="#c0ccf0"
      />
      <Lightformer
        intensity={0.3}
        position={[0, -10, 0]}
        rotation-x={Math.PI / 2}
        scale={40}
        color="#080808"
      />
      <Lightformer
        intensity={3.5}
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
    scene.fog = new THREE.FogExp2('#000000', 0.012);
    return () => {
      scene.fog = null;
    };
  }, [scene]);

  useFrame(() => {
    if (!scene.fog) return;
    const sp = getScrollProgress();
    scrollRef.current = lerp(scrollRef.current, sp, 0.04);
    const fog = scene.fog as THREE.FogExp2;

    // Continuous sinusoidal oscillation throughout full scroll (3 cycles per 100%)
    // Synced with NightSkyShader's scrollCycle and BackgroundJourney rhythm
    const cycle = Math.sin(scrollRef.current * 18.85) * 0.5 + 0.5;
    fog.color.setRGB(
      lerp(0.000, 0.059, cycle),  // black -> #0f2050 R
      lerp(0.000, 0.125, cycle),  // black -> #0f2050 G
      lerp(0.008, 0.314, cycle),  // dark blue-black -> #0f2050 B
    );
  });

  return null;
}

function AdaptivePostFX({isMobile, heroGone}: {isMobile: boolean; heroGone: boolean}) {
  if (heroGone) {
    // Stars + rocks are unmounted -- no bloom needed. Drop MSAA + bloom pass entirely.
    return (
      <EffectComposer multisampling={0} autoClear={false}>
        <Vignette eskil={false} offset={0.25} darkness={0.75} />
      </EffectComposer>
    );
  }
  return (
    <EffectComposer multisampling={isMobile ? 0 : 4} autoClear={false}>
      <SelectiveBloom
        mipmapBlur
        luminanceThreshold={0.55}
        luminanceSmoothing={0.9}
        intensity={isMobile ? 0.35 : 0.55}
      />
      <Vignette eskil={false} offset={0.25} darkness={0.75} />
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
  const [heroGone, setHeroGone] = useState(false);
  const heroGoneRef = useRef(false);

  // Unmount stars+rocks once they've fully faded (scroll >30%).
  // Remount if user scrolls back into hero (<15%). Hysteresis prevents flicker.
  useFrame(() => {
    const sp = getScrollProgress();
    if (!heroGoneRef.current && sp > 0.30) {
      heroGoneRef.current = true;
      setHeroGone(true);
    } else if (heroGoneRef.current && sp < 0.15) {
      heroGoneRef.current = false;
      setHeroGone(false);
    }
  });

  return (
    <Selection>
      <NightSkyShader />
      <AnimatedEnvironment />
      <AtmosphericFog />
      <ScenePhaseDriver />

      <MouseTracker />
      <ScrollCamera />

      {/* Stars + rocks: hero-only. Unmounted past scroll 30% -- fully invisible by then. */}
      {!heroGone && (
        <Select enabled>
          <StarField isMobile={isMobile} />
          <RockField isMobile={isMobile} />
        </Select>
      )}
      {/* Particle field: volumetric blue drift, hero zone only, outside Select (not bloomed) */}
      {!heroGone && <ParticleField />}

      <LogoModel />

      <AdaptivePostFX isMobile={isMobile} heroGone={heroGone} />
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
