import { useEffect } from 'react'

import { formatRemainingTime } from '../components/pomodoro'

interface UseDocumentTitleProps {
  count: number
  remainingTime: number
  isRest: boolean
  paused: boolean
}

export function useDocumentTitle({ count, remainingTime, isRest, paused }: UseDocumentTitleProps) {
  useEffect(() => {
    const formattedTime = formatRemainingTime(remainingTime)
    // 휴식은 ☕, 작업 중 일시정지는 ⏸
    document.title = `${count} - ${formattedTime} ${isRest ? '☕' : paused ? '⏸' : '🔥'}`
  }, [count, remainingTime, isRest, paused])
}
