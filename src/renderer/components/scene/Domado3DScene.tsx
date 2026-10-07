import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { memo, Suspense } from 'react'
import { TOUCH } from 'three'

import CameraSetup from './CameraSetup'
import CoffeeCupModel from './CoffeeCupModel'
import TomatoModel from './TomatoModel'

interface Domado3DSceneProps {
  isRest: boolean
  paused: boolean
  onTogglePlay: () => void
}

function Domado3DScene({ isRest, paused, onTogglePlay }: Domado3DSceneProps) {
  return (
    <Canvas
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        background: isRest ? 'black' : 'transparent',
        touchAction: 'none',
      }}
      // 일시정지된 작업 모드는 움직이는 것이 없으니 변경(조작·리렌더)이 있을 때만 그린다
      frameloop={!isRest && paused ? 'demand' : 'always'}
      gl={{ antialias: true }}
      onCreated={({ gl }) => {
        // 예기치 않은 WebGL 컨텍스트 손실 후 복구되면 씬을 다시 불러온다
        gl.domElement.addEventListener('webglcontextlost', event => event.preventDefault())
        gl.domElement.addEventListener('webglcontextrestored', () => window.location.reload())
      }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} intensity={2.5} />

        {isRest ? <CoffeeCupModel onTogglePlay={onTogglePlay} /> : <TomatoModel paused={paused} onTogglePlay={onTogglePlay} />}

        <CameraSetup isRest={isRest} />

        <OrbitControls enableRotate enableZoom enablePan={false} touches={{ ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY_PAN }} />
      </Suspense>
    </Canvas>
  )
}

export default memo(Domado3DScene)
