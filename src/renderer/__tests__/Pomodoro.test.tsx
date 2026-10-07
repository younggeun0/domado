import { act, fireEvent, render, screen } from '@testing-library/react'
import { default as userEvent } from '@testing-library/user-event'
import { afterEach, vi } from 'vitest'

import { formatRemainingTime, getTimeInfo } from '../components/pomodoro'
import { getTodayKey } from '../hooks/todayInfoStorage'
import Pomodoro from '../pages/Pomodoro'

describe('Pomodoro', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('정상 렌더여부', () => {
    expect(render(<Pomodoro />)).toBeTruthy()
  })

  it('설정 버튼은 위젯과 별개인 설정 창을 연다', async () => {
    render(<Pomodoro />)

    await userEvent.click(screen.getByTitle('설정'))

    expect(window.domado?.ipc.sendMessage).toHaveBeenCalledWith('open_window', 'settings')
  })

  it('설정 창에서 시간을 바꾸면 진행 중인 타이머가 새 시간으로 초기화되고 오늘 기록은 유지된다', async () => {
    localStorage.setItem('domado_today_info', JSON.stringify({ count: 3, date: getTodayKey() }))

    render(<Pomodoro />)
    const user = userEvent.setup()

    await user.keyboard(' ')
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 1200))
    })
    expect(screen.getByLabelText('남은 시간')).not.toHaveTextContent('25:00')

    // 다른 창에서 localStorage를 바꾸면 이 창에는 storage 이벤트로 전달된다
    act(() => {
      localStorage.setItem('domado_pomodoro_minutes', '30')
      window.dispatchEvent(new StorageEvent('storage', { key: 'domado_pomodoro_minutes' }))
    })

    expect(screen.getByLabelText('남은 시간')).toHaveTextContent(formatRemainingTime(getTimeInfo(30, 5).POMODORO_SEC))
    expect(screen.getByText('🍅 : 3')).toBeInTheDocument()
  })

  it('우하단 손잡이를 끌면 늘어난 만큼의 위젯 크기를 메인 프로세스에 요청한다', () => {
    const { container } = render(<Pomodoro />)
    const handle = container.querySelector('.cursor-nwse-resize') as HTMLElement
    handle.setPointerCapture = vi.fn()

    fireEvent.pointerDown(handle, { pointerId: 1, screenX: 100, screenY: 100 })
    fireEvent.pointerMove(handle, { pointerId: 1, screenX: 150, screenY: 130 })

    expect(window.domado?.ipc.sendMessage).toHaveBeenLastCalledWith(
      'resize_widget',
      window.innerWidth + 50,
      window.innerHeight + 30,
    )
  })

  it('뽀모도로 개수 증가 버튼은 확인 후 오늘의 기록을 증가시킨다', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(<Pomodoro />)

    await userEvent.click(screen.getByRole('button', { name: '뽀모도로 개수 증가' }))

    expect(window.confirm).toHaveBeenCalledWith('오늘의 뽀모도로를 1개 추가할까요?')
    expect(screen.getByText('🍅 : 1')).toBeInTheDocument()
  })

  it('뽀모도로 개수 증가를 취소하면 오늘의 기록을 유지한다', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)

    render(<Pomodoro />)

    await userEvent.click(screen.getByRole('button', { name: '뽀모도로 개수 증가' }))

    expect(screen.getByText('🍅 : 0')).toBeInTheDocument()
  })

  it('대기 중인 휴식 상태가 아니면 휴식 스킵 버튼이 비활성화된다', () => {
    render(<Pomodoro />)

    expect(screen.getByRole('button', { name: '휴식 스킵' })).toBeDisabled()
  })

  it('뽀모도로 타이머 종료 시 휴식아이콘으로 변경되고 남은 시간이 휴식시간으로 변경된다.', async () => {
    vi.useFakeTimers()
    localStorage.setItem('domado_pomodoro_minutes', '1')
    localStorage.setItem('domado_rest_minutes', '2')

    render(<Pomodoro />)

    const timeInfo = getTimeInfo(1, 2)
    const pomodoroTime = formatRemainingTime(timeInfo.POMODORO_SEC)
    const remainingTimeElem = screen.getByLabelText('남은 시간')
    fireEvent.keyDown(document, { key: ' ' })

    // 타이머가 시작되었는지 확인
    expect(remainingTimeElem).toHaveTextContent(pomodoroTime)

    // 타이머가 종료되었는지 확인
    await act(async () => {
      await vi.advanceTimersByTimeAsync((timeInfo.POMODORO_SEC + 1) * 1000)
    })

    expect(screen.getByText(formatRemainingTime(timeInfo.REST_SEC))).toBeInTheDocument()
    expect(screen.getByText('🍅 : 1')).toBeInTheDocument()

    // 메인 프로세스에 완료 알림과 휴식 전체화면을 요청한다
    const { sendMessage } = window.domado!.ipc
    expect(sendMessage).toHaveBeenCalledWith('notify', {
      title: '뽀모도로가 완료되었습니다! 🎉',
      body: '오늘 1개의 뽀모도로를 완료했습니다! 휴식을 취하세요.',
    })
    expect(sendMessage).toHaveBeenLastCalledWith('set_fullscreen', true)
  })
})
