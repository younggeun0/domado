import { useSyncExternalStore } from 'react'

const STORAGE_KEY_POMODORO = 'domado_pomodoro_minutes'
const STORAGE_KEY_REST = 'domado_rest_minutes'

const listeners = new Set<() => void>()

// 설정 창(별도 BrowserWindow)에서 저장하면 같은 origin의 다른 창에 storage 이벤트가 온다
window.addEventListener('storage', event => {
  if (event.key === STORAGE_KEY_POMODORO || event.key === STORAGE_KEY_REST) {
    listeners.forEach(listener => listener())
  }
})

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function readMinutes(key: string, fallback: number) {
  const saved = localStorage.getItem(key)
  return saved ? parseInt(saved, 10) : fallback
}

export function usePomodoroSettings() {
  const pomodoroMinutes = useSyncExternalStore(subscribe, () => readMinutes(STORAGE_KEY_POMODORO, 25))
  const restMinutes = useSyncExternalStore(subscribe, () => readMinutes(STORAGE_KEY_REST, 5))

  const updateSettings = (pomodoro: number, rest: number) => {
    localStorage.setItem(STORAGE_KEY_POMODORO, pomodoro.toString())
    localStorage.setItem(STORAGE_KEY_REST, rest.toString())
    listeners.forEach(listener => listener())
  }

  return {
    pomodoroMinutes,
    restMinutes,
    updateSettings,
  }
}
