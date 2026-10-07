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

export function updateTray(
  ipc: NonNullable<Window['domado']>['ipc'] | undefined,
  newRemainingTime: number,
  isRest: boolean,
  durations: { pomodoro: number; rest: number },
) {
  if (newRemainingTime <= 0) {
    ipc?.sendMessage('update_tray', null)
    return
  }

  const canvas = document.createElement('canvas')
  canvas.width = 27
  canvas.height = 27

  const ctx = canvas?.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.fillRect(0, 0, 27, 0)
  if (isRest) {
    const level = Math.floor((1 - newRemainingTime / durations.rest) * 100)
    const height = Math.floor((level / 100) * 23)
    const color = '#6AFF88'
    ctx.fillStyle = color
    ctx.fillRect(2, 25, 23, -height)
  } else {
    const level = Math.floor((newRemainingTime / durations.pomodoro) * 100)
    const height = Math.floor((level / 100) * 23)
    const color = '#b22222'
    ctx.fillStyle = color
    ctx.fillRect(2, 25 - height, 23, height)
  }

  // 남은 시간 텍스트 표시
  const minutes = Math.floor(newRemainingTime / 60)
  const seconds = newRemainingTime % 60
  const timeText = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
  ctx.font = 'bold 9px Arial'
  ctx.fillStyle = '#FFFFFF'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(timeText, canvas.width / 2, canvas.height / 2)

  ipc?.sendMessage('update_tray', canvas.toDataURL())
}
