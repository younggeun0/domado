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
import { app, BrowserWindow, shell, ipcMain, Notification } from 'electron'
import { autoUpdater } from 'electron-updater'
import log from 'electron-log'
import { Client } from '@notionhq/client'
import Store from 'electron-store'
import MenuBuilder from './menu'
import { resolveHtmlPath } from './util'

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true'

if (isDebug) {
  require('electron-debug')()
}

const store = new Store()
ipcMain.on('electron-store-get', async (event, val) => {
  event.returnValue = store.get(val)
})
ipcMain.on('electron-store-set', async (event, key, val) => {
  store.set(key, val)
})

// pomodoro
let notionClient: Client | null = null

function setNotionClient() {
  const notionKey = store.get('NOTION_KEY') as string
  if (notionKey)
    notionClient = notionKey ? new Client({ auth: notionKey }) : null
}

ipcMain.on('reset_notion_keys', async () => {
  store.set('NOTION_KEY', null)
  store.set('NOTION_POMODORO_DATABASE_ID', null)
  notionClient = null
})

ipcMain.on('rest_finished', async () => {
  new Notification({
    title: '휴식 종료!',
    body: '다시 힘내보자구! 화이팅! 💪',
  }).show()
})

ipcMain.on('post_pomodoro', async (event) => {
  // const msgTemplate = (pingPong: string) => `post_pomodoro test: ${pingPong}`;
  // console.log(msgTemplate(_arg));
  // TODO, 이어서 이벤트 체이닝이 가능
  // event.reply('end_post_pomodoro', msgTemplate('post_pomodoro pong'));
  setNotionClient()
  const databaseId: string | null = store.get('NOTION_POMODORO_DATABASE_ID') as
    | string
    | null

  if (!notionClient || !databaseId) {
    new Notification({
      title: '🍅 뽀모도로 종료! 고생했어!',
      body: '조금만 쉬었다 해요 🥰',
    }).show()
    return
  }

  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // HACK, notion의 properties는 대소문자 구분하여 체크 후 사용
    let name = 'name'
    const { properties } = await notionClient.databases.retrieve({
      database_id: databaseId,
    })
    if (!properties.name) {
      name = 'Name'
    }

    const res = await notionClient.databases.query({
      database_id: databaseId,
      filter: {
        created_time: {
          after: today.toISOString(),
        },
        timestamp: 'created_time',
      },
      sorts: [
        {
          timestamp: 'created_time',
          direction: 'ascending',
        },
      ],
    })

    const emoji = isDebug ? '🪲' : '🍅'

    if (res.results.length > 0) {
      const page = res.results.find((result: any) => {
        if (!result.properties[name].title[0]) return false

        return result.properties[name].title[0].text.content.startsWith(emoji)
      })

      if (page) {
        // 이미 등록된 오늘자 포모도로 페이지가 있으면 기존 페이지에 뽀모도로 횟수 count++
        const previousTitle = (page as any).properties[name].title[0].text
          .content
        const tokens = previousTitle.split(' ')
        const count = parseInt(tokens[tokens.length - 1], 10) + 1
        await notionClient.pages.update({
          page_id: page.id as string,
          properties: {
            [name]: {
              title: [
                {
                  text: {
                    content: `${emoji} * ${count}`,
                  },
                },
              ],
            },
          },
        })

        new Notification({
          title: '🍅 뽀모도로 종료! 고생했어!',
          body: `오늘 ${count}번째 뽀모도로를 완료했어요! 🥰`,
        }).show()
        return
      }
    }

    // 새로운 페이지가 없으면 새로 생성
    await notionClient.pages.create({
      parent: {
        type: 'database_id',
        database_id: databaseId,
      },
      properties: {
        [name]: {
          title: [
            {
              text: {
                content: `${emoji} * 1`,
              },
            },
          ],
        },
      },
    })
    new Notification({
      title: '첫 🍅 뽀모도로 종료!',
      body: '오늘도 화이팅! 🥰',
    }).show()
  } catch (e) {
    console.error(e)
    new Notification({
      title: '오류 발생!',
      body: `노션에 뽀모도로를 등록하지 못했어요 😭, ${e.message}`,
    }).show()
  }
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

let mainWindow: BrowserWindow | null = null
const createWindow = async () => {
  if (isDebug) {
    await installExtensions()
  }

  setNotionClient()

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets')

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths)
  }

  mainWindow = new BrowserWindow({
    show: false,
    width: isDebug ? 1000 : 300,
    height: isDebug ? 600 : 450,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  })

  mainWindow.loadURL(resolveHtmlPath('index.html'))

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

app
  .whenReady()
  .then(() => {
    createWindow()
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow()
    })
  })
  .catch(console.log)
