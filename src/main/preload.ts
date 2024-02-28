// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

export type Channels =
  | 'post_pomodoro'
  | 'rest_finished'
  | 'set_notion_keys'
  | 'reset_notion_keys'
  | 'electron-store-get'
  | 'electron-store-set'
  | 'get_pomodoro_logs'

const electronHandler = {
  ipcRenderer: {
    sendMessage(channel: Channels, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args)
    },
    sendSync(channel: Channels, ...args: unknown[]) {
      return ipcRenderer.sendSync(channel, ...args)
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) => func(...args)
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
  store: {
    get(key: string) {
      return ipcRenderer.sendSync('electron-store-get', key)
    },
    set(property: string, val: any) {
      ipcRenderer.send('electron-store-set', property, val)
    },
  },
}

contextBridge.exposeInMainWorld('electron', electronHandler)

export type ElectronHandler = typeof electronHandler
