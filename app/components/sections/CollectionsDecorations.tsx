import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { EffectComposer, SelectiveBloom, Vignette, ChromaticAberration } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { bestsellersSectionState, collectionsSectionState } from '~/lib/sceneState';
import * as THREE from 'three';

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
const colMouseState = { x: 0, y: 0, lerpX: 0, lerpY: 0 };

// ---------------------------------------------------------------------------
// Shared entrance signal — own section scroll drives assembly (0-15%)
// Also primes from bestseller disperse so shards begin if BS is still
// mid-disperse when the canvas first mounts (scrub lag scenario)
// ---------------------------------------------------------------------------
function getEntranceP(): number {
  const bsDisp   = smoothstep(0.92, 1.0, bestsellersSectionState.carouselProgress);
  const ownEntry = smoothstep(0, 0.15, collectionsSectionState.sectionProgress);
  // ownEntry is the primary driver; bsDisp only primes if BS hasn't fully finished
  return Math.max(bsDisp * 0.3, ownEntry);
}

// ---------------------------------------------------------------------------
// Mouse tracker
// ---------------------------------------------------------------------------
export function ColMouseTracker() {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      colMouseState.x = (e.clientX / window.innerWidth) * 2 - 1;
      colMouseState.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handler, { passive: true });
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  useFrame(() => {
    colMouseState.lerpX = lerp(colMouseState.lerpX, colMouseState.x, 0.05);
    colMouseState.lerpY = lerp(colMouseState.lerpY, colMouseState.y, 0.05);
  });

  return null;
}

// ---------------------------------------------------------------------------
// Post-processing — mirrors BSPostFX
// ---------------------------------------------------------------------------
export function ColPostFX({ isMobile }: { isMobile: boolean }) {
  return (
    <EffectComposer multisampling={isMobile ? 0 : 4}>
      <SelectiveBloom
        mipmapBlur
        luminanceThreshold={0.85}
        luminanceSmoothing={0.5}
        intensity={isMobile ? 0.12 : 0.22}
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
// IceDust — sparse particle field. Mirrors BSDriftParticles but:
//   - Fewer particles (400 desktop, 150 mobile)
//   - Pure cool palette — silver-blue / cobalt / ice white, no warm gold
//   - Slower rotation (0.004 vs 0.007)
// ---------------------------------------------------------------------------
export function IceDust({ isMobile }: { isMobile: boolean }) {
  const COUNT = isMobile ? 150 : 400;
  const pointsRef = useRef<THREE.Points>(null!);
  const opacityRef = useRef(0);
  const disperseRef = useRef(0);

  const { geometry, material } = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const col = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 28;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 22;
      pos[i * 3 + 2] = -1.5 - Math.random() * 10;
      // 70% silver-blue, 20% cobalt, 10% ice white
      const r = Math.random();
      if (r < 0.70) {
        col[i * 3] = 0.82; col[i * 3 + 1] = 0.83; col[i * 3 + 2] = 0.86; // silver
      } else if (r < 0.90) {
        col[i * 3] = 0.29; col[i * 3 + 1] = 0.30; col[i * 3 + 2] = 0.35; // slate
      } else {
        col[i * 3] = 0.92; col[i * 3 + 1] = 0.93; col[i * 3 + 2] = 0.95; // off-white
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.055,
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
    const sp = collectionsSectionState.sectionProgress;

    // Slow ambient drift
    pointsRef.current.rotation.y = t * 0.004 + colMouseState.lerpX * 0.08;
    pointsRef.current.rotation.x = colMouseState.lerpY * 0.04;

    // Zoom during dwell, shatter at end
    const zoomIn = smoothstep(0, 0.85, sp);
    const dispTarget = smoothstep(0.85, 1.0, sp);
    disperseRef.current = lerp(disperseRef.current, dispTarget, 0.04);
    pointsRef.current.scale.setScalar(1.0 + zoomIn * 0.35 + disperseRef.current * 4.0);

    // Entrance triggered by shared signal, fade out on shatter
    const entranceP = getEntranceP();
    const entranceFade = smoothstep(0.15, 0.50, entranceP);
    const disperseFade = Math.max(0, 1.0 - disperseRef.current * 1.6);
    const target = entranceFade * disperseFade * 0.45;
    opacityRef.current = lerp(opacityRef.current, target, 0.04);
    material.opacity = opacityRef.current;
  });

  return <points ref={pointsRef} geometry={geometry} material={material} />;
}

// ---------------------------------------------------------------------------
// ShardRings — angular polygon rings (hexagons + square). Geometric contrast
// to bestseller's smooth circular rings.
// ---------------------------------------------------------------------------
function createPolygonGeo(sides: number, radius: number): THREE.BufferGeometry {
  const pts: number[] = [];
  for (let i = 0; i <= sides; i++) {
    const a = (i / sides) * Math.PI * 2;
    pts.push(Math.cos(a) * radius, Math.sin(a) * radius, 0);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  return geo;
}

const COL_RING_CONFIGS = [
  { sides: 6, radius: 3.2, z: -4,  speed:  0.004, rotZ:  0.20, phase: 0.0, maxOp: 0.32, color: '#8a8e9a' },
  { sides: 4, radius: 5.8, z: -8,  speed: -0.003, rotZ: -0.10, phase: 0.6, maxOp: 0.18, color: '#6c7080' },
  { sides: 6, radius: 9.5, z: -13, speed:  0.002, rotZ:  0.05, phase: 1.2, maxOp: 0.10, color: '#4a4e5a' },
];

function CRing({ config }: { config: typeof COL_RING_CONFIGS[0] }) {
  const opacityRef  = useRef(0);
  const disperseRef = useRef(0);

  const { lineObj, mat } = useMemo(() => {
    const g = createPolygonGeo(config.sides, config.radius);
    const m = new THREE.LineBasicMaterial({
      color: new THREE.Color(config.color),
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const l = new THREE.Line(g, m);
    l.position.set(0, 0, config.z);
    l.rotation.set(Math.PI / 2, 0, config.rotZ);
    return { lineObj: l, mat: m };
  }, [config.sides, config.radius, config.color, config.z, config.rotZ]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const sp = collectionsSectionState.sectionProgress;

    // Rotation
    lineObj.rotation.z = config.rotZ + t * config.speed;
    lineObj.rotation.y = colMouseState.lerpX * 0.06;

    // Scale: expand during dwell, shatter at end
    const expand = smoothstep(0, 0.85, sp);
    const dispTarget = smoothstep(0.85, 1.0, sp);
    disperseRef.current = lerp(disperseRef.current, dispTarget, 0.03);
    const s = 1.0 + expand * 0.12 + disperseRef.current * 2.5;
    lineObj.scale.set(s, s, 1.0);

    // Entrance + shatter fade
    const entranceP = getEntranceP();
    const delay = 0.50 + config.phase * 0.06;
    const disperseFade = Math.max(0, 1.0 - disperseRef.current * 2.2);
    const targetOp = smoothstep(delay, delay + 0.28, entranceP) * disperseFade * config.maxOp;
    opacityRef.current = lerp(opacityRef.current, targetOp, 0.03);
    mat.opacity = opacityRef.current;
  });

  return <primitive object={lineObj} />;
}

export function ShardRings() {
  return (
    <>
      {COL_RING_CONFIGS.map((cfg, i) => <CRing key={i} config={cfg} />)}
    </>
  );
}

// ---------------------------------------------------------------------------
// CrystalShards — 28 diamond-shaped flat meshes that fly in, orbit, shatter.
// Each shard is a separate component with its own useFrame for clean stagger.
// ---------------------------------------------------------------------------
function createDiamondGeo(w: number, h: number): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  const verts = new Float32Array([
     0,        h * 0.55,  0,
    -w * 0.5,  0,         0,
     w * 0.5,  0,         0,
     0,       -h * 0.45,  0,
  ]);
  const idx = new Uint16Array([0, 1, 2,  1, 3, 2]);
  geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  geo.computeVertexNormals();
  return geo;
}

interface ShardConfig {
  startPos: [number, number, number];
  targetPos: [number, number, number];
  shatterDir: [number, number, number];
  width: number;
  height: number;
  initRotX: number;
  initRotY: number;
  initRotZ: number;
  selfRotX: number;
  selfRotY: number;
  selfRotZ: number;
  color: string;
  maxOpacity: number;
  staggerDelay: number;
  parallaxFactor: number;
}

function buildShardConfigs(count: number): ShardConfig[] {
  const phi = Math.PI * (3 - Math.sqrt(5)); // golden angle
  const configs: ShardConfig[] = [];

  for (let i = 0; i < count; i++) {
    const yUnit = 1 - (i / (count - 1)) * 2;
    const rUnit = Math.sqrt(Math.max(0, 1 - yUnit * yUnit));
    const theta = phi * i;
    const radius = 4.5 + Math.random() * 3.5;
    const zOffset = -3 - Math.random() * 5;

    const targetPos: [number, number, number] = [
      Math.cos(theta) * rUnit * radius,
      yUnit * radius * 0.7,
      zOffset,
    ];

    // Start: off-screen in a random direction
    const angle = Math.random() * Math.PI * 2;
    const elev  = (Math.random() - 0.5) * Math.PI * 0.8;
    const dist  = 18 + Math.random() * 7;
    const startPos: [number, number, number] = [
      Math.cos(angle) * Math.cos(elev) * dist,
      Math.sin(elev) * dist * 0.6,
      targetPos[2] + (Math.random() - 0.5) * 4,
    ];

    // Shatter outward from target
    const dx = targetPos[0], dy = targetPos[1];
    const len = Math.sqrt(dx * dx + dy * dy) + 0.001;
    const shatterDir: [number, number, number] = [
      dx / len,
      dy / len,
      -0.8 - Math.random() * 0.6,
    ];

    // Color: 60% silver-blue, 30% cobalt, 10% ice white
    const cr = Math.random();
    const color = cr < 0.60 ? '#c8d8f8' : cr < 0.90 ? '#6080c0' : '#e8f4ff';

    configs.push({
      startPos,
      targetPos,
      shatterDir,
      width:  0.08 + Math.random() * 0.27,
      height: 0.15 + Math.random() * 0.60,
      initRotX: Math.random() * Math.PI * 2,
      initRotY: Math.random() * Math.PI * 2,
      initRotZ: Math.random() * Math.PI * 2,
      selfRotX: (Math.random() - 0.5) * 0.006,
      selfRotY: (Math.random() - 0.5) * 0.005,
      selfRotZ: (Math.random() - 0.5) * 0.004,
      color,
      maxOpacity: 0.45 + Math.random() * 0.40,
      staggerDelay: Math.random() * 0.25,
      parallaxFactor: 0.1 + Math.random() * 0.7,
    });
  }
  return configs;
}

function CShard({ config }: { config: ShardConfig }) {
  const meshRef  = useRef<THREE.Mesh>(null!);
  const opacityRef = useRef(0);
  const shatterRef = useRef(0);
  const posRef = useRef({ x: config.startPos[0], y: config.startPos[1], z: config.startPos[2] });

  const { geo, mat } = useMemo(() => {
    const g = createDiamondGeo(config.width, config.height);
    const m = new THREE.MeshBasicMaterial({
      color: new THREE.Color(config.color),
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    return { geo: g, mat: m };
  }, [config.width, config.height, config.color]);

  // Set initial rotation once on mount
  useEffect(() => {
    if (!meshRef.current) return;
    meshRef.current.rotation.set(config.initRotX, config.initRotY, config.initRotZ);
  }, [config.initRotX, config.initRotY, config.initRotZ]);

  useFrame(() => {
    if (!meshRef.current) return;
    const sp = collectionsSectionState.sectionProgress;

    // Shared transition signal
    const entranceP = getEntranceP();
    const shardEntry = smoothstep(config.staggerDelay, config.staggerDelay + 0.55, entranceP);

    // Damped shatter
    const shatterTarget = smoothstep(0.85, 1.0, sp);
    shatterRef.current  = lerp(shatterRef.current, shatterTarget, 0.04);
    const d = shatterRef.current;

    // Position: fly from start to target, then scatter on shatter
    posRef.current.x = lerp(config.startPos[0], config.targetPos[0], shardEntry)
                       + config.shatterDir[0] * d * 9
                       + colMouseState.lerpX * config.parallaxFactor;
    posRef.current.y = lerp(config.startPos[1], config.targetPos[1], shardEntry)
                       + config.shatterDir[1] * d * 9
                       + colMouseState.lerpY * config.parallaxFactor * 0.6;
    posRef.current.z = lerp(config.startPos[2], config.targetPos[2], shardEntry)
                       + config.shatterDir[2] * d * 5;
    meshRef.current.position.set(posRef.current.x, posRef.current.y, posRef.current.z);

    // Continuous self-rotation
    meshRef.current.rotation.x += config.selfRotX;
    meshRef.current.rotation.y += config.selfRotY;
    meshRef.current.rotation.z += config.selfRotZ;

    // Opacity: fade in on entry, fade out on shatter
    const shatterFade = Math.max(0, 1.0 - d * 1.8);
    const targetOp = shardEntry * shatterFade * config.maxOpacity;
    opacityRef.current = lerp(opacityRef.current, targetOp, 0.04);
    mat.opacity = opacityRef.current;
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geo}
      material={mat}
      position={[config.startPos[0], config.startPos[1], config.startPos[2]]}
    />
  );
}

export function CrystalShards({ isMobile }: { isMobile: boolean }) {
  const COUNT = isMobile ? 12 : 28;
  const groupRef = useRef<THREE.Group>(null!);

  const configs = useMemo(() => buildShardConfigs(COUNT), [COUNT]);

  // Slow group Y rotation during dwell phase only
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const sp = collectionsSectionState.sectionProgress;
    const dwellAmt = smoothstep(0.15, 0.30, sp) * smoothstep(0.85, 0.70, sp);
    groupRef.current.rotation.y = clock.elapsedTime * 0.006 * dwellAmt;
  });

  return (
    <group ref={groupRef}>
      {configs.map((cfg, i) => <CShard key={i} config={cfg} />)}
    </group>
  );
}
