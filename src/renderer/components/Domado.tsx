/* eslint-disable react/no-unknown-property */
import { useEffect, useRef } from 'react'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { OrbitControls, useTexture } from '@react-three/drei'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader'
import tomatoOBJ from 'assets/3dmodel/tomato.obj'
import tomatoMTL from 'assets/3dmodel/tomato.mtl'
import tomatoTexture from 'assets/3dmodel/tomato_texture.jpg'

import cupOBJ from 'assets/3dmodel/coffee_cup.obj'
import cupMTL from 'assets/3dmodel/coffee_cup.mtl'
import { getTimeInfo } from './pomodoro'

function CoffeeCupModel() {
  const groupRef = useRef<any>()
  const cupMaterials = useLoader(MTLLoader, cupMTL)
  const cupObj = useLoader(OBJLoader, cupOBJ, (loader) => {
    cupMaterials.preload()
    loader.setMaterials(cupMaterials)
  })

  const scale = 12
  cupObj.scale.set(scale, scale, scale)
  cupObj.position.set(0, -68, 0)

  return <primitive ref={groupRef} object={cupObj} />
}

function TomatoModel({ paused }: { paused: boolean }) {
  const groupRef = useRef<any>()
  const tomatoMaterials = useLoader(MTLLoader, tomatoMTL)
  const tomatoObj = useLoader(OBJLoader, tomatoOBJ, (loader) => {
    tomatoMaterials.preload()
    loader.setMaterials(tomatoMaterials)
  })

  const texture = useTexture(tomatoTexture)
  // 텍스처를 모델에 적용
  tomatoObj.traverse((child: any) => {
    if (child.isMesh) {
      if (child.geometry.attributes.uv) {
        child.material.map = texture
      }
    }
  })

  tomatoObj.rotation.x = -Math.PI / 2

  // 애니메이션
  useFrame(() => {
    if (groupRef.current && !paused) {
      groupRef.current.rotation.z += 0.01
    }
  })

  return <primitive ref={groupRef} object={tomatoObj} />
}

function CameraSetup({ isRest, remainingTime }: { isRest: boolean; remainingTime: number }) {
  const { camera } = useThree()
  const timeInfo = getTimeInfo(window.electron?.isDebug ?? true)

  useEffect(() => {
    if (isRest) {
      camera.position.set(25, 20, 0)
    } else {
      const codinate = 14 + 36 * (remainingTime / timeInfo[isRest ? 'REST_SEC' : 'POMODORO_SEC'])
      camera.position.set(codinate, codinate, 0)
    }

    camera.lookAt(0, 0, 0)
  }, [camera, isRest, remainingTime, timeInfo])

  return null
}

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
      camera={{
        position: [50, 40, 0],
        fov: 75,
      }}
      style={{ position: 'absolute', width: '100vw', height: '100vh', background: 'transparent' }}
    >
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 5, 5]} intensity={2.5} />
      {isRest ? <CoffeeCupModel /> : <TomatoModel paused={paused} />}
      <CameraSetup isRest={isRest} remainingTime={remainingTime} />
      {paused && <OrbitControls />}
    </Canvas>
  )
}
