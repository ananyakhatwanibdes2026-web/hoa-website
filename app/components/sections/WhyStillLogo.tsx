import {useEffect, useRef} from 'react';
import {Canvas, useFrame} from '@react-three/fiber';
import {Environment, Lightformer, useGLTF} from '@react-three/drei';
import * as THREE from 'three';
import {whySectionState} from '~/lib/sceneState';

if (typeof window !== 'undefined') {
  useGLTF.preload('/models/Logo_element.glb', '/draco/');
}

/**
 * Still chrome AN mark for The Why section only. Separate from the global SceneCanvas
 * logo: no scroll-driven rotation, local lighting, own Canvas instance.
 */
function StillLogoMesh() {
  const {scene} = useGLTF('/models/Logo_element.glb', '/draco/');
  const groupRef = useRef<THREE.Group>(null!);
  const meshesRef = useRef<THREE.Mesh[]>([]);
  const pointerTarget = useRef({x: 0, y: 0});
  const pointerLerp = useRef({x: 0, y: 0});

  useEffect(() => {
    scene.rotation.set(-Math.PI / 2 + Math.PI, 0, Math.PI + Math.PI);

    const collected: THREE.Mesh[] = [];
    scene.traverse((child: any) => {
      if (!child.isMesh) return;
      child.material = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#f0f0f5'),
        metalness: 0.6,
        roughness: 0.3,
        envMapIntensity: 0.8,
        clearcoat: 0.4,
        clearcoatRoughness: 0.15,
        sheen: 0.5,
        sheenRoughness: 0.4,
        sheenColor: new THREE.Color('#e8e0f0'),
        transparent: true,
        opacity: 1,
      });
      collected.push(child as THREE.Mesh);
    });
    meshesRef.current = collected;

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
      meshes[0].position.x -= 0.28;
      meshes[meshes.length - 1].position.x += 0.28;
    }
  }, [scene]);

  const smoothProgress = useRef(0);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointerTarget.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointerTarget.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  const logCountRef = useRef(0);
  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    const sp = whySectionState.sectionProgress;

    // #region agent log
    logCountRef.current++;
    if (logCountRef.current % 120 === 1) { fetch('http://127.0.0.1:7722/ingest/e351b645-ef8c-40b9-a427-fc07d611daf8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c1ee81'},body:JSON.stringify({sessionId:'c1ee81',location:'WhyStillLogo.tsx:useFrame',message:'StillLogoMesh frame',data:{sectionProgress:sp,smoothP:smoothProgress.current,active:whySectionState.active,frame:logCountRef.current},timestamp:Date.now(),hypothesisId:'BD'})}).catch(()=>{}); }
    // #endregion

    smoothProgress.current = THREE.MathUtils.lerp(smoothProgress.current, sp, 0.06);
    const p = smoothProgress.current;

    pointerLerp.current.x = THREE.MathUtils.lerp(pointerLerp.current.x, pointerTarget.current.x, 0.06);
    pointerLerp.current.y = THREE.MathUtils.lerp(pointerLerp.current.y, pointerTarget.current.y, 0.06);

    const parallaxY = pointerLerp.current.x * 0.18;
    const parallaxX = pointerLerp.current.y * 0.12;

    const tiltX = Math.sin(p * Math.PI) * 0.15;
    const tiltY = Math.sin(p * Math.PI * 2) * 0.12;
    groupRef.current.rotation.x = tiltX + parallaxX;
    groupRef.current.rotation.y = tiltY + parallaxY;

    const bob = Math.sin(t * 0.7) * 0.04;
    groupRef.current.position.y = 0.05 + bob;

    const breathe = 1.0 + Math.sin(t * 0.35) * 0.01;
    const scrollScale = 1.0 + Math.sin(p * Math.PI) * 0.08;
    groupRef.current.scale.setScalar(1.22 * breathe * scrollScale);

    const shimmer = 0.8 + Math.sin(t * 0.6) * 0.18;
    for (const m of meshesRef.current) {
      const mat = m.material as THREE.MeshPhysicalMaterial;
      if (mat) mat.envMapIntensity = shimmer;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.05, 0]}>
      <primitive object={scene} />
    </group>
  );
}

function WhyLogoScene() {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 6, 8]} intensity={1.1} color="#ffffff" />
      <directionalLight position={[-5, 2, -4]} intensity={0.35} color="#ddd4ff" />
      <StillLogoMesh />
      <Environment resolution={128} background={false}>
        <Lightformer
          intensity={2.2}
          position={[0, 8, 0]}
          rotation-x={-Math.PI / 2}
          scale={[16, 16, 1]}
          color="#ffffff"
        />
        <Lightformer
          intensity={1.0}
          position={[-6, 4, 4]}
          rotation-y={Math.PI / 4}
          scale={[4, 12, 1]}
          color="#e0dcf0"
        />
        <Lightformer
          intensity={1.1}
          position={[6, 3, 4]}
          rotation-y={-Math.PI / 4}
          scale={[3, 10, 1]}
          color="#e8e8ee"
        />
      </Environment>
    </>
  );
}

export function WhyStillLogo() {
  // #region agent log
  fetch('http://127.0.0.1:7722/ingest/e351b645-ef8c-40b9-a427-fc07d611daf8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c1ee81'},body:JSON.stringify({sessionId:'c1ee81',location:'WhyStillLogo.tsx:export',message:'WhyStillLogo mounted',data:{mounted:true},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  const isMobile =
    typeof window !== 'undefined' && window.innerWidth < 768;
  const w = isMobile ? 'min(72vw, 320px)' : 'min(38vw, 400px)';
  const h = isMobile ? 'min(56vw, 280px)' : 'min(44vw, 440px)';

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
        camera={{fov: 48, near: 0.1, far: 100, position: [0, 0.15, 3.6]}}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
        }}
        dpr={isMobile ? [1, 1] : [1, 1.5]}
        style={{width: '100%', height: '100%', display: 'block'}}
      >
        <WhyLogoScene />
      </Canvas>
    </div>
  );
}
