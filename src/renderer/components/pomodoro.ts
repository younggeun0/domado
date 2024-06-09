export const getTimeInfo = (isDebug: boolean) => {
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
  canvas.width = 32
  canvas.height = 32

  const ctx = canvas?.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.fillRect(0, 0, 32, 0)
  if (isRest) {
    const level = Math.floor((1 - newRemainingTime / durations.rest) * 100)
    const height = Math.floor((level / 100) * 28)
    const gradient = ctx.createLinearGradient(3, 29, 3, 29 - height)
    gradient.addColorStop(0, '#41e418')
    gradient.addColorStop(1, '#41e418')
    ctx.fillStyle = gradient
    ctx.fillRect(3, 29, 26, -height)
  } else {
    const level = Math.floor((newRemainingTime / durations.pomodoro) * 100)
    const height = Math.floor((level / 100) * 28)
    const gradient = ctx.createLinearGradient(3, 29, 3, 29 - height)
    gradient.addColorStop(0, '#f7e018')
    gradient.addColorStop(1, '#fa3508')
    ctx.fillStyle = gradient
    ctx.fillRect(3, 29 - height, 26, height)
  }

  // 남은 시간 텍스트 표시
  const minutes = Math.floor(newRemainingTime / 60)
  const seconds = newRemainingTime % 60
  const timeText = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
  ctx.font = 'bold 10px Arial'
  ctx.fillStyle = '#FFFFFF'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(timeText, canvas.width / 2, canvas.height / 2)

  ipcRenderer?.sendMessage('update_tray', canvas.toDataURL())
}
