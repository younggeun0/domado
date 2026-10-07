import path from 'path'
import { app, BrowserWindow, shell, ipcMain, Notification, Tray, nativeImage, globalShortcut, Menu } from 'electron'
import { autoUpdater } from 'electron-updater'
import log from 'electron-log/main'
import MenuBuilder from './menu'

let mainWindow: BrowserWindow | null = null
let tray: Tray

ipcMain.on('set_fullscreen', (_event, value: boolean) => {
  mainWindow?.setFullScreen(value)
})

// 문구는 renderer가 현재 언어로 보낸다
ipcMain.on('notify', (_event, { title, body }: { title: string; body: string }) => {
  new Notification({ title, body }).show()
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

function registerShortcuts() {
  globalShortcut.register('Super+Shift+D', () => {
    mainWindow?.show()
    mainWindow?.webContents.send('start_pomodoro')
  })
}

// 개발 서버(electron-vite dev)면 URL, 패키징 후에는 빌드된 html 파일을 연다. 해시로 보여줄 페이지를 고른다
function loadRenderer(window: BrowserWindow, hash = '') {
  if (process.env.ELECTRON_RENDERER_URL) {
    window.loadURL(`${process.env.ELECTRON_RENDERER_URL}#${hash}`)
  } else {
    window.loadFile(path.join(__dirname, '../renderer/index.html'), { hash })
  }
}

const openExternal = ({ url }: { url: string }) => {
  if (/^https?:\/\//.test(url)) shell.openExternal(url)
  return { action: 'deny' as const }
}

// 작은 위젯 창 크기에 묶이지 않도록 설정·기록은 별도 창으로 연다 (종류별로 하나만)
const PANEL_SIZES = {
  settings: { width: 384, height: 460 },
  history: { width: 420, height: 370 },
}
type PanelName = keyof typeof PANEL_SIZES
const panels: Partial<Record<PanelName, BrowserWindow>> = {}

ipcMain.on('open_window', (_event, name: PanelName) => {
  if (!Object.hasOwn(PANEL_SIZES, name)) return

  const existing = panels[name]
  if (existing) {
    existing.focus()
    return
  }

  const panel = new BrowserWindow({
    ...PANEL_SIZES[name],
    // 위젯이 항상 위에 떠 있어 부모로 묶어야 위젯 뒤로 가려지지 않는다
    parent: mainWindow ?? undefined,
    show: false,
    backgroundColor: '#171717',
    autoHideMenuBar: true,
  })
  panels[name] = panel
  panel.on('closed', () => delete panels[name])
  panel.once('ready-to-show', () => panel.show())
  panel.webContents.setWindowOpenHandler(openExternal)
  loadRenderer(panel, name)
})

const createWindow = async () => {
  mainWindow = new BrowserWindow({
    show: false,
    width: 100,
    height: 200,
    transparent: true,
    frame: false,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
    },
  })

  mainWindow.setAlwaysOnTop(true)
  loadRenderer(mainWindow)
  mainWindow.webContents.setBackgroundThrottling(false)

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  const menuBuilder = new MenuBuilder(mainWindow)
  menuBuilder.buildMenu()

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler(openExternal)

  if (app.isPackaged) {
    log.transports.file.level = 'info'
    autoUpdater.logger = log
    // publish 설정이 없으면 app-update.yml이 없어 실패하므로 로그만 남긴다
    autoUpdater.checkForUpdatesAndNotify().catch(log.error)
  }
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
