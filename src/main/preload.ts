// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export type Channels = 'ipc-example';

const electronHandler = {
  ipcRenderer: {
    sendMessage(channel: Channels, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
  },
};

const dotEnvHandler = {
  NOTION_POST_DATABASE_ID: process.env.NOTION_POST_DATABASE_ID,
  NOTION_POMODORO_DATABASE_ID: process.env.NOTION_POMODORO_DATABASE_ID,
  NOTION_KEY: process.env.NOTION_KEY,
};

contextBridge.exposeInMainWorld('electron', electronHandler);
contextBridge.exposeInMainWorld('dot_env', dotEnvHandler);

export type ElectronHandler = typeof electronHandler;
export type DotEnvHandler = typeof dotEnvHandler;
