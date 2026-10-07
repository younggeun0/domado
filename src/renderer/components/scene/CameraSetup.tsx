import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'

export interface CameraConfig {
  position: [number, number, number]
  lookAt: [number, number, number]
}

interface CameraSetupProps {
  isRest: boolean
  config?: CameraConfig
}

export const DEFAULT_WORK_CONFIG: CameraConfig = {
  position: [18, 10, -13],
  lookAt: [0, 8, 0],
}

export const DEFAULT_REST_CONFIG: CameraConfig = {
  position: [25, 10, 3],
  lookAt: [0, 8, 0],
}

// 세로 시야각이 고정이라 창이 이 비율(폭/높이)보다 가늘어지면 모델 좌우가 잘린다 — 그만큼 줌아웃한다
const MIN_ASPECT = 0.45

export default function CameraSetup({ isRest, config }: CameraSetupProps) {
  const { camera, invalidate, size } = useThree()

  useEffect(() => {
    camera.zoom = Math.min(1, size.width / size.height / MIN_ASPECT)
    camera.updateProjectionMatrix()
    invalidate()
  }, [camera, invalidate, size])

  useEffect(() => {
    const cameraConfig = config || (isRest ? DEFAULT_REST_CONFIG : DEFAULT_WORK_CONFIG)
    camera.position.set(...cameraConfig.position)
    camera.lookAt(...cameraConfig.lookAt)
    invalidate()
  }, [camera, invalidate, isRest, config])

  return null
}
