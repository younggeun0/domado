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
import { app, BrowserWindow, shell, ipcMain, Notification, Tray, nativeImage } from 'electron'
import { autoUpdater } from 'electron-updater'
import log from 'electron-log'
import { Client } from '@notionhq/client'
import Store from 'electron-store'
import dayjs from 'dayjs'
import MenuBuilder from './menu'
import { resolveHtmlPath } from './util'

let mainWindow: BrowserWindow | null = null
let tray: Tray

const isDebug = process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true'

let emoji = '🍅'
if (isDebug) {
  require('electron-debug')()
  emoji = '🪲'
}

const store = new Store()
ipcMain.on('electron-store-get', async (event, val) => {
  event.returnValue = store.get(val)
})
ipcMain.on('electron-store-set', async (_event, key, val) => {
  store.set(key, val)
})

// pomodoro
let notionClient: Client | null = null

function resetNotionKeys() {
  store.set('NOTION_API_KEY', null)
  store.set('NOTION_POMODORO_DATABASE_ID', null)
  notionClient = null
}

function getNotionPage(date: Date, databaseId: string) {
  if (!notionClient) return null

  return notionClient.databases.query({
    database_id: databaseId,
    filter: {
      created_time: {
        after: date.toISOString(),
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
}

function getDomadoPage(pages: any) {
  return pages.find(({ properties: { Name }, icon }: any) => {
    if (!Name.title[0]) return false

    return icon && icon.emoji === emoji && Name.title[0].text.content.startsWith('*')
  })
}

async function setInitialTodayCount(notionPomodoroDatabaseId: string | null = null) {
  const databaseId: string | null =
    notionPomodoroDatabaseId || (store.get('NOTION_POMODORO_DATABASE_ID') as string | null)
  if (!notionClient || !databaseId) return

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const res = await getNotionPage(today, databaseId)
  if (res && res.results.length > 0) {
    const page = getDomadoPage(res.results)

    if (page) {
      // 이미 등록된 오늘자 포모도로 페이지가 있으면 기존 페이지에 뽀모도로 횟수 count++
      const previousTitle = page.properties.Name.title[0].text.content
      const tokens = previousTitle.split(' ')
      store.set('TODAY_COUNT', parseInt(tokens[tokens.length - 1], 10))
      return
    }
  }

  store.set('TODAY_COUNT', 0)
}

async function setNotionClient(apikey: string | null = null, notionPomodoroDatabaseId: string | null = null) {
  const notionKey = apikey || (store.get('NOTION_API_KEY') as string)

  if (notionKey && notionPomodoroDatabaseId && notionKey.length > 0) {
    notionClient = notionKey ? new Client({ auth: notionKey }) : null

    if (notionClient) {
      const { properties } = await notionClient!.databases.retrieve({
        database_id: notionPomodoroDatabaseId as string,
      })

      // HACK, notion의 properties는 대소문자 구분하여 DB Properties 중 name이 소문자인경우 파스칼 케이스로 변경
      if (properties.name && !properties.Name) {
        try {
          await notionClient!.databases.update({
            properties: {
              name: {
                name: 'Name',
              },
            },
            database_id: notionPomodoroDatabaseId,
          })
        } catch (e) {
          console.error(e)
        }
      }
    }

    await setInitialTodayCount(notionPomodoroDatabaseId)
    return true
  }

  return false
}

ipcMain.on('set_notion_keys', async (event, notionKey, notionPomodoroDatabaseId) => {
  store.set('NOTION_API_KEY', notionKey)
  store.set('NOTION_POMODORO_DATABASE_ID', notionPomodoroDatabaseId)

  try {
    const res = await setNotionClient(notionKey, notionPomodoroDatabaseId)
    event.returnValue = res
  } catch (e) {
    console.error(e)
    resetNotionKeys()
    event.returnValue = false
  }
})

ipcMain.on('reset_notion_keys', async () => {
  resetNotionKeys()
})

ipcMain.on('rest_finished', async () => {
  new Notification({
    title: '휴식 종료!',
    body: '다시 힘내보자구! 화이팅! 💪',
  }).show()
})

ipcMain.on('get_pomodoro_logs', async (event) => {
  const databaseId: string | null = store.get('NOTION_POMODORO_DATABASE_ID') as string | null

  let result: any[] = []
  if (!notionClient || !databaseId) {
    console.log('뽀모도로 데이터를 가져올 수 없습니다.')
    event.returnValue = result
    return
  }

  try {
    const { results } = await notionClient.databases.query({
      database_id: databaseId as string,
      sorts: [
        {
          timestamp: 'created_time',
          direction: 'descending',
        },
      ],
    })

    if (results.length > 0) {
      result = results
        .filter(({ properties: { Name }, icon }: any) => {
          return icon && icon.emoji === emoji && Name.title[0].text.content.startsWith('*')
        })
        .map((page: any) => {
          const titleTokens = page.properties.Name.title[0].text.content.split(' ')
          const value = Number(titleTokens[titleTokens.length - 1])

          return {
            date: dayjs(page.created_time).format('YYYY-MM-DD'),
            value,
          }
        })
    }
  } catch (error) {
    console.error(error)
  }

  event.returnValue = result
})

ipcMain.on('log_task_memo', async (_event, { taskAndMemo, pomodoroTime }) => {
  if (taskAndMemo === '') return

  const databaseId: string | null = store.get('NOTION_POMODORO_DATABASE_ID') as string | null
  if (!notionClient || !databaseId) return

  const splited = taskAndMemo.split('\n')
  const task = splited[0]
  const memo = splited.slice(1).join('\n')

  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const res = await getNotionPage(today, databaseId)
    if (res && res.results.length > 0) {
      const page = getDomadoPage(res.results)

      if (page) {
        const blockId = page.id
        const { results } = await notionClient.blocks.children.list({
          block_id: blockId,
          page_size: 50,
        })

        const endTime = dayjs(pomodoroTime.end).format('HH:mm')
        const startTime = dayjs(pomodoroTime.start).format('HH:mm')

        await notionClient.blocks.children.append({
          block_id: blockId,
          after: results[0].id,
          children: [
            {
              heading_3: {
                rich_text: [
                  {
                    text: {
                      content: `${startTime}~${endTime} ${task} 🍅`,
                    },
                  },
                ],
              },
            },
            {
              paragraph: {
                rich_text: [
                  {
                    text: {
                      content: memo,
                    },
                  },
                ],
              },
            },
          ],
        })

        new Notification({
          title: '🍅 작업 기록 완료!',
          body: `${task} 메모를 기록했어요! 📝`,
        }).show()
      }
    }
  } catch (e: any) {
    console.error(e)
    new Notification({
      title: '오류 발생!',
      body: `노션에 뽀모도로를 등록하지 못했어요 😭, ${e.message}`,
    }).show()
  }
})

function getDefaultTrayIcon() {
  const iconPath = path.join(__dirname, '../..', 'assets', 'icon_22x22.png')
  return nativeImage.createFromPath(iconPath)
}

ipcMain.on('update_tray', async (_event, imageUrl) => {
  tray.setImage(imageUrl ? nativeImage.createFromDataURL(imageUrl) : getDefaultTrayIcon())
})

function createTrayIcon() {
  tray = new Tray(getDefaultTrayIcon())
  tray.on('click', () => {
    if (mainWindow) {
      mainWindow.show()
    }
  })
}

ipcMain.on('post_pomodoro', async (event, _message) => {
  // const msgTemplate = (pingPong: string) => `post_pomodoro test: ${pingPong}`;
  // TODO, 이어서 이벤트 체이닝이 가능
  // event.reply('end_post_pomodoro', msgTemplate('post_pomodoro pong'));
  tray.setImage(getDefaultTrayIcon())

  const databaseId: string | null = store.get('NOTION_POMODORO_DATABASE_ID') as string | null

  if (!notionClient || !databaseId) {
    new Notification({
      title: '🍅 뽀모도로 종료! 고생했어!',
      body: '조금만 쉬었다 해요 🥰',
    }).show()
    event.returnValue = true
    return
  }

  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const res = await getNotionPage(today, databaseId)
    if (res && res.results.length > 0) {
      const page = getDomadoPage(res.results)

      if (page) {
        // 이미 등록된 오늘자 포모도로 페이지가 있으면 기존 페이지에 뽀모도로 횟수 count++
        const previousTitle = (page as any).properties.Name.title[0].text.content
        const tokens = previousTitle.split(' ')
        const count = parseInt(tokens[tokens.length - 1], 10)
        const newCount = count + 1
        await notionClient.pages.update({
          page_id: page.id as string,
          properties: {
            Name: {
              title: [
                {
                  text: {
                    content: `* ${newCount}`,
                  },
                },
              ],
            },
          },
        })

        store.set('TODAY_COUNT', newCount)

        new Notification({
          title: '🍅 뽀모도로 종료! 고생했어!',
          body: `오늘 ${newCount}번째 뽀모도로를 완료했어요! 🥰`,
        }).show()
        event.returnValue = true
        return
      }
    }

    // 새로운 페이지가 없으면 새로 생성
    const createdPage = await notionClient.pages.create({
      parent: {
        type: 'database_id',
        database_id: databaseId,
      },
      icon: {
        type: 'emoji',
        // @ts-ignore
        emoji,
      },
      properties: {
        Name: {
          title: [
            {
              text: {
                content: `* 1`,
              },
            },
          ],
        },
      },
    })

    // add TOC
    await notionClient.blocks.children.append({
      block_id: createdPage.id,
      children: [
        {
          table_of_contents: {},
        },
      ],
    })

    store.set('TODAY_COUNT', 1)
    new Notification({
      title: '첫 🍅 뽀모도로 종료!',
      body: '오늘도 화이팅! 🥰',
    }).show()
  } catch (e: any) {
    console.error(e)
    new Notification({
      title: '오류 발생!',
      body: `노션에 뽀모도로를 등록하지 못했어요 😭, ${e.message}`,
    }).show()
  }
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

// function registerShortcuts() {
//   globalShortcut.register('Super+Y', () => mainWindow.toggle())
//   globalShortcut.register('Super+Shift+Y', () => mainWindow.start(20))
// }

const createWindow = async () => {
  if (isDebug) {
    await installExtensions()
  }

  try {
    await setNotionClient()
  } catch (e) {
    console.error(e)
    resetNotionKeys()
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets')

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths)
  }

  mainWindow = new BrowserWindow({
    show: false,
    width: 150,
    height: 250,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged ? path.join(__dirname, 'preload.js') : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  })

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
    createTrayIcon()
    // registerShortcuts()
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow()
    })
  })
  .catch(console.log)
