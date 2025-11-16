import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { getTimeInfo } from '../pomodoro'

interface CameraSetupProps {
  isRest: boolean
  remainingTime: number
}

export default function CameraSetup({ isRest, remainingTime }: CameraSetupProps) {
  const { camera } = useThree()
  const timeInfo = getTimeInfo(window.electron?.isDebug ?? true)

  useEffect(() => {
    if (isRest) {
      camera.position.set(40, 15, 0)
      camera.lookAt(0, 10, 0)
    } else {
      const codinate = 14 + 36 * (remainingTime / timeInfo.POMODORO_SEC)
      camera.position.set(codinate, codinate, 0)
      camera.lookAt(0, 0, 0)
    }
  }, [camera, isRest, remainingTime, timeInfo])

  return null
}

