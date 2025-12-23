
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Stars, Environment, PerspectiveCamera, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { TreeState, ParticleData, HandData } from '../types';

// Alias for intrinsic elements to bypass type checking
const InstancedMesh_ = 'instancedMesh' as any;
const SphereGeometry_ = 'sphereGeometry' as any;
const MeshPhysicalMaterial_ = 'meshPhysicalMaterial' as any;
const Color_ = 'color' as any;
const Fog_ = 'fog' as any;
const AmbientLight_ = 'ambientLight' as any;
const PointLight_ = 'pointLight' as any;
const SpotLight_ = 'spotLight' as any;
const Group_ = 'group' as any;

const PARTICLE_COUNT = 2200; 

const PALETTE = {
  BG_DEEP: '#051505',
  GOLD_BRIGHT: '#FDE68A', 
  GOLD_WARM: '#D97706',   
  GOLD_GLOW: '#FFD700',   
  WHITE_LIGHT: '#FFFFFF',
};

const ParticleGroup: React.FC<{ 
  treeState: TreeState; 
  handData: HandData | null;
  data: ParticleData[];
}> = ({ treeState, handData, data }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const tempObject = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    if (!meshRef.current) return;

    const time = state.clock.getElapsedTime();
    const isMerged = treeState === TreeState.MERGED;
    
    // Snappy transition
    const lerpSpeed = isMerged ? 0.08 : 0.06;

    data.forEach((p, i) => {
      const target = isMerged ? p.initialPos : p.scatterPos;

      p.currentPos.x = THREE.MathUtils.lerp(p.currentPos.x, target.x, lerpSpeed);
      p.currentPos.y = THREE.MathUtils.lerp(p.currentPos.y, target.y, lerpSpeed);
      p.currentPos.z = THREE.MathUtils.lerp(p.currentPos.z, target.z, lerpSpeed);

      const hover = Math.sin(time * 0.4 + i) * 0.04;
      const breathe = 1 + Math.sin(time * 2.2 + i) * 0.2;
      
      let handEffect = { x: 0, y: 0, z: 0 };
      if (handData) {
        const dx = p.currentPos.x - handData.x * 12;
        const dy = p.currentPos.y - handData.y * 12;
        const distSq = dx*dx + dy*dy;
        if (distSq < 36) {
          const dist = Math.sqrt(distSq);
          const force = (6 - dist) / 6;
          handEffect.x = (dx / dist) * force * 3.5;
          handEffect.y = (dy / dist) * force * 3.5;
        }
      }

      tempObject.position.set(
        p.currentPos.x + handEffect.x, 
        p.currentPos.y + hover + handEffect.y, 
        p.currentPos.z + handEffect.z
      );
      
      tempObject.rotation.set(p.rotation.x, p.rotation.y + time * 0.1, p.rotation.z);
      
      const s = p.scale * (isMerged ? 1 : 1.8) * breathe;
      tempObject.scale.set(s, s, s);
      tempObject.updateMatrix();
      meshRef.current!.setMatrixAt(i, tempObject.matrix);
      
      const color = new THREE.Color(p.color);
      const intensity = 1.2 + Math.sin(time * 3 + i) * 0.6;
      color.multiplyScalar(intensity);
      meshRef.current!.setColorAt(i, color);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <InstancedMesh_ ref={meshRef} args={[null, null, data.length]}>
      <SphereGeometry_ args={[0.22, 6, 6]} />
      <MeshPhysicalMaterial_ 
        metalness={1.0} 
        roughness={0.1} 
        emissiveIntensity={2}
        transparent={true}
        opacity={0.95}
      />
    </InstancedMesh_>
  );
};

const Scene3D: React.FC<{ treeState: TreeState; handData: HandData | null }> = ({ treeState, handData }) => {
  const particleData = useMemo(() => {
    const list: ParticleData[] = [];
    const treeHeight = 9.0; 
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const y = Math.random() * treeHeight - 4.5; 
      const normalizedY = (y + 4.5) / treeHeight; 
      
      const baseRadius = 4.2; 
      const taper = Math.pow(1 - normalizedY, 1.1); 
      const maxRadiusAtY = baseRadius * taper;
      
      const distFromCenter = Math.sqrt(Math.random()) * maxRadiusAtY;
      const angle = Math.random() * Math.PI * 2;
      
      const initialPos = {
        x: Math.cos(angle) * distFromCenter,
        y: y,
        z: Math.sin(angle) * distFromCenter,
      };

      const scatterDist = 15 + Math.random() * 55;
      const sTheta = Math.random() * Math.PI * 2;
      const sPhi = Math.acos(2 * Math.random() - 1);

      const scatterPos = {
        x: scatterDist * Math.sin(sPhi) * Math.cos(sTheta),
        y: scatterDist * Math.sin(sPhi) * Math.sin(sTheta),
        z: scatterDist * Math.cos(sPhi),
      };

      const rand = Math.random();
      const color = rand > 0.6 ? PALETTE.GOLD_BRIGHT : (rand > 0.2 ? PALETTE.GOLD_WARM : PALETTE.WHITE_LIGHT);

      list.push({
        initialPos,
        scatterPos,
        currentPos: { ...initialPos },
        rotation: { x: Math.random(), y: Math.random(), z: Math.random() },
        scale: 0.1 + Math.random() * 0.2, 
        type: 'sphere',
        color,
      });
    }
    return list;
  }, []);

  const isMerged = treeState === TreeState.MERGED;

  return (
    <div className="w-full h-full bg-[#051505]">
      <Canvas shadow={{ type: THREE.PCFSoftShadowMap }} dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 1, 26]} fov={30} />
        <OrbitControls 
          enablePan={false} 
          autoRotate 
          autoRotateSpeed={isMerged ? 0.5 : 2.5}
          maxPolarAngle={Math.PI}
          minPolarAngle={0}
          minDistance={10}
          maxDistance={50}
        />
        
        <Color_ attach="background" args={[PALETTE.BG_DEEP]} />
        <Fog_ attach="fog" args={[PALETTE.BG_DEEP, 25, 85]} />
        
        <AmbientLight_ intensity={0.7} />
        {/* Point light intensity reduced to avoid illuminating background haze */}
        <PointLight_ position={[0, 0, 0]} intensity={isMerged ? 3 : 0.5} color={PALETTE.GOLD_WARM} distance={30} />
        <SpotLight_ position={[15, 25, 15]} angle={0.3} intensity={isMerged ? 8 : 1} color={PALETTE.GOLD_BRIGHT} />
        
        <Stars radius={150} depth={60} count={5000} factor={8} saturation={1} fade speed={2} />

        <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.4}>
          <ParticleGroup data={particleData} treeState={treeState} handData={handData} />
        </Float>

        <Environment preset="night" />
      </Canvas>
    </div>
  );
};

export default Scene3D;
