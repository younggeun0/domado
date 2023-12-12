// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

// TODO, 필요한 이벤트 추가예정
export type Channels =
  | 'ipc-example'
  | 'post_pomodoro'
  | 'rest_finished'
  | 'set_notion_keys'
  | 'warn_unset_notion_keys'

const electronHandler = {
  ipcRenderer: {
    sendMessage(channel: Channels, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args)
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args)
      ipcRenderer.on(channel, subscription)

      return () => {
        ipcRenderer.removeListener(channel, subscription)
      }
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args))
    },
  },
  isDebug: process.env.NODE_ENV === 'development',
  NOTION_KEY: process.env.NOTION_KEY,
  NOTION_POMODORO_DATABASE_ID: process.env.NOTION_POMODORO_DATABASE_ID,
}

contextBridge.exposeInMainWorld('electron', electronHandler)

export type ElectronHandler = typeof electronHandler
