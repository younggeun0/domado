import { useState } from 'react'

const STORAGE_KEY_POMODORO = 'domado_pomodoro_minutes'
const STORAGE_KEY_REST = 'domado_rest_minutes'

export function usePomodoroSettings() {
  const [pomodoroMinutes, setPomodoroMinutes] = useState(() => {
    if (typeof window === 'undefined') {
      return 25
    }
    const saved = localStorage.getItem(STORAGE_KEY_POMODORO)
    return saved ? parseInt(saved, 10) : 25
  })

  const [restMinutes, setRestMinutes] = useState(() => {
    if (typeof window === 'undefined') {
      return 5
    }
    const saved = localStorage.getItem(STORAGE_KEY_REST)
    return saved ? parseInt(saved, 10) : 5
  })

  const updateSettings = (pomodoro: number, rest: number) => {
    setPomodoroMinutes(pomodoro)
    setRestMinutes(rest)
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_POMODORO, pomodoro.toString())
      localStorage.setItem(STORAGE_KEY_REST, rest.toString())
    }
  }

  return {
    pomodoroMinutes,
    restMinutes,
    updateSettings,
  }
}

