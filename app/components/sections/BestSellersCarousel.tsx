import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Lightformer, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const CARDS = 5;
const ANGLE_STEP = (2 * Math.PI) / CARDS; // 72 degrees
const RADIUS = 3.8;
const Z_FLATTEN = 0.42; // flatten circle into coverflow arc

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

// ---------------------------------------------------------------------------
// Luxury gradient palettes for each card (dark, editorial)
// ---------------------------------------------------------------------------
const CARD_PALETTES: [string, string, string][] = [
  ['#0f0a1e', '#1a1035', '#2a1f50'], // deep indigo
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
  const w = 400;
  const h = 600;
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
// Single carousel card
// ---------------------------------------------------------------------------
interface CardProps {
  index: number;
  texture: THREE.CanvasTexture;
  rotStateRef: React.MutableRefObject<{ angle: number }>;
  scaleRef: {current: number};
  onCardClick: (index: number) => void;
}

function CarouselCard({ index, texture, rotStateRef, scaleRef, onCardClick }: CardProps) {
  const pivotRef = useRef<THREE.Group>(null!);
  const meshRef = useRef<THREE.Mesh>(null!);
  const frameRef = useRef<THREE.Mesh>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);
  const hoveredRef = useRef(false);
  const glowIntensRef = useRef(0);

  const baseAngle = index * ANGLE_STEP;

  const imageMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        map: texture,
        metalness: 0.15,
        roughness: 0.35,
        envMapIntensity: 1.2,
      }),
    [texture],
  );

  const frameMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#c8c8c8',
        metalness: 1.0,
        roughness: 0.04,
        envMapIntensity: 2.5,
        clearcoat: 0.6,
        clearcoatRoughness: 0.05,
      }),
    [],
  );

  const glowMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#b0b0e0',
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.FrontSide,
      }),
    [],
  );

  useFrame(({ clock }) => {
    if (!pivotRef.current) return;

    const t = clock.elapsedTime;
    const worldAngle = baseAngle + rotStateRef.current.angle;

    pivotRef.current.position.x = Math.sin(worldAngle) * RADIUS;
    pivotRef.current.position.z = Math.cos(worldAngle) * RADIUS * Z_FLATTEN;

    const proximity = Math.cos(worldAngle);
    const targetScale = 0.62 + ((proximity + 1) / 2) * 0.38;
    scaleRef.current = lerp(scaleRef.current, targetScale, 0.08);
    pivotRef.current.scale.setScalar(scaleRef.current);

    pivotRef.current.position.y = Math.sin(t * 0.9 + index * 1.4) * 0.1;

    pivotRef.current.rotation.y = worldAngle;
    pivotRef.current.rotation.z = Math.sin(t * 0.55 + index * 2.2) * 0.018;

    if (frameMaterial) {
      frameMaterial.envMapIntensity = 2.5 + Math.sin(t * 1.2 + index * 0.9) * 0.4;
    }

    glowIntensRef.current = lerp(glowIntensRef.current, hoveredRef.current ? 1 : 0, 0.08);
    glowMaterial.opacity = glowIntensRef.current * 0.28;
  });

  return (
    <group ref={pivotRef} position={[0, 0, 0]}>
      <RoundedBox
        ref={glowRef as any}
        args={[2.75, 3.85, 0.01]}
        radius={0.12}
        smoothness={4}
        position={[0, 0, -0.02]}
        material={glowMaterial}
      />
      <RoundedBox
        ref={frameRef as any}
        args={[2.6, 3.7, 0.025]}
        radius={0.1}
        smoothness={4}
        material={frameMaterial}
        onPointerEnter={() => { hoveredRef.current = true; }}
        onPointerLeave={() => { hoveredRef.current = false; }}
        onClick={() => onCardClick(index)}
      />
      <mesh ref={meshRef} position={[0, 0, 0.014]} material={imageMaterial}>
        <planeGeometry args={[2.36, 3.46]} />
      </mesh>
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
}

const AUTO_SPEED = 0.003;

function CarouselScene({ rotStateRef, cardScaleRefs, hoverRef, animatingRef, onCardClick }: SceneProps) {
  const textures = useMemo(() => {
    return CARD_PALETTES.map((p, i) => makeCardTexture(p, CARD_LABELS[i]));
  }, []);

  useFrame(() => {
    if (!animatingRef.current) {
      rotStateRef.current.angle -= AUTO_SPEED;
    }
  });

  return (
    <>
      <Environment background={false} resolution={128}>
        <Lightformer intensity={4} position={[0, 5, 0]} color="#ffffff" />
        <Lightformer intensity={2.5} position={[-5, 1, 3]} color="#ddd4ff" />
        <Lightformer intensity={2.5} position={[5, 1, 3]} color="#e8e8e8" />
        <Lightformer intensity={1.5} position={[0, -3, 5]} color="#c8c8d8" />
      </Environment>
      <group>
        {textures.map((tex, i) => (
          <CarouselCard
            key={i}
            index={i}
            texture={tex}
            rotStateRef={rotStateRef}
            scaleRef={cardScaleRefs[i]}
            onCardClick={onCardClick}
          />
        ))}
      </group>
    </>
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
      camera={{ fov: 65, position: [0, 1.2, 9] }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.1,
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
