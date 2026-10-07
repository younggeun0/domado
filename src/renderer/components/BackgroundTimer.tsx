import { useEffect, useRef } from 'react'

interface BackgroundTimerProps {
  isRest: boolean
  pomodoroDuration: number
  restDuration: number
  status: 'running' | 'paused'
}

export default function BackgroundTimer({ isRest, pomodoroDuration, restDuration, status }: BackgroundTimerProps) {
  const bgTimerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<Animation | null>(null)

  // 애니메이션 생성
  useEffect(() => {
    const bgTimer = bgTimerRef.current
    if (!bgTimer || !window.KeyframeEffect) return

    // 이전 애니메이션 취소 및 초기 상태로 리셋
    if (animationRef.current) {
      animationRef.current.cancel()
    }

    const initialHeight = isRest ? '0%' : '100%'
    bgTimer.style.height = initialHeight

    const animation = new Animation(
      new KeyframeEffect(
        bgTimer,
        [{ height: initialHeight }, { height: isRest ? '100%' : '0%' }],
        {
          duration: isRest ? restDuration * 1000 : pomodoroDuration * 1000,
          fill: 'forwards',
          easing: 'linear',
        },
      ),
      document.timeline,
    )

    animationRef.current = animation

    return () => {
      if (animationRef.current) {
        animationRef.current.cancel()
      }
    }
  }, [isRest, pomodoroDuration, restDuration])

  // 애니메이션 재생/일시정지
  useEffect(() => {
    if (!animationRef.current) return

    if (status === 'running') {
      animationRef.current.play()
    } else if (status === 'paused') {
      animationRef.current.pause()
    }
  }, [status])

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div
        ref={bgTimerRef}
        className="absolute inset-x-0 bottom-0"
        style={{
          background: isRest ? '#6AFF88' : '#b22222',
        }}
      />
      <div
        className="absolute inset-0 bg-black"
        style={{
          zIndex: -1,
        }}
      />
    </div>
  )
}
