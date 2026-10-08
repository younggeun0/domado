import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'

import Pomodoro from '../pages/Pomodoro'

// 3D 장면이 다시 그려지는 전환(작업↔휴식, 휴식 스킵, 휴식 중 설정 변경 등)마다
// 장면에 넘기는 상태·재마운트 횟수·전체화면 요청·휴식 화면 불투명도를 확인한다.
// 실제 WebGL 렌더링과 창 상태는 패키징 앱 E2E(e2e/app.spec.ts)에서 확인한다
const sceneMounts = vi.hoisted(() => ({ count: 0 }))

vi.mock('../components/scene/Domado3DScene', async () => {
  const { useEffect } = await vi.importActual<typeof import('react')>('react')
  return {
    default: function SceneStub({ isRest, paused }: { isRest: boolean; paused: boolean }) {
      useEffect(() => {
        sceneMounts.count++
      }, [])
      return <div data-testid="scene" data-rest={String(isRest)} data-paused={String(paused)} />
    },
  }
})

const sendMessage = () => window.domado!.ipc.sendMessage as ReturnType<typeof vi.fn>
const fullScreenRequests = () => sendMessage().mock.calls.filter(([channel]) => channel === 'set_fullscreen').map(([, value]) => value)
const scene = () => screen.getByTestId('scene')

async function advance(seconds: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(seconds * 1000)
  })
}

// 1분 뽀모도로를 끝내 휴식 화면으로 넘긴다
async function finishPomodoro() {
  fireEvent.keyDown(document, { key: ' ' })
  await advance(61)
}

beforeEach(() => {
  vi.useFakeTimers()
  localStorage.clear()
  localStorage.setItem('domado_pomodoro_minutes', '1')
  localStorage.setItem('domado_rest_minutes', '1')
  localStorage.setItem('domado_widget_opacity', '50')
  sceneMounts.count = 0
  vi.clearAllMocks()
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

it('뽀모도로가 끝나면 휴식 장면으로 바뀌고 전체화면을 요청하며, 휴식 화면은 불투명하다', async () => {
  const { container } = render(<Pomodoro />)
  expect(scene()).toHaveAttribute('data-rest', 'false')
  expect(container.querySelector('main')).toHaveStyle({ opacity: '0.5' })

  await finishPomodoro()

  expect(scene()).toHaveAttribute('data-rest', 'true')
  expect(scene()).toHaveAttribute('data-paused', 'true')
  expect(fullScreenRequests().at(-1)).toBe(true)
  expect(container.querySelector('main')).toHaveStyle({ opacity: '1' })
  // 작업 → 휴식은 다른 모델이라 장면을 새로 마운트한다(에러 바운더리도 다시 시도)
  expect(sceneMounts.count).toBe(2)
})

it('휴식이 끝나면 작업 장면으로 돌아오고 전체화면을 푼다', async () => {
  render(<Pomodoro />)
  await finishPomodoro()

  fireEvent.keyDown(document, { key: ' ' })
  expect(scene()).toHaveAttribute('data-paused', 'false')
  await advance(61)

  expect(scene()).toHaveAttribute('data-rest', 'false')
  expect(fullScreenRequests().at(-1)).toBe(false)
  expect(screen.getByText('🍅 : 1')).toBeInTheDocument()
})

it('휴식을 건너뛰면 작업 장면으로 돌아오고 전체화면을 푼다', async () => {
  render(<Pomodoro />)
  await finishPomodoro()

  fireEvent.keyDown(document, { key: 's' })
  fireEvent.click(screen.getByRole('button', { name: '확인' }))

  expect(scene()).toHaveAttribute('data-rest', 'false')
  expect(fullScreenRequests().at(-1)).toBe(false)
})

it('휴식 중 설정 창에서 시간을 바꾸면 작업 장면으로 돌아오고 전체화면을 푼다', async () => {
  render(<Pomodoro />)
  await finishPomodoro()

  act(() => {
    localStorage.setItem('domado_pomodoro_minutes', '30')
    window.dispatchEvent(new StorageEvent('storage', { key: 'domado_pomodoro_minutes' }))
  })

  expect(scene()).toHaveAttribute('data-rest', 'false')
  expect(fullScreenRequests().at(-1)).toBe(false)
  expect(screen.getByLabelText('남은 시간')).toHaveTextContent('30:00')
})

it('휴식 중 언어·불투명도를 바꾸거나 창을 열어도 휴식 장면이 다시 마운트되지 않고 전체화면도 유지된다', async () => {
  const { container } = render(<Pomodoro />)
  await finishPomodoro()
  const mounts = sceneMounts.count
  const requests = fullScreenRequests().length

  act(() => {
    window.dispatchEvent(new StorageEvent('storage', { key: 'domado_language', newValue: 'en' }))
    localStorage.setItem('domado_widget_opacity', '30')
    window.dispatchEvent(new StorageEvent('storage', { key: 'domado_widget_opacity' }))
  })
  fireEvent.click(screen.getByTitle('Settings'))
  fireEvent.click(screen.getByTitle("Today's count"))

  expect(scene()).toHaveAttribute('data-rest', 'true')
  expect(sceneMounts.count).toBe(mounts)
  expect(fullScreenRequests()).toHaveLength(requests)
  expect(container.querySelector('main')).toHaveStyle({ opacity: '1' })
  expect(sendMessage()).toHaveBeenCalledWith('open_window', 'settings')
  expect(sendMessage()).toHaveBeenCalledWith('open_window', 'history')

  act(() => {
    window.dispatchEvent(new StorageEvent('storage', { key: 'domado_language', newValue: 'ko' }))
  })
})

it('일시정지·재생을 오가도 장면은 다시 마운트되지 않는다', async () => {
  render(<Pomodoro />)

  fireEvent.keyDown(document, { key: ' ' })
  await advance(2)
  fireEvent.keyDown(document, { key: ' ' })
  fireEvent.keyDown(document, { key: ' ' })

  expect(scene()).toHaveAttribute('data-paused', 'false')
  expect(sceneMounts.count).toBe(1)
})
