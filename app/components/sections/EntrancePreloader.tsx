import React, {useCallback, useEffect, useRef, useState, Suspense} from 'react';
import {Canvas, useFrame, useThree} from '@react-three/fiber';
import {Environment, Lightformer, Stars, Sparkles} from '@react-three/drei';
import {gsap} from 'gsap';
import * as THREE from 'three';
import {getLenis} from '~/components/global/SmoothScroll';

// ---------------------------------------------------------------------------
// Shared geometry + materials (created once at module level, reused by all gates)
// ---------------------------------------------------------------------------

const gateGeometry = new THREE.TorusGeometry(5, 0.12, 16, 100);
const glowGeometry = new THREE.TorusGeometry(5.15, 0.03, 8, 100);

const gateMaterial = new THREE.MeshPhysicalMaterial({
  color: new THREE.Color('#e0e0e8'),
  metalness: 1.0,
  roughness: 0.05,
  emissive: new THREE.Color('#1a1a1a'),
  emissiveIntensity: 0.3,
  envMapIntensity: 2.0,
});

const glowMaterial = new THREE.MeshBasicMaterial({
  color: new THREE.Color('#888888'),
  transparent: true,
  opacity: 0.4,
  blending: THREE.AdditiveBlending,
  side: THREE.DoubleSide,
});

// ---------------------------------------------------------------------------
// Gate configuration
// ---------------------------------------------------------------------------

const GATE_SPACING = 15;
const GATE_COUNT = 8;

const GATE_CONFIGS = Array.from({length: GATE_COUNT}, (_, i) => ({
  z: -(i * GATE_SPACING),
  scale: 0.95 + (Math.sin(i * 7.3) * 0.5 + 0.5) * 0.1,
  offsetX: Math.sin(i * 3.7) * 0.08,
  offsetY: Math.cos(i * 5.1) * 0.06,
  rotSpeed: 0.02 + i * 0.003,
}));

// ---------------------------------------------------------------------------
// Error boundary for 3D scene
// ---------------------------------------------------------------------------

class ErrorBoundary3D extends React.Component<
  {children: React.ReactNode; onError: () => void},
  {hasError: boolean}
> {
  constructor(props: {children: React.ReactNode; onError: () => void}) {
    super(props);
    this.state = {hasError: false};
  }
  static getDerivedStateFromError() {
    return {hasError: true};
  }
  componentDidCatch(error: Error) {
    console.error('[Preloader] 3D scene error:', error.message);
    this.props.onError();
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

// ---------------------------------------------------------------------------
// Single gate ring (chrome torus + additive glow halo)
// ---------------------------------------------------------------------------

function GateRing({config}: {config: (typeof GATE_CONFIGS)[0]}) {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.z += delta * config.rotSpeed;
  });

  return (
    <group
      ref={groupRef}
      position={[config.offsetX, config.offsetY, config.z]}
      scale={config.scale}
    >
      <mesh geometry={gateGeometry} material={gateMaterial} />
      <mesh
        geometry={glowGeometry}
        material={glowMaterial}
        position={[0, 0, -0.1]}
      />
    </group>
  );
}

// ---------------------------------------------------------------------------
// Gate tunnel (array of gates + rim-highlight point lights)
// ---------------------------------------------------------------------------

function GateTunnel({isMobile}: {isMobile: boolean}) {
  return (
    <group>
      {GATE_CONFIGS.map((config, i) => (
        <GateRing key={i} config={config} />
      ))}
      {GATE_CONFIGS.filter((_, i) =>
        isMobile ? i % 4 === 0 : i % 2 === 0,
      ).map((config, i) => (
        <pointLight
          key={`pl-${i}`}
          position={[0, 0, config.z]}
          color="#aaaaaa"
          intensity={2}
          distance={30}
          decay={2}
        />
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// God Rays (volumetric light shafts from tunnel center)
// ---------------------------------------------------------------------------

function GodRays({isStarted}: {isStarted: boolean}) {
  const groupRef = useRef<THREE.Group>(null!);
  const centralRef = useRef<THREE.Mesh>(null!);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    groupRef.current.rotation.z += 0.02 * delta;

    const t = state.clock.elapsedTime;
    const camZ = state.camera.position.z;

    let intensity = 1;
    if (isStarted) {
      const dist = Math.abs(camZ - -95);
      intensity = 1 + Math.max(0, 1 - dist / 60) * 1.5;
    }

    groupRef.current.children.forEach((child, i) => {
      if (i === 0) return;
      const mesh = child as THREE.Mesh;
      if (!mesh.material || !(mesh.material as THREE.MeshBasicMaterial).isMaterial) return;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = (0.06 + Math.sin(t * 0.5 + i * 1.2) * 0.025) * intensity;
    });

    if (centralRef.current) {
      const mat = centralRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = (0.15 + Math.sin(t * 0.3) * 0.05) * intensity;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, -95]}>
      <mesh ref={centralRef}>
        <circleGeometry args={[3, 32]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
      {Array.from({length: 6}).map((_, i) => (
        <mesh key={i} rotation={[0, 0, (i * Math.PI) / 6]}>
          <planeGeometry args={[0.3, 80]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.06}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Camera rig (idle wobble + GSAP fly-through on start)
// ---------------------------------------------------------------------------

interface CameraRigProps {
  isStarted: boolean;
  onComplete: () => void;
  fogRef: React.RefObject<HTMLDivElement | null>;
}

function CameraRig({isStarted, onComplete, fogRef}: CameraRigProps) {
  const {camera} = useThree();
  const clock = useRef(0);
  const animating = useRef(false);

  useEffect(() => {
    camera.position.set(0, 0, 40);
    camera.rotation.set(0, 0, 0);
  }, [camera]);

  useEffect(() => {
    if (!isStarted) return;

    const tl = gsap.timeline({delay: 0.3});

    tl.to(camera.position, {z: 30, duration: 0.8, ease: 'power1.in'});
    tl.to(camera.position, {z: -100, duration: 4.0, ease: 'power1.inOut'});
    tl.to(camera.position, {z: -115, duration: 1.0, ease: 'power2.out'});

    if (fogRef.current) {
      tl.to(
        fogRef.current,
        {opacity: 0.9, duration: 2.5, ease: 'power2.in'},
        3.3,
      );
    }

    tl.add(() => {
      onComplete();
    }, '+=0.2');

    animating.current = true;

    return () => {
      tl.kill();
    };
  }, [isStarted, camera, fogRef, onComplete]);

  useFrame((_, delta) => {
    clock.current += delta;
    if (animating.current) {
      camera.position.x = Math.sin(clock.current * 0.5) * 0.15;
      camera.position.y = Math.sin(clock.current * 0.35 + 1.2) * 0.1;
    } else {
      camera.position.x = Math.sin(clock.current * 0.3) * 0.06;
      camera.position.y = Math.sin(clock.current * 0.2 + 1.2) * 0.04;
    }
  });

  return null;
}

// ---------------------------------------------------------------------------
// Full 3D scene
// ---------------------------------------------------------------------------

interface SceneProps {
  isStarted: boolean;
  onComplete: () => void;
  fogRef: React.RefObject<HTMLDivElement | null>;
  isMobile: boolean;
}

function Scene({isStarted, onComplete, fogRef, isMobile}: SceneProps) {
  return (
    <>
      <color attach="background" args={['#0a0a0a']} />
      <fogExp2 attach="fog" args={['#0a0a0a', 0.012]} />

      <Environment resolution={256} background={false}>
        <Lightformer
          intensity={4}
          position={[0, 60, 0]}
          rotation-x={-Math.PI / 2}
          scale={80}
          color="#ffffff"
        />
        <Lightformer
          intensity={2.5}
          position={[-60, 10, 0]}
          rotation-y={Math.PI / 2}
          scale={[1, 40, 80]}
          color="#c8c8c8"
        />
        <Lightformer
          intensity={2.5}
          position={[60, 10, 0]}
          rotation-y={-Math.PI / 2}
          scale={[1, 40, 80]}
          color="#e0e0e0"
        />
        <Lightformer
          intensity={2}
          position={[0, 0, 50]}
          scale={[60, 40, 1]}
          color="#d8d8d8"
        />
        <Lightformer
          intensity={0.3}
          position={[0, -30, 0]}
          rotation-x={Math.PI / 2}
          scale={80}
          color="#050505"
        />
      </Environment>

      <ambientLight intensity={0.15} />
      <directionalLight
        position={[10, 20, 40]}
        intensity={1.0}
        color="#e0e0e0"
      />

      <GateTunnel isMobile={isMobile} />
      <GodRays isStarted={isStarted} />

      <Stars
        radius={80}
        depth={60}
        count={isMobile ? 500 : 1500}
        factor={3}
        saturation={0}
        fade
        speed={0.5}
      />

      <group position={[0, 0, -52.5]}>
        <Sparkles
          count={isMobile ? 20 : 40}
          scale={[20, 20, 120]}
          size={1.0}
          speed={0.1}
          color="#cccccc"
          opacity={0.4}
        />
      </group>

      <CameraRig
        isStarted={isStarted}
        onComplete={onComplete}
        fogRef={fogRef}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Client-only wrapper
// ---------------------------------------------------------------------------

function ClientOnly({children}: {children: React.ReactNode}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? <>{children}</> : null;
}

// ---------------------------------------------------------------------------
// Enter button (replaces loading text when scene is ready)
// ---------------------------------------------------------------------------

function EnterButton({onEnter}: {onEnter: () => void}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (btnRef.current) {
      gsap.fromTo(
        btnRef.current,
        {opacity: 0, y: 10},
        {opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', delay: 0.1},
      );
    }
  }, []);

  const handleClick = () => {
    if (containerRef.current) {
      gsap.to(containerRef.current, {
        opacity: 0,
        duration: 0.5,
        ease: 'power2.in',
        onComplete: onEnter,
      });
    } else {
      onEnter();
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 3,
      }}
    >
      <button
        ref={btnRef}
        onClick={handleClick}
        className="enter-btn"
        style={{
          fontFamily: '"DM Sans", sans-serif',
          fontWeight: 400,
          fontSize: '0.85rem',
          letterSpacing: '0.3em',
          textTransform: 'uppercase' as const,
          color: '#ffffff',
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.2)',
          padding: '1rem 3rem',
          borderRadius: '2px',
          cursor: 'pointer',
          opacity: 0,
        }}
      >
        Enter the Luxury
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading text (shown while Canvas initialises)
// ---------------------------------------------------------------------------

function LoadingText() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 3,
      }}
    >
      <span
        style={{
          fontFamily: '"Cormorant Garamond", serif',
          fontWeight: 300,
          fontSize: '1.1rem',
          letterSpacing: '0.35em',
          color: '#ffffff',
          textTransform: 'uppercase',
          animation: 'hoa-pulse 2s ease-in-out infinite',
        }}
      >
        Loading
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Grain overlay (inline SVG noise texture)
// ---------------------------------------------------------------------------

const GRAIN_BG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`;

// ---------------------------------------------------------------------------
// Public exports
// ---------------------------------------------------------------------------

export function EntrancePreloader() {
  return (
    <ClientOnly>
      <PreloaderInner />
    </ClientOnly>
  );
}

function PreloaderInner() {
  const [isComplete, setIsComplete] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fogRef = useRef<HTMLDivElement>(null);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const lenis = getLenis();
    if (lenis) {
      try {
        lenis.stop();
      } catch (e) {
        /* ignore */
      }
    }

    return () => {
      document.body.style.overflow = '';
      document.documentElement.classList.remove('lenis-stopped');
      const l = getLenis();
      if (l) {
        try {
          l.start();
        } catch (e) {
          /* ignore */
        }
      }
    };
  }, []);

  const forceComplete = useCallback(() => {
    document.body.style.overflow = '';
    document.documentElement.classList.remove('lenis-stopped');
    const lenis = getLenis();
    if (lenis) {
      try {
        lenis.start();
      } catch (e) {
        /* ignore */
      }
    }
    window.dispatchEvent(new Event('preloader-complete'));
    setIsComplete(true);
  }, []);

  // Scene loading failsafe (15s)
  useEffect(() => {
    const failsafe = setTimeout(() => {
      if (!sceneReady && !isComplete) {
        console.warn('[Preloader] scene load failsafe triggered after 15s');
        forceComplete();
      }
    }, 15000);
    return () => clearTimeout(failsafe);
  }, [sceneReady, isComplete, forceComplete]);

  // Animation failsafe (12s after user clicks enter)
  useEffect(() => {
    if (!isStarted) return;
    const failsafe = setTimeout(() => {
      if (!isComplete) {
        console.warn('[Preloader] animation failsafe triggered after 12s');
        forceComplete();
      }
    }, 12000);
    return () => clearTimeout(failsafe);
  }, [isStarted, isComplete, forceComplete]);

  const handleComplete = useCallback(() => {
    const unlock = () => {
      document.body.style.overflow = '';
      document.documentElement.classList.remove('lenis-stopped');
      const lenis = getLenis();
      if (lenis) {
        try {
          lenis.start();
        } catch (e) {
          /* ignore */
        }
      }
      window.dispatchEvent(new Event('preloader-complete'));
      setIsComplete(true);
    };

    if (containerRef.current) {
      gsap.to(containerRef.current, {
        opacity: 0,
        duration: 0.6,
        ease: 'power1.inOut',
        onComplete: unlock,
      });
    } else {
      unlock();
    }
  }, []);

  const handleEnter = useCallback(() => {
    setIsStarted(true);
  }, []);

  if (isComplete) return null;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: '#0a0a0a',
      }}
    >
      {!sceneReady && <LoadingText />}
      {sceneReady && !isStarted && <EnterButton onEnter={handleEnter} />}

      <Canvas
        camera={{fov: 50, near: 0.1, far: 300, position: [0, 0, 40]}}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
        }}
        dpr={isMobile ? [1, 1] : [1, 1.5]}
        onCreated={() => {
          setSceneReady(true);
        }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      >
        <Suspense fallback={null}>
          <ErrorBoundary3D onError={handleComplete}>
            <Scene
              isStarted={isStarted}
              onComplete={handleComplete}
              fogRef={fogRef}
              isMobile={isMobile}
            />
          </ErrorBoundary3D>
        </Suspense>
      </Canvas>

      {/* Atmospheric grain texture */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: GRAIN_BG,
          backgroundSize: '200px 200px',
          opacity: 0.05,
          mixBlendMode: 'overlay' as const,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Fog overlay -- vignette that bridges tunnel into hero bg */}
      <div
        ref={fogRef}
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at center, rgba(10,10,10,0.2) 0%, rgba(10,10,10,0.7) 40%, rgba(10,10,10,1) 65%)',
          opacity: 0,
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />

      <style>{`
        @keyframes hoa-pulse {
          0%, 100% { opacity: 0.25; }
          50% { opacity: 1; }
        }
        .enter-btn {
          animation: enterGlow 3s ease-in-out infinite;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .enter-btn:hover {
          animation: none;
          border-color: rgba(255,255,255,0.5) !important;
          box-shadow: 0 0 50px rgba(255,255,255,0.3), inset 0 0 20px rgba(255,255,255,0.05) !important;
        }
        @keyframes enterGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(255,255,255,0.08); }
          50% { box-shadow: 0 0 40px rgba(255,255,255,0.2); }
        }
      `}</style>
    </div>
  );
}

export default EntrancePreloader;
