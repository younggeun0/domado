/* eslint-disable react/no-unknown-property */
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Suspense } from 'react'
import CameraSetup from './scene/CameraSetup'
import CoffeeCupModel from './scene/CoffeeCupModel'
import TomatoModel from './scene/TomatoModel'

export default function Domado({
  isRest,
  paused,
  remainingTime,
}: {
  isRest: boolean
  paused: boolean
  remainingTime: number
}) {
  return (
    <Canvas
      style={{ position: 'absolute', width: '100vw', height: '100vh', background: isRest ? 'black' : 'transparent' }}
      gl={{ preserveDrawingBuffer: true, antialias: true }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} intensity={2.5} />
        {isRest ? <CoffeeCupModel /> : <TomatoModel paused={paused} />}
        <CameraSetup isRest={isRest} remainingTime={remainingTime} />
        {paused && !isRest && <OrbitControls />}
      </Suspense>
    </Canvas>
  )
}
