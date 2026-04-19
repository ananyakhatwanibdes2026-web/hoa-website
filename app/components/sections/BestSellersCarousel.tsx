import React, { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Lightformer, useGLTF, useTexture } from '@react-three/drei';
import { Selection, Select } from '@react-three/postprocessing';
import * as THREE from 'three';
import { BSMouseTracker, BSPostFX, BSDriftParticles, BSFloatingOrbs, BSAtmosphericRings } from './BestSellersDecorations';
import { bestsellersSectionState } from '~/lib/sceneState';
import gsap from 'gsap';

if (typeof window !== 'undefined') {
  useGLTF.preload('/models/Spiral.glb', '/draco/');
}


// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const CARDS = 5;
const ANGLE_STEP = (2 * Math.PI) / CARDS; // 72 degrees
const ORBIT_RADIUS_X = 5.5; // horizontal spread of the elliptical orbit
const ORBIT_RADIUS_Z = 2.8; // depth kept shallow so all 5 cards stay in front of the spiral
const ROT_PER_CARD = 0.6; // Y-rotation per offset step (~34 deg; +-2 cards at ~68 deg)
const MIN_SCALE = 0.42;
const SCALE_STEP = 0.28;  // scale reduction per step from center

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// ---------------------------------------------------------------------------
// Luxury gradient palettes for each card (dark, editorial)
// ---------------------------------------------------------------------------
const CARD_PALETTES: [string, string, string][] = [
  ['#0a0e1a', '#141a2a', '#1e2840'], // deep navy
  ['#0d1520', '#1a2535', '#253545'], // slate charcoal
  ['#0a1a18', '#122825', '#1e3830'], // midnight teal
  ['#1a1a1e', '#2a2a30', '#3a3a40'], // graphite silver
  ['#0e0a14', '#1a1020', '#26162e'], // velvet black
];

const CARD_LABELS = ['01', '02', '03', '04', '05'];
const CARD_TITLES = [
  'Eclipse Ring',
  'Lunar Cuff',
  'Void Pendant',
  'Mercury Hoops',
  'Orbit Earrings',
];

// ---------------------------------------------------------------------------
// Build a CanvasTexture for each card
// ---------------------------------------------------------------------------
function makeCardTexture(palette: [string, string, string], label: string) {
  const w = 440;
  const h = 660;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, w * 0.6, h);
  grad.addColorStop(0, palette[0]);
  grad.addColorStop(0.5, palette[1]);
  grad.addColorStop(1, palette[2]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Subtle radial highlight (chrome reflection)
  const radial = ctx.createRadialGradient(w * 0.35, h * 0.28, 0, w * 0.5, h * 0.4, w * 0.7);
  radial.addColorStop(0, 'rgba(200,200,220,0.18)');
  radial.addColorStop(0.5, 'rgba(150,150,180,0.06)');
  radial.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, w, h);

  // Thin horizontal rule at 60%
  ctx.strokeStyle = 'rgba(192,192,220,0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(w * 0.12, h * 0.6);
  ctx.lineTo(w * 0.88, h * 0.6);
  ctx.stroke();

  // Product number
  ctx.fillStyle = 'rgba(192,192,220,0.55)';
  ctx.font = '400 18px "Cormorant Garamond", serif';
  ctx.letterSpacing = '0.25em';
  ctx.fillText(label, w * 0.12, h * 0.68);

  // Chrome shimmer line at top
  const shimmer = ctx.createLinearGradient(0, 0, w, 0);
  shimmer.addColorStop(0, 'rgba(255,255,255,0)');
  shimmer.addColorStop(0.4, 'rgba(255,255,255,0.12)');
  shimmer.addColorStop(0.6, 'rgba(255,255,255,0.06)');
  shimmer.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = shimmer;
  ctx.fillRect(0, 0, w, 3);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// ---------------------------------------------------------------------------
// Soft radial halo alpha mask — used for the center-card atmospheric glow.
// Large plane (11x15) with radial falloff so it bleeds beyond card edges
// organically instead of creating a visible rectangular border.
// ---------------------------------------------------------------------------
let _haloAlpha: THREE.CanvasTexture | null = null;
function makeHaloAlphaTexture(): THREE.CanvasTexture {
  if (_haloAlpha) return _haloAlpha;
  const W = 256, H = 384;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  // Black background (fully transparent via alphaMap)
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
  // White radial gradient — alphaMap reads luminance for transparency
  const radial = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.55);
  radial.addColorStop(0,    'rgba(255,255,255,0.95)');
  radial.addColorStop(0.35, 'rgba(255,255,255,0.55)');
  radial.addColorStop(0.65, 'rgba(255,255,255,0.15)');
  radial.addColorStop(1,    'rgba(255,255,255,0)');
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, W, H);
  _haloAlpha = new THREE.CanvasTexture(canvas);
  _haloAlpha.needsUpdate = true;
  return _haloAlpha;
}

// ---------------------------------------------------------------------------
// Rounded-corner alpha mask (shared singleton across all cards)
// ---------------------------------------------------------------------------
let _cornerAlpha: THREE.CanvasTexture | null = null;
function getCornerAlpha(): THREE.CanvasTexture {
  if (_cornerAlpha) return _cornerAlpha;
  const W = 256, H = 384;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const r = 24;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(W - r, 0);
  ctx.arcTo(W, 0, W, r, r);
  ctx.lineTo(W, H - r);
  ctx.arcTo(W, H, W - r, H, r);
  ctx.lineTo(r, H);
  ctx.arcTo(0, H, 0, H - r, r);
  ctx.lineTo(0, r);
  ctx.arcTo(0, 0, r, 0, r);
  ctx.closePath();
  ctx.fill();
  _cornerAlpha = new THREE.CanvasTexture(canvas);
  _cornerAlpha.needsUpdate = true;
  return _cornerAlpha;
}

// ---------------------------------------------------------------------------
// Single carousel card
// ---------------------------------------------------------------------------
interface CardProps {
  index: number;
  texture: THREE.Texture;
  rotStateRef: React.MutableRefObject<{ angle: number }>;
  scaleRef: {current: number};
  onCardClick: (index: number) => void;
}

function CarouselCard({ index, texture, rotStateRef, scaleRef, onCardClick }: CardProps) {
  const pivotRef = useRef<THREE.Group>(null!);
  const meshRef = useRef<THREE.Mesh>(null!);
  const cardEntranceOpacityRef = useRef(0);

  // Smoothed visual position refs — initialized at the card's starting offset
  // so there is no fly-in on first frame
  const initOffset = index <= CARDS / 2 ? index : index - CARDS;
  const initAngle = initOffset * ANGLE_STEP;
  const posXRef = useRef(ORBIT_RADIUS_X * Math.sin(initAngle));
  const posZRef = useRef(-ORBIT_RADIUS_Z * (1 - Math.cos(initAngle)));
  const rotYRef = useRef(-initOffset * ROT_PER_CARD);

  const cornerAlpha = useMemo(() => getCornerAlpha(), []);

  const imageMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: texture,
        alphaMap: cornerAlpha,
        transparent: true,
        opacity: 0,
      }),
    [texture, cornerAlpha],
  );

  const glowMaterial = useMemo(() => {
    const haloAlpha = makeHaloAlphaTexture();
    return new THREE.MeshBasicMaterial({
      color: new THREE.Color('#5878e0'),
      alphaMap: haloAlpha,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, []);

  useFrame(({ clock }) => {
    if (!pivotRef.current) return;

    const t = clock.elapsedTime;

    // Continuous position in card-index space (0.0 to 4.0 as scroll advances)
    const activeProgress = -rotStateRef.current.angle / ANGLE_STEP;

    // Signed offset from active center, wrapped to [-2.5, 2.5)
    let offset = index - activeProgress;
    offset = offset - Math.round(offset / CARDS) * CARDS;
    const absOff = Math.abs(offset);

    const angle = offset * ANGLE_STEP;
    const targetX    = ORBIT_RADIUS_X * Math.sin(angle);
    const targetZ    = -ORBIT_RADIUS_Z * (1 - Math.cos(angle));
    const targetRotY = -offset * ROT_PER_CARD;

    // When the card is near-invisible at the wrap boundary (absOff ~2.5), snap
    // directly to the new position so the teleport is invisible. Otherwise lerp
    // for buttery smooth motion.
    if (absOff < 2.3) {
      posXRef.current  = lerp(posXRef.current,  targetX,    0.10);
      posZRef.current  = lerp(posZRef.current,  targetZ,    0.10);
      rotYRef.current  = lerp(rotYRef.current,  targetRotY, 0.10);
    } else {
      posXRef.current  = targetX;
      posZRef.current  = targetZ;
      rotYRef.current  = targetRotY;
    }

    pivotRef.current.position.x = posXRef.current;
    pivotRef.current.position.z = posZRef.current;
    pivotRef.current.position.y = Math.sin(t * 0.9 + index * 1.4) * 0.12;

    pivotRef.current.rotation.y = rotYRef.current;
    pivotRef.current.rotation.z = Math.sin(t * 0.55 + index * 2.2) * 0.012;

    // Scale tapers toward edges; fade to zero near wrap boundary so the
    // snap reposition is never visible
    const wrapFade   = Math.min(1, Math.max(0, (2.5 - absOff) * 2)); // 1.0 at |off|=2.0, 0 at 2.5
    const baseScale  = Math.max(MIN_SCALE, 1.0 - absOff * SCALE_STEP);
    const targetScale = baseScale * wrapFade;
    scaleRef.current = lerp(scaleRef.current, targetScale, 0.10);
    pivotRef.current.scale.setScalar(scaleRef.current);

    // Entrance fade-in: cards appear after spiral (entranceProgress 0.4 -> 0.8)
    const ep = bestsellersSectionState.entranceProgress;
    const targetEntrance = smoothstep(0.4, 0.8, ep);
    cardEntranceOpacityRef.current = lerp(cardEntranceOpacityRef.current, targetEntrance, 0.06);

    // Offset opacity taper — side cards recede, center dominates
    const offsetOpacity = Math.max(0.18, 1.0 - absOff * 0.44);
    imageMaterial.opacity = cardEntranceOpacityRef.current * offsetOpacity;

    // Atmospheric halo: large soft radial glow visible only near center (absOff < ~0.5)
    const glowTarget = Math.max(0, 1.0 - absOff * 2.2) * 0.22 * cardEntranceOpacityRef.current;
    glowMaterial.opacity = lerp(glowMaterial.opacity, glowTarget, 0.08);
  });

  return (
    <group ref={pivotRef} position={[0, 0, 0]}>
      {/* Atmospheric halo — large soft radial bloom behind center card */}
      <mesh position={[0, 0, -0.08]} material={glowMaterial}>
        <planeGeometry args={[11, 15]} />
      </mesh>
      <mesh
        ref={meshRef}
        position={[0, 0, 0.014]}
        material={imageMaterial}
        onClick={() => onCardClick(index)}
      >
        <planeGeometry args={[4.15, 6.1]} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Spiral background decor
// ---------------------------------------------------------------------------
function SpiralDecor({ position = [0, 0, -4] as [number, number, number], rotStateRef, phaseOffset = 0 }: { position?: [number, number, number]; rotStateRef: React.MutableRefObject<{ angle: number }>; phaseOffset?: number }) {
  const { scene: gltfScene } = useGLTF('/models/Spiral.glb', '/draco/');
  const groupRef = useRef<THREE.Group>(null!);
  const spiralOpacityRef = useRef(0);

  // Do all setup in useMemo — runs synchronously during render before the scene
  // is attached to the R3F scenegraph, so Box3 sees NO parent transforms.
  // This prevents the "orbiting" bug caused by useFrame rotating the parent group
  // before useEffect's bbox centering runs.
  const { scene, meshes } = useMemo(() => {
    const s = gltfScene.clone(true);

    // Reset any transforms inherited from the cached gltfScene
    s.position.set(0, 0, 0);
    s.scale.set(1, 1, 1);
    s.rotation.set(0, 0, 0);
    s.updateMatrixWorld(true);

    // Center at origin — world space == local space here (no parent yet)
    const box = new THREE.Box3().setFromObject(s);
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(size);
    s.position.sub(center);

    // Scale so the largest dimension is ~14 Three.js units
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) s.scale.setScalar(14 / maxDim);

    const meshList: THREE.Mesh[] = [];
    s.traverse((child: any) => {
      if (!child.isMesh) return;
      child.material = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#5868c8'),      // deep blue-violet — iridescent premium
        metalness: 0.98,
        roughness: 0.04,                        // near-mirror — catches lightformers sharply
        envMapIntensity: 3.5,                   // picks up sapphire backlight + overhead strongly
        emissive: new THREE.Color('#1828a0'),   // inner blue glow
        emissiveIntensity: 0.18,
        clearcoat: 1.0,
        clearcoatRoughness: 0.02,
        transparent: true,
        opacity: 0, // start invisible, driven by useFrame entrance
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      meshList.push(child);
    });

    return { scene: s, meshes: meshList };
  }, [gltfScene]);

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = -rotStateRef.current.angle;
    // Entrance fade-in: spiral appears first (entranceProgress 0 -> 0.4)
    const ep = bestsellersSectionState.entranceProgress;
    const target = smoothstep(0, 0.4, ep) * 0.72;
    spiralOpacityRef.current = lerp(spiralOpacityRef.current, target, 0.06);
    for (const m of meshes) {
      (m.material as THREE.MeshPhysicalMaterial).opacity = spiralOpacityRef.current;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <primitive object={scene} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// Inner scene (inside Canvas)
// ---------------------------------------------------------------------------
interface SceneProps {
  rotStateRef: React.MutableRefObject<{ angle: number }>;
  cardScaleRefs: {current: number}[];
  hoverRef: React.MutableRefObject<boolean>;
  animatingRef: React.MutableRefObject<boolean>;
  onCardClick: (index: number) => void;
  isMobile: boolean;
}

function CarouselScene({ rotStateRef, cardScaleRefs, hoverRef, animatingRef, onCardClick, isMobile }: SceneProps) {
  const imgTextures = useTexture([
    '/images/bestsellers/bs1.jpg',
    '/images/bestsellers/bs2.jpg',
    '/images/bestsellers/bs3.jpg',
    '/images/bestsellers/bs4.jpg',
    '/images/bestsellers/bs5.jpg',
  ]);

  return (
    <Selection>
      <BSMouseTracker />
      <Environment background={false} resolution={256}>
        <Lightformer intensity={8} position={[0, 5, 0]} scale={[10, 2, 1]} color="#ffffff" />
        <Lightformer intensity={4} position={[-5, 1, 3]} color="#ddd4ff" />
        <Lightformer intensity={4} position={[5, 1, 3]} color="#e8e8e8" />
        <Lightformer intensity={3} position={[0, -3, 5]} color="#ffffff" />
        <Lightformer intensity={5} position={[0, 0, 8]} scale={[8, 4, 1]} color="#f0f0f5" />
        <Lightformer intensity={3.5} position={[0, 2, -20]} scale={[60, 40, 1]} color="#1a50c8" />
      </Environment>
      <pointLight position={[5, 5, 5]} intensity={3} color="#ffffff" />
      <pointLight position={[-5, -5, 5]} intensity={3} color="#ffffff" />
      {/* Deep background: rings + particles (no bloom, AdditiveBlending) */}
      <BSAtmosphericRings />
      <BSDriftParticles isMobile={isMobile} />

      <SpiralDecor position={[0, 7, -4]} rotStateRef={rotStateRef} phaseOffset={0} />
      <SpiralDecor position={[0, -7, -4]} rotStateRef={rotStateRef} phaseOffset={Math.PI} />

      {/* Edge orbs: glow spheres at scene corners */}
      <BSFloatingOrbs />

      <group position={[0, 0, 5]}>
        {Array.from({length: CARDS}, (_, i) => (
          <CarouselCard
            key={i}
            index={i}
            texture={imgTextures[i]}
            rotStateRef={rotStateRef}
            scaleRef={cardScaleRefs[i]}
            onCardClick={onCardClick}
          />
        ))}
      </group>
      <BSPostFX isMobile={isMobile} />
    </Selection>
  );
}

// ---------------------------------------------------------------------------
// Exported Canvas component
// ---------------------------------------------------------------------------
interface BestSellersCarouselProps {
  isMobile: boolean;
  rotStateRef: React.MutableRefObject<{ angle: number }>;
  cardScaleRefs: {current: number}[];
  hoverRef: React.MutableRefObject<boolean>;
  animatingRef: React.MutableRefObject<boolean>;
  onCardClick: (index: number) => void;
}

export default function BestSellersCarousel({
  isMobile,
  rotStateRef,
  cardScaleRefs,
  hoverRef,
  animatingRef,
  onCardClick,
}: BestSellersCarouselProps) {
  return (
    <Canvas
      dpr={isMobile ? [1, 1] : [1, 1.5]}
      camera={{ fov: 65, position: [0, 0.5, 11] }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
        toneMapping: THREE.NoToneMapping,
      }}
      style={{
        position: 'absolute',
        inset: 0,
        background: 'transparent',
        zIndex: 2,
        pointerEvents: 'auto',
      }}
    >
      <CarouselScene
        rotStateRef={rotStateRef}
        cardScaleRefs={cardScaleRefs}
        hoverRef={hoverRef}
        animatingRef={animatingRef}
        onCardClick={onCardClick}
        isMobile={isMobile}
      />
    </Canvas>
  );
}

// ---------------------------------------------------------------------------
// Exports for parent to drive GSAP rotation
// ---------------------------------------------------------------------------
export function createRotationHandlers(rotStateRef: React.MutableRefObject<{ angle: number }>) {
  function goNext() {
    gsap.to(rotStateRef.current, {
      angle: rotStateRef.current.angle - ANGLE_STEP,
      duration: 0.85,
      ease: 'power2.inOut',
    });
  }
  function goPrev() {
    gsap.to(rotStateRef.current, {
      angle: rotStateRef.current.angle + ANGLE_STEP,
      duration: 0.85,
      ease: 'power2.inOut',
    });
  }
  return { goNext, goPrev };
}

export { CARDS, CARD_TITLES };
