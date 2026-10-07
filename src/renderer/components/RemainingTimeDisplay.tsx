import { formatRemainingTime } from './pomodoro'

import { useI18n } from '../i18n'

interface RemainingTimeDisplayProps {
  remainingTime: number
}

export default function RemainingTimeDisplay({ remainingTime }: RemainingTimeDisplayProps) {
  const { m } = useI18n()

  return (
    <div
      aria-label={m.remainingTime}
      className="absolute w-full px-4 text-center text-white/80"
      style={{
        top: '20%',
        transform: 'translateY(-20%)',
        // 100px 위젯부터 전체화면까지 창 크기에 비례. 넓고 낮은 창에서도 높이를 넘지 않게 vh도 함께 본다
        fontSize: 'clamp(1.5rem, min(25vw, 22vh), 18rem)',
        fontVariantNumeric: 'tabular-nums',
        lineHeight: 1,
        userSelect: 'none',
      }}
    >
      {formatRemainingTime(remainingTime)}
    </div>
  )
}
