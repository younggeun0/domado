import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, vi } from 'vitest'

import { buildHeatmapWeeks } from '../hooks/pomodoroHistory'
import { getTodayKey, incrementTodayInfo, toDateKey } from '../hooks/todayInfoStorage'
import { setLanguage } from '../i18n'
import History from '../pages/History'
import Pomodoro from '../pages/Pomodoro'
import Settings from '../pages/Settings'

describe('일별 기록', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('날짜 키는 UTC가 아닌 로컬 날짜 기준이다', () => {
    expect(toDateKey(new Date(2026, 0, 5, 0, 30))).toBe('2026-01-05')
  })

  it('히트맵은 오늘이 속한 주를 마지막 열로 하고, 오늘 이후 칸은 비운다', () => {
    const today = new Date(2026, 8, 30) // 수요일
    const weeks = buildHeatmapWeeks(today, 3)

    expect(weeks).toHaveLength(3)
    expect(weeks[0][0]).toBe('2026-09-13') // 2주 전 일요일
    expect(weeks[2]).toEqual(['2026-09-27', '2026-09-28', '2026-09-29', '2026-09-30', null, null, null])
  })

  it('자정이 지나 증가하면 전날 개수에 이어 세지 않고 오늘 1개로 시작한다', () => {
    expect(incrementTodayInfo({ date: '2000-01-01', count: 7 })).toEqual({ date: getTodayKey(), count: 1 })
    expect(incrementTodayInfo({ date: getTodayKey(), count: 7 })).toEqual({ date: getTodayKey(), count: 8 })
  })

  it('오늘 개수를 누르면 기록 창을 연다', async () => {
    render(<Pomodoro />)

    await userEvent.click(screen.getByTitle('오늘의 기록'))

    expect(window.electron?.ipcRenderer.sendMessage).toHaveBeenCalledWith('open_window', 'history')
  })

  it('기록 창에 오늘 개수가 반영된다', () => {
    localStorage.setItem('domado_today_info', JSON.stringify({ count: 3, date: getTodayKey() }))
    render(<History />)

    expect(screen.getByRole('heading', { name: '뽀모도로 기록' })).toBeInTheDocument()
    expect(screen.getByText('총 3개 · 1일')).toBeInTheDocument()
  })
})

describe('설정 창', () => {
  beforeEach(() => {
    vi.spyOn(window, 'close').mockImplementation(() => {})
  })

  afterEach(() => {
    setLanguage('ko')
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('언어를 고르면 저장 없이 바로 문구가 바뀐다', async () => {
    render(<Settings />)

    await userEvent.selectOptions(screen.getByLabelText('언어'), 'en')

    expect(screen.getByRole('heading', { name: 'Pomodoro settings' })).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('en')
    expect(localStorage.getItem('domado_language')).toBe('en')
  })

  it('위젯 창은 다른 창에서 바꾼 언어를 storage 이벤트로 받는다', () => {
    render(<Pomodoro />)

    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'domado_language', newValue: 'en' }))
    })

    expect(screen.getByTitle("Today's count")).toBeInTheDocument()
  })

  it('시간을 바꾸면 경고가 보이고 저장하면 값을 남기고 창을 닫는다', async () => {
    render(<Settings />)

    const pomodoroInput = screen.getByLabelText('뽀모도로 시간 (분)')
    await userEvent.clear(pomodoroInput)
    await userEvent.type(pomodoroInput, '30')

    expect(screen.getByText('시간을 변경하면 현재 진행 중인 뽀모도로 정보가 초기화됩니다.')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: '저장' }))

    expect(localStorage.getItem('domado_pomodoro_minutes')).toBe('30')
    expect(window.close).toHaveBeenCalled()
  })

  it('값을 바꾸지 않고 저장하면 저장소를 건드리지 않아 위젯 타이머가 유지된다', async () => {
    render(<Settings />)

    await userEvent.click(screen.getByRole('button', { name: '저장' }))

    expect(localStorage.getItem('domado_pomodoro_minutes')).toBeNull()
    expect(window.close).toHaveBeenCalled()
  })

  it('유효하지 않은 값은 저장되지 않고 창도 닫히지 않는다', async () => {
    render(<Settings />)

    const pomodoroInput = screen.getByLabelText('뽀모도로 시간 (분)')
    await userEvent.clear(pomodoroInput)
    await userEvent.type(pomodoroInput, '0')
    await userEvent.click(screen.getByRole('button', { name: '저장' }))

    expect(localStorage.getItem('domado_pomodoro_minutes')).toBeNull()
    expect(window.close).not.toHaveBeenCalled()
  })
})
