import {useEffect, useMemo, useRef} from 'react';
import {Canvas, useFrame, useThree} from '@react-three/fiber';
import {useGLTF} from '@react-three/drei';
import * as THREE from 'three';

if (typeof window !== 'undefined') {
  useGLTF.preload('/models/Logo_element.glb', '/draco/');
}

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
    panel(6, 6, [0, -3.2, 0], [-Math.PI / 2, 0, 0], '#3a3c42', 0.55);

    const cam = new THREE.CubeCamera(0.1, 50, rt);
    scene.add(cam);
    cam.update(gl, scene);

    return rt.texture;
  }, [gl]);
}

function AboutLogoMesh() {
  const {scene: gltfScene} = useGLTF('/models/Logo_element.glb', '/draco/');
  // Clone so material mutations don't affect the shared cached scene used by SceneCanvas
  const scene = useMemo(() => gltfScene.clone(true), [gltfScene]);
  const groupRef = useRef<THREE.Group>(null!);
  const meshesRef = useRef<THREE.Mesh[]>([]);
  const pointerTarget = useRef({x: 0, y: 0});
  const pointerLerp = useRef({x: 0, y: 0});
  const envMap = useStudioChromeEnvMap();

  useEffect(() => {
    scene.rotation.set(-Math.PI / 2 + Math.PI, 0, Math.PI + Math.PI);
    scene.updateMatrixWorld(true);

    const meshes: THREE.Mesh[] = [];
    scene.traverse((child: any) => {
      if (!child.isMesh) return;
      child.material = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#b4b8c0'),
        metalness: 1.0,
        roughness: 0.14,
        envMap,
        envMapIntensity: 1.3,
        emissive: new THREE.Color('#000000'),
        emissiveIntensity: 0.0,
        clearcoat: 0.0,
        clearcoatRoughness: 0.0,
        transparent: false,
        opacity: 1,
      });
      meshes.push(child);
    });
    meshesRef.current = meshes;

    // Center the model on its bounding box so it sits at origin
    const box = new THREE.Box3().setFromObject(scene);
    const center = new THREE.Vector3();
    box.getCenter(center);
    scene.position.sub(center);
  }, [scene]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointerTarget.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointerTarget.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;

    pointerLerp.current.x = THREE.MathUtils.lerp(pointerLerp.current.x, pointerTarget.current.x, 0.06);
    pointerLerp.current.y = THREE.MathUtils.lerp(pointerLerp.current.y, pointerTarget.current.y, 0.06);

    const parallaxY = pointerLerp.current.x * 0.18;
    const parallaxX = pointerLerp.current.y * 0.12;

    groupRef.current.rotation.y = parallaxY;
    groupRef.current.rotation.x = parallaxX;

    const bob = Math.sin(t * 0.7) * 0.04;
    groupRef.current.position.y = bob;

    const breathe = 0.90 + Math.sin(t * 0.35) * 0.01;
    groupRef.current.scale.setScalar(breathe);

    const shimmer = 1.3 + Math.sin(t * 0.6) * 0.15;
    for (const m of meshesRef.current) {
      const mat = m.material as THREE.MeshPhysicalMaterial;
      if (mat) mat.envMapIntensity = shimmer;
    }
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
