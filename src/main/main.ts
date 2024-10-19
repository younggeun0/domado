/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path'
import { app, BrowserWindow, shell, ipcMain, Notification, Tray, nativeImage, globalShortcut, Menu } from 'electron'
import { autoUpdater } from 'electron-updater'
import log from 'electron-log'
import MenuBuilder from './menu'
import { resolveHtmlPath } from './util'

let mainWindow: BrowserWindow | null = null
let tray: Tray

const isDebug = process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true'
if (isDebug) {
  require('electron-debug')()
}

ipcMain.on('rest_finished', async () => {
  mainWindow?.setFullScreen(false)
  new Notification({
    title: '휴식 종료!',
    body: '다시 힘내보자구! 화이팅! 💪',
  }).show()
})

const RESOURCES_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'assets')
  : path.join(__dirname, '../../assets')

const getAssetPath = (...paths: string[]): string => {
  return path.join(RESOURCES_PATH, ...paths)
}

function getDefaultTrayIcon() {
  const iconPath = getAssetPath('icon_22x22.png')
  return nativeImage.createFromPath(iconPath)
}

ipcMain.on('update_tray', async (_event, imageUrl) => {
  tray.setImage(imageUrl ? nativeImage.createFromDataURL(imageUrl) : getDefaultTrayIcon())
})

ipcMain.on('pomodoro_finished', async (event) => {
  tray.setImage(getDefaultTrayIcon())
  mainWindow?.setFullScreen(true)

  new Notification({
    title: '🍅 뽀모도로 종료! 고생했어!',
    body: '조금만 쉬었다 해요 🥰',
  }).show()
  event.returnValue = true
})

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info'
    autoUpdater.logger = log
    autoUpdater.checkForUpdatesAndNotify()
  }
}

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support')
  sourceMapSupport.install()
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer')
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS
  const extensions = ['REACT_DEVELOPER_TOOLS']

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log)
}

function registerShortcuts() {
  globalShortcut.register('Super+Shift+D', () => {
    mainWindow?.show()
    mainWindow?.webContents.send('start_pomodoro')
  })
}

const createWindow = async () => {
  if (isDebug) {
    await installExtensions()
  }

  mainWindow = new BrowserWindow({
    show: false,
    width: 100,
    height: 200,
    transparent: true,
    frame: false,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged ? path.join(__dirname, 'preload.js') : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  })

  mainWindow.setAlwaysOnTop(true)
  mainWindow.loadURL(resolveHtmlPath('index.html'))
  mainWindow.webContents.setBackgroundThrottling(false)

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined')
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize()
    } else {
      mainWindow.show()
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  const menuBuilder = new MenuBuilder(mainWindow)
  menuBuilder.buildMenu()

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url)
    return { action: 'deny' }
  })

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
}

function showWindow() {
  if (mainWindow) {
    mainWindow.show()
    return
  }
  createWindow()
}

function createTray() {
  tray = new Tray(getDefaultTrayIcon())
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Reload', type: 'normal', click: () => mainWindow?.reload() },
    {
      label: 'Stick on top',
      type: 'checkbox',
      checked: mainWindow?.isAlwaysOnTop(),
      click: () => mainWindow?.setAlwaysOnTop(!mainWindow?.isAlwaysOnTop()),
    },
    {
      label: 'Quit',
      click: () => {
        app.quit()
      },
    },
  ])
  tray.setContextMenu(contextMenu)
  tray.on('click', showWindow)
}

/**
 * Add event listeners...
 */
app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

// On macOS it's common to re-create a window in the app when the
// dock icon is clicked and there are no other windows open.
app.on('activate', showWindow)

app
  .whenReady()
  .then(createWindow)
  .then(() => {
    createTray()
    registerShortcuts()
  })
  .catch(console.log)
