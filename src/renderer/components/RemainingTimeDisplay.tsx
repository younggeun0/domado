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
        // 100px 위젯부터 전체화면까지 폭에 비례
        fontSize: 'clamp(1.5rem, 25vw, 18rem)',
        fontVariantNumeric: 'tabular-nums',
        lineHeight: 1,
        userSelect: 'none',
      }}
    >
      {formatRemainingTime(remainingTime)}
    </div>
  )
}
