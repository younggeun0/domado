import { useEffect, useRef } from 'react'

export function useWakeLock(enabled: boolean) {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)
  const enabledRef = useRef(enabled)
  const warningShownRef = useRef(false)

  useEffect(() => {
    enabledRef.current = enabled
  }, [enabled])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return
    }

    const requestWakeLock = async () => {
      if (!enabledRef.current || document.visibilityState !== 'visible') {
        return
      }

      if (!('wakeLock' in navigator) || !navigator.wakeLock) {
        if (!warningShownRef.current) {
          console.warn('Screen Wake Lock API is not supported in this browser')
          warningShownRef.current = true
        }
        return
      }

      try {
        const sentinel = await navigator.wakeLock.request('screen')
        wakeLockRef.current = sentinel

        sentinel.addEventListener('release', () => {
          if (wakeLockRef.current === sentinel) {
            wakeLockRef.current = null
          }
        })
      } catch (error) {
        console.warn('Failed to acquire screen wake lock:', error)
      }
    }

    const releaseWakeLock = async () => {
      const wakeLock = wakeLockRef.current
      wakeLockRef.current = null

      if (!wakeLock) {
        return
      }

      try {
        await wakeLock.release()
      } catch (error) {
        console.warn('Failed to release screen wake lock:', error)
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && enabledRef.current && wakeLockRef.current === null) {
        void requestWakeLock()
      }
    }

    if (enabled) {
      void requestWakeLock()
    } else {
      void releaseWakeLock()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      void releaseWakeLock()
    }
  }, [enabled])
}
