export const getTimeInfo = (isDebug: boolean = false) => {
  return isDebug
    ? {
        POMODORO_SEC: 3,
        REST_SEC: 3,
        ADD_MIN: 5000,
      }
    : {
        POMODORO_SEC: 25 * 60,
        REST_SEC: 5 * 60,
        ADD_MIN: 5 * 60,
      }
}

export function formatRemainingTime(time: number) {
  const minutes = Math.floor(time / 60)
  const seconds = time % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function updateTray(
  ipcRenderer: any,
  newRemainingTime: number,
  isRest: boolean,
  durations: { pomodoro: number; rest: number },
) {
  if (newRemainingTime <= 0) {
    ipcRenderer?.sendMessage('update_tray', null)
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
    const color = '#217a0b'
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

  ipcRenderer?.sendMessage('update_tray', canvas.toDataURL())
}
