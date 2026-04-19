import { Canvas } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import {
  ColMouseTracker,
  ColPostFX,
  IceDust,
  ShardRings,
  CrystalShards,
} from './CollectionsDecorations';

interface Props {
  isMobile: boolean;
}

export default function CollectionsCanvas({ isMobile }: Props) {
  return (
    <Canvas
      camera={{ fov: 65, position: [0, 0, 10], near: 0.1, far: 60 }}
      dpr={isMobile ? [1, 1] : [1, 1.5]}
      gl={{ alpha: true, antialias: !isMobile }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <Environment resolution={256} background={false}>
        <Lightformer intensity={2.0} color="#a0b8e8" position={[0, 5, -5]} />
        <Lightformer intensity={1.5} color="#6080c0" position={[-5, 0, -3]} />
        <Lightformer intensity={1.0} color="#e0e8ff" position={[5, 0, -3]} />
      </Environment>
      <ColMouseTracker />
      {/* Back-to-front render order */}
      <ShardRings />
      <IceDust isMobile={isMobile} />
      <CrystalShards isMobile={isMobile} />
      <ColPostFX isMobile={isMobile} />
    </Canvas>
  );
}
