import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'

import { _electron as electron, type ElectronApplication, expect, type Page, test } from '@playwright/test'
import { PNG } from 'pngjs'

// 패키징된 앱(asar)을 띄워 3D 장면이 다시 그려지는 경우(작업↔휴식 전환, 휴식 중 창 열고 닫기,
// 설정 변경으로 휴식 종료, 위젯 크기 변경, WebGL 컨텍스트 복구)마다 실제 렌더 결과와 창 상태를 확인한다

const EXECUTABLE = path.join(
  __dirname,
  '..',
  'release/build',
  process.arch === 'arm64' ? 'mac-arm64' : 'mac',
  'domado.app/Contents/MacOS/domado',
)

type WindowState = {
  url: string
  visible: boolean
  fullScreen: boolean
  bounds: { width: number; height: number }
}

let app: ElectronApplication
let widget: Page
let userData: string
const errors: string[] = []

function watchErrors(page: Page) {
  page.on('pageerror', error => errors.push(`[pageerror] ${error.message}`))
  page.on('console', message => {
    if (message.type() === 'error') errors.push(`[console] ${message.text()}`)
  })
}

test.beforeEach(async () => {
  errors.length = 0
  userData = mkdtempSync(path.join(tmpdir(), 'domado-e2e-'))
  app = await electron.launch({
    executablePath: EXECUTABLE,
    // 실제 기록을 건드리지 않는 임시 프로필, 3초 타이머
    env: { ...process.env, DOMADO_USER_DATA: userData, DOMADO_FAST_TIMER: '1' },
  })
  app.on('window', watchErrors)
  widget = await app.firstWindow()
  watchErrors(widget)
  await expect(widget.getByLabel('남은 시간')).toBeVisible()
})

test.afterEach(async () => {
  await app.close()
  rmSync(userData, { recursive: true, force: true })
  expect(errors).toEqual([])
})

async function windowStates(): Promise<WindowState[]> {
  return app.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows().map(window => ({
      url: window.webContents.getURL().split('/').pop() ?? '',
      visible: window.isVisible(),
      fullScreen: process.platform === 'darwin' ? window.isSimpleFullScreen() : window.isFullScreen(),
      bounds: window.getBounds(),
    })),
  )
}

async function widgetState() {
  const state = (await windowStates()).find(window => window.url.endsWith('index.html'))
  if (!state) throw new Error('widget window not found')
  return state
}

// 화면 가운데 영역에서 조건에 맞는 픽셀 수를 센다 (WebGL 결과를 실제 캡처로 확인)
async function countPixels(
  region: { x: [number, number]; y: [number, number] },
  match: (r: number, g: number, b: number) => boolean,
) {
  const png = PNG.sync.read(await widget.screenshot())
  let count = 0
  for (let y = Math.floor(png.height * region.y[0]); y < png.height * region.y[1]; y++) {
    for (let x = Math.floor(png.width * region.x[0]); x < png.width * region.x[1]; x++) {
      const i = (y * png.width + x) * 4
      if (match(png.data[i], png.data[i + 1], png.data[i + 2])) count++
    }
  }
  return count
}

// 토마토 꼭지의 초록 픽셀. 위젯 불투명도(80%) 때문에 붉은 배경이 섞여 올리브색에 가깝다 — 배경(빨강)은 g < r라 걸리지 않는다
const expectTomatoRendered = () =>
  expect
    .poll(() => countPixels({ x: [0.2, 0.8], y: [0.25, 0.75] }, (r, g, b) => g >= r && g > b + 20), {
      timeout: 15_000,
    })
    .toBeGreaterThan(100)

// 커피잔의 흰 픽셀 (타이머 숫자가 있는 위쪽은 제외)
const expectCupRendered = () =>
  expect
    .poll(
      () =>
        countPixels(
          { x: [0.35, 0.65], y: [0.5, 0.7] },
          (r, g, b) => r > 170 && g > 170 && b > 170 && Math.abs(r - b) < 40,
        ),
      { timeout: 15_000 },
    )
    .toBeGreaterThan(500)

async function finishPomodoro() {
  await widget.keyboard.press('Space')
  await expect(widget).toHaveTitle(/☕/, { timeout: 10_000 })
}

test('작업 화면에 토마토가 렌더된다', async () => {
  await expectTomatoRendered()
  expect(await widgetState()).toMatchObject({ visible: true, fullScreen: false, bounds: { width: 100, height: 200 } })
})

test('뽀모도로가 끝나면 전체화면 휴식 화면에 커피잔이 렌더된다', async () => {
  await finishPomodoro()

  await expect.poll(async () => (await widgetState()).fullScreen).toBe(true)
  await expectCupRendered()
  // 휴식 화면은 위젯 불투명도와 상관없이 불투명하다
  await expect(widget.locator('main')).toHaveCSS('opacity', '1')
})

for (const [button, hash] of [
  ['설정', '#settings'],
  ['오늘의 기록', '#history'],
] as const) {
  test(`휴식 중 ${button} 창을 열고 닫아도 휴식 화면이 유지된다`, async () => {
    await finishPomodoro()
    await expectCupRendered()

    const panelPromise = app.waitForEvent('window')
    await widget.getByTitle(button).click()
    const panel = await panelPromise
    await panel.waitForLoadState()

    // 패널은 휴식 화면 위에 작은 창으로 떠야 한다 (전체화면으로 다른 Space에 뜨면 닫은 뒤 휴식 화면이 사라졌다)
    await expect
      .poll(async () => (await windowStates()).find(window => window.url.endsWith(hash)))
      .toMatchObject({ visible: true, fullScreen: false })
    const panelState = (await windowStates()).find(window => window.url.endsWith(hash))!
    expect(panelState.bounds.width).toBeLessThan(600)

    await panel.close()

    await expect.poll(async () => (await windowStates()).length).toBe(1)
    expect(await widgetState()).toMatchObject({ visible: true, fullScreen: true })
    await expectCupRendered()
    await expect(widget).toHaveTitle(/☕/)
  })
}

test('휴식 중 설정에서 시간을 바꾸면 전체화면이 풀리고 토마토로 돌아온다', async () => {
  await finishPomodoro()

  const panelPromise = app.waitForEvent('window')
  await widget.getByTitle('설정').click()
  const panel = await panelPromise
  await panel.getByLabel('뽀모도로 시간 (분)').fill('30')
  await panel.getByRole('button', { name: '저장' }).click()

  await expect(widget).toHaveTitle(/🔥/)
  await expect.poll(async () => (await widgetState()).fullScreen).toBe(false)
  await expectTomatoRendered()
})

test('휴식이 끝나면 위젯 크기로 돌아와 토마토가 렌더된다', async () => {
  await finishPomodoro()
  await expectCupRendered()

  await widget.keyboard.press('Space')
  await expect(widget).toHaveTitle(/🔥/, { timeout: 10_000 })

  await expect.poll(async () => (await widgetState()).fullScreen).toBe(false)
  await expect.poll(async () => (await widgetState()).bounds).toMatchObject({ width: 100, height: 200 })
  await expectTomatoRendered()
})

test('위젯 크기를 바꿔도 3D가 다시 렌더되고 최소 크기는 지켜진다', async () => {
  await widget.evaluate(() => window.electron?.ipcRenderer.sendMessage('resize_widget', 300, 420))
  await expect.poll(async () => (await widgetState()).bounds).toMatchObject({ width: 300, height: 420 })
  await expectTomatoRendered()

  await widget.evaluate(() => window.electron?.ipcRenderer.sendMessage('resize_widget', 10, 10))
  await expect.poll(async () => (await widgetState()).bounds).toMatchObject({ width: 100, height: 200 })
  await expectTomatoRendered()
})

test('WebGL 컨텍스트가 끊겼다 복구되면 장면을 다시 그린다', async () => {
  await expectTomatoRendered()

  // 복구되면 앱이 페이지를 다시 불러온다
  const reloaded = widget.waitForEvent('load')
  await widget.evaluate(async () => {
    const lose = document.querySelector('canvas')!.getContext('webgl2')!.getExtension('WEBGL_lose_context')!
    lose.loseContext()
    await new Promise(resolve => setTimeout(resolve, 300))
    lose.restoreContext()
  })
  await reloaded

  await expectTomatoRendered()
})
