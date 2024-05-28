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
  canvas.width = 16
  canvas.height = 16

  const ctx = canvas?.getContext('2d')
  if (!ctx) return

  ctx.fillRect(0, 0, 16, 0)
  if (isRest) {
    const level = Math.floor((1 - newRemainingTime / durations.rest) * 100)
    const height = Math.floor((level / 100) * 14)
    ctx.fillStyle = '#41e418'
    ctx.fillRect(1, 15, 14, -height)
  } else {
    const level = Math.floor((newRemainingTime / durations.pomodoro) * 100)
    const height = Math.floor((level / 100) * 14)
    ctx.fillStyle = '#fa3508'
    ctx.fillRect(1, 15 - height, 14, height)
  }

  ipcRenderer?.sendMessage('update_tray', canvas.toDataURL())
}
