import { $, browser, expect } from '@wdio/globals'
import { execSync } from 'child_process'
import { mkdtempSync, readFileSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'

import { PNG } from 'pngjs'

// 3D 장면이 다시 그려지는 경우(작업↔휴식 전환, 휴식 중 창 열고 닫기, 설정 변경으로 휴식 종료,
// 위젯 크기 변경, WebGL 컨텍스트 복구)마다 실제 렌더 결과와 창 상태를 확인한다.
// 창 상태는 e2e feature 빌드에만 있는 e2e_window_states 커맨드로 읽는다

type WindowState = { label: string; visible: boolean; fullScreen: boolean; width: number; height: number }

const invoke = <T>(command: string, args?: Record<string, unknown>) =>
  browser.execute((c, a) => (window as any).__TAURI_INTERNALS__.invoke(c, a), command, args) as Promise<T>

const windowStates = () => invoke<WindowState[]>('e2e_window_states')
const widgetState = async () => (await windowStates()).find(window => window.label === 'main')!

// 웹뷰 스냅샷(takeScreenshot)은 OS 합성 결과가 아니라서 창이 검게 합성되는 문제를 못 본다.
// 휴식 화면은 screencapture로 실제 화면을 찍는다 (전체화면이라 위젯이 있는 모니터 전체)
async function osScreenshot() {
  const { x, y, width, height } = await invoke<{ x: number; y: number; width: number; height: number }>('e2e_main_bounds')
  const dir = mkdtempSync(path.join(tmpdir(), 'domado-shot-'))
  const file = path.join(dir, 'shot.png')
  execSync(`screencapture -x -R ${x},${y},${width},${height} ${file}`)
  const png = readFileSync(file)
  rmSync(dir, { recursive: true, force: true })
  return png
}

async function countPixels(
  region: { x: [number, number]; y: [number, number] },
  match: (r: number, g: number, b: number) => boolean,
  source: 'webview' | 'os' = 'webview',
) {
  const png = PNG.sync.read(source === 'os' ? await osScreenshot() : Buffer.from(await browser.takeScreenshot(), 'base64'))
  let count = 0
  for (let y = Math.floor(png.height * region.y[0]); y < png.height * region.y[1]; y++) {
    for (let x = Math.floor(png.width * region.x[0]); x < png.width * region.x[1]; x++) {
      const i = (y * png.width + x) * 4
      if (match(png.data[i], png.data[i + 1], png.data[i + 2])) count++
    }
  }
  return count
}

const poll = (fn: () => Promise<boolean>, message: string) => browser.waitUntil(fn, { timeout: 15_000, interval: 300, timeoutMsg: message })

// 위젯 스크린샷은 창 크기(배율 1)라 픽셀이 적다: 기준을 넓이에 맞춰 둔다
const expectTomatoRendered = () =>
  poll(async () => (await countPixels({ x: [0.2, 0.8], y: [0.25, 0.75] }, (r, g, b) => g >= r && g > b + 20)) > 20, 'tomato not rendered')
const expectCupRendered = (source: 'webview' | 'os' = 'webview') =>
  poll(
    async () =>
      (await countPixels({ x: [0.35, 0.65], y: [0.5, 0.7] }, (r, g, b) => r > 170 && g > 170 && b > 170 && Math.abs(r - b) < 40, source)) > 500,
    `cup not rendered (${source})`,
  )

async function finishPomodoro() {
  await browser.keys(' ')
  await poll(async () => (await browser.getTitle()).includes('☕'), 'rest did not start')
}

async function openPanel(title: string, label: string) {
  await $(`[title="${title}"]`).click()
  await poll(async () => (await browser.getWindowHandles()).includes(label), `${label} not opened`)
}

// 패널로 전환하고 페이지(브리지 포함)가 뜰 때까지 기다린다
async function switchToPanel(label: string) {
  await browser.switchToWindow(label)
  await poll(async () => (await browser.execute(() => !!window.domado && !!document.querySelector('h1, h2, form, label'))) === true, `${label} page not loaded`)
}

const timerText = () => $('[aria-label="남은 시간"]').getText()

beforeEach(async () => {
  // 앱을 세션마다 새로 띄우지 않으므로 처음 상태로 되돌린다
  await browser.switchToWindow('main')
  await browser.execute(() => {
    localStorage.clear()
    location.reload()
  })
  await invoke('set_fullscreen', { value: false })
  await invoke('resize_widget', { width: 100, height: 200 })
  await expect($('[aria-label="남은 시간"]')).toBeDisplayed()
  await poll(async () => (await timerText()) === '00:03', 'timer not reset')
})

it('작업 화면에 토마토가 렌더된다', async () => {
  await expectTomatoRendered()
  expect(await widgetState()).toMatchObject({ visible: true, fullScreen: false, width: 100, height: 200 })
})

it('뽀모도로가 끝나면 전체화면 휴식 화면에 커피잔이 렌더된다', async () => {
  await finishPomodoro()
  await poll(async () => (await widgetState()).fullScreen, 'not fullscreen')
  await poll(async () => (await widgetState()).width > 600, 'window not enlarged')
  await expectCupRendered()
  expect(await $('main').getCSSProperty('opacity')).toMatchObject({ value: 1 })
})

for (const [button, label] of [
  ['설정', 'settings'],
  ['오늘의 기록', 'history'],
] as const) {
  it(`휴식 중 ${button} 창을 열고 닫아도 휴식 화면이 유지된다`, async () => {
    await finishPomodoro()
    await expectCupRendered()

    await openPanel(button, label)
    const panel = (await windowStates()).find(window => window.label === label)!
    expect(panel).toMatchObject({ visible: true, fullScreen: false })
    expect(panel.width).toBeLessThan(600)

    await switchToPanel(label)
    if (process.env.SHOT_DIR) await browser.saveScreenshot(`${process.env.SHOT_DIR}/panel-${label}.png`)
    // 창이 execute 응답 전에 닫히면 드라이버가 no such window를 낸다: 응답 뒤로 미룬다
    await browser.execute(() => void setTimeout(() => window.close(), 100))
    await browser.switchToWindow('main')
    await poll(async () => (await windowStates()).length === 1, `${label} not closed`)

    expect(await widgetState()).toMatchObject({ visible: true, fullScreen: true })
    await expectCupRendered()
    // 이전 버전의 검은 화면은 웹뷰는 멀쩡하고 OS 합성만 검었다
    await expectCupRendered('os')
    expect(await browser.getTitle()).toContain('☕')
  })
}

it('휴식 중 설정에서 시간을 바꾸면 전체화면이 풀리고 토마토로 돌아온다 (창 사이 storage 이벤트)', async () => {
  await finishPomodoro()
  await openPanel('설정', 'settings')

  await switchToPanel('settings')
  const input = $('aria/뽀모도로 시간 (분)')
  await input.setValue('30')
  await $('aria/저장').click()
  await browser.switchToWindow('main')

  await poll(async () => (await browser.getTitle()).includes('🔥'), 'rest did not end')
  await poll(async () => !(await widgetState()).fullScreen, 'still fullscreen')
  await poll(async () => (await windowStates()).length === 1, 'settings not closed by save')
  await expectTomatoRendered()
})

it('휴식이 끝나면 위젯 크기로 돌아와 토마토가 렌더된다', async () => {
  await finishPomodoro()
  await expectCupRendered()

  await browser.keys(' ')
  await poll(async () => (await browser.getTitle()).includes('🔥'), 'rest did not end')
  await poll(async () => !(await widgetState()).fullScreen, 'still fullscreen')
  await poll(async () => (await widgetState()).width === 100 && (await widgetState()).height === 200, 'size not restored')
  await expectTomatoRendered()
})

it('위젯 크기를 바꿔도 3D가 다시 렌더되고 최소 크기는 지켜진다', async () => {
  await browser.execute(() => window.domado?.ipc.sendMessage('resize_widget', 300, 420))
  await poll(async () => (await widgetState()).width === 300 && (await widgetState()).height === 420, 'not resized')
  await expectTomatoRendered()

  await browser.execute(() => window.domado?.ipc.sendMessage('resize_widget', 10, 10))
  await poll(async () => (await widgetState()).width === 100 && (await widgetState()).height === 200, 'min size not kept')
  await expectTomatoRendered()
})

it('WebGL 컨텍스트가 끊겼다 복구되면 장면을 다시 그린다', async () => {
  await expectTomatoRendered()
  await browser.execute(() => ((window as any).__reloadMarker = true))

  // 새로고침이 실행 중인 스크립트 호출을 끊으므로 손실·복구를 예약만 하고 바로 돌아온다
  await browser.execute(() => {
    const lose = document.querySelector('canvas')!.getContext('webgl2')!.getExtension('WEBGL_lose_context')!
    lose.loseContext()
    setTimeout(() => lose.restoreContext(), 300)
  })
  // 복구되면 앱이 페이지를 다시 불러온다
  await poll(async () => (await browser.execute(() => (window as any).__reloadMarker).catch(() => true)) !== true, 'not reloaded')
  await expectTomatoRendered()
})
