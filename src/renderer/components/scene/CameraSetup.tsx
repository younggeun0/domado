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

export default function CameraSetup({ isRest, config }: CameraSetupProps) {
  const { camera, invalidate } = useThree()

  useEffect(() => {
    const cameraConfig = config || (isRest ? DEFAULT_REST_CONFIG : DEFAULT_WORK_CONFIG)
    camera.position.set(...cameraConfig.position)
    camera.lookAt(...cameraConfig.lookAt)
    invalidate()
  }, [camera, invalidate, isRest, config])

  return null
}
