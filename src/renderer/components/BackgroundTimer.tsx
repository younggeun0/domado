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

    // 작업은 빨간 막대가 줄어들고, 휴식은 밝은 아침빛이 서서히 드러난다
    bgTimer.style.height = '100%'
    bgTimer.style.opacity = isRest ? '0' : '1'

    const animation = new Animation(
      new KeyframeEffect(
        bgTimer,
        isRest ? [{ opacity: 0 }, { opacity: 1 }] : [{ height: '100%' }, { height: '0%' }],
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
          background: isRest ? 'linear-gradient(to bottom, #e6a464 0%, #f2c58f 55%, #f8dfb8 100%)' : '#b22222',
        }}
      />
      {/* 휴식은 어둡고 따뜻한 밤에서 시작해 끝날 때 아침처럼 밝아진다 */}
      <div
        className="absolute inset-0"
        style={{
          zIndex: -1,
          background: isRest ? 'radial-gradient(circle at 50% 55%, #3b2619 0%, #1a110b 50%, #080504 100%)' : 'black',
        }}
      />
    </div>
  )
}
