import { useEffect, useMemo, useRef, useState } from 'react'
import { getTimeInfo, updateTray } from '../components/pomodoro'

type TimerStatus = 'restart' | 'running' | 'finish' | 'paused'

interface UsePomodoroTimerProps {
  pomodoroMinutes: number
  restMinutes: number
}

const STORAGE_KEY_TODAY_INFO = 'domado_today_info'

// 오늘 날짜를 YYYY-MM-DD 형식으로 반환
function getTodayKey(): string {
  return new Date().toISOString().split('T')[0]
}

function loadTodayInfo(): { count: number; date: string } {
  if (typeof window === 'undefined') {
    return { count: 0, date: getTodayKey() }
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY_TODAY_INFO)
    if (saved) {
      const data = JSON.parse(saved)
      const today = getTodayKey()

      if (data.date === today) {
        return data
      }
    }
  } catch (error) {
    console.warn('Failed to load today info from localStorage:', error)
  }

  return { count: 0, date: getTodayKey() }
}

function saveTodayInfo(count: number): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    const data = { count, date: getTodayKey() }
    localStorage.setItem(STORAGE_KEY_TODAY_INFO, JSON.stringify(data))
  } catch (error) {
    console.warn('Failed to save today info to localStorage:', error)
  }
}

export function usePomodoroTimer({ pomodoroMinutes, restMinutes }: UsePomodoroTimerProps) {
  const isDebug = window.electron?.isDebug ?? false
  
  // durations 계산 (디버그 모드일 때는 짧은 시간 사용, 아니면 설정값 사용)
  const durations = useMemo(() => {
    if (isDebug) {
      const timeInfo = getTimeInfo(isDebug)
      return {
        pomodoro: timeInfo.POMODORO_SEC,
        rest: timeInfo.REST_SEC,
      }
    }
    return {
      pomodoro: pomodoroMinutes * 60,
      rest: restMinutes * 60,
    }
  }, [isDebug, pomodoroMinutes, restMinutes])
  
  const initialPomodoroSec = durations.pomodoro
  const [status, setStatus] = useState<TimerStatus>('paused')
  const [isRest, setIsRest] = useState(false)
  const [todayInfo, setTodayInfo] = useState(loadTodayInfo)
  const [remainingTime, setRemainingTime] = useState(initialPomodoroSec)

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

  // 초기 시간 설정 및 설정 변경 시 업데이트
  useEffect(() => {
    if (status === 'paused') {
      const newRemainingTime = isRest ? durations.rest : durations.pomodoro
      setRemainingTime(newRemainingTime)
      pausedTimeRef.current = newRemainingTime
      endTimeRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, isRest, durations.pomodoro, durations.rest])

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
      const interval = setInterval(() => {
        const calculated = calculateRemainingTime()
        setRemainingTime(calculated)
        
        // Electron IPC: 트레이 업데이트
        updateTray(window.electron?.ipcRenderer, calculated, isRest, {
          pomodoro: durations.pomodoro,
          rest: durations.rest,
        })
        
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
  }, [status, isRest, isDebug])

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
      const newRemainingTime = isRest ? durations.pomodoro : durations.rest
      setRemainingTime(newRemainingTime)
      pausedTimeRef.current = newRemainingTime
      endTimeRef.current = null
      
      if (isRest) {
        // Electron IPC: 휴식 종료 알림
        window.electron?.ipcRenderer.sendMessage('rest_finished')
        setTodayInfo({
          count: todayInfo.count,
        })
      } else {
        // Electron IPC: 뽀모도로 완료 알림
        window.electron?.ipcRenderer.sendSync('pomodoro_finished')
        setTodayInfo((prev) => {
          const newCount = prev.count + 1
          saveTodayInfo(newCount)
          return { ...prev, count: newCount }
        })
      }
      setIsRest((prev) => !prev)
      setStatus('paused')
    }
  }, [status, isRest, durations.pomodoro, durations.rest, todayInfo.count])

  // 날짜가 바뀌면 뽀모도로 개수 초기화
  useEffect(() => {
    const today = getTodayKey()
    if (todayInfo.date !== today) {
      setTodayInfo({ count: 0, date: today })
      saveTodayInfo(0)
    }
  }, [todayInfo.date])

  // todayInfo가 변경될 때마다 localStorage에 저장 (수동으로 count를 변경하는 경우 대비)
  useEffect(() => {
    saveTodayInfo(todayInfo.count)
  }, [todayInfo.count])

  const togglePlay = () => {
    setStatus((prev) => (prev === 'paused' ? 'running' : 'paused'))
  }

  return {
    status,
    isRest,
    todayInfo,
    remainingTime,
    togglePlay,
    setStatus,
    setIsRest,
    setTodayInfo,
    durations,
  }
}

