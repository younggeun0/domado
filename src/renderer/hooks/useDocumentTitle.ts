import { useEffect } from 'react'
import { formatRemainingTime } from '../components/pomodoro'

interface UseDocumentTitleProps {
  count: number
  remainingTime: number
  isRest: boolean
}

export function useDocumentTitle({ count, remainingTime, isRest }: UseDocumentTitleProps) {
  useEffect(() => {
    const formattedTime = formatRemainingTime(remainingTime)
    document.title = `${count} - ${formattedTime} ${isRest ? '☕' : '🔥'}`
  }, [count, remainingTime, isRest])
}

