import { Canvas } from '@react-three/fiber';
import { OrbitControls, Box } from '@react-three/drei';
import { useState, Suspense } from 'react';

export function Scene3D() {
  const [isRotating, setIsRotating] = useState(false);

  return (
    <div className="h-96 w-full relative">
      <Suspense fallback={
        <div className="absolute inset-0 flex items-center justify-center">
          Carregando modelo 3D...
        </div>
      }>
        <Canvas>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <Box 
            args={[1, 1, 1]}
            onPointerOver={() => setIsRotating(true)}
            onPointerOut={() => setIsRotating(false)}
          >
            <meshStandardMaterial 
              color="orange"
              metalness={0.5}
              roughness={0.5}
            />
          </Box>
          <OrbitControls 
            enableZoom={true}
            autoRotate={isRotating}
            autoRotateSpeed={5}
          />
        </Canvas>
      </Suspense>
    </div>
  );
} 