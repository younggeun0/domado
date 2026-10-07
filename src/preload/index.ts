import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

export type Channels = 'start_pomodoro' | 'set_fullscreen' | 'notify' | 'update_tray' | 'open_window' | 'resize_widget'

const electronHandler = {
  ipcRenderer: {
    sendMessage(channel: Channels, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args)
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) => func(...args)
      ipcRenderer.on(channel, subscription)

      return () => {
        ipcRenderer.removeListener(channel, subscription)
      }
    },
  },
  // 개발 모드와 E2E 테스트(DOMADO_FAST_TIMER=1)는 타이머를 3초씩만 돌린다
  isDebug: import.meta.env.DEV || process.env.DOMADO_FAST_TIMER === '1',
}

contextBridge.exposeInMainWorld('electron', electronHandler)

export type ElectronHandler = typeof electronHandler
