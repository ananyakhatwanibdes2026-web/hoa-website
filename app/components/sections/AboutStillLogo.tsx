import {useEffect, useMemo, useRef} from 'react';
import {Canvas, useFrame} from '@react-three/fiber';
import {Environment, Lightformer, useGLTF} from '@react-three/drei';
import * as THREE from 'three';

if (typeof window !== 'undefined') {
  useGLTF.preload('/models/AN_Logo.glb', '/draco/');
}

function AboutLogoMesh() {
  const {scene: gltfScene} = useGLTF('/models/AN_Logo.glb', '/draco/');
  // Clone so material mutations don't affect the shared cached scene used by SceneCanvas
  const scene = useMemo(() => gltfScene.clone(true), [gltfScene]);
  const groupRef = useRef<THREE.Group>(null!);

  useEffect(() => {
    scene.rotation.set(-Math.PI / 2 + Math.PI, 0, Math.PI + Math.PI);
    scene.updateMatrixWorld(true);

    scene.traverse((child: any) => {
      if (!child.isMesh) return;
      child.material = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#c8c8cc'),
        metalness: 1.0,
        roughness: 0.12,
        envMapIntensity: 2.0,
        clearcoat: 0.5,
        clearcoatRoughness: 0.08,
        emissive: new THREE.Color('#504844'),
        emissiveIntensity: 0.12,
        transparent: false,
        opacity: 1,
      });
    });

    // Center the model on its bounding box so it sits at origin
    const box = new THREE.Box3().setFromObject(scene);
    const center = new THREE.Vector3();
    box.getCenter(center);
    scene.position.sub(center);
  }, [scene]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    const breathe = 0.90 + Math.sin(t * 0.35) * 0.01;
    groupRef.current.scale.setScalar(breathe);
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <primitive object={scene} />
    </group>
  );
}

function AboutLogoScene() {
  return (
    <>
      <ambientLight intensity={0.5} color="#ffffff" />
      <directionalLight position={[4, 6, 8]} intensity={1.5} color="#ffffff" />
      <directionalLight position={[-5, 2, -4]} intensity={0.6} color="#e8e4ff" />
      <AboutLogoMesh />
      <Environment resolution={256} background={false}>
        <Lightformer
          intensity={4}
          position={[0, 8, 0]}
          rotation-x={-Math.PI / 2}
          scale={[20, 20, 1]}
          color="#ffffff"
        />
        <Lightformer
          intensity={3}
          position={[0, 0, 8]}
          scale={[14, 8, 1]}
          color="#f0f0f5"
        />
        <Lightformer
          intensity={2}
          position={[-6, 4, 4]}
          rotation-y={Math.PI / 4}
          scale={[4, 12, 1]}
          color="#e0dcf0"
        />
        <Lightformer
          intensity={2}
          position={[6, 3, 4]}
          rotation-y={-Math.PI / 4}
          scale={[3, 10, 1]}
          color="#e8e8ee"
        />
      </Environment>
    </>
  );
}

export function AboutStillLogo() {
  const isMobile =
    typeof window !== 'undefined' && window.innerWidth < 768;
  const w = isMobile ? 'min(72vw, 320px)' : 'min(80vw, 1040px)';
  const h = isMobile ? 'min(72vw, 320px)' : 'min(80vw, 1040px)';

  return (
    <div
      aria-hidden
      style={{
        width: w,
        height: h,
        pointerEvents: 'none',
      }}
    >
      <Canvas
        camera={{fov: 65, near: 0.1, far: 100, position: [0, 0.05, 6.5]}}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.3,
        }}
        dpr={isMobile ? [1, 1] : [1, 1.5]}
        style={{width: '100%', height: '100%', display: 'block'}}
      >
        <AboutLogoScene />
      </Canvas>
    </div>
  );
}
