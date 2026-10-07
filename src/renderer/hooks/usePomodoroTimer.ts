import { useCallback, useEffect, useRef, useState } from 'react'

import { saveDailyCount } from './pomodoroHistory'
import { getTodayKey, incrementTodayInfo, loadTodayInfo, saveTodayInfo } from './todayInfoStorage'

import { getTimeInfo, updateTray } from '../components/pomodoro'

type TimerStatus = 'restart' | 'running' | 'finish' | 'paused'

interface UsePomodoroTimerProps {
  pomodoroMinutes: number
  restMinutes: number
}

export function usePomodoroTimer({ pomodoroMinutes, restMinutes }: UsePomodoroTimerProps) {
  const initialTimeInfo = getTimeInfo(pomodoroMinutes, restMinutes)
  const [status, setStatus] = useState<TimerStatus>('paused')
  const [isRest, setIsRest] = useState(false)
  const [todayInfo, setTodayInfo] = useState(loadTodayInfo)
  const [remainingTime, setRemainingTime] = useState(initialTimeInfo.POMODORO_SEC)

  // Date 기반 정확한 타이머를 위한 refs
  const endTimeRef = useRef<number | null>(null) // 목표 종료 시간 (timestamp)
  const pausedTimeRef = useRef<number>(0) // 일시정지 시점의 남은 시간
  const countInterval = useRef<NodeJS.Timeout | null>(null)

  // 남은 시간을 Date 기반으로 계산하는 함수
  const calculateRemainingTime = (): number => {
    if (endTimeRef.current === null) {
      return pausedTimeRef.current
    }
    const now = Date.now()
    const remaining = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000))
    return remaining
  }

  // 타이머 시작/일시정지 처리
  useEffect(() => {
    if (status === 'running') {
      // 타이머 시작: 현재 남은 시간을 기반으로 종료 시간 계산
      // endTimeRef가 이미 설정되어 있으면 재설정하지 않음 (이미 실행 중인 타이머)
      if (endTimeRef.current === null) {
        const now = Date.now()
        const currentRemaining = pausedTimeRef.current > 0 ? pausedTimeRef.current : remainingTime
        endTimeRef.current = now + currentRemaining * 1000
        pausedTimeRef.current = 0
      }

      // 주기적으로 남은 시간 업데이트 (Date 기반 계산)
      const timeInfo = getTimeInfo(pomodoroMinutes, restMinutes)
      const interval = setInterval(() => {
        const calculated = calculateRemainingTime()
        setRemainingTime(calculated)
        updateTray(window.domado?.ipc, calculated, isRest, { pomodoro: timeInfo.POMODORO_SEC, rest: timeInfo.REST_SEC })

        if (calculated <= 0) {
          endTimeRef.current = null
        }
      }, 100) // 100ms마다 업데이트하여 더 부드러운 UI 제공
      
      countInterval.current = interval
    } else {
      // 일시정지: 현재 남은 시간 저장
      if (endTimeRef.current !== null) {
        pausedTimeRef.current = calculateRemainingTime()
        endTimeRef.current = null
      }
      
      if (countInterval.current) {
        clearInterval(countInterval.current)
        countInterval.current = null
      }
    }

    return () => {
      if (countInterval.current) {
        clearInterval(countInterval.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  // Page Visibility API: 탭이 다시 활성화될 때 시간 재계산
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && status === 'running' && endTimeRef.current !== null) {
        // 탭이 다시 활성화되면 정확한 남은 시간으로 업데이트
        const calculated = calculateRemainingTime()
        setRemainingTime(calculated)
        
        // 만약 시간이 이미 지났다면 즉시 완료 처리
        if (calculated <= 0) {
          endTimeRef.current = null
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [status])

  // 타이머 완료 처리
  useEffect(() => {
    if (remainingTime <= 0 && status === 'running') {
      endTimeRef.current = null
      setStatus('finish')
    }
  }, [remainingTime, status])

  // finish 상태 처리
  useEffect(() => {
    if (status === 'finish') {
      const timeInfo = getTimeInfo(pomodoroMinutes, restMinutes)
      const newRemainingTime = isRest ? timeInfo.POMODORO_SEC : timeInfo.REST_SEC
      setRemainingTime(newRemainingTime)
      pausedTimeRef.current = newRemainingTime
      endTimeRef.current = null
      
      if (!isRest) {
        setTodayInfo(incrementTodayInfo)
      }
      setIsRest(prev => !prev)
      setStatus('paused')
    }
  }, [status, isRest, pomodoroMinutes, restMinutes])

  // 날짜가 바뀌면 뽀모도로 개수 초기화
  useEffect(() => {
    const today = getTodayKey()
    if (todayInfo.date !== today) {
      setTodayInfo({ count: 0, date: today })
    }
  }, [todayInfo.date])

  // todayInfo가 변경될 때마다 localStorage(오늘)와 IndexedDB(일별 기록)에 저장
  useEffect(() => {
    saveTodayInfo(todayInfo)
    void saveDailyCount(todayInfo.date, todayInfo.count)
  }, [todayInfo])

  const incrementCount = useCallback(() => {
    setTodayInfo(incrementTodayInfo)
  }, [])

  const togglePlay = () => {
    setStatus(prev => (prev === 'paused' ? 'running' : 'paused'))
  }

  // 설정 창에서 시간을 바꾸면 진행 중이던 뽀모도로를 새 시간으로 초기화한다 (최초 마운트 때는 초기 상태와 같아 영향 없음)
  useEffect(() => {
    const nextTimeInfo = getTimeInfo(pomodoroMinutes, restMinutes)

    if (countInterval.current) {
      clearInterval(countInterval.current)
      countInterval.current = null
    }

    endTimeRef.current = null
    pausedTimeRef.current = nextTimeInfo.POMODORO_SEC
    setStatus('paused')
    setIsRest(false)
    setRemainingTime(nextTimeInfo.POMODORO_SEC)
  }, [pomodoroMinutes, restMinutes])

  const timeInfo = getTimeInfo(pomodoroMinutes, restMinutes)

  return {
    status,
    isRest,
    todayInfo,
    remainingTime,
    togglePlay,
    setStatus,
    setIsRest,
    incrementCount,
    durations: {
      pomodoro: timeInfo.POMODORO_SEC,
      rest: timeInfo.REST_SEC,
    },
  }
}
