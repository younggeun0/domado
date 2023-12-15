import dayjs from 'dayjs'
import React, { useEffect, useState } from 'react'
import { CountdownCircleTimer } from 'react-countdown-circle-timer'

export interface PomodoroInfo {
  date: string
  count: number
}

// TODO, 한 사이클 분설정 기능 추가
const { isDebug } = window.electron
const MIN_PER_POMODORO = isDebug ? 0.05 : 25
const MIN_PER_REST = isDebug ? 0.05 : 5
const DURATIONS = [60 * MIN_PER_POMODORO, 60 * MIN_PER_REST] // 웹앱 특성 상 계속 사용하지 않으므로 15분 쉬는건 우선 제외
// const DURATIONS = [5, 3] // for test

interface PomodoroTimerProps {
  todayInfo: PomodoroInfo | null | undefined
  setTodayInfo: React.Dispatch<
    React.SetStateAction<PomodoroInfo | null | undefined>
  >
}

export default function PomodoroTimer({
  todayInfo,
  setTodayInfo,
}: PomodoroTimerProps) {
  const [seq, setSeq] = useState(0)
  const [status, setStatus] = useState<'play' | 'paused' | 'finished'>('paused')
  const isRest = seq === 1

  useEffect(() => {
    if (status === 'finished') {
      if (isRest) window.electron.ipcRenderer.sendMessage('rest_finished')

      setSeq((s) => (s + 1) % 2)
      setStatus('paused')
    }
  }, [status, isRest])

  async function updateOrCreatePomodoro() {
    window.electron.ipcRenderer.sendMessage('post_pomodoro')

    if (todayInfo) {
      setTodayInfo({
        date: todayInfo.date,
        count: todayInfo.count + 1,
      })
    } else {
      setTodayInfo({
        date: dayjs().format('YYYY-MM-DD'),
        count: 1,
      })
    }
  }

  function start() {
    setSeq((s) => (s = 0))
    setStatus('play')
  }

  function adjustTime(sec: number) {
    DURATIONS[seq] += sec
    if (DURATIONS[seq] < 0) {
      DURATIONS[seq] = isDebug ? 3 : 60 * 5
    }
    if (DURATIONS[seq] > 60 * 60) {
      DURATIONS[seq] = isDebug ? 3 : 60 * 25
    }
  }
  return (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          fontSize: '3rem',
          alignItems: 'center',
          marginBottom: '1rem',
        }}
      >
        <svg style={{ position: 'absolute' }}>
          <defs>
            <linearGradient id="pomodoro-timer" x1="1" y1="0" x2="0" y2="0">
              {isRest ? (
                <stop offset="100%" stopColor="#478476" />
              ) : (
                <>
                  <stop offset="5%" stopColor="gold" />
                  <stop offset="95%" stopColor="red" />
                </>
              )}
            </linearGradient>
          </defs>
        </svg>
        <CountdownCircleTimer
          key={seq}
          isPlaying={status === 'play'}
          duration={DURATIONS[seq]}
          colors="url(#pomodoro-timer)"
          onComplete={(_totalElapsedTime) => {
            if (!isRest) updateOrCreatePomodoro()
            setStatus('finished')
          }}
          trailStrokeWidth={30}
          trailColor="#373d47"
          strokeWidth={20}
          size={250}
        >
          {({ remainingTime }) => {
            if (status === 'paused') {
              return (
                <>
                  {isRest && (
                    <span
                      style={{ cursor: 'pointer', marginRight: '1rem' }}
                      onClick={() => {
                        setStatus('play')
                      }}
                    >
                      ☕️
                    </span>
                  )}
                  <span style={{ cursor: 'pointer' }} onClick={start}>
                    🔥
                  </span>
                </>
              )
            }
            // TODO, 브라우저 종료 시 remainingTime을 로컬 스토리지에 백업하고 다시 불러오는 기능
            const minutes = Math.floor(remainingTime / 60)
            const seconds = remainingTime % 60
            return (
              <span
                style={{ cursor: 'pointer' }}
                onClick={() => {setStatus('paused')}}
              >
                {`${minutes}:${seconds}`}
              </span>
            )
          }}
        </CountdownCircleTimer>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div>
          <button type="button" style={{ marginRight: '2px'}} onClick={() => adjustTime(5 * 60)}>+</button>
          <button type="button" style={{ marginLeft: '2px'}} onClick={() => adjustTime(-5 * 60)}>-</button>
        </div>
      </div>
    </>
  )
}
