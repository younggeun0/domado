/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import dayjs from 'dayjs'
import React, { useEffect, useRef, useState } from 'react'
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

interface PomodoroTimerProps {
  todayInfo: PomodoroInfo | null | undefined
  setTodayInfo: React.Dispatch<
    React.SetStateAction<PomodoroInfo | null | undefined>
  >
}

const getStrTowDigitFormat = (num: number) => (num < 10 ? `0${num}` : num)

export default function PomodoroTimer({
  todayInfo,
  setTodayInfo,
}: PomodoroTimerProps) {
  const [seq, setSeq] = useState(0)
  const [status, setStatus] = useState<'play' | 'paused' | 'finished'>('paused')
  const [duration, setDuration] = useState(DURATIONS[seq])
  const leftTime = useRef(DURATIONS[seq])
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

  function resetTime() {
    // key값을 갱신하면 새로운 타이머가 시작됨
    // 참고, https://github.com/vydimitrov/react-countdown-circle-timer/tree/master/packages/web#recipes
    setSeq(seq + 2) // set new seq for restart
    setStatus('paused')
  }

  function addMin(min: number) {
    let newDuration = duration + min * 60
    if (newDuration < 0) {
      newDuration = isDebug ? 3 : 60 * 5
    }
    if (newDuration > 60 * 60) {
      newDuration = isDebug ? 3 : 60 * 25
    }
    setDuration(newDuration)
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
          duration={duration}
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
            leftTime.current = remainingTime

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
                onClick={() => setStatus('paused')}
              >
                {`${minutes}:${getStrTowDigitFormat(seconds)}`}
              </span>
            )
          }}
        </CountdownCircleTimer>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <button
          type="button"
          style={{ marginRight: '2px', height: '29px' }}
          onClick={() => addMin(5)}
        >
          +5 min
        </button>
        <button
          type="button"
          style={{ marginRight: '2px' }}
          onClick={() => resetTime()}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            className="bi bi-arrow-repeat"
            viewBox="0 0 16 16"
          >
            <path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z" />
            <path
              fillRule="evenodd"
              d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3M3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9z"
            />
          </svg>
        </button>
        <button
          type="button"
          style={{ height: '29px' }}
          onClick={() => addMin(-5)}
        >
          -5 min
        </button>
      </div>
    </>
  )
}
