// 개발 모드(tauri dev)와 DOMADO_FAST_TIMER=1 실행에서는 흐름 확인용으로 3초씩만 돈다
export const getTimeInfo = (pomodoroMinutes: number = 25, restMinutes: number = 5) => {
  return window.domado?.isDebug
    ? {
        POMODORO_SEC: 3,
        REST_SEC: 3,
      }
    : {
        POMODORO_SEC: pomodoroMinutes * 60,
        REST_SEC: restMinutes * 60,
      }
}

export function formatRemainingTime(time: number) {
  const minutes = Math.floor(time / 60)
  const seconds = time % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

// 메뉴 막대 트레이 아이콘 옆에 남은 시간을 글자로 띄운다 (휴식은 ☕). 시간이 다 되면 지운다.
// 100ms마다 불리므로 글자가 바뀔 때만 보낸다
let lastTrayTitle: string | null = null

export function updateTray(ipc: NonNullable<Window['domado']>['ipc'] | undefined, remaining: number, isRest: boolean) {
  const time = `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`
  const title = remaining > 0 ? `${isRest ? '☕ ' : ''}${time}` : null
  if (title === lastTrayTitle) return
  lastTrayTitle = title
  ipc?.sendMessage('update_tray', title)
}
