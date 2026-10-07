import { useSyncExternalStore } from 'react'

const STORAGE_KEY_POMODORO = 'domado_pomodoro_minutes'
const STORAGE_KEY_REST = 'domado_rest_minutes'
const STORAGE_KEY_OPACITY = 'domado_widget_opacity'
const KEYS = [STORAGE_KEY_POMODORO, STORAGE_KEY_REST, STORAGE_KEY_OPACITY]

const listeners = new Set<() => void>()
const notify = () => listeners.forEach(listener => listener())

// 설정 창(별도 BrowserWindow)에서 저장하면 같은 origin의 다른 창에 storage 이벤트가 온다
window.addEventListener('storage', event => {
  if (event.key !== null && KEYS.includes(event.key)) notify()
})

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function useStoredNumber(key: string, fallback: number) {
  return useSyncExternalStore(subscribe, () => {
    const saved = localStorage.getItem(key)
    return saved ? parseInt(saved, 10) : fallback
  })
}

export function usePomodoroSettings() {
  const pomodoroMinutes = useStoredNumber(STORAGE_KEY_POMODORO, 25)
  const restMinutes = useStoredNumber(STORAGE_KEY_REST, 5)

  const updateSettings = (pomodoro: number, rest: number) => {
    localStorage.setItem(STORAGE_KEY_POMODORO, pomodoro.toString())
    localStorage.setItem(STORAGE_KEY_REST, rest.toString())
    notify()
  }

  return {
    pomodoroMinutes,
    restMinutes,
    updateSettings,
  }
}

// 위젯 창 불투명도(%). 언어처럼 저장 버튼과 별개로 바로 반영한다
export function useWidgetOpacity() {
  const opacity = useStoredNumber(STORAGE_KEY_OPACITY, 80)

  const setOpacity = (value: number) => {
    localStorage.setItem(STORAGE_KEY_OPACITY, value.toString())
    notify()
  }

  return [opacity, setOpacity] as const
}
